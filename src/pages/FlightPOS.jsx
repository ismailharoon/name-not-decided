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
  X,
  Trash2,
  Printer
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime, formatShortDate } from '../utils/exporters';
import TicketPrintModal from '../components/TicketPrintModal';

const DEFAULT_MULTI_LEGS = [
  { id: 'leg-1', fromIata: 'KHI', toIata: 'IKA', departDate: '' },
  { id: 'leg-2', fromIata: 'MHD', toIata: 'KHI', departDate: '' }
];

export default function FlightPOS() {
  const { user, isSubAgent, bookings, segments, subAgents, airports, createBooking, addToast } =
    usePortal();
  const navigate = useNavigate();

  const [tripType, setTripType] = useState('One Way'); // 'Round Trip' | 'One Way' | 'Multi City'
  const [fromIata, setFromIata] = useState('ALL');
  const [toIata, setToIata] = useState('ALL');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  // Multi City legs state
  const [multiCityLegs, setMultiCityLegs] = useState(DEFAULT_MULTI_LEGS);

  const [adultsCount, setAdultsCount] = useState(1);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);

  const [cabinClass, setCabinClass] = useState('All');
  const [selectedAgentId, setSelectedAgentId] = useState(
    isSubAgent ? user?.SubCompanyID || 'DIRECT' : 'DIRECT'
  );
  const [showPromo, setShowPromo] = useState(false);
  const [promoCode, setPromoCode] = useState('');

  const [selectedSegmentIds, setSelectedSegmentIds] = useState([]);

  const [passengers, setPassengers] = useState([]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [printBooking, setPrintBooking] = useState(null);

  useEffect(() => {
    if (isSubAgent && user?.SubCompanyID) {
      setSelectedAgentId(user.SubCompanyID);
    } else if (selectedAgentId === 'DIRECT' && subAgents.length > 0) {
      setSelectedAgentId(subAgents[0].SubCompanyID);
    }
  }, [subAgents, selectedAgentId, isSubAgent, user]);

  const selectedAgent = useMemo(
    () => subAgents.find((a) => a.SubCompanyID === selectedAgentId) || null,
    [subAgents, selectedAgentId]
  );

  const airportOptions = useMemo(() => {
    return (airports || []).map((a) => ({
      code: a.AirportCode,
      name: a.AirportName,
      city: a.CityName,
      country: a.CountryName
    }));
  }, [airports]);

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

  // Multi City leg handlers
  const updateMultiLeg = (index, field, value) => {
    setMultiCityLegs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const swapMultiLegAirports = (index) => {
    setMultiCityLegs((prev) => {
      const next = [...prev];
      const leg = next[index];
      next[index] = { ...leg, fromIata: leg.toIata, toIata: leg.fromIata };
      return next;
    });
  };

  const addMultiLeg = () => {
    setMultiCityLegs((prev) => {
      if (prev.length >= 6) return prev;
      const lastLeg = prev[prev.length - 1];
      const nextFrom = lastLeg?.toIata && lastLeg.toIata !== 'ALL' ? lastLeg.toIata : 'KHI';
      const nextTo = nextFrom === 'KHI' ? 'IKA' : 'KHI';
      return [
        ...prev,
        {
          id: `leg-${Date.now()}`,
          fromIata: nextFrom,
          toIata: nextTo,
          departDate: ''
        }
      ];
    });
  };

  const removeMultiLeg = (index) => {
    setMultiCityLegs((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  };

  // Helper to check which Multi City leg(s) a segment matches
  const getMatchingMultiLegIndices = (seg) => {
    const matched = [];
    multiCityLegs.forEach((leg, idx) => {
      const matchFrom = leg.fromIata === 'ALL' || seg.DepartureIata === leg.fromIata;
      const matchTo = leg.toIata === 'ALL' || seg.ArrivalIata === leg.toIata;
      const matchDate = !leg.departDate || (seg.DepartureDate || '').startsWith(leg.departDate);
      if (matchFrom && matchTo && matchDate) {
        matched.push(idx + 1);
      }
    });
    return matched;
  };

  const matchingSegments = useMemo(() => {
    return (segments || []).filter((seg) => {
      if (
        cabinClass !== 'All' &&
        (seg.FlightClass || 'Economy').toLowerCase() !== cabinClass.toLowerCase()
      ) {
        return false;
      }

      if (tripType === 'Multi City') {
        return multiCityLegs.some((leg) => {
          const matchFrom = leg.fromIata === 'ALL' || seg.DepartureIata === leg.fromIata;
          const matchTo = leg.toIata === 'ALL' || seg.ArrivalIata === leg.toIata;
          const matchDate =
            !leg.departDate || (seg.DepartureDate || '').startsWith(leg.departDate);
          return matchFrom && matchTo && matchDate;
        });
      }

      if (tripType === 'Round Trip') {
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

      if (fromIata !== 'ALL' && seg.DepartureIata !== fromIata) return false;
      if (toIata !== 'ALL' && seg.ArrivalIata !== toIata) return false;
      if (departDate && !(seg.DepartureDate || '').startsWith(departDate)) return false;
      return true;
    });
  }, [segments, fromIata, toIata, departDate, returnDate, cabinClass, tripType, multiCityLegs]);

  const selectedSegments = useMemo(
    () =>
      selectedSegmentIds
        .map((id) => (segments || []).find((s) => s.AirGroupSegmentID === id))
        .filter(Boolean),
    [selectedSegmentIds, segments]
  );

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
      if (prev.includes(segId)) {
        return prev.filter((id) => id !== segId);
      }
      if (tripType === 'One Way') {
        return [segId];
      }
      if (tripType === 'Round Trip') {
        return prev.length >= 2 ? [prev[1], segId] : [...prev, segId];
      }
      // Multi City: allow selecting multiple flight legs in sequence
      return [...prev, segId];
    });

    if (passengers.length === 0) {
      buildPassengerRows(false);
    }
  };

  useEffect(() => {
    if (selectedSegmentIds.length > 0) {
      buildPassengerRows(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adultsCount, childrenCount, infantsCount]);

  const handleSearchClick = (e) => {
    if (e) e.preventDefault();
    if (matchingSegments.length === 0) {
      addToast(
        'No flight segments matched your filter. Click "Show All Segments" to view all flights.',
        'warning'
      );
    } else {
      addToast(`Found ${matchingSegments.length} matching flight segment(s).`, 'success');
    }
  };

  const handleResetFilters = () => {
    setFromIata('ALL');
    setToIata('ALL');
    setDepartDate('');
    setReturnDate('');
    setCabinClass('All');
    setMultiCityLegs((prev) =>
      prev.map((leg) => ({ ...leg, fromIata: 'ALL', toIata: 'ALL', departDate: '' }))
    );
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
        SubCompanyID: isSubAgent ? user.SubCompanyID : selectedAgentId || 'DIRECT',
        EmailAddress: email || selectedAgent?.Email || 'bookings@bookly.com',
        MobileNumber: mobile || selectedAgent?.MobileNumber || '',
        Remarks: promoCode ? `${remarks ? remarks + ' | ' : ''}Promo: ${promoCode}` : remarks,
        Passengers: passengers,
        BookingChannelName: 'Bookly POS Search'
      });
      setSelectedSegmentIds([]);
      if (isSubAgent) {
        navigate('/Dashboard');
      } else {
        navigate('/FlightBookings');
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* COMPACT HERO SEARCH BANNER — Taban Air Royal Navy */}
      <div className="rounded-2xl bg-gradient-to-b from-[#0F172A] via-[#172847] to-[#1D314F] p-4 sm:p-6 shadow-md border border-slate-800 relative overflow-hidden">
        {/* Top Trip Type Pills */}
        <div className="relative z-10 flex flex-col items-center text-center mb-4">
          <div className="inline-flex items-center p-1 rounded-full bg-white/10 border border-white/15">
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
                  className={`px-4 sm:px-5 py-1.5 rounded-full text-xs font-medium transition cursor-pointer ${
                    active
                      ? 'bg-white text-[#1B3664] shadow-xs font-semibold'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-white/70 mt-2">
            {tripType === 'Multi City'
              ? 'Multi-City Search: Add multiple sectors (e.g. KHI → IKA, MHD → KHI) and select flights for each leg'
              : 'Search & book directly across your active flight segments'}
          </p>
        </div>

        {/* MAIN WHITE SEARCH CARD */}
        <form
          onSubmit={handleSearchClick}
          className="relative z-10 bg-white rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-100 max-w-4xl mx-auto space-y-3.5 text-slate-800"
        >
          {tripType === 'Multi City' ? (
            /* MULTI CITY LEGS BUILDER */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#1B3664]">
                  Multi-City Flight Sectors ({multiCityLegs.length} Legs)
                </span>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-medium text-slate-500 hover:text-[#1B3664] cursor-pointer"
                >
                  Show All Cities on All Legs
                </button>
              </div>

              {multiCityLegs.map((leg, idx) => {
                const depObj = airportOptions.find((a) => a.code === leg.fromIata);
                const arrObj = airportOptions.find((a) => a.code === leg.toIata);
                return (
                  <div
                    key={leg.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#1B3664] text-white text-[10px] font-semibold uppercase tracking-wider">
                        <Plane className="w-3 h-3" />
                        Flight Leg {idx + 1}
                      </span>
                      {multiCityLegs.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeMultiLeg(idx)}
                          className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-medium cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove Leg</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                      {/* FROM */}
                      <div className="md:col-span-4 p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                          <span>From (Departure)</span>
                          <span className="text-[#1B3664] font-mono">
                            {leg.fromIata === 'ALL' ? 'ANY' : leg.fromIata}
                          </span>
                        </div>
                        <select
                          value={leg.fromIata}
                          onChange={(e) => updateMultiLeg(idx, 'fromIata', e.target.value)}
                          className="w-full mt-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Cities (Any)</option>
                          {airportOptions.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.city} ({a.code}) — {a.name}
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {depObj ? `${depObj.name}, ${depObj.city}` : 'Any departure city'}
                        </div>
                      </div>

                      {/* SWAP */}
                      <div className="md:col-span-1 flex justify-center">
                        <button
                          type="button"
                          onClick={() => swapMultiLegAirports(idx)}
                          title="Swap From & To"
                          className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:border-[#1B3664] text-[#1B3664] hover:bg-[#1B3664] hover:text-white flex items-center justify-center transition cursor-pointer"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* TO */}
                      <div className="md:col-span-4 p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                          <span>To (Arrival)</span>
                          <span className="text-[#1B3664] font-mono">
                            {leg.toIata === 'ALL' ? 'ANY' : leg.toIata}
                          </span>
                        </div>
                        <select
                          value={leg.toIata}
                          onChange={(e) => updateMultiLeg(idx, 'toIata', e.target.value)}
                          className="w-full mt-1 text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Cities (Any)</option>
                          {airportOptions.map((a) => (
                            <option key={a.code} value={a.code}>
                              {a.city} ({a.code}) — {a.name}
                            </option>
                          ))}
                        </select>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {arrObj ? `${arrObj.name}, ${arrObj.city}` : 'Any arrival city'}
                        </div>
                      </div>

                      {/* DEPART DATE */}
                      <div className="md:col-span-3 p-2.5 rounded-lg bg-white border border-slate-200">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
                          <span>Depart Date</span>
                          {leg.departDate && (
                            <button
                              type="button"
                              onClick={() => updateMultiLeg(idx, 'departDate', '')}
                              className="text-[10px] text-red-500 hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        <input
                          type="date"
                          value={leg.departDate}
                          onChange={(e) => updateMultiLeg(idx, 'departDate', e.target.value)}
                          className="w-full mt-1 text-xs font-medium text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                        />
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {leg.departDate ? formatShortDate(leg.departDate) : 'Any Available Date'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {multiCityLegs.length < 6 && (
                <button
                  type="button"
                  onClick={addMultiLeg}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-dashed border-[#1B3664]/40 text-[#1B3664] hover:bg-slate-50 text-xs font-semibold transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Flight Leg</span>
                </button>
              )}
            </div>
          ) : (
            /* ONE WAY & ROUND TRIP: ROW 1 (FROM & TO) + ROW 2 (DATES) */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative">
                {/* FROM BOX */}
                <div className="p-3.5 rounded-xl border border-slate-200 hover:border-[#1B3664] bg-slate-50/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      FROM
                    </span>
                    <span className="text-[10px] text-[#1B3664] font-medium">Departure</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="font-display font-bold text-2xl sm:text-3xl text-[#1B3664] tracking-tight">
                      {fromIata === 'ALL' ? 'ANY' : fromIata}
                    </span>
                    <select
                      value={fromIata}
                      onChange={(e) => setFromIata(e.target.value)}
                      className="flex-1 bg-transparent font-medium text-xs text-slate-800 focus:outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5"
                    >
                      <option value="ALL">All Departure Cities (Show All)</option>
                      {airportOptions.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} — {a.city} ({a.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {fromAirportObj
                      ? `${fromAirportObj.name} • ${fromAirportObj.city}`
                      : 'All departure airports'}
                  </div>
                </div>

                {/* SWAP BUTTON IN CENTER */}
                <button
                  type="button"
                  onClick={handleSwapAirports}
                  title="Swap From & To Airports"
                  className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white border border-slate-200 hover:border-[#1B3664] text-[#1B3664] hover:bg-[#1B3664] hover:text-white items-center justify-center shadow-xs transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>

                {/* TO BOX */}
                <div className="p-3.5 rounded-xl border border-slate-200 hover:border-[#1B3664] bg-slate-50/50 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      TO
                    </span>
                    <span className="text-[10px] text-[#1B3664] font-medium">Arrival</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2.5">
                    <span className="font-display font-bold text-2xl sm:text-3xl text-[#1B3664] tracking-tight">
                      {toIata === 'ALL' ? 'ANY' : toIata}
                    </span>
                    <select
                      value={toIata}
                      onChange={(e) => setToIata(e.target.value)}
                      className="flex-1 bg-transparent font-medium text-xs text-slate-800 focus:outline-none cursor-pointer border-b border-dashed border-slate-300 pb-0.5"
                    >
                      <option value="ALL">All Arrival Cities (Show All)</option>
                      {airportOptions.map((a) => (
                        <option key={a.code} value={a.code}>
                          {a.code} — {a.city} ({a.name})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">
                    {toAirportObj
                      ? `${toAirportObj.name} • ${toAirportObj.city}`
                      : 'All arrival airports'}
                  </div>
                </div>
              </div>

              {/* ROW 2: DEPART DATE & RETURN DATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-[#1B3664] flex items-center justify-between bg-white transition">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Calendar className="w-4 h-4 text-[#1B3664] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Depart {departDate ? '' : '(Any Date)'}
                      </div>
                      <input
                        type="date"
                        value={departDate}
                        onChange={(e) => setDepartDate(e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                      />
                    </div>
                  </div>
                  {departDate && (
                    <button
                      type="button"
                      onClick={() => setDepartDate('')}
                      className="text-[11px] text-slate-400 hover:text-red-600 px-1.5"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div
                  className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between transition ${
                    tripType === 'Round Trip'
                      ? 'border-slate-200 hover:border-[#1B3664] bg-white'
                      : 'border-slate-100 bg-slate-50 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1">
                    <Calendar className="w-4 h-4 text-[#1B3664] shrink-0" />
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Return {tripType !== 'Round Trip' && '(Round Trip Only)'}
                      </div>
                      <input
                        type="date"
                        disabled={tripType !== 'Round Trip'}
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        className="w-full text-xs font-medium text-slate-800 focus:outline-none bg-transparent disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                  {returnDate && tripType === 'Round Trip' && (
                    <button
                      type="button"
                      onClick={() => setReturnDate('')}
                      className="text-[11px] text-slate-400 hover:text-red-600 px-1.5"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ROW 3: PASSENGERS STEPPER BOX & CABIN CLASS + SUB-AGENT BOX */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* PASSENGERS BOX */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2.5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                PASSENGERS
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Adults</div>
                  <div className="text-[10px] text-slate-400">Age 12+</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAdultsCount((c) => Math.max(1, c - 1))}
                    className="w-7 h-7 rounded-full border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-semibold text-xs text-slate-800">
                    {adultsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAdultsCount((c) => c + 1)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Children</div>
                  <div className="text-[10px] text-slate-400">Age 2–11</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setChildrenCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-full border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-semibold text-xs text-slate-800">
                    {childrenCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setChildrenCount((c) => c + 1)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-800">Infants</div>
                  <div className="text-[10px] text-slate-400">Under 2</div>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setInfantsCount((c) => Math.max(0, c - 1))}
                    className="w-7 h-7 rounded-full border border-slate-200 hover:border-[#1B3664] text-slate-600 hover:text-[#1B3664] flex items-center justify-center transition cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-mono font-semibold text-xs text-slate-800">
                    {infantsCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInfantsCount((c) => c + 1)}
                    className="w-7 h-7 rounded-full bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white flex items-center justify-center transition cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* CABIN CLASS & SUB-AGENT BOX */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between space-y-2.5">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  CABIN CLASS
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['All', 'Economy', 'Business', 'First'].map((cls) => {
                    const active = cabinClass === cls;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setCabinClass(cls)}
                        className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between cursor-pointer ${
                          active
                            ? 'bg-[#1B3664] text-white'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{cls === 'All' ? 'All Classes' : cls}</span>
                        {active && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  BOOKING AGENCY / SUB-AGENT
                </label>
                {isSubAgent ? (
                  <div className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-[#1B3664] flex items-center justify-between">
                    <span className="truncate">{user?.SubCompanyName || 'Sub Agent'}</span>
                    {selectedAgent && (
                      <span className="font-mono text-[11px] text-emerald-700 shrink-0 ml-2">
                        Bal: {formatCurrencyPKR(selectedAgent.CreditLimitBalance)}
                      </span>
                    )}
                  </div>
                ) : (
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
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:border-[#1B3664] focus:outline-none"
                  >
                    <option value="DIRECT">Bookly Direct Desk (Admin)</option>
                    {subAgents.map((a) => (
                      <option key={a.SubCompanyID} value={a.SubCompanyID}>
                        {a.CompanyName} ({a.City}) — Bal: {formatCurrencyPKR(a.CreditLimitBalance)}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* PROMO CODE TOGGLE */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowPromo((p) => !p)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1B3664] hover:underline cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Have a promo code?</span>
            </button>
            {showPromo && (
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter Promo Code"
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono focus:border-[#1B3664] focus:outline-none"
              />
            )}
          </div>

          {/* FULL-WIDTH SEARCH FLIGHTS BUTTON */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#1B3664] hover:bg-[#0F172A] text-white font-display font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>
              Search {tripType === 'Multi City' ? 'Multi-City ' : ''}Flights ({matchingSegments.length} Available)
            </span>
          </button>
        </form>
      </div>

      {/* FLIGHT SEGMENT SEARCH RESULTS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="bg-[#1D314F] text-white px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Plane className="w-4 h-4 text-white/80" />
            <div>
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider">
                Available Flight Segments ({matchingSegments.length})
              </h3>
              <p className="text-[11px] text-white/70">
                {tripType === 'Multi City'
                  ? 'Select multiple flight segments below to combine them into a single Multi-City PNR booking'
                  : tripType === 'Round Trip'
                  ? 'Select your Outbound and Return flight segments below'
                  : 'Click "Select Flight" on any segment below to open passenger booking'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="px-3 py-1 rounded-lg bg-white/15 hover:bg-white text-white hover:text-[#1D314F] text-xs font-medium transition cursor-pointer"
          >
            Show All Segments ({segments.length})
          </button>
        </div>

        {/* Selected Multi-Segment Itinerary Bar */}
        {selectedSegments.length > 0 && (
          <div className="bg-slate-100 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-[#1B3664]">
                Selected Itinerary ({selectedSegments.length} {selectedSegments.length === 1 ? 'Leg' : 'Legs'}):
              </span>
              {selectedSegments.map((s, idx) => (
                <span
                  key={s.AirGroupSegmentID}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1B3664] text-white font-mono text-[11px]"
                >
                  <span>
                    Leg {idx + 1}: {s.FlightNumber} ({s.DepartureIata} &rarr; {s.ArrivalIata})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectSegment(s)}
                    className="hover:text-red-300 cursor-pointer"
                    title="Remove this leg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSelectedSegmentIds([])}
              className="text-[11px] text-red-600 hover:underline font-medium cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        )}

        <div className="p-4 space-y-2.5">
          {segments.length === 0 ? (
            <div className="py-10 text-center space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                No flight segments have been added yet.
              </div>
              {!isSubAgent && (
                <>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Add a flight segment in <b>Segment Management</b> and it will appear here for instant search and booking.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/SegmentManagement')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Go to Segment Management</span>
                  </button>
                </>
              )}
            </div>
          ) : matchingSegments.length === 0 ? (
            <div className="py-8 text-center space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                No segments matched your current filter.
              </div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B3664] text-white text-xs font-medium hover:bg-[#0F172A] transition cursor-pointer"
              >
                <span>Show All {segments.length} Available Segment(s)</span>
              </button>
            </div>
          ) : (
            matchingSegments.map((seg) => {
              const isSelected = selectedSegmentIds.includes(seg.AirGroupSegmentID);
              const selectedLegOrder = selectedSegmentIds.indexOf(seg.AirGroupSegmentID) + 1;
              const matchedLegNumbers =
                tripType === 'Multi City' ? getMatchingMultiLegIndices(seg) : [];
              const seatsLeft = Number(seg.SeatsLeft ?? seg.TotalSeats) || 0;
              const estTotalForSeg =
                Number(adultsCount) * (Number(seg.AdultPrice) || 0) +
                Number(childrenCount) * (Number(seg.ChildPrice) || 0) +
                Number(infantsCount) * (Number(seg.InfantPrice) || 0);

              const adtBag = seg.BaggageADT ?? seg.BaggageCountADT ?? '20';
              const cnnBag = seg.BaggageCNN ?? seg.BaggageCountCNN ?? '20';
              const infBag = seg.BaggageINF ?? seg.BaggageCountINF ?? '0';
              const carrierPrefix =
                seg.OperatingAirline ||
                seg.MarketingAirline ||
                (seg.FlightNumber ? seg.FlightNumber.split(/[\s-]+/)[0] : 'FL');

              return (
                <div
                  key={seg.AirGroupSegmentID}
                  onClick={() => handleToggleSelectSegment(seg)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 ${
                    isSelected
                      ? 'border-[#1B3664] bg-slate-50 shadow-xs'
                      : 'border-slate-200 hover:border-[#1B3664]/60 bg-white'
                  }`}
                >
                  {/* Airline & Flight Badge */}
                  <div className="flex items-center gap-3 min-w-[190px]">
                    <div
                      className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-mono font-semibold text-xs shrink-0 ${
                        isSelected ? 'bg-[#1B3664] text-white' : 'bg-slate-900 text-white'
                      }`}
                    >
                      <span>{carrierPrefix}</span>
                    </div>
                    <div>
                      <div className="font-mono font-semibold text-sm text-slate-900 flex flex-wrap items-center gap-1.5">
                        <span>{seg.FlightNumber}</span>
                        <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-medium">
                          {seg.FlightClass || 'Economy'} ({seg.FlightClassCode || 'Y'})
                        </span>
                        {tripType === 'Multi City' && matchedLegNumbers.length > 0 && (
                          <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-[#1B3664]/10 text-[#1B3664] font-semibold">
                            Matches Leg {matchedLegNumbers.join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {seg.OperatingAirlineName || 'Taban Airlines'} • {seg.AirCraft || 'A320'}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Luggage className="w-3 h-3 text-[#1B3664]" />
                          ADT={adtBag}, CNN={cnnBag}, INF={infBag}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-[#1B3664]" />
                          Meal: {seg.Meal || 'Yes'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route & Schedule Timeline */}
                  <div className="flex items-center justify-between sm:justify-center gap-4 sm:gap-7 flex-1 border-y lg:border-y-0 border-slate-100 py-2.5 lg:py-0">
                    <div className="text-left">
                      <div className="font-display font-bold text-lg text-slate-900">
                        {seg.DepartureIata}
                      </div>
                      <div className="text-xs font-medium text-slate-600">{seg.DepartureCity}</div>
                      <div className="text-[11px] font-mono text-[#1B3664] mt-0.5">
                        {formatDateTime(seg.DepartureDate)}
                      </div>
                    </div>

                    <div className="flex flex-col items-center px-2">
                      <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#1B3664]" />
                        {seg.FlightTime || 'Direct'}
                      </span>
                      <div className="w-20 sm:w-28 h-px bg-slate-300 my-1.5 relative">
                        <Plane className="w-3 h-3 text-[#1B3664] absolute -top-1.5 right-0" />
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {seatsLeft} Seats Left
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="font-display font-bold text-lg text-slate-900">
                        {seg.ArrivalIata}
                      </div>
                      <div className="text-xs font-medium text-slate-600">{seg.ArrivalCity}</div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {formatDateTime(seg.ArrivalDate)}
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Select Button */}
                  <div className="flex sm:flex-row lg:flex-col items-center lg:items-end justify-between gap-2 min-w-[180px]">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-slate-500">
                        Adult: <b className="font-mono text-slate-800">{formatCurrencyPKR(seg.AdultPrice)}</b>
                      </div>
                      <div className="font-mono font-bold text-base text-[#1B3664]">
                        {formatCurrencyPKR(estTotalForSeg)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Total ({adultsCount}A, {childrenCount}C, {infantsCount}I)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelectSegment(seg);
                      }}
                      className={`px-3.5 py-2 rounded-lg font-medium text-xs flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F172A] text-white'
                          : 'bg-[#1B3664] hover:bg-[#0F172A] text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>
                            {tripType === 'Multi City' || tripType === 'Round Trip'
                              ? `Selected (Leg ${selectedLegOrder})`
                              : 'Selected'}
                          </span>
                        </>
                      ) : (
                        <span>
                          {tripType === 'Multi City' ? '+ Select Flight Leg' : 'Select Flight'}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PASSENGER MANIFEST & INSTANT BOOKING SECTION */}
      {selectedSegments.length > 0 && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white rounded-xl border border-[#1B3664] shadow-lg overflow-hidden"
        >
          <div className="bg-[#1D314F] text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>
                  Passenger Manifest & Booking ({passengers.length} Pax • {selectedSegments.length}{' '}
                  {selectedSegments.length === 1 ? 'Sector' : 'Sectors'})
                </span>
              </h3>
              <p className="text-[11px] text-white/80 mt-0.5">
                Sector(s):{' '}
                {selectedSegments
                  .map(
                    (s, idx) =>
                      `Leg ${idx + 1}: ${s.FlightNumber} (${s.DepartureIata} → ${s.ArrivalIata} on ${formatShortDate(s.DepartureDate)})`
                  )
                  .join('  +  ')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => buildPassengerRows(true)}
                className="px-3 py-1.5 rounded-lg bg-white text-[#1D314F] hover:bg-slate-100 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Fill NTBA</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSegmentIds([])}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Clear Selected Flight"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-[11px] font-semibold uppercase">
                    <th className="py-2.5 px-2.5">#</th>
                    <th className="py-2.5 px-2.5">Type</th>
                    <th className="py-2.5 px-2.5">Title</th>
                    <th className="py-2.5 px-2.5">First Name *</th>
                    <th className="py-2.5 px-2.5">Last Name *</th>
                    <th className="py-2.5 px-2.5">Gender</th>
                    <th className="py-2.5 px-2.5">Nationality</th>
                    <th className="py-2.5 px-2.5">DOB *</th>
                    <th className="py-2.5 px-2.5">Passport No *</th>
                    <th className="py-2.5 px-2.5">Issue Date</th>
                    <th className="py-2.5 px-2.5">Expiry Date</th>
                    <th className="py-2.5 px-2.5">Passport Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {passengers.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono">{idx + 1}</td>
                      <td className="py-2 px-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[#1B3664] font-medium">
                          {p.PassengerType}
                        </span>
                      </td>
                      <td className="py-2 px-2.5">
                        <select
                          value={p.Title}
                          onChange={(e) => updatePassengerField(idx, 'Title', e.target.value)}
                          className="px-2 py-1 rounded border border-slate-300 bg-white"
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
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={p.FirstName}
                          onChange={(e) => updatePassengerField(idx, 'FirstName', e.target.value)}
                          placeholder="FIRST NAME"
                          className="w-28 px-2 py-1 rounded border border-slate-300 uppercase"
                          required
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={p.LastName}
                          onChange={(e) => updatePassengerField(idx, 'LastName', e.target.value)}
                          placeholder="LAST NAME"
                          className="w-28 px-2 py-1 rounded border border-slate-300 uppercase"
                          required
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <select
                          value={p.Gender}
                          onChange={(e) => updatePassengerField(idx, 'Gender', e.target.value)}
                          className="px-2 py-1 rounded border border-slate-300 bg-white"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={p.Nationality}
                          onChange={(e) => updatePassengerField(idx, 'Nationality', e.target.value)}
                          className="w-14 px-2 py-1 rounded border border-slate-300 uppercase font-mono text-center"
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="date"
                          value={p.DOB}
                          onChange={(e) => updatePassengerField(idx, 'DOB', e.target.value)}
                          className="px-2 py-1 rounded border border-slate-300 font-mono"
                          required
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="text"
                          value={p.PassportNumber}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportNumber', e.target.value)
                          }
                          placeholder="PASSPORT #"
                          className="w-28 px-2 py-1 rounded border border-slate-300 uppercase font-mono"
                          required
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="date"
                          value={p.PassportIssueDate}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportIssueDate', e.target.value)
                          }
                          className="px-2 py-1 rounded border border-slate-300 font-mono"
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <input
                          type="date"
                          value={p.PassportExpiryDate}
                          onChange={(e) =>
                            updatePassengerField(idx, 'PassportExpiryDate', e.target.value)
                          }
                          className="px-2 py-1 rounded border border-slate-300 font-mono"
                        />
                      </td>
                      <td className="py-2 px-2.5">
                        <label className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-[#1B3664] text-[#1B3664] hover:text-white font-medium cursor-pointer transition">
                          <Upload className="w-3 h-3" />
                          <span className="truncate max-w-[70px]">
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Contact Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="bookings@bookly.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Mobile / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="0300-0000000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Booking Remarks
                  </label>
                  <textarea
                    rows={2}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Optional notes..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#0F172A] text-white rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-slate-300" />
                    Fare Calculation
                  </span>
                  <span className="text-[11px] font-mono text-white/70">
                    {selectedSegments.length} Sector(s)
                  </span>
                </div>

                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-white/70">
                      Adults ({fareBreakdown.adt} &times; {formatCurrencyPKR(fareBreakdown.adtUnit)})
                    </span>
                    <span>{formatCurrencyPKR(fareBreakdown.adtTotal)}</span>
                  </div>
                  {fareBreakdown.cnn > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/70">
                        Children ({fareBreakdown.cnn} &times; {formatCurrencyPKR(fareBreakdown.cnnUnit)})
                      </span>
                      <span>{formatCurrencyPKR(fareBreakdown.cnnTotal)}</span>
                    </div>
                  )}
                  {fareBreakdown.inf > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/70">
                        Infants ({fareBreakdown.inf} &times; {formatCurrencyPKR(fareBreakdown.infUnit)})
                      </span>
                      <span>{formatCurrencyPKR(fareBreakdown.infTotal)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/15 pt-2 flex justify-between text-sm font-semibold text-white">
                    <span>Total Amount</span>
                    <span>{formatCurrencyPKR(fareBreakdown.grandTotal)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-lg bg-[#1B3664] hover:bg-white hover:text-[#0F172A] text-white font-semibold text-xs transition cursor-pointer mt-1"
                >
                  {submitting ? 'Creating Booking...' : 'Confirm & Create PNR Booking'}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* SUB-AGENT OWN BOOKINGS SECTION INSIDE POS */}
      {isSubAgent && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-[#1D314F] text-white px-5 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider">
                My POS Bookings ({bookings.length})
              </h3>
              <p className="text-[11px] text-white/70">
                Only bookings created by your agency account are displayed here
              </p>
            </div>
          </div>
          {bookings.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              You have not booked any tickets yet. Select a flight above to create your first booking.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <th className="py-2.5 px-3">PNR / Booking ID</th>
                    <th className="py-2.5 px-3">Flight Sector</th>
                    <th className="py-2.5 px-3 text-center">Passengers</th>
                    <th className="py-2.5 px-3">Total Amount</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Booked At</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {bookings.map((b) => {
                    const isIssued = b.ApprovalStatus === 'Ticket Issued';
                    return (
                      <tr key={b.AirGroupBookingID} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3">
                          <div className="font-mono font-semibold text-[#1B3664]">{b.PNR}</div>
                          <div className="text-[10px] text-slate-500">{b.AirGroupBookingID}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900">{b.FlightTitle}</div>
                          <div className="text-[10px] text-slate-500">{b.TripType}</div>
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
                                  b.ApprovalStatus === 'Ticket Void'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {b.ApprovalStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500">{b.TimeStamp}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setPrintBooking(b)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1B3664] hover:bg-[#0F172A] text-white text-[11px] font-medium transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>{isIssued ? 'Print Ticket' : 'Print Details'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {printBooking && (
        <TicketPrintModal booking={printBooking} onClose={() => setPrintBooking(null)} />
      )}
    </div>
  );
}
