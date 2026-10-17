# 🦷 Dr. Arthi's Dentophilic Centre - Clinic Ecosystem

A full-stack, enterprise-grade dental practice solution featuring a modern patient-facing booking website and a comprehensive, multi-user clinic management system (ERP/EMR) powered by a synchronized SQLite database.

---

## 🌟 Ecosystem Architecture

The repository contains two fully integrated applications running together seamlessly:

```
                                  ┌─────────────────────────────────────────┐
                                  │           Shared SQLite Database        │
                                  │ (dentophilic-website/server/appts.db)   │
                                  └────────────────────┬────────────────────┘
                                                       │
                           ┌───────────────────────────┴───────────────────────────┐
                           ▼                                                       ▼
        ┌─────────────────────────────────────┐                 ┌─────────────────────────────────────┐
        │   Public Website Backend (:5000)   │                 │   Management System Backend (:5001) │
        │        (Express + SQLite WAL)       │                 │   (Express + JWT + OTP + SQLite)    │
        └──────────────────┬──────────────────┘                 └──────────────────┬──────────────────┘
                           │                                                       │
                           ▼                                                       ▼
        ┌─────────────────────────────────────┐                 ┌─────────────────────────────────────┐
        │   Public Website Frontend (:5173)  │                 │  Management Portal Frontend (:3000) │
        │     (React + Vite + Tailwind CSS)   │                 │     (React + Vite + Tailwind CSS)   │
        └─────────────────────────────────────┘                 └─────────────────────────────────────┘
```

---

## ✨ Key Features

### 🌐 1. Public Patient Website (`http://localhost:5173`)
- **Interactive Booking System**: Real-time slot availability checking, automatic filtering of occupied slots, instant reference ID generation (`DEN-YYYY-XXXX`), and mobile validation.
- **Treatment Showcase**: Rotary Root Canal (RCT), Laser Whitening, Dental Implants, Pediatric Care, and Orthodontics with before/after case galleries.
- **Clinic Facility & Doctor Profile**: Verified credentials (B.D.S, TNDC Reg. 31263), hospital-grade Class-B autoclave sterilization protocols, and WhatsApp integration.
- **Dynamic Mobile First UI**: Built with Tailwind CSS, Lucide icons, and Framer Motion smooth animations.

### 🏥 2. Clinic Management System (`http://localhost:3000`)
- **Multi-Role Authentication**: Role-based access control (`ADMIN / Doctor` vs. `ATTENDER / Receptionist`) with secure JWT sessions.
- **2-Step OTP Password Recovery**: Forgot password functionality that delivers emergency OTP codes directly to the doctor's official email (`drarthidentophilic@gmail.com`).
- **Dynamic Greetings & Shift Identity**: Contextual morning/afternoon/evening greetings tailored to the active receptionist or doctor on shift.
- **Cross-Platform Slot Lock**: Online bookings from the website and offline walk-ins from the clinic immediately remove the booked slot across both systems, completely eliminating double bookings.
- **Clinical EHR & Patient Management**: Sequential patient ID tracking starting from `P-001`, medical history, allergy alerts, treatment charting, digital prescriptions, and billing.
- **Daily Queue & Walk-In Intake**: Immediate walk-in registration with real-time seat assignment and doctor consultation queue.
- **Purple Clinic Theme**: Aesthetic clinic theme with dark/light mode toggle.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### Installation
Clone the repository:
```bash
git clone https://github.com/au422523205008/dr-arthis-dentophilic-centre.git
cd dr-arthis-dentophilic-centre
```

Install dependencies across all 4 sub-projects:
```bash
# Website Client & Server
npm --prefix dentophilic-website/client install
npm --prefix dentophilic-website/server install

# Management Client & Server
npm --prefix dentophilic-management/client install
npm --prefix dentophilic-management/server install
```

---

## 🏃 Running All Systems Concurrently

Launch both backends and frontends with a single orchestrator command:
```bash
node run-all.js
```

Or using npm:
```bash
npm run dev:all
```

### Local Service Map:
| Service | URL | Technology |
| :--- | :--- | :--- |
| **Website Frontend** | [http://localhost:5173](http://localhost:5173) | Vite + React + Tailwind |
| **Website API** | [http://localhost:5000](http://localhost:5000) | Express + SQLite (WAL) |
| **Management Portal** | [http://localhost:3000](http://localhost:3000) | Vite + React + Tailwind |
| **Management API** | [http://localhost:5001](http://localhost:5001) | Express + SQLite + JWT |

---

## 🔑 Default Sign-In Credentials

| Role | Username | Default Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Doctor / Admin** | `drarthi` | `Password@123` | Full clinical access, staff management, audit log, billing, settings |
| **Attender / Reception** | `receptionist` | `AttenderPass@123` | Appointment booking, patient queue, check-in, walk-ins |

---

## 📁 Repository Structure

```
dr-arthis-dentophilic-centre/
├── dentophilic-website/
│   ├── client/                  # Public website frontend (React + Vite)
│   │   ├── src/components/      # BookingForm, Gallery, Navbar, Services...
│   │   └── src/config/          # Site data, doctor profile, treatment list
│   └── server/                  # Public website backend API (Express)
│       ├── server.js            # Booking endpoints, availability queries
│       └── appointments.db      # Shared SQLite database file
├── dentophilic-management/
│   ├── client/                  # Management portal frontend (React + Vite)
│   │   ├── src/pages/           # Dashboard, Appointments, Patients, Billing...
│   │   └── src/context/         # AuthContext, ThemeContext, ToastContext
│   └── server/                  # Management portal backend API (Express)
│       ├── controllers/         # Auth, appointments, clinical, invoices...
│       ├── db/migrate.js        # Automatic migrations & seed sequences
│       └── services/mailService # 2-step OTP password reset mailer
├── package.json                 # Root ecosystem workspace scripts
├── run-all.js                   # 4-in-1 concurrent process orchestrator
├── .gitignore                   # Ignore node_modules, build dist, temporary files
└── README.md                    # Project documentation
```

---

## 📜 License & Copyright
© 2026 Dr. Arthi Mukeshkannan, B.D.S (TNDC Regd: 31263). All rights reserved.  
Dr. Arthi's Dentophilic Centre, Hosur, Tamil Nadu.
