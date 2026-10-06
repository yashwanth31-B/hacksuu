import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useGPS } from '../context/GPSContext.tsx';
import { CivicMap } from '../components/CivicMap.tsx';
import { getApiUrl } from '../lib/api.ts';
import {
  Camera,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Navigation,
  Radio,
  Crosshair,
} from 'lucide-react';

interface ReportIssueProps {
  navigate: (path: string) => void;
}

const CATEGORIES = [
  { id: 'Pothole', label: 'Pothole', icon: '🕳️', desc: 'Road holes, craters, asphalt damage' },
  { id: 'Garbage', label: 'Garbage & Waste', icon: '🗑️', desc: 'Trash overflow, uncollected bins' },
  { id: 'Illegal Dumping', label: 'Illegal Dumping', icon: '🚫', desc: 'Construction debris, discarded junk' },
  { id: 'Road Damage', label: 'Road Damage', icon: '🚧', desc: 'Cracked paving, missing road surface' },
  { id: 'Streetlight', label: 'Streetlight & Electrical', icon: '💡', desc: 'Dark light poles, exposed wires' },
  { id: 'Drainage', label: 'Drainage & Flooding', icon: '🌊', desc: 'Clogged storm drains, stagnant water' },
  { id: 'Water Leakage', label: 'Water Leakage', icon: '💧', desc: 'Burst main pipelines, leaking meters' },
  { id: 'Broken Footpath', label: 'Broken Footpath', icon: '🚶', desc: 'Damaged sidewalks, paving stones' },
  { id: 'Traffic Sign Damage', label: 'Traffic Sign Damage', icon: '🛑', desc: 'Bent stop signs, broken signals' },
  { id: 'Public Infrastructure Damage', label: 'Public Infrastructure', icon: '🏛️', desc: 'Damaged railings, bus stops, benches' },
  { id: 'Other', label: 'Other Civic Issue', icon: '⚠️', desc: 'General municipal concerns' },
];

