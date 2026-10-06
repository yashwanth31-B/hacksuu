# CivicFix AI — Live Hackathon Demo Walkthrough Guide

**Document Purpose:** Exact click-by-click instructions, screen flows, talking points, expected results, and backup contingency plans for presenting CivicFix AI to hackathon judges.

---

## 1. Pre-Demo Setup Checklist (Complete 10 Minutes Before Pitch)

* [ ] **Backend Running:**
  - If local monolith: `npm run dev` (running on `http://localhost:3000`).
  - If deployed: Confirm Render backend service status is `Live` at `https://[your-app].onrender.com`.
* [ ] **Frontend Running:**
  - Open `http://localhost:3000` (or your Vercel deployment URL).
* [ ] **Database Connection & Seed Data:**
  - Confirm `npm run seed` was executed so that reference departments, municipalities, and the 5 Kukatpally cluster complaints exist.
* [ ] **Browser Tabs Pre-Opened in Order:**
  - **Tab 1:** CivicFix Homepage (`/`)
  - **Tab 2:** Report Issue Page (`/report`)
  - **Tab 3:** Track Complaint Page (`/track?id=CF-KP01DRN`)
  - **Tab 4:** Municipal Operations / Admin Dashboard (`/admin`)
  - **Tab 5:** Field Worker Dashboard (`/worker`)
* [ ] **Sample Image Ready:**
  - Keep a clear photo of a flooded road or pothole on your Desktop ready for instant drag-and-drop file upload.

---

## 2. Step-by-Step Judge Demo Flow

### Step 1: Open CivicFix AI (Homepage)
* **What to Click:** Navigate to Homepage (`/`).
* **What Judges See:** Modern dark UI, real-time civic KPI metric counters (Total Complaints, Resolution Rate, Verified Cases), and an interactive community map showing city-wide civic incidents.
* **What to Say:** *"This is CivicFix AI. Citizens arrive at a transparent dashboard showing live community metrics and public issue statuses across the municipal corporation."*
* **Expected Result:** Live stats render smoothly from `/api/public/stats`.
* **Backup if Network Fails:** The app has pre-rendered metric components and graceful fallback stats.

---

### Step 2: Citizen Login / Identity
* **What to Click:** Click **Sign In** in the top navigation bar.
* **What Judges See:** Google OAuth pop-up through Firebase Authentication. Once authenticated, user displays their anonymized public ID (e.g. `Citizen #CF-8101`).
* **What to Say:** *"Citizens sign in securely with one click. To protect whistleblower privacy and prevent neighborhood harassment, the system automatically assigns an anonymized public cryptographic handle while keeping verified identity secure server-side."*
* **Expected Result:** Profile avatar shows in Navbar; anonymized public ID displayed.
* **Backup:** If Google pop-up is blocked by browser settings, proceed as guest (the report form works in unauthenticated mode using `optionalAuth`).

---

### Step 3 & 4: Submit a Civic Complaint & Gemini AI Vision Triage
* **What to Click:** 
  1. Click **Report Issue** (`/report`).
  2. In Step 1, click **Upload Photo** and select your sample pothole/flooding image.
* **What Judges See:** 
  - Loading spinner showing *"Gemini Multimodal Triage in Progress..."*.
  - Within ~1.5 seconds, a purple badge appears: **AI Analysis Complete (Confidence: 94%)**.
  - Suggested Category: `Drainage & Flooding`
  - Suggested Severity: `HIGH`
  - Detected Hazards: `Traffic hazard, Pedestrian tripping hazard`
  - Suggested Department: `Drainage & Stormwater`
  3. Click **Apply AI Suggestions**. Fields autofill automatically.
* **What to Say:** *"Watch our perceptual AI engine in action. Instead of making citizens struggle through 30 bureaucratic dropdowns, Gemini Flash analyzes the visual evidence in two seconds, detecting the severity, specific hazards, and the responsible civic department."*
* **Expected Result:** Category, severity, and description autofill cleanly.
* **Backup if Gemini API Rate Limited:** The backend has a built-in graceful fallback that returns sensible defaults (`Other / Public Works`) without crashing.

---

### Step 5: Location & Privacy Coordinate Fuzzing
* **What to Click:** 
  1. Click **Next** to proceed to the Map & Location step.
  2. Click **Use Current Location** (or click on the map near Kukatpally).
  3. Click **Next** to proceed through the review step.
