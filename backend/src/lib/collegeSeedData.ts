/**
 * Curated starter shortlist of real colleges per (city, college category), keyed by category
 * name. Shared by the manual `seed:colleges` script and the auto-seed run at server startup
 * (see collegeService.ensureCollegesSeeded) so both stay in sync with one source of truth.
 *
 * Complete national systems (all 23 IITs, all 31 NITs, all 20 IIMs, every operational AIIMS, VIT's
 * Vellore/Chennai/AP/Bhopal campuses) are enumerated in full here, even where a campus sits in a
 * small town — students search by the brand name, not city size. `indianCities.ts` gained a
 * handful of smaller towns (Ropar, Mandi, Palakkad, Goa, Rohtak, Kashipur, Rishikesh, Deoghar,
 * Raebareli, Karaikal) specifically so those campuses' actual city has a matching City record; a
 * few campuses in towns still not worth cataloguing as a full city (e.g. NIT Andhra Pradesh at
 * Tadepalligudem, IIM Sirmaur) are filed under the nearest catalogued city instead. Beyond the
 * named national systems this stays a curated shortlist, not an exhaustive directory of every
 * college in India — the picker always offers an "Other" fallback for anything missing, and
 * admins can add more colleges for other cities from the admin panel at any time.
 *
 * `nirfRank` is only set where a college's #1 spot in its NIRF category ranking has been
 * essentially unchanged for years (the seven oldest IITs in Engineering, AIIMS Delhi in
 * Medical, NLSIU Bangalore in Law, IARI Delhi in Agriculture) — everything else is ordered via
 * `sortOrder` by general reputation instead of a claimed exact rank, to avoid asserting NIRF
 * numbers this data can't guarantee are current. Categories NIRF doesn't rank as a discipline
 * of its own (Design, Commerce, Science, Arts, Animation, Hotel Management) are sortOrder-only
 * throughout, and include well-known institutions outside the NIRF list entirely (e.g. NIFT,
 * which NIRF doesn't rank) alongside NIRF-listed ones, since the goal is "colleges students
 * actually apply to," not "colleges NIRF ranks."
 */

export type SeedCollege = { city: string; name: string; nirfRank?: number; sortOrder?: number };

