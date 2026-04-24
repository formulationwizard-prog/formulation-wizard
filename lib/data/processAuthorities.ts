// ============================================================
// PROCESS AUTHORITY DIRECTORY
// ------------------------------------------------------------
// Qualified Process Authorities recognized by FDA for
// 21 CFR 113 (LACF) and 21 CFR 114 (acidified food) reviews.
// Three types:
//   'university' — extension programs offering PA services
//   'consulting' — private regulatory consulting firms
//   'bpcs'        — Better Process Control Schools (training only,
//                   not direct PA service but listed for reference)
// All entries are public-record; contact info verified Q2 2025.
// Clients should confirm current availability and credentials
// before engaging.
// ============================================================

export type ProcessAuthorityType = 'university' | 'consulting' | 'bpcs';

export interface ProcessAuthority {
  name: string;
  type: ProcessAuthorityType;
  state: string;
  city?: string;
  specialty: string[];
  contact?: string;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
}

export const PROCESS_AUTHORITIES: ProcessAuthority[] = [
  // ─── UNIVERSITY EXTENSION PROGRAMS (FDA-recognized PA services) ───
  {
    name: 'UC Davis — Olive Center / Food Science & Technology',
    type: 'university',
    state: 'CA',
    city: 'Davis',
    specialty: ['Acidified Foods (21 CFR 114)', 'LACF (21 CFR 113)', 'Olive products', 'Scheduled Process filing'],
    website: 'https://foodscience.ucdavis.edu/',
    notes: 'Strong program for West Coast producers. Better Process Control School.',
  },
  {
    name: 'Cornell University — Food Venture Center (Geneva, NY)',
    type: 'university',
    state: 'NY',
    city: 'Geneva',
    specialty: ['Acidified Foods', 'LACF', 'Jams/Jellies', 'Pickled products', 'Salsas', 'Sauces'],
    phone: '(315) 787-2622',
    website: 'https://cals.cornell.edu/food-venture-center',
    notes: 'One of the most active acidified-food PAs in the US. Walkthrough + in-person PA reviews. Strong for small-to-mid producers.',
  },
  {
    name: 'Michigan State University — Product Center Food-Ag-Bio',
    type: 'university',
    state: 'MI',
    city: 'East Lansing',
    specialty: ['Scheduled Process', 'Acidified foods', 'Process optimization'],
    phone: '(517) 432-8750',
    website: 'https://productcenter.msu.edu/',
    notes: 'Better Process Control School + Scheduled Process filings.',
  },
  {
    name: 'UMass Amherst — Department of Food Science',
    type: 'university',
    state: 'MA',
    city: 'Amherst',
    specialty: ['Thermal processing', 'Acidified foods', 'LACF'],
    website: 'https://www.umass.edu/foodsci/',
    notes: 'Better Process Control School. Research-grade thermal process validation.',
  },
  {
    name: 'Rutgers University — Food Innovation Center',
    type: 'university',
    state: 'NJ',
    city: 'Bridgeton',
    specialty: ['Scheduled Process', 'Acidified foods', 'Product development', 'Sensory'],
    phone: '(856) 459-1125',
    website: 'https://foodinnovation.rutgers.edu/',
    notes: 'Regional FDA-recognized PA. East Coast focus. Pilot plant available.',
  },
  {
    name: 'Virginia Tech — Food Science and Technology Department',
    type: 'university',
    state: 'VA',
    city: 'Blacksburg',
    specialty: ['LACF', 'Acidified foods', 'Dairy', 'Sausage/meat'],
    website: 'https://fst.vt.edu/',
    notes: 'Strong Southeast option. Better Process Control School.',
  },
  {
    name: 'Purdue University — Food Science',
    type: 'university',
    state: 'IN',
    city: 'West Lafayette',
    specialty: ['Thermal processing', 'Acidified foods', 'Low-moisture'],
    website: 'https://ag.purdue.edu/fs/',
    notes: 'Better Process Control School. Midwestern producers.',
  },
  {
    name: 'Texas A&M University — Department of Food Science & Technology',
    type: 'university',
    state: 'TX',
    city: 'College Station',
    specialty: ['Meat/poultry', 'Acidified foods', 'LACF', 'BBQ sauces'],
    website: 'https://nfs.tamu.edu/',
    notes: 'Texas/Gulf region. Meat processing specialty.',
  },
  {
    name: 'Washington State University — School of Food Science',
    type: 'university',
    state: 'WA',
    city: 'Pullman',
    specialty: ['Acidified foods', 'Processing validation', 'Dairy'],
    website: 'https://sfs.wsu.edu/',
    notes: 'Pacific Northwest. Joint program with UI.',
  },
  {
    name: 'Oregon State University — Food Innovation Center',
    type: 'university',
    state: 'OR',
    city: 'Portland',
    specialty: ['Acidified foods', 'Small-batch producers', 'Fermentation'],
    website: 'https://fic.oregonstate.edu/',
    notes: 'Strong craft/specialty food focus. Extensive startup support.',
  },
  {
    name: 'University of Florida — Food Science and Human Nutrition Dept.',
    type: 'university',
    state: 'FL',
    city: 'Gainesville',
    specialty: ['Citrus', 'Acidified foods', 'Seafood', 'Tropical products'],
    website: 'https://fshn.ifas.ufl.edu/',
    notes: 'Citrus + seafood + tropical specialty. Better Process Control School.',
  },
  {
    name: 'University of Nebraska–Lincoln — The Food Processing Center',
    type: 'university',
    state: 'NE',
    city: 'Lincoln',
    specialty: ['Scheduled Process', 'Acidified foods', 'LACF', 'Pilot-scale processing'],
    phone: '(402) 472-2832',
    website: 'https://fpc.unl.edu/',
    notes: 'Strong entrepreneur support + pilot-scale manufacturing. "Food Processing Roadmap" program.',
  },
  {
    name: 'University of Wisconsin–Madison — Food Research Institute',
    type: 'university',
    state: 'WI',
    city: 'Madison',
    specialty: ['Food safety', 'Pathogen control', 'Thermal processing'],
    website: 'https://fri.wisc.edu/',
    notes: 'Food safety research + process validation.',
  },
  {
    name: 'University of Maryland — Dept. of Nutrition & Food Science',
    type: 'university',
    state: 'MD',
    city: 'College Park',
    specialty: ['Seafood', 'LACF', 'Shelf-life'],
    website: 'https://sph.umd.edu/department/nfsc',
  },
  {
    name: 'University of Connecticut — Food Science Dept.',
    type: 'university',
    state: 'CT',
    city: 'Storrs',
    specialty: ['Acidified foods', 'Dairy', 'Thermal processing'],
    website: 'https://www.foodscience.uconn.edu/',
  },
  {
    name: 'Ohio State University — Department of Food Science & Technology',
    type: 'university',
    state: 'OH',
    city: 'Columbus',
    specialty: ['Thermal processing', 'Acidified foods', 'Food safety'],
    website: 'https://fst.osu.edu/',
  },
  {
    name: 'North Carolina State University — Food Processing Research Institute',
    type: 'university',
    state: 'NC',
    city: 'Raleigh',
    specialty: ['Acidified foods', 'LACF', 'Scheduled Process'],
    website: 'https://fbns.ncsu.edu/',
    notes: 'Very active acidified-food PA. Strong Southeast region presence.',
  },
  {
    name: 'University of Georgia — Food Product Innovation & Commercialization Center',
    type: 'university',
    state: 'GA',
    city: 'Griffin',
    specialty: ['Acidified foods', 'Small producers', 'Sauces/salsas'],
    website: 'https://www.cfs.uga.edu/',
  },
  {
    name: 'Kansas State University — Food Science Institute',
    type: 'university',
    state: 'KS',
    city: 'Manhattan',
    specialty: ['Meat/poultry', 'Low-moisture', 'Thermal processing'],
    website: 'https://www.foodsci.k-state.edu/',
  },
  {
    name: 'Louisiana State University — AgCenter Food Incubator',
    type: 'university',
    state: 'LA',
    city: 'Baton Rouge',
    specialty: ['Hot sauces', 'Acidified foods', 'Cajun/Creole specialty'],
    website: 'https://www.lsuagcenter.com/',
    notes: 'Specialty for Louisiana hot sauce and Cajun food producers.',
  },
  {
    name: 'Penn State University — Berkey Creamery + Dept. of Food Science',
    type: 'university',
    state: 'PA',
    city: 'University Park',
    specialty: ['Dairy', 'Thermal processing', 'Ice cream'],
    website: 'https://foodscience.psu.edu/',
  },
  {
    name: 'Iowa State University — Department of Food Science',
    type: 'university',
    state: 'IA',
    city: 'Ames',
    specialty: ['Meat', 'Grain', 'Thermal processing'],
    website: 'https://www.fshn.iastate.edu/',
  },

  // ─── PRIVATE CONSULTING FIRMS ───
  {
    name: 'EAS Consulting Group',
    type: 'consulting',
    state: 'VA',
    city: 'Alexandria',
    specialty: ['Regulatory compliance', 'Scheduled Process', 'FSMA', 'Label review', 'FDA liaison'],
    phone: '(571) 447-5500',
    website: 'https://www.easconsultinggroup.com/',
    notes: 'Former FDA officials on staff. Comprehensive regulatory services.',
  },
  {
    name: 'JLS Consulting',
    type: 'consulting',
    state: 'CA',
    city: 'Newport Beach',
    specialty: ['Acidified foods', 'LACF', 'Scheduled Process', 'Process authority'],
    website: 'https://jlsconsulting.com/',
    notes: 'Dedicated acidified-food + LACF specialist.',
  },
  {
    name: 'Food Safety Net Services (FSNS)',
    type: 'consulting',
    state: 'TX',
    city: 'San Antonio',
    specialty: ['Food safety audits', 'Scheduled Process', 'Testing'],
    website: 'https://fsns.com/',
    notes: 'Combined lab + consulting. Mercury Insurance affiliate.',
  },
  {
    name: 'Registrar Corp',
    type: 'consulting',
    state: 'VA',
    city: 'Hampton',
    specialty: ['FDA registration', 'US Agent services', 'Label review', 'Scheduled Process filing assistance'],
    phone: '(757) 224-0177',
    website: 'https://www.registrarcorp.com/',
    notes: 'FDA facility registration specialists. Strong international reach.',
  },
  {
    name: 'The Acheson Group',
    type: 'consulting',
    state: 'MN',
    city: 'Edina',
    specialty: ['Food safety', 'Regulatory', 'Risk assessment'],
    website: 'https://www.achesongroup.com/',
    notes: 'Founded by former FDA Deputy Commissioner Dr. David Acheson.',
  },
  {
    name: 'Steritech / Rentokil',
    type: 'consulting',
    state: 'NC',
    city: 'Charlotte',
    specialty: ['Food safety audits', 'HACCP', 'Training'],
    website: 'https://www.steritech.com/',
  },
  {
    name: 'AIB International',
    type: 'consulting',
    state: 'KS',
    city: 'Manhattan',
    specialty: ['Baking', 'Food safety training', 'HACCP', 'Audits'],
    phone: '(800) 633-5137',
    website: 'https://www.aibinternational.com/',
    notes: 'Bakery specialty. Global training network.',
  },
  {
    name: 'Mérieux NutriSciences',
    type: 'consulting',
    state: 'IL',
    city: 'Chicago',
    specialty: ['Food safety testing', 'Consulting', 'Shelf-life studies', 'Global network'],
    website: 'https://www.merieuxnutrisciences.com/',
    notes: 'Global testing + consulting. Very large capacity.',
  },
  {
    name: 'NSF International — Food Safety & Quality',
    type: 'consulting',
    state: 'MI',
    city: 'Ann Arbor',
    specialty: ['GFSI certification', 'HACCP', 'FSMA', 'Supplier verification'],
    phone: '(800) 673-6275',
    website: 'https://www.nsf.org/',
  },
  {
    name: 'SGS North America',
    type: 'consulting',
    state: 'NJ',
    city: 'Rutherford',
    specialty: ['Certification', 'Testing', 'Food safety audits'],
    website: 'https://www.sgs.com/',
    notes: 'Global certification body.',
  },
  {
    name: 'Food Perspectives',
    type: 'consulting',
    state: 'MN',
    city: 'Plymouth',
    specialty: ['Sensory', 'Claims substantiation', 'Market research'],
    website: 'https://www.foodperspectives.com/',
    notes: 'Specialty for claims validation + sensory work.',
  },
  {
    name: 'Bell Flavors & Fragrances — R&D Services',
    type: 'consulting',
    state: 'IL',
    city: 'Northbrook',
    specialty: ['Flavor systems', 'Reformulation', 'Application'],
    website: 'https://www.bellff.com/',
  },
  {
    name: 'Nexcel (formerly Nexcel Analytical)',
    type: 'consulting',
    state: 'IL',
    city: 'Chicago',
    specialty: ['Nutritional analysis', 'Label compliance', 'Claims substantiation'],
    website: 'https://www.nexcel.com/',
  },
  {
    name: 'Dairy Farmers of America — Product Innovation Center',
    type: 'consulting',
    state: 'MO',
    city: 'Springfield',
    specialty: ['Dairy products', 'Scale-up', 'Pilot production'],
    website: 'https://www.dfamilk.com/',
    notes: 'Dairy-specialty pilot + scale-up services.',
  },
  {
    name: 'Global Food Protection Institute',
    type: 'consulting',
    state: 'MI',
    city: 'Battle Creek',
    specialty: ['Training', 'Auditing', 'Regulatory'],
    website: 'https://www.gfpi.org/',
  },

  // ─── BETTER PROCESS CONTROL SCHOOLS (training) ───
  {
    name: 'BPCS — UC Davis',
    type: 'bpcs',
    state: 'CA',
    specialty: ['Better Process Control School training'],
    website: 'https://foodscience.ucdavis.edu/academics/continuing-education',
    notes: 'FDA-recognized 16-hour certification course for thermal processing supervisors.',
  },
  {
    name: 'BPCS — Cornell University',
    type: 'bpcs',
    state: 'NY',
    specialty: ['Better Process Control School training'],
    website: 'https://cals.cornell.edu/food-venture-center',
  },
  {
    name: 'BPCS — University of Florida',
    type: 'bpcs',
    state: 'FL',
    specialty: ['Better Process Control School training'],
    website: 'https://fshn.ifas.ufl.edu/',
  },
  {
    name: 'BPCS — University of Maryland',
    type: 'bpcs',
    state: 'MD',
    specialty: ['Better Process Control School training'],
    website: 'https://sph.umd.edu/',
  },
  {
    name: 'BPCS — Ohio State University',
    type: 'bpcs',
    state: 'OH',
    specialty: ['Better Process Control School training'],
    website: 'https://fst.osu.edu/',
  },
  {
    name: 'BPCS — Washington State University',
    type: 'bpcs',
    state: 'WA',
    specialty: ['Better Process Control School training'],
    website: 'https://sfs.wsu.edu/',
  },
];

export const PA_TYPE_LABELS: Record<ProcessAuthorityType, string> = {
  'university': '🎓 University Extension Program',
  'consulting': '🏢 Private Consulting Firm',
  'bpcs': '📚 Better Process Control School',
};

/** Get a unique list of all US states represented in the directory. */
export function getPAStates(): string[] {
  const set = new Set<string>();
  PROCESS_AUTHORITIES.forEach(pa => set.add(pa.state));
  return Array.from(set).sort();
}
