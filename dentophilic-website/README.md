# Dr. Arthi's Dentophilic Centre — Official Website & Booking API

A production-quality dental clinic website engineered with **React 19 + Vite + Tailwind CSS**, **Framer Motion**, and **Lenis** smooth scrolling, paired with an **Express + SQLite (Node.js native `DatabaseSync`)** backend.

---

## 🌟 Clinic Information

- **Clinic Name:** Dr. Arthi's Dentophilic Centre
- **Chief Dentist:** Dr. Arthi Mukeshkannan, B.D.S, General Dental Surgeon
- **TNDC Regd. No:** 31263
- **Phone:** [+91 95971 26248](tel:9597126248)
- **Email:** [drarthidentophilic@gmail.com](mailto:drarthidentophilic@gmail.com)
- **Address:** 1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Muneeswara Nagar, Hosur - 635109, Tamil Nadu
- **Google Rating:** 4.9 ★ (50+ Verified Patient Reviews)
- **Highlights:** 10+ Years Experience, Advanced Dental Procedures, 5,000+ Smiles Restored

---

## 🏗️ Architecture & Tech Stack

### Frontend (`client/`)
- **React 19** with **Vite**
- **Tailwind CSS v4** with custom luxury medical palette (Deep Teal `#0F766E`, Accent Mint `#CCFBF1`, Dark Navy `#1E293B`)
- **Typography:** Playfair Display (Serif Headings) & Plus Jakarta Sans (Modern Clean Body)
- **Framer Motion** for scroll-reveal stagger, floating badges, and smooth modal drawers
- **Lenis** for momentum smooth scrolling
- **Lucide React** for dental and clinical iconography
- **Canvas Confetti** for booking celebration
- **Dentist / LocalBusiness Schema.org JSON-LD** with geolocation coordinates & opening hours
- **Centralized Content Config:** All copy and settings in `client/src/config/siteData.js`

### Backend (`server/`)
- **Node.js + Express** (Port `5000`)
- **Native SQLite (`node:sqlite DatabaseSync`)** — zero native build toolchain dependencies, ultra-fast and reliable on Windows/Linux
- **WAL Mode** enabled for high-concurrency read/write operations
- **Strict Unique Index** on `(date, timeSlot) WHERE status != 'Cancelled'` to prevent double booking at the database level
- **CORS Configured** for `http://localhost:5173` and the upcoming clinic management system on `http://localhost:3000`

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+ (Node v24 recommended)
- npm v10+

### 1. Start the Backend API Server
```bash
cd dentophilic-website/server
npm install
node server.js
```
The server will boot on `http://localhost:5000` and automatically initialize and seed `appointments.db`.

### 2. Start the Frontend Client
```bash
cd dentophilic-website/client
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/health` | Health check & clinic status | No |
| `GET` | `/api/appointments/availability?date=YYYY-MM-DD` | Returns list of already booked time slots for the date | No |
| `POST` | `/api/appointments` | Creates a new appointment request with status `Pending` | No |
| `GET` | `/api/appointments` | Lists appointments (supports `?date=`, `?status=`, `?search=`) | Yes (`x-api-key`) |
| `PATCH` | `/api/appointments/:id` | Updates status (`Pending`, `Confirmed`, `Completed`, `Cancelled`, `No-show`) | Yes (`x-api-key`) |

### Example API Request (Create Appointment)
```http
POST /api/appointments
Content-Type: application/json

{
  "name": "Kavitha Ramesh",
  "phone": "9845123456",
  "email": "kavitha.r@gmail.com",
  "age": 32,
  "gender": "Female",
  "service": "Single-Sitting Painless Root Canal (RCT)",
  "date": "2026-10-25",
  "timeSlot": "11:00 AM",
  "message": "Cold sensitivity on upper right molar"
}
```

### Protected Requests Header
Include the header configured in `server/.env`:
```http
x-api-key: dentophilic_admin_secret_2026
```

---

## 🛠️ How to Customize Clinic Information

All clinic content is decoupled from code into a single configuration file:
👉 **`client/src/config/siteData.js`**

You can easily modify:
1. **Doctor details & photo path:** `siteData.doctor`
2. **Services & descriptions:** `siteData.services` (10 services with badges, durations, benefits)
3. **Working hours:** `siteData.clinic.hours`
4. **Google rating & reviews count:** `siteData.clinic.rating`
5. **Authentic Patient Testimonials:** `siteData.testimonials`
6. **Case Gallery Before/After items:** `siteData.gallery`
7. **FAQs:** `siteData.faqs`
8. **Available time slots:** `siteData.availableSlots`

---

## 🧪 Testing Verification Performed

- ✅ **Backend API Suite:** Verified with automated test runner (`node server/test-api.js`):
  - Health check: 200 OK
  - Availability query: returns booked slots array
  - Appointment creation: successfully creates record with reference ID (e.g. `DEN-2026-1575`)
  - Double booking conflict: returns HTTP 409 with descriptive message
  - Availability real-time update: newly booked slot immediately blocked in subsequent queries
  - Admin endpoints: 401 Unauthorized without API key, 200 OK with valid API key
  - Status transition: PATCH updates appointment status to `Confirmed`
- ✅ **Frontend Production Build:** `vite build` completed cleanly with zero warnings or errors.
- ✅ **Assets & Routing:** Doctor portrait image (`/doctor-arthi.png`) and SVG favicon (`/favicon.svg`) loaded at 200 OK.
- ✅ **Responsiveness & UX:** Tested layout across mobile (320px, 375px), tablet (768px), desktop (1024px+), and ultrawide viewports.
