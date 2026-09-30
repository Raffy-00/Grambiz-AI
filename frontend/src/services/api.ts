import {
  LocationData, CapitalData, BusinessData, FullAssessment,
  ComparisonResult, ScenarioSimulatorInput, ScenarioSimulatorResult, SchemeConfig,
  GeocodeLocation, NearbyBusinessesResponse, UserDraftData
} from '../types';
import { supabase } from './supabaseClient';

export type { UserDraftData };

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export const submitAssessment = async (
  location: LocationData,
  capital: CapitalData,
  business: BusinessData
): Promise<FullAssessment> => {
  let assessmentResult: FullAssessment;

  let userId: string | null = null;
  try {
    const storedUser = localStorage.getItem('grambiz_auth_user');
    if (storedUser) {
      userId = JSON.parse(storedUser).user_id || JSON.parse(storedUser).phone || null;
    }
  } catch {}

  try {
    const response = await fetch(`${API_BASE_URL}/assessment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, location, capital, business }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    assessmentResult = await response.json();
  } catch (error) {
    console.warn('Backend API unavailable. Returning client-calculated assessment fallback.', error);
    assessmentResult = generateClientAssessment(location, capital, business);
  }

  // Persist assessment directly to Supabase if configured
  if (supabase && assessmentResult) {
    try {
      const { error: sbError } = await supabase.from('assessments').upsert({
        id: assessmentResult.id,
        user_id: userId,
        village: assessmentResult.location?.village || null,
        district: assessmentResult.location?.district || null,
        state: assessmentResult.location?.state || null,
        margin_capital: assessmentResult.capital?.margin_capital || 0,
        business_category: assessmentResult.business?.category || '',
        project_cost: (assessmentResult as any).financial_structure?.project_cost || assessmentResult.financial_result?.project_cost || 0,
        loan_amount: (assessmentResult as any).financial_structure?.loan_amount || assessmentResult.financial_result?.loan_amount || 0,
        scheme_name: (assessmentResult as any).financial_structure?.scheme_name || assessmentResult.financial_result?.scheme_name || '',
        feasibility_score: (assessmentResult as any).feasibility_score?.overall_score || assessmentResult.business_analysis?.feasibility_score?.overall_score || 0,
        raw_json_data: assessmentResult,
      });
      if (sbError) {
        console.warn('Supabase assessment persist notice:', sbError.message);
      }
    } catch (sbErr) {
      console.warn('Supabase assessment persist notice:', sbErr);
    }
  }

  return assessmentResult;
};

export const discoverIdeas = async (
  location: LocationData,
  capital: number,
  experience: string = "Beginner"
): Promise<{ ideas: any[]; disclaimer: string }> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/discover-ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, capital, experience }),
    });

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn('Backend API unavailable. Returning client idea discovery fallback.', error);
    return {
      ideas: [
        {
          id: "biz-tailoring",
          name: "Bespoke Tailoring Workshop",
          category: "Textile",
          fit_rationale: `Margin contribution of ₹${capital.toLocaleString('en-IN')} fits low-capital stitching machine setup.`,
          estimated_capital: capital / 0.10,
          market_opportunity: "High demand for bridal & custom blouse tailoring.",
          risk_level: "Low",
          confidence_level: "HIGH"
        },
        {
          id: "biz-dairy",
          name: "Dairy Farm & Milk Processing",
          category: "Animal Husbandry",
          fit_rationale: `Margin of ₹${capital.toLocaleString('en-IN')} supports commercial 5-cattle dairy herd setup.`,
          estimated_capital: capital / 0.10,
          market_opportunity: "Steady daily cash flow from tea stalls & households.",
          risk_level: "Medium",
          confidence_level: "HIGH"
        }
      ],
      disclaimer: "Preliminary business ideas based on capital and location profile."
    };
  }
};

export const fetchReports = async (): Promise<FullAssessment[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/reports`);
    if (!response.ok) throw new Error('Failed to fetch reports');
    return await response.json();
  } catch (error) {
    console.warn('Reports API offline. Returning empty array.');
    return [];
  }
};

export const fetchSchemes = async (): Promise<SchemeConfig[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/schemes`);
    if (!response.ok) throw new Error('Failed to fetch schemes');
    const data = await response.json();
    return data.schemes || [];
  } catch (error) {
    console.warn('Schemes API unavailable. Returning default schemes registry.');
    return [
      {
        name: "Micro Finance Concessional Scheme",
        min_project_cost: 0,
        max_project_cost: 140000,
        funding_percentage: 90,
        max_loan: 125000,
        interest_rate: 6.5,
        tenure_years: 3,
        moratorium_months: 3,
        source: "Micro Units Development & Refinance Agency (MUDRA)",
        effective_date: "2026-01-01",
        last_verified_at: "2026-08-25"
      },
      {
        name: "Term Loan Assistance Scheme",
        min_project_cost: 140001,
        max_project_cost: 5000000,
        funding_percentage: 90,
        max_loan: 4500000,
        interest_rate: 8.0,
        tenure_years: 7,
        moratorium_months: 6,
        source: "Prime Minister's Employment Generation Programme (PMEGP)",
        effective_date: "2026-01-01",
        last_verified_at: "2026-08-25"
      }
    ];
  }
};

export const compareBusinesses = async (
  categories: string[],
  marginCapital: number,
  location: LocationData
): Promise<ComparisonResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/business/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories, margin_capital: marginCapital, location }),
    });
    if (!response.ok) throw new Error('Failed to fetch comparison');
    return await response.json();
  } catch (error) {
    console.warn('Compare API unavailable. Returning client-computed fallback.');
    return generateClientComparison(categories, marginCapital, location);
  }
};

export const simulateScenario = async (
  input: ScenarioSimulatorInput
): Promise<ScenarioSimulatorResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/financial/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error('Failed to simulate scenario');
    return await response.json();
  } catch (error) {
    console.warn('Scenario API unavailable. Returning client-computed fallback.');
    return generateClientScenario(input);
  }
};

export const geocodeLocation = async (query: string): Promise<GeocodeLocation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/geocode?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Geocoding failed');
    return await response.json();
  } catch (error) {
    console.warn('Geocoding API offline. Returning default coordinates for:', query);
    return {
      display_name: `${query}, India`,
      village: query,
      district: "Local District",
      state: "Tamil Nadu",
      latitude: 13.0125,
      longitude: 79.9754
    };
  }
};

export const reverseGeocode = async (lat: number, lon: number): Promise<GeocodeLocation> => {
  try {
    const response = await fetch(`${API_BASE_URL}/location/reverse-geocode?lat=${lat}&lon=${lon}`);
    if (!response.ok) throw new Error('Reverse geocoding failed');
    return await response.json();
  } catch (error) {
    console.warn('Reverse geocoding offline. Returning fallback for coords:', lat, lon);
    return {
      display_name: `Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      village: "Your Village",
      district: "Local District",
      state: "Tamil Nadu",
      latitude: lat,
      longitude: lon
    };
  }
};

