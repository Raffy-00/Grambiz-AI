import React, { useState, useEffect } from 'react';
import {
  Compass, FileText, ArrowRight, Calculator,
  ShieldCheck, Landmark, MapPin,
  BookOpen, ChevronRight, TrendingUp
} from 'lucide-react';
import { Language, LocationData, FullAssessment, DemoScenario, UserDraftData } from '../../types';
import { UserProfile } from '../../services/useCrossPlatformSync';
import { WORKFLOW_TRANSLATIONS } from '../../i18n/workflowTranslations';

interface Props {
  language: Language;
  currentUser?: UserProfile | null;
  currentLocation: LocationData;
  onStartAnalysis: (initialCapital?: number, initialCategory?: string) => void;
  onOpenCalculator: () => void;
  onOpenSchemes: () => void;
  onOpenReports: () => void;
  onSelectScenario?: (scenario: DemoScenario) => void;
  currentAssessment: FullAssessment | null;
  onChangeLocation: () => void;
  activeDraft?: UserDraftData | null;
}

export const MobileDashboard: React.FC<Props> = ({
  language,
  currentUser,
  currentLocation,
  onStartAnalysis,
  onOpenCalculator,
  onOpenSchemes,
  onOpenReports,
  currentAssessment,
  onChangeLocation,
  activeDraft,
}) => {
  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;
  const [userName, setUserName] = useState<string>(currentUser?.name || 'Entrepreneur');

  useEffect(() => {
    if (currentUser?.name) {
      setUserName(currentUser.name);
    } else {
      try {
        const authUser = localStorage.getItem('grambiz_auth_user');
        if (authUser) {
          const parsed = JSON.parse(authUser);
          if (parsed.name) setUserName(parsed.name);
        }
      } catch (e) {}
    }
  }, [currentUser]);

  const hour = new Date().getHours();
  const greeting = hour < 12
    ? t.dash_greeting_morning
    : hour < 17
    ? t.dash_greeting_afternoon
    : t.dash_greeting_evening;

  return (
    <div className="space-y-4 pb-8 font-sans text-[#252525]">

      {/* 1. GREETING CARD */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8]/90 shadow-xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#176B67] to-[#0F4E4B] text-white flex items-center justify-center font-black text-base shadow-sm shrink-0 font-heading">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#7FA99B] uppercase tracking-wider block leading-tight">
                {greeting} 👋
              </span>
              <h2 className="text-base font-extrabold text-[#252525] font-heading leading-tight truncate">
                {userName}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#EDF3F1] border border-[#A8CCC4] rounded-full text-[11px] font-bold text-[#176B67] shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#7FA99B] shrink-0" />
            <span>{t.dash_verified_badge}</span>
          </div>
        </div>

        {/* Location pill */}
        {currentLocation?.village && (
          <button
            onClick={onChangeLocation}
            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl text-[11px] text-[#68706D] font-medium active:scale-95 transition-all w-full"
          >
            <MapPin className="w-3 h-3 text-[#176B67] shrink-0" />
            <span className="truncate">{currentLocation.village}, {currentLocation.district}</span>
            <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-[#A0A0A0]" />
          </button>
        )}
      </div>

      {/* 2. HERO CTA CARD */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#176B67]/30">
        <div className="absolute inset-0 bg-gradient-to-br from-[#176B67] via-[#1E827C] to-[#125551]" />
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-emerald-400/25 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-teal-300/20 blur-2xl pointer-events-none" />
        <div
          className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />
        <div className="relative z-10 p-5 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-xl font-black font-heading text-white leading-tight tracking-tight drop-shadow-xs">
              {t.dash_hero_title_line1}<br />
              <span className="text-[#A7F3D0] drop-shadow-xs">{t.dash_hero_title_line2}</span>
            </h3>
            <p className="text-[12px] text-emerald-50/90 leading-relaxed font-medium">
              {t.dash_hero_subtitle}
            </p>
          </div>
          <button
            onClick={() => onStartAnalysis(100000, 'Dairy')}
            className="w-full min-h-[48px] py-3.5 px-4 rounded-2xl bg-white hover:bg-[#F4FAF8] active:scale-[0.98] text-[#176B67] font-black text-sm flex items-center justify-between shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#EDF3F1] flex items-center justify-center">
                <Compass className="w-4 h-4 text-[#176B67]" />
              </div>
              <span className="font-heading text-sm">{t.dash_launch_wizard_btn}</span>
            </div>
            <div className="w-8 h-8 rounded-xl bg-[#176B67] flex items-center justify-center group-hover:bg-[#0F4E4B] transition-colors shadow-xs">
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. RESUME DRAFT CARD (Strictly isolated to current logged-in account) */}
      {currentUser?.user_id &&
        activeDraft &&
        activeDraft.user_id === currentUser.user_id &&
        activeDraft.current_step &&
        activeDraft.current_step > 1 && (
        <button
          onClick={() => onStartAnalysis()}
          className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className="text-xs font-black text-amber-800 font-heading">{t.dash_resume_draft}</div>
            <div className="text-[11px] text-amber-600 font-medium">
              {t.dash_resume_draft_sub || 'Continue your saved enterprise assessment'}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-500 shrink-0" />
        </button>
      )}

      {/* 4. QUICK ACCESS TOOLS */}
      <div className="pt-1">
        <div className="flex items-center justify-between px-1 mb-2">
          <span className="text-[11px] font-black text-[#252525] uppercase tracking-widest font-mono">
            {t.dash_quick_tools}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {[
            { icon: Calculator, label: t.dash_emi_label, sub: t.dash_emi_sub, color: 'bg-emerald-50/70 border-emerald-100 hover:border-emerald-300', iconColor: 'text-[#176B67] bg-[#EDF3F1]', fn: onOpenCalculator },
            { icon: Landmark, label: t.dash_schemes_label, sub: t.dash_schemes_sub, color: 'bg-[#EDF3F1]/80 border-[#A8CCC4] hover:border-[#176B67]', iconColor: 'text-[#176B67] bg-white', fn: onOpenSchemes },
            { icon: FileText, label: t.dash_dpr_label, sub: t.dash_dpr_sub, color: 'bg-teal-50/60 border-teal-100 hover:border-teal-300', iconColor: 'text-teal-700 bg-teal-100/60', fn: onOpenReports },
          ].map((item) => (
            <button key={item.label} onClick={item.fn}
              className={`${item.color} border p-2 sm:p-3 rounded-2xl shadow-2xs flex flex-col items-center text-center justify-center space-y-1.5 active:scale-95 transition-all min-h-[96px] cursor-pointer`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconColor} shadow-2xs`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#252525] font-heading leading-tight truncate w-full px-0.5">{item.label}</span>
              <span className="text-[9.5px] sm:text-[10px] text-[#7FA99B] font-medium leading-none truncate w-full">{item.sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. INSIGHT STRIP */}
      <div className="bg-gradient-to-r from-[#0F2E2B] to-[#176B67] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <TrendingUp className="w-4 h-4 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-black text-white font-heading">{t.dash_insight_title}</div>
          <div className="text-[10px] text-emerald-300/80 font-medium truncate">
            {currentLocation?.district || ''}
          </div>
        </div>
      </div>

    </div>
  );
};
