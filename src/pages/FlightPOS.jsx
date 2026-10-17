import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowLeftRight,
  Calendar,
  Plus,
  Minus,
  Tag,
  Plane,
  Sparkles,
  Upload,
  CheckCircle2,
  Clock,
  Luggage,
  Utensils,
  Users,
  Calculator,
  X
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime, formatShortDate } from '../utils/exporters';

export default function FlightPOS() {
  const { segments, subAgents, airports, createBooking, addToast } = usePortal();
  const navigate = useNavigate();

  // Search Widget State (matching reference screenshots)
  const [tripType, setTripType] = useState('One Way'); // 'Round Trip' | 'One Way' | 'Multi City'
  const [fromIata, setFromIata] = useState('ALL');
  const [toIata, setToIata] = useState('ALL');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);

  const [cabinClass, setCabinClass] = useState('All'); // 'All' | 'Economy' | 'Business' | 'First'
  const [selectedAgentId, setSelectedAgentId] = useState('DIRECT');
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  // Selected Segment IDs (1 for One Way, up to 2 for Round Trip, multiple for Multi City)
  const [selectedSegmentIds, setSelectedSegmentIds] = useState([]);

  // Passenger & Contact State
  const [passengers, setPassengers] = useState([]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-select first sub-agent if available, otherwise keep DIRECT
  useEffect(() => {
    if (selectedAgentId === 'DIRECT' && subAgents.length > 0) {
      setSelectedAgentId(subAgents[0].SubCompanyID);
    }
  }, [subAgents, selectedAgentId]);

  const selectedAgent = useMemo(
    () => subAgents.find((a) => a.SubCompanyID === selectedAgentId) || null,
    [subAgents, selectedAgentId]
  );

  // Build airport options combining standard airports + any custom airport codes used in segments
  const airportOptions = useMemo(() => {
    const map = new Map();
    (airports || []).forEach((a) => {
      map.set(a.AirportCode, {
        code: a.AirportCode,
        name: a.AirportName,
        city: a.CityName,
        country: a.CountryName
      });
    });
    (segments || []).forEach((s) => {
      if (s.DepartureIata && !map.has(s.DepartureIata)) {
        map.set(s.DepartureIata, {
          code: s.DepartureIata,
          name: s.DepartureAirport || s.DepartureCity || s.DepartureIata,
          city: s.DepartureCity || s.DepartureIata,
          country: s.DepartureCountry || ''
        });
      }
      if (s.ArrivalIata && !map.has(s.ArrivalIata)) {
        map.set(s.ArrivalIata, {
          code: s.ArrivalIata,
          name: s.ArrivalAirport || s.ArrivalCity || s.ArrivalIata,
          city: s.ArrivalCity || s.ArrivalIata,
          country: s.ArrivalCountry || ''
        });
      }
    });
    return Array.from(map.values());
  }, [airports, segments]);

  const fromAirportObj = useMemo(
    () => airportOptions.find((a) => a.code === fromIata) || null,
    [airportOptions, fromIata]
  );

  const toAirportObj = useMemo(
    () => airportOptions.find((a) => a.code === toIata) || null,
    [airportOptions, toIata]
  );

  const handleSwapAirports = () => {
    setFromIata(toIata);
    setToIata(fromIata);
  };

  // Filter segments directly from Segment Management
  const matchingSegments = useMemo(() => {
    return (segments || []).filter((seg) => {
      // Cabin filter
      if (
        cabinClass !== 'All' &&
        (seg.FlightClass || 'Economy').toLowerCase() !== cabinClass.toLowerCase()
      ) {
        return false;
      }

      if (tripType === 'Multi City') {
        // In Multi City mode, show all matching date/cabin or route segments
        if (fromIata !== 'ALL' && seg.DepartureIata !== fromIata) return false;
        if (toIata !== 'ALL' && seg.ArrivalIata !== toIata) return false;
        if (departDate && !(seg.DepartureDate || '').startsWith(departDate)) return false;
        return true;
      }

      if (tripType === 'Round Trip') {
        // Outbound matches From -> To; Return matches To -> From
        const isOutbound =
          (fromIata === 'ALL' || seg.DepartureIata === fromIata) &&
          (toIata === 'ALL' || seg.ArrivalIata === toIata) &&
          (!departDate || (seg.DepartureDate || '').startsWith(departDate));

        const isReturn =
          fromIata !== 'ALL' &&
          toIata !== 'ALL' &&
          seg.DepartureIata === toIata &&
          seg.ArrivalIata === fromIata &&
          (!returnDate || (seg.DepartureDate || '').startsWith(returnDate));

        return isOutbound || isReturn;
      }

      // One Way
      if (fromIata !== 'ALL' && seg.DepartureIata !== fromIata) return false;
      if (toIata !== 'ALL' && seg.ArrivalIata !== toIata) return false;
      if (departDate && !(seg.DepartureDate || '').startsWith(departDate)) return false;
      return true;
    });
  }, [segments, fromIata, toIata, departDate, returnDate, cabinClass, tripType]);

  const selectedSegments = useMemo(
    () =>
      selectedSegmentIds
        .map((id) => (segments || []).find((s) => s.AirGroupSegmentID === id))
        .filter(Boolean),
    [selectedSegmentIds, segments]
  );

  // Sync passenger rows automatically whenever selected segments or passenger counts change
  const buildPassengerRows = (autoFillNTBA = false) => {
    const list = [];
    for (let i = 0; i < Number(adultsCount); i++) {
      list.push({
        id: `ADT-${i + 1}`,
        PassengerType: 'Adult',
        Title: 'MR',
        FirstName: autoFillNTBA ? 'NTBA' : '',
        LastName: autoFillNTBA ? `PAX${i + 1}` : '',
        Gender: 'Male',
        Nationality: 'PAK',
        DOB: '1990-01-01',
        PassportNumber: autoFillNTBA ? `NTBA00${i + 1}` : '',
        PassportIssueDate: '2024-01-01',
        PassportExpiryDate: '2030-01-01',
        PassportImageName: '',
        PassportFileData: ''
      });
    }
    for (let i = 0; i < Number(childrenCount); i++) {
      list.push({
        id: `CNN-${i + 1}`,
        PassengerType: 'Child',
        Title: 'MSTR',
        FirstName: autoFillNTBA ? 'NTBA' : '',
        LastName: autoFillNTBA ? `CHILD${i + 1}` : '',
        Gender: 'Male',
        Nationality: 'PAK',
        DOB: '2018-01-01',
        PassportNumber: autoFillNTBA ? `NTBAC0${i + 1}` : '',
        PassportIssueDate: '2024-01-01',
        PassportExpiryDate: '2030-01-01',
        PassportImageName: '',
        PassportFileData: ''
      });
    }
    for (let i = 0; i < Number(infantsCount); i++) {
      list.push({
        id: `INF-${i + 1}`,
        PassengerType: 'Infant',
        Title: 'MISS',
        FirstName: autoFillNTBA ? 'NTBA' : '',
        LastName: autoFillNTBA ? `INFANT${i + 1}` : '',
        Gender: 'Female',
        Nationality: 'PAK',
        DOB: '2025-01-01',
        PassportNumber: autoFillNTBA ? `NTBAI0${i + 1}` : '',
        PassportIssueDate: '2025-01-01',
        PassportExpiryDate: '2030-01-01',
        PassportImageName: '',
        PassportFileData: ''
      });
    }
    setPassengers(list);
    if (selectedAgent) {
      if (!email) setEmail(selectedAgent.Email || '');
      if (!mobile) setMobile(selectedAgent.MobileNumber || '');
    }
  };

  const handleToggleSelectSegment = (seg) => {
    const segId = seg.AirGroupSegmentID;
    const seatOccupying = Number(adultsCount) + Number(childrenCount);
    const avail = Number(seg.SeatsLeft ?? seg.TotalSeats) || 0;

    if (!selectedSegmentIds.includes(segId) && seatOccupying > avail) {
      addToast(`Only ${avail} seats left on ${seg.FlightNumber}.`, 'error');
      return;
    }

    setSelectedSegmentIds((prev) => {
      let next;
      if (prev.includes(segId)) {
        next = prev.filter((id) => id !== segId);
      } else if (tripType === 'One Way') {
        next = [segId];
      } else if (tripType === 'Round Trip') {
        next = prev.length >= 2 ? [prev[1], segId] : [...prev, segId];
      } else {
        next = [...prev, segId];
      }
      return next;
    });

    if (passengers.length === 0) {
      buildPassengerRows(false);
    }
  };

  // Keep passenger rows in sync with count steppers when a segment is already selected
  useEffect(() => {
    if (selectedSegmentIds.length > 0) {
      buildPassengerRows(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adultsCount, childrenCount, infantsCount]);

  const handleSearchClick = (e) => {
    if (e) e.preventDefault();
    if (matchingSegments.length === 0) {
      addToast('No flight segments matched your filter. Try "All Cities" or clear the date.', 'warning');
    } else {
      addToast(`Found ${matchingSegments.length} available flight segment(s).`, 'success');
    }
  };

  const handleResetFilters = () => {
    setFromIata('ALL');
    setToIata('ALL');
    setDepartDate('');
    setReturnDate('');
    setCabinClass('All');
  };

  const updatePassengerField = (idx, field, val) => {
    setPassengers((prev) => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: val };
      if (field === 'Title') {
        if (val === 'MRS' || val === 'MISS') updated.Gender = 'Female';
        if (val === 'MR' || val === 'MSTR') updated.Gender = 'Male';
      }
      next[idx] = updated;
      return next;
    });
  };

  const handlePassportUpload = (idx, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPassengers((prev) => {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          PassportImageName: file.name,
          PassportFileData: String(reader.result || '')
        };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Calculate live fare across all selected segments
  const fareBreakdown = useMemo(() => {
    const adt = Number(adultsCount) || 0;
    const cnn = Number(childrenCount) || 0;
    const inf = Number(infantsCount) || 0;

    let adtUnit = 0;
    let cnnUnit = 0;
    let infUnit = 0;

    selectedSegments.forEach((seg) => {
      adtUnit += Number(seg.AdultPrice) || 0;
      cnnUnit += Number(seg.ChildPrice) || 0;
      infUnit += Number(seg.InfantPrice) || 0;
    });

    const adtTotal = adt * adtUnit;
    const cnnTotal = cnn * cnnUnit;
    const infTotal = inf * infUnit;

    return {
      adt,
      cnn,
      inf,
      adtUnit,
      cnnUnit,
      infUnit,
      adtTotal,
      cnnTotal,
      infTotal,
      grandTotal: adtTotal + cnnTotal + infTotal
    };
  }, [selectedSegments, adultsCount, childrenCount, infantsCount]);

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (selectedSegments.length === 0) {
      addToast('Please select a flight segment from the search results first.', 'error');
      return;
    }
    if (passengers.length === 0) {
      addToast('Please add at least 1 passenger.', 'error');
      return;
    }
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.FirstName.trim() || !p.LastName.trim() || !p.PassportNumber.trim()) {
        addToast(
          `Passenger #${i + 1}: Please enter First Name, Last Name & Passport Number (or click Fill NTBA).`,
          'error'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createBooking({
        SegmentIDs: selectedSegments.map((s) => s.AirGroupSegmentID),
        TripType: tripType,
        SubCompanyID: selectedAgentId || 'DIRECT',
        EmailAddress: email || selectedAgent?.Email || 'bookings@bookly.com',
        MobileNumber: mobile || selectedAgent?.MobileNumber || '',
        Remarks: promoCode ? `${remarks ? remarks + ' | ' : ''}Promo: ${promoCode}` : remarks,
        Passengers: passengers,
        BookingChannelName: 'Bookly POS Search'
      });
      navigate('/FlightBookings');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HERO SEARCH BANNER (Inspired by Reference Screenshot 1 & 2 in Bookly #EE8200 / #0B0A09 / #FFFFFF Theme) */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0B0A09] via-[#141210] to-[#0B0A09] p-5 sm:p-8 lg:p-10 shadow-2xl border border-[#EE8200]/25 relative overflow-hidden">
        {/* Decorative subtle pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(#EE8200 1.5px, transparent 1.5px)',
            backgroundSize: '28px 28px'
          }}
        />

        {/* Top Trip Type Pills (Round Trip | One Way | Multi City) */}
        <div className="relative z-10 flex flex-col items-center text-center mb-6">
          <div className="inline-flex items-center p-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-xs">
            {['Round Trip', 'One Way', 'Multi City'].map((t) => {
              const active = tripType === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTripType(t);
                    if (t === 'One Way' && selectedSegmentIds.length > 1) {
                      setSelectedSegmentIds([selectedSegmentIds[0]]);
                    }
                  }}
                  className={`px-5 sm:px-7 py-2 rounded-full text-xs sm:text-sm font-bold transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#EE8200] shadow-md'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="text-xs sm:text-sm text-white/75 mt-3 font-medium">
            Search & book directly from your Flight Segments — no separate Flight Group setup required
          </p>
        </div>

        {/* MAIN WHITE SEARCH CARD */}
        <form
          onSubmit={handleSearchClick}
          className="relative z-10 bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-neutral-100 max-w-5xl mx-auto space-y-5 text-[#0B0A09]"
        >
          {/* ROW 1: FROM & TO AIRPORT BOXES WITH CENTER SWAP BUTTON */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            {/* FROM BOX */}
            <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 hover:border-[#EE8200] bg-[#FAFAFA]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  FROM (DEPARTURE)
                </span>
                <span className="text-[11px] font-semibold text-[#EE8200]">Origin Sector</span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#EE8200] tracking-tight">
                  {fromIata === 'ALL' ? 'ANY' : fromIata}
                </span>
                <select
                  value={fromIata}
                  onChange={(e) => setFromIata(e.target.value)}
                  className="flex-1 bg-transparent font-bold text-sm text-[#0B0A09] focus:outline-none cursor-pointer border-b border-dashed border-neutral-300 pb-1"
                >
                  <option value="ALL">All Departure Cities (Show All)</option>
                  {airportOptions.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-neutral-500 mt-1.5 truncate">
                {fromAirportObj
                  ? `${fromAirportObj.name} • ${fromAirportObj.city}`
                  : 'Searching across all departure airports'}
              </div>
            </div>

            {/* SWAP BUTTON IN CENTER */}
            <button
              type="button"
              onClick={handleSwapAirports}
              title="Swap From & To Airports"
              className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border-2 border-neutral-200 hover:border-[#EE8200] text-[#EE8200] hover:bg-[#EE8200] hover:text-white items-center justify-center shadow-md transition cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            {/* TO BOX */}
            <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 hover:border-[#EE8200] bg-[#FAFAFA]/60 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                  TO (ARRIVAL)
                </span>
                <span className="text-[11px] font-semibold text-[#EE8200]">Destination Sector</span>
              </div>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-[#EE8200] tracking-tight">
                  {toIata === 'ALL' ? 'ANY' : toIata}
                </span>
                <select
                  value={toIata}
                  onChange={(e) => setToIata(e.target.value)}
                  className="flex-1 bg-transparent font-bold text-sm text-[#0B0A09] focus:outline-none cursor-pointer border-b border-dashed border-neutral-300 pb-1"
                >
                  <option value="ALL">All Arrival Cities (Show All)</option>
                  {airportOptions.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} — {a.city} ({a.name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-xs text-neutral-500 mt-1.5 truncate">
                {toAirportObj
                  ? `${toAirportObj.name} • ${toAirportObj.city}`
                  : 'Searching across all arrival airports'}
              </div>
            </div>
          </div>

          {/* ROW 2: DEPART DATE & RETURN DATE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="px-4 py-3 rounded-2xl border border-neutral-200 hover:border-[#EE8200] flex items-center justify-between bg-white transition">
              <div className="flex items-center gap-3 flex-1">
                <Calendar className="w-5 h-5 text-[#EE8200] shrink-0" />
                <div className="flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Depart Date {departDate ? '' : '(Any Date)'}
                  </div>
                  <input
                    type="date"
                    value={departDate}
                    onChange={(e) => setDepartDate(e.target.value)}
                    className="w-full text-sm font-bold text-[#0B0A09] focus:outline-none bg-transparent cursor-pointer"
                  />
                </div>
              </div>
              {departDate && (
                <button
                  type="button"
                  onClick={() => setDepartDate('')}
                  className="text-[11px] font-bold text-neutral-400 hover:text-red-600 px-2 py-1"
                  title="Clear Date Filter"
                >
                  Clear
                </button>
              )}
            </div>

            <div
              className={`px-4 py-3 rounded-2xl border flex items-center justify-between transition ${
                tripType === 'Round Trip'
                  ? 'border-neutral-200 hover:border-[#EE8200] bg-white'
                  : 'border-neutral-100 bg-neutral-50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <Calendar className="w-5 h-5 text-[#EE8200] shrink-0" />
                <div className="flex-1">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Return Date {tripType !== 'Round Trip' && '(Round Trip Only)'}
                  </div>
                  <input
                    type="date"
                    disabled={tripType !== 'Round Trip'}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full text-sm font-bold text-[#0B0A09] focus:outline-none bg-transparent disabled:cursor-not-allowed"
                  />
                </div>
              </div>
              {returnDate && tripType === 'Round Trip' && (
                <button
                  type="button"
                  onClick={() => setReturnDate('')}
                  className="text-[11px] font-bold text-neutral-400 hover:text-red-600 px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* ROW 3: PASSENGERS STEPPER BOX & CABIN CLASS + SUB-AGENT BOX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* PASSENGERS BOX */}
            <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white space-y-3">
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                PASSENGERS
              </div>

              {/* Adults */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#0B0A09]">Adults</div>
                  <div className="text-[11px] text-neutral-400">Age 12+</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAdultsCount((c) => Math.max(1, c - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-200 hover:border-[#EE8200] text-neutral-600 hover:text-[#EE8200] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono font-extrabold text-sm text-[#0B0A09]">
                    {adultsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdultsCount((c) => c + 1)}
                    className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#EE8200]/30 hover:bg-[#EE8200] text-[#EE8200] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Children */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#0B0A09]">Children</div>
                  <div className="text-[11px] text-neutral-400">Age 2–11</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setChildrenCount((c) => Math.max(0, c - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-200 hover:border-[#EE8200] text-neutral-600 hover:text-[#EE8200] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono font-extrabold text-sm text-[#0B0A09]">
                    {childrenCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChildrenCount((c) => c + 1)}
                    className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#EE8200]/30 hover:bg-[#EE8200] text-[#EE8200] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Infants */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-[#0B0A09]">Infants</div>
                  <div className="text-[11px] text-neutral-400">Under 2</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setInfantsCount((c) => Math.max(0, c - 1))}
                    className="w-8 h-8 rounded-full border border-neutral-200 hover:border-[#EE8200] text-neutral-600 hover:text-[#EE8200] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono font-extrabold text-sm text-[#0B0A09]">
                    {infantsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInfantsCount((c) => c + 1)}
                    className="w-8 h-8 rounded-full bg-[#FFF7ED] border border-[#EE8200]/30 hover:bg-[#EE8200] text-[#EE8200] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* CABIN CLASS & SUB-AGENT BOX */}
            <div className="p-4 sm:p-5 rounded-2xl border border-neutral-200 bg-white flex flex-col justify-between space-y-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  CABIN CLASS
                </div>
                <div className="space-y-1.5">
                  {['All', 'Economy', 'Business', 'First'].map((cls) => {
                    const active = cabinClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setCabinClass(cls)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          active
                            ? 'bg-[#EE8200] text-white shadow-sm'
                            : 'text-[#0B0A09] hover:bg-[#FFF7ED]'
                        }`}
                      >
                        <span>{cls === 'All' ? 'All Cabin Classes' : cls}</span>
                        {active && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-1">
                  BOOKING AGENCY / SUB-AGENT
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => {
                    setSelectedAgentId(e.target.value);
                    const ag = subAgents.find((a) => a.SubCompanyID === e.target.value);
                    if (ag) {
                      setEmail(ag.Email || '');
                      setMobile(ag.MobileNumber || '');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-[#FAFAFA] text-xs font-bold text-[#0B0A09] focus:border-[#EE8200] focus:outline-none"
                >
                  <option value="DIRECT">Bookly Direct Desk (Walk-In / Admin)</option>
                  {subAgents.map((a) => (
                    <option key={a.SubCompanyID} value={a.SubCompanyID}>
                      {a.CompanyName} ({a.City}) — Bal: {formatCurrencyPKR(a.CreditLimitBalance)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* PROMO CODE TOGGLE */}
          <div>
            <button
              type="button"
              onClick={() => setShowPromo((p) => !p)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#EE8200] hover:text-[#0B0A09] transition cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Have a promo code?</span>
            </button>
            {showPromo && (
              <div className="mt-2 max-w-xs">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter Promo / Deal Code"
                  className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 text-xs font-mono font-bold focus:border-[#EE8200] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* FULL-WIDTH SEARCH FLIGHTS BUTTON */}
          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#EE8200] hover:bg-[#0B0A09] text-white font-display font-extrabold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Search Flights ({matchingSegments.length} Available)</span>
          </button>
        </form>
      </div>

      {/* FLIGHT SEGMENT SEARCH RESULTS */}
      <div className="bg-white rounded-2xl border border-[#EE8200]/20 shadow-executive overflow-hidden">
        <div className="bg-[#0B0A09] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Plane className="w-5 h-5 text-[#EE8200]" />
            <div>
              <h3 className="font-display font-bold text-sm uppercase tracking-wider">
                Available Flight Segments ({matchingSegments.length})
              </h3>
              <p className="text-[11px] text-white/65">
                {tripType === 'One Way'
                  ? 'Click "Select Flight" on any segment below to open the passenger booking form'
                  : tripType === 'Round Trip'
                  ? 'Select up to 2 segments (Outbound + Return) to combine into a single Round Trip PNR'
                  : 'Select multiple segments to combine into a Multi-City PNR'}
              </p>
            </div>
          </div>

          {(fromIata !== 'ALL' || toIata !== 'ALL' || departDate || cabinClass !== 'All') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-1.5 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-white hover:text-[#0B0A09] transition cursor-pointer"
            >
              Show All Segments ({segments.length})
            </button>
          )}
        </div>

        <div className="p-5 space-y-3">
          {segments.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="text-sm font-bold text-neutral-700">
                No flight segments have been created yet.
              </div>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Add a flight segment in <b>Segment Management</b> and it will immediately appear here for search and instant POS booking.
              </p>
              <button
                type="button"
                onClick={() => navigate('/SegmentManagement')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Go to Segment Management</span>
              </button>
            </div>
          ) : matchingSegments.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="text-sm font-bold text-neutral-700">
                No segments matched your current filter ({fromIata} &rarr; {toIata}
                {departDate ? ` on ${departDate}` : ''}).
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EE8200] text-white text-xs font-bold hover:bg-black transition cursor-pointer"
              >
                <span>Show All {segments.length} Available Segment(s)</span>
              </button>
            </div>
          ) : (
            matchingSegments.map((seg) => {
              const isSelected = selectedSegmentIds.includes(seg.AirGroupSegmentID);
              const seatsLeft = Number(seg.SeatsLeft ?? seg.TotalSeats) || 0;
              const estTotalForSeg =
                Number(adultsCount) * (Number(seg.AdultPrice) || 0) +
                Number(childrenCount) * (Number(seg.ChildPrice) || 0) +
                Number(infantsCount) * (Number(seg.InfantPrice) || 0);

              return (
                <div
                  key={seg.AirGroupSegmentID}
                  onClick={() => handleToggleSelectSegment(seg)}
                  className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isSelected
                      ? 'border-[#EE8200] bg-[#FFF7ED] shadow-md'
                      : 'border-neutral-200 hover:border-[#EE8200]/60 bg-white'
                  }`}
                >
                  {/* Airline & Flight Badge */}
                  <div className="flex items-center gap-3.5 min-w-[180px]">
                    <div
                      className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-mono font-extrabold text-xs shrink-0 ${
                        isSelected ? 'bg-[#EE8200] text-white' : 'bg-[#0B0A09] text-white'
                      }`}
                    >
                      <span>{seg.OperatingAirline || seg.MarketingAirline || 'FL'}</span>
                      <span className="text-[10px] text-[#EE8200] bg-white px-1 rounded mt-0.5">
                        {seg.FlightClassCode || 'Y'}
                      </span>
                    </div>
                    <div>
                      <div className="font-mono font-extrabold text-base text-[#0B0A09] flex items-center gap-2">
                        <span>{seg.FlightNumber}</span>
                        <span className="text-[11px] font-sans px-2 py-0.5 rounded-full bg-[#EE8200]/15 text-[#EE8200] font-bold">
                          {seg.FlightClass || 'Economy'}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 font-medium">
                        {seg.OperatingAirlineName || 'Scheduled Carrier'} • {seg.AirCraft || 'Jet'}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-600">
                        <span className="inline-flex items-center gap-1">
                          <Luggage className="w-3.5 h-3.5 text-[#EE8200]" />
                          {seg.BaggageCountADT || '1 PC (30 KG)'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5 text-[#EE8200]" />
                          Meal: {seg.Meal || 'Yes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route & Schedule Timeline */}
                  <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-8 flex-1 border-y lg:border-y-0 border-neutral-100 py-3 lg:py-0">
                    <div className="text-left">
                      <div className="font-display font-extrabold text-2xl text-[#0B0A09]">
                        {seg.DepartureIata}
                      </div>
                      <div className="text-xs font-bold text-neutral-700">{seg.DepartureCity}</div>
                      <div className="text-[11px] font-mono text-[#EE8200] font-semibold mt-0.5">
                        {formatDateTime(seg.DepartureDate)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-[10px] font-mono font-bold text-neutral-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#EE8200]" />
                        {seg.FlightTime || 'Direct'}
                      </span>
                      <div className="w-24 sm:w-32 h-0.5 bg-[#EE8200] my-1.5 relative">
                        <Plane className="w-3.5 h-3.5 text-[#EE8200] absolute -top-1.5 right-0" />
                      </div>
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700">
                        {seatsLeft} Seats Left
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-display font-extrabold text-2xl text-[#0B0A09]">
                        {seg.ArrivalIata}
                      </div>
                      <div className="text-xs font-bold text-neutral-700">{seg.ArrivalCity}</div>
                      <div className="text-[11px] font-mono text-neutral-600 font-semibold mt-0.5">
                        {formatDateTime(seg.ArrivalDate)}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Select Button */}
                  <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-2 min-w-[200px]">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-neutral-500 font-medium">
                        Adult Fare: <b className="font-mono text-[#0B0A09]">{formatCurrencyPKR(seg.AdultPrice)}</b>
                      </div>
                      <div className="font-mono font-extrabold text-lg text-[#EE8200]">
                        {formatCurrencyPKR(estTotalForSeg)}
                      </div>
                      <div className="text-[10px] text-neutral-500">
                        Total for {adultsCount} ADT, {childrenCount} CNN, {infantsCount} INF
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectSegment(seg);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#0B0A09] text-white shadow-sm'
                          : 'bg-[#EE8200] hover:bg-[#0B0A09] text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#EE8200]" />
                          <span>Selected for Booking</span>
                        </>
                      ) : (
                        <span>Select Flight</span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PASSENGER MANIFEST & INSTANT BOOKING SECTION (Opens as soon as a segment is selected) */}
      {selectedSegments.length > 0 && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white rounded-2xl border-2 border-[#EE8200] shadow-2xl overflow-hidden"
        >
          <div className="bg-[#EE8200] text-white px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-extrabold text-base uppercase tracking-wider flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>
                  Passenger Manifest & Instant Booking ({passengers.length} Passenger
                  {passengers.length > 1 ? 's' : ''})
                </span>
              </h3>
              <p className="text-xs text-white/90 mt-0.5">
                Selected Sector(s):{' '}
                {selectedSegments
                  .map((s) => `${s.FlightNumber} (${s.DepartureIata} → ${s.ArrivalIata} on ${formatShortDate(s.DepartureDate)})`)
                  .join('  +  ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => buildPassengerRows(true)}
                className="px-4 py-2 rounded-xl bg-[#0B0A09] hover:bg-neutral-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#EE8200]" />
                <span>1-Click Fill NTBA</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSegmentIds([])}
                className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
                title="Clear Selected Flight"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Passenger Table */}
            <div className="overflow-x-auto border border-neutral-200 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0B0A09] text-white text-[11px] font-bold uppercase">
                    <th className="py-3 px-2.5">#</th>
                    <th className="py-3 px-2.5">Pax Type</th>
                    <th className="py-3 px-2.5">Title</th>
                    <th className="py-3 px-2.5">First Name *</th>
                    <th className="py-3 px-2.5">Last Name *</th>
                    <th className="py-3 px-2.5">Gender</th>
                    <th className="py-3 px-2.5">Nationality</th>
                    <th className="py-3 px-2.5">DOB *</th>
                    <th className="py-3 px-2.5">Passport No *</th>
                    <th className="py-3 px-2.5">Passport Issue</th>
                    <th className="py-3 px-2.5">Passport Expiry</th>
                    <th className="py-3 px-2.5">Scan Upload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {passengers.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-[#FFF7ED]/40">
                      <td className="py-2.5 px-2.5 font-mono font-bold">{idx + 1}</td>
                      <td className="py-2.5 px-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#FFF7ED] text-[#EE8200] font-bold">
                          {p.PassengerType}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <select
                          value={p.Title}
                          onChange={(e) => updatePassengerField(idx, 'Title', e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-neutral-300 bg-white font-semibold"
                        >
                          {p.PassengerType === 'Adult' ? (
                            <>
                              <option value="MR">MR</option>
                              <option value="MRS">MRS</option>
                              <option value="MISS">MISS</option>
                            </>
                          ) : (
                            <>
                              <option value="MSTR">MSTR</option>
                              <option value="MISS">MISS</option>
                            </>
                          )}
                        </select>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={p.FirstName}
                          onChange={(e) => updatePassengerField(idx, 'FirstName', e.target.value)}
                          placeholder="FIRST NAME"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-300 uppercase font-semibold"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={p.LastName}
                          onChange={(e) => updatePassengerField(idx, 'LastName', e.target.value)}
                          placeholder="LAST NAME"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-300 uppercase font-semibold"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <select
                          value={p.Gender}
                          onChange={(e) => updatePassengerField(idx, 'Gender', e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-neutral-300 bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={p.Nationality}
                          onChange={(e) => updatePassengerField(idx, 'Nationality', e.target.value)}
                          className="w-16 px-2 py-1.5 rounded-lg border border-neutral-300 uppercase font-mono font-bold text-center"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="date"
                          value={p.DOB}
                          onChange={(e) => updatePassengerField(idx, 'DOB', e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-neutral-300 font-mono"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="text"
                          value={p.PassportNumber}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportNumber', e.target.value)
                          }
                          placeholder="PASSPORT #"
                          className="w-28 px-2.5 py-1.5 rounded-lg border border-neutral-300 uppercase font-mono font-bold"
                          required
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="date"
                          value={p.PassportIssueDate}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportIssueDate', e.target.value)
                          }
                          className="px-2 py-1.5 rounded-lg border border-neutral-300 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <input
                          type="date"
                          value={p.PassportExpiryDate}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportExpiryDate', e.target.value)
                          }
                          className="px-2 py-1.5 rounded-lg border border-neutral-300 font-mono"
                        />
                      </td>
                      <td className="py-2.5 px-2.5">
                        <label className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FFF7ED] hover:bg-[#EE8200] text-[#EE8200] hover:text-white font-semibold cursor-pointer transition">
                          <Upload className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[75px]">
                            {p.PassportImageName || 'Upload'}
                          </span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            onChange={(e) => handlePassportUpload(idx, e.target.files?.[0])}
                          />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Contact Info & Live Fare Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bookings@bookly.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAFAFA]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider mb-1.5">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="0300-0000000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 bg-[#FAFAFA]"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase tracking-wider mb-1.5">
                    Booking Remarks / Special Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional notes, seat preference, or meal request..."
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-300 bg-[#FAFAFA]"
                  />
                </div>
              </div>

              {/* Fare Calculation Box */}
              <div className="lg:col-span-5 bg-[#0B0A09] text-white rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-white/15 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#EE8200] flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    Fare Calculation Summary
                  </span>
                  <span className="text-[11px] font-mono text-white/70">
                    {selectedSegments.length} Sector(s)
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/75">
                      Adults ({fareBreakdown.adt} &times; {formatCurrencyPKR(fareBreakdown.adtUnit)})
                    </span>
                    <span className="font-bold">{formatCurrencyPKR(fareBreakdown.adtTotal)}</span>
                  </div>
                  {fareBreakdown.cnn > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/75">
                        Children ({fareBreakdown.cnn} &times; {formatCurrencyPKR(fareBreakdown.cnnUnit)})
                      </span>
                      <span className="font-bold">{formatCurrencyPKR(fareBreakdown.cnnTotal)}</span>
                    </div>
                  )}
                  {fareBreakdown.inf > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/75">
                        Infants ({fareBreakdown.inf} &times; {formatCurrencyPKR(fareBreakdown.infUnit)})
                      </span>
                      <span className="font-bold">{formatCurrencyPKR(fareBreakdown.infTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/15 pt-2.5 flex justify-between text-base font-extrabold text-[#EE8200]">
                    <span>Total Booking Amount</span>
                    <span>{formatCurrencyPKR(fareBreakdown.grandTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-[#EE8200] hover:bg-white hover:text-[#0B0A09] text-white font-display font-extrabold text-sm transition cursor-pointer shadow-lg mt-2"
                >
                  {submitting ? 'Creating Booking...' : 'Confirm & Create PNR Booking'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
