const { db, runTransaction } = require('../db');
const { logAudit } = require('../middleware/audit');

function sanitizePhone(phoneStr) {
  if (!phoneStr) return '';
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function generateNextPatientId() {
  const lastPatient = db.prepare(`
    SELECT patientId FROM patients ORDER BY id DESC LIMIT 1
  `).get();

  let nextNum = 1;
  if (lastPatient && lastPatient.patientId) {
    const match = String(lastPatient.patientId).match(/(\d+)$/);
    if (match) {
      const parsed = parseInt(match[1], 10);
      if (!isNaN(parsed)) nextNum = parsed + 1;
    }
  }
  return `P-${String(nextNum).padStart(3, '0')}`;
}

/**
 * List patients with search & pagination
 */
function getPatients(req, res) {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    let sql = 'SELECT * FROM patients WHERE isDeleted = 0';
    const params = [];

    if (search && search.trim()) {
      sql += ' AND (name LIKE ? OR phone LIKE ? OR patientId LIKE ? OR email LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s, s);
    }

    sql += ' ORDER BY id DESC';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const patients = db.prepare(paginatedSql).all(...params, parseInt(limit, 10), offset);

    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countRow = db.prepare(countSql).get(...params);

    return res.json({
      success: true,
      total: countRow ? countRow.total : patients.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      patients
    });
  } catch (err) {
    console.error('Error fetching patients:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving patients' });
  }
}

/**
 * Get patient profile with complete historical timeline
 */
function getPatientProfile(req, res) {
  try {
    const { id } = req.params;

    const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND isDeleted = 0').get(id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    // 1. Appointments history
    const appointments = db.prepare(`
      SELECT * FROM appointments 
      WHERE patientId = ? AND isDeleted = 0 
      ORDER BY date DESC, timeSlot DESC
    `).all(id);

    // 2. Treatment records & clinical notes
    const treatments = db.prepare(`
      SELECT t.*, u.name as doctorName 
      FROM treatment_records t
      LEFT JOIN users u ON t.treatedBy = u.id
      WHERE t.patientId = ? AND t.isDeleted = 0
      ORDER BY t.createdAt DESC
    `).all(id);

    // 3. Prescriptions
    const prescriptions = db.prepare(`
      SELECT * FROM prescriptions 
      WHERE patientId = ? AND isDeleted = 0 
      ORDER BY createdAt DESC
    `).all(id);

    // 4. Invoices & Bills
    const invoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE patientId = ? AND isDeleted = 0 
      ORDER BY createdAt DESC
    `).all(id);

    // 5. Payments
    const payments = db.prepare(`
      SELECT p.*, i.invoiceNumber 
      FROM payments p
      LEFT JOIN invoices i ON p.invoiceId = i.id
      WHERE p.patientId = ? AND p.isDeleted = 0
      ORDER BY p.createdAt DESC
    `).all(id);

    // 6. Dental Chart Entries
    const dentalChart = db.prepare(`
      SELECT * FROM dental_chart_entries 
      WHERE patientId = ? 
      ORDER BY toothNumber ASC
    `).all(id);

    // 7. Follow-ups
    const followUps = db.prepare(`
      SELECT * FROM follow_ups 
      WHERE patientId = ? AND isDeleted = 0 
      ORDER BY dueDate ASC
    `).all(id);

    return res.json({
      success: true,
      patient,
      timeline: {
        appointments,
        treatments,
        prescriptions,
        invoices,
        payments,
        dentalChart,
        followUps
      }
    });
  } catch (err) {
    console.error('Error fetching patient profile:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving patient profile' });
  }
}

/**
 * Register a new patient
 */
function createPatient(req, res) {
  try {
    const {
      name, age, dob, gender, phone, email, address,
      bloodGroup, allergies, medicalHistory, emergencyContact, notes, photoUrl
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Patient name is required' });
    }

    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit phone number is required' });
    }

    // Check duplicate by phone
    const existing = db.prepare('SELECT id, patientId, name FROM patients WHERE phone = ? AND isDeleted = 0').get(cleanPhone);
    if (existing) {
      return res.status(409).json({
        success: false,
        duplicateFound: true,
        existingPatient: existing,
        message: `A patient with phone ${cleanPhone} already exists (${existing.name} - ${existing.patientId}).`
      });
    }

    const patientId = generateNextPatientId();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO patients (
        patientId, name, age, dob, gender, phone, email, address,
        bloodGroup, allergies, medicalHistory, emergencyContact, notes, photoUrl,
        createdAt, updatedAt, isDeleted
      ) VALUES (
        @patientId, @name, @age, @dob, @gender, @phone, @email, @address,
        @bloodGroup, @allergies, @medicalHistory, @emergencyContact, @notes, @photoUrl,
        @now, @now, 0
      )
    `);

    insertStmt.run({
      patientId,
      name: name.trim(),
      age: age ? parseInt(age, 10) : null,
      dob: dob || null,
      gender: gender || 'Not Specified',
      phone: cleanPhone,
      email: email ? email.trim() : null,
      address: address ? address.trim() : null,
      bloodGroup: bloodGroup || null,
      allergies: allergies ? allergies.trim() : null,
      medicalHistory: medicalHistory ? medicalHistory.trim() : null,
      emergencyContact: emergencyContact ? emergencyContact.trim() : null,
      notes: notes ? notes.trim() : null,
      photoUrl: photoUrl || null,
      now
    });

    const newPatient = db.prepare('SELECT * FROM patients WHERE patientId = ?').get(patientId);

    // If there were any unlinked appointments with this phone, link them now!
    db.prepare(`
      UPDATE appointments SET patientId = ? WHERE phone = ? AND (patientId IS NULL OR patientId = 0)
    `).run(newPatient.id, cleanPhone);

    logAudit(req, {
      action: 'CREATE',
      entityType: 'PATIENT',
      entityId: newPatient.id,
      newValues: { patientId, name, phone: cleanPhone }
    });

    return res.status(201).json({
      success: true,
      message: `Patient ${name} registered successfully with ID ${patientId}`,
      patient: newPatient
    });
  } catch (err) {
    console.error('Error creating patient:', err);
    return res.status(500).json({ success: false, message: 'Failed to register patient' });
  }
}