export const ENGINEERING_COLLEGE_SEEDS: SeedCollege[] = [
  // The seven oldest IITs — stable relative NIRF Engineering order.
  { city: "Chennai", name: "IIT Madras", nirfRank: 1 },
  { city: "Delhi", name: "IIT Delhi", nirfRank: 2 },
  { city: "Mumbai", name: "IIT Bombay", nirfRank: 3 },
  { city: "Kanpur", name: "IIT Kanpur", nirfRank: 4 },
  { city: "Kharagpur", name: "IIT Kharagpur", nirfRank: 5 },
  { city: "Roorkee", name: "IIT Roorkee", nirfRank: 6 },
  { city: "Guwahati", name: "IIT Guwahati", nirfRank: 7 },

  // Other well-known institutes, curated order (no asserted NIRF number).
  { city: "Hyderabad", name: "IIT Hyderabad", sortOrder: 1 },
  { city: "Varanasi", name: "IIT (BHU) Varanasi", sortOrder: 1 },
  { city: "Indore", name: "IIT Indore", sortOrder: 1 },
  { city: "Dhanbad", name: "Indian Institute of Technology (Indian School of Mines), Dhanbad", sortOrder: 1 },
  { city: "Bhubaneswar", name: "IIT Bhubaneswar", sortOrder: 2 },
  { city: "Gandhinagar", name: "IIT Gandhinagar", sortOrder: 2 },
  { city: "Jodhpur", name: "IIT Jodhpur", sortOrder: 2 },
  { city: "Patna", name: "IIT Patna", sortOrder: 2 },
  { city: "Tirupati", name: "IIT Tirupati", sortOrder: 2 },
  { city: "Bhilai", name: "IIT Bhilai", sortOrder: 2 },
  { city: "Jammu", name: "IIT Jammu", sortOrder: 2 },
  { city: "Dharwad", name: "IIT Dharwad", sortOrder: 2 },
  { city: "Goa", name: "IIT Goa", sortOrder: 2 },
  { city: "Ropar", name: "IIT Ropar", sortOrder: 2 },
  { city: "Mandi", name: "IIT Mandi", sortOrder: 2 },
  { city: "Palakkad", name: "IIT Palakkad", sortOrder: 2 },

  { city: "Mumbai", name: "Institute of Chemical Technology (ICT)", sortOrder: 10 },
  { city: "Mumbai", name: "Veermata Jijabai Technological Institute (VJTI)", sortOrder: 20 },
  { city: "Mumbai", name: "Sardar Patel Institute of Technology (SPIT)", sortOrder: 30 },
  { city: "Mumbai", name: "K J Somaiya College of Engineering", sortOrder: 40 },
  { city: "Mumbai", name: "Sardar Patel College of Engineering", sortOrder: 50 },

  { city: "Delhi", name: "Delhi Technological University (DTU)", sortOrder: 10 },
  { city: "Delhi", name: "Netaji Subhas University of Technology (NSUT)", sortOrder: 20 },
  { city: "Delhi", name: "Indraprastha Institute of Information Technology Delhi (IIIT-Delhi)", sortOrder: 30 },
  { city: "Delhi", name: "Jamia Millia Islamia — Faculty of Engineering and Technology", sortOrder: 40 },

  { city: "Bengaluru", name: "Indian Institute of Science (IISc) Bengaluru", sortOrder: 5 },
  { city: "Bengaluru", name: "RV College of Engineering", sortOrder: 10 },
  { city: "Bengaluru", name: "BMS College of Engineering", sortOrder: 20 },
  { city: "Bengaluru", name: "PES University", sortOrder: 30 },
  { city: "Bengaluru", name: "M S Ramaiah Institute of Technology", sortOrder: 40 },

  { city: "Chennai", name: "Anna University (CEG Campus)", sortOrder: 10 },
  { city: "Chennai", name: "SSN College of Engineering", sortOrder: 20 },
  { city: "Chennai", name: "VIT Chennai", sortOrder: 30 },
  { city: "Chennai", name: "SRM Institute of Science and Technology, Chennai", sortOrder: 40 },

  { city: "Pune", name: "College of Engineering Pune (COEP Technological University)", sortOrder: 10 },
  { city: "Pune", name: "Pune Institute of Computer Technology (PICT)", sortOrder: 20 },
  { city: "Pune", name: "Vishwakarma Institute of Technology", sortOrder: 30 },
  { city: "Pune", name: "MIT World Peace University", sortOrder: 40 },

  { city: "Hyderabad", name: "BITS Pilani Hyderabad Campus", sortOrder: 10 },
  { city: "Hyderabad", name: "International Institute of Information Technology, Hyderabad (IIIT-H)", sortOrder: 20 },
  { city: "Hyderabad", name: "Osmania University College of Engineering", sortOrder: 30 },

  { city: "Kolkata", name: "Jadavpur University", sortOrder: 10 },
  { city: "Kolkata", name: "Indian Institute of Engineering Science and Technology (IIEST), Shibpur", sortOrder: 20 },
  { city: "Kolkata", name: "Heritage Institute of Technology", sortOrder: 30 },

  { city: "Tiruchirappalli", name: "NIT Tiruchirappalli", sortOrder: 5 },
  { city: "Warangal", name: "NIT Warangal", sortOrder: 5 },
  { city: "Mangaluru", name: "NIT Surathkal", sortOrder: 5 },
  { city: "Kozhikode", name: "NIT Calicut", sortOrder: 5 },
  { city: "Jaipur", name: "Malaviya National Institute of Technology (MNIT) Jaipur", sortOrder: 5 },
  { city: "Surat", name: "Sardar Vallabhbhai National Institute of Technology (SVNIT)", sortOrder: 5 },
  { city: "Nagpur", name: "Visvesvaraya National Institute of Technology (VNIT)", sortOrder: 5 },
  { city: "Bhopal", name: "Maulana Azad National Institute of Technology (MANIT)", sortOrder: 5 },
  { city: "Rourkela", name: "NIT Rourkela", sortOrder: 5 },
  { city: "Prayagraj", name: "Motilal Nehru National Institute of Technology (MNNIT) Allahabad", sortOrder: 5 },
  { city: "Agartala", name: "NIT Agartala", sortOrder: 10 },
  { city: "Delhi", name: "NIT Delhi", sortOrder: 10 },
  { city: "Durgapur", name: "NIT Durgapur", sortOrder: 10 },
  { city: "Goa", name: "NIT Goa", sortOrder: 10 },
  { city: "Hamirpur", name: "NIT Hamirpur", sortOrder: 10 },
  { city: "Jalandhar", name: "NIT Jalandhar", sortOrder: 10 },
  { city: "Jamshedpur", name: "NIT Jamshedpur", sortOrder: 10 },
  { city: "Kurukshetra", name: "NIT Kurukshetra", sortOrder: 10 },
  { city: "Imphal", name: "NIT Manipur", sortOrder: 10 },
  { city: "Shillong", name: "NIT Meghalaya", sortOrder: 10 },
  { city: "Aizawl", name: "NIT Mizoram", sortOrder: 10 },
  { city: "Dimapur", name: "NIT Nagaland", sortOrder: 10 },
  { city: "Patna", name: "NIT Patna", sortOrder: 10 },
  { city: "Puducherry", name: "NIT Puducherry", sortOrder: 10 },
  { city: "Raipur", name: "NIT Raipur", sortOrder: 10 },
  { city: "Silchar", name: "NIT Silchar", sortOrder: 10 },
  { city: "Srinagar", name: "NIT Srinagar (J&K)", sortOrder: 10 },
  { city: "Srinagar", name: "NIT Uttarakhand (Srinagar, Garhwal)", sortOrder: 20 },
  { city: "Gangtok", name: "NIT Sikkim", sortOrder: 10 },
  { city: "Eluru", name: "NIT Andhra Pradesh", sortOrder: 10 },
  { city: "Itanagar", name: "NIT Arunachal Pradesh", sortOrder: 10 },

  { city: "Vellore", name: "Vellore Institute of Technology (VIT)", sortOrder: 10 },
  { city: "Amaravati", name: "VIT-AP University", sortOrder: 10 },
  { city: "Bhopal", name: "VIT Bhopal University", sortOrder: 15 },
  { city: "Coimbatore", name: "Amrita Vishwa Vidyapeetham, Coimbatore", sortOrder: 10 },
  { city: "Coimbatore", name: "PSG College of Technology", sortOrder: 20 },
  { city: "Thanjavur", name: "SASTRA Deemed University", sortOrder: 5 },
  { city: "Patiala", name: "Thapar Institute of Engineering and Technology", sortOrder: 5 },
  { city: "Manipal", name: "Manipal Institute of Technology (MIT)", sortOrder: 5 },
  { city: "Bhubaneswar", name: "Kalinga Institute of Industrial Technology (KIIT)", sortOrder: 10 },
  { city: "Bhubaneswar", name: "Siksha 'O' Anusandhan (SOA) University", sortOrder: 20 },
  { city: "Dehradun", name: "University of Petroleum and Energy Studies (UPES)", sortOrder: 10 },

  { city: "Ahmedabad", name: "Nirma University — Institute of Technology", sortOrder: 10 },
  { city: "Ahmedabad", name: "L D College of Engineering", sortOrder: 20 },
];

