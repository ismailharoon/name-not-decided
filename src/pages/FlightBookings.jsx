import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  Ticket,
  Ban,
  Edit3,
  Printer,
  Trash2,
  ChevronDown,
  ChevronRight,
  Plane,
  User,
  Upload,
  Download,
  Search,
  Filter,
  AlertTriangle,
  X,
  Clock,
  FileText
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime } from '../utils/exporters';
import TicketPrintModal from '../components/TicketPrintModal';

const STATUS_TABS = [
  { key: 'All', label: 'All Bookings' },
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'Ticket Issued', label: 'Issued' },
  { key: 'Ticket Void', label: 'Void' },
  { key: 'Cancelled', label: 'Cancelled' }
];

export default function FlightBookings() {
  const {
    bookings,
    subAgents,
    approveBooking,
    rejectBooking,
    issueTicket,
    voidBooking,
    updateBooking,
    deleteBooking,
    updatePassenger,
    deletePassenger,
    addToast
  } = usePortal();

  const [statusFilter, setStatusFilter] = useState('All');
  const [agentFilter, setAgentFilter] = useState('ALL');
  const [searchText, setSearchText] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  // Modals state
  const [printBooking, setPrintBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [voidRemarks, setVoidRemarks] = useState('');
  const [editingPax, setEditingPax] = useState(null); // { bookingId, passenger }

  const toggleExpand = (bookingId) => {
    setExpandedRows((prev) => ({ ...prev, [bookingId]: !prev[bookingId] }));
  };

  const counts = useMemo(() => {
    const map = {
      All: bookings.length,
      Pending: 0,
      Approved: 0,
      Rejected: 0,
      'Ticket Issued': 0,
      'Ticket Void': 0,
      Cancelled: 0
    };
    bookings.forEach((b) => {
      if (map[b.ApprovalStatus] !== undefined) {
        map[b.ApprovalStatus]++;
      }
    });
    return map;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'All' && b.ApprovalStatus !== statusFilter) return false;
      if (agentFilter !== 'ALL' && b.SubCompanyID !== agentFilter) return false;
      if (searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        const matchMain =
          b.AirGroupBookingID?.toLowerCase().includes(q) ||
          b.PNR?.toLowerCase().includes(q) ||
          b.SubCompanyName?.toLowerCase().includes(q) ||
          b.EmailAddress?.toLowerCase().includes(q) ||
          b.FlightTitle?.toLowerCase().includes(q);
        const matchPax = (b.Passengers || []).some(
          (p) =>
            p.FirstName?.toLowerCase().includes(q) ||
            p.LastName?.toLowerCase().includes(q) ||
            p.PassportNumber?.toLowerCase().includes(q) ||
            p.TicketNumber?.toLowerCase().includes(q)
        );
        if (!matchMain && !matchPax) return false;
      }
      return true;
    });
  }, [bookings, statusFilter, agentFilter, searchText]);

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Approved
          </span>
        );
      case 'Ticket Issued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#1B3664] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ticket Issued
          </span>
        );
      case 'Rejected':
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-red-50 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {status}
          </span>
        );
      case 'Ticket Void':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Ticket Void
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
            {status || 'Unknown'}
          </span>
        );
    }
  };

  const handleConfirmVoid = async (e) => {
    e.preventDefault();
    if (!voidRemarks.trim()) {
      addToast('Please enter Void Remarks.', 'error');
      return;
    }
    try {
      await voidBooking(voidTarget.AirGroupBookingID, voidRemarks);
      setVoidTarget(null);
      setVoidRemarks('');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSaveBookingEdit = async (e) => {
    e.preventDefault();
    try {
      await updateBooking(editingBooking.AirGroupBookingID, {
        SubCompanyID: editingBooking.SubCompanyID,
        BookingTimeLimit:
          editingBooking.ApprovalStatus === 'Ticket Issued'
            ? ''
            : editingBooking.BookingTimeLimit,
        PNR: editingBooking.PNR,
        EmailAddress: editingBooking.EmailAddress,
        MobileNumber: editingBooking.MobileNumber,
        Remarks: editingBooking.Remarks
      });
      setEditingBooking(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSavePassengerEdit = async (e) => {
    e.preventDefault();
    try {
      await updatePassenger(
        editingPax.bookingId,
        editingPax.passenger.PassengerID,
        editingPax.passenger
      );
      setEditingPax(null);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handlePassportFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditingPax((prev) => ({
        ...prev,
        passenger: {
          ...prev.passenger,
          PassportImageName: file.name,
          PassportFileData: reader.result
        }
      }));
      addToast(`Passport image "${file.name}" attached.`, 'info');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#1B3664]">
            PNR & E-Ticket Control Desk
          </span>
          <h1 className="font-display font-semibold text-xl sm:text-2xl text-slate-900 mt-0.5">
            Flight Bookings
          </h1>
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                  active
                    ? 'bg-[#1B3664] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-[#1B3664]'
                  }`}
                >
                  {counts[tab.key] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Sub-Agent Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-executive flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter by Booking ID, PNR, Passenger Name, Passport #, Ticket #, or Route..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:border-[#1B3664] focus:bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#1B3664]" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#1B3664]"
          >
            <option value="ALL">All Sub Agents ({subAgents.length})</option>
            {subAgents.map((a) => (
              <option key={a.SubCompanyID} value={a.SubCompanyID}>
                {a.CompanyName} ({a.City})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bookings Master-Detail Data Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1D314F] text-white text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-10"></th>
                <th className="py-3 px-3">Booking / PNR</th>
                <th className="py-3 px-3">Sub Agent & Channel</th>
                <th className="py-3 px-3">Flight Sector</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Pax (A/C/I)</th>
                <th className="py-3 px-3">Total Price</th>
                <th className="py-3 px-3">Date / Time Limit</th>
                <th className="py-3 px-4 text-right">Booking Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-500">
                    No flight bookings match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const isExpanded = Boolean(expandedRows[booking.AirGroupBookingID]);
                  const isIssued = booking.ApprovalStatus === 'Ticket Issued';
                  const canApprove = booking.ApprovalStatus === 'Pending';
                  const canReject = booking.ApprovalStatus === 'Pending';
                  const canIssue =
                    booking.ApprovalStatus === 'Approved' || booking.ApprovalStatus === 'Pending';
                  const canVoid =
                    booking.ApprovalStatus === 'Ticket Issued' ||
                    booking.ApprovalStatus === 'Approved';

                  return (
                    <React.Fragment key={booking.AirGroupBookingID}>
                      {/* Main Booking Row */}
                      <tr
                        className={`transition hover:bg-slate-50 ${
                          isExpanded ? 'bg-slate-50/80' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(booking.AirGroupBookingID)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white transition cursor-pointer"
                            title="Expand Passengers & Segments"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-mono font-semibold text-sm text-[#1B3664]">
                            {booking.PNR}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            ID: {booking.AirGroupBookingID}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 max-w-[200px] truncate">
                            {booking.SubCompanyName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {booking.BookingChannelName || 'B2B Agent Portal'}
                          </div>
                          <div className="text-[11px] text-[#1B3664]">
                            {booking.EmailAddress}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 max-w-[220px] truncate">
                            {booking.FlightTitle}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {booking.ValidatingCarrierName} • {booking.TripType}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          {renderStatusBadge(booking.ApprovalStatus)}
                          {booking.ApprovalLoginID && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              By <span className="font-medium">{booking.ApprovalLoginID}</span> ({booking.ApprovalDateTime})
                            </div>
                          )}
                          {(booking.ApprovalStatus === 'Ticket Void' ||
                            booking.ApprovalStatus === 'Cancelled') &&
                            booking.VoidReason && (
                              <div
                                className="text-[10px] text-red-700 font-medium mt-1 max-w-[180px] truncate"
                                title={booking.VoidReason}
                              >
                                {booking.VoidReason}
                              </div>
                            )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono font-medium text-[11px]">
                            <span title="Adults">{booking.AdultCount || 0}A</span> /
                            <span title="Children">{booking.ChildCount || 0}C</span> /
                            <span title="Infants">{booking.InfantCount || 0}I</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {(booking.Passengers || []).length} Pax Total
                          </div>
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-xs text-[#1B3664]">
                          {formatCurrencyPKR(booking.TotalPrice)}
                        </td>

                        <td className="py-3 px-3">
                          {/* Do NOT show BookingTimeLimit once Ticket Issued */}
                          {!isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' ? (
                            <div className="flex items-center gap-1 text-[11px] font-medium text-slate-800">
                              <Clock className="w-3.5 h-3.5 text-[#1B3664]" />
                              <span>{booking.BookingTimeLimit}</span>
                            </div>
                          ) : (
                            <div className="text-[11px] font-medium text-emerald-700">
                              {isIssued ? 'Ticketed (No Time Limit)' : '—'}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isIssued
                              ? `Issue Date: ${booking.ApprovalDateTime || booking.TimeStamp}`
                              : `Booking Date: ${booking.TimeStamp}`}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {canApprove && (
                              <button
                                onClick={() => approveBooking(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Approve Booking"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}

                            {canReject && (
                              <button
                                onClick={() => rejectBooking(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Reject Booking"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            )}

                            {canIssue && (
                              <button
                                onClick={() => issueTicket(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Issue E-Tickets"
                              >
                                <Ticket className="w-3.5 h-3.5" />
                                Issue Ticket
                              </button>
                            )}

                            {canVoid && (
                              <button
                                onClick={() => {
                                  setVoidTarget(booking);
                                  setVoidRemarks('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-red-900 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Void Ticket"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Void
                              </button>
                            )}

                            <button
                              onClick={() => setPrintBooking(booking)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white border border-slate-200 font-medium text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Print Details / E-Ticket PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              {isIssued ? 'Print Ticket' : 'Print Details'}
                            </button>

                            <button
                              onClick={() => setEditingBooking({ ...booking })}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] transition cursor-pointer"
                              title="Edit Booking"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Delete booking ${booking.AirGroupBookingID}?`)) {
                                  deleteBooking(booking.AirGroupBookingID);
                                }
                              }}
                              className="p-1.5 rounded-lg border border-slate-200 hover:border-red-600 text-slate-500 hover:text-red-600 transition cursor-pointer"
                              title="Delete Booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAIL TEMPLATE: PASSENGERS & FLIGHT SEGMENTS */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="p-4 border-b border-slate-200">
                            <div className="space-y-4">
                              {/* 1. Flight Segments Box */}
                              <div className="bg-white rounded-xl border border-slate-200 p-3.5">
                                <div className="flex items-center justify-between mb-2.5">
                                  <h5 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] flex items-center gap-2">
                                    <Plane className="w-3.5 h-3.5" />
                                    Flight Segments ({(booking.Segments || []).length})
                                  </h5>
                                  {booking.Remarks && (
                                    <span className="text-xs text-slate-600 italic">
                                      Remarks: &ldquo;{booking.Remarks}&rdquo;
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(booking.Segments || []).map((seg) => (
                                    <div
                                      key={seg.AirGroupSegmentID}
                                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                                    >
                                      <div>
                                        <div className="font-semibold text-xs text-[#1B3664]">
                                          {seg.DepartureCity} ({seg.DepartureIata})
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {formatDateTime(seg.DepartureDate)}
                                        </div>
                                      </div>
                                      <div className="text-center px-2">
                                        <div className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1B3664] text-white">
                                          {seg.FlightNumber}
                                        </div>
                                        <div className="text-[10px] text-slate-500 mt-1">
                                          Cabin: {seg.FlightClass} ({seg.FlightClassCode})
                                        </div>
                                        <div className="text-[10px] text-slate-500">
                                          Baggage: Adult={seg.AdultBaggage ?? 20}, Child={seg.ChildBaggage ?? 20}, Infant={seg.InfantBaggage ?? 0}
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-semibold text-xs text-slate-900">
                                          {seg.ArrivalCity} ({seg.ArrivalIata})
                                        </div>
                                        <div className="text-[11px] text-slate-500">
                                          {formatDateTime(seg.ArrivalDate)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 2. Passengers Table */}
                              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                                  <h5 className="font-display font-semibold text-xs uppercase tracking-wider text-[#1B3664] flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    Passenger Information ({(booking.Passengers || []).length})
                                  </h5>
                                  <span className="text-[11px] text-slate-500">
                                    Click Edit Pax to update details or upload/download passport scan
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                                        <th className="py-2 px-3">Pax Type</th>
                                        <th className="py-2 px-3">Title</th>
                                        <th className="py-2 px-3">First Name</th>
                                        <th className="py-2 px-3">Last Name</th>
                                        <th className="py-2 px-3">Gender</th>
                                        <th className="py-2 px-3">DOB</th>
                                        <th className="py-2 px-3">Nationality</th>
                                        <th className="py-2 px-3">Passport #</th>
                                        <th className="py-2 px-3">Passport Issue / Expiry</th>
                                        <th className="py-2 px-3">Ticket #</th>
                                        <th className="py-2 px-3">Passport Scan</th>
                                        <th className="py-2 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                      {(booking.Passengers || []).map((pax) => (
                                        <tr key={pax.PassengerID} className="hover:bg-slate-50">
                                          <td className="py-2 px-3">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-medium text-[11px]">
                                              {pax.PassengerType}
                                            </span>
                                          </td>
                                          <td className="py-2 px-3 font-medium">{pax.Title}</td>
                                          <td className="py-2 px-3 font-semibold text-slate-900">
                                            {pax.FirstName}
                                          </td>
                                          <td className="py-2 px-3 font-semibold text-slate-900">
                                            {pax.LastName}
                                          </td>
                                          <td className="py-2 px-3">{pax.Gender}</td>
                                          <td className="py-2 px-3 font-mono">{pax.DOB}</td>
                                          <td className="py-2 px-3">{pax.Nationality}</td>
                                          <td className="py-2 px-3 font-mono font-medium">
                                            {pax.PassportNumber}
                                          </td>
                                          <td className="py-2 px-3 text-[11px] font-mono">
                                            <div>Iss: {pax.PassportIssueDate || '—'}</div>
                                            <div>Exp: {pax.PassportExpiryDate || '—'}</div>
                                          </td>
                                          <td className="py-2 px-3 font-mono font-semibold text-[#1B3664]">
                                            {pax.TicketNumber || 'Not Issued'}
                                          </td>
                                          <td className="py-2 px-3">
                                            {pax.PassportImageName ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                <FileText className="w-3 h-3" />
                                                {pax.PassportImageName}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 text-[11px]">
                                                Not uploaded
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() =>
                                                  setEditingPax({
                                                    bookingId: booking.AirGroupBookingID,
                                                    passenger: { ...pax }
                                                  })
                                                }
                                                className="px-2.5 py-1 rounded-lg bg-[#1B3664] text-white text-[11px] font-medium hover:bg-[#0F172A] transition cursor-pointer"
                                              >
                                                Edit Pax
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (
                                                    window.confirm(
                                                      `Remove passenger ${pax.FirstName} ${pax.LastName}?`
                                                    )
                                                  ) {
                                                    deletePassenger(
                                                      booking.AirGroupBookingID,
                                                      pax.PassengerID
                                                    );
                                                  }
                                                }}
                                                className="p-1 rounded-lg text-slate-500 hover:text-red-600 cursor-pointer"
                                                title="Delete Passenger"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. PRINT DETAILS / E-TICKET MODAL */}
      {printBooking && (
        <TicketPrintModal booking={printBooking} onClose={() => setPrintBooking(null)} />
      )}

      {/* 2. CONFIRM VOID BOOKING MODAL */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
            <div className="bg-[#0F172A] text-white px-5 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                Confirm Void Booking
              </h5>
              <button onClick={() => setVoidTarget(null)} className="text-white/70 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmVoid} className="p-5 space-y-4">
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Are you sure you want to void this booking ({voidTarget.PNR} /{' '}
                  {voidTarget.AirGroupBookingID})?
                </span>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Void Remarks <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={voidRemarks}
                  onChange={(e) => setVoidRemarks(e.target.value)}
                  placeholder="Enter reason for voiding the booking"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none text-xs"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-medium transition cursor-pointer"
                >
                  Void Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm">
                Edit Booking — {editingBooking.AirGroupBookingID}
              </h5>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-white/75 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBookingEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Select Agent:</label>
                <select
                  value={editingBooking.SubCompanyID}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, SubCompanyID: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none font-medium"
                >
                  <option value="DIRECT">Bookly Direct Desk</option>
                  {subAgents.map((a) => (
                    <option key={a.SubCompanyID} value={a.SubCompanyID}>
                      {a.CompanyName} ({a.City})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {editingBooking.ApprovalStatus !== 'Ticket Issued' && (
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Booking Time Limit
                    </label>
                    <input
                      type="text"
                      value={editingBooking.BookingTimeLimit || ''}
                      onChange={(e) =>
                        setEditingBooking({ ...editingBooking, BookingTimeLimit: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                    />
                  </div>
                )}
                <div className={editingBooking.ApprovalStatus === 'Ticket Issued' ? 'col-span-2' : ''}>
                  <label className="block font-medium text-slate-700 mb-1">Booking PNR</label>
                  <input
                    type="text"
                    value={editingBooking.PNR || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, PNR: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editingBooking.EmailAddress || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, EmailAddress: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="text"
                    value={editingBooking.MobileNumber || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, MobileNumber: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Remarks</label>
                <textarea
                  rows={2}
                  value={editingBooking.Remarks || ''}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, Remarks: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-[#1B3664] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT PASSENGER DETAILS MODAL */}
      {editingPax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden my-8">
            <div className="bg-[#1D314F] text-white px-5 py-3.5 flex items-center justify-between">
              <h5 className="font-semibold text-sm">
                Edit Passenger Details — {editingPax.passenger.PassengerID}
              </h5>
              <button onClick={() => setEditingPax(null)} className="text-white/75 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassengerEdit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Title</label>
                  <select
                    value={editingPax.passenger.Title || 'MR'}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, Title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MSTR">MSTR</option>
                    <option value="MISS">MISS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={editingPax.passenger.FirstName || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: {
                          ...editingPax.passenger,
                          FirstName: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={editingPax.passenger.LastName || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: {
                          ...editingPax.passenger,
                          LastName: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={editingPax.passenger.Gender || 'Male'}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, Gender: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingPax.passenger.DOB || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, DOB: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nationality</label>
                  <input
                    type="text"
                    value={editingPax.passenger.Nationality || 'PAK'}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: {
                          ...editingPax.passenger,
                          Nationality: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Passport Number</label>
                  <input
                    type="text"
                    value={editingPax.passenger.PassportNumber || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: {
                          ...editingPax.passenger,
                          PassportNumber: e.target.value.toUpperCase()
                        }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Passport Issue Date</label>
                  <input
                    type="date"
                    value={editingPax.passenger.PassportIssueDate || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, PassportIssueDate: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={editingPax.passenger.PassportExpiryDate || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, PassportExpiryDate: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Ticket Number</label>
                  <input
                    type="text"
                    value={editingPax.passenger.TicketNumber || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, TicketNumber: e.target.value }
                      })
                    }
                    placeholder="7400000005310"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono font-semibold text-[#1B3664]"
                  />
                </div>
              </div>

              {/* Passport Scan Upload & Preview */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-800">Upload Passport Scan</div>
                    <div className="text-[11px] text-slate-500">
                      Accepted formats: .jpg, .jpeg, .png • Current:{' '}
                      <b>{editingPax.passenger.PassportImageName || 'Passport file not uploaded'}</b>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3664] text-white font-medium hover:bg-[#0F172A] transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={handlePassportFileUpload}
                        className="hidden"
                      />
                    </label>
                    {editingPax.passenger.PassportFileData && (
                      <a
                        href={editingPax.passenger.PassportFileData}
                        download={editingPax.passenger.PassportImageName || 'passport.jpg'}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white font-medium"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Passport</span>
                      </a>
                    )}
                  </div>
                </div>
                {editingPax.passenger.PassportFileData && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={editingPax.passenger.PassportFileData}
                      alt="Passport Preview"
                      className="max-h-40 rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingPax(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white font-medium transition cursor-pointer"
                >
                  Update Passenger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
