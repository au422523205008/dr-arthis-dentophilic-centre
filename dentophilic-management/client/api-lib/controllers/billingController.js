const { db, runTransaction } = require('../db');
const { logAudit } = require('../middleware/audit');

function generateInvoiceNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${randomSuffix}`;
}

function generateReceiptNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `REC-${year}-${randomSuffix}`;
}

function getInvoices(req, res) {
  try {
    const { patientId, status, search, page = 1, limit = 50 } = req.query;
    let sql = `
      SELECT i.*, p.name as patientName, p.patientId as formattedPatientId, p.phone as patientPhone
      FROM invoices i
      LEFT JOIN patients p ON i.patientId = p.id
      WHERE i.isDeleted = 0
    `;
    const params = [];

    if (patientId) {
      sql += ' AND i.patientId = ?';
      params.push(patientId);
    }
    if (status) {
      sql += ' AND i.status = ?';
      params.push(status);
    }
    if (search && search.trim()) {
      sql += ' AND (i.invoiceNumber LIKE ? OR p.name LIKE ? OR p.phone LIKE ?)';
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }

    sql += ' ORDER BY i.createdAt DESC';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const paginatedSql = `${sql} LIMIT ? OFFSET ?`;
    const invoices = db.prepare(paginatedSql).all(...params, parseInt(limit, 10), offset);

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params);

    const formatted = invoices.map(inv => ({
      ...inv,
      items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items
    }));

    return res.json({
      success: true,
      total: countRow ? countRow.total : formatted.length,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      invoices: formatted
    });
  } catch (err) {
    console.error('Error fetching invoices:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoices' });
  }
}

function getInvoiceById(req, res) {
  try {
    const { id } = req.params;
    const inv = db.prepare(`
      SELECT i.*, p.name as patientName, p.patientId as formattedPatientId, p.phone as patientPhone, p.address as patientAddress, p.email as patientEmail
      FROM invoices i
      LEFT JOIN patients p ON i.patientId = p.id
      WHERE i.id = ? AND i.isDeleted = 0
    `).get(id);

    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Fetch payments associated with this invoice
    const payments = db.prepare(`
      SELECT p.*, u.name as receivedByName 
      FROM payments p
      LEFT JOIN users u ON p.receivedBy = u.id
      WHERE p.invoiceId = ? AND p.isDeleted = 0
      ORDER BY p.createdAt ASC
    `).all(id);

    const clinicSettingsRows = db.prepare('SELECT key, value FROM clinic_settings').all();
    const settings = {};
    clinicSettingsRows.forEach(r => { settings[r.key] = r.value; });

    return res.json({
      success: true,
      invoice: {
        ...inv,
        items: typeof inv.items === 'string' ? JSON.parse(inv.items) : inv.items,
        payments
      },
      clinicDetails: {
        clinicName: settings.clinic_name || "Dr. Arthi's Dentophilic Centre",
        doctorName: settings.doctor_name || "Dr. Arthi Mukeshkannan",
        doctorQualification: settings.doctor_qualification || "B.D.S, General Dental Surgeon, Chief Dentist",
        tndcRegNo: settings.tndc_reg_no || "31263",
        phone: settings.phone || "+91 95971 26248",
        email: settings.email || "drarthidentophilic@gmail.com",
        address: settings.address || "1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Hosur - 635109",
        invoiceFooter: settings.invoice_footer || "Thank you for choosing Dr. Arthi's Dentophilic Centre."
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve invoice details' });
  }
}

function createInvoice(req, res) {
  try {
    const { patientId, appointmentId, items, discount = 0, taxRate = 0, notes } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Patient and at least one line item are required' });
    }

    const patient = db.prepare('SELECT id, name FROM patients WHERE id = ? AND isDeleted = 0').get(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    let subtotal = 0;
    const sanitizedItems = items.map(item => {
      const qty = parseInt(item.quantity || 1, 10);
      const price = parseFloat(item.unitPrice || 0);
      const amount = qty * price;
      subtotal += amount;
      return {
        description: item.description ? item.description.trim() : 'Dental Procedure',
        quantity: qty,
        unitPrice: price,
        amount
      };
    });

    const parsedDiscount = parseFloat(discount || 0);
    const taxableAmount = Math.max(0, subtotal - parsedDiscount);
    const parsedTaxRate = parseFloat(taxRate || 0);
    const taxAmount = (taxableAmount * parsedTaxRate) / 100;
    const totalAmount = Math.round(taxableAmount + taxAmount);
    const balanceDue = totalAmount;

    const invoiceNumber = generateInvoiceNumber();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO invoices (
        invoiceNumber, patientId, appointmentId, items,
        subtotal, discount, taxRate, taxAmount, totalAmount, paidAmount, balanceDue,
        status, notes, createdAt, updatedAt, isDeleted
      ) VALUES (
        @invoiceNumber, @patientId, @appointmentId, @itemsJson,
        @subtotal, @discount, @taxRate, @taxAmount, @totalAmount, 0, @balanceDue,
        'Unpaid', @notes, @now, @now, 0
      )
    `);

    insert.run({
      invoiceNumber,
      patientId,
      appointmentId: appointmentId || null,
      itemsJson: JSON.stringify(sanitizedItems),
      subtotal,
      discount: parsedDiscount,
      taxRate: parsedTaxRate,
      taxAmount,
      totalAmount,
      balanceDue,
      notes: notes ? notes.trim() : null,
      now
    });

    const newInvoice = db.prepare('SELECT * FROM invoices WHERE invoiceNumber = ?').get(invoiceNumber);

    logAudit(req, {
      action: 'CREATE',
      entityType: 'INVOICE',
      entityId: newInvoice.id,
      newValues: { invoiceNumber, patientId, totalAmount, balanceDue }
    });

    return res.status(201).json({
      success: true,
      message: `Invoice ${invoiceNumber} created successfully`,
      invoice: {
        ...newInvoice,
        items: sanitizedItems
      }
    });
  } catch (err) {
    console.error('Error creating invoice:', err);
    return res.status(500).json({ success: false, message: 'Failed to create invoice' });
  }
}

