import React, { useState } from 'react';
import { Settings, Globe, MapPin, Database, CheckCircle2, ArrowLeft, Trash2, Sparkles, Smartphone, ShieldCheck } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../i18n/translations';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onBackToDashboard: () => void;
}

export const SettingsPage: React.FC<Props> = ({
  language,
  onLanguageChange,
  onBackToDashboard,
}) => {
  const t = TRANSLATIONS[language];
  const [defaultState, setDefaultState] = useState<string>('Tamil Nadu');
  const [defaultDistrict, setDefaultDistrict] = useState<string>('Kanchipuram');
  const [savedMsg, setSavedMsg] = useState<boolean>(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm("Are you sure you want to clear saved local assessments?")) {
      localStorage.removeItem('grambiz_saved_assessments');
      alert("Local assessment cache cleared successfully.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 min-h-screen">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#68706D] font-semibold mb-1">
            <button onClick={onBackToDashboard} className="hover:text-brand-navy flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
            <span>/</span>
            <span className="text-brand-navy font-bold">Preferences</span>
          </div>
          <h1 className="text-2xl font-extrabold text-brand-navy font-heading flex items-center gap-2">
            <Settings className="w-6 h-6 text-brand-teal" />
            System & User Settings
          </h1>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-[#EDF3F1] border border-[#A8CCC4] text-[#176B67] p-4 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#7FA99B]" />
          <span>Preferences updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Android Application Information */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-navy text-sm font-heading flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-brand-teal" />
              Application Environment
            </h3>
            <span className="text-[10px] bg-[#EDF3F1] text-[#176B67] font-bold px-2.5 py-0.5 rounded-full border border-[#A8CCC4] flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#7FA99B]" />
              Native Android App
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#68706D] font-medium">Application Name</span>
              <span className="font-bold text-[#252525]">GramBiz AI</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#68706D] font-medium">Package Identifier</span>
              <span className="font-mono text-[11px] font-semibold text-[#176B67] bg-emerald-100/60 px-2 py-0.5 rounded">com.grambiz.ai</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#68706D] font-medium">Version</span>
              <span className="font-semibold text-[#252525]">v1.0.0 (Production Android Edition)</span>
            </div>
          </div>
        </div>

        {/* Language Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-brand-navy text-sm font-heading flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-teal" />
              Language & Localization (6 Regional Languages)
            </h3>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-full border border-teal-200">
              Live Real-Time Switching
            </span>
          </div>

          {/* Mandate Note Alert Box */}
          <div className="bg-gradient-to-r from-teal-50/80 to-emerald-50/80 border border-teal-200 p-3.5 rounded-xl flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950 font-medium leading-relaxed">
              <span className="font-bold text-teal-900 block mb-0.5">Core Application Principle:</span>
              “Language selection must affect both the static UI and dynamically generated AI content throughout the application.”
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {[
              { id: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
              { id: 'ta', label: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
              { id: 'hi', label: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
              { id: 'te', label: 'Telugu', native: 'తెలు- – ు', flag: '🇮🇳' },
              { id: 'ml', label: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
              { id: 'kn', label: 'Kannada', native: '-•ನ್ನಡ', flag: '🇮🇳' },
              { id: 'mr', label: 'Marathi', native: 'मरा- ी', flag: '🇮🇳' },
            ].map((lang) => (
              <button
                key={lang.id}
                id={`settings-lang-${lang.id}`}
                type="button"
                onClick={() => onLanguageChange(lang.id as Language)}
                className={`p-3.5 rounded-xl border font-bold flex items-center justify-between transition-all cursor-pointer ${
                  language === lang.id
                    ? 'bg-brand-navy text-white border-brand-navy shadow-md scale-[1.02]'
                    : 'bg-[#F8F7F2] text-[#252525] border-[#E5E1D8] hover:bg-[#EDF3F1] hover:border-[#E5E1D8]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-extrabold text-sm">{lang.native}</div>
                    <div className={`text-[10px] ${language === lang.id ? 'text-teal-200' : 'text-[#7FA99B]'}`}>{lang.label}</div>
                  </div>
                </div>
                {language === lang.id && <CheckCircle2 className="w-4 h-4 text-brand-teal shrink-0" />}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-[#7FA99B] italic">
            * Selected language is automatically saved in your browser session and applied across all advisory screens, financial calculators, reports, and AI responses.
          </p>
        </div>

        {/* Regional Defaults */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
          <h3 className="font-bold text-brand-navy text-sm font-heading flex items-center gap-2">
            <MapPin className="w-4 h-4 text-brand-teal" />
            Default Regional Boundaries
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#252525] font-semibold mb-1">Default State</label>
              <input
                type="text"
                value={defaultState}
                onChange={(e) => setDefaultState(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E1D8] font-semibold text-[#252525]"
              />
            </div>

            <div>
              <label className="block text-[#252525] font-semibold mb-1">Default Home District</label>
              <input
                type="text"
                value={defaultDistrict}
                onChange={(e) => setDefaultDistrict(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#E5E1D8] font-semibold text-[#252525]"
              />
            </div>
          </div>
        </div>

        {/* Data & Cache Management */}
        <div className="bg-white p-6 rounded-2xl border border-[#E5E1D8] shadow-xs space-y-4">
          <h3 className="font-bold text-brand-navy text-sm font-heading flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-teal" />
            Data Storage & Cache Management
          </h3>

          <div className="flex items-center justify-between p-4 bg-[#F8F7F2] rounded-xl border border-[#E5E1D8] text-xs">
            <div>
              <h4 className="font-bold text-brand-navy">Clear Saved Local Assessment Cache</h4>
              <p className="text-[#68706D] text-[11px]">Resets locally cached reports stored in browser memory.</p>
            </div>

            <button
              type="button"
              onClick={handleClearCache}
              className="bg-[#EDF3F1] hover:bg-[#EDF3F1] text-[#0F4E4B] border border-[#E5E1D8] font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-brand-teal hover:bg-brand-teal-hover text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all border border-teal-400/30"
          >
            Save Preferences
          </button>
        </div>

      </form>

    </div>
  );
};
