import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Ticket,
  UserCheck,
  Banknote,
  PlaneTakeoff,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  ShoppingBag,
  Plus,
  Printer,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatShortDate } from '../utils/exporters';
import TicketPrintModal from '../components/TicketPrintModal';

export default function Dashboard() {
  const { user, isSubAgent, stats, bookings, segments, subAgents, cancelBooking } = usePortal();
  const navigate = useNavigate();
  const [printBooking, setPrintBooking] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});

  const statusCounts = {
    Pending: bookings.filter((b) => b.ApprovalStatus === 'Pending').length,
    Approved: bookings.filter((b) => b.ApprovalStatus === 'Approved').length,
    Issued: bookings.filter((b) => b.ApprovalStatus === 'Ticket Issued').length,
    Rejected: bookings.filter((b) => b.ApprovalStatus === 'Rejected').length,
    Void: bookings.filter((b) => b.ApprovalStatus === 'Ticket Void').length,
    Cancelled: bookings.filter((b) => b.ApprovalStatus === 'Cancelled').length
  };

  // --- SUB-AGENT DASHBOARD (Only their own POS bookings & stats) ---
  if (isSubAgent) {
    const myAgent = subAgents[0] || null;
    const subAgentCards = [
      {
        title: 'My Bookings',
        value: bookings.length,
        subtitle: `${statusCounts.Pending} Pending • ${statusCounts.Issued} Issued`,
        icon: Ticket,
        variant: 'navy'
      },
      {
        title: 'Tickets Issued',
        value: statusCounts.Issued,
        subtitle: `${statusCounts.Approved} Approved`,
        icon: PlaneTakeoff,
        variant: 'slate'
      },
      {
        title: 'My Total Bookings Value',
        value: formatCurrencyPKR(stats.TotalBookingPrice),
        subtitle: 'Confirmed Bookings (PKR)',
        icon: Banknote,
        variant: 'white'
      },
      {
        title: 'Credit Balance',
        value: formatCurrencyPKR(myAgent?.CreditLimitBalance ?? 0),
        subtitle: `Limit: ${formatCurrencyPKR(myAgent?.CreditLimit ?? 0)}`,
        icon: UserCheck,
        variant: 'navy'
      }
    ];

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
              {user?.SubCompanyName || 'Sub-Agent'} • Agent Dashboard
            </span>
            <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
              My Bookings & POS Overview
            </h1>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => navigate('/FlightPOS')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition shadow-xs cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Book Flight in POS</span>
            </button>
          </div>
        </div>

        {/* 4 KPI Cards (Sub-Agent Only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {subAgentCards.map((card) => {
            const Icon = card.icon;
            const isNavy = card.variant === 'navy';
            const isSlate = card.variant === 'slate';
            return (
              <div
                key={card.title}
                onClick={() => navigate('/FlightPOS')}
                className={`cursor-pointer rounded-xl p-5 transition-all hover:-translate-y-0.5 shadow-executive border ${
                  isNavy
                    ? 'bg-[#1D314F] text-white border-[#1D314F]'
                    : isSlate
                    ? 'bg-[#0F172A] text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isNavy || isSlate ? 'text-white/75' : 'text-[#1B3664]'
                    }`}
                  >
                    {card.title}
                  </span>
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      isNavy || isSlate ? 'bg-white/10 text-white' : 'bg-[#1B3664] text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-display font-semibold text-2xl mt-3 truncate">
                  {card.value}
                </div>
                <div
                  className={`text-xs mt-1.5 flex items-center justify-between ${
                    isNavy || isSlate ? 'text-white/70' : 'text-slate-500'
                  }`}
                >
                  <span>{card.subtitle}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sub-Agent Bookings List & Status Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Only Bookings Made By This Sub-Agent */}
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-executive">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-base text-slate-900">
                  My Flight Bookings ({bookings.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Tickets and PNRs booked under your agency account
                </p>
              </div>
              <button
                onClick={() => navigate('/FlightPOS')}
                className="text-xs font-medium text-[#1B3664] hover:underline cursor-pointer"
              >
                + New POS Booking &rarr;
              </button>
            </div>

            {bookings.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 mb-3">
                  You have not created any bookings yet. Search and book flights from Flight POS.
                </p>
                <button
                  onClick={() => navigate('/FlightPOS')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Go to Flight POS</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#1D314F] text-white text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-8"></th>
                      <th className="py-2.5 px-3">PNR / Booking ID</th>
                      <th className="py-2.5 px-3">Flight Sector</th>
                      <th className="py-2.5 px-3 text-center">Pax</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {bookings.map((b) => {
                      const isExpanded = Boolean(expandedRows[b.AirGroupBookingID]);
                      const isIssued = b.ApprovalStatus === 'Ticket Issued';
                      const canCancel =
                        !isIssued &&
                        b.ApprovalStatus !== 'Cancelled' &&
                        b.ApprovalStatus !== 'Rejected' &&
                        b.ApprovalStatus !== 'Ticket Void';
                      return (
                        <React.Fragment key={b.AirGroupBookingID}>
                          <tr className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() =>
                                  setExpandedRows((prev) => ({
                                    ...prev,
                                    [b.AirGroupBookingID]: !prev[b.AirGroupBookingID]
                                  }))
                                }
                                className="p-1 rounded bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white cursor-pointer"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-mono font-semibold text-[#1B3664]">{b.PNR}</div>
                              <div className="text-[10px] text-slate-500">{b.AirGroupBookingID}</div>
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-slate-900">{b.FlightTitle}</div>
                              <div className="text-[10px] text-slate-500">
                                {b.TripType} •{' '}
                                {isIssued
                                  ? `Issue Date: ${b.ApprovalDateTime || b.TimeStamp}`
                                  : `Booking Date: ${b.TimeStamp}`}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              {b.AdultCount || 0}A / {b.ChildCount || 0}C / {b.InfantCount || 0}I
                            </td>
                            <td className="py-2.5 px-3 font-mono font-semibold text-[#1B3664]">
                              {formatCurrencyPKR(b.TotalPrice)}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  isIssued
                                    ? 'bg-[#1B3664] text-white'
                                    : b.ApprovalStatus === 'Approved'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : b.ApprovalStatus === 'Rejected' ||
                                      b.ApprovalStatus === 'Ticket Void' ||
                                      b.ApprovalStatus === 'Cancelled'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                                }`}
                              >
                                {b.ApprovalStatus}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <div className="inline-flex items-center justify-end gap-1.5">
                                {canCancel && (
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Cancel booking PNR ${b.PNR}? This will release the seats and refund your credit balance.`
                                        )
                                      ) {
                                        cancelBooking(b.AirGroupBookingID);
                                      }
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-medium transition cursor-pointer"
                                  >
                                    <XCircle className="w-3 h-3" />
                                    <span>Cancel</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => setPrintBooking(b)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white text-[11px] font-medium transition cursor-pointer"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>{isIssued ? 'Print Ticket' : 'Print'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-slate-50">
                              <td colSpan={7} className="p-3">
                                <div className="text-[11px] font-semibold text-[#1B3664] mb-1.5">
                                  Passengers ({(b.Passengers || []).length})
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {(b.Passengers || []).map((p, idx) => (
                                    <div
                                      key={p.PassengerID || idx}
                                      className="p-2 rounded bg-white border border-slate-200 flex items-center justify-between text-[11px]"
                                    >
                                      <div>
                                        <span className="font-semibold text-slate-800">
                                          {idx + 1}. {p.Title} {p.FirstName} {p.LastName}
                                        </span>{' '}
                                        <span className="text-slate-500">({p.PassengerType})</span>
                                        <div className="text-[10px] text-slate-500 font-mono">
                                          Passport: {p.PassportNumber} • DOB: {p.DOB}
                                        </div>
                                      </div>
                                      {p.TicketNumber && (
                                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-mono font-semibold text-[10px]">
                                          TKT: {p.TicketNumber}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: My Booking Status Breakdown & My Agency Card */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-executive">
              <h3 className="font-display font-semibold text-base text-slate-900 mb-3.5">
                My Booking Status
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between text-xs font-medium text-[#1B3664]">
                    <span>Pending</span>
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-semibold font-display mt-1 text-slate-900">
                    {statusCounts.Pending}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                    <span>Approved</span>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-semibold font-display mt-1 text-emerald-950">
                    {statusCounts.Approved}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[#1D314F] text-white">
                  <div className="flex items-center justify-between text-xs font-medium text-white/80">
                    <span>Ticket Issued</span>
                    <PlaneTakeoff className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-semibold font-display mt-1">
                    {statusCounts.Issued}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center justify-between text-xs font-medium text-red-800">
                    <span>Rejected / Void</span>
                    <XCircle className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xl font-semibold font-display mt-1 text-red-950">
                    {statusCounts.Rejected + statusCounts.Void}
                  </div>
                </div>
              </div>
            </div>

            {myAgent && (
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-executive space-y-2.5 text-xs">
                <h3 className="font-display font-semibold text-base text-slate-900">
                  My Agency Account
                </h3>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Agency Name:</span>
                    <span className="font-semibold text-slate-900">{myAgent.CompanyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Login ID:</span>
                    <span className="font-mono font-semibold text-[#1B3664]">{user?.LoginID}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">City:</span>
                    <span className="font-medium text-slate-800">{myAgent.City}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Credit Limit:</span>
                    <span className="font-mono font-medium">
                      {formatCurrencyPKR(myAgent.CreditLimit)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-600 font-medium">Available Balance:</span>
                    <span className="font-mono font-semibold text-emerald-700">
                      {formatCurrencyPKR(myAgent.CreditLimitBalance)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {printBooking && (
          <TicketPrintModal booking={printBooking} onClose={() => setPrintBooking(null)} />
        )}
      </div>
    );
  }

  // --- MAIN ADMIN DASHBOARD (Unchanged) ---
  const kpiCards = [
    {
      title: 'Sub Agents',
      value: stats.TotalSubAgents || subAgents.length,
      subtitle: 'Registered B2B Partner Agencies',
      icon: Users,
      link: '/ManageSubAgents',
      variant: 'navy'
    },
    {
      title: 'Bookings',
      value: stats.TotalBookings || bookings.length,
      subtitle: `${statusCounts.Pending} Pending • ${statusCounts.Issued} Issued`,
      icon: Ticket,
      link: '/FlightBookings',
      variant: 'slate'
    },
    {
      title: 'User Registrations',
      value: stats.TotalUsers,
      subtitle: 'Active Administrators & Operators',
      icon: UserCheck,
      link: '/ManageSubAgents',
      variant: 'white'
    },
    {
      title: 'Sales',
      value: formatCurrencyPKR(stats.TotalBookingPrice),
      subtitle: 'Confirmed Group Revenue (PKR)',
      icon: Banknote,
      link: '/FlightBookings',
      variant: 'navy'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
            Bookly • Executive Command Overview
          </span>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
            Aviation & Group Ticketing Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/FlightBookings')}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-[#1B3664] text-xs font-medium hover:bg-slate-50 transition cursor-pointer"
          >
            View Flight Bookings
          </button>
          <button
            onClick={() => navigate('/FlightPOS')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>New POS Booking</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isNavy = card.variant === 'navy';
          const isSlate = card.variant === 'slate';
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.link)}
              className={`cursor-pointer rounded-xl p-5 transition-all hover:-translate-y-0.5 shadow-executive border ${
                isNavy
                  ? 'bg-[#1D314F] text-white border-[#1D314F]'
                  : isSlate
                  ? 'bg-[#0F172A] text-white border-slate-900'
                  : 'bg-white text-slate-900 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    isNavy || isSlate ? 'text-white/75' : 'text-[#1B3664]'
                  }`}
                >
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isNavy || isSlate
                      ? 'bg-white/10 text-white'
                      : 'bg-[#1B3664] text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="font-display font-semibold text-2xl mt-3 truncate">
                {card.value}
              </div>
              <div
                className={`text-xs mt-1.5 flex items-center justify-between ${
                  isNavy || isSlate ? 'text-white/70' : 'text-slate-500'
                }`}
              >
                <span>{card.subtitle}</span>
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Lifecycle Pipeline & Active Flight Segment Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Active Flight Segments Seat Inventory */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-executive">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-base text-slate-900">
                Active Flight Segments & Seat Occupancy
              </h3>
              <p className="text-xs text-slate-500">
                Real-time inventory across active flight segments
              </p>
            </div>
            <button
              onClick={() => navigate('/SegmentManagement')}
              className="text-xs font-medium text-[#1B3664] hover:underline cursor-pointer"
            >
              Manage Segments &rarr;
            </button>
          </div>

          {segments.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-200 rounded-xl">
              <p className="text-xs text-slate-500 mb-3">
                No flight segments created yet. Add a segment in Segment Management and search/book it directly in POS.
              </p>
              <button
                onClick={() => navigate('/SegmentManagement')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flight Segment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {segments.map((seg) => {
                const total = Number(seg.TotalSeats) || 160;
                const left = Number(seg.SeatsLeft ?? seg.TotalSeats) || 0;
                const sold = Math.max(0, total - left);
                const pct = Math.min(100, Math.round((sold / total) * 100));
                return (
                  <div
                    key={seg.AirGroupSegmentID}
                    onClick={() => navigate('/FlightPOS')}
                    className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-[#1B3664]/40 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#1B3664] text-white font-mono text-xs font-medium">
                          {seg.FlightNumber}
                        </span>
                        <div>
                          <div className="font-semibold text-xs text-slate-900">
                            {seg.DepartureCity} ({seg.DepartureIata}) &rarr; {seg.ArrivalCity} ({seg.ArrivalIata})
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Dep: {formatShortDate(seg.DepartureDate)} • {seg.FlightClass || 'Economy'} • Baggage: Adult={seg.BaggageADT ?? seg.AdultBaggage ?? 20}, Child={seg.BaggageCNN ?? seg.ChildBaggage ?? 20}, Infant={seg.BaggageINF ?? seg.InfantBaggage ?? 0}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold text-xs text-[#1B3664]">
                          {formatCurrencyPKR(seg.AdultPrice)}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {left} of {total} seats left
                        </div>
                      </div>
                    </div>
                    <div className="mt-2.5 w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#1B3664] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Booking Status Breakdown & Sub-Agent Credit Standing */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-executive">
            <h3 className="font-display font-semibold text-base text-slate-900 mb-3.5">
              Booking Approval Pipeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between text-xs font-medium text-[#1B3664]">
                  <span>Pending</span>
                  <Clock className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-semibold font-display mt-1 text-slate-900">
                  {statusCounts.Pending}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-medium text-emerald-800">
                  <span>Approved</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-semibold font-display mt-1 text-emerald-950">
                  {statusCounts.Approved}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#1D314F] text-white">
                <div className="flex items-center justify-between text-xs font-medium text-white/80">
                  <span>Ticket Issued</span>
                  <PlaneTakeoff className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-semibold font-display mt-1">{statusCounts.Issued}</div>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <div className="flex items-center justify-between text-xs font-medium text-red-800">
                  <span>Rejected</span>
                  <XCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-semibold font-display mt-1 text-red-950">
                  {statusCounts.Rejected}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[#0F172A] text-white col-span-2">
                <div className="flex items-center justify-between text-xs font-medium text-white/75">
                  <span>Ticket Void</span>
                  <Ban className="w-3.5 h-3.5" />
                </div>
                <div className="text-xl font-semibold font-display mt-1">{statusCounts.Void}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-executive">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="font-display font-semibold text-base text-slate-900">
                Sub-Agent Credit Balances
              </h3>
              <button
                onClick={() => navigate('/ManageSubAgents')}
                className="text-xs font-medium text-[#1B3664] hover:underline cursor-pointer"
              >
                Manage Agents &rarr;
              </button>
            </div>
            {subAgents.length === 0 ? (
              <div className="py-7 text-center border border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 mb-3">No Sub Agents added yet.</p>
                <button
                  onClick={() => navigate('/ManageSubAgents')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub Agent</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {subAgents.map((ag) => (
                  <div
                    key={ag.SubCompanyID}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 truncate">
                        {ag.CompanyName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {ag.City} • Limit: {formatCurrencyPKR(ag.CreditLimit)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-mono font-semibold text-xs text-[#1B3664]">
                        {formatCurrencyPKR(ag.CreditLimitBalance)}
                      </div>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-medium ${
                          ag.AccountStatus === 'Enable'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {ag.AccountStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
