import React, { useState, useEffect, useRef } from 'react';
import {
  Home, PlusCircle, Award, History, User,
  Menu, X, Globe, MapPin, Calculator, Settings,
  LogOut, ArrowLeft, Check, ChevronRight, Sparkles,
  Landmark, ShieldAlert, Cloud, Compass,
  FileText, Bot, Wifi, Battery, Signal, Smartphone,
  ExternalLink, Copy, CheckCircle2, RefreshCw
} from 'lucide-react';
import { Language, LocationData } from '../../types';
import { WORKFLOW_TRANSLATIONS } from '../../i18n/workflowTranslations';

export type NavigationTarget =
  | 'home'
  | 'analyze'
  | 'calculator'
  | 'reports'
  | 'previous'
  | 'profile'
  | 'language'
  | 'settings';

interface Props {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeTab: 'home' | 'analyze' | 'advisor' | 'reports' | 'profile';
  setActiveTab: (tab: 'home' | 'analyze' | 'advisor' | 'reports' | 'profile') => void;
  onNavigate?: (target: NavigationTarget) => void;
  currentLocation: LocationData;
  onChangeLocation: () => void;
  hasAssessment: boolean;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onLogout?: () => void;
  displayMode?: 'web' | 'app';
  onSetDisplayMode?: (mode: 'web' | 'app') => void;
  onTogglePlatform?: () => void;
  syncStatus?: string;
  screenTitle?: string;
  onRefresh?: () => Promise<void> | void;
  children: React.ReactNode;
}