export const DESIGN_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Ahmedabad", name: "National Institute of Design (NID), Ahmedabad", sortOrder: 1 },
  { city: "Ahmedabad", name: "Unitedworld Institute of Design (UID)", sortOrder: 20 },

  { city: "Delhi", name: "National Institute of Fashion Technology (NIFT), Delhi", sortOrder: 10 },
  { city: "Delhi", name: "Pearl Academy, Delhi", sortOrder: 20 },

  { city: "Mumbai", name: "National Institute of Fashion Technology (NIFT), Mumbai", sortOrder: 10 },
  { city: "Mumbai", name: "Sir J J Institute of Applied Art", sortOrder: 20 },
  { city: "Mumbai", name: "Pearl Academy, Mumbai", sortOrder: 30 },
  { city: "Mumbai", name: "Indian School of Design and Innovation (ISDI)", sortOrder: 40 },

  { city: "Bengaluru", name: "National Institute of Fashion Technology (NIFT), Bengaluru", sortOrder: 10 },
  { city: "Bengaluru", name: "National Institute of Design (NID), Bengaluru", sortOrder: 20 },
  { city: "Bengaluru", name: "Srishti Manipal Institute of Art, Design and Technology", sortOrder: 30 },
  { city: "Bengaluru", name: "Vogue Institute of Art and Design", sortOrder: 40 },

  { city: "Chennai", name: "National Institute of Fashion Technology (NIFT), Chennai", sortOrder: 10 },

  { city: "Kolkata", name: "National Institute of Fashion Technology (NIFT), Kolkata", sortOrder: 10 },

  { city: "Hyderabad", name: "National Institute of Fashion Technology (NIFT), Hyderabad", sortOrder: 10 },

  { city: "Pune", name: "Symbiosis Institute of Design", sortOrder: 10 },
  { city: "Pune", name: "MIT Institute of Design", sortOrder: 20 },

  { city: "Bhopal", name: "National Institute of Fashion Technology (NIFT), Bhopal", sortOrder: 10 },
  { city: "Bhubaneswar", name: "National Institute of Fashion Technology (NIFT), Bhubaneswar", sortOrder: 10 },
  { city: "Gandhinagar", name: "National Institute of Fashion Technology (NIFT), Gandhinagar", sortOrder: 10 },
  { city: "Gandhinagar", name: "National Institute of Design (NID), Gandhinagar Campus", sortOrder: 20 },
  { city: "Jodhpur", name: "National Institute of Fashion Technology (NIFT), Jodhpur", sortOrder: 10 },
  { city: "Kannur", name: "National Institute of Fashion Technology (NIFT), Kannur", sortOrder: 10 },
  { city: "Patna", name: "National Institute of Fashion Technology (NIFT), Patna", sortOrder: 10 },
  { city: "Shillong", name: "National Institute of Fashion Technology (NIFT), Shillong", sortOrder: 10 },
  { city: "Srinagar", name: "National Institute of Fashion Technology (NIFT), Srinagar", sortOrder: 10 },

  { city: "Vijayawada", name: "National Institute of Design (NID), Andhra Pradesh Campus", sortOrder: 10 },
  { city: "Kurukshetra", name: "National Institute of Design (NID), Kurukshetra Campus", sortOrder: 10 },
  { city: "Jorhat", name: "National Institute of Design (NID), Assam Campus", sortOrder: 10 },

  { city: "Jaipur", name: "International Institute of Craft and Design (IICD), Jaipur", sortOrder: 10 },
  { city: "Coimbatore", name: "DJ Academy of Design", sortOrder: 10 },
];

