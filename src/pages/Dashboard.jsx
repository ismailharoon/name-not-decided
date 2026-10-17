import React from 'react';
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
  Plus
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatShortDate } from '../utils/exporters';

export default function Dashboard() {
  const { stats, bookings, segments, subAgents } = usePortal();
  const navigate = useNavigate();

  const statusCounts = {
    Pending: bookings.filter((b) => b.ApprovalStatus === 'Pending').length,
    Approved: bookings.filter((b) => b.ApprovalStatus === 'Approved').length,
    Issued: bookings.filter((b) => b.ApprovalStatus === 'Ticket Issued').length,
    Rejected: bookings.filter((b) => b.ApprovalStatus === 'Rejected').length,
    Void: bookings.filter((b) => b.ApprovalStatus === 'Ticket Void').length
  };

  const kpiCards = [
    {
      title: 'Sub Agents',
      value: stats.TotalSubAgents || subAgents.length,
      subtitle: 'Registered B2B Partner Agencies',
      icon: Users,
      link: '/ManageSubAgents',
      variant: 'espresso'
    },
    {
      title: 'Bookings',
      value: stats.TotalBookings || bookings.length,
      subtitle: `${statusCounts.Pending} Pending • ${statusCounts.Issued} Issued`,
      icon: Ticket,
      link: '/FlightBookings',
      variant: 'black'
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
      variant: 'espresso'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EE8200]">
            Bookly • Executive Command Overview
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0A09] mt-0.5">
            Bookly Aviation & Group Ticketing Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/FlightBookings')}
            className="px-4 py-2.5 rounded-xl bg-white border border-[#EE8200]/20 text-[#EE8200] text-xs font-bold hover:bg-[#FFF7ED] transition"
          >
            View Flight Bookings
          </button>
          <button
            onClick={() => navigate('/FlightPOS')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-black transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>New POS Booking</span>
          </button>
        </div>
      </div>

      {/* 4 Core KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          const isEspresso = card.variant === 'espresso';
          const isBlack = card.variant === 'black';
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.link)}
              className={`cursor-pointer rounded-2xl p-6 transition-all hover:-translate-y-0.5 shadow-executive border ${
                isEspresso
                  ? 'bg-[#EE8200] text-white border-[#EE8200]'
                  : isBlack
                  ? 'bg-[#0B0A09] text-white border-black'
                  : 'bg-white text-[#0B0A09] border-[#EE8200]/15'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isEspresso || isBlack ? 'text-white/75' : 'text-[#EE8200]'
                  }`}
                >
                  {card.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isEspresso || isBlack
                      ? 'bg-white/10 text-white'
                      : 'bg-[#EE8200] text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="font-display font-extrabold text-2xl sm:text-3xl mt-4 truncate">
                {card.value}
              </div>
              <div
                className={`text-xs mt-2 flex items-center justify-between ${
                  isEspresso || isBlack ? 'text-white/70' : 'text-neutral-500'
                }`}
              >
                <span>{card.subtitle}</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Lifecycle Pipeline & Active Flight Segment Inventory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active Flight Segments Seat Inventory */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#EE8200]/15 p-6 shadow-executive">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display font-bold text-lg text-[#0B0A09]">
                Active Flight Segments & Seat Occupancy
              </h3>
              <p className="text-xs text-neutral-500">
                Real-time inventory across active flight segments
              </p>
            </div>
            <button
              onClick={() => navigate('/SegmentManagement')}
              className="text-xs font-bold text-[#EE8200] hover:underline"
            >
              Manage Segments &rarr;
            </button>
          </div>

          {segments.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-neutral-200 rounded-xl">
              <p className="text-xs text-neutral-500 mb-3">
                No flight segments created yet. Add a segment in Segment Management and search/book it directly in POS.
              </p>
              <button
                onClick={() => navigate('/SegmentManagement')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-black transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Flight Segment</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((seg) => {
                const total = Number(seg.TotalSeats) || 160;
                const left = Number(seg.SeatsLeft ?? seg.TotalSeats) || 0;
                const sold = Math.max(0, total - left);
                const pct = Math.min(100, Math.round((sold / total) * 100));
                return (
                  <div
                    key={seg.AirGroupSegmentID}
                    onClick={() => navigate('/FlightPOS')}
                    className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/10 hover:border-[#EE8200]/40 transition cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 rounded-lg bg-[#EE8200] text-white font-mono text-xs font-bold">
                          {seg.FlightNumber}
                        </span>
                        <div>
                          <div className="font-bold text-sm text-[#0B0A09]">
                            {seg.DepartureCity} ({seg.DepartureIata}) &rarr; {seg.ArrivalCity} ({seg.ArrivalIata})
                          </div>
                          <div className="text-xs text-neutral-500">
                            Dep: {formatShortDate(seg.DepartureDate)} • {seg.FlightClass || 'Economy'} • {seg.BaggageCountADT}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-[#EE8200]">
                          {formatCurrencyPKR(seg.AdultPrice)}
                        </div>
                        <div className="text-[11px] text-neutral-500">
                          {left} of {total} seats left
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        className="h-full bg-[#EE8200] rounded-full transition-all"
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
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-[#EE8200]/15 p-6 shadow-executive">
            <h3 className="font-display font-bold text-lg text-[#0B0A09] mb-4">
              Booking Approval Pipeline
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/15">
                <div className="flex items-center justify-between text-xs font-bold text-[#EE8200]">
                  <span>Pending</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-display mt-1">{statusCounts.Pending}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span>Approved</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-display mt-1 text-emerald-950">
                  {statusCounts.Approved}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#EE8200] text-white">
                <div className="flex items-center justify-between text-xs font-bold text-white/80">
                  <span>Ticket Issued</span>
                  <PlaneTakeoff className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-display mt-1">{statusCounts.Issued}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200">
                <div className="flex items-center justify-between text-xs font-bold text-red-900">
                  <span>Rejected</span>
                  <XCircle className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-display mt-1 text-red-950">
                  {statusCounts.Rejected}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#0B0A09] text-white col-span-2 sm:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold text-white/75">
                  <span>Ticket Void</span>
                  <Ban className="w-4 h-4" />
                </div>
                <div className="text-2xl font-extrabold font-display mt-1">{statusCounts.Void}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#EE8200]/15 p-6 shadow-executive">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-[#0B0A09]">
                Sub-Agent Credit Balances
              </h3>
              <button
                onClick={() => navigate('/ManageSubAgents')}
                className="text-xs font-bold text-[#EE8200] hover:underline"
              >
                Manage Agents &rarr;
              </button>
            </div>
            {subAgents.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-neutral-200 rounded-xl">
                <p className="text-xs text-neutral-500 mb-3">No Sub Agents added yet.</p>
                <button
                  onClick={() => navigate('/ManageSubAgents')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-black transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub Agent</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {subAgents.map((ag) => (
                  <div
                    key={ag.SubCompanyID}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#FAFAFA] border border-neutral-200/80"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#0B0A09] truncate">{ag.CompanyName}</div>
                      <div className="text-[11px] text-neutral-500">
                        {ag.City} • Limit: {formatCurrencyPKR(ag.CreditLimit)}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-2">
                      <div className="font-mono font-bold text-xs text-[#EE8200]">
                        {formatCurrencyPKR(ag.CreditLimitBalance)}
                      </div>
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded font-bold ${
                          ag.AccountStatus === 'Enable'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-700'
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
