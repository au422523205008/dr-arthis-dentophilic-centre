const { db, runTransaction } = require('../db');
const { logAudit } = require('../middleware/audit');

function sanitizePhone(phoneStr) {
  if (!phoneStr) return '';
  const digits = phoneStr.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
}

function generateReferenceId() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DEN-${year}-${randomSuffix}`;
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
 * List appointments with rich filters, search, and pagination
 */
function getAppointments(req, res) {
  try {
    const { date, status, source, search, startDate, endDate, page = 1, limit = 50 } = req.query;
    let sql = `
      SELECT a.*, p.patientId as formattedPatientId, p.bloodGroup, p.allergies
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      WHERE a.isDeleted = 0
    `;
    const params = [];

    if (date) {
      sql += ' AND a.date = ?';
      params.push(date);
    }
    if (startDate && endDate) {
      sql += ' AND a.date BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }
    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }
    if (source) {
      sql += ' AND a.source = ?';
      params.push(source);
    }
    if (search) {
      sql += ' AND (a.name LIKE ? OR a.phone LIKE ? OR a.referenceId LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY a.date DESC, a.timeSlot ASC';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const appointments = db.prepare(paginatedSql).all(...params, parseInt(limit, 10), offset);

    // Total count query
    const countSql = `SELECT COUNT(*) as total FROM (${sql})`;
    const countRow = db.prepare(countSql).get(...params);

    return res.json({
      success: true,
      total: countRow ? countRow.total : appointments.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      appointments
    });
  } catch (err) {
    console.error('Error fetching appointments:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving appointments' });
  }
}

/**
 * Get single appointment by ID
 */
function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const appointment = db.prepare(`
      SELECT a.*, p.patientId as formattedPatientId, p.bloodGroup, p.allergies, p.medicalHistory, p.address
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      WHERE a.id = ? AND a.isDeleted = 0
    `).get(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    return res.json({ success: true, appointment });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error retrieving appointment' });
  }
}

/**
 * Check availability for a specific date
 * Returns array of booked slot strings
 */
function getAvailability(req, res) {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    const rows = db.prepare(`
      SELECT timeSlot FROM appointments 
      WHERE date = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).all(date);

    return res.json({
      success: true,
      date,
      bookedSlots: rows.map(r => r.timeSlot)
    });
  } catch (err) {
    console.error('Error fetching availability:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving availability' });
  }
}

/**
 * Create new offline/walk-in appointment
 */
function createAppointment(req, res) {
  try {
    const {
      name, phone, email, age, gender, service, date, timeSlot,
      message, doctorNotes, source = 'Walk-in / Phone / Offline', patientId
    } = req.body;

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Patient full name is required' });
    }
    const cleanPhone = sanitizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid 10-digit mobile number is required' });
    }
    if (!service) {
      return res.status(400).json({ success: false, message: 'Service/treatment selection is required' });
    }
    if (!date || !timeSlot) {
      return res.status(400).json({ success: false, message: 'Appointment date and time slot are required' });
    }

    // Check double-booking
    const existing = db.prepare(`
      SELECT id, referenceId, name FROM appointments 
      WHERE date = ? AND timeSlot = ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
    `).get(date, timeSlot);

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Conflict: Slot ${timeSlot} on ${date} is already booked by ${existing.name} (${existing.referenceId}).`
      });
    }

    let linkedPatientId = patientId || null;

    // If patientId not explicitly provided, find existing patient by phone
    if (!linkedPatientId) {
      const existingPatient = db.prepare('SELECT id FROM patients WHERE phone = ? AND isDeleted = 0').get(cleanPhone);
      if (existingPatient) {
        linkedPatientId = existingPatient.id;
      }
    }

    const referenceId = generateReferenceId();
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO appointments (
        referenceId, patientId, name, phone, email, age, gender,
        service, date, timeSlot, source, message, doctorNotes, status,
        isDeleted, createdAt, updatedAt
      ) VALUES (
        @referenceId, @patientId, @name, @phone, @email, @age, @gender,
        @service, @date, @timeSlot, @source, @message, @doctorNotes, 'Confirmed',
        0, @now, @now
      )
    `);

    insertStmt.run({
      referenceId,
      patientId: linkedPatientId,
      name: name.trim(),
      phone: cleanPhone,
      email: email ? email.trim() : null,
      age: age ? parseInt(age, 10) : null,
      gender: gender || 'Not Specified',
      service: service.trim(),
      date,
      timeSlot: timeSlot.trim(),
      source: source || 'Walk-in / Phone / Offline',
      message: message ? message.trim() : null,
      doctorNotes: doctorNotes ? doctorNotes.trim() : null,
      now
    });

    const newAppointment = db.prepare('SELECT * FROM appointments WHERE referenceId = ?').get(referenceId);

    logAudit(req, {
      action: 'CREATE',
      entityType: 'APPOINTMENT',
      entityId: newAppointment.id,
      newValues: { referenceId, name, phone: cleanPhone, date, timeSlot, source }
    });

    return res.status(201).json({
      success: true,
      message: `Appointment scheduled successfully with reference ID ${referenceId}`,
      appointment: newAppointment
    });
  } catch (err) {
    console.error('Error creating appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to create appointment' });
  }
}

