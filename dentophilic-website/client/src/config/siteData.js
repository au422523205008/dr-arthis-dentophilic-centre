// Dr. Arthi's Dentophilic Centre - Site Configuration & Content
// All clinic details, services, copy, testimonials, and hours are managed here for effortless customization.

export const siteData = {
  clinic: {
    name: "Dr. Arthi's Dentophilic Centre",
    shortName: "Dentophilic Centre",
    tagline: "Crafting Confident, Radiant Smiles With Gentle Modern Dentistry",
    subheadline: "Experience painless dental treatments, advanced digital precision, and compassionate patient-first care in Hosur.",
    phone: "+91 95971 26248",
    phoneDisplay: "+91 95971 26248",
    phoneRaw: "9597126248",
    email: "drarthidentophilic@gmail.com",
    address: {
      line1: "1st Floor, Pk Complex, Muneeshwar Nagar",
      line2: "Esi Ring Road, Muneeswara Nagar",
      city: "Hosur",
      state: "Tamil Nadu",
      pincode: "635109",
      full: "1st Floor, Pk Complex, Muneeshwar Nagar, Esi Ring Road, Muneeswara Nagar, Hosur - 635109, Tamil Nadu"
    },
    googleMapsUrl: "https://maps.google.com/?q=Pk+Complex+Muneeshwar+Nagar+Esi+Ring+Road+Hosur+Tamil+Nadu+635109",
    mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3890.68652033604!2d77.8251239!3d12.7340381!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae713f01b1b1b1%3A0x286392576b51c88!2sMuneeshwar%20Nagar%2C%20Hosur%2C%20Tamil%20Nadu%20635109!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin",
    rating: {
      score: 4.9,
      reviewsCount: 50,
      badgeText: "Google Verified 4.9 ★ Rating (50+ Patient Reviews)"
    },
    hours: [
      { days: "Monday - Saturday", morning: "10:00 AM - 01:30 PM", evening: "05:00 PM - 08:30 PM" },
      { days: "Sunday", morning: "By Prior Appointment Only", evening: "Emergency On-Call" }
    ],
    whatsappMessage: "Hello Dr. Arthi's Dentophilic Centre, I would like to book a dental consultation.",
    instagramUrl: "https://www.instagram.com/dr.arthis_dentalclinic_hosur/",
    instagramHandle: "@dr.arthis_dentalclinic_hosur"
  },

  doctor: {
    name: "Dr. Arthi Mukeshkannan",
    qualification: "B.D.S",
    title: "General Dental Surgeon & Chief Dentist",
    badge: "CHIEF DENTIST",
    tndcRegNo: "31263",
    experienceYears: "10+",
    bio: "Dedicated to providing exceptional dental care with modern technology, personalized treatment plans, and a patient-first approach. With over a decade of clinical excellence, Dr. Arthi combines gentle, anxiety-free procedures with cutting-edge dental innovations to help patients of all ages achieve healthy, radiant smiles.",
    photo: "/doctor-arthi.png",
    highlights: [
      { title: "10+ Years Experience", desc: "Decade of clinical excellence in advanced oral surgery & esthetics" },
      { title: "5,000+ Happy Patients", desc: "Trusted by families across Hosur and neighboring regions" },
      { title: "Gentle & Painless Protocol", desc: "Computerized rotary systems and painless anesthesia techniques" },
      { title: "Strict Hospital-Grade Sterilization", desc: "Class-B vacuum autoclave & 100% disposable barrier protection" }
    ],
    checklist: [
      "Certified in Advanced Rotary Endodontics & Single-Sitting RCT",
      "Specialist in Aesthetic Smile Design & Ceramic Restorations",
      "Trained in Pediatric Dental Psychology for Fear-Free Kids Care",
      "Comprehensive Oral Health Screenings with Digital Diagnostics"
    ]
  },

  stats: [
    { value: 10, suffix: "+", label: "Years Clinical Experience", sublabel: "Mastery in restorative & cosmetic dentistry" },
    { value: 5000, suffix: "+", label: "Smiles Restored", sublabel: "Delighted patients with lifelong oral health" },
    { value: 4.9, decimals: 1, suffix: " ★", label: "Google Patient Rating", sublabel: "Based on 50+ authentic patient reviews" },
    { value: 100, suffix: "%", label: "Sterilization Standard", sublabel: "Highest global hygiene protocols followed" }
  ],

  services: [
    {
      id: "general-checkup",
      title: "General Dental Checkup & Digital X-Ray",
      subtitle: "Preventative Oral Care",
      icon: "Stethoscope",
      shortDesc: "Complete oral examination utilizing high-resolution digital imaging to diagnose hidden decay, gum issues, and bone health early.",
      fullDesc: "Prevention is the foundation of lifelong oral wellness. Our comprehensive checkup includes intraoral high-def photography, low-radiation digital radiography, periodontal pocket probing, and an oral cancer screen. You will receive a transparent, visual walkthrough of your dental health.",
      badge: "Preventative",
      duration: "30 Mins",
      benefits: ["Early decay detection", "Low-radiation digital sensor", "Zero pain inspection"]
    },
    {
      id: "cleaning-scaling",
      title: "Teeth Cleaning & Ultrasonic Scaling",
      subtitle: "Periodontal Health",
      icon: "Sparkles",
      shortDesc: "Gentle ultrasonic removal of stubborn plaque, tartar, and coffee/tea stains to eliminate bad breath and prevent gingivitis.",
      fullDesc: "Using state-of-the-art piezoelectric ultrasonic instruments, we gently break down calcified tartar and stain deposits above and below the gumline without abrading tooth enamel. Followed by diamond-paste polishing for a gleaming, fresh finish.",
      badge: "Hygiene",
      duration: "45 Mins",
      benefits: ["Prevents gum disease", "Removes stubborn stains", "Refreshes breath instantly"]
    },
    {
      id: "teeth-whitening",
      title: "Advanced Laser Teeth Whitening",
      subtitle: "Cosmetic Brightening",
      icon: "Smile",
      shortDesc: "Professional in-chair whitening that lifts up to 6–8 shades in a single sitting safely without enamel damage or lasting sensitivity.",
      fullDesc: "Eliminate deep discoloration caused by tea, coffee, smoking, and natural aging. Our pH-balanced medical whitening gel activated by cool blue light delivers rapid, dramatic brightness while protecting your enamel and minimizing tooth sensitivity.",
      badge: "Popular",
      duration: "60 Mins",
      benefits: ["6-8 shades lighter", "Enamel-safe formulation", "Immediate sparkling results"]
    },
    {
      id: "root-canal",
      title: "Single-Sitting Painless Root Canal (RCT)",
      subtitle: "Endodontic Mastery",
      icon: "Activity",
      image: "/cases/case-root-canal-xray.png",
      shortDesc: "Save infected or deeply damaged natural teeth using computer-assisted rotary endodontics and local precision anesthesia.",
      fullDesc: "Gone are the days of painful, multiple-visit root canals. Dr. Arthi specializes in rotary nickel-titanium instrumentation and apex-locator guided root canal therapy, thoroughly disinfecting root canals and sealing them hermetically—often completed comfortably in just one session.",
      badge: "Signature Care",
      duration: "45-60 Mins",
      benefits: ["Saves your natural tooth", "Near zero discomfort", "Single sitting convenience"]
    },
    {
      id: "dental-implants",
      title: "Permanent Dental Implants",
      subtitle: "Permanent Tooth Replacement",
      icon: "ShieldCheck",
      image: "/cases/case-anterior-implant-bridge.png",
      shortDesc: "Biocompatible titanium tooth roots topped with lifelike porcelain crowns that look, feel, and function just like natural teeth.",
      fullDesc: "The gold standard for missing teeth. Implants fuse directly with the jawbone (osseointegration) to prevent bone resorption, restore full bite force, and prevent neighboring teeth from shifting. Designed to last a lifetime with proper care.",
      badge: "Permanent",
      duration: "Comprehensive",
      benefits: ["Lifelong durability", "100% natural mastication", "Preserves facial structure"]
    },
    {
      id: "braces-aligners",
      title: "Braces & Invisible Clear Aligners",
      subtitle: "Orthodontic Realignment",
      icon: "Layers",
      shortDesc: "Straighten crooked, crowded, or spaced teeth using discreet ceramic brackets or virtually invisible custom aligners.",
      fullDesc: "Achieve the aligned, symmetrical smile you have always desired. We offer modern clear aligners (removable, comfortable, and invisible) as well as traditional metal and ceramic aesthetic braces for adolescents and adults alike.",
      badge: "Aesthetics",
      duration: "Flexible Plan",
      benefits: ["Virtually invisible options", "Gentle tooth movement", "Custom 3D treatment plan"]
    },
    {
      id: "cosmetic-dentistry",
      title: "Cosmetic Dentistry & Smile Design",
      subtitle: "Smile Transformation",
      icon: "Palette",
      image: "/cases/case-cosmetic-chipped-tooth.jpg",
      shortDesc: "Porcelain veneers, composite bonding, and gum contouring customized to your facial proportions for a movie-star smile.",
      fullDesc: "A complete smile makeover analyzes your facial symmetry, lip line, and tooth color. Using ultra-thin porcelain veneers or artistic composite bonding, we close gaps, mask chips, and correct misshapen teeth with natural translucency.",
      badge: "Premium",
      duration: "2-3 Visits",
      benefits: ["Customized facial aesthetics", "Ultra-thin porcelain veneers", "Instant confidence boost"]
    },
    {
      id: "pediatric-dentistry",
      title: "Pediatric Dentistry (Gentle Kids Care)",
      subtitle: "Children's Dental Health",
      icon: "HeartHandshake",
      image: "/cases/dr-arthi-pediatric-patient.png",
      shortDesc: "Warm, anxiety-free dental visits for infants, toddlers, and young teens, with fluoride protection and pit-and-fissure sealants.",
      fullDesc: "We take immense pride in fostering a playful, relaxing atmosphere for children. From habit counseling (thumb sucking, tongue thrusting) to cavity prevention and space maintainers, we lay the groundwork for positive lifelong dental habits.",
      badge: "Kid-Friendly",
      duration: "30 Mins",
      benefits: ["Friendly, playful environment", "Painless cavity protection", "Preventative fluoride sealants"]
    },
    {
      id: "tooth-extraction",
      title: "Wisdom Tooth & Surgical Extraction",
      subtitle: "Oral Surgery",
      icon: "Cpu",
      shortDesc: "Atraumatic surgical removal of impacted wisdom teeth and non-restorable roots with precision anesthesia and rapid healing protocols.",
      fullDesc: "Impacted wisdom teeth can cause severe jaw pain, swelling, and crowding. Dr. Arthi performs minimally invasive extractions with gentle bone preservation and post-procedure platelet-rich protocols to ensure smooth, rapid recovery.",
      badge: "Painless",
      duration: "30-45 Mins",
      benefits: ["Atraumatic technique", "Local anesthesia comfort", "Quick healing instructions"]
    },
    {
      id: "dentures-crowns",
      title: "Zirconia Crowns, Bridges & Dentures",
      subtitle: "Prosthodontics",
      icon: "Award",
      image: "/cases/case-dentures-elderly-woman.png",
      shortDesc: "Custom-milled metal-free Zirconia crowns, durable dental bridges, and comfortable complete/flexible partial dentures.",
      fullDesc: "Restore full masticatory function and beauty with precision-engineered CAD/CAM monolithic Zirconia and E-max ceramic crowns. For multi-tooth or full-arch replacement, we craft lightweight, high-suction flexible dentures that stay secure.",
      badge: "Restorative",
      duration: "2-3 Visits",
      benefits: ["Metal-free Zirconia strength", "Perfect color match", "Comfortable snug fit"]
    }
  ],

  whyUs: [
    {
      icon: "Cpu",
      title: "Advanced Modern Technology",
      description: "Equipped with digital radiography, intraoral high-def cameras, and rotary endodontics for pinpoint diagnostic precision."
    },
    {
      icon: "ShieldAlert",
      title: "Rigorous 100% Sterilization",
      description: "Class-B vacuum autoclave, sterile sealed pouches opened in front of you, and strict bio-medical hospital protocols."
    },
    {
      icon: "Feather",
      title: "Truly Painless Dental Care",
      description: "Gentle touch, topical numbing gels before injections, and patient-first pacing to eliminate all dental anxiety."
    },
    {
      icon: "IndianRupee",
      title: "Honest & Transparent Pricing",
      description: "No hidden charges or surprise fees. Clear explanations of treatment options, phases, and costs prior to starting."
    },
    {
      icon: "UserCheck",
      title: "Personalized Treatment Plans",
      description: "Every smile is unique. We tailor clinical plans to your lifestyle, medical history, comfort, and aesthetic expectations."
    },
    {
      icon: "Clock",
      title: "Punctual Appointments",
      description: "We value your precious time. Scheduled appointments ensure near-zero waiting room times and devoted doctor attention."
    }
  ],

  treatmentProcess: [
    {
      step: "01",
      title: "Convenient Online Booking",
      desc: "Choose your preferred date and slot in seconds or connect via WhatsApp for instant confirmation."
    },
    {
      step: "02",
      title: "Digital Consultation & Scan",
      desc: "Detailed intraoral examination, digital X-rays, and clear photo-demonstration of your oral condition."
    },
    {
      step: "03",
      title: "Gentle Precision Treatment",
      desc: "Relax in our ergonomic dental chair while Dr. Arthi performs pain-free treatment with world-class materials."
    },
    {
      step: "04",
      title: "Healthy Confident Smile",
      desc: "Walk out with a restored smile, post-treatment care kit, and proactive follow-up support."
    }
  ],

  gallery: [
    {
      id: "case-dentures-elderly-woman",
      title: "Timeless Transformation: Full Mouth Dentures",
      category: "Dentures",
      image: "/cases/case-dentures-elderly-woman.png",
      beforeLabel: "Severe Tooth Loss & Sunken Cheeks",
      afterLabel: "Full Functional Denture Smile",
      description: "Complete full-mouth denture prosthodontics designed by Dr. Arthi to restore youthfulness, facial volume, phonetics, and chewing comfort.",
      tag: "Complete Dentures"
    },
    {
      id: "case-anterior-implant",
      title: "Anterior Dental Implant & Aesthetic Crown",
      category: "Dental Implants",
      image: "/cases/case-anterior-implant-bridge.png",
      beforeLabel: "Missing Upper Front Incisor Gap",
      afterLabel: "Lifelike Porcelain Crown & Natural Gums",
      description: "Fixed single-tooth anterior implant restoration with natural gingival papilla preservation and seamless porcelain translucency.",
      tag: "Dental Implant"
    },
    {
      id: "case-pediatric-patient",
      title: "Pediatric Dentistry & Fear-Free Care",
      category: "Pediatric Care",
      image: "/cases/dr-arthi-pediatric-patient.png",
      beforeLabel: "Dental Apprehension in Children",
      afterLabel: "Handmade 'I ❤️ You Doctor' Card",
      description: "Dr. Arthi with our young patient proudly presenting her handmade drawing! We prioritize playful, gentle visits that create positive lifelong dental habits.",
      tag: "Pediatric Care"
    },
    {
      id: "case-dentures-elderly-man",
      title: "Geriatric Smile Reconstruction",
      category: "Dentures",
      image: "/cases/case-dentures-elderly-man.png",
      beforeLabel: "Missing Upper Front Teeth",
      afterLabel: "Restored Smile & Chewing Confidence",
      description: "Upper arch prosthetic rehabilitation restoring chewing efficiency and full natural smile aesthetics for our elderly patient in Hosur.",
      tag: "Smile Reconstruction"
    },
    {
      id: "facility-operatory",
      title: "Our Modern Operatory & Treatment Suite",
      category: "Clinic Facility",
      image: "/clinic-interior.jpg",
      beforeLabel: "Hospital Grade Hygiene",
      afterLabel: "Ergonomic Treatment Comfort",
      description: "Step inside Dr. Arthi's treatment operatory featuring our purple ergonomic dental chair, computer-assisted rotary console, autoclave-monitored sterilization, and serene ambiance at PK Complex, Hosur.",
      tag: "Hosur Operatory"
    },
    {
      id: "case-root-canal-xray",
      title: "Rotary Root Canal & Crown Radiography",
      category: "Endodontics",
      image: "/cases/case-root-canal-xray.png",
      beforeLabel: "Deep Pulp Infection & Canal Shaping",
      afterLabel: "Hermetic Apex Obturation & Crown",
      description: "Diagnostic digital radiograph demonstrating complete 3D endodontic canal cleaning, apex-level hermetic obturation, and zirconia crown protection.",
      tag: "Root Canal X-Ray"
    },
    {
      id: "case-post-and-core-crown",
      title: "Anterior Post & Core Tooth Salvage",
      category: "Cosmetic",
      image: "/cases/case-post-and-core-crown.png",
      beforeLabel: "Pre-Op: Fractured Incisor Stump",
      afterLabel: "Post-Op: Custom Post & Ceramic Crown",
      description: "Multi-stage tooth preservation avoiding extraction. Endodontic reinforcement with fiber post & core build-up, topped with an all-ceramic natural crown.",
      tag: "Tooth Salvage"
    },
    {
      id: "case-cosmetic-chipped-tooth",
      title: "Chipped Enamel Aesthetic Restoration",
      category: "Cosmetic",
      image: "/cases/case-cosmetic-chipped-tooth.jpg",
      beforeLabel: "Chipped Cusp & Fractured Edge",
      afterLabel: "Biomimetic Enamel Bonding",
      description: "Painless direct composite enamel bonding completed in 30 minutes, restoring natural tooth shape, surface striations, and light reflection.",
      tag: "Chipped Tooth Repair"
    },
    {
      id: "case-broken-incisor-bonding",
      title: "Broken Incisor Aesthetic Smile Design",
      category: "Cosmetic",
      image: "/cases/case-broken-incisor-bonding.png",
      beforeLabel: "Broken Central Incisor Angle",
      afterLabel: "Natural Incisal Edge Restored",
      description: "Direct layered composite bonding restoring broken front incisor with natural tooth translucency and seamless color graduation.",
      tag: "Aesthetic Bonding"
    }
  ],

  testimonials: [
    {
      id: 1,
      name: "Suresh Narayanan",
      role: "IT Professional, Hosur",
      rating: 5,
      date: "2 weeks ago",
      treatment: "Single Sitting Root Canal",
      comment: "I had extreme fear of dental procedures after a bad past experience elsewhere. Dr. Arthi is extraordinarily gentle and patient. The root canal was 100% painless! She explained every step with genuine warmth. Truly the best dental clinic in Hosur.",
      verified: true
    },
    {
      id: 2,
      name: "Priyanka Venkatesh",
      role: "School Teacher",
      rating: 5,
      date: "1 month ago",
      treatment: "Teeth Whitening & Scaling",
      comment: "Visited Dr. Arthi's Dentophilic Centre before my sister's wedding for teeth cleaning and whitening. The results exceeded my expectations—my smile is visibly brighter! Clinic hygiene is immaculate, sparkling clean like an international clinic.",
      verified: true
    },
    {
      id: 3,
      name: "Mohan Kumar R",
      role: "Manufacturing Engineer, ESI Ring Road",
      rating: 5,
      date: "3 weeks ago",
      treatment: "Ceramic Zirconia Crown",
      comment: "Very reasonable and transparent pricing. Dr. Arthi takes time to show you the X-ray and explain why a crown is needed instead of rushing you. The crown fits so naturally that I forgot which tooth was treated. Highly recommend!",
      verified: true
    },
    {
      id: 4,
      name: "Divya Bharathi",
      role: "Mother of 6-year-old patient",
      rating: 5,
      date: "2 months ago",
      treatment: "Pediatric Dental Filling",
      comment: "My son was crying before entering the clinic. Dr. Arthi was so sweet with him, showing him the instruments like cartoon characters. He didn't even shed a tear during the filling! Excellent doctor for families with children.",
      verified: true
    },
    {
      id: 5,
      name: "Anand Christopher",
      role: "Hosur Resident",
      rating: 5,
      date: "Recent Patient",
      treatment: "Wisdom Tooth Extraction",
      comment: "Had severe wisdom tooth pain radiating to my ear. Dr. Arthi removed the impacted tooth with surgical precision under gentle anesthesia. Fast recovery with zero post-op swelling. Grateful to the clinic staff for their check-in calls.",
      verified: true
    }
  ],

  faqs: [
    {
      q: "Is a root canal treatment painful at Dentophilic Centre?",
      a: "No! Modern root canal therapy is no more uncomfortable than getting a routine dental filling. Dr. Arthi utilizes advanced computer-controlled rotary instruments, precision apex locators, and highly effective local anesthesia, making the procedure virtually painless."
    },
    {
      q: "How often should I get my teeth cleaned and checked?",
      a: "The Indian Dental Association and global standards recommend a routine dental checkup and professional ultrasonic cleaning every 6 months. This prevents tartar buildup, protects gums, and catches minor cavities before they turn painful or expensive."
    },
    {
      q: "Does teeth whitening damage my natural tooth enamel?",
      a: "Not at all when done by a qualified dental surgeon. Our professional whitening treatments use clinically proven, pH-balanced formulas that lift deep organic stains without weakening or stripping enamel minerals."
    },
    {
      q: "What safety and sterilization standards do you follow?",
      a: "Your safety is non-negotiable. We adhere to stringent multi-tier sterilization protocols including medical-grade Class-B vacuum autoclaving, disposable barrier wraps, sterilized instrument pouches unsealed in front of the patient, and continuous clinic sanitization."
    },
    {
      q: "Are walk-in consultations accepted or is an appointment mandatory?",
      a: "While we do accommodate emergency walk-ins during clinic hours, we strongly recommend booking an appointment online or calling in advance to ensure dedicated one-on-one time with Dr. Arthi without prolonged waiting."
    },
    {
      q: "What payment methods are accepted at the clinic?",
      a: "We accept all major UPI apps (Google Pay, PhonePe, Paytm), debit/credit cards, cash, and digital net banking for your convenience."
    }
  ],

  availableSlots: [
    "10:00 AM",
    "10:30 AM",
    "11:00 AM",
    "11:30 AM",
    "12:00 PM",
    "12:30 PM",
    "01:00 PM",
    "05:00 PM",
    "05:30 PM",
    "06:00 PM",
    "06:30 PM",
    "07:00 PM",
    "07:30 PM",
    "08:00 PM"
  ]
};
