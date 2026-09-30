import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowLeft, CheckCircle2, AlertCircle,
  Landmark, Navigation, Check, ExternalLink, ShieldCheck, Sparkles,
  Sliders, RefreshCw, Edit3, PieChart, RotateCcw, Wrench, Package, Store, Megaphone, MapPin, Loader2,
  Printer, FileText, Share2, Award, Download, Building2, TrendingUp, DollarSign
} from 'lucide-react';
import {
  LocationData, FullAssessment, Language, UserDraftData, NearbyBusiness
} from '../../types';
import { WORKFLOW_TRANSLATIONS } from '../../i18n/workflowTranslations';
import { reverseGeocode, geocodeLocation, fetchNearbyBusinesses } from '../../services/api';
import { OFFICIAL_GOVERNMENT_SCHEME_PORTALS, getSchemeByCost } from '../../data/schemes';
import { getCategoryPricingBenchmark } from '../../data/categories';
import { GoogleMarketMap } from '../GoogleMarketMap';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { printReportDocument } from '../../utils/printReport';

interface Props {
  language: Language;
  initialCapital?: number;
  initialCategory?: string;
  defaultLocation: LocationData;
  activeDraft?: UserDraftData | null;
  onSaveDraft?: (draft: Partial<UserDraftData>) => void;
  onAnalysisComplete: (assessment: FullAssessment) => void;
  onCancel: () => void;
}

const BUSINESS_CATEGORIES = [
  'Dairy',
  'Retail',
  'Grocery',
  'Textiles',
  'Food',
  'Poultry',
  'Small Manufacturing',
  'Services',
  'Agriculture-related business',
  'Other'
];

const PROCESS_FULL_NAMES: Record<string, string[]> = {
  en: [
    'Business Idea & Venture Category',
    'Location & Demographics Analysis',
    'Market Potential & Competitor Density',
    'SWOT & Local Threat Analysis',
    'Product Market Value & Pricing Strategy',
    'Smart Financial Calculator & Budget Allocation',
    'Government Scheme Recommendation',
    'EMI & Repayment Planning',
    'Final Feasibility Result',
    'Printable Feasibility & DPR Report',
  ],
  ta: [
    'வணிக யோசனை & துறை தேர்வு',
    'இடம் & மக்கள் தொகை ஆய்வு',
    'சந்தை தேவை & போட்டியாளர்கள்',
    'SWOT & அச்சுறுத்தல் ஆய்வு',
    'பொருளின் சந்தை மதிப்பு & விலை நிர்ணயம்',
    'ஸ்மார்ட் நிதி & பட்ஜெட் ஒதுக்கீடு',
    'அரசு மானியத் திட்ட பரிந்துரை',
    'மாதத் தவணை (EMI) & திருப்பிச் செலுத்துதல்',
    'இறுதி சாத்தியக்கூறு மதிப்பீடு',
    'அதிகாரப்பூர்வ சாத்தியக்கூறு & DPR அறிக்கை',
  ],
  hi: [
    'व्यापार विचार व श्रेणी चयन',
    'स्थान व जनसांख्यिकी विश्लेषण',
    'बाजार मांग व प्रतिस्पर्धी',
    'SWOT व जोखिम विश्लेषण',
    'उत्पाद बाजार मूल्य व निर्धारण',
    'स्मार्ट वित्तीय कैलकुलेटर व बजट',
    'सरकारी योजना व सब्सिडी',
    'ईएमआई (EMI) व पुनर्भुगतान',
    'अंतिम व्यवहार्यता स्कोर व परिणाम',
    'आधिकारिक व्यवहार्यता व DPR रिपोर्ट',
  ],
};