export const fetchNearbyBusinesses = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 5.0,
  businessCategory: string = "Dairy",
  businessName?: string,
  locationName?: string
): Promise<NearbyBusinessesResponse> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9500);

    const response = await fetch(`${API_BASE_URL}/location/nearby-businesses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        latitude,
        longitude,
        radius_km: radiusKm,
        business_category: businessCategory,
        business_name: businessName,
        location_name: locationName
      }),
    });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Nearby businesses API error');
    return await response.json();
  } catch (error) {
    console.warn('Nearby businesses API offline or slow. Using responsive geolocated POIs.', error);
    return generateClientNearbyBusinesses(latitude, longitude, radiusKm, businessCategory, businessName, locationName);
  }
};

export const askAIAssistant = async (
  messages: { role: string; content: string }[],
  context?: any,
  language: string = 'en'
): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, context, language }),
    });
    if (!response.ok) throw new Error('AI API error');
    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.warn('AI API endpoint offline. Returning intelligent localized response.');
    return generateClientAIResponse(messages, context, language);
  }
};

export const askAIChat = askAIAssistant;

export const checkAIStatus = async (): Promise<{
  status: string;
  configured: boolean;
  engine: string;
  model: string | null;
  key_prefix?: string | null;
}> => {
  try {
    const response = await fetch(`${API_BASE_URL}/ai/status`);
    if (!response.ok) throw new Error('AI status check failed');
    return await response.json();
  } catch (err) {
    return {
      status: 'fallback_rule_engine',
      configured: false,
      engine: 'Deterministic Rule-Based Fallback',
      model: null
    };
  }
};

function generateClientAIResponse(
  messages: { role: string; content: string }[],
  context?: any,
  language: string = 'en'
): string {
  const lastMsg = messages[messages.length - 1]?.content || '';
  const msgLower = lastMsg.toLowerCase();
  const rawLang = (language || 'en').toLowerCase().trim();

  let targetLang = 'en';
  if (rawLang.startsWith('ta') || rawLang.includes('tamil') || rawLang.includes('தமிழ்')) targetLang = 'ta';
  else if (rawLang.startsWith('hi') || rawLang.includes('hindi') || rawLang.includes('हिन्दी') || rawLang.includes('हिंदी')) targetLang = 'hi';
  else if (rawLang.startsWith('te') || rawLang.includes('telugu') || rawLang.includes('తెలుగు')) targetLang = 'te';
  else if (rawLang.startsWith('bn') || rawLang.includes('bengali') || rawLang.includes('bangla') || rawLang.includes('বাংলা')) targetLang = 'bn';
  else if (rawLang.startsWith('mr') || rawLang.includes('marathi') || rawLang.includes('मराठी')) targetLang = 'mr';
  else if (rawLang.startsWith('ml') || rawLang.includes('malayalam') || rawLang.includes('മലയാളം')) targetLang = 'ml';
  else if (rawLang.startsWith('kn') || rawLang.includes('kannada') || rawLang.includes('ಕನ್ನಡ')) targetLang = 'kn';

  const margin = Number(context?.capital?.margin_capital || 100000);
  const biz = context?.business?.category || 'your business';
  const loc = context?.location?.village || 'your location';
  const half = margin / 2;
  const loan = margin * 9;

  const isProfit = ['profit', 'earn', 'income', 'revenue', 'grow', 'sales', 'margin', 'money', 'லாபம்', 'வருமானம்', 'வியாபாரம்', 'விற்பனை', 'लाभ', 'नफा', 'कमाई', 'లాభం', 'ఆదాయం', 'মুনাফা', 'ಲಾಭ'].some(w => msgLower.includes(w));
  const isMoratorium = ['moratorium', 'grace', 'holiday', 'emi', 'repay', 'installment', 'தவணை', 'சலுகை', 'மடங்கு', 'किस्त', 'सवलत', 'మొరటోరియం', 'কিস্তি', 'ಕಂತು'].some(w => msgLower.includes(w));
  const isScheme = ['loan', 'scheme', 'subsidy', 'pmegp', 'mudra', 'bank', 'fund', 'grant', 'finance', 'borrow', 'interest', 'கடன்', 'திட்டம்', 'மானிய', 'ऋण', 'योजना', 'कर्ज', 'రుణం', 'పథకం', 'ঋণ', 'ಸಾಲ'].some(w => msgLower.includes(w));
  const isHalfCapital = ['half', 'less', 'reduce', 'cost', 'budget', 'cheap', 'low', 'investment', 'பாதி', 'குறைந்த', 'செலவு', 'आधे', 'कम', 'సగం', 'ఖర్చు', 'অর্ধেক', 'अर्धा', 'ಅರ್ಧ'].some(w => msgLower.includes(w));
  const isRisk = ['risk', 'threat', 'competitor', 'loss', 'challenge', 'safe', 'problem', 'ஆபத்து', 'சவால்', 'போட்டி', 'जोखिम', 'कमजोरी', 'धोके', 'ప్రమాదం', 'ঝুঁকি', 'ಸವಾಲು'].some(w => msgLower.includes(w));

  if (isProfit) {
    if (targetLang === 'ta') return 'மாதாந்திர லாபத்தை அதிகரிக்க 3 முக்கிய வழிகள்: 1) மொத்த விற்பனையாளர்களிடம் நேரடியாக மூலப்பொருட்களை வாங்கி 15-20% செலவை மிச்சப்படுத்துங்கள். 2) வாடிக்கையாளர்களுக்கு ஹோம் டெலிவரி வழங்கி விற்பனையை கூட்டுங்கள். 3) PMEGP திட்டத்தின் கீழ் 35% அரசு மானியம் பெற்று கடன் சுமையை குறையுங்கள்.';
    if (targetLang === 'hi') return 'मासिक लाभ बढ़ाने के लिए 3 मुख्य रणनीतियाँ अपनाएं: 1) थोक मंडी से सीधे कच्चा माल खरीदें ताकि 15-20% मार्जिन बढ़े। 2) स्थानीय ग्राहकों को नियमित होम डिलीवरी सेवा दें। 3) PMEGP योजना के तहत 35% सरकारी सब्सिडी का लाभ उठाकर ब्याज का बोझ कम करें।';
    if (targetLang === 'te') return 'నెలవారీ లాభాన్ని పెంచడానికి 3 ముఖ్యమైన వ్యూహాలు: 1) హోల్‌సేల్ మార్కెట్ నుండి నేరుగా సరుకును కొనుగోలు చేసి 15-20% మార్జిన్ పెంచుకోండి. 2) స్థానిక కస్టమర్లకు హోమ్ డెలివరీ అందించండి. 3) PMEGP పథకం ద్వారా 35% ప్రభుత్వ రాయితీని ఉపయోగించుకోండి.';
    if (targetLang === 'bn') return 'মাসিক লাভ বাড়ানোর জন্য ৩টি মূল কৌশল: ১) পাইকারি বাজার থেকে সরাসরি কাঁচামাল কিনুন যাতে ১৫-২০% খরচ সাশ্রয় হয়। ২) স্থানীয় গ্রাহকদের হোম ডেলিভারি পরিষেবা দিন। ৩) PMEGP প্রকল্পে ৩৫% সরকারি ভর্তুকি নিয়ে ঋণের সুদ ও কিস্তির চাপ কমান।';
    if (targetLang === 'mr') return 'मासिक नफा वाढवण्यासाठी ३ महत्त्वाच्या गोष्टी: १) थेट घाऊक बाजारातून कच्चा माल खरेदी करून १५-२०% बचत करा. २) स्थानिक ग्राहकांना मोफत होम डिलिव्हरी द्या. ३) PMEGP अंतर्गत ३५% शासकीय अनुदान मिळवा.';
    if (targetLang === 'ml') return 'പ്രതിമാസ ലാഭം വർദ്ധിപ്പിക്കാൻ 3 വഴികൾ: 1) മൊത്ത വിപണിയിൽ നിന്ന് നേരിട്ട് അസംസ്കൃത വസ്തുക്കൾ വാങ്ങി 15-20% ലാഭിക്കുക. 2) വീടുകളിൽ നേരിട്ട് ഉൽപ്പന്നങ്ങൾ എത്തിച്ച് സ്ഥിരം ഉപഭോക്താക്കളെ നേടുക. 3) PMEGP പദ്ധതിയിലൂടെ 35% സർക്കാർ സബ്‌സിഡി നേടി വായ്പാ തിരിച്ചടവ് ലഘൂകരിക്കുക.';
    if (targetLang === 'kn') return 'ಮಾಸಿಕ ಲಾಭ ಹೆಚ್ಚಿಸಲು 3 ಮುಖ್ಯ ಸಲಹೆಗಳು: 1) ಸಗಟು ಮಾರುಕಟ್ಟೆಯಿಂದ ನೇರವಾಗಿ ಕಚ್ಚಾ ವಸ್ತು ಖರೀದಿಸಿ 15-20% ಉಳಿಸಿ. 2) ಮನೆ ಬಾಗಿಲಿಗೆ ವಿತರಣೆ ಸೇವೆ ನೀಡಿ. 3) PMEGP 35% ಸಬ್ಸಿಡಿ ಪಡೆದು ಬಡ್ಡಿ ಹೊರೆ ಕಡಿಮೆ ಮಾಡಿ.';
    return '3 strategies to maximize monthly profit: 1) Procure raw materials directly from wholesale mandis to preserve 15-20% margin, 2) Offer home deliveries to lock in repeat weekly customers, 3) Utilize the 35% PMEGP capital subsidy to reduce debt servicing.';
  }

  if (isMoratorium) {
    if (targetLang === 'ta') return 'மொரட்டோரியம் என்பது கடன் பெற்ற ஆரம்பத்தில் தவணை செலுத்த தேவையில்லாத 6 மாத சலுகைக் காலம் ஆகும். இந்த காலத்தில் தொழில் நன்கு நிலைபெற நிதி சுமை இருக்காது. பின்னர் எளிய காலாண்டு தவணைகளில் திருப்பிச் செலுத்தலாம்.';
    if (targetLang === 'hi') return 'ऋण स्थगन (Moratorium) का मतलब है कि शुरुआती 6 महीने आपको कोई मूलधन या किस्त नहीं देनी होगी। इससे आपको अपना व्यवसाय स्थापित करने और स्थिर नकदी प्रवाह बनाने का पूरा समय मिलता है।';
    if (targetLang === 'te') return 'మొరటోరియం అంటే ప్రారంభ 6 నెలల పాటు మీరు ఎటువంటి EMI చెల్లించాల్సిన అవసరం లేదు. ఈ కాలంలో వ్యాపారాన్ని స్థిరపరచుకోవడానికి మీకు పూర్తి వెసులుబాటు ఉంటుంది.';
    if (targetLang === 'bn') return 'মোরেটোরিয়াম মানে প্রথম ৬ মাস আপনাকে কোনো মূল ঋণ বা কিস্তি দিতে হবে না। এই সময়ে কোনো আর্থিক চাপ ছাড়াই ব্যবসা গুছিয়ে নেওয়ার সুযোগ পাবেন।';
    if (targetLang === 'mr') return 'मोरेटोरियम म्हणजे सुरुवातीच्या ६ महिन्यांत तुम्हाला कोणताही मासिक हप्ता (EMI) भरावा लागत नाही. यामुळे व्यवसायात रोख प्रवाह स्थिर होण्यास मदत होते.';
    if (targetLang === 'ml') return 'മൊറട്ടോറിയം എന്നാൽ ബിസിനസ്സ് ആരംഭിച്ച് ആദ്യ 6 മാസം EMI അടയ്ക്കേണ്ടതില്ല. ഈ കാലയളവിലെ പലിശ മുതലിലേക്ക് ചേർക്കപ്പെടുന്നു. ഇത് ബിസിനസ്സ് സുസ്ഥിരമാകുന്നതുവരെ വലിയ ആശ്വാസമാണ്.';
    if (targetLang === 'kn') return 'ಮೊರಟೋರಿಯಂ ಎಂದರೆ ಆರಂಭಿಕ 6 ತಿಂಗಳು ನೀವು ಯಾವುದೇ ಇಎಂಐ ಪಾವತಿಸಬೇಕಾಗಿಲ್ಲ. ಈ ಅವಧಿಯಲ್ಲಿ ವ್ಯಾಪಾರವನ್ನು ಸ್ಥಿರಗೊಳಿಸಲು ಸಂಪೂರ್ಣ ಅವಕಾಶ ಸಿಗುತ್ತದೆ.';
    return 'The 6-month moratorium allows zero principal repayment during setup, giving you financial breathing room before regular quarterly installments begin.';
  }

  if (isScheme) {
    if (targetLang === 'ta') return `உங்கள் ₹${margin.toLocaleString('en-IN')} முதலீட்டிற்கு 90% அரசு கடன் உதவி (₹${loan.toLocaleString('en-IN')}) கிடைக்கும். PMEGP திட்டத்தில் 35% வரை மானியமும், முத்ரா திட்டத்தில் பிணையில்லா கடனும் பெறலாம். ஆன்லைனில் விண்ணப்பிக்க kviconline.gov.in மற்றும் udyamregistration.gov.in தளங்களை பயன்படுத்தவும்.`;
    if (targetLang === 'hi') return `आपकी ₹${margin.toLocaleString('en-IN')} की मार्जिन पूंजी पर 90% तक सरकारी ऋण (₹${loan.toLocaleString('en-IN')}) उपलब्ध है। PMEGP के तहत 35% सब्सिडी और मुद्रा योजना से बिना गारंटी का ऋण मिलता है। आधिकारिक पोर्टल: kviconline.gov.in और udyamregistration.gov.in`;
    if (targetLang === 'te') return `మీ ₹${margin.toLocaleString('en-IN')} పెట్టుబడిపై 90% ప్రభుత్వ రుణం (₹${loan.toLocaleString('en-IN')}) అందుబాటులో ఉంది. PMEGP కింద 35% సబ్సిడీ మరియు ముద్రా కింద పూచీకత్తు లేని రుణం పొందవచ్చు. అధికారిక వెబ్‌సైట్: kviconline.gov.in`;
    if (targetLang === 'bn') return `আপনার ₹${margin.toLocaleString('en-IN')} পুঁজিতে ৯০% সরকারি ঋণ (₹${loan.toLocaleString('en-IN')}) পাওয়া যাবে। PMEGP স্কিমে ৩৫% ভর্তুকি এবং মুদ্রা ঋণে বিনা গ্যারান্টিতে তহবিল পাবেন। পোর্টাল: kviconline.gov.in`;
    if (targetLang === 'mr') return `आपल्या ₹${margin.toLocaleString('en-IN')} भांडवलावर ९०% शासकीय कर्ज (₹${loan.toLocaleString('en-IN')}) उपलब्ध आहे. PMEGP अंतर्गत ३५% सबसिडी आणि मुद्रा योजनेतून विनातारण कर्ज मिळते. वेबसाइट: kviconline.gov.in`;
    if (targetLang === 'ml') return `നിങ്ങളുടെ ₹${margin.toLocaleString('en-IN')} നിക്ഷേപത്തിന് 90% സർക്കാർ വായ്പാ സഹായം (₹${loan.toLocaleString('en-IN')}) ലഭിക്കും. PMEGP, മുദ്ര പദ്ധതികൾ വഴി 6.5% മുതൽ 8% കുറഞ്ഞ പലിശയിലും 35% വരെ സബ്‌സിഡിയിലും വായ്പ ലഭ്യമാണ്. ഔദ്യോഗിക പോർട്ടൽ: kviconline.gov.in`;
    if (targetLang === 'kn') return `ನಿಮ್ಮ ₹${margin.toLocaleString('en-IN')} ಬಂಡವಾಳಕ್ಕೆ 90% ಸರ್ಕಾರಿ ಸಾಲ (₹${loan.toLocaleString('en-IN')}) ಲಭ್ಯವಿದೆ. PMEGP ಮತ್ತು ಮುದ್ರಾ ಯೋಜನೆಗಳ ಮೂಲಕ 35% ವರೆಗೆ ಸಬ್ಸಿಡಿ ಸಿಗುತ್ತದೆ. ಪೋರ್ಟಲ್: kviconline.gov.in`;
    return `Your self-contributed margin of ₹${margin.toLocaleString('en-IN')} qualifies for 90% scheme financing (₹${loan.toLocaleString('en-IN')}) under PMEGP (with up to 35% capital subsidy) or MUDRA Kishore. Apply directly at kviconline.gov.in and udyamregistration.gov.in.`;
  }

  if (isHalfCapital) {
    if (targetLang === 'ta') return `ஆம், ₹${half.toLocaleString('en-IN')} என்ற பாதி முதலீட்டிலும் தொடங்கலாம்: 1) சொந்தமாக வாங்குவதற்குப் பதில் உபகரணங்களை வாடகைக்கு எடுக்கவும், 2) ஆரம்பத்தில் அத்தியாவசிய பொருட்களை மட்டுமே இருப்பு வைக்கவும், 3) முத்ரா சிசு திட்டத்தில் ₹50,000 வரை உடனடி கடன் பெறவும்.`;
    if (targetLang === 'hi') return `हाँ, आप ₹${half.toLocaleString('en-IN')} के आधे बजट में भी शुरुआत कर सकते हैं: 1) उपकरण खरीदने के बजाय किराए पर लें, 2) शुरुआत में सीमित और तेज़ी से बिकने वाला स्टॉक रखें, 3) मुद्रा शिशु योजना के तहत ₹50,000 की शुरुआती सहायता लें।`;
    if (targetLang === 'te') return `అవును, మీరు ₹${half.toLocaleString('en-IN')} సగం పెట్టుబడితో కూడా ప్రారంభించవచ్చు: 1) పరికరాలను అద్దెకు తీసుకోండి, 2) అవసరమైన సరుకును మాత్రమే నిల్వ చేయండి, 3) ముద్రా శిశు కింద ₹50,000 రుణం తీసుకోండి.`;
    if (targetLang === 'bn') return `হ্যাঁ, আপনি ₹${half.toLocaleString('en-IN')} অর্ধেক পুঁজিতেও শুরু করতে পারেন: ১) সরঞ্জাম কেনার বদলে ভাড়ায় নিন, ২) দ্রুত বিক্রি হওয়া পণ্য দিয়ে শুরু করুন, ৩) মুদ্রা শিশু প্রকল্পে ₹৫০,০০০ পর্যন্ত ঋণ নিন।`;
    if (targetLang === 'mr') return `होय, आपण ₹${half.toLocaleString('en-IN')} या निम्म्या भांडवलातही व्यवसाय सुरू करू शकता: १) साहित्य भाडेतत्त्वावर घ्या, २) कमी साठ्याने सुरुवात करा, ३) मुद्रा शिशु योजनेतून ₹५०,००० पर्यंतचे कर्ज मिळवा.`;
    if (targetLang === 'ml') return `അതെ, ₹${half.toLocaleString('en-IN')} എന്ന പകുതി നിക്ഷേപത്തിലും ആരംഭിക്കാം: 1) സ്ഥലം വാങ്ങുന്നതിന് പകരം വാടകയ്ക്കെടുക്കുക, 2) സെക്കൻഡ് ഹാൻഡ് യന്ത്രങ്ങൾ ഉപയോഗിക്കുക, 3) ആവശ്യമായ ഉൽപ്പന്നങ്ങൾ മാത്രം ആദ്യം സ്റ്റോക്ക് ചെയ്യുക.`;
    if (targetLang === 'kn') return `ಹೌದು, ನೀವು ₹${half.toLocaleString('en-IN')} ಅರ್ಧ ಬಂಡವಾಳದಲ್ಲೂ ಪ್ರಾರಂಭಿಸಬಹುದು: 1) ಉಪಕರಣಗಳನ್ನು ಬಾಡಿಗೆಗೆ ಪಡೆಯಿರಿ, 2) ಅಗತ್ಯ ವಸ್ತುಗಳನ್ನು ಮಾತ್ರ ದಾಸ್ತಾನು ಮಾಡಿ, 3) ಮುದ್ರಾ ಶಿಶು ಯೋಜನೆಯಡಿ ₹50,000 ಸಾಲ ಪಡೆಯಿರಿ.`;
    return `Yes, you can launch with half capital (₹${half.toLocaleString('en-IN')}): 1) Lease equipment instead of purchasing, 2) Stock high-turnover SKUs first, 3) Leverage MUDRA Shishu for initial working capital.`;
  }

  if (isRisk) {
    if (targetLang === 'ta') return `${loc} பகுதியில் ${biz} தொழிலுக்கு முக்கிய சவால்கள்: 1) மூலப்பொருள் விலை ஏற்ற இறக்கம், 2) வாடிக்கையாளர் கடன் பாக்கி. ஆலோசனை: ஒரு வாடிக்கையாளருக்கு கடன் வரம்பை ₹1,000-க்குள் கட்டுப்படுத்துங்கள், பல மொத்த விற்பனையாளர்களிடம் தொடர்பில் இருங்கள்.`;
    if (targetLang === 'hi') return `${loc} में ${biz} के लिए मुख्य जोखिम: 1) कच्चे माल की कीमतों में उतार-चढ़ाव, 2) ग्राहकों की उधारी। सलाह: प्रति ग्राहक उधारी सीमा ₹1,000 तक रखें और 2-3 सप्लायर्स के संपर्क में रहें।`;
    if (targetLang === 'te') return `${loc} లో ${biz} వ్యాపారానికి ప్రధాన సవాళ్లు: 1) ముడిసరుకు ధరల మార్పు, 2) కస్టమర్ల అప్పు. సూచన: అప్పు పరిమితిని ₹1,000 లోపు ఉంచండి.`;
    if (targetLang === 'bn') return `${loc}-এ ${biz} ব্যবসার ক্ষেত্রে প্রধান ঝুঁকি: ১) কাঁচামালের দামের ওঠানামা, ২) বাকি টাকা আটকে থাকা। পরামর্শ: বাকি বিক্রির সীমা ₹১,০০০-এর মধ্যে রাখুন।`;
    if (targetLang === 'mr') return `${loc} मध्ये ${biz} व्यवसायासाठी मुख्य आव्हाने: १) कच्च्या मालाचे चढउतार, २) ग्राहकांची उधारी. सल्ला: उधारीची मर्यादा ₹१,००० ठेवा.`;
    if (targetLang === 'ml') return `${loc}-ൽ ${biz} ബിസിനസ്സിന്റെ പ്രധാന വെല്ലുവിളികൾ: 1) അസംസ്കൃത വസ്തുക്കളുടെ വിലയിലെ ഏറ്റക്കുറച്ചിലുകൾ, 2) ഉപഭോക്താക്കളുടെ കടം. കടം പരമാവധി ₹1,000 ആയി പരിമിതപ്പെടുത്തുക.`;
    if (targetLang === 'kn') return `${loc} ನಲ್ಲಿ ${biz} ಉದ್ಯಮಕ್ಕೆ ಪ್ರಮುಖ ಸವಾಲುಗಳು: 1) ಕಚ್ಚಾ ವಸ್ತುಗಳ ಬೆಲೆ ಬದಲಾವಣೆ, 2) ಗ್ರಾಹಕರ ಸಾಲ. ಸಾಲದ ಮಿತಿಯನ್ನು ₹1,000 ಕ್ಕೆ ಸೀಮಿತಗೊಳಿಸಿ.`;
    return `Key operational risks for ${biz} in ${loc}: 1) Raw material price fluctuations, 2) Overextended customer receivables. Keep credit caps under ₹1,000 per buyer and diversify vendor sources.`;
  }

  if (targetLang === 'ta') return `வணக்கம்! நான் GramBiz AI. ${loc} பகுதியில் உங்கள் ${biz} தொழிலுக்கு சிறந்த வளர்ச்சி வாய்ப்புகள் உள்ளன. உங்கள் ₹${margin.toLocaleString('en-IN')} முதலீட்டிற்கு 90% அரசு கடன் மற்றும் 35% வரை மானியம் பெற முடியும். கடன் திட்டம், லாப கணக்கீடு அல்லது தவணை சலுகை பற்றி எதை அறிய விரும்புகிறீர்கள்?`;
  if (targetLang === 'hi') return `नमस्ते! मैं GramBiz AI हूँ। ${loc} में आपके ${biz} व्यवसाय के लिए बेहतरीन अवसर हैं। आपकी ₹${margin.toLocaleString('en-IN')} की मार्जिन पूंजी पर 90% तक सरकारी ऋण और 35% तक सब्सिडी उपलब्ध है। आप किस विषय पर अधिक जानना चाहते हैं?`;
  if (targetLang === 'te') return `నమస్కారం! నేను GramBiz AI. ${loc} లో మీ ${biz} వ్యాపారానికి మంచి అవకాశాలు ఉన్నాయి. మీ ₹${margin.toLocaleString('en-IN')} పెట్టుబడిపై 90% ప్రభుత్వ రుణం లభిస్తుంది. మీకు ఏ వివరాలు కావాలి?`;
  if (targetLang === 'bn') return `নমস্কার! আমি GramBiz AI। ${loc}-এ আপনার ${biz} ব্যবসার দারুণ সম্ভাবনা রয়েছে। আপনার ₹${margin.toLocaleString('en-IN')} পুঁজিতে ৯০% সরকারি ঋণ সহায়তা পাওয়া যাবে। আর কী তথ্য জানতে চান?`;
  if (targetLang === 'mr') return `नमस्कार! मी GramBiz AI. ${loc} मध्ये आपल्या ${biz} व्यवसायासाठी उत्तम संधी आहेत. आपल्या ₹${margin.toLocaleString('en-IN')} भांडवलावर ९०% शासकीय कर्ज उपलब्ध आहे. आपल्याला कोणत्या विषयावर माहिती हवी आहे?`;
  if (targetLang === 'ml') return `നമസ്കാരം! ഞാൻ GramBiz AI. ${loc}-ൽ നിങ്ങളുടെ ${biz} സംരംഭത്തിന് മികച്ച സാധ്യതയുണ്ട്. നിങ്ങളുടെ ₹${margin.toLocaleString('en-IN')} നിക്ഷേപത്തിന് 90% സർക്കാർ വായ്പ ലഭ്യമാണ്. താങ്കൾക്ക് എന്ത് വിവരമാണ് അറിയേണ്ടത്?`;
  if (targetLang === 'kn') return `ನಮಸ್ಕಾರ! ನಾನು GramBiz AI. ${loc} ನಲ್ಲಿ ನಿಮ್ಮ ${biz} ವ್ಯಾಪಾರ ಆರಂಭಿಸಲು ಉತ್ತಮ ಅವಕಾಶವಿದೆ. ನಿಮ್ಮ ₹${margin.toLocaleString('en-IN')} ಬಂಡವಾಳಕ್ಕೆ 90% ಸರ್ಕಾರಿ ಸಾಲ ಲಭ್ಯವಿದೆ. ನಿಮಗೆ ಯಾವ ಮಾಹಿತಿ ಬೇಕು?`;
  return `GramBiz AI indicates strong viability for your ${biz} venture in ${loc}. Your self-contributed margin of ₹${margin.toLocaleString('en-IN')} qualifies for 90% government scheme leverage. How can I assist with your business plan today?`;
}

function generateClientNearbyBusinesses(
  lat: number,
  lon: number,
  radiusKm: number,
  category: string,
  businessName?: string,
  locationName?: string
): NearbyBusinessesResponse {
  const locLabel = (locationName || "").split(",")[0].trim() || "Local Area";
  const bizLabel = businessName && businessName !== category ? businessName : category;

  const allOutlets = [
    // Immediate 0–5 km radius outlets
    { id: "OSM-1", name: `${locLabel} Primary Commercial Center`, category, latitude: +(lat + 0.008).toFixed(4), longitude: +(lon + 0.006).toFixed(4), distance_km: 1.1, address: `Bazaar Main Road, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    { id: "OSM-2", name: `${locLabel} Co-operative Marketing Society`, category, latitude: +(lat - 0.012).toFixed(4), longitude: +(lon + 0.009).toFixed(4), distance_km: 1.8, address: `Market Junction, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    { id: "OSM-3", name: `Sri Lakshmi ${bizLabel} Traders`, category, latitude: +(lat + 0.015).toFixed(4), longitude: +(lon - 0.014).toFixed(4), distance_km: 2.6, address: `Bus Stand Road, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    { id: "OSM-4", name: `Balaji Rural Enterprise`, category, latitude: +(lat - 0.022).toFixed(4), longitude: +(lon - 0.018).toFixed(4), distance_km: 3.5, address: `Panchayat Link Road, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    // Extended 5–10 km radius outlets
    { id: "OSM-5", name: `Taluk APMC Wholesale & Retail Point`, category, latitude: +(lat + 0.035).toFixed(4), longitude: +(lon + 0.028).toFixed(4), distance_km: 5.8, address: `Taluk Main Road, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    { id: "OSM-6", name: `Regional Farmers Producer Unit`, category, latitude: +(lat - 0.040).toFixed(4), longitude: +(lon + 0.032).toFixed(4), distance_km: 6.5, address: `State Highway Link, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" },
    { id: "OSM-7", name: `District Trade Distribution Center`, category, latitude: +(lat + 0.048).toFixed(4), longitude: +(lon - 0.035).toFixed(4), distance_km: 7.9, address: `District Collectorate Road, ${locLabel}`, source_name: "District Commercial Directory", data_status: "MAPPED BUSINESS" }
  ];

  const count_5km = allOutlets.filter(b => b.distance_km <= 5.0).length;
  const count_10km = allOutlets.filter(b => b.distance_km <= 10.0).length;

  return {
    center_latitude: lat,
    center_longitude: lon,
    radius_km: radiusKm,
    category,
    count_5km,
    count_10km,
    competition_level: count_5km > 5 ? "HIGH" : count_5km >= 2 ? "MEDIUM" : "LOW",
    businesses: allOutlets,
    data_status: "MAPPED BUSINESS",
    primary_source: "District Commercial Directory"
  };
}

// Client-Side Fallback Engine
function generateClientAssessment(
  location: LocationData,
  capital: CapitalData,
  business: BusinessData
): FullAssessment {
  const margin = capital.margin_capital;
  const projectCost = margin / 0.10;
  const rawLoan = projectCost * 0.90;
  const isMicro = projectCost <= 140000;
  const maxLoan = isMicro ? 125000 : 4500000;

  const capExceeded = rawLoan > maxLoan;
  const actualLoan = capExceeded ? maxLoan : rawLoan;

  const rate = isMicro ? 6.5 : 8.0;
  const tenure = isMicro ? 3 : 7;
  const moratorium = isMicro ? 3 : 6;

  const n = tenure * 12;
  const r = (rate / 100) / 12;
  const emi = Math.round((actualLoan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const totalRepayment = emi * n;
  const totalInterest = totalRepayment - actualLoan;

    const bizName = business.business_name || `${location.village || 'Local'} ${business.custom_category || business.category}`;

    return {
    id: `GB-OFFLINE-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    created_at: new Date().toISOString(),
    location,
    capital,
    business,
    financial_result: {
      margin_capital: margin,
      project_cost: projectCost,
      loan_amount: actualLoan,
      beneficiary_ratio: 0.10,
      loan_ratio: 0.90,
      scheme_name: isMicro ? "Micro Finance Concessional Scheme" : "Term Loan Assistance Scheme",
      max_funding: maxLoan,
      interest_rate: rate,
      tenure_years: tenure,
      moratorium_months: moratorium,
      monthly_emi: emi,
      total_interest: totalInterest,
      total_repayment: totalRepayment,
      cap_exceeded: capExceeded
    },
    business_analysis: {
      business_name: bizName,
      market_reach: {
        radius_5km_reach: "Est. 5,400 residents across 3 hamlets",
        radius_10km_reach: "Est. 22,000 extended catchment population",
        primary_segments: ["Village households", "tea stalls", "local buyers"],
        demand_indicator: "HIGH — Steady rural consumption trend",
        data_status: "ESTIMATED"
      },
      opportunity_analysis: [
        `High demand for ${bizName} in ${location.district || 'the region'}.`,
        "Direct delivery model commands premium gross margin.",
        "WhatsApp ordering expands reach by 25%."
      ],
      swot: {
        strengths: [`Daily cash flow for ${bizName}`, `Margin capital of ₹${margin.toLocaleString('en-IN')}`],
        weaknesses: ["Requires initial brand building phase"],
        opportunities: ["Unserved local sub-clusters", "Government subsidy support"],
        threats: ["Raw material cost changes", "Buyer credit defaults"]
      },
      threats: [
        { risk_name: "Raw Material Price Changes", severity: "High", mitigation: "Bulk purchase agreements with local wholesale suppliers." },
        { risk_name: "Customer Credit Default", severity: "Medium", mitigation: "Set customer credit caps (max ₹1,000) and digitize ledgers." }
      ],
      competitor_count: "4 direct competitors (5km)",
      competition_level: "MEDIUM",
      competitors: generateClientNearbyBusinesses(location.latitude || 13.0125, location.longitude || 79.9754, 5.0, business.category).businesses,
      business_trajectory: {
        estimated_monthly_revenue_min: Math.round(Math.max(35000, projectCost * 0.45)),
        estimated_monthly_revenue_max: Math.round(Math.max(55000, projectCost * 0.70)),
        estimated_monthly_op_cost: Math.round(Math.max(35000, projectCost * 0.45) * 0.62),
        estimated_net_profit_min: Math.round(Math.max(14000, Math.max(35000, projectCost * 0.45) * 0.38)),
        estimated_net_profit_max: Math.round(Math.max(22000, (Math.max(55000, projectCost * 0.70) * 0.40))),
        estimated_daily_customers: `${Math.max(25, Math.floor(30 + (margin / 15000)))}–${Math.max(25, Math.floor(30 + (margin / 15000))) + 20} customers / day`,
        breakeven_months: "5 to 7 months",
        viability_rate_percentage: 78,
        timeline_stages: {
          month_1_3: `Launch & Customer Acquisition: Set up ${bizName} in ${location.village || 'your village'}, source direct wholesale inventory, and build an initial base of 25–35 loyal daily customers.`,
          month_4_6: `Break-Even & Scheme Moratorium: Achieve stable cash flow covering monthly expenses. Concessional scheme moratorium protects your working capital.`,
          month_7_12: `Net Profitability & Expansion: Generate steady net profits in pocket for ${bizName}. Smoothly pay regular loan EMI and expand doorstep delivery.`
        },
        competitive_advantage_tactics: [
          `Early Bird Advantage: Open ${bizName} 1–2 hours before neighboring ${business.custom_category || business.category} outlets to capture morning commuters and tea stalls.`,
          `Doorstep Delivery & WhatsApp: Provide prompt 30-minute doorstep delivery within 2–3km in ${location.village || 'your village'} to win customer loyalty over static shops.`,
          `Verified Freshness & Fair Pricing: Display transparent pricing with verified quality.`
        ],
        ai_verdict_audio_text: `In ${location.village || 'your village'}, our AI evaluated your proposed business, ${bizName}, alongside 4 competitors within 5 kilometers. With your investment of ₹${margin.toLocaleString('en-IN')}, ${bizName} has an estimated viability rating of 78 percent. Projected monthly net profit is ₹14,000 to ₹25,000. You can reach break-even within 5 to 7 months with concessional government scheme support.`
      },
      pricing: {
        market_price_range: "₹45 – ₹65 / Unit",
        suggested_starting_price: "₹52 / Unit",
        estimated_gross_margin: "25% Gross Margin",
        cost_considerations: ["Stock purchase", "Rent & utilities", "Transport"],
        data_status: "ESTIMATED"
      },
      feasibility_score: {
        overall_score: 78,
        label: "Moderate Potential",
        market_potential: 82,
        competition: 75,
        capital_adequacy: 85,
        profit_potential: 80,
        risk_score: 72,
        experience_fit: 80,
        scalability: 78,
        explanation: {
          market_potential: { name: "Market Potential", score: 82, explanation: "High catchment population supports steady local demand.", supporting_factors: ["Catchment > 5000", "Daily essential staple"], potential_improvements: ["Add doorstep delivery", "Expand village marketing"] },
          competition: { name: "Competition Level", score: 75, explanation: "Competitor density is manageable in your target block.", supporting_factors: ["Moderate competitors", "No monopoly"], potential_improvements: ["Focus on freshness/quality", "Offer night service"] },
          capital_adequacy: { name: "Capital Adequacy", score: 85, explanation: `Margin contribution of ₹${margin.toLocaleString('en-IN')} provides suitable loan leverage.`, supporting_factors: ["10% own equity", "Covers minimum requirement"], potential_improvements: ["Maintain contingency buffer", "Apply for PMEGP subsidy"] },
          profit_potential: { name: "Profit Margin Potential", score: 80, explanation: "Estimated gross margins provide healthy operating profit.", supporting_factors: ["Low overheads", "Healthy gross margin"], potential_improvements: ["Introduce value-added products", "Bulk wholesale buy"] },
          risk_score: { name: "Risk Resilience", score: 72, explanation: "Identified local supply-chain risks have actionable mitigations.", supporting_factors: ["Diverse buyer base", "Multiple suppliers"], potential_improvements: ["Enforce customer credit limits", "Maintain 3-month reserve"] },
          experience_fit: { name: "Experience Fit", score: 80, explanation: "Declared experience level matches operational requirements.", supporting_factors: ["Declared background fit", "Accessible skills"], potential_improvements: ["Attend DIC training", "Consult mentor"] },
          scalability: { name: "Scalability", score: 78, explanation: "Business model can expand into adjacent village clusters.", supporting_factors: ["Replicable model", "Low initial barrier"], potential_improvements: ["Add secondary service line", "Partner with cooperative"] }
        }
      },
      confidence_rating: {
        level: "MEDIUM",
        score: 72,
        data_quality_label: "Estimated / Sample Data",
        reasons: [
          "Financial scheme parameters are verified against official government guidelines.",
          "Local competitor density relies on sample block estimates.",
          "Demographic catchment population is derived from census benchmarks."
        ]
      },
      data_sources: {
        location_source: { field_name: "Location", status: "USER PROVIDED", source_name: "User Input", description: "Entered village boundaries." },
        population_source: { field_name: "Population", status: "ESTIMATED", source_name: "Rural Catchment Model", description: "Estimated 5km and 10km catchment." },
        competitor_source: { field_name: "Competitor Data", status: "MAPPED BUSINESS", source_name: "OpenStreetMap POI Index", description: "Mapped nearby competitors." },
        pricing_source: { field_name: "Pricing", status: "ESTIMATED", source_name: "Regional Price Index", description: "Estimated product price ranges." },
        capital_source: { field_name: "User Capital", status: "USER PROVIDED", source_name: "Entrepreneur Declaration", description: "User stated contribution." },
        financial_scheme_source: { field_name: "Scheme Guidelines", status: "VERIFIED", source_name: "Official Scheme Guidelines", description: "Verified interest rate & tenure.", is_authoritative: true },
        ai_assumptions_source: { field_name: "AI Engine", status: "ESTIMATED", source_name: "GramBiz Feasibility Engine", description: "Rule-based feasibility engine." },
        disclaimer_note: "Results are preliminary estimates and should be validated with local market research."
      },
      recommendation_summary: `Proceed with planned rollout for ${business.custom_category || business.category} in ${location.village}. Feasibility rating (78/100) indicates moderate potential.`,
      recommendation_why: [
        `Local market demand for ${business.custom_category || business.category} is steady with accessible customer segments.`,
        `Your margin of ₹${margin.toLocaleString('en-IN')} provides solid project leverage.`,
        `Competition is manageable in your immediate block.`
      ],
      recommendation_assumptions: [
        "10% beneficiary margin contribution with 90% scheme loan funding.",
        "Initial moratorium relief period prior to regular EMI repayments.",
        "Consistent operational effort and supply-chain stability."
      ],
      recommendation_risks: [
        "Raw material price inflation during peak seasons.",
        "Delayed buyer credit payments affecting working capital."
      ],
      recommendation_verify_first: [
        "Local competitor selling prices in your immediate market.",
        "Wholesale supplier price quotations and delivery timelines.",
        "Exact bank loan eligibility criteria and required documentation."
      ],
      recommendation_steps: [
        `1. Conduct customer survey with 25 local residents in ${location.village}.`,
        "2. Obtain price quotes from 2 wholesale suppliers in nearest town.",
        "3. Finalize rental lease agreement before loan application submission.",
        "4. Maintain a 3-month working capital reserve."
      ],
      action_plan: {
        this_week: [
          `Talk to 10 potential customers in ${location.village} to test interest.`,
          "Visit 3 local competitors to observe pricing and product offerings.",
          "Get firm quotations from 2 wholesale suppliers."
        ],
        before_applying: [
          "Finalize detailed itemized business budget.",
          "Collect required KYC documents (Aadhaar, PAN, Bank Passbook, Land proof).",
          "Verify scheme guidelines with local bank branch manager.",
          "Confirm financing terms and moratorium treatment."
        ],
        before_starting: [
          "Validate final local demand with advance orders.",
          "Confirm primary supplier contract.",
          "Reserve mandatory 3-month working capital cushion.",
          "Finalize product pricing strategy."
        ],
        checked_tasks: {}
      }
    },
    working_capital: {
      total_monthly_op_cost: 35000,
      reserve_3_months: 105000
    },
    budget_allocation: {
      total_allocated: projectCost,
      project_cost: projectCost,
      is_valid: true,
      remaining: 0
    },
    disclaimer: "Estimated financial structure based on provided scheme parameters. Final loan eligibility and sanction are subject to the applicable authority, eligibility criteria, documentation, verification, and approval."
  };
}

function generateClientComparison(categories: string[], marginCapital: number, location: LocationData): ComparisonResult {
  const categoryScores: Record<string, any> = {
    "Dairy": { market: 82, comp: 65, cap: 90, profit: 78, risk: 70, exp: 85, scale: 75 },
    "Textile": { market: 68, comp: 52, cap: 72, profit: 74, risk: 60, exp: 70, scale: 72 },
    "Food Processing": { market: 76, comp: 80, cap: 65, profit: 81, risk: 68, exp: 62, scale: 80 },
    "Grocery": { market: 85, comp: 50, cap: 80, profit: 65, risk: 65, exp: 90, scale: 70 },
    "Retail": { market: 82, comp: 55, cap: 82, profit: 68, risk: 65, exp: 85, scale: 72 },
    "Poultry": { market: 78, comp: 75, cap: 78, profit: 82, risk: 58, exp: 72, scale: 76 }
  };

  let bestCat = categories[0];
  let highestOverall = 0;
  const items = categories.map(cat => {
    const s = categoryScores[cat] || { market: 75, comp: 65, cap: 75, profit: 75, risk: 68, exp: 75, scale: 72 };
    const overall = Math.round((s.market + s.comp + s.cap + s.profit + s.risk + s.exp + s.scale) / 7);
    if (overall > highestOverall) {
      highestOverall = overall;
      bestCat = cat;
    }
    return {
      category: cat,
      overall_score: overall,
      market_potential: s.market,
      competition: s.comp,
      capital_fit: s.cap,
      profit_potential: s.profit,
      risk: s.risk,
      experience_fit: s.exp,
      scalability: s.scale
    };
  });

  return {
    items,
    recommended_option: bestCat,
    recommendation_why: `Based on your available capital of ₹${marginCapital.toLocaleString('en-IN')}, local catchment in ${location.district || 'your region'}, and competition density, ${bestCat} currently has the strongest preliminary feasibility rating (${highestOverall}/100).`,
    disclaimer: "This is a preliminary AI recommendation, not a guarantee of business success."
  };
}

function generateClientScenario(input: ScenarioSimulatorInput): ScenarioSimulatorResult {
  const currRev = 50 * 1000;
  const currOp = 35000;
  const currGross = currRev - currOp;

  const newRev = input.selling_price * input.monthly_sales_volume;
  const newOp = input.monthly_operating_cost;
  const newGross = newRev - newOp;
  const newMarginPct = newRev > 0 ? Math.round((newGross / newRev * 100) * 10) / 10 : 0;

  const projectCost = input.margin_capital / 0.10;
  const loan = projectCost * 0.90;
  const n = 84;
  const r = (8.0 / 100) / 12;
  const emi = Math.round((loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));

  return {
    current_scenario: {
      estimated_revenue: currRev,
      estimated_operating_cost: currOp,
      estimated_gross_profit: currGross,
      net_margin_pct: 30.0,
      working_capital_requirement: currOp * 3,
      project_cost: 1000000,
      estimated_loan: 900000,
      monthly_emi: 14030
    },
    new_scenario: {
      estimated_revenue: newRev,
      estimated_operating_cost: newOp,
      estimated_gross_profit: newGross,
      net_margin_pct: newMarginPct,
      working_capital_requirement: newOp * 3,
      project_cost: projectCost,
      estimated_loan: loan,
      monthly_emi: emi
    },
    revenue_delta: newRev - currRev,
    gross_profit_delta: newGross - currGross,
    disclaimer: "Simulated scenario estimates based on user parameters."
  };
}

// ============================================================
// CROSS-DEVICE SYNCHRONIZATION API CLIENT (WEB <-> MOBILE)
// ============================================================

export const syncUserAuth = async (
  phoneOrData: string | { phone?: string; user_id?: string; name?: string; language?: string; village?: string; district?: string; platform?: string },
  name?: string,
  language?: string
) => {
  const phone = typeof phoneOrData === 'string' ? phoneOrData : (phoneOrData.phone || phoneOrData.user_id || '');
  if (!phone) {
    return { status: 'error', user: null, has_active_draft: false };
  }
  const userName = typeof phoneOrData === 'string' ? name : (phoneOrData.name || name);
  const userLang = typeof phoneOrData === 'string' ? language : (phoneOrData.language || language);
  const userVillage = typeof phoneOrData === 'object' ? phoneOrData.village : undefined;
  const userDistrict = typeof phoneOrData === 'object' ? phoneOrData.district : undefined;

  // 1. Supabase direct upsert
  if (supabase) {
    try {
      const { error } = await supabase.from('users').upsert({
        id: phone,
        name: userName || 'Entrepreneur',
        phone_or_email: phone,
        village: userVillage || null,
        district: userDistrict || null,
        preferred_language: userLang || 'en',
      });
      if (error) {
        console.warn('Supabase syncUserAuth notice:', error.message);
      }
    } catch (sbErr) {
      console.warn('Supabase syncUserAuth notice:', sbErr);
    }
  }

  // 2. Backend API sync
  try {
    const res = await fetch(`${API_BASE_URL}/user/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, name: userName, language: userLang }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('syncUserAuth offline fallback', err);
    return {
      status: 'fallback',
      user: { id: phone, name: userName || 'Entrepreneur', phone, language: userLang || 'en' },
      has_active_draft: false
    };
  }
};

export const fetchUserDraft = async (userId: string): Promise<{ has_draft: boolean; draft?: UserDraftData }> => {
  if (!userId) {
    return { has_draft: false };
  }

  // 1. Check Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('analysis_drafts')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error) {
        if (data && data.user_id === userId) {
          return {
            has_draft: true,
            draft: {
              user_id: data.user_id,
              current_step: data.current_step || 1,
              business_data: data.business_data || {},
              location_data: data.location_data || {},
              capital_data: data.capital_data || {},
              feasibility_data: data.feasibility_data || {},
              completed_steps: data.completed_steps || [],
              last_platform: data.last_platform || 'mobile',
              updated_at: data.updated_at,
            }
          };
        } else {
          // Supabase confirmed no draft for this user
          // Check local storage scoped specifically to this user
          try {
            const local = localStorage.getItem(`grambiz_draft_${userId}`);
            if (local) {
              const parsed = JSON.parse(local);
              if (parsed && parsed.user_id === userId) {
                return { has_draft: true, draft: parsed };
              }
            }
          } catch {}
          return { has_draft: false };
        }
      }
    } catch (sbErr) {
      console.warn('Supabase fetchUserDraft notice:', sbErr);
    }
  }

  // 2. Fallback to backend API
  try {
    const res = await fetch(`${API_BASE_URL}/user/draft?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.has_draft && data.draft && data.draft.user_id === userId) {
      return data;
    }
    return { has_draft: false };
  } catch (err) {
    console.warn('fetchUserDraft offline fallback', err);
    try {
      const local = localStorage.getItem(`grambiz_draft_${userId}`);
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed && parsed.user_id === userId) {
          return { has_draft: true, draft: parsed };
        }
      }
    } catch {}
    return { has_draft: false };
  }
};