export const MEDICAL_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "All India Institute of Medical Sciences (AIIMS), Delhi", nirfRank: 1 },
  { city: "Delhi", name: "Maulana Azad Medical College", sortOrder: 10 },
  { city: "Delhi", name: "Lady Hardinge Medical College", sortOrder: 20 },
  { city: "Delhi", name: "University College of Medical Sciences (UCMS)", sortOrder: 30 },

  { city: "Chandigarh", name: "Postgraduate Institute of Medical Education and Research (PGIMER)", sortOrder: 5 },
  { city: "Chandigarh", name: "Government Medical College and Hospital (GMCH-32)", sortOrder: 15 },

  { city: "Vellore", name: "Christian Medical College (CMC), Vellore", sortOrder: 5 },

  { city: "Bengaluru", name: "National Institute of Mental Health and Neurosciences (NIMHANS)", sortOrder: 5 },
  { city: "Bengaluru", name: "St John's Medical College", sortOrder: 15 },
  { city: "Bengaluru", name: "Bangalore Medical College and Research Institute", sortOrder: 25 },

  { city: "Lucknow", name: "Sanjay Gandhi Postgraduate Institute of Medical Sciences (SGPGIMS)", sortOrder: 10 },
  { city: "Lucknow", name: "King George's Medical University (KGMU)", sortOrder: 20 },

  { city: "Pune", name: "Armed Forces Medical College (AFMC)", sortOrder: 10 },
  { city: "Pune", name: "B J Government Medical College", sortOrder: 20 },

  { city: "Puducherry", name: "Jawaharlal Institute of Postgraduate Medical Education and Research (JIPMER)", sortOrder: 10 },

  { city: "Manipal", name: "Kasturba Medical College (KMC), Manipal", sortOrder: 10 },

  { city: "Mumbai", name: "Seth GS Medical College and KEM Hospital", sortOrder: 10 },
  { city: "Mumbai", name: "Grant Medical College and Sir JJ Hospital", sortOrder: 20 },
  { city: "Mumbai", name: "Topiwala National Medical College (Nair Hospital)", sortOrder: 30 },

  { city: "Chennai", name: "Madras Medical College", sortOrder: 10 },
  { city: "Chennai", name: "Stanley Medical College", sortOrder: 20 },
  { city: "Chennai", name: "Sri Ramachandra Institute of Higher Education and Research", sortOrder: 30 },

  { city: "Varanasi", name: "Institute of Medical Sciences, Banaras Hindu University (IMS-BHU)", sortOrder: 10 },

  { city: "Hyderabad", name: "Nizam's Institute of Medical Sciences (NIMS)", sortOrder: 10 },
  { city: "Hyderabad", name: "Osmania Medical College", sortOrder: 20 },

  { city: "Kolkata", name: "Institute of Post Graduate Medical Education and Research (IPGMER) and SSKM Hospital", sortOrder: 10 },
  { city: "Kolkata", name: "Calcutta National Medical College", sortOrder: 20 },

  { city: "Jodhpur", name: "All India Institute of Medical Sciences (AIIMS), Jodhpur", sortOrder: 10 },
  { city: "Bhopal", name: "All India Institute of Medical Sciences (AIIMS), Bhopal", sortOrder: 10 },
  { city: "Bhubaneswar", name: "All India Institute of Medical Sciences (AIIMS), Bhubaneswar", sortOrder: 10 },
  { city: "Patna", name: "All India Institute of Medical Sciences (AIIMS), Patna", sortOrder: 10 },
  { city: "Raipur", name: "All India Institute of Medical Sciences (AIIMS), Raipur", sortOrder: 10 },
  { city: "Rishikesh", name: "All India Institute of Medical Sciences (AIIMS), Rishikesh", sortOrder: 10 },
  { city: "Nagpur", name: "All India Institute of Medical Sciences (AIIMS), Nagpur", sortOrder: 10 },
  { city: "Guwahati", name: "All India Institute of Medical Sciences (AIIMS), Guwahati", sortOrder: 10 },
  { city: "Rajkot", name: "All India Institute of Medical Sciences (AIIMS), Rajkot", sortOrder: 10 },
  { city: "Bathinda", name: "All India Institute of Medical Sciences (AIIMS), Bathinda", sortOrder: 10 },
  { city: "Gorakhpur", name: "All India Institute of Medical Sciences (AIIMS), Gorakhpur", sortOrder: 10 },
  { city: "Deoghar", name: "All India Institute of Medical Sciences (AIIMS), Deoghar", sortOrder: 10 },
  { city: "Raebareli", name: "All India Institute of Medical Sciences (AIIMS), Raebareli", sortOrder: 10 },
  { city: "Madurai", name: "All India Institute of Medical Sciences (AIIMS), Madurai", sortOrder: 10 },
  { city: "Bilaspur", name: "All India Institute of Medical Sciences (AIIMS), Bilaspur (Himachal Pradesh)", sortOrder: 10 },
  { city: "Guntur", name: "All India Institute of Medical Sciences (AIIMS), Mangalagiri", sortOrder: 10 },
  { city: "Kolkata", name: "All India Institute of Medical Sciences (AIIMS), Kalyani", sortOrder: 30 },
  { city: "Hyderabad", name: "All India Institute of Medical Sciences (AIIMS), Bibinagar", sortOrder: 30 },
];