/**
 * Record a payment against an invoice (supports partial or full settlement)
 */
function recordPayment(req, res) {
  try {
    const { invoiceId, amount, paymentMode = 'Cash', transactionReference, notes } = req.body;

    if (!invoiceId || !amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid invoice ID and positive payment amount are required' });
    }

    const inv = db.prepare('SELECT * FROM invoices WHERE id = ? AND isDeleted = 0').get(invoiceId);
    if (!inv) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (inv.status === 'Paid') {
      return res.status(400).json({ success: false, message: 'Invoice is already settled in full' });
    }

    const payAmount = parseFloat(amount);
    if (payAmount > inv.balanceDue) {
      return res.status(400).json({
        success: false,
        message: `Payment amount (₹${payAmount}) exceeds outstanding balance due (₹${inv.balanceDue})`
      });
    }

    const receiptNumber = generateReceiptNumber();
    const now = new Date().toISOString();

    let updatedInvoice;
    runTransaction(() => {
      // 1. Insert payment record
      db.prepare(`
        INSERT INTO payments (
          receiptNumber, invoiceId, patientId, amount, paymentMode,
          transactionReference, notes, receivedBy, createdAt, isDeleted
        ) VALUES (
          @receiptNumber, @invoiceId, @patientId, @amount, @paymentMode,
          @transactionReference, @notes, @receivedBy, @now, 0
        )
      `).run({
        receiptNumber,
        invoiceId: inv.id,
        patientId: inv.patientId,
        amount: payAmount,
        paymentMode,
        transactionReference: transactionReference ? transactionReference.trim() : null,
        notes: notes ? notes.trim() : null,
        receivedBy: req.user.id,
        now
      });

      // 2. Update invoice balances and status
      const newPaidAmount = inv.paidAmount + payAmount;
      const newBalanceDue = inv.totalAmount - newPaidAmount;
      const newStatus = newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';

      db.prepare(`
        UPDATE invoices 
        SET paidAmount = ?, balanceDue = ?, status = ?, updatedAt = ?
        WHERE id = ?
      `).run(newPaidAmount, Math.max(0, newBalanceDue), newStatus, now, inv.id);

      updatedInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(inv.id);
    });

    logAudit(req, {
      action: 'PAYMENT_RECEIVED',
      entityType: 'PAYMENT',
      entityId: receiptNumber,
      newValues: { invoiceNumber: inv.invoiceNumber, amount: payAmount, paymentMode, newStatus: updatedInvoice.status }
    });

    return res.status(201).json({
      success: true,
      message: `Payment of ₹${payAmount} recorded successfully with receipt ${receiptNumber}`,
      receiptNumber,
      invoice: updatedInvoice
    });
  } catch (err) {
    console.error('Error recording payment:', err);
    return res.status(500).json({ success: false, message: 'Failed to record payment transaction' });
  }
}

