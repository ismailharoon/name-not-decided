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
  { key: 'Ticket Void', label: 'Void' }
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
  const [expandedRows, setExpandedRows] = useState(() => ({ 'BK-90841': true, 'BK-90842': true }));

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
      'Ticket Void': 0
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
          b.PNR_AIRLINE?.toLowerCase().includes(q) ||
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            Pending
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        );
      case 'Ticket Issued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#EE8200] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Ticket Issued
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-900 border border-red-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            Rejected
          </span>
        );
      case 'Ticket Void':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0B0A09] text-white">
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
            Ticket Void
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-200 text-neutral-800">
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
        BookingTimeLimit: editingBooking.BookingTimeLimit,
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
      await updatePassenger(editingPax.bookingId, editingPax.passenger.PassengerID, editingPax.passenger);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EE8200]">
            PNR & E-Ticket Control Desk
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0A09] mt-0.5">
            Flight Bookings
          </h1>
        </div>

        {/* Status Filter Pills (All, Pending, Approved, Rejected, Issued, Void) */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const active = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  active
                    ? 'bg-[#EE8200] text-white shadow-md'
                    : 'bg-white text-[#0B0A09] border border-[#EE8200]/15 hover:bg-[#FFF7ED]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                    active ? 'bg-white/20 text-white' : 'bg-[#FFF7ED] text-[#EE8200]'
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
      <div className="bg-white rounded-2xl border border-[#EE8200]/15 p-4 shadow-executive flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#EE8200]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Filter by Booking ID, PNR, Passenger Name, Passport #, Ticket #, or Route..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15 text-xs sm:text-sm focus:outline-none focus:border-[#EE8200]"
          />
        </div>
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-[#EE8200]" />
          <select
            value={agentFilter}
            onChange={(e) => setAgentFilter(e.target.value)}
            className="px-3.5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15 text-xs font-bold text-[#0B0A09] focus:outline-none focus:border-[#EE8200]"
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
      <div className="bg-white rounded-2xl border border-[#EE8200]/15 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#EE8200] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3 w-10"></th>
                <th className="py-3.5 px-3">Booking / PNR</th>
                <th className="py-3.5 px-3">Sub Agent & Channel</th>
                <th className="py-3.5 px-3">Flight Sector</th>
                <th className="py-3.5 px-3">Approval Status</th>
                <th className="py-3.5 px-3 text-center">Pax (A/C/I)</th>
                <th className="py-3.5 px-3">Total Price</th>
                <th className="py-3.5 px-3">Time Limit / Audit</th>
                <th className="py-3.5 px-4 text-right">Booking Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 text-xs">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No flight bookings match your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => {
                  const isExpanded = Boolean(expandedRows[booking.AirGroupBookingID]);
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
                        className={`transition hover:bg-[#FFF7ED]/70 ${
                          isExpanded ? 'bg-[#FFF7ED]/50' : ''
                        }`}
                      >
                        <td className="py-4 px-3 text-center">
                          <button
                            onClick={() => toggleExpand(booking.AirGroupBookingID)}
                            className="p-1.5 rounded-lg bg-[#FFF7ED] hover:bg-[#EE8200] text-[#EE8200] hover:text-white transition"
                            title="Expand Passengers & Segments"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-mono font-extrabold text-sm text-[#EE8200]">
                            {booking.PNR}
                          </div>
                          <div className="text-[11px] font-semibold text-neutral-600">
                            ID: {booking.AirGroupBookingID}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono">
                            Airline PNR: {booking.PNR_AIRLINE || booking.PNR}
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-bold text-[#0B0A09] max-w-[210px] truncate">
                            {booking.SubCompanyName}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {booking.BookingChannelName || 'B2B Agent Portal'}
                          </div>
                          <div className="text-[11px] text-[#EE8200] font-medium">
                            {booking.EmailAddress}
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          <div className="font-bold text-[#0B0A09] max-w-[220px] truncate">
                            {booking.FlightTitle}
                          </div>
                          <div className="text-[11px] text-neutral-500">
                            {booking.ValidatingCarrierName} • {booking.TripType}
                          </div>
                        </td>

                        <td className="py-4 px-3">
                          {renderStatusBadge(booking.ApprovalStatus)}
                          {booking.ApprovalLoginID && (
                            <div className="text-[10px] text-neutral-500 mt-1">
                              By <b>{booking.ApprovalLoginID}</b> ({booking.ApprovalDateTime})
                            </div>
                          )}
                          {booking.ApprovalStatus === 'Ticket Void' && booking.VoidReason && (
                            <div className="text-[10px] text-red-700 font-medium mt-1 max-w-[180px] truncate" title={booking.VoidReason}>
                              Void: {booking.VoidReason}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-neutral-200 font-mono font-bold">
                            <span title="Adults">{booking.AdultCount || 0}A</span> /
                            <span title="Children">{booking.ChildCount || 0}C</span> /
                            <span title="Infants">{booking.InfantCount || 0}I</span>
                          </div>
                          <div className="text-[10px] text-neutral-500 mt-1">
                            {(booking.Passengers || []).length} Pax Total
                          </div>
                        </td>

                        <td className="py-4 px-3 font-mono font-bold text-sm text-[#EE8200]">
                          {formatCurrencyPKR(booking.TotalPrice)}
                        </td>

                        <td className="py-4 px-3">
                          <div className="flex items-center gap-1 text-[11px] font-semibold text-[#0B0A09]">
                            <Clock className="w-3.5 h-3.5 text-[#EE8200]" />
                            <span>{booking.BookingTimeLimit || '—'}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Created: {booking.TimeStamp}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            {canApprove && (
                              <button
                                onClick={() => approveBooking(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Approve Booking"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Approve
                              </button>
                            )}

                            {canReject && (
                              <button
                                onClick={() => rejectBooking(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Reject Booking"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                Reject
                              </button>
                            )}

                            {canIssue && (
                              <button
                                onClick={() => issueTicket(booking.AirGroupBookingID)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#EE8200] hover:bg-black text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
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
                                className="px-2.5 py-1.5 rounded-lg bg-[#0B0A09] hover:bg-red-950 text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                title="Void Ticket"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Void Ticket
                              </button>
                            )}

                            <button
                              onClick={() => setPrintBooking(booking)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FFF7ED] hover:bg-[#EE8200] text-[#EE8200] hover:text-white border border-[#EE8200]/20 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Print Details / E-Ticket PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              {booking.ApprovalStatus === 'Ticket Issued'
                                ? 'Print Ticket'
                                : 'Print Details'}
                            </button>

                            <button
                              onClick={() => setEditingBooking({ ...booking })}
                              className="p-1.5 rounded-lg border border-neutral-200 hover:border-[#EE8200] text-neutral-700 hover:text-[#EE8200] transition cursor-pointer"
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
                              className="p-1.5 rounded-lg border border-neutral-200 hover:border-red-600 text-neutral-500 hover:text-red-600 transition cursor-pointer"
                              title="Delete Booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* EXPANDED DETAIL TEMPLATE: PASSENGERS & FLIGHT SEGMENTS */}
                      {isExpanded && (
                        <tr className="bg-[#FAFAFA]">
                          <td colSpan={9} className="p-5 border-b-2 border-[#EE8200]/20">
                            <div className="space-y-5">
                              {/* 1. Flight Segments Box */}
                              <div className="bg-white rounded-xl border border-[#EE8200]/15 p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <h5 className="font-display font-bold text-xs uppercase tracking-wider text-[#EE8200] flex items-center gap-2">
                                    <Plane className="w-4 h-4" />
                                    Flight Segments ({(booking.Segments || []).length})
                                  </h5>
                                  {booking.Remarks && (
                                    <span className="text-xs text-neutral-600 italic">
                                      Remarks: &ldquo;{booking.Remarks}&rdquo;
                                    </span>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {(booking.Segments || []).map((seg) => (
                                    <div
                                      key={seg.AirGroupSegmentID}
                                      className="p-3.5 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15 flex items-center justify-between gap-4"
                                    >
                                      <div>
                                        <div className="font-bold text-sm text-[#EE8200]">
                                          {seg.DepartureCity} ({seg.DepartureIata})
                                        </div>
                                        <div className="text-[11px] text-neutral-500">
                                          {formatDateTime(seg.DepartureDate)}
                                        </div>
                                      </div>
                                      <div className="text-center px-2">
                                        <div className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#EE8200] text-white">
                                          {seg.FlightNumber}
                                        </div>
                                        <div className="text-[10px] text-neutral-500 mt-1">
                                          Class: {seg.FlightClass} ({seg.FlightClassCode})
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-bold text-sm text-[#0B0A09]">
                                          {seg.ArrivalCity} ({seg.ArrivalIata})
                                        </div>
                                        <div className="text-[11px] text-neutral-500">
                                          {formatDateTime(seg.ArrivalDate)}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* 2. Passengers Table */}
                              <div className="bg-white rounded-xl border border-[#EE8200]/15 overflow-hidden">
                                <div className="px-4 py-3 bg-[#FFF7ED] border-b border-[#EE8200]/10 flex items-center justify-between">
                                  <h5 className="font-display font-bold text-xs uppercase tracking-wider text-[#EE8200] flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Passenger Information ({(booking.Passengers || []).length})
                                  </h5>
                                  <span className="text-[11px] text-neutral-500">
                                    Click Edit on any passenger to update details or upload/download passport scan
                                  </span>
                                </div>
                                <div className="overflow-x-auto">
                                  <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                      <tr className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                                        <th className="py-2.5 px-3">Pax Type</th>
                                        <th className="py-2.5 px-3">Title</th>
                                        <th className="py-2.5 px-3">First Name</th>
                                        <th className="py-2.5 px-3">Last Name</th>
                                        <th className="py-2.5 px-3">Gender</th>
                                        <th className="py-2.5 px-3">DOB</th>
                                        <th className="py-2.5 px-3">Nationality</th>
                                        <th className="py-2.5 px-3">Passport #</th>
                                        <th className="py-2.5 px-3">Passport Issue / Expiry</th>
                                        <th className="py-2.5 px-3">Ticket #</th>
                                        <th className="py-2.5 px-3">Passport Scan</th>
                                        <th className="py-2.5 px-3 text-right">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100">
                                      {(booking.Passengers || []).map((pax) => (
                                        <tr key={pax.PassengerID} className="hover:bg-[#FAFAFA]">
                                          <td className="py-2.5 px-3">
                                            <span className="px-2 py-0.5 rounded bg-[#FFF7ED] text-[#EE8200] font-bold text-[11px]">
                                              {pax.PassengerType}
                                            </span>
                                          </td>
                                          <td className="py-2.5 px-3 font-semibold">{pax.Title}</td>
                                          <td className="py-2.5 px-3 font-bold text-[#0B0A09]">
                                            {pax.FirstName}
                                          </td>
                                          <td className="py-2.5 px-3 font-bold text-[#0B0A09]">
                                            {pax.LastName}
                                          </td>
                                          <td className="py-2.5 px-3">{pax.Gender}</td>
                                          <td className="py-2.5 px-3 font-mono">{pax.DOB}</td>
                                          <td className="py-2.5 px-3">{pax.Nationality}</td>
                                          <td className="py-2.5 px-3 font-mono font-bold">
                                            {pax.PassportNumber}
                                          </td>
                                          <td className="py-2.5 px-3 text-[11px] font-mono">
                                            <div>Iss: {pax.PassportIssueDate || '—'}</div>
                                            <div>Exp: {pax.PassportExpiryDate || '—'}</div>
                                          </td>
                                          <td className="py-2.5 px-3 font-mono font-bold text-[#EE8200]">
                                            {pax.TicketNumber || 'Not Issued'}
                                          </td>
                                          <td className="py-2.5 px-3">
                                            {pax.PassportImageName ? (
                                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                <FileText className="w-3 h-3" />
                                                {pax.PassportImageName}
                                              </span>
                                            ) : (
                                              <span className="text-neutral-400 text-[11px]">
                                                Not uploaded
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button
                                                onClick={() =>
                                                  setEditingPax({
                                                    bookingId: booking.AirGroupBookingID,
                                                    passenger: { ...pax }
                                                  })
                                                }
                                                className="px-2.5 py-1 rounded-lg bg-[#EE8200] text-white text-[11px] font-bold hover:bg-black transition"
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
                                                className="p-1 rounded-lg text-neutral-500 hover:text-red-600"
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

      {/* 2. CONFIRM VOID BOOKING MODAL (Matches Confirm Void Booking & Void Remarks *) */}
      {voidTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 max-w-md w-full overflow-hidden">
            <div className="bg-[#0B0A09] text-white px-6 py-4 flex items-center justify-between">
              <h5 className="font-bold text-base flex items-center gap-2">
                <Ban className="w-4 h-4 text-red-400" />
                Confirm Void Booking
              </h5>
              <button onClick={() => setVoidTarget(null)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmVoid} className="p-6 space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-bold flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>
                  Are you sure you want to void this booking ({voidTarget.PNR} /{' '}
                  {voidTarget.AirGroupBookingID})?
                </span>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1.5">
                  Void Remarks <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  value={voidRemarks}
                  onChange={(e) => setVoidRemarks(e.target.value)}
                  placeholder="Enter reason for voiding the booking"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none text-xs"
                  required
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidTarget(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B0A09] hover:bg-red-900 text-white text-xs font-bold transition"
                >
                  Void Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT BOOKING MODAL (Select Agent, Booking Time Limit, PNR, Contact, Remarks) */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 max-w-lg w-full overflow-hidden">
            <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between">
              <h5 className="font-bold text-base">
                Edit Booking — {editingBooking.AirGroupBookingID}
              </h5>
              <button
                onClick={() => setEditingBooking(null)}
                className="text-white/75 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBookingEdit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#0B0A09] mb-1.5">Select Agent:</label>
                <select
                  value={editingBooking.SubCompanyID}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, SubCompanyID: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none font-semibold"
                >
                  {subAgents.map((a) => (
                    <option key={a.SubCompanyID} value={a.SubCompanyID}>
                      {a.CompanyName} ({a.City})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1.5">
                    Booking Time Limit
                  </label>
                  <input
                    type="text"
                    value={editingBooking.BookingTimeLimit || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, BookingTimeLimit: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1.5">Booking PNR</label>
                  <input
                    type="text"
                    value={editingBooking.PNR || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, PNR: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={editingBooking.EmailAddress || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, EmailAddress: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1.5">Mobile Number</label>
                  <input
                    type="text"
                    value={editingBooking.MobileNumber || ''}
                    onChange={(e) =>
                      setEditingBooking({ ...editingBooking, MobileNumber: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0B0A09] mb-1.5">Remarks</label>
                <textarea
                  rows={2}
                  value={editingBooking.Remarks || ''}
                  onChange={(e) =>
                    setEditingBooking({ ...editingBooking, Remarks: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 focus:border-[#EE8200] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingBooking(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold transition"
                >
                  Update Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. EDIT PASSENGER DETAILS MODAL (Matches Edit Passenger Details & Upload/Download Passport) */}
      {editingPax && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 max-w-2xl w-full overflow-hidden my-8">
            <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between">
              <h5 className="font-bold text-base">
                Edit Passenger Details — {editingPax.passenger.PassengerID}
              </h5>
              <button onClick={() => setEditingPax(null)} className="text-white/75 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePassengerEdit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Title</label>
                  <select
                    value={editingPax.passenger.Title || 'MR'}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, Title: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  >
                    <option value="MR">MR</option>
                    <option value="MRS">MRS</option>
                    <option value="MSTR">MSTR</option>
                    <option value="MISS">MISS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">First Name</label>
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
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Last Name</label>
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
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Gender</label>
                  <select
                    value={editingPax.passenger.Gender || 'Male'}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, Gender: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={editingPax.passenger.DOB || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, DOB: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Nationality</label>
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
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Passport Number</label>
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
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Passport Issue Date</label>
                  <input
                    type="date"
                    value={editingPax.passenger.PassportIssueDate || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, PassportIssueDate: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Passport Expiry Date</label>
                  <input
                    type="date"
                    value={editingPax.passenger.PassportExpiryDate || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, PassportExpiryDate: e.target.value }
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Ticket Number</label>
                  <input
                    type="text"
                    value={editingPax.passenger.TicketNumber || ''}
                    onChange={(e) =>
                      setEditingPax({
                        ...editingPax,
                        passenger: { ...editingPax.passenger, TicketNumber: e.target.value }
                      })
                    }
                    placeholder="721-XXXXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-[#EE8200]"
                  />
                </div>
              </div>

              {/* Passport Scan Upload & Preview */}
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-[#0B0A09]">Upload Passport Scan</div>
                    <div className="text-[11px] text-neutral-500">
                      Accepted formats: .jpg, .jpeg, .png • Current:{' '}
                      <b>{editingPax.passenger.PassportImageName || 'Passport file not uploaded'}</b>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EE8200] text-white font-bold hover:bg-black transition">
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
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black text-white font-bold"
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
                      className="max-h-44 rounded-lg border border-neutral-300"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingPax(null)}
                  className="px-4 py-2 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold transition"
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