export const MANAGEMENT_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Ahmedabad", name: "Indian Institute of Management (IIM), Ahmedabad", sortOrder: 5 },
  { city: "Bengaluru", name: "Indian Institute of Management (IIM), Bangalore", sortOrder: 5 },
  { city: "Kolkata", name: "Indian Institute of Management (IIM), Calcutta", sortOrder: 5 },
  { city: "Lucknow", name: "Indian Institute of Management (IIM), Lucknow", sortOrder: 10 },
  { city: "Indore", name: "Indian Institute of Management (IIM), Indore", sortOrder: 10 },
  { city: "Kozhikode", name: "Indian Institute of Management (IIM), Kozhikode", sortOrder: 10 },

  { city: "Delhi", name: "Faculty of Management Studies (FMS), University of Delhi", sortOrder: 10 },
  { city: "Delhi", name: "Delhi School of Economics", sortOrder: 20 },

  { city: "Gurugram", name: "Management Development Institute (MDI), Gurugram", sortOrder: 10 },

  { city: "Mumbai", name: "Jamnalal Bajaj Institute of Management Studies (JBIMS)", sortOrder: 10 },
  { city: "Mumbai", name: "S P Jain Institute of Management and Research (SPJIMR)", sortOrder: 20 },
  { city: "Mumbai", name: "Narsee Monjee Institute of Management Studies (NMIMS)", sortOrder: 30 },

  { city: "Pune", name: "Symbiosis Institute of Business Management (SIBM), Pune", sortOrder: 10 },

  { city: "Jamshedpur", name: "Xavier School of Management (XLRI), Jamshedpur", sortOrder: 10 },

  { city: "Chennai", name: "Great Lakes Institute of Management", sortOrder: 10 },
  { city: "Chennai", name: "Loyola Institute of Business Administration (LIBA)", sortOrder: 20 },

  { city: "Shillong", name: "Indian Institute of Management (IIM), Shillong", sortOrder: 20 },
  { city: "Rohtak", name: "Indian Institute of Management (IIM), Rohtak", sortOrder: 20 },
  { city: "Ranchi", name: "Indian Institute of Management (IIM), Ranchi", sortOrder: 20 },
  { city: "Raipur", name: "Indian Institute of Management (IIM), Raipur", sortOrder: 20 },
  { city: "Tiruchirappalli", name: "Indian Institute of Management (IIM), Tiruchirappalli", sortOrder: 20 },
  { city: "Kashipur", name: "Indian Institute of Management (IIM), Kashipur", sortOrder: 20 },
  { city: "Udaipur", name: "Indian Institute of Management (IIM), Udaipur", sortOrder: 20 },
  { city: "Nagpur", name: "Indian Institute of Management (IIM), Nagpur", sortOrder: 20 },
  { city: "Visakhapatnam", name: "Indian Institute of Management (IIM), Visakhapatnam", sortOrder: 20 },
  { city: "Gaya", name: "Indian Institute of Management (IIM), Bodh Gaya", sortOrder: 20 },
  { city: "Shimla", name: "Indian Institute of Management (IIM), Sirmaur", sortOrder: 20 },
  { city: "Sambalpur", name: "Indian Institute of Management (IIM), Sambalpur", sortOrder: 20 },
  { city: "Amritsar", name: "Indian Institute of Management (IIM), Amritsar", sortOrder: 20 },
  { city: "Jammu", name: "Indian Institute of Management (IIM), Jammu", sortOrder: 20 },
];

