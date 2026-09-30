import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Navigation, Search, RefreshCw, AlertCircle, ShieldCheck,
  Building2, Layers, CheckCircle2, ChevronRight, Store
} from 'lucide-react';
import { Language, NearbyBusiness, NearbyBusinessesResponse } from '../types';
import { geocodeLocation, reverseGeocode, fetchNearbyBusinesses } from '../services/api';
import { TRANSLATIONS } from '../i18n/translations';

// Fix Leaflet default icon issue in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Brand Markers
const createBrandIcon = (color: string, label: string = '') => {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2.5px solid white;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const userLocationIcon = createBrandIcon('#0F4E4B', '📍');
const competitorIcon = createBrandIcon('#176B67', '🏪');
const extendedCompetitorIcon = createBrandIcon('#D97706', '🏪');
const selectedCompetitorIcon = createBrandIcon('#0F4E4B', '★');

// Component to dynamically re-center Leaflet Map and ensure correct tile dimensions
const MapRecenterer: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 13 }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
    const timers = [
      setTimeout(() => map.invalidateSize(), 50),
      setTimeout(() => map.invalidateSize(), 200),
      setTimeout(() => map.invalidateSize(), 500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [center, zoom, map]);
  return null;
};

// Component to ensure Leaflet renders immediately upon mounting
const MapInitializer: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      try {
        map.invalidateSize();
      } catch (_) {}
    };
    window.addEventListener('resize', handleResize);
    const timers = [
      setTimeout(handleResize, 50),
      setTimeout(handleResize, 150),
      setTimeout(handleResize, 350),
      setTimeout(handleResize, 700),
    ];
    return () => {
      window.removeEventListener('resize', handleResize);
      timers.forEach(clearTimeout);
    };
  }, [map]);
  return null;
};

interface Props {
  language: Language;
  initialVillage?: string;
  initialDistrict?: string;
  initialCategory?: string;
  initialLat?: number;
  initialLon?: number;
  initialRadius?: number;
  onLocationSelect?: (lat: number, lon: number, villageName: string, districtName: string) => void;
  hideHeaderControls?: boolean;
  hideKpiCards?: boolean;
  hideOutletList?: boolean;
  mapHeight?: string;
}

