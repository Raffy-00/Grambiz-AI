import React, { useState, useEffect } from 'react';
import {
  User, Globe, MapPin, FileText, Bookmark, Bell,
  HelpCircle, Info, ChevronRight, Check, X, ShieldCheck,
  RefreshCw, Smartphone, Navigation
} from 'lucide-react';
import { Language, LocationData, FullAssessment } from '../../types';
import { TRANSLATIONS } from '../../i18n/translations';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentLocation: LocationData;
  onUpdateLocation: (loc: LocationData) => void;
  onSelectSavedAssessment: (assessment: FullAssessment) => void;
  onOpenCalculator?: () => void;
  onOpenSchemes?: () => void;
  onOpenReports?: () => void;
}

const LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'te', name: 'Telugu', native: 'తెలు��"ు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളம்' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
];

export const MobileProfileView: React.FC<Props> = ({
  language,
  onLanguageChange,
  currentLocation,
  onUpdateLocation,
  onSelectSavedAssessment,
  onOpenReports,
}) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS.en;

  // Profile data state
  const [profile, setProfile] = useState<{
    name: string;
    experience: string;
    skills: string;
    interest: string;
  }>({
    name: 'Entrepreneur',
    experience: 'Beginner (0-2 years)',
    skills: 'Retail & Customer Management',
    interest: 'Dairy & Food Processing',
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('grambiz_user_profile');
      if (saved) {
        setProfile((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {}
  }, []);

  // Modals
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

  // Location edit fields
  const [editVillage, setEditVillage] = useState<string>(currentLocation.village || '');
  const [editBlock, setEditBlock] = useState<string>(currentLocation.block || '');
  const [editDistrict, setEditDistrict] = useState<string>(currentLocation.district || '');
  const [editState, setEditState] = useState<string>(currentLocation.state || 'Tamil Nadu');

  // Notifications toggle
  const [notifications, setNotifications] = useState<boolean>(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveLocation = () => {
    onUpdateLocation({
      ...currentLocation,
      village: editVillage,
      block: editBlock,
      district: editDistrict,
      state: editState,
    });
    setShowLocationModal(false);
    showToast('Location updated successfully.');
  };

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-150">
      {/* Toast */}
      {toastMsg && (
        <div className="bg-[#EDF3F1] border border-[#E5E1D8] text-[#252525] p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 stroke-[3] text-[#0F4E4B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP USER PROFILE CARD */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs space-y-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#176B67] to-[#0F4E4B] text-white flex items-center justify-center font-extrabold text-base shadow-xs font-heading">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-base font-extrabold text-[#252525] font-heading">
              {profile.name}
            </h1>
            <div className="text-xs text-[#68706D] font-medium">
              {profile.interest}
            </div>
          </div>
        </div>

        {/* 2 Details Pill Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
          <div className="bg-[#F8F7F2] p-2.5 rounded-xl border border-[#E5E1D8]">
            <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Experience</span>
            <span className="font-bold text-[#252525]">{profile.experience}</span>
          </div>
          <div className="bg-[#F8F7F2] p-2.5 rounded-xl border border-[#E5E1D8]">
            <span className="text-[10px] uppercase font-bold text-[#7FA99B] block">Language</span>
            <span className="font-bold text-[#0F4E4B] uppercase">{language} • {LANGUAGES.find(l => l.code === language)?.native}</span>
          </div>
        </div>
      </div>

      {/* 2. MENU LIST (Exact specified options from prompt) */}
      <div className="bg-white rounded-2xl border border-[#E5E1D8] shadow-xs divide-y divide-slate-100 overflow-hidden">
        {/* My Reports */}
        <button
          onClick={onOpenReports}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F7F2] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] text-[#0F4E4B] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">My Reports</div>
              <div className="text-[10px] text-[#68706D]">View generated feasibility assessments</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7FA99B]" />
        </button>

        {/* Saved Plans */}
        <button
          onClick={onOpenReports}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F7F2] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] text-[#176B67] flex items-center justify-center">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Saved Plans</div>
              <div className="text-[10px] text-[#68706D]">Bookmarked 6-step business plans</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7FA99B]" />
        </button>

        {/* Language */}
        <button
          onClick={() => setShowLanguageModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F7F2] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Language</div>
              <div className="text-[10px] text-[#68706D]">
                {LANGUAGES.find((l) => l.code === language)?.name} ({LANGUAGES.find((l) => l.code === language)?.native})
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7FA99B]" />
        </button>


        {/* Notifications */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] text-[#252525] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A]">Notifications</div>
              <div className="text-[10px] text-[#68706D]">Scheme updates and market alerts</div>
            </div>
          </div>
          <button
            onClick={() => {
              setNotifications(!notifications);
              showToast(notifications ? 'Notifications disabled' : 'Notifications enabled');
            }}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              notifications ? 'bg-[#176B67]' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                notifications ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Help & Support */}
        <button
          onClick={() => setShowHelpModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F7F2] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] text-[#252525] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#252525]">Help & Support</div>
              <div className="text-[10px] text-[#68706D]">Bank guidance & technical assistance</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7FA99B]" />
        </button>

        {/* About Grambiz AI */}
        <button
          onClick={() => setShowAboutModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-[#F8F7F2] transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] text-[#0F4E4B] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#252525]">About Grambiz AI</div>
              <div className="text-[10px] text-[#68706D]">Version 2.4.0 • Rural Intelligence</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7FA99B]" />
        </button>
      </div>

      {/* 3. MODALS */}

      {/* Language Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/40 backdrop-blur-xs flex items-end justify-center p-0 max-w-md mx-auto animate-in fade-in duration-150">
          <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom border-t border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#0F4E4B]" />
                <h3 className="text-sm font-bold text-[#252525] font-heading">
                  Select Application Language
                </h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D] hover:text-[#252525]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setShowLanguageModal(false);
                      showToast(`Language switched to ${lang.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-rose-700 bg-[#EDF3F1]/80 text-[#252525] font-bold shadow-xs'
                        : 'border-[#E5E1D8] bg-white text-[#252525] hover:border-[#E5E1D8]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold">{lang.native}</div>
                      <div className="text-[10px] text-[#68706D]">{lang.name}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#176B67] text-white flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/40 backdrop-blur-xs flex items-end justify-center p-0 max-w-md mx-auto animate-in fade-in duration-150">
          <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom border-t border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#0F4E4B]" />
                <h3 className="text-sm font-bold text-[#252525] font-heading">
                  Update Operating Location
                </h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D] hover:text-[#252525]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">Village / Town</label>
                <input
                  type="text"
                  value={editVillage}
                  onChange={(e) => setEditVillage(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">Block / Taluk</label>
                <input
                  type="text"
                  value={editBlock}
                  onChange={(e) => setEditBlock(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">District</label>
                <input
                  type="text"
                  value={editDistrict}
                  onChange={(e) => setEditDistrict(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">State</label>
                <input
                  type="text"
                  value={editState}
                  onChange={(e) => setEditState(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E5E1D8] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <button
                onClick={handleSaveLocation}
                className="w-full py-3 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
              >
                Save Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/40 backdrop-blur-xs flex items-center justify-center p-4 max-w-md mx-auto animate-in fade-in duration-150">
          <div className="w-full bg-white rounded-2xl p-5 space-y-4 shadow-2xl border border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <h3 className="text-sm font-bold text-[#252525] font-heading">
                Help & Entrepreneur Support
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#68706D] leading-relaxed">
              <p>
                Grambiz AI helps rural and semi-urban entrepreneurs prepare bank-ready feasibility dossiers and access government schemes like PMEGP and MUDRA.
              </p>
              <div className="bg-[#F8F7F2] p-3 rounded-xl border border-[#E5E1D8] space-y-1">
                <div className="font-bold text-[#252525]">Direct Helpline:</div>
                <div className="text-[#68706D]">1800-180-6763 (KVIC / PMEGP Toll-Free)</div>
                <div className="text-[#68706D]">support@grambiz.ai</div>
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {showAboutModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/40 backdrop-blur-xs flex items-center justify-center p-4 max-w-md mx-auto animate-in fade-in duration-150">
          <div className="w-full bg-white rounded-2xl p-5 space-y-4 shadow-2xl border border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <h3 className="text-sm font-bold text-[#252525] font-heading">
                About Grambiz AI
              </h3>
              <button
                onClick={() => setShowAboutModal(false)}
                className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-[#68706D] leading-relaxed">
              <p>
                <strong>Grambiz AI</strong> is a multilingual AI-powered business advisory platform for rural and semi-urban entrepreneurs.
              </p>
              <div className="bg-[#F8F7F2] p-3 rounded-xl border border-[#E5E1D8] space-y-1 text-[11px]">
                <div> •  Version: 2.4.0 Production Build</div>
                <div> •  Advisory Engine: Groq High-Speed LLM</div>
                <div> •  Languages: English, தமிழ், हिंदी, తెలుగు, മലയാളം, ಕನ್ನಡ</div>
                <div> •  Government Schemes: PMEGP, MUDRA, NABARD, Stand-Up India</div>
              </div>
            </div>
            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2.5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