export const LAW_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Bengaluru", name: "National Law School of India University (NLSIU)", nirfRank: 1 },
  { city: "Delhi", name: "National Law University (NLU), Delhi", sortOrder: 10 },
  { city: "Delhi", name: "Faculty of Law, University of Delhi", sortOrder: 20 },
  { city: "Hyderabad", name: "NALSAR University of Law", sortOrder: 10 },
  { city: "Kolkata", name: "West Bengal National University of Juridical Sciences (NUJS)", sortOrder: 10 },
  { city: "Pune", name: "Symbiosis Law School, Pune", sortOrder: 10 },
  { city: "Pune", name: "ILS Law College", sortOrder: 20 },
  { city: "Gandhinagar", name: "Gujarat National Law University (GNLU)", sortOrder: 10 },
  { city: "Bhopal", name: "National Law Institute University (NLIU), Bhopal", sortOrder: 10 },
  { city: "Jodhpur", name: "National Law University, Jodhpur", sortOrder: 10 },
  { city: "Patiala", name: "Rajiv Gandhi National University of Law (RGNUL), Patiala", sortOrder: 10 },
  { city: "Lucknow", name: "Dr. Ram Manohar Lohiya National Law University", sortOrder: 10 },
];

export const ARCHITECTURE_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "School of Planning and Architecture (SPA), Delhi", sortOrder: 5 },
  { city: "Mumbai", name: "Sir J J College of Architecture", sortOrder: 10 },
  { city: "Mumbai", name: "Kamla Raheja Vidyanidhi Institute for Architecture (KRVIA)", sortOrder: 20 },
  { city: "Ahmedabad", name: "CEPT University", sortOrder: 10 },
  { city: "Chennai", name: "Anna University — School of Architecture and Planning", sortOrder: 10 },
  { city: "Bhopal", name: "School of Planning and Architecture (SPA), Bhopal", sortOrder: 10 },
  { city: "Vijayawada", name: "School of Planning and Architecture (SPA), Vijayawada", sortOrder: 10 },
  { city: "Pune", name: "Bharati Vidyapeeth College of Architecture", sortOrder: 10 },
];

