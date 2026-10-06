import React, { useState, useEffect, useMemo } from 'react';
import { CivicMap, MapComplaint } from '../components/CivicMap.tsx';
import { useGPS } from '../context/GPSContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Filter,
  ArrowRight,
  X,
  Search,
  SlidersHorizontal,
  RotateCcw,
  MapPin,
  Layers,
  Navigation,
  Loader2,
  Radio,
  LocateFixed,
  Compass,
  EyeOff,
  ThumbsUp,
  Flame,
} from 'lucide-react';

interface PublicMapProps {
  navigate: (path: string) => void;
}

// Category definition groups for civic issues
const CATEGORY_GROUPS = [
  {
    id: 'roads',
    label: 'Roads & Pavements',
    icon: '🚧',
    categories: ['Pothole', 'Road Damage', 'Broken Footpath'],
    color: 'border-[#B06D44]/50 text-[#8A3B2A] bg-[#FFF1E6]',
  },
  {
    id: 'sanitation',
    label: 'Sanitation & Waste',
    icon: '🗑️',
    categories: ['Garbage', 'Illegal Dumping'],
    color: 'border-[#2E6F5E]/50 text-[#1B4D3E] bg-[#E6F2ED]',
  },
  {
    id: 'lighting',
    label: 'Lighting & Grid',
    icon: '💡',
    categories: ['Streetlight'],
    color: 'border-[#E5A952]/60 text-[#92400E] bg-[#FEF3C7]',
  },
  {
    id: 'water',
    label: 'Water & Drainage',
    icon: '💧',
    categories: ['Drainage', 'Water Leakage'],
    color: 'border-[#1B3E36]/40 text-[#1B3E36] bg-[#1B3E36]/10',
  },
  {
    id: 'infra',
    label: 'Infrastructure & Signs',
    icon: '🏛️',
    categories: ['Traffic Sign Damage', 'Public Infrastructure Damage', 'Other'],
    color: 'border-[#527E74]/50 text-[#2C4D46] bg-[#EBF3F1]',
  },
];

const ALL_CATEGORIES = [
  'Pothole',
  'Garbage',
  'Illegal Dumping',
  'Road Damage',
  'Streetlight',
  'Drainage',
  'Water Leakage',
  'Broken Footpath',
  'Traffic Sign Damage',
  'Public Infrastructure Damage',
  'Other',
];

const INDIAN_CITIES = [
  { name: 'Pan-India', coords: [78.9629, 21.5937] as [number, number], zoom: 5 },
  { name: 'Hyderabad (Kukatpally)', coords: [78.3996, 17.4947] as [number, number], zoom: 14 },
  { name: 'Visakhapatnam', coords: [83.3150, 17.7231] as [number, number], zoom: 13 },
  { name: 'Delhi NCR', coords: [77.2090, 28.6139] as [number, number], zoom: 12 },
  { name: 'Bengaluru', coords: [77.5946, 12.9716] as [number, number], zoom: 13 },
  { name: 'Mumbai', coords: [72.8777, 19.0760] as [number, number], zoom: 12 },
  { name: 'Chennai', coords: [80.2707, 13.0827] as [number, number], zoom: 12 },
  { name: 'Kolkata', coords: [88.3639, 22.5726] as [number, number], zoom: 12 },
];

const STATUS_OPTIONS = [
  {
    id: 'REPORTED',
    label: 'Reported',
    dotColor: 'bg-[#B06D44]',
    borderColor: 'border-[#B06D44]',
    badgeColor: 'bg-[#FFF1E6] text-[#8A3B2A]',
    description: 'New issues awaiting verification',
  },
  {
    id: 'VERIFIED',
    label: 'Verified',
    dotColor: 'bg-[#1B3E36]',
    borderColor: 'border-[#1B3E36]',
    badgeColor: 'bg-[#1B3E36]/10 text-[#1B3E36]',
    description: 'Confirmed by municipal inspector',
  },
  {
    id: 'IN_PROGRESS',
    label: 'In Progress',
    dotColor: 'bg-[#E5A952]',
    borderColor: 'border-[#E5A952]',
    badgeColor: 'bg-[#FEF3C7] text-[#92400E]',
    description: 'Field crew assigned & repairing',
    includes: ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'ARRIVED', 'COMPLETED'],
  },
  {
    id: 'RESOLVED',
    label: 'Resolved',
    dotColor: 'bg-[#2E6F5E]',
    borderColor: 'border-[#2E6F5E]',
    badgeColor: 'bg-[#E6F2ED] text-[#1B4D3E]',
    description: 'Work verified & closed',
  },
];

