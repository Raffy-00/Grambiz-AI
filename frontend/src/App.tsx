import React, { useState, useEffect } from 'react';
import {
  Language, FullAssessment, DemoScenario, LocationData
} from './types';
import { useCrossPlatformSync } from './services/useCrossPlatformSync';
import { AuthScreen } from './components/auth/AuthScreen';
import { DEMO_SCENARIOS } from './data/demoScenarios';
import { reverseGeocode } from './services/api';
import { MapPin, X, Navigation } from 'lucide-react';

// Android Business Analysis & Shared Components
import { BusinessAnalysisHub } from './components/analysis/BusinessAnalysisHub';
import { FeasibilityReport } from './components/FeasibilityReport';
import { SettingsPage } from './components/SettingsPage';

// Mobile Components
import { MobileAppShell, NavigationTarget } from './components/mobile/MobileAppShell';
import { MobileDashboard } from './components/mobile/MobileDashboard';
import { MobileAnalysisWizard } from './components/mobile/MobileAnalysisWizard';
import { MobileFeasibilityView } from './components/mobile/MobileFeasibilityView';
import { MobileReportsView } from './components/mobile/MobileReportsView';
import { MobileProfileView } from './components/mobile/MobileProfileView';
import { MobileCalculatorView } from './components/mobile/MobileCalculatorView';
import { MobileSchemeRouterView } from './components/mobile/MobileSchemeRouterView';
import { MobileAssistantView } from './components/mobile/MobileAssistantView';
import { WORKFLOW_TRANSLATIONS } from './i18n/workflowTranslations';