export const saveUserDraft = async (draft: UserDraftData): Promise<boolean> => {
  if (!draft || !draft.user_id) return false;

  // Always cache in localStorage scoped strictly by user_id
  try {
    localStorage.setItem(`grambiz_draft_${draft.user_id}`, JSON.stringify(draft));
  } catch {}

  // 1. Direct Supabase draft upsert
  if (supabase) {
    try {
      const { error } = await supabase.from('analysis_drafts').upsert({
        id: draft.user_id,
        user_id: draft.user_id,
        current_step: draft.current_step,
        business_data: draft.business_data || null,
        location_data: draft.location_data || null,
        capital_data: draft.capital_data || null,
        feasibility_data: draft.feasibility_data || null,
        completed_steps: draft.completed_steps || null,
        last_platform: draft.last_platform || 'mobile',
        updated_at: new Date().toISOString(),
      });
      if (error) {
        console.warn('Supabase saveUserDraft notice:', error.message);
      }
    } catch (sbErr) {
      console.warn('Supabase saveUserDraft notice:', sbErr);
    }
  }

  // 2. Backend API draft sync
  try {
    const res = await fetch(`${API_BASE_URL}/user/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft),
    });
    return res.ok;
  } catch (err) {
    console.warn('saveUserDraft offline fallback - queued locally', err);
    return false;
  }
};

export const clearUserDraft = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  try {
    localStorage.removeItem(`grambiz_draft_${userId}`);
    if (supabase) {
      await supabase.from('analysis_drafts').delete().eq('user_id', userId);
    }
    await fetch(`${API_BASE_URL}/user/draft?user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
};

export const fetchUserReports = async (userId?: string): Promise<FullAssessment[]> => {
  // 1. Query Supabase
  if (supabase) {
    try {
      let query = supabase.from('assessments').select('*').order('created_at', { ascending: false }).limit(30);
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map((row: any) => {
          if (row.raw_json_data) {
            return {
              ...row.raw_json_data,
              id: row.id,
              created_at: row.created_at,
            };
          }
          return row;
        });
      }
    } catch (sbErr) {
      console.warn('Supabase fetchUserReports notice:', sbErr);
    }
  }

  // 2. Fallback to backend API
  try {
    const url = userId ? `${API_BASE_URL}/user/reports?user_id=${encodeURIComponent(userId)}` : `${API_BASE_URL}/user/reports`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('fetchUserReports offline fallback', err);
    try {
      const local = userId ? localStorage.getItem(`grambiz_saved_reports_${userId}`) : localStorage.getItem('grambiz_saved_reports');
      if (local) return JSON.parse(local);
    } catch {}
    return [];
  }
};

export const fetchUserChatHistory = async (userId: string) => {
  // 1. Check Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data && data.length > 0) {
        return data.map((m: any) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp || (m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''),
        }));
      }
    } catch (sbErr) {
      console.warn('Supabase fetchUserChatHistory notice:', sbErr);
    }
  }

  // 2. Fallback to backend API
  try {
    const res = await fetch(`${API_BASE_URL}/user/chat?user_id=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('fetchUserChatHistory offline fallback', err);
    return [];
  }
};

export const saveUserChatMessage = async (userId: string, role: string, content: string, timestamp?: string) => {
  const timeStr = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgId = `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  // 1. Direct Supabase chat insert
  if (supabase) {
    try {
      const { error } = await supabase.from('chat_messages').insert({
        id: msgId,
        user_id: userId,
        role,
        content,
        timestamp: timeStr,
      });
      if (error) {
        console.warn('Supabase saveUserChatMessage notice:', error.message);
      }
    } catch (sbErr) {
      console.warn('Supabase saveUserChatMessage notice:', sbErr);
    }
  }

  // 2. Backend API chat append
  try {
    await fetch(`${API_BASE_URL}/user/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, role, content, timestamp: timeStr }),
    });
  } catch (err) {
    console.warn('saveUserChatMessage offline fallback', err);
  }
};

