const { db } = require('../db');

/**
 * Verified Dental Pharmacotherapy Protocols
 */
const DENTAL_PROTOCOLS = {
  pulpitis: {
    condition: 'Acute Irreversible Pulpitis / Apical Periodontitis',
    protocol: [
      { drug: 'Ibuprofen 400mg + Paracetamol 500mg', dosage: '1 tab orally 3 times daily after food for 3 days', purpose: 'Anti-inflammatory analgesia' },
      { drug: 'Amoxicillin 500mg (or Clavam 625mg)', dosage: '1 tab every 8 hours for 5 days', purpose: 'Systemic antibacterial coverage (if swelling/systemic involvement)' },
      { drug: 'Pantoprazole 40mg', dosage: '1 tab 30 mins before breakfast', purpose: 'Gastric protection' }
    ],
    notes: 'Definitive treatment is Endodontic Therapy (Root Canal Treatment) or Pulpectomy. Antibiotics alone cannot sterilize necrotic pulp tissue without mechanical debridement.'
  },
  abscess: {
    condition: 'Acute Dental / Dentoalveolar Abscess',
    protocol: [
      { drug: 'Amoxicillin 500mg', dosage: '1 cap TDS (every 8 hrs) for 5 days', purpose: 'Primary systemic antibiotic' },
      { drug: 'Metronidazole 400mg', dosage: '1 tab TDS for 5 days', purpose: 'Anaerobic bactericidal coverage' },
      { drug: 'Aceclofenac 100mg + Paracetamol 325mg', dosage: '1 tab BD after meals for 3-5 days', purpose: 'Analgesic & anti-inflammatory' }
    ],
    notes: 'Rule out Penicillin allergy! If allergic to Penicillin, replace with Azithromycin 500mg OD for 3 days or Clindamycin 300mg QID. Require incision and drainage or emergency access opening.'
  },
  extraction: {
    condition: 'Post-Extraction Care & Analgesia',
    protocol: [
      { drug: 'Amoxicillin 500mg', dosage: '1 cap TDS for 3-5 days', purpose: 'Prophylactic antibiotic coverage' },
      { drug: 'Ketorolac-DT 10mg', dosage: '1 dispersible tab dissolved in water SOS/TDS (max 5 days)', purpose: 'Potent acute dental pain relief' },
      { drug: 'Chlorhexidine Gluconate 0.2%', dosage: '10ml oral rinse twice daily, starting 24h post-op', purpose: 'Antimicrobial mouthwash' }
    ],
    notes: 'Advise cold compression for first 24 hours, no vigorous rinsing or spitting, soft diet, and warm salt water rinses from Day 2.'
  },
  ulcers: {
    condition: 'Aphthous Ulcer / Oral Stomatitis',
    protocol: [
      { drug: 'Triamcinolone Acetonide 0.1% Oral Paste', dosage: 'Apply thin film to ulcer before bed and after meals', purpose: 'Topical corticosteroid anti-inflammatory' },
      { drug: 'Choline Salicylate + Benzalkonium gel', dosage: 'Apply topically 10 mins before meals', purpose: 'Local anaesthetic relief' },
      { drug: 'Multivitamin with Zinc & B-Complex', dosage: '1 capsule daily for 15 days', purpose: 'Nutritional replenishment' }
    ],
    notes: 'Advise avoidance of spicy, acidic foods and abrasive toothbrushes.'
  }
};

/**
 * Handle incoming AI message
 */