export const ReportIssue: React.FC<ReportIssueProps> = ({ navigate }) => {
  const { getAuthToken } = useAuth();

  // Wizard Step (1 to 6)
  const [step, setStep] = useState(1);

  // Form State
  const [category, setCategory] = useState('Pothole');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 28.6139, lng: 77.2090 }); // Default: New Delhi, India
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [address, setAddress] = useState('Connaught Place, New Delhi, 110001, India');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // AI & Detection states
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Duplicate states
  const [, setCheckingDuplicates] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

  // GPS State & Live Tracking
  const {
    isTracking,
    location: gpsLocation,
    errorMessage: gpsContextError,
    startTracking,
    refreshLocation,
  } = useGPS();

  const [liveSync, setLiveSync] = useState(true);
  const [locatingGPS, setLocatingGPS] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Auto-sync coordinates with live GPS if liveSync is active
  useEffect(() => {
    if (liveSync && gpsLocation) {
      const newCoords = { lat: gpsLocation.lat, lng: gpsLocation.lng };
      setCoords(newCoords);
      setLocationAccuracy(gpsLocation.accuracy);
      reverseGeocode(newCoords.lat, newCoords.lng);
    }
  }, [liveSync, gpsLocation]);

  // When opening Step 4, ensure GPS tracking starts if not already running
  useEffect(() => {
    if (step === 4 && !isTracking) {
      startTracking();
    }
  }, [step, isTracking, startTracking]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdComplaint, setCreatedComplaint] = useState<any>(null);

  const [addressSearchInput, setAddressSearchInput] = useState('');
  const [searchingAddress, setSearchingAddress] = useState(false);

  const handleSearchAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressSearchInput.trim()) return;
    setSearchingAddress(true);
    setGpsError(null);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          addressSearchInput.trim()
        )}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const newLat = Number(parseFloat(data[0].lat).toFixed(6));
          const newLng = Number(parseFloat(data[0].lon).toFixed(6));
          setCoords({ lat: newLat, lng: newLng });
          setAddress(data[0].display_name);
        } else {
          setGpsError(`Could not locate "${addressSearchInput}". Try another address or click the map.`);
        }
      }
    } catch {
      setGpsError('Address lookup service unavailable. Please place marker on map.');
    } finally {
      setSearchingAddress(false);
    }
  };

  // Reverse Geocoding
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.display_name) {
          const parts = data.display_name.split(',');
          setAddress(parts.slice(0, 3).join(', ').trim());
        }
      }
    } catch {
      setAddress(`Approx. Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
    }
  };

  // Trigger GPS
  const handleUseCurrentLocation = async () => {
    setLocatingGPS(true);
    setGpsError(null);
    setLiveSync(true);

    if (!isTracking) {
      startTracking();
    }

    const loc = await refreshLocation();
    if (loc) {
      setCoords({ lat: loc.lat, lng: loc.lng });
      setLocationAccuracy(loc.accuracy);
      reverseGeocode(loc.lat, loc.lng);
    } else if (gpsContextError) {
      setGpsError(gpsContextError);
    }
    setLocatingGPS(false);
  };

  // Image Upload & AI analysis
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setMediaUrls((prev) => [...prev, base64]);

      // Trigger AI Detection automatically
      setAnalyzingAI(true);
      try {
        const res = await fetch(getApiUrl('/api/complaints/ai-analyze'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
        });
        if (res.ok) {
          const aiData = await res.json();
          setAiResult(aiData);
        }
      } catch (err) {
        console.error('AI analysis error:', err);
      } finally {
        setAnalyzingAI(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Apply AI suggestions
  const handleApplyAISuggestions = () => {
    if (!aiResult) return;
    if (aiResult.predictedCategory) {
      const matched = CATEGORIES.find(
        (c) => c.id.toLowerCase() === aiResult.predictedCategory.toLowerCase()
      );
      if (matched) setCategory(matched.id);
      else setCategory('Other');
    }
    if (aiResult.suggestedTitle && !title) {
      setTitle(aiResult.suggestedTitle);
    }
    if (aiResult.suggestedSeverity) {
      setSeverity(aiResult.suggestedSeverity);
    }
  };

  // Duplicate Check before Step 5
  useEffect(() => {
    if (step === 5) {
      const runDupCheck = async () => {
        setCheckingDuplicates(true);
        try {
          const res = await fetch(getApiUrl('/api/complaints/check-duplicate'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: coords.lat,
              longitude: coords.lng,
              category,
              title,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setDuplicates(data.duplicates || []);
          }
        } catch {
          // ignore
        } finally {
          setCheckingDuplicates(false);
        }
      };
      runDupCheck();
    }
  }, [step, coords.lat, coords.lng, category, title]);

  // Submit Complaint
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl('/api/complaints'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          category,
          title,
          description,
          latitude: coords.lat,
          longitude: coords.lng,
          locationAccuracy,
          address,
          mediaUrls,
          severity,
          priority,
          duplicateConfirmed,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected complaint submission.');
      }

      setCreatedComplaint(data);
      setStep(6); // Success step
    } catch (err: any) {
      setSubmitError(err.message || 'Network failure: complaint could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6EE] text-[#1A2825] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Step Progress Bar */}
        {step < 6 && (
          <div className="mb-8">
            <div className="flex items-center justify-between text-xs font-bold text-[#5C6E6A] uppercase tracking-wider mb-2 font-mono">
              <span className="text-[#1B3E36]">STEP {step} OF 5</span>
              <span>
                {step === 1 && 'Issue Category'}
                {step === 2 && 'Title & Details'}
                {step === 3 && 'Photo & AI Assist'}
                {step === 4 && 'Location & GPS'}
                {step === 5 && 'Verification & Review'}
              </span>
            </div>
            <div className="w-full bg-[#E5E1D5] h-2 rounded-full overflow-hidden border border-[#D4CEBF]">
              <div
                className="bg-[#1B3E36] h-full transition-all duration-300 rounded-full"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* STEP 1: CATEGORY SELECTION */}
        {step === 1 && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                CIVIC CLASSIFICATION
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mb-1">Select Issue Category</h2>
              <p className="text-[#5C6E6A] text-sm">
                Choose the category that best describes the civic problem observed in your ward.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1B3E36]/10 border-[#1B3E36] ring-1 ring-[#1B3E36] shadow-sm'
                        : 'bg-[#FFFFFF] border-[#E5E1D5] hover:border-[#D4CEBF]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{cat.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-[#1A2825]">{cat.label}</div>
                        <div className="text-xs text-[#5C6E6A] mt-0.5">{cat.desc}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TITLE & DESCRIPTION */}
        {step === 2 && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                INCIDENT PARTICULARS
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mb-1">Describe The Issue</h2>
              <p className="text-[#5C6E6A] text-sm">
                Provide an accurate title and specific details to assist municipal response crews.
              </p>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                  Complaint Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deep pothole on North Avenue near bus shelter"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] focus:ring-1 focus:ring-[#1B3E36] rounded-xl px-4 py-3 text-sm text-[#1A2825] placeholder-[#8A9894] outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                  Detailed Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe the severity, exact landmark, whether it poses immediate hazard to pedestrians or traffic..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] focus:ring-1 focus:ring-[#1B3E36] rounded-xl px-4 py-3 text-sm text-[#1A2825] placeholder-[#8A9894] outline-none transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                disabled={!title.trim() || !description.trim()}
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PHOTO EVIDENCE & AI DETECTION */}
        {step === 3 && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                EVIDENCE SUBMISSION
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mb-1">Upload Photo Evidence</h2>
              <p className="text-[#5C6E6A] text-sm">
                Visual proof accelerates municipal verification and field crew dispatch.
              </p>
            </div>

            {/* Upload Area */}
            <div className="mb-6">
              <label className="border-2 border-dashed border-[#D4CEBF] hover:border-[#1B3E36] bg-[#F4F0E6]/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-[#1B3E36]/10 text-[#1B3E36] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold font-serif text-[#1A2825] mb-1">Click or Tap to Upload Photo</span>
                <span className="text-xs text-[#5C6E6A] font-mono">Supports JPG, PNG, WEBP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Image Preview & AI Analysis Card */}
            {mediaUrls.length > 0 && (
              <div className="space-y-4 mb-8">
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {mediaUrls.map((url, i) => (
                    <div key={i} className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#D4CEBF] shrink-0 shadow-xs">
                      <img src={url} alt="Evidence" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>

                {/* AI Assistant Card */}
                <div className="bg-[#FAF9F5] border border-[#D4CEBF] rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-[#1B3E36] font-bold text-xs uppercase tracking-wider font-mono">
                      <Sparkles className="w-4 h-4 text-[#E5A952]" />
                      <span>CivicFix AI Computer Vision</span>
                    </div>
                    {analyzingAI && (
                      <div className="flex items-center gap-1.5 text-xs text-[#1B3E36]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing photo...</span>
                      </div>
                    )}
                  </div>

                  {aiResult && !analyzingAI ? (
                    <div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                        <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E1D5]">
                          <div className="text-[10px] text-[#5C6E6A] font-medium font-mono uppercase">Detected Issue</div>
                          <div className="text-sm font-bold text-[#1A2825]">{aiResult.predictedCategory}</div>
                        </div>
                        <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E1D5]">
                          <div className="text-[10px] text-[#5C6E6A] font-medium font-mono uppercase">Confidence</div>
                          <div className="text-sm font-bold text-[#2E6F5E]">
                            {Math.round(aiResult.confidence * 100)}%
                          </div>
                        </div>
                        <div className="bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E5E1D5]">
                          <div className="text-[10px] text-[#5C6E6A] font-medium font-mono uppercase">Suggested Severity</div>
                          <div className="text-sm font-bold text-[#B06D44]">{aiResult.suggestedSeverity}</div>
                        </div>
                      </div>

                      <p className="text-xs text-[#5C6E6A] mb-3 leading-relaxed">
                        <em>Observation:</em> {aiResult.explanation}
                      </p>

                      <button
                        type="button"
                        onClick={handleApplyAISuggestions}
                        className="px-3.5 py-1.5 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] text-xs font-bold rounded-lg transition-colors cursor-pointer uppercase tracking-wider"
                      >
                        Apply AI Suggested Category & Severity
                      </button>
                    </div>
                  ) : !analyzingAI && (
                    <p className="text-xs text-[#5C6E6A]">
                      Upload a photo to automatically identify the civic issue and receive smart category suggestions.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION & GPS */}
        {step === 4 && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                  GEOSPATIAL VERIFICATION
                </div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mb-1">Set Issue Location</h2>
                <p className="text-[#5C6E6A] text-sm">
                  Pinpoint defect coordinates via live satellite GPS or adjust the pin manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={locatingGPS}
                  className="px-4 py-2 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer shadow-sm"
                >
                  {locatingGPS ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Navigation className="w-4 h-4" />
                  )}
                  <span>Snap to Live GPS</span>
                </button>
              </div>
            </div>

            {/* Live GPS Telemetry & Status Card */}
            <div className={`mb-4 p-3.5 rounded-2xl border transition-all ${
              isTracking && gpsLocation
                ? 'bg-[#E6F2ED] border-[#A8CEBE]'
                : 'bg-[#FAF9F5] border-[#E5E1D5]'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-3 w-3">
                    {isTracking && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6F5E] opacity-75"></span>
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-3 w-3 ${
                        isTracking ? 'bg-[#2E6F5E]' : 'bg-[#5C6E6A]'
                      }`}
                    ></span>
                  </span>
                  <div>
                    <div className="text-xs font-bold text-[#1A2825] flex items-center gap-2">
                      <span>{isTracking ? 'Live GPS Satellite Tracking: Active' : 'Live GPS Detection: Idle'}</span>
                      {locationAccuracy !== null && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md font-bold ${
                          locationAccuracy <= 10
                            ? 'bg-[#1B3E36] text-[#FAF9F5]'
                            : 'bg-[#E5A952] text-[#102621]'
                        }`}>
                          ±{locationAccuracy}m {locationAccuracy <= 10 ? 'High Precision' : 'Estimated'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#5C6E6A] font-mono mt-0.5">
                      Lat: {coords.lat.toFixed(6)} • Lng: {coords.lng.toFixed(6)}
                      {gpsLocation?.speed !== null && gpsLocation?.speed !== undefined && gpsLocation.speed > 0 && (
                        <span className="ml-2 text-[#2E6F5E] font-semibold">• Speed: {gpsLocation.speed} km/h</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Live Sync Auto-Follow Toggle */}
                  {isTracking && (
                    <button
                      type="button"
                      onClick={() => setLiveSync(!liveSync)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border flex items-center gap-1.5 transition-all cursor-pointer ${
                        liveSync
                          ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36]'
                          : 'bg-[#FFFFFF] text-[#5C6E6A] border-[#D4CEBF] hover:text-[#1A2825]'
                      }`}
                      title={liveSync ? 'Pin automatically follows your physical movement' : 'Click to lock pin to your live movement'}
                    >
                      <Crosshair className={`w-3.5 h-3.5 ${liveSync ? 'animate-pulse text-[#E5A952]' : ''}`} />
                      <span>{liveSync ? 'Auto-Sync Pin: ON' : 'Auto-Sync Pin: OFF'}</span>
                    </button>
                  )}

                  {!isTracking && (
                    <button
                      type="button"
                      onClick={startTracking}
                      className="px-3 py-1.5 bg-[#FAF9F5] hover:bg-[#F2EFE7] text-[#1A2825] border border-[#D4CEBF] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    >
                      <Radio className="w-3.5 h-3.5 text-[#1B3E36]" />
                      <span>Enable Tracking</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {gpsError && (
              <div className="mb-4 p-3 rounded-xl bg-[#FFF1E6] border border-[#F4C49E] text-[#8A3B2A] text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gpsError}</span>
              </div>
            )}

            {/* Address Search Bar */}
            <form onSubmit={handleSearchAddress} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search city, district, street, or landmark (e.g. Visakhapatnam, Kukatpally, Delhi)..."
                  value={addressSearchInput}
                  onChange={(e) => setAddressSearchInput(e.target.value)}
                  className="flex-1 bg-[#FFFFFF] border border-[#D4CEBF] focus:border-[#1B3E36] focus:ring-1 focus:ring-[#1B3E36] rounded-xl px-4 py-2.5 text-xs text-[#1A2825] placeholder-[#8A9894] outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={searchingAddress || !addressSearchInput.trim()}
                  className="px-4 py-2.5 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {searchingAddress ? 'Searching...' : 'Go to Location'}
                </button>
              </div>
            </form>

            {/* Quick Indian City Selection Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-2 text-xs">
              <span className="text-[11px] font-bold text-[#5C6E6A] uppercase font-mono shrink-0">Quick Jump:</span>
              {[
                { name: 'Hyderabad (Kukatpally)', lat: 17.4947, lng: 78.3996, addr: 'Near Kukatpally Metro Station, Hyderabad, 500072' },
                { name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, addr: 'Connaught Place, New Delhi, 110001' },
                { name: 'Visakhapatnam', lat: 17.7142, lng: 83.3236, addr: 'RK Beach Road, Visakhapatnam, 530017' },
                { name: 'Bengaluru', lat: 12.9754, lng: 77.6066, addr: 'MG Road, Central Bengaluru, 560001' },
                { name: 'Mumbai', lat: 18.9438, lng: 72.8234, addr: 'Marine Drive, Mumbai, 400020' },
                { name: 'Chennai', lat: 13.0827, lng: 80.2707, addr: 'Anna Salai, Chennai, 600002' },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setLiveSync(false);
                    setCoords({ lat: c.lat, lng: c.lng });
                    setAddress(c.addr);
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#FAF9F5] hover:bg-[#EAE6DA] border border-[#D4CEBF] text-[#1A2825] transition-all shrink-0 cursor-pointer"
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Address Display */}
            <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-xl p-3.5 mb-4 flex items-center gap-3">
              <MapPin className="w-5 h-5 text-[#B06D44] shrink-0" />
              <div className="flex-1">
                <div className="text-[11px] text-[#5C6E6A] font-bold uppercase tracking-wider flex items-center gap-2 font-mono">
                  <span>Resolved Address</span>
                  {liveSync && (
                    <span className="text-[9px] bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] px-1.5 py-0.2 rounded uppercase font-bold">
                      Live GPS Sync
                    </span>
                  )}
                </div>
                <div className="text-sm text-[#1A2825] font-semibold">{address}</div>
              </div>
              <div className="text-[10px] text-[#5C6E6A] font-mono">
                {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
              </div>
            </div>

            {/* Draggable Map Picker */}
            <div className="mb-8 border border-[#D4CEBF] rounded-2xl overflow-hidden shadow-xs">
              <CivicMap
                pickerMode={true}
                pickerCoords={coords}
                userLocation={gpsLocation}
                onPickerCoordsChange={(c) => {
                  setLiveSync(false);
                  setCoords(c);
                  reverseGeocode(c.lat, c.lng);
                }}
                heightClass="h-[380px]"
              />
              <div className="p-2.5 bg-[#FAF9F5] border-t border-[#E5E1D5] flex items-center justify-between text-[11px] text-[#5C6E6A]">
                <span>Tip: Drag the pin to fine-tune exact defect spot.</span>
                {!liveSync && isTracking && (
                  <button
                    type="button"
                    onClick={() => setLiveSync(true)}
                    className="text-[#1B3E36] hover:underline font-bold cursor-pointer"
                  >
                    Snap back to Live GPS
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2.5 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(5)}
                className="px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-sm"
              >
                <span>Review & Verify</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: VERIFICATION & DUPLICATE CHECK */}
        {step === 5 && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <div className="text-xs font-bold uppercase tracking-wider text-[#B06D44] font-mono mb-1">
                PRE-SUBMISSION AUDIT
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2825] mb-1">Review & Submit</h2>
              <p className="text-[#5C6E6A] text-sm">
                Verify details before submitting your report to the municipal resolution queue.
              </p>
            </div>

            {/* Potential Duplicate Alert */}
            {duplicates.length > 0 && (
              <div className="bg-[#FFF1E6] border border-[#F4C49E] rounded-2xl p-5 mb-6">
                <div className="flex items-center gap-2 text-[#8A3B2A] font-bold text-sm mb-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>A similar issue has already been reported nearby</span>
                </div>
                <p className="text-xs text-[#5C6E6A] mb-4 leading-relaxed">
                  We found {duplicates.length} active complaint(s) in this immediate vicinity:
                </p>

                <div className="space-y-2 mb-4">
                  {duplicates.map((dup) => (
                    <div
                      key={dup.complaintId}
                      className="bg-[#FFFFFF] border border-[#F4C49E] p-3 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#1A2825]">{dup.title}</div>
                        <div className="text-[#5C6E6A]">
                          {dup.complaintNumber} • {dup.distanceMeters}m away • {dup.status}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/track?id=${dup.complaintNumber}`)}
                        className="px-2.5 py-1 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] font-semibold rounded-lg text-xs"
                      >
                        View Report
                      </button>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#1A2825] font-medium">
                  <input
                    type="checkbox"
                    checked={duplicateConfirmed}
                    onChange={(e) => setDuplicateConfirmed(e.target.checked)}
                    className="rounded border-[#D4CEBF] text-[#1B3E36] focus:ring-0"
                  />
                  <span>This is a distinct problem / I wish to report separately</span>
                </label>
              </div>
            )}

            {/* Severity and Priority selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                  Assessed Severity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((sev) => (
                    <button
                      key={sev}
                      type="button"
                      onClick={() => setSeverity(sev)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider ${
                        severity === sev
                          ? 'bg-[#1B3E36] text-[#FAF9F5] border-[#1B3E36]'
                          : 'bg-[#FFFFFF] text-[#5C6E6A] border-[#D4CEBF] hover:text-[#1A2825]'
                      }`}
                    >
                      {sev}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2825] uppercase tracking-wider mb-2 font-mono">
                  Urgency Level
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((pri) => (
                    <button
                      key={pri}
                      type="button"
                      onClick={() => setPriority(pri)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all uppercase tracking-wider ${
                        priority === pri
                          ? 'bg-[#B06D44] text-[#FAF9F5] border-[#B06D44]'
                          : 'bg-[#FFFFFF] text-[#5C6E6A] border-[#D4CEBF] hover:text-[#1A2825]'
                      }`}
                    >
                      {pri}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Box */}
            <div className="bg-[#FFFFFF] border border-[#E5E1D5] rounded-2xl p-5 mb-6 text-xs space-y-2.5 shadow-xs">
              <div className="flex justify-between">
                <span className="text-[#5C6E6A] uppercase font-mono">Category:</span>
                <span className="text-[#1A2825] font-bold">{category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6E6A] uppercase font-mono">Title:</span>
                <span className="text-[#1A2825] font-semibold">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6E6A] uppercase font-mono">Location:</span>
                <span className="text-[#1A2825] font-semibold">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6E6A] uppercase font-mono">Evidence Attached:</span>
                <span className="text-[#2E6F5E] font-bold">{mediaUrls.length} file(s)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C6E6A] uppercase font-mono">Citizen Privacy:</span>
                <span className="text-[#1B3E36] font-bold">Anonymous Municipal ID</span>
              </div>
            </div>

            {submitError && (
              <div className="mb-6 p-4 rounded-xl bg-[#FFF1E6] border border-[#F4C49E] text-[#8A3B2A] text-sm flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{submitError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={submitting}
                className="px-4 py-2.5 text-[#5C6E6A] hover:text-[#1A2825] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3.5 bg-[#1B3E36] hover:bg-[#274E45] text-[#FAF9F5] font-bold text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E5A952]" />
                    <span>Submitting to Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#E5A952]" />
                    <span>Submit Civic Report</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 6: SUBMISSION CONFIRMATION */}
        {step === 6 && createdComplaint && (
          <div className="bg-[#FAF9F5] border border-[#E5E1D5] rounded-3xl p-8 text-center shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-[#E6F2ED] border border-[#A8CEBE] text-[#1B4D3E] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-block px-3 py-1 bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE] rounded-full text-xs font-bold uppercase tracking-wider mb-2 font-mono">
              DATABASE REGISTRATION CONFIRMED
            </div>

            <h2 className="text-3xl font-serif font-bold text-[#1A2825] mb-2">Complaint Submitted Successfully</h2>
            <p className="text-[#5C6E6A] text-sm max-w-md mx-auto mb-8 font-normal">
              Your civic report has been securely registered in the municipal database and routed to the responsible department.
            </p>

            {/* Tracking Badge */}
            <div className="bg-[#FFFFFF] border border-[#D4CEBF] rounded-2xl p-6 max-w-md mx-auto mb-8 text-left space-y-3 shadow-xs">
              <div className="flex justify-between items-center pb-3 border-b border-[#E5E1D5]">
                <span className="text-xs text-[#5C6E6A] uppercase font-mono font-bold">Complaint ID:</span>
                <span className="font-mono text-base font-extrabold text-[#1B3E36]">
                  {createdComplaint.complaintNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5C6E6A] uppercase font-mono font-bold">Category:</span>
                <span className="text-xs font-bold text-[#1A2825]">{createdComplaint.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5C6E6A] uppercase font-mono font-bold">Status:</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E6F2ED] text-[#1B4D3E] border border-[#A8CEBE]">
                  {createdComplaint.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#5C6E6A] uppercase font-mono font-bold">Public Anonymity:</span>
                <span className="text-xs font-mono text-[#2E6F5E] font-bold">
                  {createdComplaint.anonymousPublicId}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(`/track?id=${createdComplaint.complaintNumber}`)}
                className="w-full sm:w-auto px-6 py-3 bg-[#E5A952] hover:bg-[#d99d45] text-[#102621] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Track This Complaint Now
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setTitle('');
                  setDescription('');
                  setMediaUrls([]);
                  setCreatedComplaint(null);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-[#FAF9F5] hover:bg-[#F2EFE7] border border-[#D4CEBF] text-[#1A2825] font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Report Another Issue
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