export const App: React.FC<{ googleEnabled?: boolean }> = ({ googleEnabled = false }) => {
  // 1. Language State (English, ?????, ??????, ??????, ?????, ?????, ??????)
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('grambiz_user_language');
      if (saved && ['en', 'ta', 'hi', 'ml', 'kn', 'mr', 'te'].includes(saved)) {
        return saved as Language;
      }
    } catch (e) {
      console.warn('localStorage read error', e);
    }
    return 'en';
  });

  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('grambiz_user_language', newLang);
    } catch (e) {
      console.warn('localStorage write error', e);
    }
  };

  // 2. Central Mobile Cloud Synchronization
  const {
    currentUser,
    loginUser,
    logoutUser,
    activeDraft,
    updateDraft,
    discardDraft,
    refreshUserData,
    savedReports,
    addReport,
    syncStatus,
    lastSyncedAt,
  } = useCrossPlatformSync(language);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Always require login on every app open — clear any saved session
    try {
      localStorage.removeItem('grambiz_auth_user');
    } catch {}
    return false;
  });

  // Keep isAuthenticated in sync if currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsAuthenticated(true);
    }
  }, [currentUser]);

  // 3. Operational Location State
  const [currentLocation, setCurrentLocation] = useState<LocationData>(() => {
    try {
      const saved = localStorage.getItem('grambiz_user_location');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      village: 'Valarpuram',
      district: 'Kanchipuram',
      state: 'Tamil Nadu',
      gram_panchayat: 'Valarpuram',
      block: 'Sriperumbudur',
      pincode: '602105',
      latitude: 13.0125,
      longitude: 79.9754,
    };
  });

  const handleUpdateLocation = (loc: LocationData) => {
    setCurrentLocation(loc);
    try {
      localStorage.setItem('grambiz_user_location', JSON.stringify(loc));
    } catch (e) {}
  };

  // 4. Current Assessment & Navigation State
  const [currentAssessment, setCurrentAssessment] = useState<FullAssessment | null>(null);

  // Android Navigation State
  type MobileMainTab = 'home' | 'analyze' | 'advisor' | 'reports' | 'profile';
  type MobileSubView = 'calculator' | 'schemes' | 'feasibility-detail' | 'dpr-report' | 'settings' | null;
  const [mobileActiveTab, setMobileActiveTab] = useState<MobileMainTab>('home');
  const [mobileActiveSubView, setMobileActiveSubView] = useState<MobileSubView>(null);
  const [hubAnalysisMode, setHubAnalysisMode] = useState<'full' | 'individual'>('full');
  const [hubFocusedStep, setHubFocusedStep] = useState<number | null>(null);
  const [hubHideModeSwitch, setHubHideModeSwitch] = useState<boolean>(false);

  // Wizard initial parameters
  const [wizardInitCapital, setWizardInitCapital] = useState<number>(100000);
  const [wizardInitCategory, setWizardInitCategory] = useState<string>('Dairy');

  // Location Picker Modal State
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [modalVillage, setModalVillage] = useState<string>(currentLocation.village || '');
  const [modalDistrict, setModalDistrict] = useState<string>(currentLocation.district || '');
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);

  // Initialize demo scenario on first mount if none exists
  useEffect(() => {
    if (!currentAssessment) {
      handleLaunchDemo(DEMO_SCENARIOS[0]);
    }
  }, []);

  const handleLaunchDemo = (scenario?: DemoScenario) => {
    const s = scenario || DEMO_SCENARIOS[0];
    const margin = s.capital;
    const projectCost = margin / 0.10;
    const loanAmount = projectCost * 0.90;

    const demoAssessment: FullAssessment = {
      id: `GB-DEMO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString(),
      location: s.location,
      capital: { margin_capital: margin },
      business: {
        category: s.category,
        custom_category: `${s.category} Venture`,
        experience: 'Beginner',
        location_status: 'Planning to rent',
        existing_customers: 'No',
        target_market: 'Local village & nearby hamlets',
      },
      financial_result: {
        margin_capital: margin,
        project_cost: projectCost,
        loan_amount: loanAmount,
        beneficiary_ratio: 0.10,
        loan_ratio: 0.90,
        scheme_name: projectCost <= 140000 ? 'Micro Finance Scheme' : 'Term Loan Scheme',
        max_funding: 4500000,
        interest_rate: projectCost <= 140000 ? 6.5 : 8.0,
        tenure_years: projectCost <= 140000 ? 3 : 7,
        moratorium_months: projectCost <= 140000 ? 3 : 6,
        monthly_emi: Math.round(loanAmount * 0.015),
        total_interest: Math.round(loanAmount * 0.28),
        total_repayment: Math.round(loanAmount * 1.28),
        cap_exceeded: false,
      },
      business_analysis: {
        business_name: `${s.category} Venture`,
        market_reach: {
          radius_5km_reach: 'Est. 6,200 residents across 3 hamlets',
          radius_10km_reach: 'Est. 24,500 extended catchment population',
          primary_segments: ['Village households', 'Tea stalls', 'Local market buyers'],
          demand_indicator: 'HIGH — Strong staple demand trend',
          data_status: 'ESTIMATED',
        },
        opportunity_analysis: [
          `High demand for fresh ${s.category} in ${s.location.district}.`,
          'Opportunity in home-delivery subscription model.',
          'Direct local supply cuts out middleman commissions.',
        ],
        swot: {
          strengths: ['Steady daily cash flow', 'Low technology barrier', `Margin capital of ?${margin.toLocaleString('en-IN')}`],
          weaknesses: ['Requires continuous early morning operations'],
          opportunities: ['Unserved local sub-clusters', 'Government subsidy support'],
          threats: ['Raw material cost changes', 'Credit default from buyers'],
        },
        threats: [
          { risk_name: 'Supply-Chain Bottlenecks', severity: 'High', mitigation: 'Bulk purchase agreements with local wholesale suppliers.' },
          { risk_name: 'Customer Credit Default', severity: 'Medium', mitigation: 'Set customer credit caps and digitize payment ledgers.' },
        ],
        competitor_count: '8 within 5 KM / 21 within 10 KM',
        competition_level: 'MEDIUM',
        pricing: {
          market_price_range: '₹48 – ₹60 / Unit',
          suggested_starting_price: '?52 / Unit',
          estimated_gross_margin: '25% Gross Margin',
          cost_considerations: ['Stock purchase', 'Rent & utilities', 'Transport'],
          data_status: 'ESTIMATED',
        },
        feasibility_score: {
          overall_score: 84,
          label: 'Suitable',
          market_potential: 88,
          competition: 74,
          capital_adequacy: 85,
          profit_potential: 86,
          risk_score: 78,
          experience_fit: 80,
          scalability: 82,
        },
        confidence_rating: {
          level: 'HIGH',
          score: 84,
          data_quality_label: 'Institutional Grade Advisory',
          reasons: [
            'Financial scheme parameters verified against government policy guidelines.',
            'Local competitor density calibrated to block benchmarks.',
          ],
        },
        data_sources: {
          location_source: { field_name: 'Location', status: 'VERIFIED', source_name: 'User Input', description: 'Selected village boundaries.' },
          disclaimer_note: 'Preliminary feasibility estimate subject to bank approval.',
        },
        recommendation_summary: `Proceed with planned rollout for ${s.category} in ${s.location.village}. Feasibility score (84/100) indicates Suitable opportunity.`,
        recommendation_why: [
          `Local market demand for ${s.category} is steady with accessible customer segments.`,
          `Your margin of ?${margin.toLocaleString('en-IN')} provides solid project leverage.`,
          `Competition is manageable in your immediate block.`,
        ],
        recommendation_assumptions: [
          '10% beneficiary margin contribution with 90% scheme loan funding.',
          '6-month initial moratorium relief period prior to regular EMI repayments.',
        ],
        recommendation_risks: [
          'Raw material price inflation during peak seasons.',
          'Delayed buyer credit payments affecting working capital.',
        ],
        recommendation_verify_first: [
          'Local competitor selling prices in your immediate market.',
          'Wholesale supplier price quotations and delivery timelines.',
          'Exact bank loan eligibility criteria and required documentation.',
        ],
        recommendation_steps: [
          `1. Conduct customer survey with 25 local residents in ${s.location.village}.`,
          '2. Obtain price quotes from 2 wholesale suppliers in nearest town.',
          '3. Finalize rental lease agreement before loan application submission.',
        ],
        action_plan: {
          this_week: [
            `Talk to 10 potential customers in ${s.location.village} to test interest.`,
            'Visit 3 local competitors to observe pricing and product offerings.',
            'Get firm quotations from 2 wholesale suppliers.',
          ],
          before_applying: [
            'Finalize detailed itemized business budget.',
            'Collect required KYC documents (Aadhaar, PAN, Bank Passbook, Residence proof).',
            'Verify scheme guidelines with local bank branch manager.',
          ],
          before_starting: [
            'Establish reliable vendor supply terms with written agreements.',
            'Implement basic bookkeeping for daily income and expenses.',
          ],
        },
      },
      working_capital: {
        total_monthly_op_cost: 25000,
        reserve_3_months: 75000,
      },
      budget_allocation: {
        total_allocated: projectCost,
        project_cost: projectCost,
        is_valid: true,
        remaining: 0,
      },
      disclaimer: 'Preliminary feasibility estimate subject to bank underwriting.',
    };

    setCurrentAssessment(demoAssessment);
  };

  const handleStartAnalysis = (initialCapital?: number, initialCategory?: string) => {
    if (initialCapital) setWizardInitCapital(initialCapital);
    if (initialCategory) setWizardInitCategory(initialCategory);

    setHubAnalysisMode('full');
    setHubHideModeSwitch(true);
    setMobileActiveSubView(null);
    setMobileActiveTab('analyze');
  };

  const handleAnalysisCompleted = (assessment: FullAssessment) => {
    setCurrentAssessment(assessment);
    addReport(assessment);
    discardDraft();

    setMobileActiveSubView('feasibility-detail');
  };

  const handleDetectGPSInModal = () => {
    setIsGpsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            const geo = await reverseGeocode(lat, lon);
            setModalVillage(geo.village || geo.town || geo.suburb || 'Local Area');
            setModalDistrict(geo.district || 'District');
          } catch (e) {
            console.warn('GPS geocode failed', e);
          } finally {
            setIsGpsLocating(false);
          }
        },
        () => setIsGpsLocating(false)
      );
    } else {
      setIsGpsLocating(false);
    }
  };

  const handleSaveModalLocation = () => {
    const updated: LocationData = {
      ...currentLocation,
      village: modalVillage.trim() || currentLocation.village,
      district: modalDistrict.trim() || currentLocation.district,
    };
    handleUpdateLocation(updated);
    setShowLocationModal(false);
  };

  const handleMobileDrawerNavigate = (target: NavigationTarget) => {
    if (target === 'home') {
      setMobileActiveSubView(null);
      setMobileActiveTab('home');
      setHubHideModeSwitch(false);
    } else if (target === 'analyze') {
      setMobileActiveSubView(null);
      setHubAnalysisMode('individual');
      setHubHideModeSwitch(false);
      setMobileActiveTab('analyze');
    } else if (target === 'reports' || target === 'previous') {
      setMobileActiveSubView(null);
      setMobileActiveTab('reports');
    } else if (target === 'calculator') {
      setMobileActiveSubView('calculator');
    } else if (target === 'profile') {
      setMobileActiveSubView(null);
      setMobileActiveTab('profile');
    } else if (target === 'settings') {
      setMobileActiveSubView('settings');
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentAssessment(null);
    setMobileActiveTab('home');
    setMobileActiveSubView(null);
    setHubFocusedStep(null);
    setIsAuthenticated(false);
  };

  // --------------------------------------------------------------------------
  // 1. AUTHENTICATION VIEW (Screen 01: Login / Sign Up)
  // --------------------------------------------------------------------------
  if (!isAuthenticated) {
    return (
      <AuthScreen
        language={language}
        onLanguageChange={handleLanguageChange}
        googleEnabled={googleEnabled}
        onLoginSuccess={async (user) => {
          await loginUser(user);
          setIsAuthenticated(true);
          if (user.village) {
            handleUpdateLocation({
              ...currentLocation,
              village: user.village,
            });
          }
        }}
      />
    );
  }

  // --------------------------------------------------------------------------
  // 2. ANDROID APPLICATION INTERFACE
  // --------------------------------------------------------------------------
  const mobileScreenTitle =
    mobileActiveSubView === 'calculator'
      ? t.screen_calculator
      : mobileActiveSubView === 'schemes'
      ? t.screen_schemes
      : mobileActiveSubView === 'feasibility-detail'
      ? t.screen_report
      : mobileActiveSubView === 'dpr-report'
      ? t.screen_dpr
      : mobileActiveSubView === 'settings'
      ? t.screen_settings
      : undefined;

  return (
    <MobileAppShell
      language={language}
      onLanguageChange={handleLanguageChange}
      activeTab={mobileActiveTab}
      setActiveTab={(tab) => {
        setMobileActiveSubView(null);
        setMobileActiveTab(tab);
      }}
      onNavigate={handleMobileDrawerNavigate}
      currentLocation={currentLocation}
      onChangeLocation={() => {
        setModalVillage(currentLocation.village || '');
        setModalDistrict(currentLocation.district || '');
        setShowLocationModal(true);
      }}
      hasAssessment={!!currentAssessment}
      canGoBack={mobileActiveSubView !== null || mobileActiveTab !== 'home'}
      onGoBack={() => {
        if (mobileActiveSubView !== null) {
          setMobileActiveSubView(null);
        } else {
          setMobileActiveTab('home');
        }
      }}
      onLogout={handleLogout}
      syncStatus={syncStatus}
      screenTitle={mobileScreenTitle}
      onRefresh={refreshUserData}
    >
      {/* A. DEEP SUB-VIEWS */}
      {mobileActiveSubView === 'calculator' && (
        <MobileCalculatorView
          language={language}
          initialMargin={currentAssessment?.capital.margin_capital || 100000}
          onOpenSchemes={() => setMobileActiveSubView('schemes')}
          onOpenAssistant={() => {
            setMobileActiveSubView(null);
            setMobileActiveTab('home');
          }}
        />
      )}

      {mobileActiveSubView === 'schemes' && (
        <MobileSchemeRouterView
          language={language}
          assessment={currentAssessment || undefined}
          onOpenCalculator={() => setMobileActiveSubView('calculator')}
          onOpenAssistant={() => {
            setMobileActiveSubView(null);
            setMobileActiveTab('home');
          }}
        />
      )}

      {mobileActiveSubView === 'feasibility-detail' && currentAssessment && (
        <MobileFeasibilityView
          assessment={currentAssessment}
          language={language}
          onNavigateToCalculator={() => setMobileActiveSubView('calculator')}
          onNavigateToSchemes={() => setMobileActiveSubView('schemes')}
          onNavigateToAssistant={() => {
            setMobileActiveSubView(null);
            setMobileActiveTab('home');
          }}
        />
      )}

      {mobileActiveSubView === 'dpr-report' && currentAssessment && (
        <div className="bg-white p-2 rounded-2xl">
          <FeasibilityReport
            assessment={currentAssessment}
            language={language}
            onBack={() => setMobileActiveSubView(null)}
          />
        </div>
      )}

      {mobileActiveSubView === 'settings' && (
        <SettingsPage
          language={language}
          onLanguageChange={handleLanguageChange}
          onBackToDashboard={() => setMobileActiveSubView(null)}
        />
      )}

      {/* B. PRIMARY SCREENS (When no deep sub-view is active) */}
      {mobileActiveSubView === null && (
        <>
          {/* TAB 1: HOME */}
          {mobileActiveTab === 'home' && (
            <MobileDashboard
              language={language}
              currentUser={currentUser}
              currentLocation={currentLocation}
              activeDraft={currentUser?.user_id && activeDraft?.user_id === currentUser.user_id ? activeDraft : null}
              onStartAnalysis={handleStartAnalysis}
              onOpenCalculator={() => setMobileActiveSubView('calculator')}
              onOpenSchemes={() => setMobileActiveSubView('schemes')}
              onOpenReports={() => setMobileActiveTab('reports')}
              onSelectScenario={(scenario) => {
                handleLaunchDemo(scenario);
                setMobileActiveSubView('feasibility-detail');
              }}
              currentAssessment={currentAssessment}
              onChangeLocation={() => setShowLocationModal(true)}
            />
          )}

          {/* TAB 2: BUSINESS ANALYSIS (Full Guided & Individual Steps) */}
          {mobileActiveTab === 'analyze' && (
            <BusinessAnalysisHub
              language={language}
              initialCapital={wizardInitCapital}
              initialCategory={wizardInitCategory}
              defaultLocation={currentLocation}
              activeDraft={currentUser?.user_id && activeDraft?.user_id === currentUser.user_id ? activeDraft : null}
              onSaveDraft={updateDraft}
              onAnalysisComplete={handleAnalysisCompleted}
              onCancel={() => setMobileActiveTab('home')}
              isMobileShell={true}
              analysisModeExternal={hubAnalysisMode}
              onAnalysisModeChange={setHubAnalysisMode}
              focusedStepExternal={hubFocusedStep}
              onFocusedStepChange={setHubFocusedStep}
              hideModeSwitch={hubHideModeSwitch}
            />
          )}

          {/* TAB 3: AI RURAL ADVISOR */}
          {mobileActiveTab === 'advisor' && (
            <MobileAssistantView
              language={language}
              assessment={currentAssessment || undefined}
              currentLocation={currentLocation}
              onOpenReport={() => setMobileActiveSubView('feasibility-detail')}
            />
          )}

          {/* TAB 4: SAVED REPORTS */}
          {mobileActiveTab === 'reports' && (
            <MobileReportsView
              language={language}
              currentAssessment={currentAssessment}
              onViewReport={(ass) => {
                setCurrentAssessment(ass);
                setMobileActiveSubView('feasibility-detail');
              }}
              onNewAnalysis={() => {
                setMobileActiveSubView(null);
                setMobileActiveTab('analyze');
              }}
            />
          )}

          {/* TAB 5: PROFILE & USER SETTINGS */}
          {mobileActiveTab === 'profile' && (
            <MobileProfileView
              language={language}
              onLanguageChange={handleLanguageChange}
              currentLocation={currentLocation}
              onUpdateLocation={handleUpdateLocation}
              onSelectSavedAssessment={(ass) => {
                setCurrentAssessment(ass);
                setMobileActiveSubView('feasibility-detail');
              }}
              onOpenReports={() => setMobileActiveTab('reports')}
            />
          )}
        </>
      )}

      {/* C. LOCATION SELECTION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/60 backdrop-blur-xs flex items-end justify-center max-w-md mx-auto animate-in fade-in duration-200">
          <div className="w-full bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl safe-bottom border-t border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#176B67]" />
                <h3 className="text-sm font-bold text-[#1E293B] font-heading">
                  {t.web_modal_location_title || 'Set Your Operational Location'}
                </h3>
              </div>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1 rounded-full bg-[#EDF3F1] text-[#68706D] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleDetectGPSInModal}
              disabled={isGpsLocating}
              className="w-full py-2.5 px-4 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] text-[#176B67] font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all cursor-pointer"
            >
              <Navigation
                className={`w-4 h-4 text-[#176B67] ${isGpsLocating ? 'animate-spin' : ''}`}
              />
              <span>{isGpsLocating ? (t.web_modal_gps_loading || 'Accessing GPS...') : (t.web_modal_gps_btn || 'Use Current GPS Coordinates')}</span>
            </button>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[10px] font-bold text-[#68706D] uppercase mb-1">
                  {t.web_modal_village_label || 'Village / Town Name'}
                </label>
                <input
                  type="text"
                  value={modalVillage}
                  onChange={(e) => setModalVillage(e.target.value)}
                  placeholder="e.g. Valarpuram"
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl text-xs font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#68706D] uppercase mb-1">
                  {t.web_modal_district_label || 'District'}
                </label>
                <input
                  type="text"
                  value={modalDistrict}
                  onChange={(e) => setModalDistrict(e.target.value)}
                  placeholder="e.g. Kanchipuram"
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl text-xs font-semibold text-[#252525] focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setShowLocationModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E5E1D8] text-[#68706D] font-bold text-xs hover:bg-[#F8F7F2] cursor-pointer"
              >
                {t.web_modal_cancel_btn || 'Cancel'}
              </button>
              <button
                onClick={handleSaveModalLocation}
                className="flex-1 py-2.5 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-bold text-xs shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                {t.web_modal_save_btn || 'Save Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileAppShell>
  );
};