const SUPPORTED_LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English',    native: 'English' },
  { code: 'ta', name: 'Tamil',      native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi',      native: 'हिंदी' },
  { code: 'te', name: 'Telugu',     native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam',  native: 'മലയാളം' },
  { code: 'kn', name: 'Kannada',    native: 'ಕನ್ನಡ' },
  { code: 'mr', name: 'Marathi',    native: 'मराठी' },
];

export const MobileAppShell: React.FC<Props> = ({
  language,
  onLanguageChange,
  activeTab,
  setActiveTab,
  onNavigate,
  currentLocation,
  onChangeLocation,
  hasAssessment,
  canGoBack = false,
  onGoBack,
  onLogout,
  displayMode = 'app',
  onSetDisplayMode,
  onTogglePlatform,
  syncStatus = 'synced',
  screenTitle,
  onRefresh,
  children,
}) => {
  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [showLanguageSheet, setShowLanguageSheet] = useState<boolean>(false);
  const [showRealPhoneModal, setShowRealPhoneModal] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);

  // Live status bar clock (e.g. 09:41)
  const [currentTime, setCurrentTime] = useState<string>('09:41');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  // Retrieve user name from local storage
  let userName = 'Entrepreneur';
  try {
    const authData = localStorage.getItem('grambiz_auth_user');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.name) userName = parsed.name;
    }
  } catch (e) {}

  const handleDrawerNavigate = (target: NavigationTarget) => {
    setIsDrawerOpen(false);
    if (target === 'language') {
      setShowLanguageSheet(true);
      return;
    }
    if (onNavigate) {
      onNavigate(target);
    } else {
      if (target === 'home') setActiveTab('home');
      else if (target === 'analyze') setActiveTab('analyze');
      else if (target === 'reports' || target === 'previous') setActiveTab('reports');
      else if (target === 'profile' || target === 'settings') setActiveTab('profile');
    }
  };

  const localNetworkUrl = 'http://10.123.29.80:3000';

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(localNetworkUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {}
  };

  // Determine current screen title
  const getDisplayTitle = () => {
    if (screenTitle) return screenTitle;
    switch (activeTab) {
      case 'home':
        return t.app_name || 'GramBiz AI';
      case 'analyze':
        return 'Feasibility Analysis';
      case 'advisor':
        return 'AI Rural Advisor';
      case 'reports':
        return 'Saved Reports';
      case 'profile':
        return 'My Profile';
      default:
        return t.app_name || 'GramBiz AI';
    }
  };

  // --------------------------------------------------------------------------
  // App-Like Gesture Support: Swipe-Back & Pull-To-Refresh
  // --------------------------------------------------------------------------
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [pullDistance, setPullDistance] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartX(e.touches[0].clientX);
      setTouchStartY(e.touches[0].clientY);
      if (mainScrollRef.current && mainScrollRef.current.scrollTop <= 0) {
        setIsPulling(true);
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling || isRefreshing || touchStartY === null) return;
    if (mainScrollRef.current && mainScrollRef.current.scrollTop <= 0) {
      const currentY = e.touches[0].clientY;
      const diff = currentY - touchStartY;
      if (diff > 0) {
        // Apply resistance curve
        setPullDistance(Math.min(diff * 0.4, 75));
      }
    }
  };

  const handleTouchEnd = async (e: React.TouchEvent) => {
    // Swipe-back gesture detection (touch starting on left 50px edge, dragging right > 60px)
    if (touchStartX !== null && touchStartY !== null && e.changedTouches.length > 0) {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);

      if (touchStartX < 50 && deltaX > 60 && deltaX > deltaY * 1.8) {
        if (canGoBack && onGoBack) {
          onGoBack();
        }
      }
    }

    // Pull to refresh execution
    if (pullDistance > 45 && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(50);
      try {
        if (onRefresh) {
          await onRefresh();
        } else {
          await new Promise((r) => setTimeout(r, 750));
        }
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setIsPulling(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };


  return (
    <div className="min-h-screen bg-[#EDF3F1] sm:bg-[#D4E8E5]/60 flex flex-col items-center justify-center sm:py-3 sm:px-4 text-[#15241E] font-sans antialiased selection:bg-[#176B67] selection:text-white">
      {/* MOBILE APP CONTAINER */}
      <div className="w-full sm:max-w-[440px] h-screen sm:h-[94vh] bg-[#F4FAF8] sm:rounded-3xl sm:shadow-2xl sm:border border-[#A8CCC4]/60 flex flex-col relative shrink-0 overflow-hidden">
        {/* INNER SCREEN CONTAINER */}
        <div className="w-full h-full bg-[#F4FAF8] flex flex-col overflow-hidden relative">
          
          {/* TOP APPLICATION APP BAR */}
          <header className="bg-[#176B67] backdrop-blur-md border-b border-[#0F4E4B]/30 px-3.5 py-2.5 text-white shrink-0 z-20 shadow-sm pt-[max(env(safe-area-inset-top),10px)]">
            <div className="flex items-center justify-between gap-2.5 min-h-[38px]">
              
              {/* Left Title / Back Chevron */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {canGoBack && onGoBack ? (
                  <button
                    onClick={onGoBack}
                    className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white active:scale-95 transition-all border border-white/20 flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                    aria-label="Go Back"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 tracking-tight border border-white/20 font-heading">
                    GB
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base font-extrabold text-white font-heading tracking-tight truncate leading-none">
                    {getDisplayTitle()}
                  </h1>
                </div>
              </div>

              {/* Right Action Area */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Language Switcher */}
                <button
                  onClick={() => setShowLanguageSheet(true)}
                  className="h-8 px-2.5 bg-white/20 hover:bg-white/30 border border-white/20 text-white rounded-xl text-[11px] font-bold active:scale-95 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Change Language"
                >
                  <Globe className="w-3.5 h-3.5 text-white/80 shrink-0" />
                  <span className="uppercase font-mono tracking-wider">{language}</span>
                </button>

                {/* Hamburger Drawer Menu */}
                <button
                  onClick={() => setIsDrawerOpen(true)}
                  className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 active:scale-95 transition-all flex items-center justify-center shrink-0 shadow-2xs cursor-pointer"
                  aria-label="Navigation Menu"
                >
                  <Menu className="w-4 h-4 stroke-[2.25]" />
                </button>
              </div>
            </div>
          </header>

          {/* C. MAIN MOBILE APP SCROLLABLE VIEWPORT */}
          <main
            ref={mainScrollRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="flex-1 overflow-y-auto px-3.5 pt-3 pb-8 min-w-0 bg-[#F4FAF8] momentum-scroll overscroll-contain relative transition-all"
          >
            {/* Pull to refresh visual feedback indicator */}
            {pullDistance > 0 && (
              <div
                style={{ height: `${pullDistance}px` }}
                className="flex items-center justify-center overflow-hidden transition-all text-xs font-bold text-[#176B67] bg-[#EDF3F1] rounded-xl mb-2 border border-[#E5E1D8]"
              >
                <RefreshCw className={`w-4 h-4 mr-1.5 text-[#176B67] ${isRefreshing || pullDistance > 45 ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing data...' : pullDistance > 45 ? 'Release to refresh' : 'Pull down to refresh'}</span>
              </div>
            )}

            {/* Page transition container */}
            <div key={`${activeTab}-${screenTitle || 'main'}`} className="page-slide-enter">
              {children}
            </div>
          </main>

          {/* D. NATIVE FIXED BOTTOM TAB BAR (Clean Modern Minimalist High-Contrast Active States) */}
          <nav className="bg-white border-t border-[#D4E8E5] px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom),6px)] z-30 shrink-0 select-none shadow-[0_-2px_12px_rgba(23,107,103,0.08)]">
            <div className="grid grid-cols-5 gap-1 items-center">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'analyze', label: 'Analyze', icon: PlusCircle, highlight: true },
                { id: 'advisor', label: 'Advisor', icon: Bot },
                { id: 'reports', label: 'Reports', icon: FileText },
                { id: 'profile', label: 'Profile', icon: User },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-1 rounded-xl transition-all tap-highlight-none active:scale-95 cursor-pointer ${
                      isActive ? 'text-[#176B67]' : 'text-[#7FA99B] hover:text-[#176B67]'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                        isActive
                          ? 'bg-[#176B67] text-white shadow-xs scale-105'
                          : tab.highlight
                          ? 'bg-[#EDF3F1] text-[#176B67] border border-[#A8CCC4]'
                          : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10.5px] leading-none mt-1.5 tracking-tight whitespace-nowrap ${isActive ? 'font-black text-[#176B67] font-heading' : 'font-medium text-[#7FA99B]'}`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="w-20 h-1 bg-[#D4E8E5] rounded-full mx-auto mt-2 mb-0.5"></div>
          </nav>

          {/* ------------------------------------------------------------- */}
          {/* 3. SLIDE-OUT NAVIGATION DRAWER (Scoped inside App Shell) */}
          {/* ------------------------------------------------------------- */}
          {isDrawerOpen && (
            <div className="absolute inset-0 z-50 flex justify-end bg-[#0F4E4B]/60 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="w-[82%] max-w-[320px] bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#D4E8E5] animate-in slide-in-from-right duration-250">
                <div>
                  <div className="p-4 border-b border-[#D4E8E5] flex items-center justify-between bg-[#176B67] text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center font-black text-xs shadow-xs border border-white/20 font-heading">
                        GB
                      </div>
                      <div>
                        <span className="font-extrabold text-sm block text-white font-heading">GramBiz Navigation</span>
                        <span className="text-[10px] text-white/70">{userName}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsDrawerOpen(false)}
                      className="p-1.5 rounded-lg bg-white/20 border border-white/20 text-white active:scale-95 cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 space-y-1">
                    <button
                      onClick={() => handleDrawerNavigate('home')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#252525] hover:bg-[#EDF3F1] active:scale-98 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Home className="w-4 h-4 text-[#176B67]" />
                        <span>{t.nav_home}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B]" />
                    </button>

                    <button
                      onClick={() => handleDrawerNavigate('analyze')}
                      className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold bg-[#176B67] text-white shadow-xs hover:bg-[#0F4E4B] active:scale-98 cursor-pointer font-heading"
                    >
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-emerald-300" />
                        <span>Individual Steps</span>
                      </div>
                      <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">
                        10 Steps
                      </span>
                    </button>

                    <button
                      onClick={() => handleDrawerNavigate('reports')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#252525] hover:bg-[#EDF3F1] active:scale-98 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-[#176B67]" />
                        <span>{t.nav_saved_reports}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B]" />
                    </button>

                    <button
                      onClick={() => handleDrawerNavigate('calculator')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#252525] hover:bg-[#EDF3F1] active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <Calculator className="w-4 h-4 text-[#176B67]" />
                        <span>{t.nav_financial_planner}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B]" />
                    </button>

                    <button
                      onClick={() => handleDrawerNavigate('profile')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#252525] hover:bg-[#EDF3F1] active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-[#176B67]" />
                        <span>{t.nav_profile}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B]" />
                    </button>

                    <button
                      onClick={() => handleDrawerNavigate('settings')}
                      className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-[#252525] hover:bg-[#EDF3F1] active:scale-98"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="w-4 h-4 text-[#176B67]" />
                        <span>{t.nav_settings}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#7FA99B]" />
                    </button>
                  </div>
                </div>

                <div className="p-4 border-t border-[#D4E8E5] bg-[#EDF3F1]">
                  {onLogout && (
                    <button
                      onClick={() => { setIsDrawerOpen(false); onLogout(); }}
                      className="w-full flex items-center gap-2.5 text-xs font-bold text-[#176B67] hover:text-[#0F4E4B] py-2 active:scale-98"
                    >
                      <LogOut className="w-4 h-4 text-[#176B67]" />
                      <span>{t.nav_sign_out}</span>
                    </button>
                  )}
                  <p className="text-[10px] text-[#7FA99B] mt-1 font-mono">
                    GramBiz Unified v2.4 · Sync: {syncStatus}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 4. REAL SMARTPHONE BOTTOM SHEET / MODAL (LAN URL & QR) */}
          {/* ------------------------------------------------------------- */}
          {showRealPhoneModal && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
              <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-6 space-y-4 shadow-2xl border border-[#E5E1D8] bottom-sheet-enter">
                <div className="flex items-center justify-between border-b border-[#E5E1D8] pb-3">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-[#0F4E4B]" />
                    <h3 className="text-sm font-bold text-[#252525]">Open on Real Smartphone</h3>
                  </div>
                  <button
                    onClick={() => setShowRealPhoneModal(false)}
                    className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D] hover:text-[#252525]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#68706D]">
                  Connect your physical phone to the same Wi-Fi network as this computer, then open this URL in Chrome or Safari:
                </p>

                <div className="p-3.5 bg-[#F8F7F2] rounded-2xl border border-[#E5E1D8] space-y-2">
                  <span className="text-[10px] font-bold text-[#7FA99B] uppercase tracking-wider block">
                    Local Mobile URL
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-[#0F4E4B] select-all truncate">
                      {localNetworkUrl}
                    </span>
                    <button
                      onClick={handleCopyUrl}
                      className="px-2.5 py-1 bg-white border border-[#E5E1D8] rounded-lg text-[11px] font-bold text-[#252525] hover:bg-[#EDF3F1] flex items-center gap-1 shadow-xs shrink-0 active:scale-95"
                    >
                      {copiedUrl ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-[#7FA99B]" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-[#EDF3F1] p-3 rounded-xl border border-[#A8CCC4] text-[11px] text-[#176B67] space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-[#176B67]" />
                    <span>Instant Two-Way Synchronization</span>
                  </div>
                  <p>
                    Any analysis started here on your PC will automatically appear on your mobile phone screen in real time!
                  </p>
                </div>

                <button
                  onClick={() => setShowRealPhoneModal(false)}
                  className="w-full py-2.5 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs shadow-sm transition-all active:scale-98"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* 5. LANGUAGE SELECTION BOTTOM SHEET */}
          {/* ------------------------------------------------------------- */}
          {showLanguageSheet && (
            <div className="absolute inset-0 z-50 bg-[#252525]/40 backdrop-blur-xs flex items-end justify-center p-0 animate-in fade-in duration-200">
              <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom border-t border-[#E5E1D8] bottom-sheet-enter">
                <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#0F4E4B]" />
                    <h3 className="text-sm font-bold text-[#252525] font-heading">
                      {t.select_language_title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLanguageSheet(false)}
                    className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D] hover:text-[#252525]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
                  {SUPPORTED_LANGUAGES.map((item) => (
                    <button
                      key={item.code}
                      onClick={() => {
                        onLanguageChange(item.code);
                        setShowLanguageSheet(false);
                      }}
                      className={`p-3 rounded-xl text-left border transition-all active:scale-98 ${
                        language === item.code
                          ? 'border-[#176B67] bg-[#EDF3F1] text-[#176B67] font-bold shadow-xs'
                          : 'border-[#E5E1D8] hover:border-[#A8CCC4] bg-white text-[#252525]'
                      }`}
                    >
                      <div className="text-xs text-[#68706D]">{item.name}</div>
                      <div className="text-sm font-black text-[#176B67] font-heading mt-0.5">
                        {item.native}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