/**
 * Update appointment details (status, notes, etc.)
 */
function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const { status, cancelReason, doctorNotes, service, date, timeSlot, name, phone, email, age, gender } = req.body;

    const current = db.prepare('SELECT * FROM appointments WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const now = new Date().toISOString();

    // If changing date or timeSlot, check for collision
    const targetDate = date || current.date;
    const targetSlot = timeSlot || current.timeSlot;
    if ((date && date !== current.date) || (timeSlot && timeSlot !== current.timeSlot)) {
      const collision = db.prepare(`
        SELECT id, referenceId, name FROM appointments 
        WHERE date = ? AND timeSlot = ? AND id != ? AND status != 'Cancelled' AND (isDeleted = 0 OR isDeleted IS NULL)
      `).get(targetDate, targetSlot, id);

      if (collision) {
        return res.status(409).json({
          success: false,
          message: `Cannot reschedule: Slot ${targetSlot} on ${targetDate} is already reserved by ${collision.name}.`
        });
      }
    }

    // If transitioning to Confirmed from Pending, handle patient linking / auto-creation
    let linkedPatientId = current.patientId;
    if (status === 'Confirmed' && current.status === 'Pending') {
      const cleanPhone = sanitizePhone(phone || current.phone);
      let patient = db.prepare('SELECT id FROM patients WHERE phone = ? AND isDeleted = 0').get(cleanPhone);

      if (!patient) {
        // Auto-create patient record
        const newPatientId = generateNextPatientId();
        const patientInsert = db.prepare(`
          INSERT INTO patients (
            patientId, name, age, gender, phone, email, createdAt, updatedAt, isDeleted
          ) VALUES (
            @patientId, @name, @age, @gender, @phone, @email, @now, @now, 0
          )
        `);

        patientInsert.run({
          patientId: newPatientId,
          name: name || current.name,
          age: age || current.age,
          gender: gender || current.gender,
          phone: cleanPhone,
          email: email || current.email,
          now
        });

        patient = db.prepare('SELECT id FROM patients WHERE patientId = ?').get(newPatientId);
      }

      linkedPatientId = patient.id;
    }

    const newStatus = status || current.status;
    const newCancelReason = newStatus === 'Cancelled' ? (cancelReason || current.cancelReason || 'Cancelled by staff') : null;

    db.prepare(`
      UPDATE appointments 
      SET status = ?, cancelReason = ?, doctorNotes = COALESCE(?, doctorNotes),
          service = COALESCE(?, service), date = ?, timeSlot = ?,
          name = COALESCE(?, name), phone = COALESCE(?, phone),
          email = COALESCE(?, email), age = COALESCE(?, age),
          gender = COALESCE(?, gender), patientId = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      newStatus,
      newCancelReason || null,
      doctorNotes ?? null,
      service ?? null,
      targetDate,
      targetSlot,
      name ?? null,
      phone ? sanitizePhone(phone) : null,
      email ?? null,
      age ? parseInt(age, 10) : null,
      gender ?? null,
      linkedPatientId ?? null,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);

    logAudit(req, {
      action: 'UPDATE',
      entityType: 'APPOINTMENT',
      entityId: id,
      oldValues: { status: current.status, date: current.date, timeSlot: current.timeSlot },
      newValues: { status: updated.status, date: updated.date, timeSlot: updated.timeSlot, cancelReason: newCancelReason }
    });

    return res.json({
      success: true,
      message: `Appointment ${updated.referenceId} updated successfully.`,
      appointment: updated
    });
  } catch (err) {
    console.error('Error updating appointment:', err);
    return res.status(500).json({ success: false, message: 'Failed to update appointment' });
  }
}

/**
 * Soft delete an appointment (ADMIN ONLY)
 */
function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const appointment = db.prepare('SELECT * FROM appointments WHERE id = ? AND isDeleted = 0').get(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE appointments 
      SET isDeleted = 1, deletedAt = ?, deletedBy = ?, updatedAt = ?
      WHERE id = ?
    `).run(now, req.user.id, now, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'APPOINTMENT',
      entityId: id,
      oldValues: { referenceId: appointment.referenceId, name: appointment.name, status: appointment.status }
    });

    return res.json({
      success: true,
      message: `Appointment ${appointment.referenceId} moved to Recycle Bin.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete appointment' });
  }
}

module.exports = {
  getAppointments,
  getAppointmentById,
  getAvailability,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
