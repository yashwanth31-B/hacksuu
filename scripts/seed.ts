import { db, pool } from '../src/db/index.ts';
import {
  adminEmails,
  systemSettings,
  profiles,
  municipalities,
  wards,
  departments,
  crews,
  crewMembers,
  complaints,
  complaintMedia,
  complaintHistory,
  auditLogs,
} from '../src/db/schema.ts';
import { eq, count } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

export async function seedDatabase() {
  console.log('====================================================');
  console.log('   CivicFix AI - Idempotent Database Seeder');
  console.log('====================================================');

  const hasDbUrl = Boolean(process.env.DATABASE_URL);
  const hasSqlHost = Boolean(process.env.SQL_HOST);

  if (!hasDbUrl && !hasSqlHost) {
    console.warn('[WARN] Neither DATABASE_URL nor SQL_HOST set in environment.');
    console.warn('[WARN] Seed script requires valid database configuration.');
    return {
      success: false,
      error: 'DATABASE_URL or SQL_HOST required to connect to database.',
      stats: { municipalities: 0, departments: 0, crews: 0, complaints: 0, clusteredComplaints: 0 },
    };
  }

  try {
    // 1. System Settings & Initial Admin Config
    console.log('[1/7] Seeding System Settings & Admin Emails...');
    await db
      .insert(systemSettings)
      .values({
        key: 'admin_setup_completed',
        value: new Date().toISOString(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: new Date().toISOString(), updatedAt: new Date() },
      });

    const demoAdmins = [
      { email: 'admin@civicfix.gov.in', addedBy: 'system_seeder' },
      { email: 'ops@civicfix.gov.in', addedBy: 'system_seeder' },
    ];
    for (const adm of demoAdmins) {
      await db.insert(adminEmails).values(adm).onConflictDoNothing();
    }

    // 2. Municipalities
    console.log('[2/7] Seeding Municipalities...');
    const demoMunicipalities = [
      {
        id: 1,
        name: 'Greater Hyderabad Municipal Corporation (GHMC)',
        state: 'Telangana',
        district: 'Hyderabad',
        contactEmail: 'commissioner@ghmc.gov.in',
        contactPhone: '+91 40 2111 1111',
        active: true,
      },
      {
        id: 2,
        name: 'Greater Visakhapatnam Municipal Corporation (GVMC)',
        state: 'Andhra Pradesh',
        district: 'Visakhapatnam',
        contactEmail: 'helpline@gvmc.gov.in',
        contactPhone: '+91 891 275 5555',
        active: true,
      },
      {
        id: 3,
        name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
        state: 'Karnataka',
        district: 'Bengaluru Urban',
        contactEmail: 'contact@bbmp.gov.in',
        contactPhone: '+91 80 2266 0000',
        active: true,
      },
    ];

    for (const m of demoMunicipalities) {
      await db
        .insert(municipalities)
        .values(m)
        .onConflictDoUpdate({
          target: municipalities.id,
          set: { name: m.name, state: m.state, district: m.district, updatedAt: new Date() },
        });
    }

    // 3. Wards
    console.log('[3/7] Seeding Wards...');
    const demoWards = [
      { id: 1, municipalityId: 1, name: 'Ward 114 - Kukatpally Central', active: true },
      { id: 2, municipalityId: 1, name: 'Ward 115 - KPHB Colony', active: true },
      { id: 3, municipalityId: 1, name: 'Ward 116 - Allwyn Colony', active: true },
      { id: 4, municipalityId: 1, name: 'Ward 117 - Moosapet Industrial Area', active: true },
      { id: 5, municipalityId: 2, name: 'Ward 18 - MVP Colony Vizag', active: true },
    ];

    for (const w of demoWards) {
      await db
        .insert(wards)
        .values(w)
        .onConflictDoUpdate({
          target: wards.id,
          set: { name: w.name, municipalityId: w.municipalityId },
        });
    }

    // 4. Departments
    console.log('[4/7] Seeding Departments...');
    const demoDepartments = [
      {
        id: 1,
        municipalityId: 1,
        name: 'Drainage & Stormwater',
        description: 'Underground drainage, stormwater drain clearing, canal desilting and flood prevention.',
        active: true,
      },
      {
        id: 2,
        municipalityId: 1,
        name: 'Sanitation & Waste Management',
        description: 'Garbage disposal, solid waste collection, dump clearance, and public hygiene.',
        active: true,
      },
      {
        id: 3,
        municipalityId: 1,
        name: 'Roads & Infrastructure',
        description: 'Road resurfacing, pothole remediation, asphalt repair, and pedestrian sidewalk maintenance.',
        active: true,
      },
      {
        id: 4,
        municipalityId: 1,
        name: 'Street Lighting & Electrical',
        description: 'Municipal lighting grid, pole replacement, transformer checks, and LED maintenance.',
        active: true,
      },
      {
        id: 5,
        municipalityId: 1,
        name: 'Water Supply & Sewerage',
        description: 'Drinking water pipelines, valve burst repair, water leakage, and sewer blockages.',
        active: true,
      },
    ];

    for (const d of demoDepartments) {
      await db
        .insert(departments)
        .values(d)
        .onConflictDoUpdate({
          target: departments.id,
          set: { name: d.name, description: d.description },
        });
    }

    // 5. Staff Profiles (Supervisors and Workers)
    console.log('[5/7] Seeding Staff Profiles & Response Crews...');
    const demoProfiles = [
      {
        id: 1,
        uid: 'seed_admin_01',
        email: 'admin@civicfix.gov.in',
        displayName: 'Municipal Commissioner / Admin',
        role: 'admin',
        anonymousPublicId: 'Officer #GHMC-ADM01',
        municipalityId: 1,
        phone: '+91 98480 11001',
      },
      {
        id: 2,
        uid: 'seed_sup_drainage_01',
        email: 'supervisor.drainage@civicfix.gov.in',
        displayName: 'K. Venkatesh (Drainage Supervisor)',
        role: 'supervisor',
        anonymousPublicId: 'Supervisor #GHMC-DR01',
        municipalityId: 1,
        phone: '+91 98480 22002',
      },
      {
        id: 3,
        uid: 'seed_wrk_ramesh_01',
        email: 'worker.ramesh@civicfix.gov.in',
        displayName: 'Ramesh Goud (Field Lead)',
        role: 'worker',
        anonymousPublicId: 'Crew Lead #GHMC-FL01',
        municipalityId: 1,
        phone: '+91 98480 33003',
      },
      {
        id: 4,
        uid: 'seed_wrk_suresh_02',
        email: 'worker.suresh@civicfix.gov.in',
        displayName: 'Suresh Kumar (Equipment Specialist)',
        role: 'worker',
        anonymousPublicId: 'Crew Op #GHMC-FL02',
        municipalityId: 1,
        phone: '+91 98480 44004',
      },
      {
        id: 5,
        uid: 'seed_wrk_priya_03',
        email: 'worker.priya@civicfix.gov.in',
        displayName: 'Priya Sharma (Civil Works Inspector)',
        role: 'worker',
        anonymousPublicId: 'Inspector #GHMC-FL03',
        municipalityId: 1,
        phone: '+91 98480 55005',
      },
    ];

    for (const p of demoProfiles) {
      await db
        .insert(profiles)
        .values(p)
        .onConflictDoUpdate({
          target: profiles.uid,
          set: { displayName: p.displayName, role: p.role, phone: p.phone, updatedAt: new Date() },
        });
    }

    // Field Crews
    const demoCrews = [
      {
        id: 1,
        municipalityId: 1,
        departmentId: 1,
        crewName: 'Kukatpally Rapid Drainage Taskforce',
        supervisorId: 2,
        active: true,
      },
      {
        id: 2,
        municipalityId: 1,
        departmentId: 3,
        crewName: 'KPHB Road Patching Unit-A',
        supervisorId: 2,
        active: true,
      },
      {
        id: 3,
        municipalityId: 1,
        departmentId: 2,
        crewName: 'North Zone Sanitation Blitz Squad',
        supervisorId: 2,
        active: true,
      },
      {
        id: 4,
        municipalityId: 1,
        departmentId: 4,
        crewName: 'West Corridor Electrical Line Crew',
        supervisorId: 2,
        active: true,
      },
    ];

    for (const c of demoCrews) {
      await db
        .insert(crews)
        .values(c)
        .onConflictDoUpdate({
          target: crews.id,
          set: { crewName: c.crewName, departmentId: c.departmentId },
        });
    }

    // Crew Members
    const demoCrewMembers = [
      { id: 1, crewId: 1, workerId: 3, active: true },
      { id: 2, crewId: 1, workerId: 4, active: true },
      { id: 3, crewId: 2, workerId: 5, active: true },
    ];
    for (const cm of demoCrewMembers) {
      await db
        .insert(crewMembers)
        .values(cm)
        .onConflictDoUpdate({
          target: crewMembers.id,
          set: { active: true },
        });
    }

    // 6. Realistic Complaints (Including Demo Root-Cause Cluster)
    console.log('[6/7] Seeding Complaints (including Root-Cause Cluster)...');

    const now = new Date();
    const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000);
    const daysAgo = (d: number) => new Date(now.getTime() - d * 86400 * 1000);

    const demoComplaints = [
      // =========================================================================
      // ROOT-CAUSE CLUSTER: Kukatpally Metro / KPHB Colony Drainage Failures
      // 5 related complaints within ~150 meters with common root cause
      // =========================================================================
      {
        complaintNumber: 'CF-KP01DRN',
        category: 'Drainage & Flooding',
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
        status: 'ASSIGNED',
        priority: 'URGENT',
        severity: 'CRITICAL',
        verificationStatus: 'VERIFIED',
        assignedCrewId: 1,
        assignedWorkerId: 3,
        duplicateGroupId: 'CLUSTER-KP-DRAIN-2026',
        createdAt: hoursAgo(6),
        updatedAt: hoursAgo(2),
        resolvedAt: null,
      },
      {
        complaintNumber: 'CF-KP02DRN',
        category: 'Drainage & Flooding',
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
      },
      {
        complaintNumber: 'CF-KP03DRN',
        category: 'Drainage & Flooding',
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
      },
      {
        complaintNumber: 'CF-KP04DRN',
        category: 'Drainage & Flooding',
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
      },
      {
        complaintNumber: 'CF-KP05DRN',
        category: 'Drainage & Flooding',
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
      },

      // =========================================================================
      // OTHER CATEGORIES & WORKFLOW STATES ACROSS THE CITY
      // =========================================================================
      {
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
      },
      {
        complaintNumber: 'CF-KP07SNT',
        category: 'Sanitation & Waste',
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
        createdAt: daysAgo(3), // SLA Breached scenario
        updatedAt: daysAgo(3),
        resolvedAt: null,
      },
      {
        complaintNumber: 'CF-KP08LGT',
        category: 'Streetlight & Electrical',
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
        status: 'ASSIGNED',
        priority: 'HIGH',
        severity: 'MEDIUM',
        verificationStatus: 'VERIFIED',
        assignedCrewId: 4,
        assignedWorkerId: null,
        duplicateGroupId: null,
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(12),
        resolvedAt: null,
      },
      {
        complaintNumber: 'CF-KP09WTR',
        category: 'Water Supply & Sewerage',
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
        status: 'ACCEPTED',
        priority: 'URGENT',
        severity: 'CRITICAL',
        verificationStatus: 'VERIFIED',
        assignedCrewId: 1,
        assignedWorkerId: 3,
        duplicateGroupId: null,
        createdAt: hoursAgo(3),
        updatedAt: hoursAgo(1),
        resolvedAt: null,
      },
      {
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
      },
      {
        complaintNumber: 'CF-KP11SNT',
        category: 'Sanitation & Waste',
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
      },
      {
        complaintNumber: 'CF-KP12ROP',
        category: 'Drainage & Flooding',
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
        status: 'REOPENED', // Demonstrating closed-loop verification / replanning
        priority: 'HIGH',
        severity: 'HIGH',
        verificationStatus: 'VERIFIED',
        assignedCrewId: 1,
        assignedWorkerId: 3,
        duplicateGroupId: null,
        createdAt: daysAgo(4),
        updatedAt: hoursAgo(5),
        resolvedAt: null,
      },
    ];

    for (const comp of demoComplaints) {
      const [insertedComp] = await db
        .insert(complaints)
        .values(comp)
        .onConflictDoUpdate({
          target: complaints.complaintNumber,
          set: {
            title: comp.title,
            description: comp.description,
            status: comp.status,
            priority: comp.priority,
            severity: comp.severity,
            updatedAt: comp.updatedAt,
          },
        })
        .returning();

      // Seed audit history
      await db
        .insert(complaintHistory)
        .values({
          complaintId: insertedComp.id,
          previousStatus: null,
          newStatus: comp.status,
          changedBy: 'CivicFix Seeder',
          reason: `Initial seed record: ${comp.title}`,
          createdAt: comp.createdAt,
        })
        .onConflictDoNothing();

      // Add illustrative media record for showcase
      const samplePhoto = `https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=60`;
      await db
        .insert(complaintMedia)
        .values({
          complaintId: insertedComp.id,
          fileUrl: samplePhoto,
          fileType: 'image/jpeg',
          uploadedBy: comp.anonymousPublicId,
          stage: comp.status === 'RESOLVED' ? 'COMPLETION' : 'SUBMISSION',
          createdAt: comp.createdAt,
        })
        .onConflictDoNothing();
    }

    // 7. Audit log
    await db
      .insert(auditLogs)
      .values({
        actorId: 'system_seeder',
        action: 'DEMO_DATA_SEEDED',
        entityType: 'database',
        entityId: 'full_suite',
        metadata: JSON.stringify({
          municipalities: demoMunicipalities.length,
          departments: demoDepartments.length,
          complaints: demoComplaints.length,
          clusterGroup: 'CLUSTER-KP-DRAIN-2026',
        }),
      })
      .onConflictDoNothing();

    console.log('[7/7] Database Seeding Complete!');

    return {
      success: true,
      stats: {
        municipalities: demoMunicipalities.length,
        departments: demoDepartments.length,
        crews: demoCrews.length,
        complaints: demoComplaints.length,
        clusteredComplaints: 5,
      },
    };
  } catch (err: any) {
    console.error('[ERROR] Seeding failed:', err.message);
    throw err;
  }
}

// Direct CLI execution
if (process.argv[1]?.includes('seed.ts')) {
  seedDatabase()
    .then((res) => {
      console.log('Result:', res);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    })
    .finally(async () => {
      await pool.end();
    });
}
