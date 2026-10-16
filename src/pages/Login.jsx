import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Plane,
  ShieldCheck,
  QrCode,
  KeyRound,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export default function Login() {
  const { login, verifyOtpAndFinishLogin, addToast } = usePortal();
  const navigate = useNavigate();

  const [loginId, setLoginId] = useState('Atta');
  const [password, setPassword] = useState('GhC@*589');
  const [showPassword, setShowPassword] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 2FA Step state
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [pendingUser, setPendingUser] = useState(null);
  const [otpCode, setOtpCode] = useState('482910');
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
        navigate('/FlightBookings');
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
      navigate('/FlightBookings');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-[#FAFAFA]">
      {/* Left Hero Panel — Deep #EE8200 & Obsidian Architecture */}
      <div className="hidden lg:flex lg:col-span-7 bg-[#EE8200] text-white p-12 flex-col justify-between relative overflow-hidden">
        <div
          className="absolute -right-24 -bottom-24 w-96 h-96 rounded-full border border-white/10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
        />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 border border-white/15">
            <Plane className="w-5 h-5 text-white" />
            <span className="font-display font-bold text-sm tracking-wider uppercase">
              TABAN AIRLINES • EXECUTIVE OTA COMMAND
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl xl:text-5xl leading-tight mt-10 max-w-xl">
            B2B Group Charter, POS Ticketing & Sub-Agent Consolidation.
          </h1>
          <p className="text-white/75 text-base mt-5 max-w-lg leading-relaxed">
            Manage group seat inventory, approve sub-agent PNR blocks, issue instant e-tickets, and generate IATA PNL & Excel passenger manifests from a unified command desk.
          </p>

          <div className="grid grid-cols-3 gap-4 mt-10 max-w-xl">
            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-2xl font-extrabold font-display">6 Modules</div>
              <div className="text-xs text-white/70 mt-1">Bookings, POS, Flights, Segments, Agents, Analytics</div>
            </div>
            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-2xl font-extrabold font-display">IATA PNL</div>
              <div className="text-xs text-white/70 mt-1">1-Click Excel, Word & A4 E-Ticket PDF Exports</div>
            </div>
            <div className="p-4 rounded-2xl bg-black/35 border border-white/10">
              <div className="text-2xl font-extrabold font-display">2FA Ready</div>
              <div className="text-xs text-white/70 mt-1">Role-based Sub-Agent & Operator Access Control</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 border-t border-white/10 pt-6">
          <span>Taban Airline OTA Admin Portal</span>
          <span className="font-mono">Theme #EE8200 • White • Black</span>
        </div>
      </div>

      {/* Right Login Card */}
      <div className="lg:col-span-5 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Brand Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-[#EE8200] text-white flex items-center justify-center font-display font-extrabold text-xl shadow-lg">
              TA
            </div>
            <div>
              <h2 className="font-display font-extrabold text-2xl text-[#0B0A09]">Sign In</h2>
              <p className="text-xs text-neutral-500">
                Taban Airline OTA Admin & Sub-Agent Portal
              </p>
            </div>
          </div>

          {step === 'credentials' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              {/* Quick Fill Credentials Banner */}
              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/20 flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-bold text-[#EE8200] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Configured Admin Account
                  </div>
                  <div className="text-neutral-700 font-mono mt-0.5">
                    ID: <b>Atta</b> &nbsp;|&nbsp; Pass: <b>GhC@*589</b>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLoginId('Atta');
                    setPassword('GhC@*589');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#EE8200] text-white text-[11px] font-bold hover:bg-black transition"
                >
                  Auto-Fill
                </button>
              </div>

              {/* Login ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B0A09] mb-2">
                  Login ID *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EE8200]">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    placeholder="Enter Login ID (e.g. Atta)"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none text-sm font-medium bg-[#FAFAFA] focus:bg-white transition"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B0A09] mb-2">
                  Password *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EE8200]">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    className="w-full pl-10 pr-11 py-3 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none text-sm font-medium bg-[#FAFAFA] focus:bg-white transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-[#EE8200]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Optional 2FA / OTP Mode Toggle */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700">
                  <input
                    type="checkbox"
                    checked={require2FA}
                    onChange={(e) => setRequire2FA(e.target.checked)}
                    className="rounded border-neutral-300 text-[#EE8200] focus:ring-[#EE8200]"
                  />
                  <span>Preview 2FA / OTP & QR Authenticator Step</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                <span>{submitting ? 'Signing In...' : 'Login to Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* 2FA / OTP Verification Section (Matches Login.razor otp-section & qr-section) */
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-[#FFF7ED] border border-[#EE8200]/20 text-center">
                <div className="w-12 h-12 rounded-xl bg-[#EE8200] text-white flex items-center justify-center mx-auto mb-2">
                  <QrCode className="w-6 h-6" />
                </div>
                <h5 className="font-bold text-sm text-[#0B0A09]">Scan QR Code / Enter OTP</h5>
                <p className="text-xs text-neutral-600 mt-1">
                  An OTP has been sent to your registered contact, or use your authenticator app.
                </p>
                <div className="mt-3 p-2.5 rounded-lg bg-white border border-neutral-200 text-xs">
                  Or enter this code manually:
                  <div className="font-mono font-bold text-[#EE8200] mt-0.5">{manualKey}</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0B0A09] mb-2">
                  Enter 2FA Authentication Code / OTP
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#EE8200]">
                    <KeyRound className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none text-sm font-mono font-bold tracking-widest bg-[#FAFAFA]"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="px-4 py-3 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-6 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold text-sm transition"
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