* **What Judges See:** MapLibre interactive pin drops with reverse-geocoded street address.
* **What to Say:** *"GPS coordinates are captured, and before public broadcast, CivicFix applies algorithmic coordinate fuzzing—jittering public coordinates by 40 to 60 meters so citizens cannot be pinpointed to their front doorstep."*
* **Expected Result:** Address appears in input box; map centers on marker.

---

### Step 6 & 7: Complaint Generation & Live Public Tracking
* **What to Click:** Click **Submit Complaint**. Once the confirmation screen appears, click **Track This Complaint**.
* **What Judges See:** Confirmation card showing Complaint Reference Number (e.g., `CF-27A81C4D`). Clicking track opens the visual tracking page (`/track`) showing the 6-stage lifecycle progress bar:
  - `REPORTED` ➔ `VERIFIED` ➔ `ASSIGNED` ➔ `IN_PROGRESS` ➔ `COMPLETED` ➔ `RESOLVED`.
* **What to Say:** *"The citizen immediately gets an Uber-style tracking reference. They can follow the chronological lifecycle from initial intake to verification, field assignment, and verified closure."*
* **Expected Result:** Chronological milestone timeline displays with status badge and timestamps.

---

### Step 8: Open Municipal Operations / Admin Dashboard
* **What to Click:** Switch to Tab 4 (`/admin`).
* **What Judges See:** Administrator Command Center: Overview KPIs, Tab Navigation (Complaints, Map, Duplicates, Field Crews, Audit Logs, System Health).
* **What to Say:** *"Now let's switch to the Municipal Operations Command Center used by municipal commissioners and ward supervisors."*
* **Expected Result:** High-level metrics, active complaints queue, and crew availability load cleanly.

---

### Step 9 & 10: Root-Cause Incident Cluster (The Killer Demo)
* **What to Click:** 
  1. In Admin Dashboard, click the **Map** tab (or **Duplicates** tab).
  2. Zoom into the **Kukatpally Metro corridor** in Hyderabad.
* **What Judges See:** 
  - A dense cluster of 5 red and amber markers around Kukatpally Metro (`CF-KP01DRN` to `CF-KP05DRN`).
  - Complaint titles:
    1. *"Severe road flooding after moderate rain near Metro Exit B"*
    2. *"Stormwater drain overflowing with plastic blockage on Lane 2"*
    3. *"Sewage and black water backflow accumulating across school approach"*
    4. *"Collapsed stormwater culvert slab choking arterial runoff"*
    5. *"Stagnant water ponding in front of auto stand creating health hazard"*
* **What to Say:** *"Here is where CivicFix breaks traditional municipal silos. Look at this cluster around Kukatpally Metro. Traditional systems see five isolated complaints and dispatch five random trucks. CivicFix's proximity engine detects that all five are within 150 meters and share common drainage symptoms. The operator sees this is one root cause: a collapsed stormwater trunk culvert."*
* **Expected Result:** Map shows co-located pins; Duplicates tab shows similarity matches with proximity distances.
* **Backup:** If map tiles take time to render, switch to the **Complaints** list tab and filter by Category: `Drainage & Flooding`.

---

### Step 11: Dispatch & Field Worker Task Execution
* **What to Click:** 
  1. Click on complaint `CF-KP01DRN`.
  2. In the assignment modal, select **Kukatpally Rapid Drainage Taskforce** and click **Assign Crew**.
  3. Switch to Tab 5 (`/worker`) — the Field Worker Console.
* **What Judges See:** 
  - The worker sees their assigned queue.
  - Action buttons: **Accept Task** ➔ **Arrived On Site** ➔ **Start Work** ➔ **Complete Work**.
* **What to Say:** *"The assigned field taskforce receives real-time dispatch instructions. The crew lead logs on-site arrival, and every action awards performance credits to the crew ledger."*
* **Expected Result:** Status transitions to `ASSIGNED`, then `IN_PROGRESS`.

---

### Step 12 & 13: Closed-Loop Verification & Reopen Loop
* **What to Click:** 
  1. In the Worker Console, click **Complete Work**, enter resolution notes (*"Excavated silt and cleared culvert obstruction"*), and submit.
  2. Switch back to `/admin` (or `/worker` verification mode).
  3. Show the complaint: if resolution is unverified, show the **Reopen** flow (`status: 'REOPENED'`). Open seeded complaint `CF-KP12ROP`.
* **What Judges See:** 
  - Status shows `REOPENED` with audit trail notation: *"Initial drain cleanup incomplete; sewage backpressure persists. Returned for rectification."*
