# Dr. Arthi's Dentophilic Centre — Clinic Management System (CMS) & EMR

A production-grade, enterprise Electronic Medical Records (EMR) and Clinic Management System designed for **Dr. Arthi Mukeshkannan, B.D.S** (Chief Dentist, TNDC Regd. No: 31263).

The Management System runs as a standalone portal on `http://localhost:3000` connected to its backend on `http://localhost:5001`, sharing a **single persistent SQLite database** with the public clinic website (`http://localhost:5173`).

---

## 🚀 Quick Start (One Command)

To run the entire ecosystem (Website + Website API + Management Portal + Management API) simultaneously, execute from the root directory:

```bash
npm run dev:all
```

Or run the individual components in separate terminals:

| Component | Port | Command |
|---|---|---|
| **Website Frontend** | `http://localhost:5173` | `cd dentophilic-website/client && npm run dev` |
| **Website API** | `http://localhost:5000` | `cd dentophilic-website/server && node server.js` |
| **Management Portal** | `http://localhost:3000` | `cd dentophilic-management/client && npm run dev` |
| **Management API** | `http://localhost:5001` | `cd dentophilic-management/server && node server.js` |

---

## 🔑 First-Run Setup & Authentication

1. Open `http://localhost:3000` in your web browser.
2. Because this is a pristine database with **strictly zero fake/dummy records**, the system will display the **First-Run Setup Wizard**.
3. Create your Master Administrator account (Dr. Arthi / Clinic Owner) by entering your desired username, phone, email, and password.
4. Alternatively, you can initialize or reset the administrator via the secure CLI tool:
   ```bash
   node dentophilic-management/server/scripts/setup-admin.js
   ```

---

## 🛡️ Role-Based Access Control (RBAC)

Access control is strictly enforced on **both the frontend UI and the backend API (HTTP 403 Forbidden)**:

| Feature / Module | Doctor / ADMIN | Attender / Receptionist |
|---|:---:|:---:|
| **Patient Queue & Walk-ins** | ✅ Full Access | ✅ Full Access |
| **Confirm Website Bookings** | ✅ Full Access | ✅ Full Access |
| **Electronic Medical Records (EMR)** | ✅ Full Access | ✅ View / Edit Patient Info |
| **Dental Odontogram (FDI Chart)** | ✅ Full Access | ✅ View / Log Conditions |
| **Generate Prescriptions (Rx)** | ✅ Full Access | ✅ View & Print |
| **Generate Invoices & Receipts** | ✅ Full Access | ✅ Collect Payments |
| **Financial Revenue & Dashboards** | ✅ Full Access | 🚫 **Restricted (403)** |
| **Clinic Overhead Expenses** | ✅ Full Access | 🚫 **Restricted (403)** |
| **Staff & User Management** | ✅ Full Access | 🚫 **Restricted (403)** |
| **System Settings & Pricing** | ✅ Full Access | 🚫 **Restricted (403)** |
| **Immutable Audit Logs** | ✅ Full Access | 🚫 **Restricted (403)** |
| **Database Backups & Restore** | ✅ Full Access | 🚫 **Restricted (403)** |
| **Permanent Deletion (Recycle Bin)**| ✅ Full Access | 🚫 **Restricted (403)** |
| **Export Full Patient/Financial CSV**| ✅ Full Access | 🚫 **Restricted (403)** |

*Admin can also customize permissions individually per staff member via the interactive **Permissions Matrix**.*

---

## 🗄️ Database Architecture & Data Safety

- **Shared File:** Both the Website and Management servers connect directly to:
  `dentophilic-website/server/appointments.db`
- **WAL Mode Active:** Write-Ahead Logging (`PRAGMA journal_mode = WAL`) enables non-blocking concurrent reads and writes across both servers.
- **Zero Mock / Dummy Data:** The database contains only clean, genuine records.
- **Soft Deletion Everywhere:** Deleting appointments, patients, services, or invoices marks `isDeleted = 1`, `deletedAt`, and `deletedBy`. Items are moved to the **Recycle Bin** where they can be restored at any time.
- **Immutable Audit Trail:** All critical operations are permanently logged to the `audit_logs` table with timestamp, user ID, IP address, and previous vs new values.
- **Automated Daily Backups:**
  - Backups are stored in `dentophilic-management/server/backups/`.
  - Daily snapshots run automatically every 24 hours.
  - Manual snapshots can be triggered or downloaded at any time.
  - One-click restore with automated safety backup.

---

## 🦷 Key Modules

1. **Live Dashboard:** Role-aware metrics with real-time pending website booking counters and today's consultation queue.
2. **Appointments:** Calendar slots, walk-in registration, and double-booking prevention.
3. **Patients (EMR):** Searchable directory, unified clinical visit history, and patient profile merger for resolving duplicate phone entries.
4. **Interactive Dental Chart:** 32-tooth FDI two-digit numbering odontogram with color-coded diagnostic condition tracking (Caries, RCT, Crown, Implant, etc.).
5. **Treatments & Services Catalog:** Procedure definitions, clinical visit note logger, and fee configuration.
6. **Prescriptions (Rx):** Medication dosage generator and printable clinic letterhead matching Dr. Arthi's official registration.
7. **Billing & Invoices:** Multi-item invoicing, partial payments, remaining balance tracking, and printable GST receipts.
8. **Follow-ups & Recalls:** Automated care reminders and 1-click WhatsApp message dispatch.
9. **Inventory Supplies:** Stock monitoring, threshold alerts, and restocking history.
10. **Reports & Analytics:** P&L statements, monthly revenue trends, and CSV data export.
