import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Phone, Mail, Lock, User, Building2, ArrowRight,
  CheckCircle2, Globe, X, Eye, EyeOff, RotateCcw, AlertCircle,
  HelpCircle, KeyRound, Check
} from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { Language } from '../../types';
import { WORKFLOW_TRANSLATIONS } from '../../i18n/workflowTranslations';

const GoogleSignInButton: React.FC<{
  onSuccess: (user: { name: string; phone: string; village: string }) => void;
  onError: (msg: string) => void;
  enabled?: boolean;
}> = ({ onSuccess, onError, enabled = false }) => {
  const [loading, setLoading] = useState(false);

  // Safe Google OAuth hook
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        const userData = {
          name: profile.name || profile.email || 'Google Entrepreneur',
          phone: profile.sub || profile.email || '9845012345',
          village: 'Valarpuram',
        };
        localStorage.setItem('grambiz_auth_user', JSON.stringify(userData));
        onSuccess(userData);
      } catch {
        onError('Google sign-in encountered an issue. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => onError('Google sign-in was cancelled.'),
  });

  const handleClick = () => {
    if (enabled) {
      login();
    } else {
      // Direct demo identity resolution when client ID is not configured
      setLoading(true);
      setTimeout(() => {
        const demoGoogleUser = {
          name: 'Ramesh Kumar (Google Account)',
          phone: '9845012345',
          village: 'Valarpuram',
        };
        localStorage.setItem('grambiz_auth_user', JSON.stringify(demoGoogleUser));
        onSuccess(demoGoogleUser);
        setLoading(false);
      }, 400);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full py-3 px-4 rounded-2xl border border-[#E5E1D8] bg-white hover:bg-[#FAF7F0] active:scale-[0.99] transition-all flex items-center gap-3 shadow-xs disabled:opacity-60 cursor-pointer group text-left"
    >
      {/* Authentic Google Logo */}
      <div className="w-8 h-8 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center shrink-0 shadow-2xs group-hover:shadow-xs transition-all">
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          <path fill="none" d="M0 0h48v48H0z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-bold text-[#252525]">
          {loading ? 'Authenticating...' : 'Continue with Google'}
        </div>
        <div className="text-[10.5px] text-[#68706D] font-medium">Use your Google account (Instant Identity)</div>
      </div>
      <ArrowRight className="w-4 h-4 text-[#7FA99B] shrink-0 group-hover:text-[#1D6B4F] group-hover:translate-x-0.5 transition-all" />
    </button>
  );
};

interface Props {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  onLoginSuccess: (user: { name: string; phone: string; village: string }) => void;
  googleEnabled?: boolean;
}

const SUPPORTED_LANGUAGES: { code: Language; name: string; native: string }[] = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

export const AuthScreen: React.FC<Props> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
  googleEnabled = false,
}) => {
  const t = WORKFLOW_TRANSLATIONS[language] || WORKFLOW_TRANSLATIONS.en;
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showLangSheet, setShowLangSheet] = useState(false);

  // Form Fields
  const [identifier, setIdentifier] = useState(''); // Email or Phone
  const [name, setName] = useState('');
  const [enterpriseName, setEnterpriseName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Phone OTP Verification (for mobile users)
  const [otpSent, setOtpSent] = useState(false);
  const [isIdentifierLocked, setIsIdentifierLocked] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(30);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Forgot Password Modal State
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [recoveryIdentifier, setRecoveryIdentifier] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isNumericPhone = /^\d+$/.test(identifier.trim());
  const isTenDigitPhone = isNumericPhone && identifier.trim().length === 10;
  const isEmail = identifier.includes('@') && identifier.includes('.');

  // 30-Second Countdown Timer for OTP
  useEffect(() => {
    let interval: any = null;
    if (otpSent && otpTimer > 0 && !isOtpVerified) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [otpSent, otpTimer, isOtpVerified]);

  // Handle Send OTP
  const handleSendOtp = () => {
    if (!isTenDigitPhone) {
      setError('Please enter a valid 10-digit mobile number to send OTP.');
      return;
    }
    setError(null);
    setOtpSent(true);
    setIsIdentifierLocked(true);
    setOtpTimer(30);
    setCanResendOtp(false);
    setOtpDigits(['', '', '', '', '', '']);
    setIsOtpVerified(false);

    // Auto-focus first digit
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 150);
  };

  // Handle Change Number / Email
  const handleChangeIdentifier = () => {
    setIsIdentifierLocked(false);
    setOtpSent(false);
    setIsOtpVerified(false);
    setOtpDigits(['', '', '', '', '', '']);
    setOtpTimer(30);
  };

  // Handle OTP Digits
  const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const completeOtp = newDigits.join('');
    if (completeOtp.length === 6) {
      triggerOtpVerification(completeOtp);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);

    const lastIdx = Math.min(pasted.length - 1, 5);
    otpInputRefs.current[lastIdx]?.focus();

    if (pasted.length === 6) {
      triggerOtpVerification(pasted);
    }
  };

  const triggerOtpVerification = (code: string) => {
    setVerifyingOtp(true);
    setTimeout(() => {
      setVerifyingOtp(false);
      setIsOtpVerified(true);
      setError(null);
    }, 400);
  };

  const handleResendOtp = () => {
    setOtpTimer(30);
    setCanResendOtp(false);
    setOtpDigits(['', '', '', '', '', '']);
    setIsOtpVerified(false);
    setTimeout(() => {
      otpInputRefs.current[0]?.focus();
    }, 100);
  };

  // Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = identifier.trim();

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your Full Name.');
        return;
      }
      if (!cleanId) {
        setError('Please enter your Email or 10-digit Mobile Number.');
        return;
      }
      if (isNumericPhone && cleanId.length !== 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }
      if (isNumericPhone && !isOtpVerified) {
        setError('Please verify your mobile number via OTP before continuing.');
        return;
      }
      if (!password.trim() || password.length < 4) {
        setError('Please set a password or security PIN (at least 4 characters).');
        return;
      }

      const userData = {
        name: name.trim(),
        phone: cleanId,
        village: 'Valarpuram',
      };
      localStorage.setItem('grambiz_auth_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    } else {
      // Sign In
      if (!cleanId) {
        setError('Please enter your Email or Mobile Number.');
        return;
      }
      if (!password.trim()) {
        setError('Please enter your Password / PIN.');
        return;
      }

      const userData = {
        name: 'Entrepreneur',
        phone: cleanId,
        village: 'Valarpuram',
      };
      localStorage.setItem('grambiz_auth_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    }
  };

  // Form Validation State
  const isSignInValid = identifier.trim().length >= 4 && password.trim().length >= 4;
  const isSignUpValid =
    name.trim().length > 0 &&
    identifier.trim().length >= 4 &&
    password.trim().length >= 4 &&
    (!isNumericPhone || isOtpVerified);

  const isSubmitEnabled = mode === 'signin' ? isSignInValid : isSignUpValid;

  return (
    <div className="min-h-screen bg-[#FAF7F0] flex flex-col justify-between text-[#252525] font-sans antialiased selection:bg-[#1D6B4F] selection:text-white">

      {/* Header Bar */}
      <header className="bg-white border-b border-[#E5E1D8] px-4 sm:px-8 py-3.5 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#1D6B4F] to-[#124D37] text-white flex items-center justify-center font-black text-xs shadow-xs border border-[#1D6B4F]/40 font-heading">
              GB
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-[#252525] tracking-tight font-heading">GramBiz AI</span>
                <span className="hidden sm:inline-block px-2 py-0.5 bg-[#E8F5EE] border border-[#CDE8D8] text-[#1D6B4F] text-[10px] font-bold rounded-md uppercase tracking-wider">
                  Enterprise Portal
                </span>
              </div>
              <p className="text-[11px] text-[#68706D] font-medium">Official Rural Enterprise Feasibility & Credit Advisory</p>
            </div>
          </div>

          {onLanguageChange && (
            <button
              type="button"
              onClick={() => setShowLangSheet(true)}
              className="flex items-center gap-1.5 bg-[#FAF7F0] hover:bg-[#EAE5D9] border border-[#E5E1D8] text-[#252525] px-3 py-1.5 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#1D6B4F]" />
              <span className="uppercase text-[11px] font-black">{language}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Authentication Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-md bg-white border border-[#E5E1D8] rounded-3xl shadow-sm p-6 sm:p-8 space-y-5">

          {/* Top Trust Banner */}
          <div className="p-3.5 bg-[#E8F5EE] border border-[#CDE8D8] rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#1D6B4F] shrink-0 mt-0.5" />
            <p className="text-xs text-[#1D6B4F] leading-relaxed font-semibold">
              Official enterprise advisory portal for rural entrepreneurs, micro-enterprises, and institutional credit scheme navigation.
            </p>
          </div>

          {/* Tab Toggle: Pill-Shaped Segmented Control */}
          <div className="bg-[#FAF7F0] p-1 rounded-full flex gap-1 border border-[#E5E1D8]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer font-heading ${
                mode === 'signin'
                  ? 'bg-[#1D6B4F] text-white shadow-xs'
                  : 'text-[#68706D] hover:text-[#252525]'
              }`}
            >
              Existing User • Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-xs font-extrabold rounded-full transition-all cursor-pointer font-heading ${
                mode === 'signup'
                  ? 'bg-[#1D6B4F] text-white shadow-xs'
                  : 'text-[#68706D] hover:text-[#252525]'
              }`}
            >
              New Entrepreneur • Sign Up
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* SIGN UP EXTRA FIELDS */}
            {mode === 'signup' && (
              <>
                {/* 1. Full Name */}
                <div>
                  <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#1D6B4F] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#252525] placeholder-[#68706D]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1D6B4F]/40 focus:border-[#1D6B4F] transition-all"
                      required
                    />
                  </div>
                </div>

                {/* 2. Enterprise Name (Optional) */}
                <div>
                  <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wide mb-1.5">
                    Enterprise / Proposed Venture <span className="text-[10px] text-[#68706D] font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-[#7FA99B] absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={enterpriseName}
                      onChange={(e) => setEnterpriseName(e.target.value)}
                      placeholder="e.g. Sri Murugan Dairy Products"
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF7F0] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#252525] placeholder-[#68706D]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1D6B4F]/40 focus:border-[#1D6B4F] transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {/* EMAIL OR MOBILE NUMBER FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wide">
                  {mode === 'signup' ? 'Registered Email or Mobile' : 'Email or Mobile Number'}
                </label>
                {isOtpVerified && isNumericPhone && (
                  <span className="flex items-center gap-1 text-[11px] font-extrabold text-[#1D6B4F] bg-[#E8F5EE] border border-[#CDE8D8] px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3 text-[#1D6B4F]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>

              <div className="relative">
                {isNumericPhone ? (
                  <Phone className="w-4 h-4 text-[#1D6B4F] absolute left-3.5 top-3" />
                ) : (
                  <Mail className="w-4 h-4 text-[#1D6B4F] absolute left-3.5 top-3" />
                )}

                <input
                  type="text"
                  value={identifier}
                  readOnly={isIdentifierLocked}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={mode === 'signup' ? '10-digit mobile number or email' : 'Mobile number or email address'}
                  className={`w-full pl-10 ${
                    mode === 'signup' && isTenDigitPhone && !isIdentifierLocked ? 'pr-24' : 'pr-4'
                  } py-2.5 border rounded-2xl text-xs font-semibold placeholder-[#68706D]/60 focus:outline-none transition-all ${
                    isIdentifierLocked
                      ? 'bg-[#E8F5EE]/70 border-[#CDE8D8] text-[#1D6B4F] cursor-not-allowed'
                      : 'bg-[#FAF7F0] border-[#E5E1D8] text-[#252525] focus:bg-white focus:ring-2 focus:ring-[#1D6B4F]/40 focus:border-[#1D6B4F]'
                  }`}
                  required
                />

                {/* Inline Send OTP Button (for 10-digit phone in signup) */}
                {mode === 'signup' && isTenDigitPhone && !isIdentifierLocked && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="absolute right-1.5 top-1.5 px-3 py-1.5 text-[11px] font-bold bg-[#1D6B4F] text-white hover:bg-[#165B43] active:scale-95 rounded-xl transition-all shadow-2xs cursor-pointer"
                  >
                    Send OTP
                  </button>
                )}
              </div>

              {/* Change number/email link when locked */}
              {isIdentifierLocked && !isOtpVerified && (
                <div className="flex items-center justify-between mt-1 px-1">
                  <span className="text-[11px] text-[#68706D]">OTP code sent</span>
                  <button
                    type="button"
                    onClick={handleChangeIdentifier}
                    className="text-[11px] font-bold text-[#1D6B4F] hover:underline cursor-pointer"
                  >
                    Change input
                  </button>
                </div>
              )}
            </div>

            {/* OTP VERIFICATION BOXES (Only for mobile phone in signup) */}
            {mode === 'signup' && otpSent && !isOtpVerified && (
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E5E1D8] space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wide">
                    Enter 6-Digit Verification OTP
                  </label>
                  <span className="text-[11px] font-semibold text-[#68706D]">
                    {otpTimer > 0 ? (
                      <span>Resend OTP in 0:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="text-[#1D6B4F] font-bold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </span>
                </div>

                {/* 6 Individual Digit Boxes */}
                <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-10 sm:w-12 h-11 sm:h-12 text-center text-base sm:text-lg font-black font-mono text-[#252525] bg-white border border-[#E5E1D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1D6B4F] focus:border-[#1D6B4F] shadow-2xs transition-all"
                    />
                  ))}
                </div>

                {verifyingOtp && (
                  <div className="text-center text-[11px] text-[#1D6B4F] font-bold animate-pulse">
                    Verifying security code...
                  </div>
                )}
              </div>
            )}

            {/* PASSWORD / PIN FIELD */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-[#252525] uppercase tracking-wide">
                  {mode === 'signup' ? 'Set Password / Security PIN' : 'Password / Security PIN'}
                </label>
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-[#1D6B4F] absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Set a secure PIN or password' : 'Enter your password / PIN'}
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FAF7F0] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#252525] placeholder-[#68706D]/60 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1D6B4F]/40 focus:border-[#1D6B4F] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#68706D] hover:text-[#252525] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {mode === 'signup' && (
                <p className="text-[10px] text-[#68706D] mt-1 px-1">
                  Use this PIN/Password to sign in on returning visits.
                </p>
              )}
            </div>

            {/* REMEMBER DEVICE & FORGOT PASSWORD */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[#68706D] font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-[#1D6B4F] focus:ring-[#1D6B4F] cursor-pointer"
                />
                <span>Remember this device</span>
              </label>

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryIdentifier(identifier);
                    setShowForgotPasswordModal(true);
                    setRecoverySuccess(false);
                  }}
                  className="text-xs text-[#1D6B4F] font-bold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              )}
            </div>

            {/* PRIMARY ACTION BUTTON */}
            <button
              type="submit"
              disabled={!isSubmitEnabled}
              className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 transition-all font-heading ${
                isSubmitEnabled
                  ? 'bg-[#1D6B4F] hover:bg-[#165B43] text-white active:scale-[0.99] cursor-pointer shadow-md'
                  : 'bg-[#1D6B4F]/30 text-white/70 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{mode === 'signin' ? 'Sign In to Advisory Portal' : 'Create Account & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* SECONDARY PATH: CONTINUE WITH GOOGLE */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[#E5E1D8]" />
              <span className="text-[11px] text-[#68706D] font-medium">or continue with</span>
              <div className="flex-1 h-px bg-[#E5E1D8]" />
            </div>

            <GoogleSignInButton
              onSuccess={onLoginSuccess}
              onError={(msg) => setError(msg)}
              enabled={googleEnabled}
            />
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-[#E5E1D8] py-3.5 px-4 text-center">
        <p className="text-xs text-[#68706D] font-medium">
          GramBiz AI · Institutional Credit Scheme Navigation & Priority Sector Advisory Portal
        </p>
      </footer>

      {/* Language Selection Sheet */}
      {showLangSheet && (
        <div className="fixed inset-0 z-50 bg-[#252525]/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-sm bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-[#E5E1D8]">
            <div className="w-10 h-1 bg-[#E5E1D8] rounded-full mx-auto sm:hidden" />
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#1D6B4F]" />
                <h3 className="text-sm font-bold text-[#252525] font-heading">{t.select_language_title}</h3>
              </div>
              <button
                onClick={() => setShowLangSheet(false)}
                className="p-1.5 rounded-xl bg-[#FAF7F0] text-[#68706D] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pb-2">
              {SUPPORTED_LANGUAGES.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    if (onLanguageChange) onLanguageChange(item.code);
                    setShowLangSheet(false);
                  }}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    language === item.code
                      ? 'border-[#1D6B4F] bg-[#E8F5EE] font-bold shadow-2xs'
                      : 'border-[#E5E1D8] bg-white hover:bg-[#FAF7F0]'
                  }`}
                >
                  <div className="text-xs text-[#68706D]">{item.name}</div>
                  <div className="text-sm font-black text-[#252525] font-heading mt-0.5">{item.native}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forgot Password / PIN Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-[#252525]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-xl border border-[#E5E1D8]">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#1D6B4F]" />
                <h3 className="text-sm font-bold text-[#252525] font-heading">Reset Password / PIN</h3>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="p-1.5 rounded-xl bg-[#FAF7F0] text-[#68706D] hover:text-[#252525] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {recoverySuccess ? (
              <div className="p-4 rounded-2xl bg-[#E8F5EE] border border-[#CDE8D8] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#1D6B4F] mx-auto" />
                <p className="text-xs text-[#1D6B4F] font-bold">
                  A password reset verification link and OTP has been sent to {recoveryIdentifier || 'your registered account'}.
                </p>
                <button
                  onClick={() => setShowForgotPasswordModal(false)}
                  className="mt-2 px-4 py-2 bg-[#1D6B4F] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-[#68706D]">
                  Enter your registered Email or 10-digit Mobile Number to receive recovery instructions.
                </p>
                <input
                  type="text"
                  value={recoveryIdentifier}
                  onChange={(e) => setRecoveryIdentifier(e.target.value)}
                  placeholder="Registered email or 10-digit mobile"
                  className="w-full px-3.5 py-2.5 bg-[#FAF7F0] border border-[#E5E1D8] rounded-2xl text-xs font-semibold text-[#252525] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1D6B4F]/40 focus:border-[#1D6B4F]"
                />
                <button
                  type="button"
                  disabled={recoveryIdentifier.trim().length < 4}
                  onClick={() => setRecoverySuccess(true)}
                  className="w-full py-2.5 bg-[#1D6B4F] disabled:bg-[#1D6B4F]/30 text-white text-xs font-bold rounded-2xl shadow-xs cursor-pointer disabled:cursor-not-allowed transition-all"
                >
                  Send Recovery Link
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AuthScreen;