export const LocalMarketMap: React.FC<Props> = ({
  language,
  initialVillage = "Valarpuram",
  initialDistrict = "Kanchipuram",
  initialCategory = "Dairy",
  initialLat = 13.0125,
  initialLon = 79.9754,
  initialRadius = 5,
  onLocationSelect,
  hideHeaderControls = false,
  hideKpiCards = false,
  hideOutletList = false,
  mapHeight = "380px"
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;
  const [searchQuery, setSearchQuery] = useState(`${initialVillage}, ${initialDistrict}`);
  const [userLat, setUserLat] = useState<number>(initialLat);
  const [userLon, setUserLon] = useState<number>(initialLon);
  const [villageName, setVillageName] = useState<string>(initialVillage);
  const [districtName, setDistrictName] = useState<string>(initialDistrict);

  const [selectedRadius, setSelectedRadius] = useState<number>(initialRadius); // 5 km or 10 km
  const [category, setCategory] = useState<string>(initialCategory);

  const [poiData, setPoiData] = useState<NearbyBusinessesResponse | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<NearbyBusiness | null>(null);

  useEffect(() => {
    setUserLat(initialLat);
    setUserLon(initialLon);
  }, [initialLat, initialLon]);

  useEffect(() => {
    setVillageName(initialVillage);
    setDistrictName(initialDistrict);
    setSearchQuery(`${initialVillage}, ${initialDistrict}`);
  }, [initialVillage, initialDistrict]);

  useEffect(() => {
    if (initialRadius) {
      setSelectedRadius(initialRadius);
    }
  }, [initialRadius]);

  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  const [loading, setLoading] = useState<boolean>(false);
  const [geoLocating, setGeoLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [accuracyMeter, setAccuracyMeter] = useState<number | null>(null);

  // Fetch POIs when lat, lon, radius, or category changes
  const loadNearbyPOIs = async (lat: number, lon: number, rad: number, cat: string) => {
    setLoading(true);
    try {
      const locStr = searchQuery || (villageName ? `${villageName}, ${districtName}` : '');
      const data = await fetchNearbyBusinesses(lat, lon, rad, cat, undefined, locStr);
      setPoiData(data);
    } catch (err) {
      console.error("Failed to load nearby POIs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNearbyPOIs(userLat, userLon, selectedRadius, category);
  }, [userLat, userLon, selectedRadius, category]);

  // Handler: "-"- Use My Current Location"
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Browser does not support geolocation. Please search for your village manually.");
      return;
    }

    setGeoLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setAccuracyMeter(Math.round(pos.coords.accuracy));
        setUserLat(lat);
        setUserLon(lon);

        // Reverse geocode to retrieve village name
        const geoResult = await reverseGeocode(lat, lon);
        const vName = geoResult.village || "Current Location";
        const dName = geoResult.district || "Local District";

        setVillageName(vName);
        setDistrictName(dName);
        setSearchQuery(`${vName}, ${dName}`);

        if (onLocationSelect) {
          onLocationSelect(lat, lon, vName, dName);
        }

        setGeoLocating(false);
      },
      (error) => {
        setGeoLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Location access was not allowed. Please enter location manually.");
        } else {
          setGeoError("We couldn't determine your current location. Please search manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handler: Manual Location Search
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setGeoError(null);

    try {
      const result = await geocodeLocation(searchQuery);
      setUserLat(result.latitude);
      setUserLon(result.longitude);

      const vName = result.village || searchQuery.split(',')[0].trim();
      const dName = result.district || "District";

      setVillageName(vName);
      setDistrictName(dName);

      if (onLocationSelect) {
        onLocationSelect(result.latitude, result.longitude, vName, dName);
      }
    } catch (err) {
      setGeoError("Could not find location. Please check village or district spelling.");
    } finally {
      setLoading(false);
    }
  };

  const competitionLevel = poiData?.competition_level || "MEDIUM";
  const competitionColor = competitionLevel === "LOW" ? "text-[#176B67] bg-[#EDF3F1] border-[#A8CCC4]" :
    competitionLevel === "MEDIUM" ? "text-[#A07C2E] bg-[#FBF6EA] border-[#F5D49A]" : "text-[#0F4E4B] bg-[#EDF3F1] border-[#E5E1D8]";

  const isMapOnly = hideHeaderControls && hideKpiCards && hideOutletList;

  return (
    <div className={isMapOnly ? "w-full" : "space-y-6"}>
      
      {/* Search Header Bar & Radius Selection */}
      {!hideHeaderControls && (
        <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-brand-navy font-heading flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-teal" />
                {t.nav_market_analysis}
              </h2>
              <p className="text-xs text-[#68706D] mt-0.5">
                Mapped businesses within 5 km and 10 km catchment of <strong className="text-[#252525]">{villageName}, {districtName}</strong>.
              </p>
            </div>

          {/* Current Location Trigger Button */}
          <button
            onClick={handleUseCurrentLocation}
            disabled={geoLocating}
            className="flex items-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all shrink-0 border-2 border-teal-600 cursor-pointer"
          >
            <Navigation className={`w-4 h-4 text-teal-700 ${geoLocating ? 'animate-spin' : ''}`} />
            <span className="text-teal-950 font-bold">{geoLocating ? t.finding_btn : t.use_my_location}</span>
          </button>
        </div>

        {/* Location Search Form */}
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[#7FA99B] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.search_location_placeholder}
              className="w-full bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#252525] focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-brand-teal hover:bg-brand-teal-hover text-white font-bold text-xs px-5 py-2 rounded-xl shadow-xs transition-all shrink-0"
          >
            {loading ? t.finding_btn : t.search_btn}
          </button>
        </form>

        {/* Geolocation Accuracy or Permission Error Feedback */}
        {geoError && (
          <div className="flex items-center gap-2 bg-[#EDF3F1] border border-[#E5E1D8] text-[#0F4E4B] text-xs p-3 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{geoError}</span>
          </div>
        )}

        {accuracyMeter && !geoError && (
          <div className="text-[11px] text-[#68706D] flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            <span>Current location verified (Accuracy ~{accuracyMeter} meters)</span>
          </div>
        )}

        {/* Radius Options & Business Category Selector */}
        <div className="pt-2 border-t border-[#E5E1D8] flex flex-wrap items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#252525] uppercase tracking-wider text-[10px]">Search Radius:</span>
            <div className="flex items-center gap-1 bg-[#EDF3F1] p-1 rounded-xl border border-[#E5E1D8]">
              <button
                type="button"
                onClick={() => setSelectedRadius(5)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  selectedRadius === 5 ? 'bg-brand-navy text-white shadow-xs' : 'text-[#68706D] hover:text-brand-navy'
                }`}
              >
                5 KM Radius
              </button>
              <button
                type="button"
                onClick={() => setSelectedRadius(10)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  selectedRadius === 10 ? 'bg-brand-navy text-white shadow-xs' : 'text-[#68706D] hover:text-brand-navy'
                }`}
              >
                10 KM Radius
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#252525] uppercase tracking-wider text-[10px]">Category:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg px-2.5 py-1 text-xs font-semibold text-brand-navy focus:outline-none cursor-pointer"
            >
              <option value="Dairy">Dairy Venture</option>
              <option value="Grocery">Grocery Store</option>
              <option value="Textile">Textile / Clothing</option>
              <option value="Tailoring">Tailoring Workshop</option>
              <option value="Food Processing">Food Processing</option>
              <option value="Mobile/Electronics">Mobile & Electronics</option>
              <option value="Repair Services">Repair Services</option>
              <option value="Agriculture">Agriculture Inputs</option>
            </select>
          </div>

        </div>

      </div>
      )}

      {/* Competitor Count KPI Cards */}
      {!hideKpiCards && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7FA99B]">{t.catchment_5km}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-brand-navy font-heading">{poiData?.count_5km ?? 0}</span>
              <span className="text-xs font-semibold text-[#68706D]">{t.nearby_mapped_title}</span>
            </div>
            <span className="text-[10px] text-teal-600 font-medium block">{t.data_provider_label}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7FA99B]">{t.catchment_10km}</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-brand-navy font-heading">{poiData?.count_10km ?? 0}</span>
              <span className="text-xs font-semibold text-[#68706D]">{t.nearby_mapped_title}</span>
            </div>
            <span className="text-[10px] text-[#7FA99B] font-medium block">{t.extended_catchment}</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#7FA99B]">{t.competition_density}</span>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${competitionColor}`}>
                {competitionLevel === 'LOW' ? t.competition_low : competitionLevel === 'HIGH' ? t.competition_high : t.competition_medium}
              </span>
            </div>
            <span className="text-[10px] text-[#68706D] block pt-1">
              Based on {poiData?.count_5km ?? 0} mapped outlets within 5 km
            </span>
          </div>

        </div>
      )}

      {/* Main Map Container */}
      <div className={`bg-white overflow-hidden relative ${isMapOnly ? "h-full w-full rounded-2xl flex flex-col" : "rounded-3xl border border-[#E5E1D8] shadow-lg"}`}>
        
        {/* Map Header Legend - only displayed in full stand-alone mode */}
        {!isMapOnly && (
          <div className="bg-brand-navy text-white px-4 py-2.5 text-xs flex items-center justify-between border-b border-slate-800 flex-wrap gap-2">
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#0F3D6E] border-2 border-white inline-block"></span>
                <span className="text-[11px]">Your Center</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#14B8A6] border-2 border-white inline-block"></span>
                <span className="text-[11px]">0 – 5 km Outlets</span>
              </span>
              {selectedRadius >= 10 && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white inline-block"></span>
                  <span className="text-[11px] text-amber-300 font-semibold">5 – 10 km Sector</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-[#252525] text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700">
                {selectedRadius} KM Sector Active
              </span>
            </div>
          </div>
        )}

        {/* Real Leaflet Interactive Map */}
        <div style={{ height: isMapOnly ? '100%' : mapHeight }} className="w-full flex-1 h-full min-h-[260px] z-10 relative">
          {(() => {
            const safeLat = typeof userLat === 'number' && !isNaN(userLat) && userLat !== 0 ? userLat : 13.0125;
            const safeLon = typeof userLon === 'number' && !isNaN(userLon) && userLon !== 0 ? userLon : 79.9754;
            return (
              <MapContainer
                center={[safeLat, safeLon]}
                zoom={selectedRadius === 5 ? 13 : 12}
                scrollWheelZoom={false}
                className="h-full w-full min-h-[260px]"
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapRecenterer center={[safeLat, safeLon]} zoom={selectedRadius === 5 ? 13 : 12} />
                <MapInitializer />

                {/* Inner 5 km Radius Ring */}
                {selectedRadius >= 10 && (
                  <Circle
                    center={[safeLat, safeLon]}
                    radius={5000}
                    pathOptions={{
                      color: '#0D9488',
                      fillColor: '#14B8A6',
                      fillOpacity: 0.05,
                      weight: 1.5,
                      dashArray: '3, 6'
                    }}
                  />
                )}

                {/* Outer / Active Radius Visualizer Circle */}
                <Circle
                  center={[safeLat, safeLon]}
                  radius={selectedRadius * 1000}
                  pathOptions={{
                    color: selectedRadius >= 10 ? '#F59E0B' : '#14B8A6',
                    fillColor: selectedRadius >= 10 ? '#FBBF24' : '#14B8A6',
                    fillOpacity: selectedRadius >= 10 ? 0.04 : 0.08,
                    weight: 2,
                    dashArray: '4, 8'
                  }}
                />

                {/* User Location Marker */}
                <Marker position={[safeLat, safeLon]} icon={userLocationIcon}>
                  <Popup>
                    <div className="p-1 space-y-1 text-xs">
                      <strong className="text-brand-navy block">{villageName}</strong>
                      <p className="text-[#68706D] text-[11px]">{districtName}, Tamil Nadu</p>
                      <span className="bg-brand-navy text-white text-[9px] font-bold px-2 py-0.5 rounded inline-block">
                        Your Selected Center
                      </span>
                    </div>
                  </Popup>
                </Marker>

                {/* Mapped Competitor Markers */}
                {poiData?.businesses
                  ?.filter((biz) => typeof biz.latitude === 'number' && !isNaN(biz.latitude) && typeof biz.longitude === 'number' && !isNaN(biz.longitude) && biz.distance_km <= selectedRadius)
                  .map((biz) => {
                    const isSelected = selectedBusiness?.id === biz.id;
                    const isExtended = biz.distance_km > 5.0;
                    return (
                      <Marker
                        key={biz.id || `${biz.name}-${biz.latitude}`}
                        position={[biz.latitude, biz.longitude]}
                        icon={isSelected ? selectedCompetitorIcon : isExtended ? extendedCompetitorIcon : competitorIcon}
                        eventHandlers={{
                          click: () => setSelectedBusiness(biz)
                        }}
                      >
                        <Popup>
                          <div className="p-1.5 space-y-1 text-xs max-w-xs">
                            <div className="flex items-center justify-between gap-2">
                              <strong className="text-brand-navy font-heading">{biz.name}</strong>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                isExtended
                                  ? 'bg-[#F5E6BB] text-[#A07C2E] border border-amber-300'
                                  : 'bg-brand-teal/20 text-teal-800'
                              }`}>
                                {biz.distance_km.toFixed(1)} km ({isExtended ? '5 – 10 km sector' : '0 – 5 km'})
                              </span>
                            </div>
                            <p className="text-[#68706D] text-[11px]">{biz.address}</p>
                            <div className="pt-1 flex items-center justify-between border-t border-[#E5E1D8] text-[10px] text-[#7FA99B]">
                              <span>Source: {biz.source_name}</span>
                              <span className="font-semibold text-teal-600">{biz.data_status}</span>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
              </MapContainer>
            );
          })()}
        </div>

      </div>

      {/* Competitor List & Details Section */}
      {!hideOutletList && (
        <>
          <div className="bg-white p-5 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
            
            <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
              <h3 className="font-bold text-brand-navy text-sm font-heading flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-teal" />
                {t.nearby_mapped_title} ({poiData?.businesses.length ?? 0})
              </h3>

              <span className="bg-brand-gold text-brand-navy font-extrabold text-[10px] px-2.5 py-0.5 rounded">
                {t.data_status_badge}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {poiData?.businesses.map((biz) => {
                const isSelected = selectedBusiness?.id === biz.id;
                return (
                  <div
                    key={biz.id}
                    onClick={() => {
                      setSelectedBusiness(biz);
                      setUserLat(biz.latitude);
                      setUserLon(biz.longitude);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected 
                        ? 'border-brand-teal bg-teal-50/40 shadow-sm ring-1 ring-brand-teal' 
                        : 'border-[#E5E1D8] bg-[#F8F7F2]/60 hover:border-[#E5E1D8]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-brand-navy text-white text-[9px] font-bold px-2 py-0.5 rounded">
                        {biz.distance_km} km away
                      </span>
                      <span className="text-[9px] text-[#7FA99B] font-medium">{biz.data_status}</span>
                    </div>

                    <div>
                      <h4 className="font-bold text-brand-navy text-xs font-heading">{biz.name}</h4>
                      <p className="text-[11px] text-[#68706D] truncate">{biz.address}</p>
                    </div>

                    <div className="pt-1 text-[10px] text-brand-teal font-semibold flex items-center justify-between border-t border-[#E5E1D8]/60">
                      <span>{t.view_marker_btn}</span>
                      <ChevronRight className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* AI Market Interpretation Box */}
          <div className="bg-brand-navy text-white p-5 rounded-2xl space-y-3 shadow-md border border-slate-700 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-teal" />
              <h3 className="font-bold font-heading text-sm text-white">{t.market_intel_summary_title}</h3>
            </div>

            <p className="text-[#68706D] leading-relaxed text-[11.5px]">
              Mapped <strong className="text-white">{poiData?.count_5km ?? 0} similar outlets</strong> within 5 km and <strong className="text-white">{poiData?.count_10km ?? 0} outlets</strong> across the 10 km regional radius.
              Competition level is evaluated as <strong className="text-brand-teal">{competitionLevel}</strong>.
              {competitionLevel === 'LOW' && ` ${t.market_intel_low_comp}`}
              {competitionLevel === 'MEDIUM' && ` ${t.market_intel_med_comp}`}
              {competitionLevel === 'HIGH' && ` ${t.market_intel_high_comp}`}
            </p>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-[#7FA99B]">
              <span>{t.data_provider_label}</span>
              <span className="text-teal-300 font-semibold">{t.haversine_label}</span>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