/**
 * Update patient profile
 */
function updatePatient(req, res) {
  try {
    const { id } = req.params;
    const {
      name, age, dob, gender, phone, email, address,
      bloodGroup, allergies, medicalHistory, emergencyContact, notes, photoUrl
    } = req.body;

    const current = db.prepare('SELECT * FROM patients WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const cleanPhone = phone ? sanitizePhone(phone) : current.phone;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE patients 
      SET name = COALESCE(?, name), age = COALESCE(?, age), dob = COALESCE(?, dob),
          gender = COALESCE(?, gender), phone = ?, email = ?, address = ?,
          bloodGroup = ?, allergies = ?, medicalHistory = ?, emergencyContact = ?,
          notes = ?, photoUrl = COALESCE(?, photoUrl), updatedAt = ?
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      age !== undefined ? (age ? parseInt(age, 10) : null) : current.age,
      dob || null,
      gender || null,
      cleanPhone,
      email ? email.trim() : null,
      address ? address.trim() : null,
      bloodGroup || null,
      allergies || null,
      medicalHistory || null,
      emergencyContact || null,
      notes || null,
      photoUrl || null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM patients WHERE id = ?').get(id);

    logAudit(req, {
      action: 'UPDATE',
      entityType: 'PATIENT',
      entityId: id,
      oldValues: { name: current.name, phone: current.phone },
      newValues: { name: updated.name, phone: updated.phone }
    });

    return res.json({
      success: true,
      message: `Patient ${updated.name} updated successfully`,
      patient: updated
    });
  } catch (err) {
    console.error('Error updating patient:', err);
    return res.status(500).json({ success: false, message: 'Failed to update patient profile' });
  }
}

/**
 * Soft delete patient (ADMIN ONLY)
 */
function deletePatient(req, res) {
  try {
    const { id } = req.params;
    const patient = db.prepare('SELECT * FROM patients WHERE id = ? AND isDeleted = 0').get(id);

    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE patients 
      SET isDeleted = 1, deletedAt = ?, deletedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, req.user.id, now, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'PATIENT',
      entityId: id,
      oldValues: { patientId: patient.patientId, name: patient.name }
    });

    return res.json({
      success: true,
      message: `Patient ${patient.name} (${patient.patientId}) moved to Recycle Bin.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete patient' });
  }
}

/**
 * Merge two duplicate patient records (ADMIN ONLY)
 */
function mergePatients(req, res) {
  try {
    const { sourcePatientId, targetPatientId } = req.body;

    if (!sourcePatientId || !targetPatientId || sourcePatientId === targetPatientId) {
      return res.status(400).json({ success: false, message: 'Source and target patient IDs must be valid and distinct' });
    }

    const source = db.prepare('SELECT * FROM patients WHERE id = ? AND isDeleted = 0').get(sourcePatientId);
    const target = db.prepare('SELECT * FROM patients WHERE id = ? AND isDeleted = 0').get(targetPatientId);

    if (!source || !target) {
      return res.status(404).json({ success: false, message: 'One or both patient records not found' });
    }

    runTransaction(() => {
      // Re-point appointments, treatments, prescriptions, invoices, payments, dental charts, follow-ups
      db.prepare('UPDATE appointments SET patientId = ? WHERE patientId = ?').run(target.id, source.id);
      db.prepare('UPDATE treatment_records SET patientId = ? WHERE patientId = ?').run(target.id, source.id);
      db.prepare('UPDATE prescriptions SET patientId = ? WHERE patientId = ?').run(target.id, source.id);
      db.prepare('UPDATE invoices SET patientId = ? WHERE patientId = ?').run(target.id, source.id);
      db.prepare('UPDATE payments SET patientId = ? WHERE patientId = ?').run(target.id, source.id);
      db.prepare('UPDATE follow_ups SET patientId = ? WHERE patientId = ?').run(target.id, source.id);

      // Soft delete source record
      const now = new Date().toISOString();
      db.prepare(`
        UPDATE patients 
        SET isDeleted = 1, deletedAt = ?, deletedBy = ?, notes = notes || ' [Merged into ' || ? || ']'
        WHERE id = ?
      `).run(now, req.user.id, target.patientId, source.id);

      logAudit(req, {
        action: 'MERGE_PATIENTS',
        entityType: 'PATIENT',
        entityId: target.id,
        newValues: { mergedFrom: source.patientId, targetPatient: target.patientId }
      });
    });

    return res.json({
      success: true,
      message: `Successfully merged records from ${source.name} (${source.patientId}) into ${target.name} (${target.patientId}).`
    });
  } catch (err) {
    console.error('Error merging patients:', err);
    return res.status(500).json({ success: false, message: 'Failed to merge patient records' });
  }
}

module.exports = {
  getPatients,
  getPatientProfile,
  createPatient,
  updatePatient,
  deletePatient,
  mergePatients
};