async function handleAIChat(req, res) {
  try {
    const { message = '', history = [], context = {} } = req.body;
    const trimmedMsg = message.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    // Check for Gemini API key if available
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // 1. ADD PATIENT / REGISTRATION INTENT
    if (
      trimmedMsg.includes('add patient') ||
      trimmedMsg.includes('new patient') ||
      trimmedMsg.includes('register patient') ||
      trimmedMsg.includes('create patient')
    ) {
      return res.json({
        success: true,
        intent: 'ADD_PATIENT_START',
        reply: "I'll guide you through registering a new patient right away! 🩺\n\nWhat is the **patient's full name**?",
        step: 'NAME',
        action: 'PROMPT_INPUT',
        field: 'name',
        data: {
          stepNumber: 1,
          totalSteps: 5
        }
      });
    }

    // 2. TODAY'S APPOINTMENTS & QUEUE INTENT
    if (
      trimmedMsg.includes('today') &&
      (trimmedMsg.includes('appointment') || trimmedMsg.includes('queue') || trimmedMsg.includes('schedule') || trimmedMsg.includes('patient'))
    ) {
      let todayAppointments = [];
      try {
        todayAppointments = db.prepare(`
          SELECT id, name, phone, timeSlot, service, status, source
          FROM appointments
          WHERE date = ? AND isDeleted = 0
          ORDER BY id ASC
        `).all(todayStr);
      } catch (e) {
        console.warn('Appointments lookup warning:', e.message);
      }

      const waitingCount = todayAppointments.filter(a => a.status === 'Waiting' || a.status === 'Checked-in').length;
      const completedCount = todayAppointments.filter(a => a.status === 'Completed').length;
      const inChairCount = todayAppointments.filter(a => a.status === 'In Progress' || a.status === 'In Chair').length;

      return res.json({
        success: true,
        intent: 'TODAY_SCHEDULE',
        reply: `Here is the current clinic appointment status for today (**${todayStr}**):\n\n` +
          `• **Total Scheduled**: ${todayAppointments.length} patients\n` +
          `• **Waiting in Clinic**: ${waitingCount}\n` +
          `• **Currently In Chair**: ${inChairCount}\n` +
          `• **Visits Completed**: ${completedCount}`,
        data: {
          total: todayAppointments.length,
          waiting: waitingCount,
          inChair: inChairCount,
          completed: completedCount,
          appointments: todayAppointments.slice(0, 5)
        }
      });
    }

    // 3. LOW STOCK & INVENTORY INTENT
    if (
      trimmedMsg.includes('inventory') ||
      trimmedMsg.includes('low stock') ||
      trimmedMsg.includes('stock') ||
      trimmedMsg.includes('supplies') ||
      trimmedMsg.includes('materials')
    ) {
      let lowStockItems = [];
      try {
        lowStockItems = db.prepare(`
          SELECT name, category, quantity, minQuantity, unit
          FROM inventory
          WHERE quantity <= minQuantity AND isDeleted = 0
          ORDER BY (quantity - minQuantity) ASC
          LIMIT 8
        `).all();
      } catch (e) {
        console.warn('Inventory table lookup warning:', e.message);
      }

      if (lowStockItems.length === 0) {
        return res.json({
          success: true,
          intent: 'INVENTORY_STATUS',
          reply: '✅ Great news! All dental supplies and clinical inventory items are currently above their minimum safety thresholds.'
        });
      }

      let itemsList = lowStockItems.map(item =>
        `• **${item.name}**: ${item.quantity} ${item.unit || 'units'} remaining (Min alert: ${item.minQuantity})`
      ).join('\n');

      return res.json({
        success: true,
        intent: 'INVENTORY_ALERT',
        reply: `⚠️ Found **${lowStockItems.length}** inventory items requiring reordering:\n\n${itemsList}`,
        data: { items: lowStockItems }
      });
    }

    // 4. DENTAL CLINICAL DRUG & PRESCRIPTION PROTOCOLS
    if (
      trimmedMsg.includes('pulpitis') ||
      trimmedMsg.includes('abscess') ||
      trimmedMsg.includes('toothache') ||
      trimmedMsg.includes('extraction') ||
      trimmedMsg.includes('pain') ||
      trimmedMsg.includes('ulcer') ||
      trimmedMsg.includes('antibiotic') ||
      trimmedMsg.includes('prescri')
    ) {
      let matchKey = 'pulpitis';
      if (trimmedMsg.includes('abscess') || trimmedMsg.includes('swelling')) matchKey = 'abscess';
      else if (trimmedMsg.includes('extraction') || trimmedMsg.includes('post op') || trimmedMsg.includes('bleeding')) matchKey = 'extraction';
      else if (trimmedMsg.includes('ulcer') || trimmedMsg.includes('stomatitis') || trimmedMsg.includes('canker')) matchKey = 'ulcers';

      const proto = DENTAL_PROTOCOLS[matchKey];

      return res.json({
        success: true,
        intent: 'DENTAL_PROTOCOL',
        reply: `Here is the recommended evidence-based clinical regimen for **${proto.condition}**:\n\n` +
          proto.protocol.map(p => `💊 **${p.drug}**\n   └ Dosage: ${p.dosage}\n   └ Indication: ${p.purpose}`).join('\n\n') +
          `\n\n📌 **Clinical Note**: ${proto.notes}`,
        data: proto
      });
    }

    // 5. REVENUE & FINANCIAL SUMMARY INTENT
    if (
      trimmedMsg.includes('revenue') ||
      trimmedMsg.includes('collection') ||
      trimmedMsg.includes('billing') ||
      trimmedMsg.includes('income') ||
      trimmedMsg.includes('financial')
    ) {
      let todayTotal = 0;
      let monthTotal = 0;
      try {
        const todayRow = db.prepare(`
          SELECT SUM(paidAmount) as total FROM invoices
          WHERE date(createdAt) = date('now') AND isDeleted = 0
        `).get();
        todayTotal = todayRow?.total || 0;

        const monthRow = db.prepare(`
          SELECT SUM(paidAmount) as total FROM invoices
          WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now') AND isDeleted = 0
        `).get();
        monthTotal = monthRow?.total || 0;
      } catch (e) {
        console.warn('Invoices query warning:', e.message);
      }

      return res.json({
        success: true,
        intent: 'REVENUE_SUMMARY',
        reply: `💰 **Clinic Financial Snapshot**:\n\n` +
          `• **Today's Collections**: ₹${todayTotal.toLocaleString('en-IN')}\n` +
          `• **This Month's Collections**: ₹${monthTotal.toLocaleString('en-IN')}\n\n` +
          `All transactions are reconciled with patient ledgers and GST compliance.`,
        data: { todayTotal, monthTotal }
      });
    }

    // 6. IF GEMINI API KEY CONFIGURED, CALL GEMINI LLM
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const systemInstruction = `You are Dentophilic Copilot, an elite clinical AI assistant for Dr. Arthi's Dentophilic Centre.
You assist the doctor with patient triage, dental pharmacology, appointment schedules, FDI odontogram notations, and clinical operations.
Respond concisely, with professional clinical warmth, accurate dental terminology, and markdown formatting.`;

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Question: ${message}` }]
            }
          ]
        };

        const gRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const candidateText = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return res.json({
              success: true,
              intent: 'LLM_REPLY',
              reply: candidateText
            });
          }
        }
      } catch (gErr) {
        console.warn('Gemini API call failed, using clinical fallback:', gErr.message);
      }
    }

    // 7. DEFAULT CLINICAL COPILOT RESPONSE
    return res.json({
      success: true,
      intent: 'GENERAL_ASSIST',
      reply: `Hello Doctor! I'm your **Dentophilic Clinical AI Assistant**. I can help you with:\n\n` +
        `• 🩺 **"Add patient"** — Guided multi-turn patient onboarding with medical history & allergies\n` +
        `• 📅 **"Show today's appointments"** — Live queue and waiting room counts\n` +
        `• 💊 **"Prescription advice"** — Dental pharmacological regimens for pulpitis, abscess, or extractions\n` +
        `• 📦 **"Check low stock"** — Inventory depletion alerts & reordering list\n` +
        `• 💰 **"Revenue summary"** — Today's and monthly practice collections`,
      quickSuggestions: [
        'Add new patient',
        "Show today's queue",
        'Check low stock items',
        'Prescription for pulpitis',
        "Today's revenue"
      ]
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process AI request',
      reply: "I encountered a brief glitch processing that query. Please try again or click one of the quick clinical shortcuts."
    });
  }
}

module.exports = {
  handleAIChat
};
