const { db } = require('../db');

/**
 * Multi-Lingual Language Detection Helper
 * Identifies: 'tamil' | 'tanglish' | 'hindi' | 'english'
 */
function detectLanguage(text = '') {
  if (!text) return 'english';

  // 1. Pure Tamil script Unicode range: \u0B80 - \u0BFF
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'tamil';
  }

  // 2. Pure Hindi / Devanagari script Unicode range: \u0900 - \u097F
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  const lower = text.toLowerCase();

  // 3. Tanglish (Tamil in English letters) phonetics and common colloquial markers
  const tanglishMarkers = [
    'vanakkam', 'sollu', 'solunga', 'enna', 'evlo', 'eppadi', 'epdi', 'irukku', 'irukka',
    'da', 'pa', 'pudhu', 'pannu', 'pannunga', 'kudu', 'kudunga', 'naalaiki', 'inniku',
    'velai', 'kaatu', 'kaatunga', 'seri', 'illai', 'theriyum', 'theriyala', 'poda',
    'podunga', 'vali', 'marunthu', 'vaanga', 'ponga', 'enga', 'parunga', 'aama'
  ];

  let tanglishScore = 0;
  for (const word of tanglishMarkers) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) tanglishScore++;
  }

  if (tanglishScore >= 1) {
    return 'tanglish';
  }

  // 4. Romanized Hindi common markers
  const hindiMarkers = [
    'namaste', 'kaise', 'kaisa', 'aaj', 'kal', 'batao', 'karo', 'karna', 'kya',
    'hai', 'hain', 'dawai', 'dard', 'mariz', 'kitna', 'kitne', 'shukriya', 'dhanbad'
  ];

  let hindiScore = 0;
  for (const word of hindiMarkers) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) hindiScore++;
  }

  if (hindiScore >= 1) {
    return 'hindi';
  }

  return 'english';
}

/**
 * Verified Evidence-Based Dental Pharmacotherapy Protocols
 */
const DENTAL_PROTOCOLS = {
  pulpitis: {
    condition: 'Acute Irreversible Pulpitis / Apical Periodontitis',
    tamilTitle: 'கடுமையான பல் கூழ் அழற்சி (Pulpitis)',
    protocol: [
      { drug: 'Ibuprofen 400mg + Paracetamol 500mg', dosage: '1 tab TDS after meals for 3 days', purpose: 'Potent anti-inflammatory analgesia' },
      { drug: 'Amoxicillin 500mg (or Clavam 625mg)', dosage: '1 tab TDS for 5 days', purpose: 'Systemic antibacterial coverage (if swelling/fever)' },
      { drug: 'Pantoprazole 40mg', dosage: '1 tab 30 mins before breakfast', purpose: 'Gastric mucosal protection' }
    ],
    notes: 'Definitive treatment: Root Canal Treatment (RCT) or Pulpectomy. Antibiotics alone cannot sterilize necrotic pulp tissue.'
  },
  abscess: {
    condition: 'Acute Dental / Dentoalveolar Abscess',
    tamilTitle: 'பல் சீழ் கட்டி (Dental Abscess)',
    protocol: [
      { drug: 'Amoxicillin 500mg', dosage: '1 cap TDS (every 8 hrs) for 5 days', purpose: 'Primary systemic bactericidal antibiotic' },
      { drug: 'Metronidazole 400mg', dosage: '1 tab TDS for 5 days', purpose: 'Obligate anaerobic coverage' },
      { drug: 'Aceclofenac 100mg + Paracetamol 325mg', dosage: '1 tab BD after food for 3-5 days', purpose: 'Analgesic & anti-inflammatory' }
    ],
    notes: 'Rule out Penicillin allergy! If allergic, prescribe Azithromycin 500mg OD for 3 days or Clindamycin 300mg QID. Require immediate drainage/access opening.'
  },
  extraction: {
    condition: 'Post-Extraction Care & Analgesia',
    tamilTitle: 'பல் பிடுங்கிய பின் சிகிச்சை (Post-Extraction Care)',
    protocol: [
      { drug: 'Amoxicillin 500mg', dosage: '1 cap TDS for 3-5 days', purpose: 'Prophylactic infection prevention' },
      { drug: 'Ketorolac-DT 10mg', dosage: '1 dispersible tab in water SOS/TDS (max 5 days)', purpose: 'Acute dental pain management' },
      { drug: 'Chlorhexidine Gluconate 0.2%', dosage: '10ml oral rinse BD, starting 24h post-op', purpose: 'Antimicrobial plaque control' }
    ],
    notes: 'Advise cold icepack for first 24h, no spitting or straw drinking, soft diet, and warm salt water rinses from Day 2.'
  },
  pericoronitis: {
    condition: 'Acute Pericoronitis (Wisdom Tooth Operculum Infection)',
    tamilTitle: 'ஞானப்பல் வீக்கம் / சீழ் அழற்சி (Pericoronitis)',
    protocol: [
      { drug: 'Amoxicillin 500mg + Metronidazole 400mg', dosage: 'TDS after meals for 5 days', purpose: 'Mixed aerobic & anaerobic coverage' },
      { drug: 'Ibuprofen 400mg', dosage: 'TDS after food for 3 days', purpose: 'Anti-inflammatory for trismus & pain' },
      { drug: 'Warm Saline Rinses + Chlorhexidine 0.2%', dosage: 'Frequent warm rinses to debride flap', purpose: 'Local debridement' }
    ],
    notes: 'Irrigate operculum under lower 3rd molar with Betadine/saline. Plan operculectomy or extraction once acute symptoms subside.'
  },
  ulcers: {
    condition: 'Aphthous Ulcer / Oral Stomatitis',
    tamilTitle: 'வாய் புண் / வாய்ப்புண் (Aphthous Stomatitis)',
    protocol: [
      { drug: 'Triamcinolone Acetonide 0.1% Oral Paste', dosage: 'Apply thin film to ulcer before bed and after meals', purpose: 'Topical corticosteroid anti-inflammatory' },
      { drug: 'Choline Salicylate + Benzalkonium gel', dosage: 'Apply topically 10 mins before food', purpose: 'Local anaesthetic pain relief' },
      { drug: 'Multivitamin with Zinc & B-Complex', dosage: '1 capsule daily for 15 days', purpose: 'Nutritional replenishment' }
    ],
    notes: 'Advise avoidance of spicy, acidic foods and abrasive toothbrushes.'
  }
};

