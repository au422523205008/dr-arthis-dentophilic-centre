const { db, runTransaction } = require('../db');
const { logAudit } = require('../middleware/audit');

// ==========================================
// 1. SERVICES CATALOG (Treatments list)
// ==========================================

function getServices(req, res) {
  try {
    const services = db.prepare('SELECT * FROM services WHERE isDeleted = 0 ORDER BY category ASC, name ASC').all();
    return res.json({ success: true, services });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch services catalog' });
  }
}

function createService(req, res) {
  try {
    const { name, category, defaultFee, durationMinutes, description } = req.body;
    if (!name || !defaultFee) {
      return res.status(400).json({ success: false, message: 'Service name and default fee are required' });
    }

    const insert = db.prepare(`
      INSERT INTO services (name, category, defaultFee, durationMinutes, description, isActive, createdAt, updatedAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'), 0)
    `);

    insert.run(name.trim(), category || 'General', parseFloat(defaultFee), parseInt(durationMinutes || 30, 10), description || null);
    const newService = db.prepare('SELECT * FROM services WHERE id = last_insert_rowid()').get();

    logAudit(req, {
      action: 'CREATE',
      entityType: 'SERVICE',
      entityId: newService.id,
      newValues: { name: newService.name, defaultFee: newService.defaultFee }
    });

    return res.status(201).json({ success: true, message: 'Treatment service added successfully', service: newService });
  } catch (err) {
    console.error('Error adding service:', err);
    return res.status(500).json({ success: false, message: 'Failed to add service' });
  }
}

