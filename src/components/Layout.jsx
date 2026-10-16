import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  PlaneTakeoff,
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
    group: 'Executive Overview',
    items: [
      { to: '/Dashboard', label: 'Dashboard', urdu: 'ڈیش بورڈ', icon: LayoutDashboard }
    ]
  },
  {
    group: 'Flight Operations',
    items: [
      { to: '/FlightBookings', label: 'Flight Bookings', urdu: 'فلائٹ بکنگز', icon: Ticket, badgeKey: 'pending' },
      { to: '/FlightPOS', label: 'Flight POS (Desk)', urdu: 'فلائٹ سیلز ڈیسک', icon: ShoppingBag },
      { to: '/FlightManagement', label: 'Flight Management', urdu: 'فلائٹ مینجمنٹ', icon: PlaneTakeoff },
      { to: '/SegmentManagement', label: 'Segment Management', urdu: 'سیگمنٹ مینجمنٹ', icon: Layers }
    ]
  },
  {
    group: 'Partner Network',
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
    flights,
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
    if (!q) return { bookings: [], flights: [], agents: [] };
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
      flights: flights
        .filter(
          (f) =>
            f.Title?.toLowerCase().includes(q) ||
            f.GroupDepartureIata?.toLowerCase().includes(q) ||
            f.PNR_AIRLINE?.toLowerCase().includes(q)
        )
        .slice(0, 3),
      agents: subAgents
        .filter(
          (a) =>
            a.CompanyName?.toLowerCase().includes(q) ||
            a.City?.toLowerCase().includes(q)
        )
        .slice(0, 3)
    };
  }, [searchQuery, bookings, flights, subAgents]);

  return (
    <div className="min-h-screen flex bg-[#FAFAFA] text-[#0B0A09]">
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* SIDEBAR — Jet Black #0B0A09 with #EE8200 Orange & White Accents */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#0B0A09] text-white border-r border-white/10 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-white/10 bg-black">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#EE8200] text-white flex items-center justify-center font-extrabold text-lg shadow-md shrink-0">
              TA
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <div className="font-display font-extrabold text-base tracking-wider text-white flex items-center gap-1.5">
                  TABAN <span className="text-xs px-1.5 py-0.5 rounded bg-[#EE8200] text-white font-mono">OTA</span>
                </div>
                <p className="text-[11px] text-white/65 truncate">Group Consolidation Suite</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Operator Card */}
        {!sidebarCollapsed && (
          <div className="mx-4 mt-4 p-3.5 rounded-xl bg-white/5 border border-[#EE8200]/30 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#EE8200] flex items-center justify-center font-bold text-sm text-white shrink-0">
              {(user?.LoginID || 'AT').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">
                {user?.FullName || 'Atta Ur Rehman'}
              </div>
              <div className="text-[11px] text-white/65 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EE8200] inline-block" />
                {user?.AccountType || 'Administrator'} • @{user?.LoginID || 'Atta'}
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
          {navSections.map((sec) => (
            <div key={sec.group}>
              {!sidebarCollapsed && (
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-[#EE8200]">
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
                      className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#EE8200] text-white font-bold shadow-md'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon
                          className={`w-4.5 h-4.5 shrink-0 ${
                            isActive ? 'text-white' : 'text-[#EE8200] group-hover:text-white'
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
                          className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${
                            isActive
                              ? 'bg-black text-white'
                              : 'bg-[#EE8200] text-white'
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
        <div className="p-3 border-t border-white/10 bg-black space-y-1.5">
          <button
            onClick={() => setShowTimeoutModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Test Session Timeout Dialog"
          >
            <Clock className="w-4 h-4 text-[#EE8200] shrink-0" />
            {!sidebarCollapsed && <span>Session Guard (Active)</span>}
          </button>
          <button
            onClick={resetDemoData}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/75 hover:text-white hover:bg-white/10 transition"
            title="Reset Demo Data to Default Seed"
          >
            <RotateCcw className="w-4 h-4 text-[#EE8200] shrink-0" />
            {!sidebarCollapsed && <span>Reset Demo Database</span>}
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold bg-[#EE8200] text-white hover:bg-[#d47100] transition"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Sign Out ({user?.LoginID || 'Atta'})</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className="h-20 bg-white border-b border-neutral-200 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          {/* Left: Hamburger + Global Search */}
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <button
              onClick={() => {
                if (window.innerWidth < 1024) {
                  setMobileOpen(true);
                } else {
                  setSidebarCollapsed((prev) => !prev);
                }
              }}
              className="p-2.5 rounded-xl border border-neutral-200 text-[#0B0A09] hover:bg-[#EE8200] hover:text-white hover:border-[#EE8200] transition"
              title="Toggle Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#EE8200] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenDropdown('search');
                }}
                onFocus={() => setOpenDropdown('search')}
                placeholder="Search PNR, Booking ID, Passenger, Flight, or Sub Agent..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-neutral-200 text-sm focus:outline-none focus:border-[#EE8200] focus:bg-white transition"
              />
              {openDropdown === 'search' && searchQuery.trim().length > 0 && (
                <div
                  className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-3 z-50 max-h-96 overflow-y-auto"
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#EE8200] px-2 py-1">
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
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-[#EE8200] font-mono">{b.PNR}</span> •{' '}
                        <span className="font-semibold">{b.SubCompanyName}</span>
                      </div>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-[#0B0A09] text-white">
                        {b.ApprovalStatus}
                      </span>
                    </button>
                  ))}

                  <div className="text-[11px] font-bold uppercase tracking-wider text-[#EE8200] px-2 py-1 mt-2">
                    Flight Groups ({searchResults.flights.length})
                  </div>
                  {searchResults.flights.map((f) => (
                    <button
                      key={f.AirGroupID}
                      onClick={() => {
                        setOpenDropdown(null);
                        setSearchQuery('');
                        navigate('/FlightManagement');
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold truncate">{f.Title}</span>
                      <span className="font-mono text-[#EE8200] font-bold">
                        {formatCurrencyPKR(f.AdultPrice)}
                      </span>
                    </button>
                  ))}

                  {searchResults.bookings.length === 0 &&
                    searchResults.flights.length === 0 &&
                    searchResults.agents.length === 0 && (
                      <div className="text-xs text-neutral-500 py-4 text-center">
                        No matching records found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Quick POS Button, Messages, Notifications, Language, User Profile */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/FlightPOS')}
              className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EE8200] text-white hover:bg-[#0B0A09] text-xs font-bold tracking-wide transition shadow-sm"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Quick POS Booking</span>
            </button>

            {/* Language Selector (English / Urdu) */}
            <button
              onClick={() => setLanguage((l) => (l === 'English' ? 'Urdu' : 'English'))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] hover:bg-[#EE8200] hover:text-white text-xs font-semibold transition"
              title="Switch Language (English / Urdu)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{language}</span>
            </button>

            {/* Messages Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'messages' ? null : 'messages')}
                className="relative p-2.5 rounded-xl border border-neutral-200 bg-[#FAFAFA] hover:bg-[#EE8200] hover:text-white transition"
                title="Messages"
              >
                <Mail className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EE8200] text-white text-[10px] font-bold flex items-center justify-center">
                  1
                </span>
              </button>
              {openDropdown === 'messages' && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50">
                  <div className="bg-[#EE8200] text-white px-4 py-3 flex items-center justify-between text-xs font-bold">
                    <span>1 New Message</span>
                    <span className="px-2 py-0.5 rounded-full bg-black text-white">Inbox</span>
                  </div>
                  <div className="p-4 hover:bg-orange-50/40 transition">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#0B0A09] text-white flex items-center justify-center font-bold text-xs shrink-0">
                        AD
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0B0A09]">Admin Command Desk</div>
                        <div className="text-[11px] text-neutral-500">01 Hour ago</div>
                        <p className="text-xs text-neutral-700 mt-1">
                          Welcome to Taban Airlines Group OTA Portal. {pendingCount} group booking(s) await approval.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === 'notifications' ? null : 'notifications')
                }
                className="relative p-2.5 rounded-xl border border-neutral-200 bg-[#FAFAFA] hover:bg-[#EE8200] hover:text-white transition"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0B0A09] text-white text-[10px] font-bold flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
              {openDropdown === 'notifications' && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50">
                  <div className="bg-[#0B0A09] text-white px-4 py-3 flex items-center justify-between text-xs font-bold">
                    <span>System Notifications</span>
                    <span className="px-2 py-0.5 rounded-full bg-[#EE8200] text-white">Live</span>
                  </div>
                  <div className="divide-y divide-neutral-100 max-h-64 overflow-y-auto">
                    <div
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate('/FlightBookings');
                      }}
                      className="p-3.5 hover:bg-orange-50/50 cursor-pointer transition"
                    >
                      <div className="text-xs font-bold text-[#EE8200]">
                        {pendingCount} Pending Group Booking(s)
                      </div>
                      <div className="text-[11px] text-neutral-600 mt-0.5">
                        Click to review, approve, or issue e-tickets.
                      </div>
                    </div>
                    <div className="p-3.5">
                      <div className="text-xs font-bold text-[#0B0A09]">
                        Flight HH-7212 KHI-IKA Manifest Ready
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-0.5">
                        Excel & Word IATA PNL export active.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'profile' ? null : 'profile')}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl border border-neutral-200 bg-white hover:bg-orange-50/40 transition"
              >
                <div className="w-8 h-8 rounded-lg bg-[#EE8200] text-white flex items-center justify-center font-bold text-xs">
                  {(user?.LoginID || 'AT').slice(0, 2).toUpperCase()}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-bold text-[#0B0A09] leading-none">
                    {user?.LoginID || 'Atta'}
                  </div>
                  <div className="text-[10px] text-[#EE8200] font-semibold mt-0.5">
                    {user?.AccountType || 'Administrator'}
                  </div>
                </div>
              </button>
              {openDropdown === 'profile' && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden z-50">
                  <div className="p-4 bg-[#0B0A09] text-white">
                    <div className="font-bold text-sm">{user?.FullName || 'Atta Ur Rehman'}</div>
                    <div className="text-xs text-white/75">{user?.Email || 'atta@smartmovesl.com'}</div>
                    <div className="mt-2 inline-block px-2 py-0.5 rounded bg-[#EE8200] text-white text-[10px] font-mono font-bold">
                      {user?.SubCompanyName || 'Taban Executive HQ'}
                    </div>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setOpenDropdown(null);
                        navigate('/ManageSubAgents');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium hover:bg-orange-50 text-left"
                    >
                      <UserCheck className="w-4 h-4 text-[#EE8200]" />
                      <span>Sub Agent & Profile Settings</span>
                    </button>
                    <hr className="my-1.5 border-neutral-100" />
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-red-700 hover:bg-red-50 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>

        {/* FOOTER */}
        <footer className="bg-white border-t border-neutral-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-600">
          <div className="font-medium">
            <span className="font-bold text-[#EE8200]">TABAN AIRLINES</span> • Group OTA & Charter Management System
          </div>
          <div className="flex items-center gap-4 mt-2 sm:mt-0">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EE8200]" />
              Theme: <code className="font-mono font-bold text-[#EE8200]">#EE8200</code> • White • Black
            </span>
          </div>
        </footer>
      </div>

      {/* SESSION TIMEOUT MODAL */}
      {showTimeoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/30 max-w-md w-full overflow-hidden">
            <div className="bg-[#0B0A09] text-white px-6 py-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#EE8200]" />
              <h4 className="font-bold text-base">Time Out</h4>
            </div>
            <div className="p-6 text-center">
              <p className="text-sm text-neutral-700 font-medium">
                Your executive session has been idle. Would you like to continue working or sign out?
              </p>
              <p className="text-base font-bold text-[#EE8200] mt-2">Continue?</p>
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={logout}
                  className="px-5 py-2.5 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition"
                >
                  Logout
                </button>
                <button
                  onClick={() => setShowTimeoutModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-[#d47100] transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-xl border text-xs font-semibold transition-all ${
              t.type === 'error'
                ? 'bg-[#0B0A09] text-white border-red-500'
                : t.type === 'warning'
                ? 'bg-[#0B0A09] text-white border-[#EE8200]'
                : 'bg-[#0B0A09] text-white border-[#EE8200]'
            }`}
          >
            {t.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : t.type === 'warning' ? (
              <Info className="w-4 h-4 text-[#EE8200] shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#EE8200] shrink-0" />
            )}
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
