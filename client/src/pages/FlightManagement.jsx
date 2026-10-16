import React, { useState } from 'react';
import {
  Plus,
  PlaneTakeoff,
  Eye,
  Edit3,
  Trash2,
  X,
  Search,
  Plane,
  CheckCircle2,
  Users
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime, formatShortDate } from '../utils/exporters';

const INITIAL_FLIGHT_FORM = {
  Title: '',
  Category: 'Tourism',
  TripType: 'Round',
  SupplierName: 'Taban Aviation Charter Desk',
  ValidatingCarrier: 'HH',
  ValidatingCarrierName: 'Taban Air (HH-721)',
  isDomestic: false,
  isSOTO: false,
  isEnabled: true,
  PNR_GDS: 'TB8K2M',
  PNR_AIRLINE: 'HH910PK',
  TimeLimit: '2026-12-01T18:00:00',
  TotalSeats: 160,
  AdultPrice: 184000,
  AdultBasicFare: 151000,
  AdultTax: 33000,
  ChildPrice: 148000,
  ChildBasicFare: 120000,
  ChildTax: 28000,
  InfantPrice: 48500,
  InfantBasicFare: 39500,
  InfantTax: 9000,
  SegmentIDs: ['SEG-1001']
};

export default function FlightManagement() {
  const {
    flights,
    segments,
    bookings,
    airlines,
    suppliers,
    createFlight,
    updateFlight,
    deleteFlight,
    addToast
  } = usePortal();

  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FLIGHT_FORM);
  const [segmentSearch, setSegmentSearch] = useState('');
  const [selectedSegToAdd, setSelectedSegToAdd] = useState('');
  const [detailsFlight, setDetailsFlight] = useState(null);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      ...INITIAL_FLIGHT_FORM,
      SegmentIDs: segments[0] ? [segments[0].AirGroupSegmentID] : []
    });
    setShowEditor(true);
  };

  const openEditModal = (flight) => {
    setEditingId(flight.AirGroupID);
    setForm({
      ...INITIAL_FLIGHT_FORM,
      ...flight,
      SegmentIDs: flight.SegmentIDs || (flight.Segments || []).map((s) => s.AirGroupSegmentID)
    });
    setShowEditor(true);
  };

  const handleToggleEnabled = async (flight) => {
    try {
      await updateFlight(flight.AirGroupID, { isEnabled: !flight.isEnabled });
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleAddSegmentToForm = () => {
    const segId = selectedSegToAdd;
    if (!segId) {
      addToast('Please select a segment to add.', 'warning');
      return;
    }
    if ((form.SegmentIDs || []).includes(segId)) {
      addToast('Segment already added to this flight group.', 'warning');
      return;
    }
    setForm((prev) => ({
      ...prev,
      SegmentIDs: [...(prev.SegmentIDs || []), segId]
    }));
  };

  const handleRemoveSegmentFromForm = (segId) => {
    setForm((prev) => ({
      ...prev,
      SegmentIDs: (prev.SegmentIDs || []).filter((id) => id !== segId)
    }));
  };

  const handleSaveFlight = async (e) => {
    e.preventDefault();
    if (!form.Title.trim()) {
      addToast('Please enter a Flight Group Title.', 'error');
      return;
    }
    try {
      if (editingId) {
        await updateFlight(editingId, form);
      } else {
        await createFlight(form);
      }
      setShowEditor(false);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const matchingSegments = segments.filter((s) => {
    const q = segmentSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      s.FlightNumber?.toLowerCase().includes(q) ||
      s.DepartureIata?.toLowerCase().includes(q) ||
      s.ArrivalIata?.toLowerCase().includes(q) ||
      s.DepartureCity?.toLowerCase().includes(q) ||
      s.ArrivalCity?.toLowerCase().includes(q) ||
      s.OperatingAirlineName?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EE8200]">
            Charter & Group Block Inventory
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0A09] mt-0.5">
            Flight Management
          </h1>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold text-xs transition shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Flight</span>
        </button>
      </div>

      {/* Flights Grid */}
      <div className="bg-white rounded-2xl border border-[#EE8200]/15 shadow-executive overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#EE8200] text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3.5 px-3">Enabled</th>
                <th className="py-3.5 px-3">Title & PNR</th>
                <th className="py-3.5 px-3">Category / Trip</th>
                <th className="py-3.5 px-3">Airline</th>
                <th className="py-3.5 px-3">Departure</th>
                <th className="py-3.5 px-3 text-center">Seats (Left / Total)</th>
                <th className="py-3.5 px-3 text-center">Bookings / Pending</th>
                <th className="py-3.5 px-3">Adult / Child / Infant</th>
                <th className="py-3.5 px-3">Supplier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {flights.map((f) => (
                <tr key={f.AirGroupID} className="hover:bg-[#FFF7ED]/60 transition">
                  <td className="py-4 px-3">
                    <button
                      onClick={() => handleToggleEnabled(f)}
                      className={`w-11 h-6 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
                        f.isEnabled ? 'bg-[#EE8200] justify-end' : 'bg-neutral-300 justify-start'
                      }`}
                      title="Toggle Enabled Status"
                    >
                      <span className="w-5 h-5 rounded-full bg-white shadow-xs" />
                    </button>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-sm text-[#0B0A09] max-w-[240px] truncate" title={f.Title}>
                      {f.Title}
                    </div>
                    <div className="text-[11px] font-mono text-[#EE8200] font-semibold">
                      GDS: {f.PNR_GDS} • Air: {f.PNR_AIRLINE}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <span className="px-2 py-0.5 rounded bg-[#FFF7ED] text-[#EE8200] font-bold text-[11px] border border-[#EE8200]/15">
                      {f.Category}
                    </span>
                    <div className="text-[11px] text-neutral-500 mt-1">{f.TripType}</div>
                  </td>
                  <td className="py-4 px-3 font-mono font-bold text-[#EE8200]">
                    {f.Airline}
                    <div className="text-[10px] font-sans font-normal text-neutral-500">
                      {f.ValidatingCarrierName}
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-bold text-[#0B0A09]">{f.GroupDepartureIata}</div>
                    <div className="text-[11px] text-neutral-500">
                      {formatShortDate(f.GroupDepartureDate)}
                    </div>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className="px-2.5 py-1 rounded-lg bg-[#FAFAFA] border border-neutral-200 font-mono font-bold text-[#EE8200]">
                      {f.SeatsLeft} / {f.TotalSeats}
                    </span>
                  </td>
                  <td className="py-4 px-3 text-center">
                    <div className="font-bold text-[#0B0A09]">{f.TotalBookings || 0} Bookings</div>
                    {f.ApprovalPending > 0 && (
                      <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                        {f.ApprovalPending} Pending
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-3 font-mono text-[11px]">
                    <div className="font-bold text-[#EE8200]">
                      ADT: {formatCurrencyPKR(f.AdultPrice)}
                    </div>
                    <div className="text-neutral-600">CNN: {formatCurrencyPKR(f.ChildPrice)}</div>
                    <div className="text-neutral-500">INF: {formatCurrencyPKR(f.InfantPrice)}</div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="font-semibold text-[#0B0A09] max-w-[140px] truncate">
                      {f.SupplierName}
                    </div>
                    <div className="text-[10px] text-neutral-400">{f.Timestamp}</div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setDetailsFlight(f)}
                        className="px-2.5 py-1.5 rounded-lg bg-[#EE8200] text-white font-bold text-[11px] hover:bg-black transition flex items-center gap-1 cursor-pointer"
                        title="View Flight Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Details
                      </button>
                      <button
                        onClick={() => openEditModal(f)}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:border-[#EE8200] text-neutral-700 hover:text-[#EE8200] cursor-pointer"
                        title="Edit Flight"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete flight group "${f.Title}"?`)) {
                            deleteFlight(f.AirGroupID);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-neutral-200 hover:border-red-600 text-neutral-500 hover:text-red-600 cursor-pointer"
                        title="Delete Flight"
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

      {/* ADD / EDIT FLIGHT MODAL */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h5 className="font-bold text-base">
                {editingId ? `Edit Flight — ${editingId}` : 'Add New Flight Group'}
              </h5>
              <button onClick={() => setShowEditor(false)} className="text-white/75 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFlight} className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* General Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#0B0A09] mb-1">Title *</label>
                  <input
                    type="text"
                    value={form.Title}
                    onChange={(e) => setForm({ ...form, Title: e.target.value })}
                    placeholder="e.g., KHI - IKA / MHD - KHI Special Ziyarat Group"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Category</label>
                  <select
                    value={form.Category}
                    onChange={(e) => setForm({ ...form, Category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300"
                  >
                    <option value="Umrah">Umrah</option>
                    <option value="KSA Oneway">KSA Oneway</option>
                    <option value="UAE">UAE</option>
                    <option value="Tourism">Tourism</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Trip Type</label>
                  <select
                    value={form.TripType}
                    onChange={(e) => setForm({ ...form, TripType: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300"
                  >
                    <option value="Round">Round</option>
                    <option value="One Way">One Way</option>
                    <option value="Multi City">Multi City</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Supplier</label>
                  <select
                    value={form.SupplierName}
                    onChange={(e) => setForm({ ...form, SupplierName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300"
                  >
                    {suppliers.map((s) => (
                      <option key={s.SupplierID} value={s.Supplier_Name}>
                        {s.Supplier_Name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Validating Carrier</label>
                  <select
                    value={form.ValidatingCarrier}
                    onChange={(e) => {
                      const code = e.target.value;
                      const found = airlines.find((a) => a.AirlineCode === code);
                      setForm({
                        ...form,
                        Airline: code,
                        ValidatingCarrier: code,
                        ValidatingCarrierName: found
                          ? `${found.AirlineName} (${found.AirlineCode})`
                          : code
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300"
                  >
                    {airlines.map((a) => (
                      <option key={a.AirlineCode} value={a.AirlineCode}>
                        {a.AirlineCode} — {a.AirlineName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Total Seats</label>
                  <input
                    type="number"
                    value={form.TotalSeats}
                    onChange={(e) => setForm({ ...form, TotalSeats: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">PNR GDS</label>
                  <input
                    type="text"
                    value={form.PNR_GDS}
                    onChange={(e) => setForm({ ...form, PNR_GDS: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">PNR Airline</label>
                  <input
                    type="text"
                    value={form.PNR_AIRLINE}
                    onChange={(e) => setForm({ ...form, PNR_AIRLINE: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Time Limit</label>
                  <input
                    type="datetime-local"
                    value={form.TimeLimit?.slice(0, 16) || ''}
                    onChange={(e) => setForm({ ...form, TimeLimit: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">Sector Type</label>
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!form.isDomestic}
                        onChange={() => setForm({ ...form, isDomestic: false })}
                      />
                      <span>International</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={Boolean(form.isDomestic)}
                        onChange={() => setForm({ ...form, isDomestic: true })}
                      />
                      <span>Domestic</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#0B0A09] mb-1">SOTO</label>
                  <div className="flex items-center gap-3 py-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={Boolean(form.isSOTO)}
                        onChange={() => setForm({ ...form, isSOTO: true })}
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={!form.isSOTO}
                        onChange={() => setForm({ ...form, isSOTO: false })}
                      />
                      <span>No</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Group Pricing Breakdown */}
              <div className="p-4 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15">
                <h6 className="font-display font-bold text-xs uppercase tracking-wider text-[#EE8200] mb-3">
                  Group Passenger Pricing (PKR)
                </h6>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-1">Adult Basic Fare</label>
                    <input
                      type="number"
                      value={form.AdultBasicFare}
                      onChange={(e) => {
                        const basic = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          AdultBasicFare: basic,
                          AdultPrice: basic + (Number(form.AdultTax) || 0)
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Adult Tax</label>
                    <input
                      type="number"
                      value={form.AdultTax}
                      onChange={(e) => {
                        const tax = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          AdultTax: tax,
                          AdultPrice: (Number(form.AdultBasicFare) || 0) + tax
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#EE8200] mb-1">Adult Total Price</label>
                    <input
                      type="number"
                      value={form.AdultPrice}
                      onChange={(e) => setForm({ ...form, AdultPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EE8200] bg-white font-mono font-bold text-[#EE8200]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Child Basic Fare</label>
                    <input
                      type="number"
                      value={form.ChildBasicFare}
                      onChange={(e) => {
                        const basic = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          ChildBasicFare: basic,
                          ChildPrice: basic + (Number(form.ChildTax) || 0)
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Child Tax</label>
                    <input
                      type="number"
                      value={form.ChildTax}
                      onChange={(e) => {
                        const tax = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          ChildTax: tax,
                          ChildPrice: (Number(form.ChildBasicFare) || 0) + tax
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#EE8200] mb-1">Child Price</label>
                    <input
                      type="number"
                      value={form.ChildPrice}
                      onChange={(e) => setForm({ ...form, ChildPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EE8200] bg-white font-mono font-bold text-[#EE8200]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Infant Basic Fare</label>
                    <input
                      type="number"
                      value={form.InfantBasicFare}
                      onChange={(e) => {
                        const basic = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          InfantBasicFare: basic,
                          InfantPrice: basic + (Number(form.InfantTax) || 0)
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Infant Tax</label>
                    <input
                      type="number"
                      value={form.InfantTax}
                      onChange={(e) => {
                        const tax = Number(e.target.value) || 0;
                        setForm({
                          ...form,
                          InfantTax: tax,
                          InfantPrice: (Number(form.InfantBasicFare) || 0) + tax
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-neutral-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#EE8200] mb-1">Infant Price</label>
                    <input
                      type="number"
                      value={form.InfantPrice}
                      onChange={(e) => setForm({ ...form, InfantPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-[#EE8200] bg-white font-mono font-bold text-[#EE8200]"
                    />
                  </div>
                </div>
              </div>

              {/* Flight Segments Builder */}
              <div className="p-4 rounded-xl bg-white border border-[#EE8200]/20 space-y-3">
                <h6 className="font-display font-bold text-xs uppercase tracking-wider text-[#EE8200]">
                  Flight Segments
                </h6>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                  <div className="flex-1">
                    <label className="block font-bold text-[#0B0A09] mb-1">
                      Search Segment (Type flight number, airport, airline...)
                    </label>
                    <select
                      value={selectedSegToAdd}
                      onChange={(e) => setSelectedSegToAdd(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAFAFA]"
                    >
                      <option value="">-- Select Flight Segment to Attach --</option>
                      {matchingSegments.map((s) => (
                        <option key={s.AirGroupSegmentID} value={s.AirGroupSegmentID}>
                          {s.FlightNumber} | {s.DepartureIata} &rarr; {s.ArrivalIata} (
                          {formatDateTime(s.DepartureDate)}) — {s.OperatingAirlineName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSegmentToForm}
                    className="px-4 py-2.5 rounded-xl bg-[#EE8200] text-white font-bold hover:bg-black transition"
                  >
                    Add Segment
                  </button>
                </div>

                {/* Added Segments List */}
                <div className="mt-3">
                  <div className="text-[11px] font-bold text-neutral-600 mb-2">
                    Added Segments ({(form.SegmentIDs || []).length})
                  </div>
                  <div className="space-y-2">
                    {(form.SegmentIDs || []).map((segId) => {
                      const seg = segments.find((s) => s.AirGroupSegmentID === segId);
                      if (!seg) return null;
                      return (
                        <div
                          key={segId}
                          className="p-3 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/15 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2 py-1 rounded bg-[#EE8200] text-white font-mono font-bold">
                              {seg.FlightNumber}
                            </span>
                            <div>
                              <div className="font-bold text-[#0B0A09]">
                                {seg.DepartureCity} ({seg.DepartureIata}) &rarr; {seg.ArrivalCity} (
                                {seg.ArrivalIata})
                              </div>
                              <div className="text-[11px] text-neutral-500">
                                Dep: {formatDateTime(seg.DepartureDate)} • Class: {seg.FlightClass} (
                                {seg.FlightClassCode})
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSegmentFromForm(segId)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowEditor(false)}
                  className="px-5 py-2.5 rounded-xl border border-neutral-300 font-bold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold transition"
                >
                  Save Flight
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FLIGHT DETAILS MODAL (Matches Flight Details modal with Summary, Flight Segments, and Flight Bookings) */}
      {detailsFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h5 className="font-bold text-base">Flight Details — {detailsFlight.Title}</h5>
              <button
                onClick={() => setDetailsFlight(null)}
                className="text-white/75 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Overview Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/15">
                <div>
                  <span className="text-neutral-500 block">Category</span>
                  <strong className="text-sm text-[#0B0A09]">{detailsFlight.Category}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Trip Type</span>
                  <strong className="text-sm text-[#0B0A09]">{detailsFlight.TripType}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Airline</span>
                  <strong className="text-sm text-[#EE8200]">{detailsFlight.Airline}</strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Total Seats / Left</span>
                  <strong className="text-sm font-mono">
                    {detailsFlight.TotalSeats} / {detailsFlight.SeatsLeft}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-500 block">Adult Price</span>
                  <strong className="text-sm font-mono text-[#EE8200]">
                    {formatCurrencyPKR(detailsFlight.AdultPrice)}
                  </strong>
                </div>
              </div>

              {/* Attached Segments */}
              <div>
                <h6 className="font-display font-bold text-sm text-[#EE8200] mb-3">
                  Flight Segments ({(detailsFlight.Segments || []).length})
                </h6>
                <div className="space-y-2.5">
                  {(detailsFlight.Segments || []).map((seg) => (
                    <div
                      key={seg.AirGroupSegmentID}
                      className="p-4 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/15 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-sm text-[#EE8200]">
                          {seg.DepartureCity} ({seg.DepartureIata})
                        </div>
                        <div className="text-neutral-600">{formatDateTime(seg.DepartureDate)}</div>
                      </div>
                      <div className="text-center">
                        <span className="px-2.5 py-1 rounded bg-[#EE8200] text-white font-mono font-bold">
                          {seg.FlightNumber}
                        </span>
                        <div className="text-[11px] text-neutral-500 mt-1">
                          {seg.AirCraft} • Class {seg.FlightClassCode}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-[#0B0A09]">
                          {seg.ArrivalCity} ({seg.ArrivalIata})
                        </div>
                        <div className="text-neutral-600">{formatDateTime(seg.ArrivalDate)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Associated Flight Bookings */}
              <div>
                <h6 className="font-display font-bold text-sm text-[#EE8200] mb-3">
                  Flight Bookings for this Group (
                  {bookings.filter((b) => b.AirGroupID === detailsFlight.AirGroupID).length})
                </h6>
                <div className="border border-neutral-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-700 font-bold">
                        <th className="py-2.5 px-3">Booking ID</th>
                        <th className="py-2.5 px-3">PNR</th>
                        <th className="py-2.5 px-3">Sub Agent</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Passengers</th>
                        <th className="py-2.5 px-3">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {bookings
                        .filter((b) => b.AirGroupID === detailsFlight.AirGroupID)
                        .map((b) => (
                          <tr key={b.AirGroupBookingID}>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {b.AirGroupBookingID}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#EE8200] font-bold">
                              {b.PNR}
                            </td>
                            <td className="py-2.5 px-3 font-semibold">{b.SubCompanyName}</td>
                            <td className="py-2.5 px-3">{b.ApprovalStatus}</td>
                            <td className="py-2.5 px-3">{(b.Passengers || []).length} Pax</td>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              {formatCurrencyPKR(b.TotalPrice)}
                            </td>
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
    </div>
  );
}
