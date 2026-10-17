const { db } = require('../db');
const { logAudit } = require('../middleware/audit');

function getExpenses(req, res) {
  try {
    const { category, month, startDate, endDate } = req.query;
    let sql = `
      SELECT e.*, u.name as recordedByName 
      FROM expenses e
      LEFT JOIN users u ON e.recordedBy = u.id
      WHERE e.isDeleted = 0
    `;
    const params = [];

    if (category) {
      sql += ' AND e.category = ?';
      params.push(category);
    }
    if (month) {
      sql += ' AND e.expenseDate LIKE ?';
      params.push(`${month}%`);
    }
    if (startDate && endDate) {
      sql += ' AND e.expenseDate BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    sql += ' ORDER BY e.expenseDate DESC, e.createdAt DESC';
    const expenses = db.prepare(sql).all(...params);

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    return res.json({
      success: true,
      totalCount: expenses.length,
      totalAmount: totalExpense,
      expenses
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve expenses' });
  }
}

function createExpense(req, res) {
  try {
    const { category, description, amount, expenseDate, paymentMode, receiptUrl } = req.body;

    if (!category || !description || !amount || parseFloat(amount) <= 0 || !expenseDate) {
      return res.status(400).json({ success: false, message: 'Category, description, positive amount, and date are required' });
    }

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO expenses (
        category, description, amount, expenseDate, paymentMode, receiptUrl,
        recordedBy, createdAt, isDeleted
      ) VALUES (
        @category, @description, @amount, @expenseDate, @paymentMode, @receiptUrl,
        @recordedBy, @now, 0
      )
    `);

    insert.run({
      category: category.trim(),
      description: description.trim(),
      amount: parseFloat(amount),
      expenseDate,
      paymentMode: paymentMode || 'Cash',
      receiptUrl: receiptUrl || null,
      recordedBy: req.user.id,
      now
    });

    const newExpense = db.prepare('SELECT * FROM expenses WHERE id = last_insert_rowid()').get();

    logAudit(req, {
      action: 'CREATE',
      entityType: 'EXPENSE',
      entityId: newExpense.id,
      newValues: { category, description, amount, expenseDate }
    });

    return res.status(201).json({
      success: true,
      message: 'Clinic expense recorded successfully',
      expense: newExpense
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to record expense' });
  }
}

function deleteExpense(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM expenses WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    db.prepare(`
      UPDATE expenses 
      SET isDeleted = 1, deletedAt = datetime('now'), deletedBy = ? 
      WHERE id = ?
    `).run(req.user.id, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'EXPENSE',
      entityId: id,
      oldValues: { description: current.description, amount: current.amount }
    });

    return res.json({ success: true, message: 'Expense moved to Recycle Bin' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete expense' });
  }
}

function updateExpense(req, res) {
  try {
    const { id } = req.params;
    const { category, description, amount, expenseDate, paymentMode, receiptUrl } = req.body;

    const current = db.prepare('SELECT * FROM expenses WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    db.prepare(`
      UPDATE expenses 
      SET category = COALESCE(?, category),
          description = COALESCE(?, description),
          amount = COALESCE(?, amount),
          expenseDate = COALESCE(?, expenseDate),
          paymentMode = COALESCE(?, paymentMode),
          receiptUrl = COALESCE(?, receiptUrl)
      WHERE id = ?
    `).run(category, description, amount, expenseDate, paymentMode, receiptUrl, id);

    const updated = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    return res.json({ success: true, message: 'Expense updated successfully', expense: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update expense' });
  }
}

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};

