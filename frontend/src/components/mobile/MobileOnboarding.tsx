import React, { useState } from 'react';
import {
  MapPin, Check, ArrowRight, ArrowLeft, Navigation,
  Building2, Lightbulb, TrendingUp, DollarSign, User,
  Briefcase, Compass, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Language, LocationData } from '../../types';
import { reverseGeocode } from '../../services/api';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onComplete: (data: {
    location: LocationData;
    capital: number;
    profile: { name: string; experience: string; skills: string; interest: string };
    goal: 'have_idea' | 'suggest_business' | 'improve_existing';
  }) => void;
}

const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: '?????' },
  { code: 'hi', name: 'Hindi', native: '??????' },
  { code: 'ml', name: 'Malayalam', native: '??????' },
  { code: 'kn', name: 'Kannada', native: '?????' },
  { code: 'mr', name: 'Marathi', native: '?????' },
];

export const MobileOnboarding: React.FC<Props> = ({
  language,
  onLanguageChange,
  onComplete,
}) => {
  // Current screen step: 0 = Welcome, 1 = Language, 2 = Location, 3 = Profile, 4 = Capital, 5 = Goal
  const [step, setStep] = useState<number>(0);

  // Form states
  const [locData, setLocData] = useState<LocationData>({
    village: 'Valarpuram',
    block: 'Sriperumbudur',
    district: 'Kanchipuram',
    state: 'Tamil Nadu',
    latitude: 13.0125,
    longitude: 79.9754,
  });
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);

  const [profile, setProfile] = useState({
    name: 'Rajesh Kumar',
    experience: 'Beginner',
    skills: 'Farming & Local Retail',
    interest: 'Dairy & Agriculture',
  });

  const [capital, setCapital] = useState<number>(100000);
  const [capitalInputStr, setCapitalInputStr] = useState<string>('100000');

  const [goal, setGoal] = useState<'have_idea' | 'suggest_business' | 'improve_existing'>('have_idea');

  const handleDetectGPS = () => {
    setIsDetectingGps(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          try {
            const res = await reverseGeocode(lat, lon);
            setLocData({
              ...locData,
              village: res.village || 'Valarpuram',
              district: res.district || 'Kanchipuram',
              state: res.state || 'Tamil Nadu',
              latitude: lat,
              longitude: lon,
            });
          } catch {
            setLocData((prev) => ({ ...prev, latitude: lat, longitude: lon }));
          } finally {
            setIsDetectingGps(false);
          }
        },
        () => setIsDetectingGps(false),
        { timeout: 6000 }
      );
    } else {
      setIsDetectingGps(false);
    }
  };

  const handleFinish = () => {
    onComplete({
      location: locData,
      capital,
      profile,
      goal,
    });
  };

  return (
    <div className="min-h-screen bg-[#252525] flex justify-center text-[#252525] font-sans select-none antialiased">
      <div className="w-full max-w-md bg-[#F8FAFC] min-h-screen flex flex-col justify-between p-6 relative shadow-2xl border-x border-[#E5E1D8]">

        {/* Top Progress bar (Steps 1 to 5) */}
        {step > 0 && (
          <div className="w-full pt-2 pb-4">
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="p-1.5 -ml-1 rounded-xl text-[#68706D] hover:text-[#252525] active:bg-[#E5E1D8] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-xs font-bold text-[#68706D] tracking-wider uppercase">
                Step {step} of 5
              </span>
              <div className="w-6" />
            </div>
            <div className="w-full h-1.5 bg-[#E5E1D8] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#176B67] rounded-full transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 02. WELCOME SCREEN                                 */}
        {/* -------------------------------------------------- */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-between py-6 animate-in fade-in duration-300">
            <div className="space-y-6 my-auto">
              {/* Minimal Business Abstract Visual */}
              <div className="w-20 h-20 rounded-3xl bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] flex items-center justify-center shadow-sm">
                <Building2 className="w-10 h-10 text-[#176B67]" />
              </div>

              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] text-xs font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#176B67]" />
                  Grambiz AI Advisory
                </span>
                <h1 className="text-3xl font-extrabold text-[#252525] font-heading tracking-tight leading-tight">
                  Build the right business for your place.
                </h1>
                <p className="text-sm text-[#68706D] leading-relaxed font-normal">
                  Understand your local market, funding options and business feasibility before you invest.
                </p>
              </div>

              {/* Highlights List */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EDF3F1] flex items-center justify-center text-[#176B67] shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#252525]">Hyper-Local Market Intelligence</p>
                    <p className="text-[#68706D]">5km & 10km catchment demand & competitors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#EDF3F1] flex items-center justify-center text-[#7FA99B] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#252525]">Concessional Loan Schemes</p>
                    <p className="text-[#68706D]">Up to 35% PMEGP subsidy with 90% bank loan</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={() => setStep(1)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStep(1)}
                className="w-full py-2 text-center text-xs font-semibold text-[#68706D] hover:text-[#252525] active:text-[#252525]"
              >
                Already have an account? <span className="text-[#176B67] underline">Sign in</span>
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 03. LANGUAGE SELECTION                             */}
        {/* -------------------------------------------------- */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between py-2 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252525] font-heading tracking-tight">
                  Choose your language
                </h2>
                <p className="text-xs text-[#68706D] mt-1">
                  Select your preferred language. All metrics and AI advice will adapt.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {LANGUAGES.map((lang) => {
                  const isSelected = language === lang.code;
                  return (
                    <button
                      key={lang.code}
                      onClick={() => onLanguageChange(lang.code)}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-24 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#176B67] bg-[#EDF3F1] shadow-xs ring-1 ring-[#176B67]'
                          : 'border-[#E5E1D8] bg-white hover:border-[#E5E1D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-base font-bold text-[#252525]">{lang.native}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#176B67] flex items-center justify-center text-white">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-[#68706D] font-medium">{lang.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setStep(2)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 04. LOCATION SETUP                                 */}
        {/* -------------------------------------------------- */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-between py-2 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252525] font-heading tracking-tight">
                  Where do you want to start?
                </h2>
                <p className="text-xs text-[#68706D] mt-1">
                  Grambiz AI uses your specific village to calculate demographic catchment and competition.
                </p>
              </div>

              {/* Quick GPS button */}
              <button
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="w-full py-3 px-4 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] font-bold text-xs flex items-center justify-center gap-2 shadow-2xs active:bg-[#E2F0EA] transition-colors cursor-pointer"
              >
                <Navigation className={`w-4 h-4 text-[#176B67] ${isDetectingGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingGps ? 'Accessing GPS...' : 'Use current location'}</span>
              </button>

              {/* Location Card with Form */}
              <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-xs space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    Village / Town
                  </label>
                  <input
                    type="text"
                    value={locData.village}
                    onChange={(e) => setLocData({ ...locData, village: e.target.value })}
                    placeholder="e.g. Valarpuram"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                      Block
                    </label>
                    <input
                      type="text"
                      value={locData.block || ''}
                      onChange={(e) => setLocData({ ...locData, block: e.target.value })}
                      placeholder="e.g. Sriperumbudur"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                      District
                    </label>
                    <input
                      type="text"
                      value={locData.district}
                      onChange={(e) => setLocData({ ...locData, district: e.target.value })}
                      placeholder="e.g. Kanchipuram"
                      className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={locData.state || 'Tamil Nadu'}
                    onChange={(e) => setLocData({ ...locData, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                  />
                </div>

                {/* Small Map Preview Card */}
                <div className="h-24 w-full rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] flex items-center justify-center text-[#68706D] text-xs relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(#93c5fd_1px,transparent_1px)] [background-size:12px_12px] opacity-40" />
                  <div className="relative z-10 flex items-center gap-2 bg-white/90 px-3 py-1.5 rounded-full border border-[#E5E1D8] shadow-xs">
                    <MapPin className="w-3.5 h-3.5 text-[#176B67]" />
                    <span className="font-bold text-[#252525] text-[11px]">
                      {locData.village}, {locData.district}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setStep(3)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 05. USER PROFILE                                   */}
        {/* -------------------------------------------------- */}
        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between py-2 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252525] font-heading tracking-tight">
                  Tell us about yourself
                </h2>
                <p className="text-xs text-[#68706D] mt-1">
                  Helps assess your experience fit and bank borrower profile.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/80 shadow-xs space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-sm font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Beginner', 'Some experience', 'Experienced'].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setProfile({ ...profile, experience: lvl })}
                        className={`py-2 px-2 rounded-xl text-xs font-bold text-center border transition-all ${
                          profile.experience === lvl
                            ? 'bg-[#EDF3F1] border-[#176B67] text-[#176B67]'
                            : 'bg-[#F8F7F2] border-[#E5E1D8] text-[#68706D]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    Key Skills / Background
                  </label>
                  <input
                    type="text"
                    value={profile.skills}
                    onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                    placeholder="e.g. Dairy farming, sewing, vehicle driving"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-medium text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#68706D] uppercase tracking-wider mb-1">
                    Primary Business Interest
                  </label>
                  <input
                    type="text"
                    value={profile.interest}
                    onChange={(e) => setProfile({ ...profile, interest: e.target.value })}
                    placeholder="e.g. Dairy, Retail, Food, Services"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E1D8] text-xs font-medium text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67] bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setStep(4)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 06. AVAILABLE CAPITAL                              */}
        {/* -------------------------------------------------- */}
        {step === 4 && (
          <div className="flex-1 flex flex-col justify-between py-2 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252525] font-heading tracking-tight">
                  How much can you invest?
                </h2>
                <p className="text-xs text-[#68706D] mt-1">
                  Your available own contribution (beneficiary equity).
                </p>
              </div>

              {/* Large Financial Input */}
              <div className="bg-white rounded-2xl p-5 border border-[#E5E1D8]/80 shadow-xs space-y-4">
                <span className="text-[11px] font-bold text-[#68706D] uppercase tracking-wider block">
                  Own Capital Contribution
                </span>
                <div className="flex items-center gap-2 border-b-2 border-[#176B67] pb-2">
                  <span className="text-3xl font-extrabold text-[#252525]">?</span>
                  <input
                    type="number"
                    value={capitalInputStr}
                    onChange={(e) => {
                      setCapitalInputStr(e.target.value);
                      const num = parseInt(e.target.value, 10);
                      if (!isNaN(num)) setCapital(num);
                    }}
                    className="w-full text-3xl font-extrabold text-[#252525] focus:outline-none bg-transparent"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {[25000, 50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setCapital(amt);
                        setCapitalInputStr(amt.toString());
                      }}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                        capital === amt
                          ? 'bg-[#EDF3F1] border-[#176B67] text-[#176B67]'
                          : 'bg-[#F8F7F2] border-[#E5E1D8] text-[#68706D]'
                      }`}
                    >
                      ?{(amt / 1000).toLocaleString('en-IN')}k
                    </button>
                  ))}
                </div>
              </div>

              {/* Informational Card */}
              <div className="bg-[#FFFBEB] border border-rose-400/40 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-[#9A5B02] text-xs font-bold">
                  <TrendingUp className="w-4 h-4" />
                  <span>Scheme Loan Leverage</span>
                </div>
                <p className="text-xs text-[#252525] leading-relaxed">
                  Under official schemes like PMEGP, your self-contribution (10%) unlocks a <strong>90% bank loan</strong> (?{(capital * 9).toLocaleString('en-IN')}) for an estimated project size of <strong>?{(capital * 10).toLocaleString('en-IN')}</strong>.
                </p>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={() => setStep(5)}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* 07. BUSINESS GOAL                                  */}
        {/* -------------------------------------------------- */}
        {step === 5 && (
          <div className="flex-1 flex flex-col justify-between py-2 animate-in fade-in duration-300">
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#252525] font-heading tracking-tight">
                  What do you want to do?
                </h2>
                <p className="text-xs text-[#68706D] mt-1">
                  Choose your starting pathway for Grambiz AI analysis.
                </p>
              </div>

              {/* 3 Large Selection Cards with Simple Outline Icons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setGoal('have_idea')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    goal === 'have_idea'
                      ? 'border-[#176B67] bg-[#EDF3F1] shadow-xs ring-1 ring-[#176B67]'
                      : 'border-[#E5E1D8] bg-white hover:border-[#E5E1D8]'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    goal === 'have_idea' ? 'bg-[#176B67] text-white' : 'bg-[#EDF3F1] text-[#252525]'
                  }`}>
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#252525]">1. I have a business idea</p>
                    <p className="text-xs text-[#68706D] mt-0.5">
                      Analyze feasibility, market reach, competitors, and loan eligibility for my specific idea.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGoal('suggest_business')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    goal === 'suggest_business'
                      ? 'border-[#176B67] bg-[#EDF3F1] shadow-xs ring-1 ring-[#176B67]'
                      : 'border-[#E5E1D8] bg-white hover:border-[#E5E1D8]'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    goal === 'suggest_business' ? 'bg-[#176B67] text-white' : 'bg-[#EDF3F1] text-[#252525]'
                  }`}>
                    <Compass className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#252525]">2. Suggest a business for me</p>
                    <p className="text-xs text-[#68706D] mt-0.5">
                      Discover viable, top-ranked business opportunities tailored to my village and capital.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setGoal('improve_existing')}
                  className={`w-full p-4 rounded-2xl border text-left flex items-start gap-4 transition-all cursor-pointer ${
                    goal === 'improve_existing'
                      ? 'border-[#176B67] bg-[#EDF3F1] shadow-xs ring-1 ring-[#176B67]'
                      : 'border-[#E5E1D8] bg-white hover:border-[#E5E1D8]'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    goal === 'improve_existing' ? 'bg-[#176B67] text-white' : 'bg-[#EDF3F1] text-[#252525]'
                  }`}>
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#252525]">3. Improve my existing business</p>
                    <p className="text-xs text-[#68706D] mt-0.5">
                      Assess margins, local expansion opportunities, and working capital subsidies for my venture.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleFinish}
                className="w-full py-3.5 px-6 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] active:bg-[#093627] text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>Complete Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
