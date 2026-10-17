import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  ShoppingBag,
  Layers,
  Users,
  Search,
  Bell,
  Mail,
  Globe,
  LogOut,
  Menu,
  X,
  RotateCcw,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR } from '../utils/exporters';

const navSections = [
  {
    group: 'Overview',
    items: [
      { to: '/Dashboard', label: 'Dashboard', urdu: 'ڈیش بورڈ', icon: LayoutDashboard }
    ]
  },
  {
    group: 'Flight Operations',
    items: [
      { to: '/FlightPOS', label: 'Flight POS (Search & Book)', urdu: 'فلائٹ سرچ اور بکنگ', icon: ShoppingBag },
      { to: '/FlightBookings', label: 'Flight Bookings', urdu: 'فلائٹ بکنگز', icon: Ticket, badgeKey: 'pending' },
      { to: '/SegmentManagement', label: 'Segment Management', urdu: 'سیگمنٹ مینجمنٹ', icon: Layers }
    ]
  },
  {
    group: 'Agency Network',
    items: [
      { to: '/ManageSubAgents', label: 'Manage Sub Agents', urdu: 'سب ایجنٹس', icon: Users }
    ]
  }
];

export default function Layout({ children }) {
  const {
    user,
    logout,
    language,
    setLanguage,
    bookings,
    segments,
    subAgents,
    toasts,
    showTimeoutModal,
    setShowTimeoutModal,
    resetDemoData
  } = usePortal();

  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [openDropdown, setOpenDropdown] = useState(null);

  const pendingCount = bookings.filter((b) => b.ApprovalStatus === 'Pending').length;

  const searchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return { bookings: [], segments: [], agents: [] };
    return {
      bookings: bookings
        .filter(
          (b) =>
            b.PNR?.toLowerCase().includes(q) ||
            b.AirGroupBookingID?.toLowerCase().includes(q) ||
            b.SubCompanyName?.toLowerCase().includes(q) ||
            (b.Passengers || []).some(
              (p) =>
                p.FirstName?.toLowerCase().includes(q) ||
                p.LastName?.toLowerCase().includes(q) ||
                p.PassportNumber?.toLowerCase().includes(q)
            )
        )
        .slice(0, 4),
      segments: (segments || [])
        .filter(
          (s) =>
            s.FlightNumber?.toLowerCase().includes(q) ||
            s.DepartureIata?.toLowerCase().includes(q) ||
            s.ArrivalIata?.toLowerCase().includes(q) ||
            s.DepartureCity?.toLowerCase().includes(q) ||
            s.ArrivalCity?.toLowerCase().includes(q)
        )
        .slice(0, 4),
      agents: subAgents
        .filter(
          (a) =>
            a.CompanyName?.toLowerCase().includes(q) ||
            a.City?.toLowerCase().includes(q)
        )
        .slice(0, 3)
    };
  }, [searchQuery, bookings, segments, subAgents]);

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR — Deep Royal Navy #0F172A / #1B3664 */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0F172A] text-white border-r border-slate-800 transition-all duration-200 ${
          sidebarCollapsed ? 'w-16' : 'w-60'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header with Taban Air Logo */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-slate-800 bg-[#0B1221]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-8 h-8 rounded-lg bg-white p-0.5 object-contain shrink-0 shadow-xs"
            />
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <div className="font-display font-semibold text-sm tracking-wide text-white flex items-center gap-1.5">
                  BOOKLY <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1B3664] text-white font-mono">OTA</span>
                </div>
                <p className="text-[10px] text-slate-400 truncate">Taban Air Booking System</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Operator Card */}
        {!sidebarCollapsed && (
          <div className="mx-3 mt-3 p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/70 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1B3664] flex items-center justify-center font-semibold text-xs text-white shrink-0">
              {(user?.LoginID || 'TE').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {user?.FullName || 'Test Admin'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {user?.AccountType || 'Administrator'} • @{user?.LoginID || 'test'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-2.5 py-4 space-y-5 overflow-y-auto">
          {navSections.map((sec) => (
            <div key={sec.group}>
              {!sidebarCollapsed && (
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {sec.group}
                </div>
              )}
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.toLowerCase() === item.to.toLowerCase();
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#1B3664] text-white shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                          }`}
                        />
                        {!sidebarCollapsed && (
                          <span className="truncate">
                            {language === 'Urdu' ? item.urdu : item.label}
                          </span>
                        )}
                      </div>
                      {!sidebarCollapsed && item.badgeKey === 'pending' && pendingCount > 0 && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-full ${
                            isActive
                              ? 'bg-white text-[#1B3664]'
                              : 'bg-[#1B3664] text-white'
                          }`}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-2.5 border-t border-slate-800 bg-[#0B1221] space-y-1">
          <button
            onClick={() => setShowTimeoutModal(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Session Guard</span>}
          </button>
          <button
            onClick={resetDemoData}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {!sidebarCollapsed && <span>Clear All Data</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium bg-[#1B3664] text-white hover:bg-[#152a4f] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out ({user?.LoginID || 'test'})</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
          {/* Left: Hamburger + Global Search */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Toggle Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenDropdown('search');
                }}
                onFocus={() => setOpenDropdown('search')}
                placeholder="Search PNR, Booking ID, Passenger, Flight Segment, or Agent..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1B3664] focus:bg-white transition"
              />
              {openDropdown === 'search' && searchQuery.trim().length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-50 max-h-80 overflow-y-auto"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B3664] px-2 py-1">
                    Bookings ({searchResults.bookings.length})
                  </div>
                  {searchResults.bookings.map((b) => (
                    <button
                      key={b.AirGroupBookingID}
                      onClick={() => {
                        setOpenDropdown(null);
                        setSearchQuery('');
                        navigate('/FlightBookings');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#1B3664] font-mono">{b.PNR}</span> •{' '}
                        <span className="font-medium">{b.SubCompanyName}</span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {b.ApprovalStatus}
                      </span>
                    </button>
                  ))}

                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#1B3664] px-2 py-1 mt-1.5">
                    Flight Segments ({searchResults.segments.length})
                  </div>
                  {searchResults.segments.map((s) => (
                    <button
                      key={s.AirGroupSegmentID}
                      onClick={() => {
                        setOpenDropdown(null);
                        setSearchQuery('');
                        navigate('/FlightPOS');
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium truncate">
                        {s.FlightNumber} • {s.DepartureIata} &rarr; {s.ArrivalIata}
                      </span>
                      <span className="font-mono text-[#1B3664] font-semibold">
                        {formatCurrencyPKR(s.AdultPrice)}
                      </span>
                    </button>
                  ))}

                  {searchResults.bookings.length === 0 &&
                    searchResults.segments.length === 0 &&
                    searchResults.agents.length === 0 && (
                      <div className="text-xs text-slate-500 py-3 text-center">
                        No matching records found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick POS Button, Language, Notifications, Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/FlightPOS')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3664] text-white hover:bg-[#0F172A] text-xs font-medium transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>POS Flight Search</span>
            </button>

            <button
              onClick={() => setLanguage((l) => (l === 'English' ? 'Urdu' : 'English'))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#1B3664]" />
              <span>{language}</span>
            </button>

            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')
                }
                className="relative p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-slate-700" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1B3664] text-white text-[10px] font-semibold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              {openDropdown === 'notifications' && (
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="bg-[#1D314F] text-white px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold">
                    <span>Notifications</span>
                    <span className="px-1.5 py-0.5 rounded bg-white/15 text-white text-[10px]">Live</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {pendingCount > 0 ? (
                      <div
                        onClick={() => {
                          setOpenDropdown(null);
                          navigate('/FlightBookings');
                        }}
                        className="p-3 hover:bg-slate-50 cursor-pointer transition"
                      >
                        <div className="text-xs font-semibold text-[#1B3664]">
                          {pendingCount} Pending Booking(s)
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Click to review, approve, or issue e-tickets.
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No pending notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-md bg-[#1B3664] text-white flex items-center justify-center font-semibold text-xs">
                  {(user?.LoginID || 'TE').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-800 leading-none">
                    {user?.LoginID || 'test'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {user?.AccountType || 'Administrator'}
                  </div>
                </div>
              </button>
              {openDropdown === 'profile' && (
                <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-3.5 bg-[#1D314F] text-white">
                    <div className="font-semibold text-xs">{user?.FullName || 'Test Admin'}</div>
                    <div className="text-[11px] text-white/75">{user?.Email || 'admin@bookly.com'}</div>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate('/ManageSubAgents');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 text-left cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-[#1B3664]" />
                      <span>Sub Agent & Profile Settings</span>
                    </button>
                    <hr className="my-1 border-slate-100" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">{children}</main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-slate-200 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-5 h-5 object-contain"
            />
            <span>
              <b className="text-[#1B3664]">BOOKLY</b> • Taban Air B2B Booking & Inventory System
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 sm:mt-0 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-[#1B3664]" />
            <span>Taban Air Portal</span>
          </div>
        </footer>
      </div>

      {/* SESSION TIMEOUT MODAL */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3 flex items-center gap-2.5">
              <Clock className="w-4 h-4" />
              <h4 className="font-semibold text-sm">Session Timeout</h4>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-slate-600">
                Your session has been idle. Would you like to continue working or sign out?
              </p>
              <div className="flex items-center justify-center gap-2.5 mt-5">
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-50 transition"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowTimeoutModal(false)}
                  className="px-5 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg shadow-lg border text-xs font-medium transition-all ${
              t.type === 'error'
                ? 'bg-[#0F172A] text-white border-red-500'
                : 'bg-[#0F172A] text-white border-[#1B3664]'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : t.type === 'warning' ? (
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
