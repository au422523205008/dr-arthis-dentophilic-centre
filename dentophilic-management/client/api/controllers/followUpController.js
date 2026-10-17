const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

function getFollowUps(req, res) {
  try {
    const { status, filter } = req.query; // filter: 'due_today', 'overdue', 'upcoming'
    const today = new Date().toISOString().split('T')[0];

    let sql = `
      SELECT f.*, p.name as patientName, p.phone as patientPhone, p.patientId as formattedPatientId,
             a.referenceId as appointmentRef, a.service as appointmentService
      FROM follow_ups f
      LEFT JOIN patients p ON f.patientId = p.id
      LEFT JOIN appointments a ON f.appointmentId = a.id
      WHERE f.isDeleted = 0
    `;
    const params = [];

    if (status) {
      sql += ' AND f.status = ?';
      params.push(status);
    }

    if (filter === 'due_today') {
      sql += ' AND f.dueDate = ?';
      params.push(today);
    } else if (filter === 'overdue') {
      sql += ' AND f.dueDate < ? AND f.status = "Pending"';
      params.push(today);
    } else if (filter === 'upcoming') {
      sql += ' AND f.dueDate >= ?';
      params.push(today);
    }

    sql += ' ORDER BY f.dueDate ASC';
    const followUps = db.prepare(sql).all(...params);

    return res.json({ success: true, followUps });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve follow-up reminders' });
  }
}

function updateFollowUp(req, res) {
  try {
    const { id } = req.params;
    const { status, notes, dueDate } = req.body;

    const current = db.prepare('SELECT * FROM follow_ups WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Follow-up not found' });
    }

    db.prepare(`
      UPDATE follow_ups 
      SET status = COALESCE(?, status), notes = COALESCE(?, notes), dueDate = COALESCE(?, dueDate), updatedAt = datetime('now')
      WHERE id = ?
    `).run(status, notes, dueDate, id);

    const updated = db.prepare('SELECT * FROM follow_ups WHERE id = ?').get(id);
    logAudit(req, {
      action: 'UPDATE',
      entityType: 'FOLLOW_UP',
      entityId: id,
      newValues: { status: updated.status, notes: updated.notes }
    });

    return res.json({ success: true, message: 'Follow-up reminder updated', followUp: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update follow-up' });
  }
}

/**
 * Generate click-to-send WhatsApp URLs for various clinic messages
 */
function generateWhatsAppTemplate(req, res) {
  try {
    const { type, patientName, phone, date, timeSlot, service, referenceId } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.startsWith('91') && cleanPhone.length === 12
      ? cleanPhone
      : `91${cleanPhone.slice(-10)}`;

    let messageText = '';

    switch (type) {
      case 'CONFIRMATION':
        messageText = `Dear ${patientName || 'Patient'},\n\nYour dental appointment at Dr. Arthi's Dentophilic Centre is CONFIRMED for ${date} at ${timeSlot} (${service}).\n\nBooking Ref: ${referenceId || 'N/A'}\nClinic Location: 1st Floor, Pk Complex, ESI Ring Road, Hosur.\nContact: +91 95971 26248\n\nWe look forward to seeing you!`;
        break;

      case 'REMINDER':
        messageText = `Reminder from Dr. Arthi's Dentophilic Centre:\n\nHello ${patientName || 'Patient'}, you have an appointment scheduled for tomorrow, ${date} at ${timeSlot}.\n\nPlease arrive 5 minutes early. For any changes, please call +91 95971 26248.`;
        break;

      case 'SIX_MONTH_RECALL':
        messageText = `Hello ${patientName || 'Patient'},\n\nIt has been 6 months since your last dental visit at Dr. Arthi's Dentophilic Centre! Regular teeth scaling and checkups keep your gums healthy and prevent hidden cavities.\n\nReply here or call +91 95971 26248 to reserve your routine checkup slot.`;
        break;

      case 'FOLLOW_UP_CARE':
      default:
        messageText = `Hello ${patientName || 'Patient'},\n\nThis is a friendly follow-up check-in from Dr. Arthi's Dentophilic Centre following your recent dental procedure. How are you feeling today? If you have any discomfort or questions, please let us know!`;
        break;
    }

    const encoded = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${phoneWithCountry}?text=${encoded}`;

    return res.json({
      success: true,
      messageText,
      waUrl
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate WhatsApp message' });
  }
}

function createFollowUp(req, res) {
  try {
    const { patientId, appointmentId, dueDate, type = 'Care Check-in', notes } = req.body;
    if (!patientId || !dueDate) {
      return res.status(400).json({ success: false, message: 'Patient and due date are required' });
    }

    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO follow_ups (patientId, appointmentId, dueDate, type, notes, status, createdAt, updatedAt, isDeleted)
      VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, 0)
    `).run(patientId, appointmentId || null, dueDate, type, notes || null, now, now);

    return res.status(201).json({
      success: true,
      message: 'Follow-up reminder scheduled',
      followUpId: Number(result.lastInsertRowid)
    });
  } catch (err) {
    console.error('Error creating follow up:', err);
    return res.status(500).json({ success: false, message: 'Failed to create follow-up' });
  }
}

module.exports = {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  generateWhatsAppTemplate
};

