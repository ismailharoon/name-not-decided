import React, { useState } from 'react';
import {
  Plus,
  Layers,
  Eye,
  Edit3,
  Trash2,
  X,
  FileSpreadsheet,
  FileText,
  Plane
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import {
  formatCurrencyPKR,
  formatDateTime,
  downloadExcelManifest,
  downloadExcelPassengersList,
  downloadWordManifest
} from '../utils/exporters';

const INITIAL_SEGMENT_FORM = {
  FlightNumber: 'HH-7216',
  MarketingAirline: 'HH',
  OperatingAirline: 'HH',
  OperatingAirlineName: 'Taban Air',
  DepartureIata: 'KHI',
  DepartureAirport: 'Jinnah International Airport',
  DepartureCity: 'Karachi',
  DepartureCountry: 'Pakistan',
  DepartureDate: '2026-12-15T05:00',
  ArrivalIata: 'IKA',
  ArrivalAirport: 'Imam Khomeini International Airport',
  ArrivalCity: 'Tehran',
  ArrivalCountry: 'Iran',
  ArrivalDate: '2026-12-15T07:30',
  TotalSeats: 160,
  FlightClass: 'Economy',
  FlightClassCode: 'Y',
  FlightTime: '03h 30m',
  FlightMinutes: 210,
  LayoverDuration: 0,
  AirCraft: 'Boeing 737-400',
  Meal: 'Yes',
  AdultFareBasisCode: 'Y26PKIR',
  ChildFareBasisCode: 'CH26PKIR',
  InfantFareBasisCode: 'IN26PKIR',
  BaggageTypeADT: 'Pieces',
  BaggageCountADT: '1 PC (30 KG)',
  BaggageTypeCNN: 'Pieces',
  BaggageCountCNN: '1 PC (20 KG)',
  BaggageTypeINF: 'Pieces',
  BaggageCountINF: '1 PC (10 KG)',
  AdultPrice: 92500,
  AdultBasicFare: 76000,
  AdultTax: 16500,
  ChildPrice: 74000,
  ChildBasicFare: 60000,
  ChildTax: 14000,
  InfantPrice: 24500,
  InfantBasicFare: 20000,
  InfantTax: 4500,
  AdultPriceSupplier: 84000,
  AdultBasicFareSupplier: 69000,
  AdultTaxSupplier: 15000,
  ChildPriceSupplier: 67000,
  ChildBasicFareSupplier: 54000,
  ChildTaxSupplier: 13000,
  InfantPriceSupplier: 21000,
  InfantBasicFareSupplier: 17000,
  InfantTaxSupplier: 4000
};

export default function SegmentManagement() {
  const {
    segments,
    flights,
    bookings,
    airports,
    airlines,
    createSegment,
    updateSegment,
    deleteSegment,
    addToast
  } = usePortal();

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_SEGMENT_FORM);
  const [detailsSegment, setDetailsSegment] = useState(null);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(INITIAL_SEGMENT_FORM);
    setShowEditor(true);
  };

  const openEditModal = (seg) => {
    setEditingId(seg.AirGroupSegmentID);
    setForm({ ...INITIAL_SEGMENT_FORM, ...seg });
    setShowEditor(true);
  };

  const handleAirportSelect = (prefix, code) => {
    const found = airports.find((a) => a.AirportCode === code);
    if (!found) return;
    if (prefix === 'Departure') {
      setForm((prev) => ({
        ...prev,
        DepartureIata: found.AirportCode,
        DepartureAirport: found.AirportName,
        DepartureCity: found.CityName,
        DepartureCountry: found.CountryName
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        ArrivalIata: found.AirportCode,
        ArrivalAirport: found.AirportName,
        ArrivalCity: found.CityName,
        ArrivalCountry: found.CountryName
      }));
    }
  };

  const handleSaveSegment = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSegment(editingId, form);
      } else {
        await createSegment(form);
      }
      setShowEditor(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Get all passengers booked on flights containing this segment
  const getPassengersForSegment = (seg) => {
    if (!seg) return [];
    const groupIds = flights
      .filter((f) => (f.SegmentIDs || []).includes(seg.AirGroupSegmentID))
      .map((f) => f.AirGroupID);

    const relevantBookings = bookings.filter(
      (b) =>
        groupIds.includes(b.AirGroupID) &&
        b.ApprovalStatus !== 'Rejected' &&
        b.ApprovalStatus !== 'Ticket Void'
    );

    const paxList = [];
    relevantBookings.forEach((b) => {
      (b.Passengers || []).forEach((p) => {
        paxList.push({
          ...p,
          PNR: b.PNR,
          MobileNumber: b.MobileNumber,
          BookingStatus: b.ApprovalStatus
        });
      });
    });
    return paxList;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#331700]">
            Sector Legs, Pricing & IATA Manifests
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0A09] mt-0.5">
            Segment Management
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#331700] hover:bg-black text-white font-bold text-xs transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Flight Segment</span>
        </button>
      </div>

      {/* Segments Table */}
      <div className="bg-white rounded-2xl border border-[#331700]/15 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#331700] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3">Flight No</th>
                <th className="py-3.5 px-3">From (Departure)</th>
                <th className="py-3.5 px-3">To (Arrival)</th>
                <th className="py-3.5 px-3">Flight Date & Time</th>
                <th className="py-3.5 px-3">Aircraft & Cabin</th>
                <th className="py-3.5 px-3 text-center">Total Seats</th>
                <th className="py-3.5 px-3">Customer / Supplier Fare</th>
                <th className="py-3.5 px-4 text-right">Actions & Manifests</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {segments.map((seg) => (
                <tr key={seg.AirGroupSegmentID} className="hover:bg-[#FAF6F2]/60 transition">
                  <td className="py-4 px-3">
                    <div className="font-mono font-extrabold text-sm text-[#331700]">
                      {seg.FlightNumber}
                    </div>
                    <div className="text-[11px] text-neutral-500">{seg.OperatingAirlineName}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-[#0B0A09]">
                      {seg.DepartureCity} ({seg.DepartureIata})
                    </div>
                    <div className="text-[11px] text-neutral-500 max-w-[180px] truncate">
                      {seg.DepartureAirport}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-[#0B0A09]">
                      {seg.ArrivalCity} ({seg.ArrivalIata})
                    </div>
                    <div className="text-[11px] text-neutral-500 max-w-[180px] truncate">
                      {seg.ArrivalAirport}
                    </div>
                  </td>
                  <td className="py-4 px-3 font-mono">
                    <div className="font-bold text-[#0B0A09]">
                      {formatDateTime(seg.DepartureDate)}
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      Arr: {formatDateTime(seg.ArrivalDate)}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-semibold text-[#0B0A09]">{seg.AirCraft}</div>
                    <div className="text-[11px] text-[#331700] font-bold">
                      {seg.FlightClass} ({seg.FlightClassCode}) • {seg.BaggageCountADT}
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center font-mono font-bold">
                    {seg.TotalSeats}
                  </td>
                  <td className="py-4 px-3 font-mono text-[11px]">
                    <div className="font-bold text-[#331700]">
                      Pax: {formatCurrencyPKR(seg.AdultPrice)}
                    </div>
                    <div className="text-neutral-500">
                      Sup: {formatCurrencyPKR(seg.AdultPriceSupplier)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailsSegment(seg)}
                        className="px-3 py-1.5 rounded-lg bg-[#331700] hover:bg-black text-white font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details & Manifest</span>
                      </button>
                      <button
                        onClick={() => openEditModal(seg)}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:border-[#331700] text-neutral-700 hover:text-[#331700] cursor-pointer"
                        title="Edit Segment"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete segment ${seg.FlightNumber}?`)) {
                            deleteSegment(seg.AirGroupSegmentID);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:border-red-600 text-neutral-500 hover:text-red-600 cursor-pointer"
                        title="Delete Segment"
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

      {/* FLIGHT SEGMENT DETAILS & MANIFEST EXPORT MODAL */}
      {detailsSegment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#331700]/20 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header + 3 Manifest Export Buttons */}
            <div className="bg-[#331700] text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div>
                <h5 className="font-bold text-base">
                  Flight Segment Details — {detailsSegment.FlightNumber} ({detailsSegment.DepartureIata} &rarr;{' '}
                  {detailsSegment.ArrivalIata})
                </h5>
                <p className="text-xs text-white/75">
                  Download official Excel Manifest, 15-Column Passenger List, or Word IATA PNL
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const pax = getPassengersForSegment(detailsSegment);
                    downloadExcelManifest(detailsSegment, pax);
                    addToast('Manifest (Excel) downloaded.', 'success');
                  }}
                  className="px-3 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span>Manifest (Excel)</span>
                </button>
                <button
                  onClick={() => {
                    const pax = getPassengersForSegment(detailsSegment);
                    downloadExcelPassengersList(detailsSegment, pax);
                    addToast('Passenger List (Excel) downloaded.', 'success');
                  }}
                  className="px-3 py-2 rounded-xl bg-white text-[#331700] hover:bg-[#FAF6F2] font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-[#331700]" />
                  <span>Passenger List (Excel)</span>
                </button>
                <button
                  onClick={() => {
                    const pax = getPassengersForSegment(detailsSegment);
                    downloadWordManifest(detailsSegment, pax);
                    addToast('Manifest (Word IATA PNL) downloaded.', 'success');
                  }}
                  className="px-3 py-2 rounded-xl bg-black/50 border border-white/25 hover:bg-black text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Manifest (Word)</span>
                </button>
                <button
                  onClick={() => setDetailsSegment(null)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Flight Information Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#FAF8F6] border border-[#331700]/15">
                <div>
                  <b>Flight No:</b> {detailsSegment.FlightNumber}
                </div>
                <div>
                  <b>Aircraft:</b> {detailsSegment.AirCraft}
                </div>
                <div>
                  <b>Class:</b> {detailsSegment.FlightClass} ({detailsSegment.FlightClassCode})
                </div>
                <div>
                  <b>Flight Time:</b> {detailsSegment.FlightTime} ({detailsSegment.FlightMinutes} min)
                </div>
                <div>
                  <b>Marketing Airline:</b> {detailsSegment.MarketingAirline}
                </div>
                <div>
                  <b>Operating Airline:</b> {detailsSegment.OperatingAirlineName}
                </div>
                <div>
                  <b>Baggage (ADT/CNN/INF):</b> {detailsSegment.BaggageCountADT} /{' '}
                  {detailsSegment.BaggageCountCNN} / {detailsSegment.BaggageCountINF}
                </div>
                <div>
                  <b>Meal / Total Seats:</b> {detailsSegment.Meal} / {detailsSegment.TotalSeats}
                </div>
              </div>

              {/* Departure & Arrival Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[#331700]/15 overflow-hidden">
                  <div className="bg-[#FAF6F2] px-4 py-2.5 font-bold text-[#331700] border-b border-[#331700]/10">
                    Departure
                  </div>
                  <div className="p-4 space-y-1">
                    <div>
                      <b>City:</b> {detailsSegment.DepartureCity} ({detailsSegment.DepartureIata})
                    </div>
                    <div>
                      <b>Airport:</b> {detailsSegment.DepartureAirport}
                    </div>
                    <div>
                      <b>Country:</b> {detailsSegment.DepartureCountry}
                    </div>
                    <div>
                      <b>Date & Time:</b> {formatDateTime(detailsSegment.DepartureDate)}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-[#331700]/15 overflow-hidden">
                  <div className="bg-[#FAF6F2] px-4 py-2.5 font-bold text-[#331700] border-b border-[#331700]/10">
                    Arrival
                  </div>
                  <div className="p-4 space-y-1">
                    <div>
                      <b>City:</b> {detailsSegment.ArrivalCity} ({detailsSegment.ArrivalIata})
                    </div>
                    <div>
                      <b>Airport:</b> {detailsSegment.ArrivalAirport}
                    </div>
                    <div>
                      <b>Country:</b> {detailsSegment.ArrivalCountry}
                    </div>
                    <div>
                      <b>Date & Time:</b> {formatDateTime(detailsSegment.ArrivalDate)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fare Details Card */}
              <div className="rounded-xl border border-[#331700]/15 overflow-hidden">
                <div className="bg-[#FAF6F2] px-4 py-2.5 font-bold text-[#331700] border-b border-[#331700]/10">
                  Fare Details (Customer & Supplier)
                </div>
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <b>Adult Price:</b> {formatCurrencyPKR(detailsSegment.AdultPrice)} (Basic:{' '}
                    {formatCurrencyPKR(detailsSegment.AdultBasicFare)}, Tax:{' '}
                    {formatCurrencyPKR(detailsSegment.AdultTax)})
                  </div>
                  <div>
                    <b>Child Price:</b> {formatCurrencyPKR(detailsSegment.ChildPrice)}
                  </div>
                  <div>
                    <b>Infant Price:</b> {formatCurrencyPKR(detailsSegment.InfantPrice)}
                  </div>
                  <div>
                    <b>Adult Price (Supplier):</b>{' '}
                    {formatCurrencyPKR(detailsSegment.AdultPriceSupplier)}
                  </div>
                  <div>
                    <b>Child Price (Supplier):</b>{' '}
                    {formatCurrencyPKR(detailsSegment.ChildPriceSupplier)}
                  </div>
                  <div>
                    <b>Infant Price (Supplier):</b>{' '}
                    {formatCurrencyPKR(detailsSegment.InfantPriceSupplier)}
                  </div>
                </div>
              </div>

              {/* Segment Passenger Manifest Table */}
              <div>
                <h6 className="font-display font-bold text-sm text-[#331700] mb-2">
                  Passengers Booked on {detailsSegment.FlightNumber} (
                  {getPassengersForSegment(detailsSegment).length})
                </h6>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 font-bold">
                        <th className="py-2 px-3">#</th>
                        <th className="py-2 px-3">Title</th>
                        <th className="py-2 px-3">Last Name</th>
                        <th className="py-2 px-3">First Name</th>
                        <th className="py-2 px-3">Pax Type</th>
                        <th className="py-2 px-3">Passport #</th>
                        <th className="py-2 px-3">DOB</th>
                        <th className="py-2 px-3">PNR</th>
                        <th className="py-2 px-3">Ticket #</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {getPassengersForSegment(detailsSegment).map((p, idx) => (
                        <tr key={p.PassengerID || idx}>
                          <td className="py-2 px-3">{idx + 1}</td>
                          <td className="py-2 px-3">{p.Title}</td>
                          <td className="py-2 px-3 font-bold">{p.LastName}</td>
                          <td className="py-2 px-3 font-bold">{p.FirstName}</td>
                          <td className="py-2 px-3">{p.PassengerType}</td>
                          <td className="py-2 px-3 font-mono">{p.PassportNumber}</td>
                          <td className="py-2 px-3 font-mono">{p.DOB}</td>
                          <td className="py-2 px-3 font-mono font-bold text-[#331700]">{p.PNR}</td>
                          <td className="py-2 px-3 font-mono">{p.TicketNumber || 'PENDING'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SEGMENT MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#331700]/20 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#331700] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h5 className="font-bold text-base">
                {editingId ? `Edit Flight Segment — ${editingId}` : 'Add Flight Segment'}
              </h5>
              <button onClick={() => setShowEditor(false)} className="text-white/75 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSegment} className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold mb-1">Departure Airport</label>
                  <select
                    value={form.DepartureIata}
                    onChange={(e) => handleAirportSelect('Departure', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  >
                    {airports.map((a) => (
                      <option key={a.AirportCode} value={a.AirportCode}>
                        {a.AirportCode} — {a.CityName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Departure Date</label>
                  <input
                    type="datetime-local"
                    value={form.DepartureDate?.slice(0, 16) || ''}
                    onChange={(e) => setForm({ ...form, DepartureDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Arrival Airport</label>
                  <select
                    value={form.ArrivalIata}
                    onChange={(e) => handleAirportSelect('Arrival', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  >
                    {airports.map((a) => (
                      <option key={a.AirportCode} value={a.AirportCode}>
                        {a.AirportCode} — {a.CityName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Arrival Date</label>
                  <input
                    type="datetime-local"
                    value={form.ArrivalDate?.slice(0, 16) || ''}
                    onChange={(e) => setForm({ ...form, ArrivalDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-bold mb-1">Flight Number</label>
                  <input
                    type="text"
                    value={form.FlightNumber}
                    onChange={(e) => setForm({ ...form, FlightNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Total Seats</label>
                  <input
                    type="number"
                    value={form.TotalSeats}
                    onChange={(e) => setForm({ ...form, TotalSeats: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Flight Class</label>
                  <select
                    value={form.FlightClass}
                    onChange={(e) => setForm({ ...form, FlightClass: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  >
                    <option value="Economy">Economy</option>
                    <option value="Premium Economy">Premium Economy</option>
                    <option value="Business">Business</option>
                    <option value="First">First</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Class Code</label>
                  <input
                    type="text"
                    value={form.FlightClassCode}
                    onChange={(e) =>
                      setForm({ ...form, FlightClassCode: e.target.value.toUpperCase() })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">AirCraft</label>
                  <input
                    type="text"
                    value={form.AirCraft}
                    onChange={(e) => setForm({ ...form, AirCraft: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F6] border border-[#331700]/15">
                <div>
                  <label className="block font-bold text-[#331700] mb-1">
                    Adult Price (Customer)
                  </label>
                  <input
                    type="number"
                    value={form.AdultPrice}
                    onChange={(e) => setForm({ ...form, AdultPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#331700] mb-1">
                    Child Price (Customer)
                  </label>
                  <input
                    type="number"
                    value={form.ChildPrice}
                    onChange={(e) => setForm({ ...form, ChildPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#331700] mb-1">
                    Infant Price (Customer)
                  </label>
                  <input
                    type="number"
                    value={form.InfantPrice}
                    onChange={(e) => setForm({ ...form, InfantPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-neutral-600 mb-1">
                    Adult Price (Supplier)
                  </label>
                  <input
                    type="number"
                    value={form.AdultPriceSupplier}
                    onChange={(e) =>
                      setForm({ ...form, AdultPriceSupplier: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1">
                    Child Price (Supplier)
                  </label>
                  <input
                    type="number"
                    value={form.ChildPriceSupplier}
                    onChange={(e) =>
                      setForm({ ...form, ChildPriceSupplier: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-600 mb-1">
                    Infant Price (Supplier)
                  </label>
                  <input
                    type="number"
                    value={form.InfantPriceSupplier}
                    onChange={(e) =>
                      setForm({ ...form, InfantPriceSupplier: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#331700] hover:bg-black text-white font-bold transition"
                >
                  Save Segment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