export const COMMERCE_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "Shri Ram College of Commerce (SRCC)", sortOrder: 5 },
  { city: "Delhi", name: "Lady Shri Ram College for Women", sortOrder: 15 },
  { city: "Delhi", name: "Hindu College", sortOrder: 25 },
  { city: "Delhi", name: "Hansraj College", sortOrder: 35 },
  { city: "Delhi", name: "Sri Venkateswara College", sortOrder: 45 },
  { city: "Delhi", name: "Gargi College", sortOrder: 55 },

  { city: "Mumbai", name: "Narsee Monjee College of Commerce and Economics", sortOrder: 10 },
  { city: "Mumbai", name: "H R College of Commerce and Economics", sortOrder: 20 },
  { city: "Mumbai", name: "Sydenham College of Commerce and Economics", sortOrder: 30 },

  { city: "Chennai", name: "Loyola College", sortOrder: 10 },
  { city: "Chennai", name: "Madras Christian College", sortOrder: 20 },

  { city: "Kolkata", name: "St. Xavier's College, Kolkata", sortOrder: 10 },
  { city: "Kolkata", name: "Presidency University", sortOrder: 20 },

  { city: "Bengaluru", name: "Christ University", sortOrder: 10 },
  { city: "Bengaluru", name: "Mount Carmel College", sortOrder: 20 },

  { city: "Pune", name: "Symbiosis College of Arts and Commerce", sortOrder: 10 },
  { city: "Nagpur", name: "Rashtrasant Tukadoji Maharaj Nagpur University (RTMNU)", sortOrder: 10 },
];

export const SCIENCE_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Bengaluru", name: "Indian Institute of Science (IISc), Bengaluru", sortOrder: 5 },
  { city: "Pune", name: "Indian Institute of Science Education and Research (IISER), Pune", sortOrder: 10 },
  { city: "Kolkata", name: "Indian Statistical Institute (ISI), Kolkata", sortOrder: 10 },
  { city: "Kolkata", name: "Presidency University", sortOrder: 20 },
  { city: "Delhi", name: "St. Stephen's College", sortOrder: 10 },
  { city: "Delhi", name: "Hindu College", sortOrder: 20 },
  { city: "Delhi", name: "Miranda House", sortOrder: 30 },
  { city: "Delhi", name: "Kirori Mal College", sortOrder: 40 },
  { city: "Mumbai", name: "St. Xavier's College, Mumbai", sortOrder: 10 },
  { city: "Chennai", name: "Loyola College", sortOrder: 10 },
  { city: "Thiruvananthapuram", name: "Indian Institute of Science Education and Research (IISER), Thiruvananthapuram", sortOrder: 10 },
  { city: "Mohali", name: "Indian Institute of Science Education and Research (IISER), Mohali", sortOrder: 10 },
  { city: "Bhopal", name: "Indian Institute of Science Education and Research (IISER), Bhopal", sortOrder: 10 },
  { city: "Chandigarh", name: "Panjab University", sortOrder: 10 },
  { city: "Guwahati", name: "Gauhati University", sortOrder: 10 },
];

export const ARTS_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "St. Stephen's College", sortOrder: 5 },
  { city: "Delhi", name: "Lady Shri Ram College for Women", sortOrder: 15 },
  { city: "Delhi", name: "Miranda House", sortOrder: 25 },
  { city: "Delhi", name: "Hindu College", sortOrder: 35 },
  { city: "Delhi", name: "Ramjas College", sortOrder: 45 },
  { city: "Delhi", name: "Daulat Ram College", sortOrder: 55 },
  { city: "Mumbai", name: "St. Xavier's College, Mumbai", sortOrder: 10 },
  { city: "Kolkata", name: "Presidency University", sortOrder: 10 },
  { city: "Kolkata", name: "Jadavpur University", sortOrder: 20 },
  { city: "Chennai", name: "Madras Christian College", sortOrder: 10 },
  { city: "Chennai", name: "Stella Maris College", sortOrder: 20 },
  { city: "Pune", name: "Fergusson College", sortOrder: 10 },
  { city: "Bengaluru", name: "Christ University", sortOrder: 10 },
  { city: "Bengaluru", name: "St. Joseph's College", sortOrder: 20 },
  { city: "Bhubaneswar", name: "Utkal University", sortOrder: 10 },
  { city: "Jaipur", name: "University of Rajasthan", sortOrder: 10 },
  { city: "Patna", name: "Patna University", sortOrder: 10 },
  { city: "Ranchi", name: "Ranchi University", sortOrder: 10 },
];