export const PublicMap: React.FC<PublicMapProps> = ({ navigate }) => {
  const [allComplaints, setAllComplaints] = useState<MapComplaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<MapComplaint | null>(null);
  const [loading, setLoading] = useState(true);

  // Live GPS Integration
  const {
    isTracking,
    location: gpsLocation,
    toggleTracking,
    refreshLocation,
    calculateDistance,
    formatDistance,
  } = useGPS();

  const [nearMeRadius, setNearMeRadius] = useState<number | null>(null); // null = all, 2, 5, 10 km
  const [followUser, setFollowUser] = useState(false);

  // Filter States: Multi-select toggles
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_CATEGORIES);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    'REPORTED',
    'VERIFIED',
    'IN_PROGRESS',
    'RESOLVED',
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>(undefined);
  const [locatingUser, setLocatingUser] = useState(false);
  const [upvoting, setUpvoting] = useState(false);
  const { showToast } = useToast();

  const handleUpvote = async (complaint: MapComplaint) => {
    if (upvoting) return;
    setUpvoting(true);
    try {
      const res = await fetch(getApiUrl(`/api/complaints/${complaint.id}/upvote`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast({
          title: data.escalated ? 'Community Priority Escalated!' : 'Impacts Me Too Recorded',
          message: data.message,
          type: data.escalated ? 'warning' : 'success',
        });
        setAllComplaints((prev) =>
          prev.map((c) =>
            c.id === complaint.id
              ? { ...c, upvotes: data.upvotes, priority: data.priority }
              : c
          )
        );
        if (selectedComplaint && selectedComplaint.id === complaint.id) {
          setSelectedComplaint((prev) =>
            prev ? { ...prev, upvotes: data.upvotes, priority: data.priority } : null
          );
        }
      } else {
        showToast({
          title: 'Notice',
          message: data.error || 'Failed to record upvote.',
          type: 'error',
        });
      }
    } catch (err) {
      showToast({
        title: 'Network Delay',
        message: 'Could not reach server to register upvote.',
        type: 'error',
      });
    } finally {
      setUpvoting(false);
    }
  };

  const handleLocateMe = async () => {
    if (gpsLocation) {
      setMapCenter([gpsLocation.lng, gpsLocation.lat]);
    } else {
      setLocatingUser(true);
      const loc = await refreshLocation();
      if (loc) {
        setMapCenter([loc.lng, loc.lat]);
      }
      setLocatingUser(false);
    }
  };

  // Fetch all complaints from server
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await fetch(getApiUrl('/api/public/complaints?limit=300'));
      if (res.ok) {
        const data = await res.json();
        setAllComplaints(data);
      }
    } catch (e) {
      console.error('Failed to load map data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Compute category issue counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of ALL_CATEGORIES) {
      counts[cat] = 0;
    }
    for (const c of allComplaints) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    }
    return counts;
  }, [allComplaints]);

  // Compute status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      REPORTED: 0,
      VERIFIED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
    };
    for (const c of allComplaints) {
      if (c.status === 'REPORTED') counts.REPORTED++;
      else if (c.status === 'VERIFIED') counts.VERIFIED++;
      else if (c.status === 'RESOLVED') counts.RESOLVED++;
      else counts.IN_PROGRESS++;
    }
    return counts;
  }, [allComplaints]);

  // Toggle single category
  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Toggle category group
  const toggleCategoryGroup = (groupCats: string[]) => {
    const allSelected = groupCats.every((c) => selectedCategories.includes(c));
    if (allSelected) {
      setSelectedCategories((prev) => prev.filter((c) => !groupCats.includes(c)));
    } else {
      setSelectedCategories((prev) => Array.from(new Set([...prev, ...groupCats])));
    }
  };

  // Toggle single status
  const toggleStatus = (statusId: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(statusId) ? prev.filter((s) => s !== statusId) : [...prev, statusId]
    );
  };

  // Select all / none
  const selectAllCategories = () => setSelectedCategories(ALL_CATEGORIES);
  const clearAllCategories = () => setSelectedCategories([]);
  const selectAllStatuses = () =>
    setSelectedStatuses(['REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']);
  const clearAllStatuses = () => setSelectedStatuses([]);

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedCategories(ALL_CATEGORIES);
    setSelectedStatuses(['REPORTED', 'VERIFIED', 'IN_PROGRESS', 'RESOLVED']);
    setSearchQuery('');
  };

  const isFiltered =
    selectedCategories.length < ALL_CATEGORIES.length ||
    selectedStatuses.length < 4 ||
    Boolean(searchQuery.trim()) ||
    nearMeRadius !== null;

  // Filter complaints
  const visibleComplaints = useMemo(() => {
    const filtered = allComplaints.filter((comp) => {
      // 1. Category check
      if (!selectedCategories.includes(comp.category)) return false;

      // 2. Status check
      let matchesStatus = false;
      for (const st of selectedStatuses) {
        if (st === 'IN_PROGRESS') {
          if (
            ['IN_PROGRESS', 'ASSIGNED', 'ACCEPTED', 'ARRIVED', 'COMPLETED'].includes(comp.status)
          ) {
            matchesStatus = true;
            break;
          }
        } else if (comp.status === st) {
          matchesStatus = true;
          break;
        }
      }
      if (!matchesStatus) return false;

      // 3. Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = comp.title.toLowerCase().includes(q);
        const matchesRef = comp.complaintNumber.toLowerCase().includes(q);
        const matchesAddress = (comp.address || '').toLowerCase().includes(q);
        const matchesCat = comp.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesAddress && !matchesCat) return false;
      }

      // 4. Live GPS Near Me Distance Check
      if (nearMeRadius !== null && gpsLocation) {
        const lat = comp.publicLatitude ?? comp.latitude;
        const lng = comp.publicLongitude ?? comp.longitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
          const dist = calculateDistance(lat, lng);
          if (dist === null || dist > nearMeRadius) return false;
        }
      }

      return true;
    });

    if (nearMeRadius !== null && gpsLocation) {
      filtered.sort((a, b) => {
        const latA = a.publicLatitude ?? a.latitude ?? 0;
        const lngA = a.publicLongitude ?? a.longitude ?? 0;
        const latB = b.publicLatitude ?? b.latitude ?? 0;
        const lngB = b.publicLongitude ?? b.longitude ?? 0;
        const distA = calculateDistance(latA, lngA) ?? 99999;
        const distB = calculateDistance(latB, lngB) ?? 99999;
        return distA - distB;
      });
    }

    return filtered;
  }, [allComplaints, selectedCategories, selectedStatuses, searchQuery, nearMeRadius, gpsLocation, calculateDistance]);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] bg-[#F9F6EE] text-[#1A2825] flex flex-col font-sans">
      {/* Top Filter & Control Ribbon */}
      <div className="bg-[#FAF9F5] border-b border-[#E5E1D5] z-30 px-4 py-3 sm:px-6 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Main Top Row: Search + Quick Stats + Toggle Panel Button */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-serif font-black tracking-tight text-[#1A2825] uppercase">
                  Civic Issues Map
                </span>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#1B3E36]/10 text-[#1B3E36] border border-[#1B3E36]/20">
                  {visibleComplaints.length} of {allComplaints.length} visible
                </span>
              </div>

              {isFiltered && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#B06D44] hover:underline transition-colors cursor-pointer font-mono"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>

            {/* Quick Search & Filter Drawer Toggle */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-[#5C6E6A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by keyword, street, CF-ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] focus:ring-1 focus:ring-[#1B3E36] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1A2825] placeholder-[#8A9894] outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#5C6E6A] hover:text-[#1A2825]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleLocateMe}
                disabled={locatingUser}
                className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border bg-[#FAF9F5] text-[#1A2825] border-[#D4CEBF] hover:bg-[#F2EFE7] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title="Center map on my current location"
              >
                {locatingUser ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1B3E36]" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-[#1B3E36]" />
                )}
                <span className="hidden md:inline">My Location</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFiltersPanel(!showFiltersPanel)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                  showFiltersPanel || isFiltered
                    ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36]'
                    : 'bg-[#FAF9F5] text-[#1A2825] border-[#D4CEBF] hover:bg-[#F2EFE7]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {isFiltered && (
                  <span className="w-2 h-2 rounded-full bg-[#E5A952] animate-pulse"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/report')}
                className="px-3.5 py-1.5 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-sm shrink-0 cursor-pointer hidden sm:flex items-center gap-1"
              >
                <span>+ Report Issue</span>
              </button>
            </div>
          </div>

          {/* Quick Status Toggle Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] font-mono shrink-0 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-[#1B3E36]" />
              <span>Status:</span>
            </span>

            {STATUS_OPTIONS.map((status) => {
              const active = selectedStatuses.includes(status.id);
              const count = statusCounts[status.id] || 0;

              return (
                <button
                  key={status.id}
                  type="button"
                  onClick={() => toggleStatus(status.id)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer ${
                    active
                      ? `${status.borderColor} ${status.badgeColor} shadow-xs font-extrabold`
                      : 'bg-[#FFFFFF] border-[#E5E1D5] text-[#8A9894] hover:text-[#1A2825]'
                  }`}
                  title={`${status.label}: ${status.description}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${status.dotColor} ${
                      active ? 'opacity-100' : 'opacity-40'
                    }`}
                  />
                  <span>{status.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      active ? 'bg-black/10' : 'bg-[#FAF9F5] text-[#8A9894]'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-[#D4CEBF] mx-1 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
              <button
                type="button"
                onClick={selectAllStatuses}
                className="text-[#5C6E6A] hover:text-[#1B3E36] font-bold px-1 py-0.5 transition-colors cursor-pointer"
              >
                ALL
              </button>
              <span className="text-[#D4CEBF]">•</span>
              <button
                type="button"
                onClick={clearAllStatuses}
                className="text-[#5C6E6A] hover:text-[#B06D44] font-bold px-1 py-0.5 transition-colors cursor-pointer"
              >
                NONE
              </button>
            </div>
          </div>

          {/* Quick Category Groups Toggle Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] font-mono shrink-0 mr-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#2E6F5E]" />
              <span>Category:</span>
            </span>

            {CATEGORY_GROUPS.map((grp) => {
              const activeCount = grp.categories.filter((c) =>
                selectedCategories.includes(c)
              ).length;
              const totalInGroup = grp.categories.reduce(
                (sum, c) => sum + (categoryCounts[c] || 0),
                0
              );
              const isAllActive = activeCount === grp.categories.length;
              const isSomeActive = activeCount > 0 && !isAllActive;

              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => toggleCategoryGroup(grp.categories)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all shrink-0 cursor-pointer ${
                    isAllActive
                      ? grp.color + ' shadow-xs font-bold'
                      : isSomeActive
                      ? 'bg-[#FFFFFF] border-[#1B3E36] text-[#1B3E36]'
                      : 'bg-[#FFFFFF] border-[#E5E1D5] text-[#8A9894] hover:text-[#1A2825]'
                  }`}
                >
                  <span className="text-sm leading-none">{grp.icon}</span>
                  <span>{grp.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                      isAllActive ? 'bg-black/10' : 'bg-[#FAF9F5] text-[#8A9894]'
                    }`}
                  >
                    {totalInGroup}
                  </span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-[#D4CEBF] mx-1 shrink-0 hidden sm:block" />

            <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
              <button
                type="button"
                onClick={selectAllCategories}
                className="text-[#5C6E6A] hover:text-[#1B3E36] font-bold px-1 py-0.5 transition-colors cursor-pointer"
              >
                ALL
              </button>
              <span className="text-[#D4CEBF]">•</span>
              <button
                type="button"
                onClick={clearAllCategories}
                className="text-[#5C6E6A] hover:text-[#B06D44] font-bold px-1 py-0.5 transition-colors cursor-pointer"
              >
                NONE
              </button>
            </div>
          </div>

          {/* Quick Indian Cities / Region Selector Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C6E6A] font-mono shrink-0 mr-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#B06D44]" />
              <span>Region:</span>
            </span>

            {INDIAN_CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => setMapCenter(city.coords)}
                className="px-2.5 py-1 rounded-xl text-xs font-medium bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] transition-all shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
              >
                <span>{city.name}</span>
              </button>
            ))}
          </div>

          {/* Live GPS Detection & Near Me Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E5E1D5] text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Live GPS Toggle */}
              <button
                type="button"
                onClick={toggleTracking}
                className={`px-3 py-1.5 rounded-xl font-bold uppercase tracking-wider border flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isTracking
                    ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36]'
                    : 'bg-[#FAF9F5] text-[#1A2825] border-[#D4CEBF] hover:bg-[#F2EFE7]'
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {isTracking && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A952] opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      isTracking ? 'bg-[#E5A952]' : 'bg-[#5C6E6A]'
                    }`}
                  ></span>
                </span>
                <Radio className={`w-3.5 h-3.5 ${isTracking ? 'text-[#E5A952]' : 'text-[#5C6E6A]'}`} />
                <span>{isTracking ? 'Live GPS: Active' : 'Start Live GPS'}</span>
                {isTracking && gpsLocation && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/20 text-[#FAF9F5]">
                    ±{gpsLocation.accuracy}m
                  </span>
                )}
              </button>

              {/* Center on Me */}
              {gpsLocation && (
                <button
                  type="button"
                  onClick={() => setMapCenter([gpsLocation.lng, gpsLocation.lat])}
                  className="px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider bg-[#FAF9F5] hover:bg-[#F2EFE7] text-[#1A2825] border border-[#D4CEBF] flex items-center gap-1.5 transition-all cursor-pointer shadow-xs text-xs"
                  title="Recenter map to my live GPS coordinates"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-[#1B3E36]" />
                  <span>Center On Me</span>
                </button>
              )}

              {/* Follow User Movement */}
              {isTracking && (
                <button
                  type="button"
                  onClick={() => setFollowUser(!followUser)}
                  className={`px-2.5 py-1.5 rounded-xl font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer text-xs ${
                    followUser
                      ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36]'
                      : 'bg-[#FAF9F5] text-[#5C6E6A] border-[#D4CEBF] hover:text-[#1A2825]'
                  }`}
                  title="Keep map camera centered as you move"
                >
                  <Compass className={`w-3.5 h-3.5 ${followUser ? 'text-[#E5A952] animate-spin' : 'text-[#5C6E6A]'}`} />
                  <span>{followUser ? 'Following' : 'Follow Movement'}</span>
                </button>
              )}

              {/* Near Me Radius Filters */}
              {isTracking && gpsLocation && (
                <div className="flex items-center gap-1 pl-2 border-l border-[#D4CEBF]">
                  <span className="text-[11px] font-bold text-[#5C6E6A] uppercase font-mono mr-1">
                    Radius:
                  </span>
                  {[
                    { label: 'All', value: null },
                    { label: '< 2 km', value: 2 },
                    { label: '< 5 km', value: 5 },
                    { label: '< 10 km', value: 10 },
                  ].map((r) => {
                    const active = nearMeRadius === r.value;
                    return (
                      <button
                        key={r.label}
                        type="button"
                        onClick={() => setNearMeRadius(r.value)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer font-mono ${
                          active
                            ? 'bg-[#1B3E36] text-[#FAF9F5] shadow-xs'
                            : 'bg-[#FAF9F5] hover:bg-[#F2EFE7] text-[#5C6E6A] border border-[#D4CEBF]'
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Live GPS Telemetry Readout */}
            {isTracking && gpsLocation && (
              <div className="text-[11px] font-mono text-[#5C6E6A] flex items-center gap-2">
                <span className="hidden sm:inline">Coordinates:</span>
                <span className="text-[#1A2825] font-bold">
                  {gpsLocation.lat.toFixed(5)}° N, {gpsLocation.lng.toFixed(5)}° E
                </span>
                {gpsLocation.speed !== null && gpsLocation.speed > 0 && (
                  <span className="text-[#1B4D3E] bg-[#E6F2ED] px-1.5 py-0.5 rounded border border-[#A8CEBE] font-bold">
                    {gpsLocation.speed} km/h
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Advanced Filters Panel Drawer */}
      {showFiltersPanel && (
        <div className="bg-[#FAF9F5] border-b border-[#D4CEBF] p-4 sm:p-6 z-30 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D5]">
              <div>
                <h3 className="text-sm font-bold text-[#1A2825] flex items-center gap-2 font-serif">
                  <SlidersHorizontal className="w-4 h-4 text-[#1B3E36]" />
                  <span>Granular Civic Issue Filter Panel</span>
                </h3>
                <p className="text-xs text-[#5C6E6A] mt-0.5">
                  Toggle individual problem types, review issue counts, and customize map density.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-3 py-1 bg-[#FFFFFF] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] text-xs font-bold uppercase font-mono rounded-lg transition-colors cursor-pointer"
                >
                  Reset All
                </button>
                <button
                  type="button"
                  onClick={() => setShowFiltersPanel(false)}
                  className="text-[#5C6E6A] hover:text-[#1A2825] p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Granular Individual Categories Grid */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono">
                  Individual Category Toggles ({selectedCategories.length} / {ALL_CATEGORIES.length}{' '}
                  selected)
                </span>
                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                  <button
                    type="button"
                    onClick={selectAllCategories}
                    className="text-[#1B3E36] hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-[#D4CEBF]">|</span>
                  <button
                    type="button"
                    onClick={clearAllCategories}
                    className="text-[#5C6E6A] hover:text-[#B06D44] cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                {ALL_CATEGORIES.map((cat) => {
                  const active = selectedCategories.includes(cat);
                  const count = categoryCounts[cat] || 0;

                  return (
                    <div
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                        active
                          ? 'bg-[#1B3E36]/10 border-[#1B3E36] text-[#1A2825] font-bold shadow-xs'
                          : 'bg-[#FFFFFF] border-[#E5E1D5] text-[#8A9894] hover:border-[#D4CEBF]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                            active
                              ? 'bg-[#1B3E36] border-[#1B3E36] text-[#FAF9F5]'
                              : 'bg-[#FFFFFF] border-[#D4CEBF] text-transparent'
                          }`}
                        >
                          ✓
                        </div>
                        <span className="truncate">{cat}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          active ? 'bg-[#1B3E36]/20 text-[#1B3E36]' : 'bg-[#FAF9F5] text-[#8A9894]'
                        }`}
                      >
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Breakdown & Descriptions */}
            <div className="pt-3 border-t border-[#E5E1D5]">
              <div className="text-xs font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-3">
                Lifecycle Status Filter ({selectedStatuses.length} / 4 active)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {STATUS_OPTIONS.map((st) => {
                  const active = selectedStatuses.includes(st.id);
                  const count = statusCounts[st.id] || 0;

                  return (
                    <div
                      key={st.id}
                      onClick={() => toggleStatus(st.id)}
                      className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                        active
                          ? `${st.borderColor} bg-[#FAF9F5] shadow-xs`
                          : 'bg-[#FFFFFF] border-[#E5E1D5] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 font-bold text-[#1A2825]">
                          <span className={`w-2.5 h-2.5 rounded-full ${st.dotColor}`} />
                          <span>{st.label}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold text-[#5C6E6A]">
                          {count} issues
                        </span>
                      </div>
                      <p className="text-[11px] text-[#5C6E6A]">{st.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Map View */}
      <div className="relative flex-1 w-full">
        <CivicMap
          complaints={visibleComplaints}
          selectedComplaintId={selectedComplaint?.id}
          onSelectComplaint={(c) => setSelectedComplaint(c)}
          center={mapCenter}
          userLocation={gpsLocation}
          followUser={followUser}
          autoGeolocate={true}
          heightClass="h-[calc(100vh-10rem)]"
        />

        {/* Floating Map Legend Indicator (Bottom-Right) */}
        <div className="absolute top-4 right-4 z-20 bg-[#FAF9F5]/90 backdrop-blur-md border border-[#D4CEBF] rounded-2xl p-3 shadow-md hidden md:block">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#5C6E6A] font-mono mb-2">
            Status Pin Legend
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-[#1A2825]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B06D44] shrink-0" />
              <span>Reported (New)</span>
            </div>
            <div className="flex items-center gap-2 text-[#1A2825]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1B3E36] shrink-0" />
              <span>Verified by City</span>
            </div>
            <div className="flex items-center gap-2 text-[#1A2825]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E5A952] shrink-0" />
              <span>Crew In Progress</span>
            </div>
            <div className="flex items-center gap-2 text-[#1A2825]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#2E6F5E] shrink-0" />
              <span>Resolved & Fixed</span>
            </div>
          </div>
        </div>

        {/* Zero Results Notice */}
        {visibleComplaints.length === 0 && !loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#FAF9F5]/95 border border-[#D4CEBF] rounded-3xl p-6 text-center shadow-xl max-w-sm">
            <EyeOff className="w-10 h-10 text-[#5C6E6A] mx-auto mb-3" />
            <h4 className="text-base font-bold font-serif text-[#1A2825] mb-1">No Matching Issues Visible</h4>
            <p className="text-xs text-[#5C6E6A] mb-4">
              All complaints are currently hidden by your category or status filters.
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Reset Filters & Show All
            </button>
          </div>
        )}

        {/* Selected Complaint Floating Detail Card */}
        {selectedComplaint && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:right-auto sm:w-96 bg-[#FAF9F5]/95 backdrop-blur-md border border-[#D4CEBF] rounded-3xl p-5 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-mono text-xs font-bold text-[#1B3E36]">
                  {selectedComplaint.complaintNumber}
                </span>
                <span
                  className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    selectedComplaint.status === 'RESOLVED'
                      ? 'bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE]'
                      : selectedComplaint.status === 'IN_PROGRESS' ||
                        selectedComplaint.status === 'ASSIGNED'
                      ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                      : selectedComplaint.status === 'VERIFIED'
                      ? 'bg-[#1B3E36]/10 text-[#1B3E36] border border-[#1B3E36]/20'
                      : 'bg-[#FFF1E6] text-[#8A3B2A] border border-[#F4C49E]'
                  }`}
                >
                  {selectedComplaint.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="text-[#5C6E6A] hover:text-[#1A2825] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base font-serif font-bold text-[#1A2825] mb-1">{selectedComplaint.title}</h3>
            <div className="text-xs text-[#5C6E6A] flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-[#B06D44] shrink-0" />
              <span className="truncate">{selectedComplaint.address || 'Reported Location'}</span>
            </div>

            <div className="text-[11px] text-[#5C6E6A] font-semibold mb-3 flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#FFFFFF] border border-[#E5E1D5] font-mono">
                {selectedComplaint.category}
              </span>
              {selectedComplaint.priority && (
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-bold font-mono">
                  {selectedComplaint.priority}
                </span>
              )}
              {calculateDistance(
                selectedComplaint.publicLatitude ?? selectedComplaint.latitude ?? 0,
                selectedComplaint.publicLongitude ?? selectedComplaint.longitude ?? 0
              ) !== null && (
                <span className="px-2 py-0.5 rounded bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] flex items-center gap-1 font-mono font-bold">
                  <LocateFixed className="w-3 h-3 text-[#1B4D3E]" />
                  <span>
                    {formatDistance(
                      calculateDistance(
                        selectedComplaint.publicLatitude ?? selectedComplaint.latitude ?? 0,
                        selectedComplaint.publicLongitude ?? selectedComplaint.longitude ?? 0
                      )
                    )}
                  </span>
                </span>
              )}
            </div>

            {selectedComplaint.description && (
              <p className="text-xs text-[#5C6E6A] line-clamp-2 mb-4 leading-relaxed bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E1D5]">
                {selectedComplaint.description}
              </p>
            )}

            {/* Community Upvote & Priority Escalation Callout */}
            <div className="mb-3 space-y-2">
              {(selectedComplaint.upvotes || 0) >= 10 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#FFF7ED] border border-[#FDBA74] text-[#9A3412] text-[11px] font-bold">
                  <Flame className="w-3.5 h-3.5 text-[#EA580C] shrink-0" />
                  <span>High Community Priority: {selectedComplaint.upvotes} verified residents impacted</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleUpvote(selectedComplaint)}
                disabled={upvoting}
                className="w-full py-2 px-3 rounded-xl border border-[#1B3E36] bg-[#1B3E36]/5 hover:bg-[#1B3E36]/15 text-[#1B3E36] text-xs font-bold flex items-center justify-between transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <ThumbsUp className="w-3.5 h-3.5 text-[#1B3E36]" />
                  <span>Impacts Me Too (+1)</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#1B3E36] text-[#FAF9F5] font-mono text-[11px]">
                  {selectedComplaint.upvotes || 0}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/track?id=${selectedComplaint.complaintNumber}`)}
              className="w-full py-2.5 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            >
              <span>View Full Lifecycle Timeline</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
