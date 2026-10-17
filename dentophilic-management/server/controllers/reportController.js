const { db } = require('../db');

function getFinancialReports(req, res) {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const yearStr = String(year);

    // 1. Monthly Revenue & Expenses for the selected year (12 months)
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthPrefix = `${yearStr}-${String(month).padStart(2, '0')}`;
      const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' });

      const rev = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE createdAt LIKE ? AND isDeleted = 0
      `).get(`${monthPrefix}%`).total;

      const exp = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE expenseDate LIKE ? AND isDeleted = 0
      `).get(`${monthPrefix}%`).total;

      monthlyData.push({
        month: monthName,
        monthKey: monthPrefix,
        revenue: rev,
        expenses: exp,
        netProfit: rev - exp
      });
    }

    // 2. Total Year Revenue, Expenses, Net
    const totalYearRevenue = monthlyData.reduce((acc, m) => acc + m.revenue, 0);
    const totalYearExpenses = monthlyData.reduce((acc, m) => acc + m.expenses, 0);

    // 3. Category-wise expense distribution
    const expenseByCategory = db.prepare(`
      SELECT category, COALESCE(SUM(amount), 0) as amount 
      FROM expenses 
      WHERE expenseDate LIKE ? AND isDeleted = 0
      GROUP BY category
    `).all(`${yearStr}%`);

    // 4. Treatment-wise revenue distribution (from completed records)
    const revenueByTreatment = db.prepare(`
      SELECT serviceName, COUNT(*) as count, COALESCE(SUM(fee), 0) as totalRevenue 
      FROM treatment_records 
      WHERE createdAt LIKE ? AND isDeleted = 0
      GROUP BY serviceName 
      ORDER BY totalRevenue DESC
    `).all(`${yearStr}%`);

    // 5. Payment modes distribution
    const paymentModes = db.prepare(`
      SELECT paymentMode, COUNT(*) as count, COALESCE(SUM(amount), 0) as totalAmount 
      FROM payments 
      WHERE createdAt LIKE ? AND isDeleted = 0
      GROUP BY paymentMode
    `).all(`${yearStr}%`);

    return res.json({
      success: true,
      year: parseInt(yearStr, 10),
      summary: {
        totalRevenue: totalYearRevenue,
        totalExpenses: totalYearExpenses,
        netProfit: totalYearRevenue - totalYearExpenses
      },
      monthlyData,
      expenseByCategory,
      revenueByTreatment,
      paymentModes
    });
  } catch (err) {
    console.error('Error generating financial report:', err);
    return res.status(500).json({ success: false, message: 'Failed to generate financial reports' });
  }
}

/**
 * Export data as clean CSV (Patients, Appointments, or Invoices)
 */
function exportDataAsCsv(req, res) {
  try {
    const { type } = req.params; // 'patients', 'appointments', 'invoices'

    let csvContent = '';
    let filename = `dentophilic-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'patients') {
      const patients = db.prepare('SELECT patientId, name, age, gender, phone, email, bloodGroup, createdAt FROM patients WHERE isDeleted = 0').all();
      csvContent = 'Patient ID,Name,Age,Gender,Phone,Email,Blood Group,Registered Date\n';
      patients.forEach(p => {
        csvContent += `"${p.patientId}","${p.name}","${p.age || ''}","${p.gender || ''}","${p.phone}","${p.email || ''}","${p.bloodGroup || ''}","${p.createdAt}"\n`;
      });
    } else if (type === 'appointments') {
      const appts = db.prepare('SELECT referenceId, name, phone, service, date, timeSlot, source, status, createdAt FROM appointments WHERE isDeleted = 0').all();
      csvContent = 'Reference ID,Patient Name,Phone,Service,Date,Time Slot,Source,Status,Booked Date\n';
      appts.forEach(a => {
        csvContent += `"${a.referenceId}","${a.name}","${a.phone}","${a.service}","${a.date}","${a.timeSlot}","${a.source}","${a.status}","${a.createdAt}"\n`;
      });
    } else if (type === 'invoices') {
      const invoices = db.prepare('SELECT invoiceNumber, subtotal, discount, taxAmount, totalAmount, paidAmount, balanceDue, status, createdAt FROM invoices WHERE isDeleted = 0').all();
      csvContent = 'Invoice Number,Subtotal,Discount,Tax,Total Amount,Paid Amount,Balance Due,Status,Date\n';
      invoices.forEach(i => {
        csvContent += `"${i.invoiceNumber}",${i.subtotal},${i.discount},${i.taxAmount},${i.totalAmount},${i.paidAmount},${i.balanceDue},"${i.status}","${i.createdAt}"\n`;
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid export type. Supported: patients, appointments, invoices' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  } catch (err) {
    console.error('Error exporting CSV:', err);
    return res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
}

module.exports = {
  getFinancialReports,
  exportDataAsCsv
};
