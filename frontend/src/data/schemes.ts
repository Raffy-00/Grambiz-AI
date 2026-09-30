export interface OfficialPortalLink {
  id: string;
  name: string;
  portalName: string;
  domain: string;
  url: string;
  description: string;
  badge: string;
  badgeColor?: string;
}

export interface SchemeInfo {
  id: string;
  name: string;
  maxProjectCost: number;
  maxFunding: number;
  interestRate: number;
  tenureYears: number;
  moratoriumMonths: number;
  beneficiaryMarginRatio: number;
  description: string;
  portalName: string;
  portalUrl: string;
  portalDomain: string;
  subsidyText: string;
  nodalMinistry: string;
  alternativePortals: OfficialPortalLink[];
}

export const OFFICIAL_GOVERNMENT_SCHEME_PORTALS: OfficialPortalLink[] = [
  {
    id: 'pmegp_portal',
    name: 'PMEGP e-Portal (Prime Minister Employment Generation Programme)',
    portalName: 'PMEGP 2.0 Portal (MSME)',
    domain: 'pmegp.msme.gov.in',
    url: 'https://pmegp.msme.gov.in/Home/HomePage',
    description: 'Direct online application for up to 35% non-repayable rural capital subsidy and 90% bank loan.',
    badge: '15%  –  35% Capital Subsidy',
    badgeColor: 'bg-[#EDF3F1] text-[#176B67] border-[#7FA99B]'
  },
  {
    id: 'jansamarth_portal',
    name: 'Jan Samarth National Portal (Unified Credit Schemes)',
    portalName: 'Jan Samarth National Portal',
    domain: 'jansamarth.in',
    url: 'https://jansamarth.in/',
    description: 'Government of India unified platform linking 13 credit-linked subsidy schemes across 200+ banks.',
    badge: 'Unified 200+ Banks Apply',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-300'
  },
  {
    id: 'mudra_portal',
    name: 'Pradhan Mantri MUDRA Yojana (PMMY)',
    portalName: 'PM MUDRA National Portal',
    domain: 'mudra.org.in',
    url: 'https://www.mudra.org.in/',
    description: 'Collateral-free micro loans up to ₹10 Lakhs (Shishu, Kishor, and Tarun) for non-corporate micro enterprises.',
    badge: '100% Collateral-Free Credit',
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-300'
  },
  {
    id: 'udyamimitra_portal',
    name: 'Udyami Mitra Portal (SIDBI National Credit Window)',
    portalName: 'Udyami Mitra (SIDBI)',
    domain: 'udyamimitra.in',
    url: 'https://www.udyamimitra.in/',
    description: 'SIDBI online matchmaking portal connecting applicants with commercial bank branches and credit guarantee funds.',
    badge: 'SIDBI Assisted Digital Match',
    badgeColor: 'bg-[#EDF3F1] text-rose-900 border-[#7FA99B]'
  },
  {
    id: 'standup_portal',
    name: 'Stand-Up India Portal (SC/ST & Women Entrepreneurs)',
    portalName: 'Stand-Up Mitra Portal',
    domain: 'standupmitra.in',
    url: 'https://www.standupmitra.in/',
    description: 'Bank loans between ₹10 Lakh and ₹1 Crore for greenfield enterprises set up by SC/ST and Women entrepreneurs.',
    badge: '₹10L  –  ₹1Cr for SC/ST & Women',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300'
  },
  {
    id: 'pmfme_portal',
    name: 'PMFME Portal (Micro Food Processing Enterprises Scheme)',
    portalName: 'PMFME National Portal',
    domain: 'pmfme.mofpi.gov.in',
    url: 'https://pmfme.mofpi.gov.in/',
    description: 'Ministry of Food Processing Industries (MoFPI) scheme providing 35% credit-linked capital subsidy up to ₹10 Lakh.',
    badge: '35% Food Processing Subsidy',
    badgeColor: 'bg-[#FBF6EA] text-[#A07C2E] border-amber-300'
  }
];

export const SCHEME_CONFIGS: SchemeInfo[] = [
  {
    id: 'MICRO_FINANCE',
    name: 'Micro Finance Scheme',
    maxProjectCost: 140000,
    maxFunding: 125000,
    interestRate: 6.5,
    tenureYears: 3,
    moratoriumMonths: 3,
    beneficiaryMarginRatio: 0.10,
    description: 'Concessional micro credit scheme for project costs up to ₹1.40 Lakh.',
    portalName: 'Jan Samarth Portal / MUDRA',
    portalUrl: 'https://jansamarth.in/',
    portalDomain: 'jansamarth.in',
    subsidyText: 'Zero Collateral & Concessional 6.5% Rate',
    nodalMinistry: 'Ministry of Finance & SIDBI',
    alternativePortals: [
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[1], // Jan Samarth
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[2], // MUDRA
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[3], // Udyami Mitra
    ]
  },
  {
    id: 'TERM_LOAN',
    name: 'Term Loan Scheme (PMEGP / MUDRA)',
    maxProjectCost: 5000000,
    maxFunding: 4500000,
    interestRate: 8.0,
    tenureYears: 7,
    moratoriumMonths: 6,
    beneficiaryMarginRatio: 0.10,
    description: 'Term loan assistance with up to 35% rural capital subsidy under PMEGP for project costs up to ₹50 Lakh.',
    portalName: 'PMEGP 2.0 Portal (MSME)',
    portalUrl: 'https://pmegp.msme.gov.in/Home/HomePage',
    portalDomain: 'pmegp.msme.gov.in',
    subsidyText: 'Up to 35% Non-Repayable Rural Capital Subsidy',
    nodalMinistry: 'Ministry of MSME & KVIC',
    alternativePortals: [
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[0], // PMEGP
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[1], // Jan Samarth
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[2], // MUDRA
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[4], // Stand-Up India
      OFFICIAL_GOVERNMENT_SCHEME_PORTALS[5], // PMFME
    ]
  }
];

export const getSchemeByCost = (projectCost: number): SchemeInfo => {
  if (projectCost <= 140000) {
    return SCHEME_CONFIGS[0];
  }
  return SCHEME_CONFIGS[1];
};

