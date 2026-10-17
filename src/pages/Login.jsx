import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  QrCode,
  KeyRound,
  ArrowRight
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export default function Login() {
  const { login, verifyOtpAndFinishLogin, addToast } = usePortal();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState('credentials');
  const [pendingUser, setPendingUser] = useState(null);
  const [otpCode, setOtpCode] = useState('');
  const [manualKey, setManualKey] = useState('JBSWY3DPEHPK3PXP');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      addToast('Please enter both Login ID and Password.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await login(loginId, password, require2FA);
      if (res.status === '2fa_required') {
        setPendingUser(res.user);
        setManualKey(res.manualKey || 'JBSWY3DPEHPK3PXP');
        setStep('otp');
      } else {
        navigate('/FlightPOS');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await verifyOtpAndFinishLogin(pendingUser, otpCode);
      navigate('/FlightPOS');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#F8FAFC]">
      {/* Left Hero Panel — Taban Air Royal Navy */}
      <div className="hidden lg:flex lg:col-span-7 bg-gradient-to-br from-[#0B1528] via-[#15284B] to-[#1D314F] text-white p-10 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-3.5 py-2 rounded-xl bg-white/10 border border-white/15">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-8 h-8 rounded bg-white p-0.5 object-contain"
            />
            <span className="font-display font-semibold text-xs tracking-wider uppercase">
              BOOKLY • TABAN AIR B2B PORTAL
            </span>
          </div>

          <h1 className="font-display font-semibold text-3xl xl:text-4xl leading-snug mt-8 max-w-lg">
            Taban Air Group Charter, POS Search & Sub-Agent Ticketing.
          </h1>
          <p className="text-white/75 text-sm mt-4 max-w-md leading-relaxed">
            Search flight segments directly in POS, issue instant e-tickets with official Taban Air itinerary receipts, and export IATA PNL & Excel passenger manifests.
          </p>

          <div className="grid grid-cols-3 gap-3.5 mt-8 max-w-lg">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-lg font-semibold font-display text-white">Direct POS</div>
              <div className="text-[11px] text-white/70 mt-0.5">Search & book directly from flight segments</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-lg font-semibold font-display text-white">IATA PNL</div>
              <div className="text-[11px] text-white/70 mt-0.5">1-Click Excel, Word & PDF E-Ticket exports</div>
            </div>
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10">
              <div className="text-lg font-semibold font-display text-white">Cloud Sync</div>
              <div className="text-[11px] text-white/70 mt-0.5">Real-time shared database across all agents</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 border-t border-white/10 pt-5">
          <span>Bookly • Taban Air Portal</span>
          <span className="font-mono">B2B Aviation System</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-3 mb-6">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-12 h-12 rounded-xl border border-slate-200 p-1 object-contain shadow-xs"
            />
            <div>
              <h2 className="font-display font-semibold text-xl text-slate-900">Bookly Sign In</h2>
              <p className="text-xs text-slate-500">
                Taban Air B2B Booking & Inventory System
              </p>
            </div>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Login ID *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter Login ID"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-xs bg-slate-50 focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-xs bg-slate-50 focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1B3664]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                    className="rounded border-slate-300 text-[#1B3664] focus:ring-[#1B3664]"
                  />
                  <span>Enable 2FA / OTP Verification</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>{submitting ? 'Signing In...' : 'Login'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <div className="w-10 h-10 rounded-lg bg-[#1B3664] text-white flex items-center justify-center mx-auto mb-2">
                  <QrCode className="w-5 h-5" />
                </div>
                <h5 className="font-semibold text-xs text-slate-800">Scan QR Code / Enter OTP</h5>
                <div className="mt-2 p-2 rounded bg-white border border-slate-200 text-xs">
                  Manual Key:
                  <div className="font-mono font-semibold text-[#1B3664] mt-0.5">{manualKey}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Enter 2FA Authentication Code
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1B3664]">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 px-5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-xs transition"
                >
                  Verify OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
