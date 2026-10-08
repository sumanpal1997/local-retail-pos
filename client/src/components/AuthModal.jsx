import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  Building2, 
  User, 
  Phone, 
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Store,
  ShieldCheck,
  Smartphone,
  KeyRound,
  RotateCcw,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  loginUser, 
  registerUser, 
  verifyTwoFactorOtp, 
  resendTwoFactorOtp, 
  requestPasswordReset, 
  resetPasswordWithOtp 
} from '../services/api';

export default function AuthModal({ isOpen, onClose, initialMode = 'login', initialPlan = 'pro', onAuthSuccess }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | '2fa' | 'forgot_password'
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA State
  const [twoFactorData, setTwoFactorData] = useState({
    tempToken: '',
    phoneMasked: '',
    devOtp: ''
  });
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputsRef = useRef([]);

  // Resend Cooldown Timer
  const [resendCooldown, setResendCooldown] = useState(0);

  // Forgot Password Form
  const [forgotStep, setForgotStep] = useState(1); // 1: enter identifier, 2: verify OTP & new password
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotPhoneMasked, setForgotPhoneMasked] = useState('');
  const [forgotDevOtp, setForgotDevOtp] = useState('');
  const [forgotSmsNotice, setForgotSmsNotice] = useState('');
  const [forgotRealSmsSent, setForgotRealSmsSent] = useState(false);

  // Register Form
  const [registerData, setRegisterData] = useState({
    storeName: '',
    ownerName: '',
    email: '',
    phone: '',
    city: '',
    password: '',
    plan: initialPlan,
    isTwoFactorEnabled: false
  });

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Sync mode with props when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      setSuccessMessage(null);
      setForgotStep(1);
      setOtpDigits(['', '', '', '', '', '']);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // Handle standard login or initiate 2FA
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await loginUser({ email: loginEmail.trim(), password: loginPassword });
      
      // If store requires Two-Step Authentication via OTP
      if (res.twoFactorRequired) {
        setTwoFactorData({
          tempToken: res.tempToken,
          phoneMasked: res.phoneMasked,
          devOtp: res.devOtp || '',
          smsNotice: res.smsNotice || '',
          realSmsSent: Boolean(res.realSmsSent)
        });
        setOtpDigits(['', '', '', '', '', '']);
        setResendCooldown(60);
        setMode('2fa');
      } else {
        onAuthSuccess(res.store);
        onClose();
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle 2FA OTP submission
  const handleTwoFactorSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpCode = otpDigits.join('').trim();
    if (otpCode.length !== 6) {
      setErrorMessage('Please enter the full 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await verifyTwoFactorOtp({
        tempToken: twoFactorData.tempToken,
        otp: otpCode
      });
      onAuthSuccess(res.store);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Verification failed. Please check your code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Resend 2FA OTP
  const handleResendTwoFactorOtp = async () => {
    if (resendCooldown > 0 || !twoFactorData.tempToken) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await resendTwoFactorOtp({ tempToken: twoFactorData.tempToken });
      setResendCooldown(60);
      setTwoFactorData(prev => ({
        ...prev,
        phoneMasked: res.phoneMasked || prev.phoneMasked,
        devOtp: res.devOtp || '',
        smsNotice: res.smsNotice || '',
        realSmsSent: Boolean(res.realSmsSent)
      }));
      setSuccessMessage('A fresh verification code has been dispatched to your mobile number.');
    } catch (err) {
      setErrorMessage(err.message || 'Could not resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // OTP digit boxes input handler
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    
    // Handle paste of 6 digits
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      pasted.forEach((d, idx) => {
        newDigits[idx] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Quick autofill test OTP for 2FA
  const handleAutofill2fa = () => {
    if (!twoFactorData.devOtp) return;
    const digits = twoFactorData.devOtp.slice(0, 6).split('');
    setOtpDigits(digits);
  };

  // Forgot Password: Request OTP
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your registered email address or mobile phone.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await requestPasswordReset({ identifier: forgotIdentifier.trim() });
      setForgotPhoneMasked(res.phoneMasked || '');
      setForgotDevOtp(res.devOtp || '');
      setForgotSmsNotice(res.smsNotice || '');
      setForgotRealSmsSent(Boolean(res.realSmsSent));
      setForgotStep(2);
      setResendCooldown(60);
      setSuccessMessage(res.message || 'Verification code sent to your registered mobile number.');
    } catch (err) {
      setErrorMessage(err.message || 'Could not find an account with that information.');
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot Password: Confirm New Password
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await resetPasswordWithOtp({
        identifier: forgotIdentifier.trim(),
        otp: forgotOtp.trim(),
        newPassword: forgotNewPassword
      });
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setMode('login');
      if (res.email) setLoginEmail(res.email);
      setLoginPassword('');
      setForgotStep(1);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reset password. Please verify the code.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend Forgot Password OTP
  const handleResendForgotOtp = async () => {
    if (resendCooldown > 0) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await requestPasswordReset({ identifier: forgotIdentifier.trim() });
      setResendCooldown(60);
      setForgotDevOtp(res.devOtp || '');
      setForgotSmsNotice(res.smsNotice || '');
      setForgotRealSmsSent(Boolean(res.realSmsSent));
      setSuccessMessage('New reset code sent to your mobile phone.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setIsLoading(false);
    }
  };

  // Register New Merchant
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await registerUser(registerData);
      onAuthSuccess(res.store);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fill Quick Demo Credentials
  const fillQuickDemo = (role) => {
    setMode('login');
    setErrorMessage(null);
    setSuccessMessage(null);
    if (role === 'superadmin') {
      setLoginEmail('admin@retailpos.com');
      setLoginPassword('admin123');
    } else {
      setLoginEmail('apnasupermart@localpos.com');
      setLoginPassword('store123');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              {mode === '2fa' ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : mode === 'forgot_password' ? (
                <KeyRound className="w-4 h-4 text-amber-400" />
              ) : (
                <Store className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">RetailPOS Cloud</h3>
              <p className="text-[10px] text-slate-300">
                {mode === '2fa' 
                  ? 'Two-Step Security Check' 
                  : mode === 'forgot_password' 
                  ? 'Password Recovery' 
                  : 'Unified Access & Onboarding'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Visible on Login & Register & Forgot modes) */}
        {mode !== '2fa' && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
            <button
              onClick={() => { 
                setMode('login'); 
                setErrorMessage(null); 
                setSuccessMessage(null); 
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'login' || mode === 'forgot_password'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In (Admin / Store)
            </button>
            <button
              onClick={() => { 
                setMode('register'); 
                setErrorMessage(null); 
                setSuccessMessage(null); 
              }}
              className={`py-2 rounded-xl transition ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Register Store Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* 1. SIGN IN TAB */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setForgotStep(1);
                      if (loginEmail) setForgotIdentifier(loginEmail);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Verify & Launch Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Logins Helper */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 block text-center mb-2">
                  ⚡ 1-Click Quick Demo Sign In
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('superadmin')}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
                  >
                    <span>👑 Super Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickDemo('store')}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <span>🏪 Store Merchant</span>
                  </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Secure login with automatic 2-Step mobile OTP verification when activated.
                </p>
              </div>
            </form>
          )}

          {/* 2. TWO-STEP AUTHENTICATION (2FA VIA MOBILE OTP) */}
          {mode === '2fa' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600 shadow-xs">
                  <Smartphone className="w-6 h-6 animate-pulse" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">2-Step Mobile Verification</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Enter the 6-digit OTP code sent to your registered phone ending in{' '}
                  <span className="font-bold text-slate-800">{twoFactorData.phoneMasked}</span>
                </p>
              </div>

              {/* Dev Simulation / Carrier Notice Helper */}
              {twoFactorData.devOtp && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {twoFactorData.realSmsSent ? 'Carrier SMS Dispatched' : 'Live Carrier SMS Notice'}
                    </span>
                    <button
                      type="button"
                      onClick={handleAutofill2fa}
                      className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-lg transition"
                    >
                      Auto-Fill Code
                    </button>
                  </div>
                  <div className="text-amber-950 font-medium">
                    OTP Code: <strong className="font-mono text-base font-extrabold text-amber-900 tracking-wider ml-1">{twoFactorData.devOtp}</strong>
                  </div>
                  {twoFactorData.smsNotice && (
                    <p className="text-[10px] text-amber-800 leading-tight">
                      Note: {twoFactorData.smsNotice}
                    </p>
                  )}
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-center gap-2 pt-1">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputsRef.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-11 h-12 text-center text-lg font-bold font-mono bg-slate-50 border border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:outline-none transition"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={handleTwoFactorSubmit}
                disabled={isLoading || otpDigits.join('').length !== 6}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 mt-3"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code & Sign In</span>
                  </>
                )}
              </button>

              {/* Resend and Cancel */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleResendTwoFactorOtp}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code via SMS'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* 3. FORGOT PASSWORD FLOW */}
          {mode === 'forgot_password' && (
            <div className="space-y-4 text-xs animate-in fade-in">
              {forgotStep === 1 ? (
                /* Step 1: Request OTP by entering identifier */
                <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Reset Your Password</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Enter your registered email address or mobile phone. We will dispatch a 6-digit verification code to your phone.
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Email Address or Mobile Number
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="name@company.com or 9876500000"
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Send Mobile Verification Code</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Verify OTP & Enter New Password */
                <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Enter OTP & Set New Password</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Verification code sent to registered mobile ending in{' '}
                      <strong className="text-slate-800">{forgotPhoneMasked}</strong>
                    </p>
                  </div>

                  {forgotDevOtp && (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          {forgotRealSmsSent ? 'Carrier SMS Dispatched' : 'Live Carrier SMS Notice'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForgotOtp(forgotDevOtp)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded-lg text-[10px] transition"
                        >
                          Auto-Fill Code
                        </button>
                      </div>
                      <div className="text-amber-950 font-medium">
                        OTP Code: <strong className="font-mono text-base font-extrabold text-amber-900 tracking-wider ml-1">{forgotDevOtp}</strong>
                      </div>
                      {forgotSmsNotice && (
                        <p className="text-[10px] text-amber-800 leading-tight">
                          Note: {forgotSmsNotice}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">6-Digit Verification Code</label>
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || isLoading}
                        onClick={handleResendForgotOtp}
                        className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 disabled:text-slate-400"
                      >
                        {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                      </button>
                    </div>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        required
                        placeholder="123456"
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold tracking-widest text-center text-sm focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">New Password (Min 6 chars)</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 mt-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>Update Password & Continue</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotStep(1);
                        setMode('login');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. REGISTER TAB */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Store / Business Name *</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Supermarket"
                    value={registerData.storeName}
                    onChange={(e) => setRegisterData({ ...registerData, storeName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={registerData.ownerName}
                    onChange={(e) => setRegisterData({ ...registerData, ownerName: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="anand@gmail.com"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Town</label>
                  <input
                    type="text"
                    placeholder="e.g. Kolkata"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* 2FA Option Checkbox */}
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 cursor-pointer"
                   onClick={() => setRegisterData({ ...registerData, isTwoFactorEnabled: !registerData.isTwoFactorEnabled })}>
                <input
                  type="checkbox"
                  id="twoFactorEnableCheck"
                  checked={registerData.isTwoFactorEnabled}
                  onChange={(e) => setRegisterData({ ...registerData, isTwoFactorEnabled: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="twoFactorEnableCheck" className="text-[11px] text-slate-700 cursor-pointer">
                  <span className="font-bold flex items-center gap-1 text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Enable 2-Step Authentication via Mobile SMS
                  </span>
                  <span className="text-slate-500 block text-[10px] mt-0.5">
                    Receive a 6-digit OTP on your mobile number every time you sign in.
                  </span>
                </label>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select SaaS Plan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'starter', label: 'Starter', price: '₹0' },
                    { id: 'pro', label: 'Pro', price: '₹799/m' },
                    { id: 'enterprise', label: 'Enterprise', price: '₹1,999/m' },
                  ].map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setRegisterData({ ...registerData, plan: p.id })}
                      className={`p-2 rounded-xl border text-center cursor-pointer transition ${
                        registerData.plan === p.id
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <div className="capitalize text-[11px]">{p.label}</div>
                      <div className="text-[10px] text-slate-400 font-semibold">{p.price}</div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Create Account & Start Free</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