function updateService(req, res) {
  try {
    const { id } = req.params;
    const { name, category, defaultFee, durationMinutes, description, isActive } = req.body;

    const current = db.prepare('SELECT * FROM services WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    db.prepare(`
      UPDATE services 
      SET name = COALESCE(?, name), category = COALESCE(?, category),
          defaultFee = COALESCE(?, defaultFee), durationMinutes = COALESCE(?, durationMinutes),
          description = COALESCE(?, description), isActive = COALESCE(?, isActive),
          updatedAt = datetime('now')
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      category || null,
      defaultFee !== undefined ? parseFloat(defaultFee) : null,
      durationMinutes ? parseInt(durationMinutes, 10) : null,
      description !== undefined ? description : null,
      isActive !== undefined ? (isActive ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

    logAudit(req, {
      action: 'UPDATE',
      entityType: 'SERVICE',
      entityId: id,
      oldValues: { defaultFee: current.defaultFee, name: current.name },
      newValues: { defaultFee: updated.defaultFee, name: updated.name }
    });

    return res.json({ success: true, message: 'Treatment service updated', service: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update service' });
  }
}

function deleteService(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM services WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    db.prepare(`
      UPDATE services 
      SET isDeleted = 1, deletedAt = datetime('now'), deletedBy = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(req.user.id, id);

    logAudit(req, { action: 'SOFT_DELETE', entityType: 'SERVICE', entityId: id, oldValues: { name: current.name } });
    return res.json({ success: true, message: `Service ${current.name} moved to Recycle Bin` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete service' });
  }
}

// ==========================================
// 2. TREATMENT RECORDS / VISIT NOTES
// ==========================================

function getTreatmentRecords(req, res) {
  try {
    const { patientId, appointmentId } = req.query;
    let sql = `
      SELECT t.*, p.name as patientName, p.patientId as formattedPatientId, u.name as doctorName
      FROM treatment_records t
      LEFT JOIN patients p ON t.patientId = p.id
      LEFT JOIN users u ON t.treatedBy = u.id
      WHERE t.isDeleted = 0
    `;
    const params = [];

    if (patientId) {
      sql += ' AND t.patientId = ?';
      params.push(patientId);
    }
    if (appointmentId) {
      sql += ' AND t.appointmentId = ?';
      params.push(appointmentId);
    }

    sql += ' ORDER BY t.createdAt DESC';
    const records = db.prepare(sql).all(...params);

    return res.json({ success: true, records });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve treatment records' });
  }
}

function createTreatmentRecord(req, res) {
  try {
    const { patientId, appointmentId, serviceId, serviceName, toothNumber, diagnosis, procedureDone, clinicalNotes, fee, followUpDate } = req.body;

    if (!patientId || !serviceName || !diagnosis || !procedureDone) {
      return res.status(400).json({ success: false, message: 'Patient, procedure name, diagnosis, and procedure details are required.' });
    }

    const patient = db.prepare('SELECT id, name FROM patients WHERE id = ? AND isDeleted = 0').get(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient record not found' });
    }

    let recordId;
    runTransaction(() => {
      const now = new Date().toISOString();

      const insert = db.prepare(`
        INSERT INTO treatment_records (
          patientId, appointmentId, serviceId, serviceName, toothNumber,
          diagnosis, procedureDone, clinicalNotes, fee, followUpDate,
          treatedBy, createdAt, updatedAt, isDeleted
        ) VALUES (
          @patientId, @appointmentId, @serviceId, @serviceName, @toothNumber,
          @diagnosis, @procedureDone, @clinicalNotes, @fee, @followUpDate,
          @treatedBy, @now, @now, 0
        )
      `);

      insert.run({
        patientId,
        appointmentId: appointmentId || null,
        serviceId: serviceId || null,
        serviceName: serviceName.trim(),
        toothNumber: toothNumber ? String(toothNumber).trim() : null,
        diagnosis: diagnosis.trim(),
        procedureDone: procedureDone.trim(),
        clinicalNotes: clinicalNotes ? clinicalNotes.trim() : null,
        fee: fee ? parseFloat(fee) : 0,
        followUpDate: followUpDate || null,
        treatedBy: req.user.id,
        now
      });

      recordId = db.prepare('SELECT last_insert_rowid() as id').get().id;

      // If follow-up date is specified, automatically generate a follow-up reminder!
      if (followUpDate) {
        db.prepare(`
          INSERT INTO follow_ups (
            patientId, appointmentId, dueDate, reason, status, createdAt, updatedAt, isDeleted
          ) VALUES (
            @patientId, @appointmentId, @dueDate, @reason, 'Pending', @now, @now, 0
          )
        `).run({
          patientId,
          appointmentId: appointmentId || null,
          dueDate: followUpDate,
          reason: `Post-${serviceName} Clinical Follow-up`,
          now
        });
      }

      // If toothNumber provided, update dental chart entry as well
      if (toothNumber && /^\d+$/.test(toothNumber)) {
        const toothInt = parseInt(toothNumber, 10);
        db.prepare(`
          INSERT INTO dental_chart_entries (patientId, toothNumber, condition, notes, updatedAt)
          VALUES (?, ?, 'Treated', ?, datetime('now'))
          ON CONFLICT(patientId, toothNumber) DO UPDATE SET
            condition = 'Treated', notes = ?, updatedAt = datetime('now')
        `).run(patientId, toothInt, `${procedureDone} (${diagnosis})`, `${procedureDone} (${diagnosis})`);
      }
    });

    const newRecord = db.prepare('SELECT * FROM treatment_records WHERE id = ?').get(recordId);

    logAudit(req, {
      action: 'CREATE',
      entityType: 'TREATMENT_RECORD',
      entityId: recordId,
      newValues: { patientId, serviceName, diagnosis, fee }
    });

    return res.status(201).json({
      success: true,
      message: 'Treatment record logged successfully',
      record: newRecord
    });
  } catch (err) {
    console.error('Error logging treatment record:', err);
    return res.status(500).json({ success: false, message: 'Failed to save treatment record' });
  }
}

function deleteTreatmentRecord(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM treatment_records WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Treatment record not found' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE treatment_records SET isDeleted = 1, deletedAt = ?, deletedBy = ? WHERE id = ?').run(now, req.user.id, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'TREATMENT_RECORD',
      entityId: id,
      oldValues: { patientId: current.patientId, procedureDone: current.procedureDone }
    });

    return res.json({ success: true, message: 'Treatment record moved to Recycle Bin' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete treatment record' });
  }
}

module.exports = {
  getServices,
  createService,
  updateService,
  deleteService,
  getTreatmentRecords,
  createTreatmentRecord,
  deleteTreatmentRecord
};

