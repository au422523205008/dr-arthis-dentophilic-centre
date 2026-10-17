const { db } = require('../db');

/**
 * Role-Aware Dashboard Metrics
 */
function getDashboardMetrics(req, res) {
  try {
    const userRole = req.user.role;
    const today = new Date().toISOString().split('T')[0];
    const currentMonthPrefix = today.slice(0, 7); // YYYY-MM
    const currentYearPrefix = today.slice(0, 4); // YYYY

    // 1. Pending Website Bookings Count (For both Admin & Attender live alert)
    const pendingWebsiteRow = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE source = 'Website' AND status = 'Pending' AND isDeleted = 0
    `).get();
    const pendingWebsiteCount = pendingWebsiteRow.count || 0;

    // 2. Today's Appointments Count & Queue
    const todayAppointmentsRow = db.prepare(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE date = ? AND isDeleted = 0 AND status != 'Cancelled'
    `).get(today);
    const todayTotal = todayAppointmentsRow.count || 0;

    // Today's appointments by status
    const todayStatusRows = db.prepare(`
      SELECT status, COUNT(*) as count FROM appointments 
      WHERE date = ? AND isDeleted = 0 
      GROUP BY status
    `).all(today);

    // Today's appointment list with patient info
    const todayAppointments = db.prepare(`
      SELECT a.*, p.patientId as formattedPatientId, p.bloodGroup, p.allergies
      FROM appointments a
      LEFT JOIN patients p ON a.patientId = p.id
      WHERE a.date = ? AND a.isDeleted = 0 AND a.status != 'Cancelled'
      ORDER BY a.timeSlot ASC
    `).all(today);

    // 3. Total active patients count
    const totalPatientsRow = db.prepare(`SELECT COUNT(*) as count FROM patients WHERE isDeleted = 0`).get();
    const newPatientsThisMonthRow = db.prepare(`
      SELECT COUNT(*) as count FROM patients 
      WHERE createdAt LIKE ? AND isDeleted = 0
    `).get(`${currentMonthPrefix}%`);

    // 4. Common Treatments breakdown (clinical data, safe for all staff)
    const topTreatments = db.prepare(`
      SELECT service, COUNT(*) as count 
      FROM appointments 
      WHERE isDeleted = 0 AND status = 'Completed'
      GROUP BY service 
      ORDER BY count DESC 
      LIMIT 5
    `).all();

    // Base dashboard payload accessible by both roles
    const baseDashboard = {
      role: userRole,
      todayDate: today,
      pendingWebsiteBookingsCount: pendingWebsiteCount,
      todayAppointmentsCount: todayTotal,
      todayStatusBreakdown: todayStatusRows,
      todayQueue: todayAppointments,
      totalPatients: totalPatientsRow.count || 0,
      newPatientsThisMonth: newPatientsThisMonthRow.count || 0,
      topTreatments
    };

    // If Attender, return immediately without any financial figures
    if (userRole === 'ATTENDER') {
      return res.json({
        success: true,
        data: baseDashboard
      });
    }

    // ==========================================
    // ADMIN ONLY FINANCIAL METRICS
    // ==========================================
    // Revenue Today
    const revTodayRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE createdAt LIKE ? AND isDeleted = 0
    `).get(`${today}%`);

    // Revenue This Month
    const revMonthRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE createdAt LIKE ? AND isDeleted = 0
    `).get(`${currentMonthPrefix}%`);

    // Revenue This Year
    const revYearRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM payments 
      WHERE createdAt LIKE ? AND isDeleted = 0
    `).get(`${currentYearPrefix}%`);

    // Total Pending Balances Due
    const pendingBalanceRow = db.prepare(`
      SELECT COALESCE(SUM(balanceDue), 0) as total 
      FROM invoices 
      WHERE status != 'Paid' AND isDeleted = 0
    `).get();

    // Expenses This Month
    const expenseMonthRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM expenses 
      WHERE expenseDate LIKE ? AND isDeleted = 0
    `).get(`${currentMonthPrefix}%`);

    // Monthly Revenue Trend (Last 6 Months for Recharts)
    const monthlyRevenueTrend = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = d.toISOString().slice(0, 7); // YYYY-MM
      const monthLabel = d.toLocaleString('default', { month: 'short' });

      const revRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as revenue 
        FROM payments 
        WHERE createdAt LIKE ? AND isDeleted = 0
      `).get(`${prefix}%`);

      const expRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as expenses 
        FROM expenses 
        WHERE expenseDate LIKE ? AND isDeleted = 0
      `).get(`${prefix}%`);

      monthlyRevenueTrend.push({
        month: monthLabel,
        revenue: revRow.revenue,
        expenses: expRow.expenses,
        profit: revRow.revenue - expRow.expenses
      });
    }

    return res.json({
      success: true,
      data: {
        ...baseDashboard,
        financials: {
          revenueToday: revTodayRow.total,
          revenueThisMonth: revMonthRow.total,
          revenueThisYear: revYearRow.total,
          pendingBalancesDue: pendingBalanceRow.total,
          expensesThisMonth: expenseMonthRow.total,
          netProfitThisMonth: revMonthRow.total - expenseMonthRow.total,
          monthlyTrend: monthlyRevenueTrend
        }
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard metrics:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard metrics' });
  }
}

module.exports = { getDashboardMetrics };
