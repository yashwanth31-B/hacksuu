import React, { useEffect, useState } from 'react';
import { getApiUrl } from '../lib/api.ts';
import {
  AlertTriangle,
  Search,
  Clock,
  Shield,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Compass,
} from 'lucide-react';
import { CivicMap, MapComplaint } from '../components/CivicMap.tsx';
import { useGPS } from '../context/GPSContext.tsx';

interface HomeProps {
  navigate: (path: string) => void;
}

export const Home: React.FC<HomeProps> = ({ navigate }) => {
  const { location: gpsLocation } = useGPS();
  const [stats, setStats] = useState<any>(null);
  const [mapComplaints, setMapComplaints] = useState<MapComplaint[]>([]);
  const [trackNumber, setTrackNumber] = useState('');
  const [, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        // Load real stats
        const statsRes = await fetch(getApiUrl('/api/public/stats'));
        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats(s);
        }

        // Load complaints for map preview
        const mapRes = await fetch(getApiUrl('/api/public/complaints?limit=30'));
        if (mapRes.ok) {
          const comps = await mapRes.json();
          setMapComplaints(comps);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackNumber.trim()) return;
    navigate(`/track?id=${encodeURIComponent(trackNumber.trim().toUpperCase())}`);
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-[#E5E1D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Tagline Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1B3E36]/10 border border-[#1B3E36]/20 text-[#1B3E36] text-xs font-bold tracking-widest uppercase mb-6 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[#E5A952]" />
              <span>A CLEARER LINE TO CITY SERVICES</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-serif font-black tracking-tight text-[#1A2825] mb-6 leading-tight">
              Report. Resolve. <br />
              <span className="text-[#1B3E36] italic font-serif">
                Improve Your City.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#5C6E6A] mb-10 leading-relaxed font-normal max-w-2xl mx-auto">
              CivicFix connects citizens directly with municipal departments, ward supervisors, and field response crews.
              Report potholes, sanitation hazards, broken streetlights, or drainage overflow with GPS verification and AI triage.
            </p>

            {/* Main Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <button
                onClick={() => navigate('/report')}
                className="w-full sm:w-auto px-8 py-4 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold rounded-xl shadow-md shadow-[#E5A952]/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all hover:scale-[1.01] cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-[#102621]" />
                <span>REPORT AN ISSUE</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>

              <button
                onClick={() => navigate('/map')}
                className="w-full sm:w-auto px-8 py-4 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] font-bold rounded-xl flex items-center justify-center gap-2 text-sm uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <Compass className="w-4 h-4 text-[#1B3E36]" />
                <span>VIEW LIVE MAP</span>
              </button>
            </div>

            {/* Quick Track Input Bar */}
            <form
              onSubmit={handleTrackSubmit}
              className="max-w-md mx-auto bg-[#FAF9F5] border border-[#D4CEBF] rounded-2xl p-2 flex items-center gap-2 shadow-sm focus-within:border-[#1B3E36] focus-within:ring-1 focus-within:ring-[#1B3E36] transition-all"
            >
              <div className="pl-3 text-[#5C6E6A]">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Track Complaint (e.g. CF-27A81C4D)"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                className="flex-1 bg-transparent border-none text-xs sm:text-sm text-[#1A2825] placeholder-[#8A9894] outline-none uppercase font-mono tracking-wider"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold rounded-xl transition-colors cursor-pointer uppercase tracking-wider"
              >
                Track
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Live Public Database Statistics */}
      <section className="py-12 border-b border-[#E5E1D5] bg-[#FAF9F5]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#5C6E6A] font-mono">
              REAL-TIME MUNICIPAL DATABASE METRICS
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-5 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-serif font-black text-[#1A2825] mb-1">
                {stats?.total ?? 0}
              </div>
              <div className="text-xs text-[#5C6E6A] font-medium tracking-wide uppercase">Total Complaints</div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-5 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-serif font-black text-[#1B3E36] mb-1">
                {stats?.verified ?? 0}
              </div>
              <div className="text-xs text-[#5C6E6A] font-medium tracking-wide uppercase">Verified by City</div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-5 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-serif font-black text-[#B06D44] mb-1">
                {stats?.inProgress ?? 0}
              </div>
              <div className="text-xs text-[#5C6E6A] font-medium tracking-wide uppercase">Crews Dispatched</div>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-5 text-center shadow-xs">
              <div className="text-3xl sm:text-4xl font-serif font-black text-[#2E6F5E] mb-1">
                {stats?.resolved ?? 0}
              </div>
              <div className="text-xs text-[#5C6E6A] font-medium tracking-wide uppercase">Permanently Resolved</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-[#5C6E6A]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1B3E36]" />
              <span>Avg. Resolution Time: <strong className="text-[#1A2825]">{stats?.avgResolutionHours || 24} hours</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#2E6F5E]" />
              <span>Resolution Rate: <strong className="text-[#1A2825]">{stats?.resolutionRate || 0}%</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-[#B06D44]" />
              <span>Anonymous Citizen Identity Guaranteed</span>
            </div>
          </div>
        </div>
      </section>

      {/* Live Map Preview Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
              GIS CITY MAP
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825]">Live Municipal Issues Map</h2>
            <p className="text-[#5C6E6A] text-sm mt-1">
              Explore active and resolved civic reports across municipal wards and zones.
            </p>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="px-5 py-2.5 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-xs font-bold uppercase tracking-wider rounded-xl text-[#1A2825] flex items-center gap-2 self-start md:self-auto transition-colors cursor-pointer shadow-xs"
          >
            <span>Open Full Interactive Map</span>
            <ArrowRight className="w-4 h-4 text-[#1B3E36]" />
          </button>
        </div>

        <div className="border border-[#D4CEBF] rounded-2xl overflow-hidden shadow-sm bg-[#FAF9F5]">
          <CivicMap
            complaints={mapComplaints}
            userLocation={gpsLocation}
            heightClass="h-[460px]"
            onSelectComplaint={(c) => navigate(`/track?id=${c.complaintNumber}`)}
          />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-[#F4F0E6]/60 border-y border-[#E5E1D5]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[#B06D44] font-mono mb-2">
              END-TO-END CIVIC WORKFLOW
            </h2>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825]">
              How CivicFix Operates
            </h3>
            <p className="text-[#5C6E6A] text-sm mt-2">
              From instant citizen reporting to verified field resolution with complete municipal accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-6 relative shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#1B3E36] text-[#FAF9F5] font-serif font-bold flex items-center justify-center mb-4 text-sm">
                1
              </div>
              <h4 className="text-base font-bold text-[#1A2825] font-serif mb-2">Report & AI Assist</h4>
              <p className="text-[#5C6E6A] text-xs leading-relaxed">
                Capture photographic evidence with automatic GPS verification. CivicFix AI classifies the issue category and severity.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-6 relative shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#527E74] text-[#FAF9F5] font-serif font-bold flex items-center justify-center mb-4 text-sm">
                2
              </div>
              <h4 className="text-base font-bold text-[#1A2825] font-serif mb-2">Smart Dept Routing</h4>
              <p className="text-[#5C6E6A] text-xs leading-relaxed">
                Automatically dispatches complaints to the proper municipal department (Drainage, Sanitation, Roads, Electrical).
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-6 relative shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#E5A952] text-[#102621] font-serif font-bold flex items-center justify-center mb-4 text-sm">
                3
              </div>
              <h4 className="text-base font-bold text-[#1A2825] font-serif mb-2">Field Crew Action</h4>
              <p className="text-[#5C6E6A] text-xs leading-relaxed">
                Assigned response teams confirm physical arrival via geo-fencing, carry out repairs, and document completion photos.
              </p>
            </div>

            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-2xl p-6 relative shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-[#B06D44] text-[#FAF9F5] font-serif font-bold flex items-center justify-center mb-4 text-sm">
                4
              </div>
              <h4 className="text-base font-bold text-[#1A2825] font-serif mb-2">Verified Resolution</h4>
              <p className="text-[#5C6E6A] text-xs leading-relaxed">
                Supervisors review completion proof before closing records, enforcing SLA deadlines and archiving audit trails.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Citizen Privacy & Anonymity Commitment */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1B3E36] text-[#FAF9F5] border border-[#274E45] rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl relative z-10">
            <div className="flex items-center gap-2 text-[#E5A952] text-xs font-bold uppercase tracking-wider mb-3 font-mono">
              <Shield className="w-4 h-4" />
              <span>STRICT RESIDENT PRIVACY PROTECTION</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF9F5] mb-4">
              Your Identity Remains Protected
            </h3>
            <p className="text-[#D4CEBF] text-sm leading-relaxed mb-6 font-normal">
              When reporting a public issue on CivicFix, citizen emails, contact details, and precise residential origins are kept confidential.
              Public GIS markers display masked aliases such as <em>Citizen #CF-7821</em> with bounded ward coordinates.
            </p>

            <button
              onClick={() => navigate('/report')}
              className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
            >
              Report an Issue Now
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E1D5] bg-[#FAF9F5] py-8 text-center text-xs text-[#5C6E6A]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-medium text-[#1A2825]">© {new Date().getFullYear()} CivicFix V2 • Municipal Public Infrastructure Platform</p>
          <p className="mt-1 font-mono text-[11px] text-[#7E9690]">Powered by PostgreSQL & Cloud Architecture • Real-time Civic Resolution</p>
        </div>
      </footer>
    </div>
  );
};
