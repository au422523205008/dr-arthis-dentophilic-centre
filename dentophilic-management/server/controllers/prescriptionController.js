const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

function generatePrescriptionNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `RX-${year}-${randomSuffix}`;
}

function getPrescriptions(req, res) {
  try {
    const { patientId, appointmentId } = req.query;
    let sql = `
      SELECT rx.*, p.name as patientName, p.patientId as formattedPatientId, p.age, p.gender, p.phone
      FROM prescriptions rx
      LEFT JOIN patients p ON rx.patientId = p.id
      WHERE rx.isDeleted = 0
    `;
    const params = [];

    if (patientId) {
      sql += ' AND rx.patientId = ?';
      params.push(patientId);
    }
    if (appointmentId) {
      sql += ' AND rx.appointmentId = ?';
      params.push(appointmentId);
    }

    sql += ' ORDER BY rx.createdAt DESC';
    const prescriptions = db.prepare(sql).all(...params);

    const formatted = prescriptions.map((p) => ({
      ...p,
      items: typeof p.items === 'string' ? JSON.parse(p.items) : p.items
    }));

    return res.json({ success: true, prescriptions: formatted });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch prescriptions' });
  }
}

function getPrescriptionById(req, res) {
  try {
    const { id } = req.params;
    const rx = db.prepare(`
      SELECT rx.*, p.name as patientName, p.patientId as formattedPatientId, p.age, p.gender, p.phone, p.allergies
      FROM prescriptions rx
      LEFT JOIN patients p ON rx.patientId = p.id
      WHERE rx.id = ? AND rx.isDeleted = 0
    `).get(id);

    if (!rx) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const clinicSettingsRows = db.prepare('SELECT key, value FROM clinic_settings').all();
    const settings = {};
    clinicSettingsRows.forEach(r => { settings[r.key] = r.value; });

    return res.json({
      success: true,
      prescription: {
        ...rx,
        items: typeof rx.items === 'string' ? JSON.parse(rx.items) : rx.items
      },
      clinicLetterhead: {
        clinicName: settings.clinic_name || "Dr. Arthi's Dentophilic Centre",
        doctorName: settings.doctor_name || "Dr. Arthi Mukeshkannan",
        doctorQualification: settings.doctor_qualification || "B.D.S, General Dental Surgeon, Chief Dentist",
        tndcRegNo: settings.tndc_reg_no || "31263",
        phone: settings.phone || "+91 95971 26248",
        email: settings.email || "drarthidentophilic@gmail.com",
        address: settings.address || "1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Hosur - 635109"
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve prescription details' });
  }
}

function createPrescription(req, res) {
  try {
    const { patientId, appointmentId, treatmentRecordId, items, generalAdvice } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient selection and at least one medicine item are required.' });
    }

    const patient = db.prepare('SELECT id, name FROM patients WHERE id = ? AND isDeleted = 0').get(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    const prescriptionNumber = generatePrescriptionNumber();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO prescriptions (
        prescriptionNumber, patientId, appointmentId, treatmentRecordId,
        doctorName, doctorRegNo, items, generalAdvice,
        createdAt, updatedAt, isDeleted
      ) VALUES (
        @prescriptionNumber, @patientId, @appointmentId, @treatmentRecordId,
        'Dr. Arthi Mukeshkannan, B.D.S', '31263', @itemsJson, @generalAdvice,
        @now, @now, 0
      )
    `);

    insert.run({
      prescriptionNumber,
      patientId,
      appointmentId: appointmentId || null,
      treatmentRecordId: treatmentRecordId || null,
      itemsJson: JSON.stringify(items),
      generalAdvice: generalAdvice ? generalAdvice.trim() : null,
      now
    });

    const newRx = db.prepare('SELECT * FROM prescriptions WHERE prescriptionNumber = ?').get(prescriptionNumber);

    logAudit(req, {
      action: 'CREATE',
      entityType: 'PRESCRIPTION',
      entityId: newRx.id,
      newValues: { prescriptionNumber, patientId, itemCount: items.length }
    });

    return res.status(201).json({
      success: true,
      message: `Prescription ${prescriptionNumber} generated successfully`,
      prescription: {
        ...newRx,
      }
    });
  } catch (err) {
    console.error('Error creating prescription:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate prescription' });
  }
}

function deletePrescription(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM prescriptions WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Prescription not found' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE prescriptions SET isDeleted = 1, deletedAt = ?, deletedBy = ? WHERE id = ?').run(now, req.user.id, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'PRESCRIPTION',
      entityId: id,
      oldValues: { prescriptionNumber: current.prescriptionNumber }
    });

    return res.json({ success: true, message: 'Prescription moved to Recycle Bin' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete prescription' });
  }
}

module.exports = {
  getPrescriptions,
  getPrescriptionById,
  createPrescription,
  deletePrescription
};