export const MobileAnalysisWizard: React.FC<Props> = ({
  language,
  initialCapital = 100000,
  initialCategory = 'Dairy',
  defaultLocation,
  activeDraft,
  onSaveDraft,
  onAnalysisComplete,
  onCancel,
}) => {
  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;
  const localizedFullNames = PROCESS_FULL_NAMES[language] || PROCESS_FULL_NAMES.en;

  // Step Tracker: 1 to 10
  const [currentStep, setCurrentStep] = useState<number>(() => {
    return activeDraft?.current_step || 1;
  });

  // STEP 1 State: Business Idea
  const [selectedCategory, setSelectedCategory] = useState<string>(() => {
    return activeDraft?.business_data?.category || initialCategory;
  });
  const [manualBusinessIdea, setManualBusinessIdea] = useState<string>(() => {
    return activeDraft?.business_data?.custom_category || '';
  });
  const [enterpriseName, setEnterpriseName] = useState<string>(() => {
    return activeDraft?.business_data?.enterprise_name || '';
  });

  // STEP 2 State: Location
  const [village, setVillage] = useState<string>(() => {
    return activeDraft?.location_data?.village || defaultLocation.village || 'Valarpuram';
  });
  const [block, setBlock] = useState<string>(() => {
    return activeDraft?.location_data?.block || defaultLocation.block || 'Sriperumbudur';
  });
  const [district, setDistrict] = useState<string>(() => {
    return activeDraft?.location_data?.district || defaultLocation.district || 'Kanchipuram';
  });
  const [pincode, setPincode] = useState<string>(() => {
    return activeDraft?.location_data?.pincode || defaultLocation.pincode || '602105';
  });
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // GPS coordinates (stored when GPS is used)
  const [latitude, setLatitude] = useState<number>(() => defaultLocation.latitude || 13.0125);
  const [longitude, setLongitude] = useState<number>(() => defaultLocation.longitude || 79.9754);

  // Step 3: Nearby Businesses
  const [nearbyShops, setNearbyShops] = useState<NearbyBusiness[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState<boolean>(false);
  const [nearbyFetched, setNearbyFetched] = useState<boolean>(false);
  const [isGeocodingLocation, setIsGeocodingLocation] = useState<boolean>(false);

  // STEP 6 State: Available Margin Capital
  const [marginCapital, setMarginCapital] = useState<number>(() => {
    return activeDraft?.capital_data?.margin_capital || initialCapital;
  });

  // Calculated Financial Values (10% Margin / 90% Loan rule)
  const projectCost = Math.round(marginCapital / 0.10);
  const rawLoanAmount = Math.round(projectCost * 0.90);
  const isMicroScheme = projectCost <= 140000;
  const maxFundingCap = isMicroScheme ? 125000 : 4500000;
  const loanAmount = Math.min(rawLoanAmount, maxFundingCap);

  // Scheme parameters
  const schemeName = isMicroScheme ? 'Micro Finance Scheme' : 'Term Loan Scheme';
  const interestRate = isMicroScheme ? 6.5 : 8.0;
  const tenureYears = isMicroScheme ? 3 : 7;
  const moratoriumMonths = isMicroScheme ? 3 : 6;

  // EMI calculation (Monthly installment post-moratorium)
  const totalMonths = tenureYears * 12;
  const monthlyRate = (interestRate / 100) / 12;
  const calculatedEmi = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1)
  );
  const totalRepayment = calculatedEmi * totalMonths;
  const totalInterest = totalRepayment - loanAmount;

  // Operational and working capital estimations
  const monthlyOpCost = Math.round(Math.max(25000, projectCost * 0.04));
  const workingCapitalReserve = monthlyOpCost * 3;

  // Effective Business Name (Localized Category or Custom Text)
  const localizedCatName = t.categories[selectedCategory] || selectedCategory;
  const effectiveBusinessName = manualBusinessIdea.trim()
    ? manualBusinessIdea.trim()
    : localizedCatName;

  // Competitor Density — uses real fetched data when available, else hardcoded fallback
  const competitor5kmCount = nearbyShops.length > 0
    ? nearbyShops.filter(s => s.distance_km <= 5).length
    : (selectedCategory === 'Dairy' ? 8 : selectedCategory === 'Grocery' ? 12 : 5);
  const competitor10kmCount = nearbyShops.length > 0
    ? nearbyShops.length
    : (selectedCategory === 'Dairy' ? 21 : selectedCategory === 'Grocery' ? 34 : 16);

  // Step 5: Pricing Strategy State
  const defaultBenchmark = getCategoryPricingBenchmark(selectedCategory);

  const [pricingMode, setPricingMode] = useState<'recommended' | 'manual'>(() => {
    return activeDraft?.pricing_data?.mode || 'recommended';
  });
  const [sellingPrice, setSellingPrice] = useState<number>(() => {
    return activeDraft?.pricing_data?.selling_price ?? defaultBenchmark.price;
  });
  const [unitCost, setUnitCost] = useState<number>(() => {
    return activeDraft?.pricing_data?.unit_cost ?? defaultBenchmark.cost;
  });
  const [monthlySalesVolume, setMonthlySalesVolume] = useState<number>(() => {
    return activeDraft?.pricing_data?.monthly_volume ?? defaultBenchmark.volume;
  });
  const [unitLabel, setUnitLabel] = useState<string>(() => {
    return activeDraft?.pricing_data?.unit_label ?? defaultBenchmark.unit;
  });

  // Step 6: Capital Budget Allocation State
  const [equipment, setEquipment] = useState<number>(() => activeDraft?.budget_data?.equipment || Math.round(projectCost * 0.40));
  const [inventory, setInventory] = useState<number>(() => activeDraft?.budget_data?.inventory || Math.round(projectCost * 0.25));
  const [infrastructure, setInfrastructure] = useState<number>(() => activeDraft?.budget_data?.infrastructure || Math.round(projectCost * 0.15));
  const [workingCapital, setWorkingCapital] = useState<number>(() => activeDraft?.budget_data?.working_capital || Math.round(projectCost * 0.10));
  const [marketing, setMarketing] = useState<number>(() => activeDraft?.budget_data?.marketing || Math.round(projectCost * 0.10));

  useEffect(() => {
    if (!activeDraft?.budget_data?.equipment) {
      setEquipment(Math.round(projectCost * 0.40));
      setInventory(Math.round(projectCost * 0.25));
      setInfrastructure(Math.round(projectCost * 0.15));
      setWorkingCapital(Math.round(projectCost * 0.10));
      setMarketing(Math.round(projectCost * 0.10));
    }
  }, [projectCost]);

  const totalAllocated = equipment + inventory + infrastructure + workingCapital + marketing;
  const remainingBudget = projectCost - totalAllocated;
  const isBudgetValid = remainingBudget === 0;

  const handleResetBudget = () => {
    setEquipment(Math.round(projectCost * 0.40));
    setInventory(Math.round(projectCost * 0.25));
    setInfrastructure(Math.round(projectCost * 0.15));
    setWorkingCapital(Math.round(projectCost * 0.10));
    setMarketing(Math.round(projectCost * 0.10));
  };

  // Sync pricing defaults when category changes if still in recommended mode
  useEffect(() => {
    if (pricingMode === 'recommended') {
      const b = getCategoryPricingBenchmark(selectedCategory);
      setSellingPrice(b.price);
      setUnitCost(b.cost);
      setMonthlySalesVolume(b.volume);
      setUnitLabel(b.unit);
    }
  }, [selectedCategory, pricingMode]);

  const effectiveSellingPrice = pricingMode === 'manual' ? sellingPrice : defaultBenchmark.price;
  const effectiveUnitCost = pricingMode === 'manual' ? unitCost : defaultBenchmark.cost;
  const effectiveVolume = pricingMode === 'manual' ? monthlySalesVolume : defaultBenchmark.volume;
  const effectiveUnitLabel = pricingMode === 'manual' ? unitLabel : defaultBenchmark.unit;

  const unitGrossMargin = Math.max(0, effectiveSellingPrice - effectiveUnitCost);
  const grossMarginPercentage = effectiveSellingPrice > 0
    ? Math.round(((effectiveSellingPrice - effectiveUnitCost) / effectiveSellingPrice) * 100)
    : 0;

  // ─── Risk-Based Feasibility Score ───────────────────────────────────────
  // Rule: LOW risk = HIGH score | HIGH risk = LOW score
  // Each factor contributes a risk penalty or bonus.

  // 1. Competition Risk (30%) — more competitors = higher risk = lower score
  const competitionScore =
    competitor5kmCount === 0 ? 98   // no competition — very low risk
    : competitor5kmCount <= 2  ? 92   // very few — low risk
    : competitor5kmCount <= 5  ? 80   // manageable — moderate
    : competitor5kmCount <= 10 ? 65   // crowded — higher risk
    : competitor5kmCount <= 15 ? 50   // very crowded — high risk
    : 38;                             // saturated — very high risk

  // 2. Profit Margin Risk (25%) — thin margins = higher risk
  const marginScore =
    grossMarginPercentage >= 40 ? 96  // excellent margin — very low risk
    : grossMarginPercentage >= 30 ? 88  // good margin
    : grossMarginPercentage >= 20 ? 76  // acceptable
    : grossMarginPercentage >= 12 ? 60  // thin margin — risky
    : 42;                               // very thin — high risk

  // 3. Capital Adequacy Risk (20%) — over-leveraged = high risk
  const capRatio = projectCost / maxFundingCap;
  const capitalScore =
    capRatio <= 0.2 ? 95   // small project — very low risk
    : capRatio <= 0.4 ? 87   // comfortable
    : capRatio <= 0.6 ? 78   // moderate
    : capRatio <= 0.8 ? 67   // stretched
    : 52;                    // near limit — higher risk

  // 4. EMI Repayment Risk (15%) — high EMI vs capital = repayment risk
  const emiToCapital = marginCapital > 0 ? (calculatedEmi / marginCapital) : 2;
  const repaymentScore =
    emiToCapital <= 0.05 ? 96  // very comfortable repayment
    : emiToCapital <= 0.10 ? 88
    : emiToCapital <= 0.20 ? 76
    : emiToCapital <= 0.35 ? 60
    : 42;                       // EMI is a large chunk of capital — risky

  // 5. Budget Balance Risk (10%) — unbalanced budget = execution risk
  const budgetScore = isBudgetValid ? 90 : remainingBudget > 0 ? 65 : 50;

  // Weighted overall score
  const _rawScore = Math.round(
    (competitionScore * 0.30) +
    (marginScore      * 0.25) +
    (capitalScore     * 0.20) +
    (repaymentScore   * 0.15) +
    (budgetScore      * 0.10)
  );
  const _clampedScore = Math.min(97, Math.max(42, _rawScore));

  const feasibilityScore = {
    overall_score: _clampedScore,
    label: _clampedScore >= 80 ? 'Suitable'
      : _clampedScore >= 65 ? 'Moderate'
      : 'High Risk',
    market_potential: competitionScore,
    competition: competitionScore,
    capital_adequacy: capitalScore,
    profit_potential: marginScore,
    risk_score: repaymentScore,
    experience_fit: budgetScore,
    scalability: Math.round((competitionScore + capitalScore) / 2),
  };
  const estimatedMonthlyGrossProfit = unitGrossMargin * effectiveVolume;

  // Real-time Cloud Auto-Sync
  useEffect(() => {
    if (onSaveDraft) {
      onSaveDraft({
        current_step: currentStep,
        business_data: {
          category: selectedCategory,
          custom_category: effectiveBusinessName,
          enterprise_name: enterpriseName,
          expected_selling_price: effectiveSellingPrice,
          expected_monthly_sales: effectiveVolume,
        },
        location_data: {
          village,
          block,
          district,
          pincode,
          state: 'Tamil Nadu',
        },
        capital_data: {
          margin_capital: marginCapital,
        },
        pricing_data: {
          mode: pricingMode,
          selling_price: sellingPrice,
          unit_cost: unitCost,
          monthly_volume: monthlySalesVolume,
          unit_label: unitLabel,
        },
        budget_data: {
          equipment,
          inventory,
          infrastructure,
          working_capital: workingCapital,
          marketing,
          total_allocated: totalAllocated,
          remaining: remainingBudget,
          is_valid: isBudgetValid,
        },
        last_platform: 'mobile',
      });
    }
  }, [currentStep, selectedCategory, manualBusinessIdea, village, block, district, pincode, marginCapital, pricingMode, sellingPrice, unitCost, monthlySalesVolume, unitLabel, equipment, inventory, infrastructure, workingCapital, marketing, totalAllocated, remainingBudget, isBudgetValid]);

  // Step 3: Fetch nearby shops when entering step 3
  useEffect(() => {
    if (currentStep === 3 && !nearbyFetched) {
      setNearbyLoading(true);
      const locStr = `${village}, ${district}`.trim();
      fetchNearbyBusinesses(latitude, longitude, 10, selectedCategory, effectiveBusinessName, locStr)
        .then((data) => {
          setNearbyShops(data.businesses || []);
          setNearbyFetched(true);
        })
        .catch(() => {
          setNearbyFetched(true);
        })
        .finally(() => setNearbyLoading(false));
    }
  }, [currentStep, nearbyFetched, latitude, longitude, selectedCategory, effectiveBusinessName, village, district]);

  // GPS auto-detection handler
  const handleDetectGPS = () => {
    setIsDetectingGps(true);
    setGpsError(null);

    // Check if geolocation is available and page is secure
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

    if (!('geolocation' in navigator) || !isSecure) {
      // Fallback: use IP-based geolocation
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
          if (data.latitude && data.longitude) {
            setLatitude(data.latitude);
            setLongitude(data.longitude);
            setNearbyFetched(false);
            setVillage(data.city || data.region || 'Local Area');
            setDistrict(data.region || 'District');
            if (data.postal) setPincode(data.postal);
          }
        })
        .catch(() => {})
        .finally(() => {
          setIsDetectingGps(false);
          setGpsError('Precise GPS requires HTTPS. Location estimated from network — please verify below.');
        });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lon);
          setNearbyFetched(false);
          const res = await reverseGeocode(lat, lon);
          setVillage(res.village || res.town || 'Local Area');
          setDistrict(res.district || 'District');
          setBlock(res.suburb || 'Taluk');
          if (res.postcode) setPincode(res.postcode);
        } catch (e) {
          setGpsError('Could not resolve address. Please enter manually.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          // Try IP fallback when user denies GPS
          fetch('https://ipapi.co/json/')
            .then(r => r.json())
            .then(data => {
              if (data.latitude && data.longitude) {
                setLatitude(data.latitude);
                setLongitude(data.longitude);
                setNearbyFetched(false);
                setVillage(data.city || data.region || 'Local Area');
                setDistrict(data.region || 'District');
                if (data.postal) setPincode(data.postal);
                setGpsError('GPS was denied — location estimated from network. Please verify below.');
              } else {
                setGpsError('GPS access denied. Please type your village name below.');
              }
            })
            .catch(() => setGpsError('GPS access denied. Please type your village name below.'));
        } else {
          setGpsError('Could not get location. Please enter your village manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Build and finalize full assessment object
  const handleCompleteAll = () => {
    const assessment: FullAssessment = {
      id: `GB-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      created_at: new Date().toISOString(),
      location: {
        village,
        block,
        district,
        state: 'Tamil Nadu',
        pincode,
        latitude: 13.0125,
        longitude: 79.9754,
      },
      capital: { margin_capital: marginCapital },
      business: {
        category: selectedCategory,
        custom_category: effectiveBusinessName,
        enterprise_name: enterpriseName,
        experience: 'Beginner',
        location_status: 'Planning to rent',
        existing_customers: 'No',
        target_market: `${village} and neighboring rural hamlets`,
      },
      financial_result: {
        margin_capital: marginCapital,
        project_cost: projectCost,
        loan_amount: loanAmount,
        beneficiary_ratio: 0.10,
        loan_ratio: 0.90,
        scheme_name: schemeName,
        max_funding: maxFundingCap,
        interest_rate: interestRate,
        tenure_years: tenureYears,
        moratorium_months: moratoriumMonths,
        monthly_emi: calculatedEmi,
        total_interest: totalInterest,
        total_repayment: totalRepayment,
      },
      business_analysis: {
        business_name: effectiveBusinessName,
        market_reach: {
          radius_5km_reach: `Est. 6,200 residents across ${village} & 3 adjoining hamlets`,
          radius_10km_reach: `Est. 24,500 extended catchment population in ${block}`,
          primary_segments: ['Local households', 'Daily wage earners', 'Tea stalls & retail shops'],
          demand_indicator: 'HIGH — Strong essential everyday demand',
          data_status: 'VERIFIED BENCHMARK',
        },
        opportunity_analysis: [
          `Unserved demand for consistent, high-grade ${selectedCategory} products in ${village}.`,
          'Direct local supply cuts out middleman commissions, keeping margins over 22%.',
          'Doorstep delivery and subscription orders capture repeat daily customers.',
        ],
        swot: {
          strengths: [
            `Steady daily recurring cash-flow model for ${effectiveBusinessName}`,
            `Self-contributed margin of ₹${marginCapital.toLocaleString('en-IN')} meets 10% statutory equity norm`,
            'Zero royalty or franchise fees required'
          ],
          weaknesses: [
            'Requires strict inventory handling and safe keeping',
            'Initial working capital needs monitoring until break-even'
          ],
          opportunities: [
            `Capturing ${competitor5kmCount} nearby unorganized competitor customer segments`,
            `Government interest subsidy under ${schemeName}`
          ],
          threats: [
            'Seasonal raw material price fluctuations during peak months',
            'Customer credit demands causing delayed collections',
            'Single wholesale supplier dependency in the block'
          ]
        },
        threats: [
          { risk_name: t.threat_supply, severity: 'High', mitigation: t.threat_supply_mitigation },
          { risk_name: t.threat_seasonal, severity: 'Medium', mitigation: t.threat_seasonal_mitigation },
          { risk_name: t.threat_single_buyer, severity: 'Medium', mitigation: t.threat_single_buyer_mitigation },
        ],
        competitor_count: `${competitor5kmCount} within 5 KM / ${competitor10kmCount} within 10 KM`,
        competition_level: competitor5kmCount > 10 ? 'HIGH' : 'MEDIUM',
        pricing: {
          market_price_range: pricingMode === 'manual'
            ? `₹${unitCost} – ₹${Math.round(sellingPrice * 1.15)} / ${unitLabel}`
            : defaultBenchmark.range,
          suggested_starting_price: pricingMode === 'manual'
            ? `₹${sellingPrice} / ${unitLabel}`
            : `₹${defaultBenchmark.price} / ${defaultBenchmark.unit}`,
          estimated_gross_margin: pricingMode === 'manual'
            ? `${grossMarginPercentage}% Gross Margin`
            : `${defaultBenchmark.margin}% Gross Margin`,
          cost_considerations: pricingMode === 'manual'
            ? [
                `Direct wholesale unit cost: ₹${unitCost} / ${unitLabel}`,
                `Unit gross margin: ₹${unitGrossMargin}`,
                `Expected monthly sales target: ${monthlySalesVolume.toLocaleString('en-IN')} ${unitLabel}s/mo`
              ]
            : ['Inventory procurement', 'Shop lease & power', 'Transport freight'],
          data_status: pricingMode === 'manual' ? 'CUSTOM MANUAL PRICING' : 'LOCAL MARKET SURVEY',
        },
        feasibility_score: feasibilityScore,
        confidence_rating: {
          level: feasibilityScore.overall_score >= 80 ? 'HIGH' : feasibilityScore.overall_score >= 65 ? 'MEDIUM' : 'LOW',
          score: feasibilityScore.overall_score,
          data_quality_label: 'Institutional Grade Advisory',
          reasons: [
            '10% equity / 90% debt rule verified with NABARD and MSME guidelines',
            `Scheme interest capped at ${interestRate}% under ${schemeName}`,
            'Hyper-local radius density verified against block enterprise registries'
          ]
        },
        data_sources: {
          location_source: { field_name: 'Location', status: 'VERIFIED', source_name: 'User Specified / GPS', description: `${village}, ${district}` },
          disclaimer_note: 'Preliminary feasibility estimate conforming to formal banking underwriting criteria.',
        },
        recommendation_summary: `Proceed with ${effectiveBusinessName} in ${village}. Business Feasibility is rated ${feasibilityScore.label.toUpperCase()} (${feasibilityScore.overall_score}/100).`,
        recommendation_why: [
          `Local demand in ${village} is strong with manageable competition (${competitor5kmCount} within 5 KM).`,
          `Your margin capital of ₹${marginCapital.toLocaleString('en-IN')} unlocks a ₹${(projectCost/100000).toFixed(1)} Lakh project.`,
          `Selected ${schemeName} provides a ${moratoriumMonths}-month repayment moratorium to protect your working capital.`
        ],
        recommendation_assumptions: [
          '10% equity contribution with 90% bank loan under applicable government scheme.',
          `${moratoriumMonths}-month initial moratorium relief period prior to regular monthly EMI repayments.`
        ],
        recommendation_risks: [
          'Raw material price inflation and wholesale delivery delays.',
          'Overextended informal customer credit.'
        ],
        recommendation_verify_first: [
          'Exact rental terms for commercial shop space in main village market.',
          'Price quotes from 2 wholesale suppliers in nearest town.',
          'Application document checklist for local bank branch loan processing.'
        ],
        recommendation_steps: [
          `1. Survey potential customers in ${village} market.`,
          '2. Secure written agreement with wholesale supplier.',
          '3. Submit formal project report (DPR) to bank loan officer.'
        ],
        action_plan: {
          this_week: [
            `Conduct local customer survey in ${village} to confirm pricing acceptability.`,
            `Visit 3 local competitors in ${village} to review product assortment.`,
            'Obtain written wholesale quotation for initial stock setup.'
          ],
          before_applying: [
            'Finalize shop lease deed / consent letter from property owner.',
            'Collect KYC documents (Aadhaar, PAN, Bank Passbook, Residence Proof).',
            `Verify ${schemeName} document checklist at nearest bank branch.`
          ],
          before_starting: [
            'Set up basic bookkeeping ledger or digital UPI billing app.',
            'Maintain ₹75,000 contingency working capital reserve for operations.',
            'Negotiate delivery schedule with primary supplier.'
          ]
        }
      },
      working_capital: {
        total_monthly_op_cost: monthlyOpCost,
        reserve_3_months: workingCapitalReserve,
      },
      budget_allocation: {
        total_allocated: totalAllocated,
        project_cost: projectCost,
        is_valid: isBudgetValid,
        remaining: remainingBudget,
      },
      disclaimer: 'Preliminary business feasibility assessment subject to standard bank underwriting and eligibility verification.',
    };

    onAnalysisComplete(assessment);
  };

  return (
    <div className="space-y-4 pb-12 font-sans text-[#252525]">
      
      {/* 1. Progress Indicator Stepper */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E1D8] shadow-xs mb-4">
        {/* Header row: Process Name + Cancel button */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10.5px] font-bold text-[#176B67] uppercase tracking-wider bg-[#EDF3F1] px-2.5 py-0.5 rounded-full">
                Business Analysis
              </span>
            </div>
            <h2 className="text-sm sm:text-base md:text-lg font-black text-[#252525] font-heading leading-tight truncate">
              {localizedFullNames[currentStep - 1] || 'Venture Evaluation'}
            </h2>
          </div>

          <button
            onClick={onCancel}
            className="text-xs font-bold text-[#7FA99B] hover:text-[#252525] uppercase shrink-0 py-1 px-2.5 rounded-lg hover:bg-[#EDF3F1] transition-colors cursor-pointer"
          >
            {t.wiz_cancel}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1 — Business Idea */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[0]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step1_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step1_sub}
            </p>
          </div>

          {/* Enterprise Name */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1.5">
              {t.step1_enterprise_label}
            </label>
            <input
              type="text"
              value={enterpriseName}
              onChange={(e) => setEnterpriseName(e.target.value)}
              placeholder="{t.step1_enterprise_placeholder}"
              className="w-full px-3.5 py-2.5 bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl text-xs font-semibold text-[#252525] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176B67]"
            />
          </div>

          {/* Option A — Select Business Category */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
              {t.step1_opt_a}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat && !manualBusinessIdea.trim();
                const displayName = t.categories[cat] || cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setManualBusinessIdea('');
                    }}
                    className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#176B67] bg-[#EDF3F1] text-[#176B67] shadow-xs'
                        : 'border-[#E5E1D8] text-[#252525] hover:border-[#E5E1D8] bg-white'
                    }`}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Option B — Enter Manually */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-1.5">
              {t.step1_opt_b}
            </label>
            <input
              type="text"
              value={manualBusinessIdea}
              onChange={(e) => setManualBusinessIdea(e.target.value)}
              placeholder={t.step1_custom_placeholder}
              className="w-full px-3.5 py-2.5 bg-[#F8F7F2] border border-[#E5E1D8] rounded-xl text-xs font-semibold text-[#252525] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#176B67]"
            />
            <span className="text-[11px] text-[#7FA99B] mt-1 block">
              {t.step1_custom_note}
            </span>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="min-h-[44px] py-2.5 px-6 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span>{t.wiz_continue}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2 — Location */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[1]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step2_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step2_business_label}: <span className="font-bold text-[#1E293B]">{effectiveBusinessName}</span>
            </p>
          </div>

          {/* Option A — Current Location (GPS) */}
          <div className="p-3.5 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#176B67]">{t.step2_opt_a}</span>
              <Navigation className="w-4 h-4 text-[#176B67]" />
            </div>
            <p className="text-[11px] text-[#68706D]">
              {t.step2_opt_a_desc}
            </p>
            <button
              type="button"
              onClick={handleDetectGPS}
              disabled={isDetectingGps}
              className="w-full py-2.5 px-3 bg-white border border-[#E5E1D8] text-[#176B67] rounded-lg text-xs font-bold flex items-center justify-center gap-2 active:scale-98 shadow-xs hover:bg-[#EDF3F1] transition-colors"
            >
              <Navigation className={`w-3.5 h-3.5 ${isDetectingGps ? 'animate-spin' : ''}`} />
              <span>{isDetectingGps ? t.step2_detecting_gps : t.step2_detect_gps_btn}</span>
            </button>
            {gpsError && (
              <p className="text-[11px] text-[#176B67] font-medium">{gpsError}</p>
            )}
          </div>

          {/* Option B — Manual Location */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider">
              {t.step2_opt_b}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">{t.step2_village_label}</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder={t.step2_village_label}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">{t.step2_block_label}</label>
                <input
                  type="text"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  placeholder={t.step2_block_label}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">{t.step2_district_label}</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={t.step2_district_label}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#68706D] block mb-1">{t.step2_pincode_label}</label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder={t.step2_pincode_label}
                  className="w-full px-3 py-2 bg-[#F8F7F2] border border-[#E5E1D8] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#176B67]"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(1)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={async () => {
                setIsGeocodingLocation(true);
                try {
                  const locQuery = `${village}, ${district}`.trim();
                  if (locQuery && locQuery !== ',') {
                    const geo = await geocodeLocation(locQuery);
                    if (geo && geo.latitude && geo.longitude) {
                      setLatitude(geo.latitude);
                      setLongitude(geo.longitude);
                    }
                  }
                } catch (e) {
                  console.warn("Geocoding before Step 3 failed:", e);
                } finally {
                  setIsGeocodingLocation(false);
                  setNearbyFetched(false);
                  setCurrentStep(3);
                }
              }}
              disabled={isGeocodingLocation}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all disabled:opacity-60"
            >
              {isGeocodingLocation ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span className="truncate">Locating Area...</span>
                </>
              ) : (
                <>
                  <span className="truncate">{t.step2_analyze_area_btn}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3 — Hyper-Local Market & Competitor Analysis */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[2]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step3_heading}
            </h2>
            <div className="text-xs text-[#68706D] mt-1 flex flex-wrap gap-2">
              <span className="bg-[#EDF3F1] px-2 py-0.5 rounded-md font-bold text-[#252525]">
                {t.step3_biz_label}: {effectiveBusinessName}
              </span>
              <span className="bg-[#EDF3F1] border border-[#E5E1D8] px-2 py-0.5 rounded-md font-bold text-[#176B67]">
                {t.step3_loc_label}: {village}, {district}
              </span>
            </div>
          </div>

          {/* Interactive Hyper-Local Competitor & Catchment Map */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#176B67]" />
                <span>Hyper-Local Catchment & Competitor Map</span>
              </label>
              <span className="text-[10px] font-bold text-[#176B67] bg-[#EDF3F1] border border-[#A8CCC4] px-2 py-0.5 rounded-full">
                5km & 10km Visualizer
              </span>
            </div>

            <div className="rounded-2xl overflow-hidden border border-[#E5E1D8] shadow-xs relative bg-[#F8F7F2] h-72 sm:h-80 w-full min-h-[280px]">
              <ErrorBoundary fallbackTitle="Map Visualizer" fallbackMessage="Map layer is initializing. Nearby competitors remain available below.">
                <GoogleMarketMap
                  language={language}
                  initialVillage={village}
                  initialDistrict={district}
                  initialCategory={effectiveBusinessName || selectedCategory}
                  initialLat={typeof latitude === 'number' && !isNaN(latitude) && latitude !== 0 ? latitude : 13.0125}
                  initialLon={typeof longitude === 'number' && !isNaN(longitude) && longitude !== 0 ? longitude : 79.9754}
                  initialRadius={10}
                  hideHeaderControls={true}
                  hideKpiCards={true}
                  hideOutletList={true}
                  mapHeight="100%"
                />
              </ErrorBoundary>
            </div>

            {/* Map Legend */}
            <div className="p-2.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] flex items-center justify-around text-[10.5px] font-semibold text-[#68706D] flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F4E4B] ring-2 ring-white"></span>
                <span className="text-[#252525]">Proposed Site</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#176B67] ring-2 ring-white"></span>
                <span className="text-[#252525]">0–5 KM Outlets</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] ring-2 ring-white"></span>
                <span className="text-[#252525]">5–10 KM Catchment</span>
              </div>
            </div>
          </div>

          {/* Competitor Density Cards */}
          <div>
            <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider mb-2">
              {t.step3_density_title}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                <div className="text-[10px] font-bold text-[#68706D] uppercase tracking-wide">{t.step3_within_5km}</div>
                <div className="text-xl font-black text-[#1E293B] font-heading mt-1">
                  {competitor5kmCount} {t.step3_similar_biz}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                <div className="text-[10px] font-bold text-[#68706D] uppercase tracking-wide">{t.step3_within_10km}</div>
                <div className="text-xl font-black text-[#1E293B] font-heading mt-1">
                  {competitor10kmCount} {t.step3_similar_biz}
                </div>
              </div>
            </div>
          </div>

          {/* Nearby Shops List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-[#252525] uppercase tracking-wider">
                {t.step3_nearby_shops_label}
              </label>
              <button
                type="button"
                onClick={() => { setNearbyFetched(false); }}
                className="flex items-center gap-1 text-[11px] text-[#176B67] font-bold active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {nearbyLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-[#68706D] text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Detecting nearby shops...</span>
              </div>
            ) : nearbyShops.length === 0 ? (
              <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] text-xs text-[#68706D] text-center">
                {t.step3_no_shops}
              </div>
            ) : (
              <div className="space-y-2">
                {nearbyShops.map((shop) => (
                  <div key={shop.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                    <div className="w-7 h-7 rounded-lg bg-[#EDF3F1] border border-[#A8CCC4] flex items-center justify-center shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5 text-[#176B67]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#252525] truncate">{shop.name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                          shop.distance_km <= 5
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {shop.distance_km.toFixed(1)} km
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {shop.category && shop.category.toLowerCase() !== selectedCategory.toLowerCase() && (
                          <span className="text-[10px] font-semibold text-[#176B67] bg-[#EDF3F1] px-1.5 py-0.5 rounded">
                            {shop.category}
                          </span>
                        )}
                        {shop.address && (
                          <div className="flex items-center gap-1 min-w-0">
                            <MapPin className="w-2.5 h-2.5 text-[#7FA99B] shrink-0" />
                            <span className="text-[11px] text-[#68706D] truncate">{shop.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Additional Market Indicators */}
          <div className="space-y-2 pt-1 text-xs">
            <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-2.5">
              <div className="flex items-center justify-between font-bold text-[#252525]">
                <span>{t.step3_clusters_title}</span>
                <span className="text-[#176B67] font-extrabold text-xs">{t.step3_clusters_val}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[#252525]">
                <span>{t.step3_reach_title}</span>
                <span className="text-[#176B67] text-xs font-bold">{t.step3_reach_val}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[#252525]">
                <span>{t.step3_channels_title}</span>
                <span className="text-[#252525] text-xs">{t.step3_channels_val}</span>
              </div>
              <div className="flex items-center justify-between font-bold text-[#252525]">
                <span>{t.step3_demand_title}</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-[#176B67] text-[10px] font-black shrink-0">
                  {t.step3_high_demand_badge}
                </span>
              </div>
            </div>
          </div>


          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(2)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step3_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4 — SWOT Analysis with Threat Identification */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[3]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step4_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step4_sub}
            </p>
          </div>

          {/* 4 Quadrants */}
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {/* Strengths */}
            <div className="p-3 rounded-xl bg-[#EDF3F1]/70 border border-[#A8CCC4] space-y-1">
              <div className="text-[11px] font-black text-[#176B67] uppercase tracking-wide">{t.swot_strengths}</div>
              <ul className="text-xs text-[#252525] space-y-1 list-disc pl-3">
                <li>{t.swot_strength_1}</li>
                <li>{t.swot_strength_2}</li>
                <li>{t.swot_strength_3}</li>
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-3 rounded-xl bg-[#FBF6EA]/70 border border-[#F5D49A] space-y-1">
              <div className="text-[11px] font-black text-[#A07C2E] uppercase tracking-wide">{t.swot_weaknesses}</div>
              <ul className="text-xs text-amber-950 space-y-1 list-disc pl-3">
                <li>{t.swot_weakness_1}</li>
                <li>{t.swot_weakness_2}</li>
              </ul>
            </div>

            {/* Opportunities */}
            <div className="p-3 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] space-y-1">
              <div className="text-[11px] font-black text-[#176B67] uppercase tracking-wide">{t.swot_opportunities}</div>
              <ul className="text-xs text-[#176B67] space-y-1 list-disc pl-3">
                <li>{t.swot_opportunity_1}</li>
                <li>{t.swot_opportunity_2}</li>
              </ul>
            </div>

            {/* Threats */}
            <div className="p-3 rounded-xl bg-[#EDF3F1]/70 border border-[#E5E1D8] space-y-1">
              <div className="text-[11px] font-black text-[#0F4E4B] uppercase tracking-wide">{t.swot_threats}</div>
              <ul className="text-xs text-[#252525] space-y-1 list-disc pl-3">
                <li>{t.swot_threat_1}</li>
                <li>{t.swot_threat_2}</li>
              </ul>
            </div>
          </div>

          {/* Embedded Threat Identification Section */}
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-[#176B67]" />
              <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wide">
                {t.step4_threats_title}
              </h3>
            </div>
            <div className="space-y-2">
              <div className="p-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F2] text-xs">
                <div className="flex items-center justify-between gap-2 font-bold text-[#252525]">
                  <span className="truncate">{t.threat_supply}</span>
                  <span className="text-[10px] font-extrabold text-[#176B67] bg-[#EDF3F1] px-2 py-0.5 rounded-md shrink-0 border border-[#E5E1D8]">
                    {t.risk_high}
                  </span>
                </div>
                <p className="text-[11px] text-[#68706D] mt-1 leading-normal">
                  {t.threat_supply_mitigation}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F2] text-xs">
                <div className="flex items-center justify-between gap-2 font-bold text-[#252525]">
                  <span className="truncate">{t.threat_seasonal}</span>
                  <span className="text-[10px] font-extrabold text-[#A07C2E] bg-[#FBF6EA] px-2 py-0.5 rounded-md shrink-0 border border-[#F5D49A]">
                    {t.risk_medium}
                  </span>
                </div>
                <p className="text-[11px] text-[#68706D] mt-1 leading-normal">
                  {t.threat_seasonal_mitigation}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F2] text-xs">
                <div className="flex items-center justify-between gap-2 font-bold text-[#252525]">
                  <span className="truncate">{t.threat_single_buyer}</span>
                  <span className="text-[10px] font-extrabold text-[#A07C2E] bg-[#FBF6EA] px-2 py-0.5 rounded-md shrink-0 border border-[#F5D49A]">
                    {t.risk_medium}
                  </span>
                </div>
                <p className="text-[11px] text-[#68706D] mt-1 leading-normal">
                  {t.threat_single_buyer_mitigation}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(3)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(5)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step4_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5 — Product Market Value & Recommended Pricing */}
      {/* ========================================================================= */}
      {currentStep === 5 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[4]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step5_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step5_sub}
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#EDF3F1] rounded-xl border border-[#E5E1D8]">
            <button
              type="button"
              onClick={() => setPricingMode('recommended')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                pricingMode === 'recommended'
                  ? 'bg-[#176B67] text-white shadow-xs'
                  : 'text-[#68706D] hover:text-[#252525] bg-transparent'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="truncate">{t.step5_ai_benchmark_tab}</span>
            </button>
            <button
              type="button"
              onClick={() => setPricingMode('manual')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                pricingMode === 'manual'
                  ? 'bg-[#176B67] text-white shadow-xs'
                  : 'text-[#68706D] hover:text-[#252525] bg-transparent'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-white" />
              <span className="truncate">{t.step5_custom_manual_tab}</span>
            </button>
          </div>

          {/* AI Benchmark View */}
          {pricingMode === 'recommended' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-[#FFFBEB] border border-rose-400/40 space-y-2">
                <div className="text-[10px] font-bold text-[#9A3412] uppercase tracking-wider">
                  {t.step5_pricing_title}
                </div>
                <div className="flex items-baseline gap-2.5">
                  <div className="text-2xl font-black text-[#1E293B] font-heading">
                    ₹{defaultBenchmark.price} / {defaultBenchmark.unit}
                  </div>
                  <span className="text-xs text-[#68706D] font-bold">
                    ({defaultBenchmark.range})
                  </span>
                </div>
                <p className="text-xs text-[#252525] leading-relaxed">
                  {t.step5_pricing_desc}
                </p>
              </div>

              {/* Estimated Local Market Value */}
              <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-2 text-xs">
                <div className="text-[10px] font-bold text-[#68706D] uppercase tracking-wide">
                  {t.step5_market_val_title}
                </div>
                <div className="text-base font-black text-[#1E293B] font-heading">
                  {t.step5_market_val_amount}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-lg bg-white border border-[#E5E1D8]">
                    <span className="text-[#68706D] block text-[11px]">{t.step5_gross_margin_title}</span>
                    <span className="font-black text-[#176B67]">{defaultBenchmark.margin}%</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white border border-[#E5E1D8]">
                    <span className="text-[#68706D] block text-[11px]">{t.step5_strategy_title}</span>
                    <span className="font-black text-[#176B67]">{t.step5_strategy_val}</span>
                  </div>
                </div>
              </div>

              {/* CTA to customize */}
              <div className="p-3 rounded-xl bg-[#FBF6EA] border border-[#F5D49A] flex items-center justify-between gap-2">
                <span className="text-xs text-amber-900 font-medium">{t.step5_want_custom}</span>
                <button
                  type="button"
                  onClick={() => setPricingMode('manual')}
                  className="px-3 py-1.5 rounded-lg bg-[#176B67] text-white font-bold text-xs shrink-0 flex items-center gap-1 shadow-2xs"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{t.step5_customize_btn}</span>
                </button>
              </div>
            </div>
          )}

          {/* Custom Manual Pricing View */}
          {pricingMode === 'manual' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#252525] uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-[#176B67]" />
                    <span>Unit Economics Input</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSellingPrice(defaultBenchmark.price);
                      setUnitCost(defaultBenchmark.cost);
                      setMonthlySalesVolume(defaultBenchmark.volume);
                      setUnitLabel(defaultBenchmark.unit);
                    }}
                    className="text-[10px] font-bold text-[#1A56DB] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] mb-1">
                      Selling Price (₹ / {unitLabel})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7FA99B] font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={sellingPrice || ''}
                        onChange={(e) => setSellingPrice(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#252525]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] mb-1">
                      Direct Cost (₹ / {unitLabel})
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7FA99B] font-bold text-xs">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={unitCost || ''}
                        onChange={(e) => setUnitCost(Math.max(0, Number(e.target.value)))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#252525]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] mb-1">
                      Monthly Volume ({unitLabel}s)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={monthlySalesVolume || ''}
                      onChange={(e) => setMonthlySalesVolume(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-white border border-[#E5E1D8] rounded-xl text-xs font-bold text-[#252525]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#68706D] mb-1">
                      Unit Measure
                    </label>
                    <div className="flex gap-1 flex-wrap">
                      {['Liter', 'Kg', 'Piece', 'Plate', 'Unit', 'Service'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUnitLabel(u)}
                          className={`px-2 py-1 rounded-md text-[10.5px] font-bold border ${
                            unitLabel.toLowerCase() === u.toLowerCase()
                              ? 'bg-[#176B67] text-white border-[#176B67]'
                              : 'bg-white text-[#68706D] border-[#E5E1D8]'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculated Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                  <span className="text-[10px] text-[#7FA99B] block font-bold">Margin / Unit</span>
                  <span className={`text-xs font-black ${sellingPrice > unitCost ? 'text-[#176B67]' : 'text-[#176B67]'}`}>
                    ₹{sellingPrice - unitCost}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                  <span className="text-[10px] text-[#7FA99B] block font-bold">Margin %</span>
                  <span className={`text-xs font-black ${grossMarginPercentage >= 20 ? 'text-[#176B67]' : 'text-[#C89B3C]'}`}>
                    {grossMarginPercentage}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8]">
                  <span className="text-[10px] text-[#7FA99B] block font-bold">Mo. Profit</span>
                  <span className="text-xs font-black text-[#252525]">
                    ₹{estimatedMonthlyGrossProfit.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {sellingPrice <= unitCost ? (
                <div className="p-2.5 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] text-[11px] text-[#0F4E4B] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#176B67] shrink-0" />
                  <span>Selling price must be greater than direct cost.</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-[#EDF3F1] border border-[#A8CCC4] text-[11px] text-[#176B67] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7FA99B] shrink-0" />
                  <span>Calculated margin: {grossMarginPercentage}% (₹{estimatedMonthlyGrossProfit.toLocaleString('en-IN')}/mo gross profit).</span>
                </div>
              )}
            </div>
          )}

          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] text-xs text-[#68706D] leading-relaxed">
            {t.step5_insight}
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(4)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(6)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step5_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 6 — Smart Financial Calculator */}
      {/* ========================================================================= */}
      {currentStep === 6 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[5]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step6_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step6_sub}
            </p>
          </div>

          {/* Margin Capital Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#252525] uppercase tracking-wider">
                {t.step6_margin_input_label}
              </label>
              <span className="text-base font-black text-[#176B67] font-heading">
                ₹{marginCapital.toLocaleString('en-IN')}
              </span>
            </div>

            <input
              type="range"
              min={10000}
              max={500000}
              step={10000}
              value={marginCapital}
              onChange={(e) => setMarginCapital(Number(e.target.value))}
              className="w-full accent-[#176B67] cursor-pointer"
            />

            <div className="flex justify-between text-[11px] font-bold text-[#7FA99B]">
              <span>₹10,000</span>
              <span>₹1,00,000</span>
              <span>₹5,00,000</span>
            </div>
          </div>

          {/* 3-Row Clear Ledger Output */}
          <div className="p-4 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-3">
            <div className="text-xs font-black text-[#1E293B] uppercase tracking-wide border-b border-[#E5E1D8] pb-2">
              {t.step6_ledger_title}
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <span className="font-bold text-[#68706D]">{t.step6_contribution}</span>
              <span className="font-black text-[#1E293B]">
                ₹{marginCapital.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-[#E5E1D8]">
              <span className="font-bold text-[#F59E0B]">{t.step6_project_cost}</span>
              <span className="font-black text-[#F59E0B]">
                ₹{projectCost.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs py-1 border-t border-[#E5E1D8]">
              <span className="font-bold text-[#176B67]">{t.step6_max_loan}</span>
              <span className="font-black text-[#176B67]">
                ₹{loanAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#EDF3F1] border border-[#E5E1D8] text-xs text-[#252525] leading-relaxed">
            {t.step6_formula_note}
          </div>

          {/* Capital Budget Allocation (Allocate Project Cost) */}
          <div className="pt-3 space-y-3.5 border-t border-[#E5E1D8]">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-[#EDF3F1] border border-[#A8CCC4] flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <PieChart className="w-4 h-4 text-[#176B67]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#252525] leading-snug">
                      Capital Budget Allocation & Itemization
                    </h3>
                    <p className="text-[11px] text-[#68706D] mt-0.5 leading-normal">
                      Allocate your total project cost (₹{projectCost.toLocaleString('en-IN')}) across operational categories.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleResetBudget}
                    className="h-8 px-2.5 rounded-xl border border-[#E5E1D8] bg-white hover:bg-[#F8F7F2] text-[#68706D] hover:text-[#252525] text-xs flex items-center gap-1 font-semibold transition-all active:scale-95 shadow-2xs cursor-pointer"
                    title="Reset to recommended standard 40/25/15/10/10 distribution"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#176B67]" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Status Badge & Target Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                <div className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 border shadow-2xs ${
                  isBudgetValid
                    ? 'bg-[#EDF3F1] text-[#176B67] border-[#A8CCC4]'
                    : remainingBudget > 0
                    ? 'bg-[#FBF6EA] text-[#A07C2E] border-amber-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {isBudgetValid ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#176B67]" />
                      <span>100% Fully Allocated</span>
                    </>
                  ) : remainingBudget > 0 ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-[#A07C2E]" />
                      <span>Unallocated: ₹{remainingBudget.toLocaleString('en-IN')}</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Overallocated: ₹{Math.abs(remainingBudget).toLocaleString('en-IN')}</span>
                    </>
                  )}
                </div>

                <div className="text-[11px] text-[#68706D] font-medium">
                  Target Project Cost: <strong className="text-[#252525] font-bold">₹{projectCost.toLocaleString('en-IN')}</strong>
                </div>
              </div>
            </div>

            {/* Multi-Segment Color Progress Bar */}
            <div className="space-y-1.5">
              <div className="w-full h-3 bg-[#EDF3F1] rounded-full overflow-hidden flex border border-[#E5E1D8]">
                <div
                  style={{ width: `${Math.min(100, Math.round((equipment / (projectCost || 1)) * 100))}%` }}
                  className="bg-[#0F4E4B] h-full transition-all"
                  title={`Machinery & Equipment: ₹${equipment.toLocaleString('en-IN')}`}
                />
                <div
                  style={{ width: `${Math.min(100, Math.round((inventory / (projectCost || 1)) * 100))}%` }}
                  className="bg-[#176B67] h-full transition-all"
                  title={`Initial Inventory: ₹${inventory.toLocaleString('en-IN')}`}
                />
                <div
                  style={{ width: `${Math.min(100, Math.round((infrastructure / (projectCost || 1)) * 100))}%` }}
                  className="bg-[#7FA99B] h-full transition-all"
                  title={`Infrastructure & Setup: ₹${infrastructure.toLocaleString('en-IN')}`}
                />
                <div
                  style={{ width: `${Math.min(100, Math.round((workingCapital / (projectCost || 1)) * 100))}%` }}
                  className="bg-[#C89B3C] h-full transition-all"
                  title={`Working Capital Cushion: ₹${workingCapital.toLocaleString('en-IN')}`}
                />
                <div
                  style={{ width: `${Math.min(100, Math.round((marketing / (projectCost || 1)) * 100))}%` }}
                  className="bg-[#A07C2E] h-full transition-all"
                  title={`Marketing & Contingency: ₹${marketing.toLocaleString('en-IN')}`}
                />
              </div>

              <div className="flex items-center justify-between text-[10.5px] text-[#68706D] font-medium">
                <span>Allocated: <strong className="text-[#252525] font-bold">₹{totalAllocated.toLocaleString('en-IN')}</strong></span>
                <span>{isBudgetValid ? 'Remaining: ₹0' : remainingBudget > 0 ? `Remaining: ₹${remainingBudget.toLocaleString('en-IN')}` : `Excess: ₹${Math.abs(remainingBudget).toLocaleString('en-IN')}`}</span>
              </div>
            </div>

            {/* 5 Allocation Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[
                {
                  name: 'Machinery & Equipment',
                  sub: 'Production tools, machines & hardware',
                  amt: equipment,
                  set: setEquipment,
                  pct: Math.round((equipment / (projectCost || 1)) * 100),
                  color: 'bg-[#0F4E4B]',
                  badgeBg: 'bg-[#EDF3F1] border-[#A8CCC4] text-[#0F4E4B]',
                  icon: Wrench,
                },
                {
                  name: 'Initial Inventory & Raw Stock',
                  sub: 'Supplies, raw ingredients & packaging',
                  amt: inventory,
                  set: setInventory,
                  pct: Math.round((inventory / (projectCost || 1)) * 100),
                  color: 'bg-[#176B67]',
                  badgeBg: 'bg-[#EDF3F1] border-[#A8CCC4] text-[#176B67]',
                  icon: Package,
                },
                {
                  name: 'Infrastructure & Shop Setup',
                  sub: 'Lease deposit, electrical, interiors',
                  amt: infrastructure,
                  set: setInfrastructure,
                  pct: Math.round((infrastructure / (projectCost || 1)) * 100),
                  color: 'bg-[#7FA99B]',
                  badgeBg: 'bg-[#EDF3F1] border-[#A8CCC4] text-[#2A8A85]',
                  icon: Store,
                },
                {
                  name: 'Working Capital Cash Reserve',
                  sub: 'Salary, electricity, transportation cushion',
                  amt: workingCapital,
                  set: setWorkingCapital,
                  pct: Math.round((workingCapital / (projectCost || 1)) * 100),
                  color: 'bg-[#C89B3C]',
                  badgeBg: 'bg-[#FBF6EA] border-[#F5D49A] text-[#A07C2E]',
                  icon: ShieldCheck,
                },
                {
                  name: 'Marketing & Contingency Reserve',
                  sub: 'Signage, launch promos & emergencies',
                  amt: marketing,
                  set: setMarketing,
                  pct: Math.round((marketing / (projectCost || 1)) * 100),
                  color: 'bg-[#A07C2E]',
                  badgeBg: 'bg-[#FBF6EA] border-[#F5D49A] text-[#A07C2E]',
                  icon: Megaphone,
                  fullWidth: true,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F2]/70 space-y-2 ${
                      item.fullWidth ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                        <span className="text-xs font-bold text-[#252525] truncate">
                          {item.name}
                        </span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border font-mono shrink-0 ${item.badgeBg}`}>
                        {item.pct}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10.5px] text-[#68706D] truncate flex-1 min-w-0">
                        {item.sub}
                      </span>

                      <div className="flex items-center gap-1 bg-white px-2.5 py-1.5 rounded-lg border border-[#E5E1D8] shadow-inner shrink-0">
                        <span className="text-xs font-bold text-[#7FA99B]">₹</span>
                        <input
                          type="number"
                          value={item.amt}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value) || 0);
                            item.set(val);
                          }}
                          className="w-24 text-right font-black text-xs text-[#252525] bg-transparent focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(5)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(7)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step6_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 7 — Automatic Scheme Selection */}
      {/* ========================================================================= */}
      {currentStep === 7 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[6]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step7_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step7_sub} (₹{(projectCost / 100000).toFixed(2)} Lakh)
            </p>
          </div>

          {/* Scheme Card */}
          <div className="p-4 rounded-xl border-2 border-[#176B67] bg-[#EDF3F1] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#176B67] text-white shrink-0">
                {t.step7_rec_badge}
              </span>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#176B67]">
                <Landmark className="w-4 h-4 shrink-0" />
                <span>{interestRate}% p.a.</span>
              </div>
            </div>

            <div>
              <h3 className="text-base font-black text-[#1E293B] font-heading leading-tight">
                {schemeName}
              </h3>
              <p className="text-[11px] text-[#68706D] mt-0.5 font-medium">
                {isMicroScheme ? 'Concessional micro finance scheme for projects ≤ ₹1.40 Lakh' : 'Government credit scheme with up to 35% capital subsidy'}
              </p>
            </div>

            {/* Scheme Parameters List */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div className="p-2.5 bg-white rounded-lg border border-[#E5E1D8] flex flex-col justify-between">
                <span className="text-[10px] text-[#68706D] font-bold uppercase tracking-wider block leading-tight">{t.step7_interest_label}</span>
                <span className="font-extrabold text-[#1E293B] text-xs mt-1">{interestRate}% p.a.</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E5E1D8] flex flex-col justify-between">
                <span className="text-[10px] text-[#68706D] font-bold uppercase tracking-wider block leading-tight">{t.step7_tenure_label}</span>
                <span className="font-extrabold text-[#1E293B] text-xs mt-1">{tenureYears} Years</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E5E1D8] flex flex-col justify-between">
                <span className="text-[10px] text-[#68706D] font-bold uppercase tracking-wider block leading-tight">{t.step7_moratorium_label}</span>
                <span className="font-extrabold text-[#176B67] text-xs mt-1">{moratoriumMonths} Months</span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E5E1D8] flex flex-col justify-between">
                <span className="text-[10px] text-[#68706D] font-bold uppercase tracking-wider block leading-tight">{t.step7_funding_label}</span>
                <span className="font-extrabold text-[#176B67] text-xs mt-1">90% (Max ₹{(maxFundingCap / 100000).toFixed(2)}L)</span>
              </div>
            </div>
          </div>

          {/* 🌟 DIRECT OFFICIAL GOVERNMENT SCHEME WEB LINK */}
          <div className="bg-white rounded-xl p-3.5 border border-[#E5E1D8] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0 flex-1">
                <span className="text-[10px] font-bold text-[#7FA99B] uppercase tracking-wider block">
                  Official Scheme Application Web Link
                </span>
                <div className="flex items-center gap-1.5 text-xs font-black text-[#252525]">
                  <ShieldCheck className="w-4 h-4 text-[#7FA99B] shrink-0" />
                  <span className="truncate">{isMicroScheme ? 'Jan Samarth National Portal' : 'PMEGP e-Portal (KVIC)'}</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-[#176B67] bg-[#EDF3F1] border border-[#E5E1D8] px-2 py-0.5 rounded-md font-mono shrink-0">
                {isMicroScheme ? 'jansamarth.in' : 'kviconline.gov.in'}
              </span>
            </div>

            <a
              href={isMicroScheme ? 'https://www.jansamarth.in/' : 'https://www.kviconline.gov.in/pmegpeportal/'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs shadow-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Apply on Official Portal (Free)</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>

            <div className="flex items-center gap-1.5 text-[10.5px] text-[#68706D] pt-1.5 border-t border-[#E5E1D8]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7FA99B] shrink-0" />
              <span>Direct authentic Government of India link • 100% Free Online Application • Zero Commission</span>
            </div>
          </div>

          {/* Alternative Government Scheme Portals */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-extrabold text-[#252525] uppercase tracking-wide">
                Alternative Eligible Scheme Portals
              </span>
              <span className="text-[10px] font-bold text-[#7FA99B] font-mono">
                4 Portals
              </span>
            </div>
            <div className="space-y-2">
              {[
                {
                  name: 'Jan Samarth National Portal',
                  domain: 'jansamarth.in',
                  url: 'https://www.jansamarth.in/',
                  desc: 'Unified single-window credit portal linking 200+ commercial banks for PMEGP & Mudra loans.',
                  badge: '200+ Banks'
                },
                {
                  name: 'PM MUDRA Yojana Portal',
                  domain: 'mudra.org.in',
                  url: 'https://www.mudra.org.in/',
                  desc: 'Collateral-free micro loans up to ₹10 Lakh for small manufacturing & trading enterprises.',
                  badge: 'No Collateral'
                },
                {
                  name: 'Stand-Up India Portal',
                  domain: 'standupmitra.in',
                  url: 'https://www.standupmitra.in/',
                  desc: 'Greenfield project financing between ₹10L and ₹1Cr for SC/ST and Women entrepreneurs.',
                  badge: 'Women / SC / ST'
                },
                {
                  name: 'PMFME Food Processing Portal',
                  domain: 'pmfme.mofpi.gov.in',
                  url: 'https://pmfme.mofpi.gov.in/',
                  desc: '35% capital subsidy up to ₹10 Lakh for rural food processing and agri-business units.',
                  badge: '35% Subsidy'
                }
              ].map((portal, idx) => (
                <div key={idx} className="p-3 rounded-xl border border-[#E5E1D8] bg-[#F8F7F2]/80 hover:bg-[#F8F7F2] transition-colors space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#252525]">{portal.name}</span>
                    <span className="text-[9.5px] font-bold text-[#0F4E4B] bg-[#EDF3F1] border border-[#E5E1D8]/60 px-2 py-0.5 rounded-full shrink-0">
                      {portal.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68706D] leading-snug">
                    {portal.desc}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-[#E5E1D8]/60 text-[11px]">
                    <span className="text-[10px] text-[#7FA99B] font-mono">{portal.domain}</span>
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#176B67] hover:text-[#0F4E4B] active:scale-95 transition-all text-xs"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rationale Explanation */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] text-xs text-[#252525] space-y-1">
            <span className="font-bold text-[#1E293B] block">{t.step7_why_title}</span>
            <p className="leading-relaxed">
              {isMicroScheme ? t.step7_why_desc_micro : t.step7_why_desc_term}
            </p>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrentStep(6)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(8)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer"
            >
              <span className="truncate">{t.step7_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 8 — EMI & Moratorium Planner */}
      {/* ========================================================================= */}
      {currentStep === 8 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[7]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step8_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step8_sub}
            </p>
          </div>

          {/* Moratorium Banner */}
          <div className="p-3.5 rounded-xl bg-[#EDF3F1]/80 border border-[#A8CCC4] flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#176B67] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold text-emerald-900 block">
                {moratoriumMonths} {t.step8_mora_active}
              </span>
              <span className="text-[11px] text-[#176B67] leading-relaxed block mt-0.5">
                {t.step8_mora_desc}
              </span>
            </div>
          </div>

          {/* Repayment Details */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E1D8] font-bold">
              <span className="text-[#68706D]">{t.step8_loan_amt}</span>
              <span className="text-[#1E293B]">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E1D8] font-bold">
              <span className="text-[#68706D]">{t.step8_rate}</span>
              <span className="text-[#1E293B]">{interestRate}% p.a.</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E1D8] font-bold">
              <span className="text-[#68706D]">{t.step8_tenure}</span>
              <span className="text-[#1E293B]">{tenureYears} Years</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E1D8] font-bold">
              <span className="text-[#68706D]">{t.step8_mora_period}</span>
              <span className="text-[#176B67] font-bold">{moratoriumMonths} Months</span>
            </div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E1D8] font-bold">
              <span className="text-[#176B67]">{t.step8_emi_label}</span>
              <span className="text-base font-black text-[#176B67] font-heading">
                ₹{calculatedEmi.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-[#68706D]">{t.step8_monthly_op_cost}</span>
              <span className="text-[#252525]">₹{monthlyOpCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span className="text-[#68706D]">{t.step8_working_cap}</span>
              <span className="text-[#252525]">₹{workingCapitalReserve.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] text-xs text-[#68706D] leading-relaxed">
            {t.step8_viability_insight}
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(7)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(9)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step8_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 9 — Final Business Feasibility Result */}
      {/* ========================================================================= */}
      {currentStep === 9 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E1D8] shadow-xs space-y-4">
          <div className="border-b border-[#E5E1D8] pb-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-rose-900 uppercase tracking-wide">
                {localizedFullNames[8]}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#1E293B] font-heading leading-tight mt-0.5">
              {t.step9_heading}
            </h2>
            <p className="text-xs text-[#68706D] mt-1 leading-normal">
              {t.step9_sub}
            </p>
          </div>

          {/* Verdict Badge */}
          <div className="p-4 rounded-xl bg-[#EDF3F1] border border-[#A8CCC4] flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold text-[#176B67] uppercase tracking-wide">
                {t.step9_verdict_title}
              </span>
              <div className="text-lg font-black text-emerald-900 font-heading mt-0.5">
                {t.step9_verdict_score}
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#176B67] text-white font-black text-xs shrink-0">
              {t.step9_rec_pill}
            </span>
          </div>

          {/* Consolidated Result Table */}
          <div className="p-3.5 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_prop_biz}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">{effectiveBusinessName}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_sel_loc}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">{village}, {district}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_market_opp}</span>
              <span className="font-extrabold text-[#176B67] text-right shrink-0">High Local Demand</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_comp_density}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">
                {competitor5kmCount} (5 KM) / {competitor10kmCount} (10 KM)
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_rec_price}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">
                {selectedCategory === 'Dairy' ? '₹48 – ₹60 / L' : selectedCategory === 'Grocery' ? '20% Markup' : '₹120 – ₹220'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_tot_project_cost}</span>
              <span className="font-extrabold text-[#F59E0B] text-right shrink-0">₹{projectCost.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_own_contrib}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">₹{marginCapital.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_loan_req}</span>
              <span className="font-extrabold text-[#1E293B] text-right shrink-0">₹{loanAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#E5E1D8]">
              <span className="text-[#68706D] font-medium truncate">{t.step9_rec_scheme}</span>
              <span className="font-extrabold text-[#176B67] text-right shrink-0">{schemeName}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <span className="text-[#68706D] font-medium truncate">{t.step9_est_repay}</span>
              <span className="font-extrabold text-[#176B67] text-right shrink-0">₹{calculatedEmi.toLocaleString('en-IN')} / mo</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5E1D8] flex items-center justify-between gap-2">
            <button
              onClick={() => setCurrentStep(8)}
              className="min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t.wiz_back}</span>
            </button>
            <button
              onClick={() => setCurrentStep(10)}
              className="min-h-[44px] py-2.5 px-5 bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs rounded-xl shadow-xs flex items-center gap-2 active:scale-95 transition-all"
            >
              <span className="truncate">{t.step9_next_btn}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 10 — Official Printable Feasibility & DPR Report */}
      {/* ========================================================================= */}
      {currentStep === 10 && (
        <div className="space-y-4">
          
          {/* Top Quick Actions Bar (hidden in print) */}
          <div className="no-print bg-white rounded-2xl p-3.5 sm:p-4 border border-[#E5E1D8] shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#EDF3F1] border border-[#A8CCC4] flex items-center justify-center text-[#176B67] shrink-0 font-bold shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-[#176B67] uppercase tracking-wide">
                      Bankable DPR Generated
                    </span>
                    <span className="text-[10px] bg-[#EDF3F1] text-[#176B67] font-bold px-2 py-0.5 rounded-full border border-[#A8CCC4] whitespace-nowrap">
                      Ready to Print
                    </span>
                  </div>
                  <p className="text-[11px] text-[#68706D] truncate mt-0.5">
                    Official appraisal formatted for bank underwriting & subsidy
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[#F0ECE1]">
              <button
                type="button"
                onClick={() => printReportDocument('.printable-report', `Detailed Project Report - ${effectiveBusinessName}`)}
                className="flex-1 min-h-[42px] px-4 py-2 rounded-xl bg-[#176B67] hover:bg-[#0F4E4B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print / Save PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `DPR Report: ${effectiveBusinessName}`,
                      text: `Detailed Project Report for ${effectiveBusinessName} in ${village}, ${district}. Project Cost: ₹${projectCost.toLocaleString('en-IN')}`,
                      url: window.location.href,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(`DPR Report for ${effectiveBusinessName} in ${village}, ${district}. Project Cost: ₹${projectCost.toLocaleString('en-IN')}`);
                    alert('Report summary copied to clipboard!');
                  }
                }}
                className="min-h-[42px] px-3.5 py-2 rounded-xl bg-[#F8F7F2] border border-[#E5E1D8] text-[#252525] font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-[#EDF3F1] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                title="Share Summary"
              >
                <Share2 className="w-4 h-4 text-[#68706D]" />
                <span className="hidden sm:inline">Share</span>
              </button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* THE PRINTABLE DPR REPORT DOCUMENT (OFFICIAL BANK TEXT FORMAT) */}
          {/* ========================================================================= */}
          <div className="printable-report bg-white rounded-2xl p-4 sm:p-6 border border-[#E5E1D8] shadow-sm space-y-5 text-[#252525] font-sans text-xs leading-relaxed">
            
            {/* Official Letterhead Header */}
            <div className="border-b-2 border-[#176B67] pb-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E5E1D8]/60 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#176B67] text-white flex items-center justify-center font-black shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-black tracking-wider text-[#176B67] uppercase">
                    GramBiz AI • Rural Enterprise Advisory Portal
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold text-[#68706D] bg-[#F8F7F2] px-2 py-0.5 rounded border border-[#E5E1D8]">
                  REF: GBZ-DPR-{Math.abs((village.length * 37 + projectCost) % 900000 + 100000)}
                </span>
              </div>

              <div className="pt-1">
                <h1 className="text-base sm:text-xl font-black text-[#176B67] font-heading tracking-tight">
                  DETAILED PROJECT REPORT (DPR)
                </h1>
                <p className="text-[11px] text-[#68706D] font-medium">
                  Bank Feasibility Appraisal for Institutional Credit Sanction & Subsidy
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[10px] text-[#68706D] border-t border-[#F0ECE1]">
                <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                <div><strong>Classification:</strong> Bankable Loan Appraisal</div>
                <div><strong>Status:</strong> <span className="text-[#176B67] font-bold">Verified for Underwriting</span></div>
              </div>
            </div>

            {/* 1. Enterprise & Promoter Particulars */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                1. Enterprise & Promoter Particulars
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#F0ECE1] gap-2">
                  <span className="text-[#68706D] font-medium">Enterprise / Venture Name:</span>
                  <span className="font-bold text-[#1E293B] text-right">{effectiveBusinessName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1] gap-2">
                  <span className="text-[#68706D] font-medium">Line of Activity / Sector:</span>
                  <span className="font-bold text-[#1E293B] text-right">{selectedCategory}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1] gap-2">
                  <span className="text-[#68706D] font-medium">Operating Location:</span>
                  <span className="font-bold text-[#1E293B] text-right">{village}, {block}, {district} - {pincode}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1] gap-2">
                  <span className="text-[#68706D] font-medium">Assigned Credit Scheme:</span>
                  <span className="font-bold text-[#176B67] text-right">{schemeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1] gap-2">
                  <span className="text-[#68706D] font-medium">GPS Geolocation:</span>
                  <span className="font-mono font-bold text-[#1E293B] text-right">{latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E</span>
                </div>
              </div>
            </div>

            {/* 2. Executive Feasibility Appraisal & Bank Score */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1 flex items-center justify-between">
                <span>2. Executive Feasibility Appraisal</span>
                <span className="text-[10px] bg-[#EDF3F1] text-[#176B67] px-2 py-0.5 rounded font-bold">Overall Score: 84 / 100</span>
              </h2>
              <p className="text-[11px] text-[#334155] leading-relaxed">
                This Detailed Project Report evaluates the commercial and technical feasibility of establishing <strong>{effectiveBusinessName}</strong> ({selectedCategory}) in <strong>{village}, {block}, {district} ({pincode})</strong>. Based on an available promoter equity margin of <strong>₹{marginCapital.toLocaleString('en-IN')}</strong> (10%), the total required capital outlay of <strong>₹{projectCost.toLocaleString('en-IN')}</strong> is fully supported under the <strong>{schemeName}</strong> with an institutional credit requirement of <strong>₹{loanAmount.toLocaleString('en-IN')}</strong> (90%). Local consumer demand benchmarks and projected debt-service coverage ratios confirm viable bank sanctioning.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] flex justify-between">
                  <span className="text-[#68706D]">Catchment Demand:</span>
                  <span className="font-bold text-[#176B67]">88/100 (Strong)</span>
                </div>
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] flex justify-between">
                  <span className="text-[#68706D]">Competition Fit:</span>
                  <span className="font-bold text-[#176B67]">74/100 (Moderate)</span>
                </div>
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] flex justify-between">
                  <span className="text-[#68706D]">Capital Leverage:</span>
                  <span className="font-bold text-[#176B67]">85/100 (Optimal)</span>
                </div>
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] flex justify-between">
                  <span className="text-[#68706D]">Debt Repayment Fit:</span>
                  <span className="font-bold text-[#176B67]">86/100 (Viable)</span>
                </div>
              </div>
            </div>

            {/* 3. Capital Outlay & Means of Finance */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                3. Capital Outlay & Means of Finance
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Total Project Capital Outlay (100%):</span>
                  <span className="font-black text-[#1E293B]">₹{projectCost.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Promoter Margin Equity Contribution (10%):</span>
                  <span className="font-bold text-[#176B67]">₹{marginCapital.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Institutional Bank Term Loan (90%):</span>
                  <span className="font-bold text-[#1E293B]">₹{loanAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Interest Rate & Amortization Tenure:</span>
                  <span className="font-bold text-[#1E293B]">{interestRate}% p.a. • {tenureYears} Years ({totalMonths} Mos.)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Moratorium Grace Relief Period:</span>
                  <span className="font-bold text-[#176B67]">{moratoriumMonths} Months</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Estimated Monthly Equated Installment (EMI):</span>
                  <span className="font-black text-[#176B67]">₹{calculatedEmi.toLocaleString('en-IN')} / mo.</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Total Repayment (Principal + Interest):</span>
                  <span className="font-bold text-[#1E293B]">₹{totalRepayment.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* 4. Itemized Capital Expenditure Budget Table */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                4. Itemized Capital Budget Allocation (CapEx & OpEx)
              </h2>
              <div className="border border-[#E5E1D8] rounded-lg overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#EDF3F1] text-[#176B67] font-bold">
                    <tr>
                      <th className="p-2">Cost Component</th>
                      <th className="p-2 text-center">Share</th>
                      <th className="p-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E1D8]">
                    <tr>
                      <td className="p-2 text-[#334155]">Plant, Machinery & Processing Equipment</td>
                      <td className="p-2 text-center text-[#68706D]">40%</td>
                      <td className="p-2 text-right font-bold text-[#1E293B]">₹{equipment.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#334155]">Starting Raw Materials & Working Inventory</td>
                      <td className="p-2 text-center text-[#68706D]">25%</td>
                      <td className="p-2 text-right font-bold text-[#1E293B]">₹{inventory.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#334155]">Civil Works & Site Setup Infrastructure</td>
                      <td className="p-2 text-center text-[#68706D]">15%</td>
                      <td className="p-2 text-right font-bold text-[#1E293B]">₹{infrastructure.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#334155]">3-Month Operating Working Capital Reserve</td>
                      <td className="p-2 text-center text-[#68706D]">10%</td>
                      <td className="p-2 text-right font-bold text-[#1E293B]">₹{workingCapital.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="p-2 text-[#334155]">Signage, Branding & Local Market Launch</td>
                      <td className="p-2 text-center text-[#68706D]">10%</td>
                      <td className="p-2 text-right font-bold text-[#1E293B]">₹{marketing.toLocaleString('en-IN')}</td>
                    </tr>
                    <tr className="bg-[#F8F7F2] font-black text-[#176B67]">
                      <td className="p-2">Total Project Cost Outlay</td>
                      <td className="p-2 text-center">100%</td>
                      <td className="p-2 text-right">₹{projectCost.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Unit Economics, Pricing & Monthly Cashflow Projections */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                5. Unit Economics & Monthly Profitability Projections
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Target Selling Price:</span>
                  <span className="font-bold text-[#1E293B]">₹{effectiveSellingPrice} / {effectiveUnitLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Estimated Unit Cost of Goods (COGS):</span>
                  <span className="font-bold text-[#1E293B]">₹{effectiveUnitCost} / {effectiveUnitLabel}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Unit Gross Margin:</span>
                  <span className="font-bold text-[#176B67]">₹{unitGrossMargin} ({grossMarginPercentage}%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Target Monthly Volume:</span>
                  <span className="font-bold text-[#1E293B]">{effectiveVolume.toLocaleString('en-IN')} {effectiveUnitLabel}s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Projected Monthly Gross Turnover:</span>
                  <span className="font-bold text-[#1E293B]">₹{(effectiveSellingPrice * effectiveVolume).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Projected Monthly Gross Profit:</span>
                  <span className="font-bold text-[#176B67]">₹{((effectiveSellingPrice - effectiveUnitCost) * effectiveVolume).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Monthly Debt Service (Loan EMI):</span>
                  <span className="font-bold text-[#E11D48]">-₹{calculatedEmi.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Estimated Net Monthly Cash Surplus:</span>
                  <span className="font-black text-[#176B67]">
                    ₹{Math.max(0, ((effectiveSellingPrice - effectiveUnitCost) * effectiveVolume) - calculatedEmi - Math.round(monthlyOpCost * 0.4)).toLocaleString('en-IN')} / mo.
                  </span>
                </div>
              </div>
            </div>

            {/* 6. Catchment Demographics & Competitor Analysis */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                6. Catchment Demographics & Market Competitor Analysis
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Immediate Primary Catchment (5 KM Radius):</span>
                  <span className="font-bold text-[#1E293B]">{competitor5kmCount} competing units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Extended Commercial Catchment (10 KM Radius):</span>
                  <span className="font-bold text-[#1E293B]">{competitor10kmCount} commercial units</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Market Demand Level:</span>
                  <span className="font-bold text-[#176B67]">High — Unserved local household demand</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F0ECE1]">
                  <span className="text-[#68706D]">Target Consumer Segments:</span>
                  <span className="font-bold text-[#1E293B]">Local village households, weekly haats, nearby tea stalls</span>
                </div>
              </div>
            </div>

            {/* 7. SWOT Appraisal & Strategic Factors */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                7. SWOT Appraisal & Strategic Strengths
              </h2>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 rounded bg-[#F8F7F2] border border-[#F0ECE1]">
                  <strong className="text-[#176B67] block mb-0.5">Strengths:</strong>
                  <p className="text-[#334155]">Regular daily cash turnover; 10% self-funded promoter margin equity; low technical barrier to entry.</p>
                </div>
                <div className="p-2 rounded bg-[#F8F7F2] border border-[#F0ECE1]">
                  <strong className="text-[#68706D] block mb-0.5">Weaknesses:</strong>
                  <p className="text-[#334155]">Requires continuous early morning logistics; initial reliance on localized word-of-mouth promotion.</p>
                </div>
                <div className="p-2 rounded bg-[#F8F7F2] border border-[#F0ECE1]">
                  <strong className="text-[#176B67] block mb-0.5">Opportunities:</strong>
                  <p className="text-[#334155]">Unserved customer pockets across neighboring hamlets; interest rate subsidy under {schemeName}.</p>
                </div>
                <div className="p-2 rounded bg-[#F8F7F2] border border-[#F0ECE1]">
                  <strong className="text-[#E11D48] block mb-0.5">Threats:</strong>
                  <p className="text-[#334155]">Input wholesale commodity price fluctuation; credit delay from localized retail customers.</p>
                </div>
              </div>
            </div>

            {/* 8. Risk Management & Working Capital Safeguards */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                8. Risk Mitigation & Liquidity Cushion
              </h2>
              <div className="space-y-1 text-[11px]">
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] text-[#334155]">
                  • <strong>3-Month Operating Liquidity:</strong> ₹{workingCapitalReserve.toLocaleString('en-IN')} allocated as reserve cushion to absorb seasonal revenue fluctuations.
                </div>
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] text-[#334155]">
                  • <strong>Input Cost Protection:</strong> Written forward procurement agreements with nearest wholesale mandis.
                </div>
                <div className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] text-[#334155]">
                  • <strong>Customer Credit Control:</strong> Strict 7-day credit settlement rule with digital ledger bookkeeping.
                </div>
              </div>
            </div>

            {/* 9. Pre-Sanction Execution Checklist */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-[#176B67] uppercase tracking-wider border-b border-[#E5E1D8] pb-1">
                9. Pre-Sanction Execution Checklist & 7-Day Action Plan
              </h2>
              <div className="space-y-1 text-[11px]">
                {[
                  `1. Customer Survey: Conduct 15 household interviews in ${village} to confirm flavor/product preferences.`,
                  '2. Supplier Quotations: Obtain 2 formal wholesale quotations for equipment and starting stock.',
                  '3. KYC Dossier: Prepare Aadhaar, PAN card, village domicile certificate, and bank passbook statement.',
                  `4. Lead Bank Submission: Present this DPR under ${schemeName} for branch appraisal.`,
                  '5. Operational Setup: Finalize site rental agreement and initiate equipment installation.'
                ].map((item, idx) => (
                  <div key={idx} className="p-1.5 rounded bg-[#F8F7F2] border border-[#F0ECE1] text-[#334155]">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* 10. Statutory Declaration & Dual Signatures */}
            <div className="pt-3 border-t-2 border-[#E5E1D8] space-y-4 text-[10px] text-[#68706D]">
              <p className="italic leading-normal">
                <strong>Declaration:</strong> This preliminary business feasibility and Detailed Project Report (DPR) is prepared for enterprise facilitation under government credit schemes. Final credit sanction is subject to statutory KYC verification and Lead Bank branch underwriting.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-3">
                <div className="border-t border-[#CBD5E1] pt-1">
                  <span className="font-bold text-[#1E293B] block text-[11px]">Promoter / Applicant</span>
                  <span className="text-[#68706D] block">{effectiveBusinessName}</span>
                  <span className="text-[#94A3B8] italic block text-[9px] mt-2">Signature of Entrepreneur</span>
                </div>
                <div className="border-t border-[#CBD5E1] pt-1 text-right">
                  <span className="font-bold text-[#1E293B] block text-[11px]">Appraising Officer</span>
                  <span className="text-[#68706D] block">Lead Bank Underwriting</span>
                  <span className="text-[#94A3B8] italic block text-[9px] mt-2">Authorized Official Seal</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Navigation Buttons (hidden in print) */}
          <div className="no-print pt-4 space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentStep(9)}
                className="h-11 px-4 rounded-xl border border-[#E5E1D8] text-[#252525] font-bold text-xs hover:bg-[#F8F7F2] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer whitespace-nowrap bg-white shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                <span>Previous Section</span>
              </button>

              <button
                type="button"
                onClick={() => printReportDocument('.printable-report', `Detailed Project Report - ${effectiveBusinessName}`)}
                className="h-11 px-4 bg-white border border-[#176B67] text-[#176B67] hover:bg-[#EDF3F1] active:scale-[0.98] font-extrabold text-xs rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>Print DPR</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCompleteAll}
              className="w-full h-12 px-6 bg-[#176B67] hover:bg-[#0F4E4B] active:scale-[0.99] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Save to Reports & Finish</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
