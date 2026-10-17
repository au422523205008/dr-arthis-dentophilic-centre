const { db, runTransaction } = require('./index');

function runMigrations() {
  console.log('[Migration] Verifying schema and running migrations...');

  runTransaction(() => {
    // 1. Schema version tracker
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_versions (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        appliedAt TEXT NOT NULL
      );
    `);

    // 2. Users & Staff Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('ADMIN', 'ATTENDER')),
        status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISABLED')),
        failedLoginAttempts INTEGER DEFAULT 0,
        lockedUntil TEXT,
        lastLoginAt TEXT,
        permissions TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // 3. Patients Table (EMR)
    db.exec(`
      CREATE TABLE IF NOT EXISTS patients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        dob TEXT,
        gender TEXT CHECK(gender IN ('Male', 'Female', 'Other', 'Not Specified')),
        phone TEXT NOT NULL,
        email TEXT,
        address TEXT,
        bloodGroup TEXT,
        allergies TEXT,
        medicalHistory TEXT,
        emergencyContact TEXT,
        notes TEXT,
        photoUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_patients_patientId ON patients(patientId);
      CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
      CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(name);
      CREATE INDEX IF NOT EXISTS idx_patients_isDeleted ON patients(isDeleted);
    `);

    // 4. Appointments Table (Shared with Website, Unified)
    db.exec(`
      CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        referenceId TEXT UNIQUE NOT NULL,
        patientId INTEGER REFERENCES patients(id),
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        age INTEGER,
        gender TEXT,
        service TEXT NOT NULL,
        date TEXT NOT NULL,
        timeSlot TEXT NOT NULL,
        source TEXT DEFAULT 'Walk-in / Phone / Offline' CHECK(source IN ('Website', 'Walk-in / Phone / Offline')),
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Confirmed', 'Arrived', 'In Treatment', 'Completed', 'Cancelled', 'No-show')),
        cancelReason TEXT,
        message TEXT,
        doctorNotes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
    `);

    // Ensure columns exist on appointments if upgrading older database
    const appointmentCols = db.prepare("PRAGMA table_info(appointments);").all().map(c => c.name);
    if (!appointmentCols.includes('patientId')) {
      db.exec('ALTER TABLE appointments ADD COLUMN patientId INTEGER REFERENCES patients(id);');
    }
    if (!appointmentCols.includes('source')) {
      db.exec("ALTER TABLE appointments ADD COLUMN source TEXT DEFAULT 'Walk-in / Phone / Offline';");
    }
    if (!appointmentCols.includes('cancelReason')) {
      db.exec('ALTER TABLE appointments ADD COLUMN cancelReason TEXT;');
    }
    if (!appointmentCols.includes('doctorNotes')) {
      db.exec('ALTER TABLE appointments ADD COLUMN doctorNotes TEXT;');
    }
    if (!appointmentCols.includes('isDeleted')) {
      db.exec('ALTER TABLE appointments ADD COLUMN isDeleted INTEGER DEFAULT 0;');
    }
    if (!appointmentCols.includes('deletedAt')) {
      db.exec('ALTER TABLE appointments ADD COLUMN deletedAt TEXT;');
    }
    if (!appointmentCols.includes('deletedBy')) {
      db.exec('ALTER TABLE appointments ADD COLUMN deletedBy INTEGER;');
    }

    // Now safely create indexes on appointments
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_active_appointment_slot 
      ON appointments(date, timeSlot) 
      WHERE status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL);
      CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);
      CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
      CREATE INDEX IF NOT EXISTS idx_appointments_phone ON appointments(phone);
      CREATE INDEX IF NOT EXISTS idx_appointments_patientId ON appointments(patientId);
    `);

    // 5. Treatments / Services Catalog
    db.exec(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        category TEXT,
        defaultFee REAL NOT NULL,
        durationMinutes INTEGER DEFAULT 30,
        description TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
    `);

    // 6. Treatment Records / Visit Notes
    db.exec(`
      CREATE TABLE IF NOT EXISTS treatment_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL REFERENCES patients(id),
        appointmentId INTEGER REFERENCES appointments(id),
        serviceId INTEGER REFERENCES services(id),
        serviceName TEXT NOT NULL,
        toothNumber TEXT,
        diagnosis TEXT NOT NULL,
        procedureDone TEXT NOT NULL,
        clinicalNotes TEXT,
        fee REAL NOT NULL DEFAULT 0,
        followUpDate TEXT,
        treatedBy INTEGER REFERENCES users(id),
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_records_patientId ON treatment_records(patientId);
      CREATE INDEX IF NOT EXISTS idx_records_appointmentId ON treatment_records(appointmentId);
    `);

    // 7. Prescriptions
    db.exec(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prescriptionNumber TEXT UNIQUE NOT NULL,
        patientId INTEGER NOT NULL REFERENCES patients(id),
        appointmentId INTEGER REFERENCES appointments(id),
        treatmentRecordId INTEGER REFERENCES treatment_records(id),
        doctorName TEXT DEFAULT 'Dr. Arthi Mukeshkannan, B.D.S',
        doctorRegNo TEXT DEFAULT '31263',
        items TEXT NOT NULL, -- JSON array of medicine items
        generalAdvice TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_prescriptions_patientId ON prescriptions(patientId);
      CREATE INDEX IF NOT EXISTS idx_prescriptions_number ON prescriptions(prescriptionNumber);
    `);

    // 8. Invoices & Billing
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoiceNumber TEXT UNIQUE NOT NULL,
        patientId INTEGER NOT NULL REFERENCES patients(id),
        appointmentId INTEGER REFERENCES appointments(id),
        items TEXT NOT NULL, -- JSON array of line items
        subtotal REAL NOT NULL,
        discount REAL DEFAULT 0,
        taxRate REAL DEFAULT 0,
        taxAmount REAL DEFAULT 0,
        totalAmount REAL NOT NULL,
        paidAmount REAL DEFAULT 0,
        balanceDue REAL NOT NULL,
        status TEXT DEFAULT 'Unpaid' CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Refunded')),
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_patientId ON invoices(patientId);
      CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoiceNumber);
      CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
    `);

    // 9. Payments (Receipts)
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        receiptNumber TEXT UNIQUE NOT NULL,
        invoiceId INTEGER NOT NULL REFERENCES invoices(id),
        patientId INTEGER NOT NULL REFERENCES patients(id),
        amount REAL NOT NULL,
        paymentMode TEXT NOT NULL CHECK(paymentMode IN ('Cash', 'UPI', 'Card', 'Bank Transfer')),
        transactionReference TEXT,
        notes TEXT,
        receivedBy INTEGER REFERENCES users(id),
        createdAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_payments_invoiceId ON payments(invoiceId);
      CREATE INDEX IF NOT EXISTS idx_payments_patientId ON payments(patientId);
    `);

    // 10. Dental Chart Entries
    db.exec(`
      CREATE TABLE IF NOT EXISTS dental_chart_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL REFERENCES patients(id),
        toothNumber INTEGER NOT NULL,
        condition TEXT NOT NULL,
        surface TEXT,
        notes TEXT,
        updatedAt TEXT NOT NULL,
        UNIQUE(patientId, toothNumber)
      );
      CREATE INDEX IF NOT EXISTS idx_dental_chart_patient ON dental_chart_entries(patientId);
    `);

    // 11. Inventory Management
    db.exec(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        currentStock INTEGER NOT NULL DEFAULT 0,
        minThreshold INTEGER NOT NULL DEFAULT 5,
        unit TEXT DEFAULT 'units',
        supplier TEXT,
        unitCost REAL DEFAULT 0,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );

      CREATE TABLE IF NOT EXISTS inventory_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        itemId INTEGER NOT NULL REFERENCES inventory_items(id),
        changeType TEXT NOT NULL CHECK(changeType IN ('RESTOCK', 'USED', 'ADJUSTMENT', 'WASTAGE')),
        quantity INTEGER NOT NULL,
        notes TEXT,
        loggedBy INTEGER REFERENCES users(id),
        createdAt TEXT NOT NULL
      );
    `);

    // 12. Expenses (Admin only)
    db.exec(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL CHECK(category IN ('Rent', 'Supplies', 'Equipment', 'Utilities', 'Salary', 'Maintenance', 'Lab Charges', 'Other')),
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        expenseDate TEXT NOT NULL,
        paymentMode TEXT,
        receiptUrl TEXT,
        recordedBy INTEGER REFERENCES users(id),
        createdAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expenseDate);
    `);

    // 13. Follow-ups & Recalls
    db.exec(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        patientId INTEGER NOT NULL REFERENCES patients(id),
        appointmentId INTEGER REFERENCES appointments(id),
        dueDate TEXT NOT NULL,
        reason TEXT NOT NULL,
        status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Contacted', 'Scheduled', 'Dismissed')),
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        isDeleted INTEGER DEFAULT 0,
        deletedAt TEXT,
        deletedBy INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_follow_ups_dueDate ON follow_ups(dueDate);
      CREATE INDEX IF NOT EXISTS idx_follow_ups_patientId ON follow_ups(patientId);
    `);

    // 14. Immutable Audit Logs
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        entityType TEXT NOT NULL,
        entityId TEXT,
        userId INTEGER,
        userName TEXT,
        userRole TEXT,
        oldValues TEXT,
        newValues TEXT,
        ipAddress TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entityType, entityId);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(createdAt);
    `);

    // 15. Clinic Settings Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS clinic_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );
    `);

    // 16. Password Resets & OTP Table
    db.exec(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL REFERENCES users(id),
        username TEXT NOT NULL,
        targetEmail TEXT NOT NULL,
        otpCode TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        usedAt TEXT,
        ipAddress TEXT,
        createdAt TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(userId);
      CREATE INDEX IF NOT EXISTS idx_password_resets_otp ON password_resets(username, otpCode);
    `);

    // Populate default services catalog if empty (matches website treatments)
    const svcCount = db.prepare('SELECT COUNT(*) as count FROM services').get();
    if (svcCount.count === 0) {
      const defaultServices = [
        { name: 'General Dental Checkup & Digital X-Ray', category: 'Preventative', defaultFee: 500, duration: 30, desc: 'Complete oral cavity inspection with high-res digital radiographs' },
        { name: 'Teeth Cleaning & Ultrasonic Scaling', category: 'Hygiene', defaultFee: 1200, duration: 45, desc: 'Ultrasonic removal of tartar, calculus, and plaque followed by polishing' },
        { name: 'Advanced Laser Teeth Whitening', category: 'Cosmetic', defaultFee: 6500, duration: 60, desc: 'In-chair laser brightening up to 6-8 shades lighter' },
        { name: 'Single-Sitting Painless Root Canal (RCT)', category: 'Endodontics', defaultFee: 4500, duration: 60, desc: 'Rotary endodontics with precision apex locator disinfection and hermetic seal' },
        { name: 'Permanent Dental Implants', category: 'Restoration', defaultFee: 25000, duration: 60, desc: 'Biocompatible titanium root with ceramic crown restoration' },
        { name: 'Braces & Invisible Clear Aligners', category: 'Orthodontics', defaultFee: 35000, duration: 45, desc: 'Aesthetic ceramic braces or custom 3D clear invisible aligners' },
        { name: 'Cosmetic Dentistry & Smile Design', category: 'Cosmetic', defaultFee: 12000, duration: 60, desc: 'Veneers, composite bonding, and digital smile esthetics' },
        { name: 'Pediatric Dentistry (Gentle Kids Care)', category: 'Pediatric', defaultFee: 800, duration: 30, desc: 'Gentle cavity prevention, fluoride treatments, and space maintainers' },
        { name: 'Wisdom Tooth & Surgical Extraction', category: 'Oral Surgery', defaultFee: 3000, duration: 45, desc: 'Atraumatic surgical extraction under gentle anesthesia' },
        { name: 'Zirconia Crowns, Bridges & Dentures', category: 'Restorative', defaultFee: 8500, duration: 45, desc: 'Metal-free monolithic Zirconia and CAD/CAM ceramic crowns' }
      ];

      const insertSvc = db.prepare(`
        INSERT INTO services (name, category, defaultFee, durationMinutes, description, isActive, createdAt, updatedAt)
        VALUES (@name, @category, @defaultFee, @duration, @desc, 1, datetime('now'), datetime('now'))
      `);

      for (const s of defaultServices) {
        insertSvc.run(s);
      }
      console.log('[Migration] Seeded default treatments & services catalog.');
    }

    // Populate initial clinic settings if empty
    const settingsCount = db.prepare('SELECT COUNT(*) as count FROM clinic_settings').get();
    if (settingsCount.count === 0) {
      const defaultSettings = [
        { key: 'clinic_name', value: "Dr. Arthi's Dentophilic Centre" },
        { key: 'doctor_name', value: "Dr. Arthi Mukeshkannan" },
        { key: 'doctor_qualification', value: "B.D.S, General Dental Surgeon, Chief Dentist" },
        { key: 'tndc_reg_no', value: "31263" },
        { key: 'phone', value: "+91 95971 26248" },
        { key: 'email', value: "drarthidentophilic@gmail.com" },
        { key: 'address', value: "1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Hosur - 635109, Tamil Nadu" },
        { key: 'slot_duration', value: "30" },
        { key: 'gst_rate', value: "0" },
        { key: 'invoice_footer', value: "Thank you for choosing Dr. Arthi's Dentophilic Centre. Brush twice daily and visit every 6 months for a healthy smile!" }
      ];

      const insertSetting = db.prepare(`
        INSERT INTO clinic_settings (key, value, updatedAt)
        VALUES (@key, @value, datetime('now'))
      `);

      for (const st of defaultSettings) {
        insertSetting.run(st);
      }
      console.log('[Migration] Seeded default clinic settings.');
    }

    // Record schema migration
    db.prepare(`
      INSERT OR REPLACE INTO schema_versions (version, name, appliedAt)
      VALUES (1, 'initial_clinic_management_schema_v1', datetime('now'))
    `).run();

    console.log('[Migration] Schema migration complete.');
  });
}

module.exports = { runMigrations };
