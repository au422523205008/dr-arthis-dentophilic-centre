const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

function getDentalChart(req, res) {
  try {
    const { patientId } = req.params;
    const entries = db.prepare(`
      SELECT * FROM dental_chart_entries 
      WHERE patientId = ?
      ORDER BY toothNumber ASC
    `).all(patientId);

    // Map by toothNumber for easy frontend access
    const chartMap = {};
    entries.forEach(e => {
      chartMap[e.toothNumber] = e;
    });

    return res.json({ success: true, patientId: parseInt(patientId, 10), chart: chartMap, rawEntries: entries });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve dental chart' });
  }
}

function updateToothCondition(req, res) {
  try {
    const { patientId } = req.params;
    const { toothNumber, condition, surface, notes } = req.body;

    if (!toothNumber || !condition) {
      return res.status(400).json({ success: false, message: 'Tooth number and condition are required' });
    }

    const patient = db.prepare('SELECT id, name FROM patients WHERE id = ? AND isDeleted = 0').get(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const toothInt = parseInt(toothNumber, 10);
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO dental_chart_entries (patientId, toothNumber, condition, surface, notes, updatedAt)
      VALUES (@patientId, @toothNumber, @condition, @surface, @notes, @now)
      ON CONFLICT(patientId, toothNumber) DO UPDATE SET
        condition = excluded.condition,
        surface = excluded.surface,
        notes = excluded.notes,
        updatedAt = excluded.updatedAt
    `).run({
      patientId,
      toothNumber: toothInt,
      condition: condition.trim(),
      surface: surface ? surface.trim() : null,
      notes: notes ? notes.trim() : null,
      now
    });

    const updatedEntry = db.prepare('SELECT * FROM dental_chart_entries WHERE patientId = ? AND toothNumber = ?').get(patientId, toothInt);

    logAudit(req, {
      action: 'UPDATE',
      entityType: 'DENTAL_CHART',
      entityId: `${patientId}-Tooth${toothInt}`,
      newValues: { toothNumber: toothInt, condition, surface, notes }
    });

    return res.json({
      success: true,
      message: `Tooth #${toothInt} updated to ${condition}`,
      entry: updatedEntry
    });
  } catch (err) {
    console.error('Error updating dental chart:', err);
    return res.status(500).json({ success: false, message: 'Failed to update tooth condition' });
  }
}

module.exports = {
  getDentalChart,
  updateToothCondition
};
