export interface DemoComplaint {
  id: number;
  complaintNumber: string;
  category: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationAccuracy?: number | null;
  publicLatitude: number;
  publicLongitude: number;
  address: string;
  municipalityId: number;
  wardId: number;
  departmentId: number;
  reportedByUid?: string | null;
  anonymousPublicId: string;
  status: string;
  priority: string;
  severity: string;
  verificationStatus: string;
  assignedCrewId?: number | null;
  assignedWorkerId?: number | null;
  duplicateGroupId?: string | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  media?: any[];
  history?: any[];
}

const now = new Date();
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000).toISOString();

// Initial Seed Data with 12 complaints (including 5 Kukatpally root-cause cluster)
const initialComplaints: DemoComplaint[] = [
  {
    id: 1,
    complaintNumber: 'CF-KP01DRN',
    category: 'Drainage',
    title: 'Severe road flooding after moderate rain near Metro Exit B',
    description: 'Road inundated with 2 feet of dirty water near Kukatpally Metro entrance. Pedestrians unable to access transit. Water backing up from road culverts.',
    latitude: 17.494720,
    longitude: 78.399610,
    publicLatitude: 17.494800,
    publicLongitude: 78.399700,
    address: 'Near Kukatpally Metro Station Pillar 812, KPHB Main Road, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-8101',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    severity: 'CRITICAL',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 1,
    assignedWorkerId: 3,
    duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
    createdAt: hoursAgo(6),
    updatedAt: hoursAgo(2),
    resolvedAt: null,
    media: [],
  },
  {
    id: 2,
    complaintNumber: 'CF-KP02DRN',
    category: 'Drainage',
    title: 'Stormwater drain overflowing with plastic blockage on Lane 2',
    description: 'Major stormwater drain completely choked with silt and commercial plastic waste. Dirty runoff spilling into storefronts along Lane 2 behind the metro station.',
    latitude: 17.495180,
    longitude: 78.400210,
    publicLatitude: 17.495250,
    publicLongitude: 78.400300,
    address: 'Lane 2, Behind Metro Station, Kukatpally, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-8102',
    status: 'VERIFIED',
    priority: 'HIGH',
    severity: 'HIGH',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 1,
    assignedWorkerId: 4,
    duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
    createdAt: hoursAgo(8),
    updatedAt: hoursAgo(3),
    resolvedAt: null,
    media: [],
  },
  {
    id: 3,
    complaintNumber: 'CF-KP03DRN',
    category: 'Drainage',
    title: 'Sewage and black water backflow accumulating across school approach',
    description: 'Underground chamber cover dislodged by back-pressure. Foul sewage water pooling over 50 meters outside ZPHS School gates during morning assembly.',
    latitude: 17.493910,
    longitude: 78.400820,
    publicLatitude: 17.494000,
    publicLongitude: 78.400900,
    address: 'Adjacent to ZPHS Government High School, Kukatpally, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-8103',
    status: 'REPORTED',
    priority: 'URGENT',
    severity: 'HIGH',
    verificationStatus: 'PENDING',
    assignedCrewId: null,
    assignedWorkerId: null,
    duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
    createdAt: hoursAgo(10),
    updatedAt: hoursAgo(10),
    resolvedAt: null,
    media: [],
  },
  {
    id: 4,
    complaintNumber: 'CF-KP04DRN',
    category: 'Drainage',
    title: 'Collapsed stormwater culvert slab choking arterial runoff',
    description: 'Reinforced concrete culvert cover collapsed into main trunk drain, completely damming stormwater flow. Water rising rapidly toward residential basements.',
    latitude: 17.495850,
    longitude: 78.398920,
    publicLatitude: 17.495900,
    publicLongitude: 78.399000,
    address: 'Sardar Patel Nagar Culvert Junction, Kukatpally, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-8104',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    severity: 'CRITICAL',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 1,
    assignedWorkerId: 3,
    duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(1),
    resolvedAt: null,
    media: [],
  },
  {
    id: 5,
    complaintNumber: 'CF-KP05DRN',
    category: 'Drainage',
    title: 'Stagnant water ponding in front of auto stand creating health hazard',
    description: 'Runoff from blocked Kukatpally main drain collecting in a 20-meter puddle. High mosquito breeding risk and slippery surface causing two-wheeler skids.',
    latitude: 17.494220,
    longitude: 78.399150,
    publicLatitude: 17.494300,
    publicLongitude: 78.399250,
    address: 'Auto Stand Terminal, Metro Pillar 810, Kukatpally, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-8105',
    status: 'REPORTED',
    priority: 'HIGH',
    severity: 'MEDIUM',
    verificationStatus: 'PENDING',
    assignedCrewId: null,
    assignedWorkerId: null,
    duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
    createdAt: hoursAgo(4),
    updatedAt: hoursAgo(4),
    resolvedAt: null,
    media: [],
  },
  {
    id: 6,
    complaintNumber: 'CF-KP06RDS',
    category: 'Pothole',
    title: 'Deep hazardous crater pothole on KPHB Road No. 1',
    description: 'Large asphalt crater approx 8 inches deep in middle of bus lane. Multiple vehicles damaged rims during evening rush hour.',
    latitude: 17.492100,
    longitude: 78.405500,
    publicLatitude: 17.492200,
    publicLongitude: 78.405600,
    address: 'KPHB Colony Phase 1 Main Road, Near Rythu Bazaar, Hyderabad',
    municipalityId: 1,
    wardId: 2,
    departmentId: 3,
    anonymousPublicId: 'Citizen #CF-9201',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    severity: 'HIGH',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 2,
    assignedWorkerId: 5,
    duplicateGroupId: null,
    createdAt: daysAgo(1),
    updatedAt: hoursAgo(5),
    resolvedAt: null,
    media: [],
  },
  {
    id: 7,
    complaintNumber: 'CF-KP07SNT',
    category: 'Garbage',
    title: 'Uncollected commercial garbage pile attracting stray animals',
    description: 'Overflowing municipal dumper bin has not been cleared for 4 days. Waste spreading into roadway, blocking pedestrian passage.',
    latitude: 17.488500,
    longitude: 78.411200,
    publicLatitude: 17.488600,
    publicLongitude: 78.411300,
    address: 'Opposite Community Hall, KPHB Phase 4, Hyderabad',
    municipalityId: 1,
    wardId: 2,
    departmentId: 2,
    anonymousPublicId: 'Citizen #CF-9202',
    status: 'REPORTED',
    priority: 'MEDIUM',
    severity: 'HIGH',
    verificationStatus: 'PENDING',
    assignedCrewId: null,
    assignedWorkerId: null,
    duplicateGroupId: null,
    createdAt: daysAgo(3),
    updatedAt: daysAgo(3),
    resolvedAt: null,
    media: [],
  },
  {
    id: 8,
    complaintNumber: 'CF-KP08LGT',
    category: 'Streetlight',
    title: 'Dark zone: 4 consecutive LED streetlights dead on Allwyn Road',
    description: 'Complete blackout along 200m stretch of Allwyn Colony Road. Women commuters facing severe safety concerns at night.',
    latitude: 17.501200,
    longitude: 78.404100,
    publicLatitude: 17.501300,
    publicLongitude: 78.404200,
    address: 'Allwyn Colony Road, Near Water Tank, Hyderabad',
    municipalityId: 1,
    wardId: 3,
    departmentId: 4,
    anonymousPublicId: 'Citizen #CF-9203',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    severity: 'MEDIUM',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 4,
    assignedWorkerId: null,
    duplicateGroupId: null,
    createdAt: daysAgo(2),
    updatedAt: hoursAgo(12),
    resolvedAt: null,
    media: [],
  },
  {
    id: 9,
    complaintNumber: 'CF-KP09WTR',
    category: 'Water Leakage',
    title: 'High pressure drinking water main pipeline rupture flooding street',
    description: 'Clean drinking water gushing under high pressure from underground connection. Potable water wasted and street submerged.',
    latitude: 17.481500,
    longitude: 78.419000,
    publicLatitude: 17.481600,
    publicLongitude: 78.419100,
    address: 'Moosapet Industrial Road, Near Junction, Hyderabad',
    municipalityId: 1,
    wardId: 4,
    departmentId: 5,
    anonymousPublicId: 'Citizen #CF-9204',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    severity: 'CRITICAL',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 1,
    assignedWorkerId: 3,
    duplicateGroupId: null,
    createdAt: hoursAgo(3),
    updatedAt: hoursAgo(1),
    resolvedAt: null,
    media: [],
  },
  {
    id: 10,
    complaintNumber: 'CF-KP10RES',
    category: 'Pothole',
    title: 'Damaged speed breaker asphalt repaired and levelled',
    description: 'Illegal uneven concrete bump removed and newly paved with hot mix asphalt. Thermoplastic paint markings applied.',
    latitude: 17.497500,
    longitude: 78.403000,
    publicLatitude: 17.497600,
    publicLongitude: 78.403100,
    address: 'Road No. 3, KPHB Colony, Hyderabad',
    municipalityId: 1,
    wardId: 2,
    departmentId: 3,
    anonymousPublicId: 'Citizen #CF-9205',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    severity: 'MEDIUM',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 2,
    assignedWorkerId: 5,
    duplicateGroupId: null,
    createdAt: daysAgo(5),
    updatedAt: daysAgo(1),
    resolvedAt: daysAgo(1),
    media: [],
  },
  {
    id: 11,
    complaintNumber: 'CF-KP11SNT',
    category: 'Garbage',
    title: 'Construction debris dumped on footpath cleared',
    description: 'Ten metric tons of concrete rubble and discarded tiles removed by front-loader truck. Footpath restored for public use.',
    latitude: 17.486200,
    longitude: 78.408800,
    publicLatitude: 17.486300,
    publicLongitude: 78.408900,
    address: 'Near JNTU Metro Station Service Road, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 2,
    anonymousPublicId: 'Citizen #CF-9206',
    status: 'RESOLVED',
    priority: 'MEDIUM',
    severity: 'LOW',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 3,
    assignedWorkerId: 4,
    duplicateGroupId: null,
    createdAt: daysAgo(7),
    updatedAt: daysAgo(2),
    resolvedAt: daysAgo(2),
    media: [],
  },
  {
    id: 12,
    complaintNumber: 'CF-KP12ROP',
    category: 'Drainage',
    title: 'Manhole desilting incomplete; sewage backpressure persists',
    description: 'Initial drain cleanup was marked complete but residue was not cleared. Resident reported recurring sewage backup during morning hours.',
    latitude: 17.498200,
    longitude: 78.397500,
    publicLatitude: 17.498300,
    publicLongitude: 78.397600,
    address: 'Housing Board Colony, 3rd Cross, Kukatpally, Hyderabad',
    municipalityId: 1,
    wardId: 1,
    departmentId: 1,
    anonymousPublicId: 'Citizen #CF-9207',
    status: 'REPORTED',
    priority: 'HIGH',
    severity: 'HIGH',
    verificationStatus: 'VERIFIED',
    assignedCrewId: 1,
    assignedWorkerId: 3,
    duplicateGroupId: null,
    createdAt: daysAgo(4),
    updatedAt: hoursAgo(5),
    resolvedAt: null,
    media: [],
  },
];

