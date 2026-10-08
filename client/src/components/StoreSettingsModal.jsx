import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  Smartphone, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Store, 
  Save, 
  Lock, 
  RefreshCw,
  Phone
} from 'lucide-react';
import { 
  requestTwoFactorSetup, 
  confirmTwoFactorEnable, 
  disableTwoFactor,
  updateStoreProfile
} from '../services/api';

export default function StoreSettingsModal({ isOpen, onClose, storeInfo, onUpdateStoreInfo }) {
  const [activeTab, setActiveTab] = useState('security'); // 'security' | 'profile'
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // 2FA Flow State
  const [is2FaEnabled, setIs2FaEnabled] = useState(Boolean(storeInfo?.isTwoFactorEnabled));
  const [setupStep, setSetupStep] = useState('idle'); // 'idle' | 'otp_sent' | 'disable_prompt'
  const [otpInput, setOtpInput] = useState('');
  const [disablePasswordInput, setDisablePasswordInput] = useState('');
  const [setupDevOtp, setSetupDevOtp] = useState('');
  const [setupMaskedPhone, setSetupMaskedPhone] = useState('');

  // Profile Form State
  const [profileData, setProfileData] = useState({
    storeName: storeInfo?.storeName || '',
    ownerName: storeInfo?.ownerName || '',
    phone: storeInfo?.phone || '',
    city: storeInfo?.address?.city || '',
    taxId: storeInfo?.taxId || '',
    currencySymbol: storeInfo?.currencySymbol || '₹',
    receiptHeader: storeInfo?.receiptSettings?.headerMessage || 'Thank you for shopping with us!',
    receiptFooter: storeInfo?.receiptSettings?.footerMessage || 'Goods once sold cannot be returned without receipt.'
  });

  if (!isOpen) return null;

  // Initiate 2FA Enable (Send OTP to store mobile)
  const handleStartEnable2Fa = async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const res = await requestTwoFactorSetup();
      setSetupMaskedPhone(res.phoneMasked || '');
      setSetupDevOtp(res.devOtp || '');
      setSetupStep('otp_sent');
      setOtpInput('');
      setMessage({ type: 'success', text: `6-digit verification code sent to your mobile ending in ${res.phoneMasked || 'your phone'}` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm OTP and Enable 2FA
  const handleConfirmEnable2Fa = async (e) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setMessage({ type: 'error', text: 'Please enter the 6-digit OTP code' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await confirmTwoFactorEnable({ otp: otpInput.trim() });
      setIs2FaEnabled(true);
      setSetupStep('idle');
      setOtpInput('');
      if (onUpdateStoreInfo && res.store) {
        onUpdateStoreInfo(res.store);
      }
      setMessage({ type: 'success', text: 'Two-Step Authentication enabled successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Invalid verification code' });
    } finally {
      setIsLoading(false);
    }
  };

  // Confirm Password and Disable 2FA
  const handleConfirmDisable2Fa = async (e) => {
    e.preventDefault();
    if (!disablePasswordInput) {
      setMessage({ type: 'error', text: 'Password is required to disable Two-Step Authentication' });
      return;
    }

    setIsLoading(true);
    setMessage(null);
    try {
      const res = await disableTwoFactor({ password: disablePasswordInput });
      setIs2FaEnabled(false);
      setSetupStep('idle');
      setDisablePasswordInput('');
      if (onUpdateStoreInfo && res.store) {
        onUpdateStoreInfo(res.store);
      }
      setMessage({ type: 'success', text: 'Two-Step Authentication disabled.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Incorrect password' });
    } finally {
      setIsLoading(false);
    }
  };

  // Save Store Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    try {
      const payload = {
        storeName: profileData.storeName,
        ownerName: profileData.ownerName,
        phone: profileData.phone,
        address: { ...storeInfo?.address, city: profileData.city },
        taxId: profileData.taxId,
        currencySymbol: profileData.currencySymbol,
        receiptSettings: {
          headerMessage: profileData.receiptHeader,
          footerMessage: profileData.receiptFooter,
          showBarcodeOnReceipt: true
        }
      };

      const updated = await updateStoreProfile(payload);
      if (onUpdateStoreInfo) {
        onUpdateStoreInfo(updated);
      }
      setMessage({ type: 'success', text: 'Store profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm tracking-tight">Store Settings & Security</h3>
              <p className="text-[11px] text-slate-300">Manage 2-Step verification & store details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 border-b border-slate-200 text-xs font-bold text-center">
          <button
            onClick={() => { setActiveTab('security'); setMessage(null); }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'security'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>2-Step Verification</span>
          </button>
          <button
            onClick={() => { setActiveTab('profile'); setMessage(null); }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'profile'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Store className="w-4 h-4 text-emerald-600" />
            <span>Store Profile</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {message && (
            <div className={`mb-4 p-3 rounded-xl border text-xs font-medium flex items-center gap-2 animate-in fade-in ${
              message.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* TAB 1: SECURITY & 2-STEP AUTHENTICATION */}
          {activeTab === 'security' && (
            <div className="space-y-5 text-xs">
              {/* Current Status Box */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">Two-Step Authentication</span>
                    {is2FaEnabled ? (
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm">
                    {is2FaEnabled 
                      ? `Your account is protected. Every sign-in requires entering a 6-digit OTP sent to your registered mobile (${storeInfo?.phone || 'registered phone'}).` 
                      : `Add an extra layer of defense. When enabled, signing in requires a one-time code sent to your mobile phone.`}
                  </p>
                </div>

                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                  {is2FaEnabled ? (
                    <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-6 h-6 text-amber-500" />
                  )}
                </div>
              </div>

              {/* Action Buttons & Steps */}
              {setupStep === 'idle' && (
                <div>
                  {!is2FaEnabled ? (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleStartEnable2Fa}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4" />
                          <span>Enable 2-Step Authentication via SMS</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSetupStep('disable_prompt')}
                      className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 transition flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Disable 2-Step Authentication</span>
                    </button>
                  )}
                </div>
              )}

              {/* Step: OTP Sent for Enabling 2FA */}
              {setupStep === 'otp_sent' && (
                <form onSubmit={handleConfirmEnable2Fa} className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-950 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      Verify Mobile Ownership
                    </span>
                    <button
                      type="button"
                      onClick={() => setSetupStep('idle')}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-[11px] text-indigo-900/80">
                    Enter the 6-digit verification code sent to your registered mobile number ending in <strong className="text-indigo-950">{setupMaskedPhone || 'your phone'}</strong>.
                  </p>

                  {/* Dev OTP Helper */}
                  {setupDevOtp && (
                    <div className="p-2 rounded-lg bg-indigo-100/70 border border-indigo-200 flex items-center justify-between text-[11px]">
                      <span>📱 Test Code: <strong className="font-mono text-indigo-800">{setupDevOtp}</strong></span>
                      <button
                        type="button"
                        onClick={() => setOtpInput(setupDevOtp)}
                        className="text-[10px] bg-indigo-600 text-white px-2 py-0.5 rounded font-bold"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    placeholder="Enter 6-digit OTP"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl font-mono text-center text-sm font-bold tracking-widest focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || otpInput.length !== 6}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition"
                    >
                      {isLoading ? 'Verifying...' : 'Confirm & Enable 2FA'}
                    </button>
                    <button
                      type="button"
                      onClick={handleStartEnable2Fa}
                      disabled={isLoading}
                      className="px-3 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
                      title="Resend code"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              )}

              {/* Step: Disable 2FA Prompt */}
              {setupStep === 'disable_prompt' && (
                <form onSubmit={handleConfirmDisable2Fa} className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-rose-950 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-rose-600" />
                      Confirm Password to Turn Off 2FA
                    </span>
                    <button
                      type="button"
                      onClick={() => setSetupStep('idle')}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Cancel
                    </button>
                  </div>

                  <p className="text-[11px] text-rose-900/80">
                    To disable Two-Step Authentication, please enter your store account password:
                  </p>

                  <input
                    type="password"
                    required
                    placeholder="Current Password"
                    value={disablePasswordInput}
                    onChange={(e) => setDisablePasswordInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />

                  <button
                    type="submit"
                    disabled={isLoading || !disablePasswordInput}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition"
                  >
                    {isLoading ? 'Confirming...' : 'Confirm & Turn Off 2FA'}
                  </button>
                </form>
              )}

              {/* Security Recommendations List */}
              <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <span className="font-bold text-slate-700 block">Security Best Practices:</span>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Never disclose your one-time passwords to anyone over phone or email.
                </p>
                <p className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  Always keep your registered mobile phone number updated.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: STORE PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.storeName}
                    onChange={(e) => setProfileData({ ...profileData, storeName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Owner Name</label>
                  <input
                    type="text"
                    required
                    value={profileData.ownerName}
                    onChange={(e) => setProfileData({ ...profileData, ownerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Registered Phone (for OTP)</label>
                  <input
                    type="tel"
                    required
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">City / Location</label>
                  <input
                    type="text"
                    value={profileData.city}
                    onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
                  <input
                    type="text"
                    value={profileData.taxId}
                    onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                    placeholder="e.g. 19ABCDE1234F1Z5"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={profileData.currencySymbol}
                    onChange={(e) => setProfileData({ ...profileData, currencySymbol: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Receipt Header Message</label>
                <input
                  type="text"
                  value={profileData.receiptHeader}
                  onChange={(e) => setProfileData({ ...profileData, receiptHeader: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
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
                    <Save className="w-4 h-4" />
                    <span>Save Store Settings</span>
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