/**
 * Handle incoming AI message with full function calling and multi-lingual reasoning
 */
async function handleAIChat(req, res) {
  try {
    const { message = '', history = [], context = {} } = req.body;
    const trimmedMsg = message.trim();
    const lower = trimmedMsg.toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];

    // Detect User Language
    const lang = detectLanguage(trimmedMsg);

    // Check for API Key in clinic_settings or process.env
    let geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      try {
        const settingRow = db.prepare("SELECT value FROM clinic_settings WHERE key = 'gemini_api_key'").get();
        if (settingRow && settingRow.value) {
          geminiApiKey = settingRow.value;
        }
      } catch (e) {}
    }

    // =========================================================================
    // 1. ADD / REGISTER PATIENT INTENT
    // =========================================================================
    const isAddPatient =
      lower.includes('add patient') ||
      lower.includes('new patient') ||
      lower.includes('register patient') ||
      lower.includes('create patient') ||
      lower.includes('patient add') ||
      lower.includes('pudhu patient') ||
      lower.includes('oru patient add') ||
      lower.includes('patient create') ||
      trimmedMsg.includes('புதிய நோயாளி') ||
      trimmedMsg.includes('நோயாளி சேர்க்க') ||
      lower.includes('patient add karo') ||
      lower.includes('naya patient');

    if (isAddPatient) {
      let replyText = "I'll guide you through registering a new patient right away! 🩺\n\nWhat is the **patient's full name**?";
      if (lang === 'tamil') {
        replyText = "வணக்கம் டாக்டர்! புதிய நோயாளியை பதிவு செய்ய உதவுகிறேன்! 🩺\n\nநோயாளியின் **முழு பெயர்** என்ன?";
      } else if (lang === 'tanglish') {
        replyText = "Kandippa Doctor! Pudhu patient registration ippo start pannalam! 🩺\n\nPatient oda **Full Name** enna da?";
      } else if (lang === 'hindi') {
        replyText = "नमस्ते डॉक्टर! नए मरीज को रजिस्टर करने में मदद करता हूँ! 🩺\n\nमरीज का **पूरा नाम** क्या है?";
      }

      return res.json({
        success: true,
        intent: 'ADD_PATIENT_START',
        language: lang,
        reply: replyText,
        step: 'NAME',
        action: 'PROMPT_INPUT',
        field: 'name',
        data: { stepNumber: 1, totalSteps: 5 }
      });
    }

    // =========================================================================
    // 2. SEARCH / FIND PATIENT INTENT (e.g. "Find patient Priya", "Priya history kaatu")
    // =========================================================================
    const isPatientSearch =
      lower.startsWith('find patient') ||
      lower.startsWith('search patient') ||
      lower.startsWith('show patient') ||
      lower.includes('patient history') ||
      lower.includes('history kaatu') ||
      lower.includes('patient details') ||
      lower.includes('details sollu') ||
      lower.includes('patient dhoondo') ||
      trimmedMsg.includes('நோயாளி தேடு');

    if (isPatientSearch) {
      // Extract query term
      let searchTerm = lower
        .replace(/find patient|search patient|show patient|patient history|history kaatu|patient details|details sollu|patient dhoondo|patient|details|history|kaatu|sollu|dhoondo|thedu|oda|நோயாளி|தேடு/gi, '')
        .trim();

      if (!searchTerm && trimmedMsg.split(' ').length > 1) {
        searchTerm = trimmedMsg.split(' ').slice(1).join(' ').trim();
      }

      if (searchTerm) {
        const foundPatients = db.prepare(`
          SELECT * FROM patients
          WHERE isDeleted = 0 AND (name LIKE ? OR phone LIKE ? OR patientId LIKE ?)
          ORDER BY id DESC LIMIT 5
        `).all(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);

        if (foundPatients.length > 0) {
          const p = foundPatients[0];
          // Get patient recent appointments
          const appts = db.prepare(`
            SELECT id, date, timeSlot, service, status
            FROM appointments
            WHERE (patientId = ? OR phone = ?) AND isDeleted = 0
            ORDER BY date DESC LIMIT 3
          `).all(p.id, p.phone);

          let replyText = `Found patient record for **${p.name}** (${p.patientId}):\n\n` +
            `• **Phone**: ${p.phone}\n` +
            `• **Demographics**: ${p.age ? `${p.age} yrs` : 'Age N/A'}, ${p.gender}\n` +
            `• **Allergies**: ${p.allergies || 'No known allergies'}\n` +
            `• **Medical History**: ${p.medicalHistory || 'None noted'}\n` +
            `• **Recent Visits**: ${appts.length > 0 ? appts.map(a => `${a.date} (${a.service} - ${a.status})`).join(', ') : 'No prior appointments recorded'}`;

          if (lang === 'tanglish') {
            replyText = `**${p.name}** (${p.patientId}) oda details kedaichirukku Doctor! 📋\n\n` +
              `• **Phone**: ${p.phone}\n` +
              `• **Vayasu & Gender**: ${p.age || 'N/A'} yrs • ${p.gender}\n` +
              `• **Allergies**: ${p.allergies || 'No allergies'}\n` +
              `• **Medical History**: ${p.medicalHistory || 'None'}\n` +
              `• **Kadasiya vandhadhu**: ${appts.length > 0 ? appts[0].date + ' - ' + appts[0].service : 'Pudhu patient'}`;
          } else if (lang === 'tamil') {
            replyText = `நோயாளி **${p.name}** (${p.patientId}) அவர்களின் மருத்துவ விவரங்கள் கிடைத்தன:\n\n` +
              `• **அலைபேசி**: ${p.phone}\n` +
              `• **வயது & பாலினம்**: ${p.age || 'N/A'} வயது • ${p.gender}\n` +
              `• **ஒவ்வாமை (Allergies)**: ${p.allergies || 'எதுவுமில்லை'}\n` +
              `• **முந்தைய சிகிச்சை**: ${appts.length > 0 ? appts[0].service : 'புதிய நோயாளி'}`;
          }

          return res.json({
            success: true,
            intent: 'PATIENT_SEARCH_RESULT',
            language: lang,
            reply: replyText,
            patientData: p,
            recentAppointments: appts
          });
        } else {
          let notFoundMsg = `No patient found matching "${searchTerm}". Would you like to register them as a new patient?`;
          if (lang === 'tanglish') notFoundMsg = `"${searchTerm}" nu entha patient um kedaikala da. Pudhu patient ah add pannalama?`;
          else if (lang === 'tamil') notFoundMsg = `"${searchTerm}" என்ற பெயரில் எந்த நோயாளியும் கிடைக்கவில்லை. புதிய நோயாளியாக சேர்க்கலாமா?`;

          return res.json({
            success: true,
            intent: 'PATIENT_NOT_FOUND',
            language: lang,
            reply: notFoundMsg,
            suggestions: [`Add patient ${searchTerm}`, "Today's queue & schedule"]
          });
        }
      }
    }

    // =========================================================================
    // 3. TODAY'S APPOINTMENTS & QUEUE INTENT
    // =========================================================================
    const isQueueQuery =
      lower.includes('today') ||
      lower.includes('queue') ||
      lower.includes('inniku') ||
      lower.includes('aaj') ||
      trimmedMsg.includes('இன்றைய') ||
      lower.includes('waiting');

    if (isQueueQuery && (lower.includes('appointment') || lower.includes('patient') || lower.includes('queue') || lower.includes('schedule') || lower.includes('vandhanga') || lower.includes('irukku') || trimmedMsg.includes('வரிசை'))) {
      const todayAppointments = db.prepare(`
        SELECT id, name, phone, timeSlot, service, status, source
        FROM appointments
        WHERE date = ? AND isDeleted = 0
        ORDER BY id ASC
      `).all(todayStr);

      const waitingCount = todayAppointments.filter(a => a.status === 'Waiting' || a.status === 'Checked-in').length;
      const completedCount = todayAppointments.filter(a => a.status === 'Completed').length;
      const inChairCount = todayAppointments.filter(a => a.status === 'In Progress' || a.status === 'In Chair').length;

      let replyText = `Here is today's (**${todayStr}**) live clinic queue status:\n\n` +
        `• **Total Scheduled**: ${todayAppointments.length} patients\n` +
        `• **Waiting in Clinic**: ${waitingCount}\n` +
        `• **Currently In Chair**: ${inChairCount}\n` +
        `• **Visits Completed**: ${completedCount}`;

      if (lang === 'tanglish') {
        replyText = `Inniku (**${todayStr}**) clinic queue status idho da: 📅\n\n` +
          `• **Moththa Patients**: ${todayAppointments.length} per\n` +
          `• **Waiting Hall la**: ${waitingCount} per irukanga\n` +
          `• **Chair la (Treatment)**: ${inChairCount} per\n` +
          `• **Mudinjadhu (Completed)**: ${completedCount} visits`;
      } else if (lang === 'tamil') {
        replyText = `இன்றைய (**${todayStr}**) கிளினிக் வரிசை நிலை விவரம்:\n\n` +
          `• **மொத்த அப்பாயின்ட்மென்ட்கள்**: ${todayAppointments.length} நோயாளிகள்\n` +
          `• **காத்திருப்போர் அறையில்**: ${waitingCount} நபர்கள்\n` +
          `• **சிகிச்சையில் உள்ளோர்**: ${inChairCount} நபர்கள்\n` +
          `• **சிகிச்சை முடிவடைந்தது**: ${completedCount} நபர்கள்`;
      } else if (lang === 'hindi') {
        replyText = `आज (**${todayStr}**) की क्लिनिक स्थिति:\n\n` +
          `• **कुल मरीज**: ${todayAppointments.length}\n` +
          `• **वेटिंग रूम में**: ${waitingCount}\n` +
          `• **चेयर पर इलाज चल रहा है**: ${inChairCount}\n` +
          `• **पूरा हुआ**: ${completedCount}`;
      }

      return res.json({
        success: true,
        intent: 'TODAY_SCHEDULE',
        language: lang,
        reply: replyText,
        data: {
          total: todayAppointments.length,
          waiting: waitingCount,
          inChair: inChairCount,
          completed: completedCount,
          appointments: todayAppointments.slice(0, 5)
        }
      });
    }

    // =========================================================================
    // 4. INVENTORY / STOCK QUERY INTENT (e.g. "lidocaine stock irukka?", "gloves count")
    // =========================================================================
    const isInventoryQuery =
      lower.includes('stock') ||
      lower.includes('inventory') ||
      lower.includes('lidocaine') ||
      lower.includes('gloves') ||
      lower.includes('composite') ||
      lower.includes('needle') ||
      lower.includes('supplies') ||
      lower.includes('materials') ||
      trimmedMsg.includes('இருப்பு');

    if (isInventoryQuery) {
      // Check if querying a specific material
      let specificItem = null;
      if (lower.includes('lidocaine') || lower.includes('lignocaine') || lower.includes('la')) specificItem = 'Lidocaine';
      else if (lower.includes('glove')) specificItem = 'Glove';
      else if (lower.includes('composite')) specificItem = 'Composite';
      else if (lower.includes('needle')) specificItem = 'Needle';
      else if (lower.includes('cotton')) specificItem = 'Cotton';
      else if (lower.includes('suction')) specificItem = 'Suction';
      else if (lower.includes('cement')) specificItem = 'Cement';

      if (specificItem) {
        const itemRow = db.prepare(`
          SELECT name, category, currentStock, minThreshold, unit, supplier
          FROM inventory_items
          WHERE name LIKE ? AND isDeleted = 0
          LIMIT 1
        `).get(`%${specificItem}%`);

        if (itemRow) {
          const isLow = itemRow.currentStock <= itemRow.minThreshold;
          let replyText = `📦 **${itemRow.name}** stock status:\n\n` +
            `• **Current Stock**: ${itemRow.currentStock} ${itemRow.unit || 'units'}\n` +
            `• **Safety Alert Level**: ${itemRow.minThreshold} ${itemRow.unit || 'units'}\n` +
            `• **Status**: ${isLow ? '⚠️ LOW STOCK - Reorder recommended' : '✅ Sufficient Stock available'}`;

          if (lang === 'tanglish') {
            replyText = `📦 **${itemRow.name}** stock idho da:\n\n` +
              `• **Ippo irukkuradhu**: ${itemRow.currentStock} ${itemRow.unit || 'units'}\n` +
              `• **Minimum theva**: ${itemRow.minThreshold} ${itemRow.unit || 'units'}\n` +
              `• **Status**: ${isLow ? '⚠️ Stock kammiya irukku, reorder pannunga!' : '✅ Nalla stock irukku da!'}`;
          } else if (lang === 'tamil') {
            replyText = `📦 **${itemRow.name}** இருப்பு விவரம்:\n\n` +
              `• **தற்போதைய இருப்பு**: ${itemRow.currentStock} ${itemRow.unit || 'அளவுகள்'}\n` +
              `• **குறைந்தபட்ச வரம்பு**: ${itemRow.minThreshold}\n` +
              `• **நிலை**: ${isLow ? '⚠️ இருப்பு குறைவாக உள்ளது - உடனே ஆர்டர் செய்யவும்' : '✅ போதுமான இருப்பு உள்ளது'}`;
          }

          return res.json({
            success: true,
            intent: 'INVENTORY_ITEM',
            language: lang,
            reply: replyText,
            itemData: itemRow
          });
        }
      }

      // General low stock check
      const lowStockItems = db.prepare(`
        SELECT name, category, currentStock, minThreshold, unit
        FROM inventory_items
        WHERE currentStock <= minThreshold AND isDeleted = 0
        ORDER BY (currentStock - minThreshold) ASC
        LIMIT 8
      `).all();

      if (lowStockItems.length === 0) {
        let okMsg = "✅ Great news Doctor! All dental materials and supplies are currently above their safety reorder thresholds.";
        if (lang === 'tanglish') okMsg = "✅ Super Doctor! Ella clinical materials um nalla stock la irukku, ethuvum kammiya illa!";
        else if (lang === 'tamil') okMsg = "✅ கிளினிக்கில் உள்ள அனைத்து பல் மருத்துவ பொருட்களும் போதுமான அளவில் உள்ளன.";

        return res.json({
          success: true,
          intent: 'INVENTORY_STATUS',
          language: lang,
          reply: okMsg
        });
      }

      let itemsList = lowStockItems.map(item =>
        `• **${item.name}**: ${item.currentStock} ${item.unit || 'units'} (Min: ${item.minThreshold})`
      ).join('\n');

      let replyText = `⚠️ Found **${lowStockItems.length}** inventory items requiring reordering:\n\n${itemsList}`;
      if (lang === 'tanglish') {
        replyText = `⚠️ **${lowStockItems.length}** materials stock kammiya irukku da, reorder pannidanum:\n\n${itemsList}`;
      } else if (lang === 'tamil') {
        replyText = `⚠️ **${lowStockItems.length}** பொருட்கள் குறைவாக உள்ளன, உடனே வாங்க வேண்டும்:\n\n${itemsList}`;
      }

      return res.json({
        success: true,
        intent: 'INVENTORY_ALERT',
        language: lang,
        reply: replyText,
        data: { items: lowStockItems }
      });
    }

    // =========================================================================
    // 5. EXPENSE RECORDING INTENT (e.g. "add expense 1500 for gloves")
    // =========================================================================
    const isExpenseAdd =
      (lower.includes('expense') || lower.includes('selavu') || trimmedMsg.includes('செலவு')) &&
      (lower.includes('add') || lower.includes('record') || lower.includes('podu') || lower.includes('pannu') || /\d+/.test(lower));

    if (isExpenseAdd) {
      const amountMatch = lower.match(/(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)/i);
      if (amountMatch) {
        const amount = parseFloat(amountMatch[1]);
        let category = 'Supplies';
        if (lower.includes('rent')) category = 'Rent';
        else if (lower.includes('lab')) category = 'Lab Charges';
        else if (lower.includes('salary')) category = 'Salary';
        else if (lower.includes('equipment') || lower.includes('instrument')) category = 'Equipment';
        else if (lower.includes('utilit') || lower.includes('current') || lower.includes('eb')) category = 'Utilities';

        const desc = trimmedMsg.replace(/(?:add|record|expense|selavu|pannu|podu|செலவு|\d+|₹|rs\.?|inr)/gi, '').trim() || 'Clinic supplies & operational expense';

        try {
          const insertStmt = db.prepare(`
            INSERT INTO expenses (category, description, amount, expenseDate, paymentMode, recordedBy, createdAt, isDeleted)
            VALUES (?, ?, ?, ?, 'Cash', ?, datetime('now'), 0)
          `);
          const result = insertStmt.run(category, desc, amount, todayStr, req.user?.id || 1);

          let replyText = `✅ Recorded expense of **₹${amount.toLocaleString('en-IN')}** under **${category}** ("${desc}"). Transaction permanently saved to ledger.`;
          if (lang === 'tanglish') {
            replyText = `✅ Super da! **₹${amount.toLocaleString('en-IN')}** (${category} - "${desc}") expense ledger la enter aagirukku!`;
          } else if (lang === 'tamil') {
            replyText = `✅ **₹${amount.toLocaleString('en-IN')}** (${category}) செலவு கணக்கில் வெற்றிகரமாக பதிவு செய்யப்பட்டது!`;
          }

          return res.json({
            success: true,
            intent: 'EXPENSE_RECORDED',
            language: lang,
            reply: replyText,
            expenseData: { id: result.lastInsertRowid, amount, category, description: desc, date: todayStr }
          });
        } catch (e) {
          console.error('Expense record error:', e.message);
        }
      }
    }

    // =========================================================================
    // 6. DENTAL CLINICAL DRUG & PRESCRIPTION REGIMENS
    // =========================================================================
    const isDentalMed =
      lower.includes('pulpitis') ||
      lower.includes('abscess') ||
      lower.includes('toothache') ||
      lower.includes('extraction') ||
      lower.includes('pericoronitis') ||
      lower.includes('wisdom') ||
      lower.includes('pain') ||
      lower.includes('vali') ||
      lower.includes('ulcer') ||
      lower.includes('antibiotic') ||
      lower.includes('prescri') ||
      lower.includes('marunthu') ||
      lower.includes('dawai') ||
      trimmedMsg.includes('மருந்து') ||
      trimmedMsg.includes('வலி');

    if (isDentalMed) {
      let matchKey = 'pulpitis';
      if (lower.includes('abscess') || lower.includes('swelling') || lower.includes('pus') || lower.includes('veekam') || trimmedMsg.includes('சீழ்')) matchKey = 'abscess';
      else if (lower.includes('pericoronitis') || lower.includes('wisdom') || lower.includes('gnana')) matchKey = 'pericoronitis';
      else if (lower.includes('extraction') || lower.includes('post op') || lower.includes('bleeding') || lower.includes('pidungiya')) matchKey = 'extraction';
      else if (lower.includes('ulcer') || lower.includes('stomatitis') || lower.includes('pun') || trimmedMsg.includes('புண்')) matchKey = 'ulcers';

      const proto = DENTAL_PROTOCOLS[matchKey];

      let replyText = `Here is the recommended evidence-based clinical regimen for **${proto.condition}**:\n\n` +
        proto.protocol.map(p => `💊 **${p.drug}**\n   └ Dosage: ${p.dosage}\n   └ Purpose: ${p.purpose}`).join('\n\n') +
        `\n\n📌 **Clinical Note**: ${proto.notes}`;

      if (lang === 'tanglish') {
        replyText = `**${proto.condition}** ku standard dental pharmacological regimen idho da: 💊\n\n` +
          proto.protocol.map(p => `💊 **${p.drug}**\n   └ Dosage: ${p.dosage}\n   └ Benefit: ${p.purpose}`).join('\n\n') +
          `\n\n📌 **Doctor Note**: ${proto.notes}\n*(Penicillin allergy irukkanu check panniko da!)*`;
      } else if (lang === 'tamil') {
        replyText = `**${proto.tamilTitle || proto.condition}** க்கான பரிந்துரைக்கப்பட்ட மருந்துகள்:\n\n` +
          proto.protocol.map(p => `💊 **${p.drug}**\n   └ அளவு (Dosage): ${p.dosage}\n   └ காரணம்: ${p.purpose}`).join('\n\n') +
          `\n\n📌 **மருத்துவ குறிப்பு**: ${proto.notes}`;
      }

      return res.json({
        success: true,
        intent: 'DENTAL_PROTOCOL',
        language: lang,
        reply: replyText,
        data: proto
      });
    }

    // =========================================================================
    // 7. REVENUE & FINANCIAL SNAPSHOT
    // =========================================================================
    const isRevenueQuery =
      lower.includes('revenue') ||
      lower.includes('collection') ||
      lower.includes('billing') ||
      lower.includes('income') ||
      lower.includes('financial') ||
      lower.includes('vasool') ||
      trimmedMsg.includes('வருமானம்') ||
      trimmedMsg.includes('வசூல்');

    if (isRevenueQuery) {
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
      } catch (e) {}

      let replyText = `💰 **Clinic Financial Snapshot**:\n\n` +
        `• **Today's Collections**: ₹${todayTotal.toLocaleString('en-IN')}\n` +
        `• **This Month's Collections**: ₹${monthTotal.toLocaleString('en-IN')}\n\n` +
        `All transactions are reconciled with patient ledgers.`;

      if (lang === 'tanglish') {
        replyText = `💰 Inniku collection status idho da:\n\n` +
          `• **Inniku Collection**: ₹${todayTotal.toLocaleString('en-IN')}\n` +
          `• **Indha Maasam Total**: ₹${monthTotal.toLocaleString('en-IN')}\n\n` +
          `Ella invoices um settled and balance ledger la updated!`;
      } else if (lang === 'tamil') {
        replyText = `💰 **கிளினிக் வருவாய் விவரம்**:\n\n` +
          `• **இன்றைய வசூல்**: ₹${todayTotal.toLocaleString('en-IN')}\n` +
          `• **இந்த மாத மொத்த வசூல்**: ₹${monthTotal.toLocaleString('en-IN')}\n\n` +
          `அனைத்து கட்டண விவரங்களும் கணக்கில் சரியாக உள்ளன.`;
      }

      return res.json({
        success: true,
        intent: 'REVENUE_SUMMARY',
        language: lang,
        reply: replyText,
        data: { todayTotal, monthTotal }
      });
    }

    // =========================================================================
    // 8. CALL GOOGLE GEMINI LLM IF API KEY CONFIGURED
    // =========================================================================
    if (geminiApiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`;
        const systemPrompt = `You are Dentophilic Copilot, an elite clinical AI assistant for Dr. Arthi's Dentophilic Centre.
You assist the doctor with patient care, dental pharmacology, appointment schedules, FDI odontogram notations, and clinical operations.
CRITICAL LANGUAGE INSTRUCTION:
- If user texts in Tamil (தமிழ்), reply strictly in fluent, respectful, natural Tamil.
- If user texts in Tanglish (Tamil in English letters like "vanakkam da", "sollu da"), reply in friendly, warm, professional Tanglish matching their tone.
- If user texts in Hindi, reply in Hindi.
- If user texts in English, reply in professional clinical English.
Keep replies medically accurate, concise, and structured with clean markdown.`;

        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nUser Message: ${message}` }]
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
              language: lang,
              reply: candidateText
            });
          }
        }
      } catch (gErr) {
        console.warn('Gemini API call warning:', gErr.message);
      }
    }

    // =========================================================================
    // 9. MULTI-LINGUAL GENERAL GREETING / CLINICAL COPILOT RESPONSE
    // =========================================================================
    if (lang === 'tanglish') {
      return res.json({
        success: true,
        intent: 'GENERAL_ASSIST',
        language: lang,
        reply: `Vanakkam Doctor! Ennala enna pannanum சொல்லுங்க da: 🩺\n\n` +
          `• 🩺 **"Add patient"** / **"pudhu patient"** — Guided multi-turn patient onboarding\n` +
          `• 🔍 **"Find patient Priya"** — Patient medical history & files\n` +
          `• 📅 **"Inniku evlo patient"** / **"Queue status"** — Live waiting list\n` +
          `• 💊 **"Pulpitis vali ku medicine"** — Exact dental drug dosages\n` +
          `• 📦 **"Lidocaine stock irukka"** — Inventory check & alerts\n` +
          `• 💰 **"Inniku collection"** — Practice revenue metrics`,
        quickSuggestions: [
          'Oru pudhu patient add pannu',
          'Inniku evlo patient vandhanga?',
          'Lidocaine stock irukka?',
          'Pulpitis ku enna medicine?',
          'Inniku collection evlo?'
        ]
      });
    }

    if (lang === 'tamil') {
      return res.json({
        success: true,
        intent: 'GENERAL_ASSIST',
        language: lang,
        reply: `வணக்கம் டாக்டர்! நான் தங்களின் டென்டோஃபிலிக் AI மருத்துவ உதவியாளர். நான் தங்களுக்கு எவ்வாறு உதவ முடியும்? 🩺\n\n` +
          `• 🩺 **"புதிய நோயாளி"** — படிபடியான நோயாளி பதிவு\n` +
          `• 🔍 **"நோயாளி தேடு"** — மருத்துவ வரலாறு மற்றும் விவரங்கள்\n` +
          `• 📅 **"இன்றைய வரிசை"** — காத்திருக்கும் நோயாளிகள் விவரம்\n` +
          `• 💊 **"பல் வலி மருந்து"** — துல்லியமான மருத்துவ மருந்து வழிகாட்டி\n` +
          `• 📦 **"இருப்பு நிலை"** — மருத்துவப் பொருட்கள் இருப்பு\n` +
          `• 💰 **"இன்றைய வருமானம்"** — கிளினிக் கட்டண வசூல் விவரம்`,
        quickSuggestions: [
          'புதிய நோயாளி சேர்க்க',
          'இன்றைய அப்பாயின்ட்மென்ட்கள்',
          'பல் வலிக்கு என்ன மருந்து?',
          'இருப்பு குறைவாக உள்ள பொருட்கள்',
          'இன்றைய வருமானம்'
        ]
      });
    }

    if (lang === 'hindi') {
      return res.json({
        success: true,
        intent: 'GENERAL_ASSIST',
        language: lang,
        reply: `नमस्ते डॉक्टर! मैं आपका डेंटोफिलिक AI असिस्टेंट हूँ। मैं आपकी क्लिनिकल देखभाल में मदद कर सकता हूँ: 🩺\n\n` +
          `• 🩺 **"Naya patient add karo"** — मरीज का पंजीकरण\n` +
          `• 📅 **"Aaj kitne patient hain"** — आज का शेड्यूल और वेटिंग लिस्ट\n` +
          `• 💊 **"Dant dard ki dawai"** — डेंटल दवाओं की सही खुराक\n` +
          `• 📦 **"Stock check karo"** — इन्वेंट्री स्थिति\n` +
          `• 💰 **"Aaj ka collection"** — आज की आय`,
        quickSuggestions: [
          'Naya patient add karo',
          'Aaj ka schedule dikhao',
          'Dant dard ki dawai',
          'Stock check karo'
        ]
      });
    }

    // Default English
    return res.json({
      success: true,
      intent: 'GENERAL_ASSIST',
      language: lang,
      reply: `Hello Doctor! I'm your **Dentophilic Clinical AI Assistant**. I can execute actions and answer in **English, Tamil (தமிழ்), Tanglish, or Hindi**: 🩺\n\n` +
        `• 🩺 **"Add patient"** / **"Pudhu patient add pannu"** — Guided patient registration\n` +
        `• 🔍 **"Find patient [name]"** — Lookup clinical history & appointment file\n` +
        `• 📅 **"Today's queue & appointments"** — Live waiting room & chair counts\n` +
        `• 💊 **"Prescription for pulpitis / abscess"** — Evidence-based dental pharmacotherapy\n` +
        `• 📦 **"Lidocaine stock"** / **"Low stock alert"** — Real-time material depletion\n` +
        `• 💰 **"Today's revenue"** — Live financial collection summary`,
      quickSuggestions: [
        'Add new patient',
        "Today's queue & schedule",
        'Check Lidocaine stock',
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