export const ANIMATION_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Mumbai", name: "Whistling Woods International", sortOrder: 10 },
  { city: "Mumbai", name: "Zee Institute of Creative Art (ZICA), Mumbai", sortOrder: 20 },
  { city: "Pune", name: "Maya Academy of Advanced Cinematics (MAAC), Pune", sortOrder: 10 },
  { city: "Bengaluru", name: "Srishti Manipal Institute of Art, Design and Technology", sortOrder: 10 },
  { city: "Delhi", name: "Zee Institute of Creative Art (ZICA), Delhi", sortOrder: 10 },
  { city: "Hyderabad", name: "Zee Institute of Creative Art (ZICA), Hyderabad", sortOrder: 10 },
  { city: "Kolkata", name: "Zee Institute of Creative Art (ZICA), Kolkata", sortOrder: 10 },
];

export const HOTEL_MANAGEMENT_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "Institute of Hotel Management, Catering Technology and Applied Nutrition (IHM Pusa)", sortOrder: 5 },
  { city: "Delhi", name: "Oberoi Centre of Learning and Development", sortOrder: 15 },
  { city: "Mumbai", name: "Institute of Hotel Management (IHM), Mumbai", sortOrder: 10 },
  { city: "Chennai", name: "Institute of Hotel Management (IHM), Chennai", sortOrder: 10 },
  { city: "Kolkata", name: "Institute of Hotel Management (IHM), Kolkata", sortOrder: 10 },
  { city: "Pune", name: "Institute of Hotel Management (IHM), Pune", sortOrder: 10 },
  { city: "Ahmedabad", name: "Institute of Hotel Management (IHM), Ahmedabad", sortOrder: 10 },
  { city: "Hyderabad", name: "Institute of Hotel Management (IHM), Hyderabad", sortOrder: 10 },
  { city: "Manipal", name: "Welcomgroup Graduate School of Hotel Administration, Manipal", sortOrder: 10 },
];

export const AGRICULTURE_COLLEGE_SEEDS: SeedCollege[] = [
  { city: "Delhi", name: "Indian Agricultural Research Institute (IARI), Pusa", nirfRank: 1 },
  { city: "Ludhiana", name: "Punjab Agricultural University (PAU)", sortOrder: 10 },
  { city: "Bengaluru", name: "University of Agricultural Sciences (UAS), Bengaluru", sortOrder: 10 },
  { city: "Coimbatore", name: "Tamil Nadu Agricultural University (TNAU)", sortOrder: 10 },
  { city: "Anand", name: "Anand Agricultural University", sortOrder: 10 },
  { city: "Varanasi", name: "Institute of Agricultural Sciences, Banaras Hindu University", sortOrder: 10 },
  { city: "Kanpur", name: "Chandra Shekhar Azad University of Agriculture and Technology", sortOrder: 10 },
  { city: "Hisar", name: "Chaudhary Charan Singh Haryana Agricultural University", sortOrder: 10 },
  { city: "Akola", name: "Dr. Panjabrao Deshmukh Krishi Vidyapeeth", sortOrder: 10 },
];

export const COLLEGE_SEEDS_BY_CATEGORY: Record<string, SeedCollege[]> = {
  Engineering: ENGINEERING_COLLEGE_SEEDS,
  Design: DESIGN_COLLEGE_SEEDS,
  Medical: MEDICAL_COLLEGE_SEEDS,
  Management: MANAGEMENT_COLLEGE_SEEDS,
  Law: LAW_COLLEGE_SEEDS,
  Architecture: ARCHITECTURE_COLLEGE_SEEDS,
  Commerce: COMMERCE_COLLEGE_SEEDS,
  Science: SCIENCE_COLLEGE_SEEDS,
  Arts: ARTS_COLLEGE_SEEDS,
  Animation: ANIMATION_COLLEGE_SEEDS,
  "Hotel Management": HOTEL_MANAGEMENT_COLLEGE_SEEDS,
  Agriculture: AGRICULTURE_COLLEGE_SEEDS,
};