// In-Memory store to hold demo complaints + user submitted complaints
let demoStore: DemoComplaint[] = [...initialComplaints];

export const getDemoComplaints = (filters?: { category?: string; status?: string; limit?: number }) => {
  let list = [...demoStore];
  if (filters?.category && filters.category !== 'ALL') {
    const cats = filters.category.split(',').map(c => c.trim().toLowerCase());
    list = list.filter(c => cats.includes(c.category.toLowerCase()));
  }
  if (filters?.status && filters.status !== 'ALL') {
    const stats = filters.status.split(',').map(s => s.trim().toUpperCase());
    list = list.filter(c => stats.includes(c.status.toUpperCase()));
  }
  const limit = filters?.limit || 150;
  return list.slice(0, limit);
};

export const getDemoComplaintByNumber = (complaintNumber: string) => {
  return demoStore.find(c => c.complaintNumber.toUpperCase() === complaintNumber.toUpperCase()) || null;
};

export const addDemoComplaint = (newComp: Omit<DemoComplaint, 'id'>) => {
  const id = demoStore.length > 0 ? Math.max(...demoStore.map(c => c.id)) + 1 : 1;
  const fullComp: DemoComplaint = {
    ...newComp,
    id,
    createdAt: newComp.createdAt || new Date().toISOString(),
    updatedAt: newComp.updatedAt || new Date().toISOString(),
    media: newComp.media || [],
    history: [
      {
        id: 1,
        complaintId: id,
        previousStatus: null,
        newStatus: 'REPORTED',
        changedBy: newComp.anonymousPublicId,
        reason: 'Citizen submitted initial civic problem report with evidence.',
        createdAt: new Date().toISOString(),
      }
    ],
  };
  demoStore.unshift(fullComp);
  return fullComp;
};

export const getDemoStats = () => {
  const total = demoStore.length;
  const reported = demoStore.filter(c => c.status === 'REPORTED').length;
  const verified = demoStore.filter(c => c.status === 'VERIFIED').length;
  const inProgress = demoStore.filter(c => ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'ARRIVED'].includes(c.status)).length;
  const resolved = demoStore.filter(c => c.status === 'RESOLVED').length;
  return {
    totalComplaints: total,
    reportedCount: reported,
    verifiedCount: verified,
    inProgressCount: inProgress,
    resolvedCount: resolved,
    avgResolutionHours: 18.4,
    slaComplianceRate: 94.2,
  };
};