* **What to Say:** *"Notice this reopened ticket: `CF-KP12ROP`. This demonstrates our closed-loop verification policy. If field evidence is incomplete or the fix fails, the ticket cannot simply be closed. It is automatically reopened with full history, forcing accountable resolution."*
* **Expected Result:** Ticket status shows red `REOPENED` badge with full audit trail history.

---

## 3. Final Feature Verification & Judge Integrity Matrix

To ensure 100% technical integrity and credibility during the Q&A session with judges, use this precise breakdown:

### A. ACTUALLY IMPLEMENTED (Demonstrate Confidently)
1. **Multimodal AI Vision Triage:** Real-time `@google/genai` (`gemini-2.5-flash`) analyzing base64 images to predict category, severity, title, department, hazards, and confidence.
2. **Deterministic Department Routing:** Backend rules automatically routing complaints based on category keywords (`Roads`, `Sanitation`, `Electrical`, `Drainage`, `Water`).
3. **Geospatial Incident Mapping:** MapLibre GL vector map with interactive pins, popups, and category color-coding.
4. **GPS Capture & Coordinate Privacy Fuzzing:** Browser geolocation with 40–60m random coordinate offset for public anonymity.
5. **Full Operational State Machine:** Complete complaint workflow (`REPORTED`, `VERIFIED`, `ASSIGNED`, `ACCEPTED`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`, `RESOLVED`, `REOPENED`).
6. **Immutable Audit History & Timeline:** Status changes, actor timestamps, and reasons tracked in `complaint_history` and `audit_logs`.
7. **Proximity Duplicate Detection:** Haversine distance engine in backend detecting co-located complaints within 150–300 meters (`/api/complaints/check-duplicate`).
8. **Field Worker Task Execution & Credit Ledger:** Crew task accept/arrive/start/complete workflow awarding gamified performance points.
9. **Role-Based Access Control:** Firebase Auth gates separating `citizen`, `admin`, `supervisor`, and `worker` privileges.
10. **Decoupled Cloud Readiness:** Configured for Vercel SPA routing (`vercel.json`) and Render backend (`render.yaml`) with CORS.

---

### B. SEEDED / DEMO DATA ONLY (Attribute Accurately)
1. **The 5-Report Kukatpally Metro Drainage Cluster (`CF-KP01DRN` to `CF-KP05DRN`):** 
   - *Status:* Generated by `scripts/seed.ts` with real coordinates in Hyderabad to provide an immediate, visually compelling demonstration of co-located incident clustering.
   - *Attribution:* Present this as: *"We pre-seeded realistic incident data around the Kukatpally transit corridor to illustrate how our spatial proximity engine groups related reports."*
2. **Pre-Seeded Municipal Reference Entities:** 3 Municipalities (GHMC, GVMC, BBMP), 5 Departments, and 4 Field Crews populated by the seeder.
3. **Pre-Seeded Historic Metrics:** Average resolution time (24 hours) and resolved complaint showcase items.

---

### C. PARTIALLY IMPLEMENTED (State Real Status If Asked)
1. **Root-Cause Clustering Engine:** 
   - *What works:* Backend proximity scanner (Haversine formula) and duplicate detection table (`duplicateReports`).
   - *What is roadmap:* Autonomous multi-agent LLM synthesizing multiple text reports into a single root-cause executive briefing.
2. **Citizen Resolution Verification:**
   - *What works:* Supervisor/Admin completion verification and reopening endpoint (`/api/worker/tasks/:id/verify-resolution`).
   - *What is roadmap:* Citizen WhatsApp/SMS one-click feedback webhook.
3. **SLA Breach Monitoring:**
   - *What works:* Created/updated timestamps and duration calculations.
   - *What is roadmap:* Autonomous background cron job automatically triggering manager escalations when SLA thresholds are breached.

---

### D. DO NOT CLAIM TO JUDGES (Strict Safety Boundary)
* ❌ **Do NOT claim an autonomous background multi-agent loop is running cron jobs in the background.** (The current implementation is an on-demand API event-driven architecture).
* ❌ **Do NOT claim voice calling or autonomous phone call agents.** (All communications are in-app notifications and REST APIs).
* ❌ **Do NOT claim JWT + Bcrypt auth.** (The codebase uses Firebase Authentication with Google OAuth).
* ❌ **Do NOT claim automated drone/satellite verification.** (Verification relies on human photo evidence submitted by field technicians).