/**
 * Update an existing invoice (Logged in audit trail as per instructions)
 */
function updateInvoice(req, res) {
  try {
    const { id } = req.params;
    const { items, discount, taxRate, notes } = req.body;

    const current = db.prepare('SELECT * FROM invoices WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    let subtotal = current.subtotal;
    let sanitizedItems = typeof current.items === 'string' ? JSON.parse(current.items) : current.items;

    if (items && Array.isArray(items) && items.length > 0) {
      subtotal = 0;
      sanitizedItems = items.map(item => {
        const qty = parseInt(item.quantity || 1, 10);
        const price = parseFloat(item.unitPrice || 0);
        const amount = qty * price;
        subtotal += amount;
        return {
          description: item.description ? item.description.trim() : 'Dental Procedure',
          quantity: qty,
          unitPrice: price,
          amount
        };
      });
    }

    const parsedDiscount = discount !== undefined ? parseFloat(discount) : current.discount;
    const parsedTaxRate = taxRate !== undefined ? parseFloat(taxRate) : current.taxRate;
    const taxableAmount = Math.max(0, subtotal - parsedDiscount);
    const taxAmount = (taxableAmount * parsedTaxRate) / 100;
    const totalAmount = Math.round(taxableAmount + taxAmount);
    const balanceDue = Math.max(0, totalAmount - current.paidAmount);
    const status = balanceDue <= 0 ? 'Paid' : (current.paidAmount > 0 ? 'Partially Paid' : 'Unpaid');
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE invoices 
      SET items = ?, subtotal = ?, discount = ?, taxRate = ?, taxAmount = ?,
          totalAmount = ?, balanceDue = ?, status = ?, notes = COALESCE(?, notes), updatedAt = ?
      WHERE id = ?
    `).run(
      JSON.stringify(sanitizedItems),
      subtotal,
      parsedDiscount,
      parsedTaxRate,
      taxAmount,
      totalAmount,
      balanceDue,
      status,
      notes,
      now,
      id
    );

    const updated = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);

    logAudit(req, {
      action: 'UPDATE_FINALIZED_INVOICE',
      entityType: 'INVOICE',
      entityId: id,
      oldValues: { totalAmount: current.totalAmount, balanceDue: current.balanceDue },
      newValues: { totalAmount: updated.totalAmount, balanceDue: updated.balanceDue }
    });

    return res.json({
      success: true,
      message: `Invoice ${updated.invoiceNumber} updated. Changes recorded in audit trail.`,
      invoice: {
        ...updated,
        items: sanitizedItems
      }
    });
  } catch (err) {
    console.error('Error updating invoice:', err);
    return res.status(500).json({ success: false, message: 'Failed to update invoice' });
  }
}

/**
 * Soft delete invoice (ADMIN ONLY)
 */
function deleteInvoice(req, res) {
  try {
    const { id } = req.params;
    const current = db.prepare('SELECT * FROM invoices WHERE id = ? AND isDeleted = 0').get(id);
    if (!current) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    db.prepare(`
      UPDATE invoices 
      SET isDeleted = 1, deletedAt = datetime('now'), deletedBy = ?, updatedAt = datetime('now')
      WHERE id = ?
    `).run(req.user.id, id);

    logAudit(req, {
      action: 'SOFT_DELETE',
      entityType: 'INVOICE',
      entityId: id,
      oldValues: { invoiceNumber: current.invoiceNumber, totalAmount: current.totalAmount }
    });

    return res.json({ success: true, message: `Invoice ${current.invoiceNumber} moved to Recycle Bin.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete invoice' });
  }
}

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  recordPayment,
  updateInvoice,
  deleteInvoice
};
