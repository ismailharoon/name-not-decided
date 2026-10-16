import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Users,
  Sparkles,
  Plane,
  Upload,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calculator
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { formatCurrencyPKR, formatDateTime } from '../utils/exporters';

export default function FlightPOS() {
  const { subAgents, flights, createBooking, addToast } = usePortal();
  const navigate = useNavigate();

  const [selectedAgentId, setSelectedAgentId] = useState(() => subAgents[0]?.SubCompanyID || 'SUB-201');
  const [selectedFlightId, setSelectedFlightId] = useState(() => flights[0]?.AirGroupID || 'AG-501');

  const [adultsCount, setAdultsCount] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const [infantsCount, setInfantsCount] = useState(0);

  const [passengers, setPassengers] = useState([]);
  const [email, setEmail] = useState('ops@alharamaintravel.pk');
  const [mobile, setMobile] = useState('+92 300 8214490');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedAgent = useMemo(
    () => subAgents.find((a) => a.SubCompanyID === selectedAgentId) || subAgents[0],
    [subAgents, selectedAgentId]
  );

  const selectedFlight = useMemo(
    () => flights.find((f) => f.AirGroupID === selectedFlightId) || flights[0],
    [flights, selectedFlightId]
  );

  const lastSegmentArrivalDate = useMemo(() => {
    const segs = selectedFlight?.Segments || [];
    if (!segs.length) return selectedFlight?.GroupDepartureDate || '2026-12-01';
    return segs[segs.length - 1].ArrivalDate;
  }, [selectedFlight]);

  const handleGeneratePassengers = (autoFillNTBA = false) => {
    if (!selectedAgent) {
      addToast('Please Select Agent.', 'warning');
      return;
    }
    if (!selectedFlight) {
      addToast('Please Select Group.', 'warning');
      return;
    }
    const totalPax = Number(adultsCount) + Number(childrenCount) + Number(infantsCount);
    if (totalPax <= 0) {
      addToast('Please select at least one passenger.', 'warning');
      return;
    }
    const seatOccupying = Number(adultsCount) + Number(childrenCount);
    const avail = Number(selectedFlight.SeatsLeft) || 0;
    if (seatOccupying > avail) {
      addToast(`Cannot add passengers. Only ${avail} seats are available.`, 'error');
      return;
    }

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
        DOB: '1988-05-15',
        PassportNumber: autoFillNTBA ? `NTBA00${i + 1}` : '',
        PassportIssueDate: '2024-01-10',
        PassportExpiryDate: '2029-01-09',
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
        DOB: '2018-06-20',
        PassportNumber: autoFillNTBA ? `NTBAC0${i + 1}` : '',
        PassportIssueDate: '2024-03-10',
        PassportExpiryDate: '2029-03-09',
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
        DOB: '2025-07-01',
        PassportNumber: autoFillNTBA ? `NTBAI0${i + 1}` : '',
        PassportIssueDate: '2025-08-01',
        PassportExpiryDate: '2030-07-31',
        PassportImageName: '',
        PassportFileData: ''
      });
    }

    setPassengers(list);
    if (autoFillNTBA) {
      addToast('Passenger fields auto-filled!', 'success');
    } else {
      addToast(
        `Added ${totalPax} passengers. Total seats: ${selectedFlight.TotalSeats}, Available seats: ${avail}`,
        'info'
      );
    }
  };

  const updatePaxField = (index, field, value) => {
    setPassengers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handlePassportUpload = (index, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPassengers((prev) => {
        const next = [...prev];
        next[index] = {
          ...next[index],
          PassportImageName: file.name,
          PassportFileData: reader.result
        };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  // Fare Summary Calculations
  const fareBreakdown = useMemo(() => {
    const f = selectedFlight || {};
    const adtBasic = Number(f.AdultBasicFare) || 0;
    const adtTax = Number(f.AdultTax) || 0;
    const adtPrice = Number(f.AdultPrice) || adtBasic + adtTax;

    const cnnBasic = Number(f.ChildBasicFare) || 0;
    const cnnTax = Number(f.ChildTax) || 0;
    const cnnPrice = Number(f.ChildPrice) || cnnBasic + cnnTax;

    const infBasic = Number(f.InfantBasicFare) || 0;
    const infTax = Number(f.InfantTax) || 0;
    const infPrice = Number(f.InfantPrice) || infBasic + infTax;

    const adtTotal = adtPrice * Number(adultsCount || 0);
    const cnnTotal = cnnPrice * Number(childrenCount || 0);
    const infTotal = infPrice * Number(infantsCount || 0);

    return {
      adtBasic,
      adtTax,
      adtPrice,
      adtTotal,
      cnnBasic,
      cnnTax,
      cnnPrice,
      cnnTotal,
      infBasic,
      infTax,
      infPrice,
      infTotal,
      grandTotal: adtTotal + cnnTotal + infTotal
    };
  }, [selectedFlight, adultsCount, childrenCount, infantsCount]);

  const handleBookNow = async (e) => {
    e.preventDefault();
    if (!passengers.length) {
      addToast('Please click "Add Details" or "NTBA" to add passenger records before booking.', 'warning');
      return;
    }

    // Check required names
    for (const p of passengers) {
      if (!p.FirstName.trim() || !p.LastName.trim() || !p.PassportNumber.trim()) {
        addToast('Please enter all passenger First Name, Last Name, and Passport Number (or click NTBA).', 'error');
        return;
      }
    }

    setSubmitting(true);
    try {
      await createBooking({
        AirGroupID: selectedFlight.AirGroupID,
        SubCompanyID: selectedAgent.SubCompanyID,
        EmailAddress: email,
        MobileNumber: mobile,
        Remarks: remarks || 'POS Instant Group Booking',
        Passengers: passengers,
        BookingChannelName: 'Flight POS Desk'
      });
      navigate('/FlightBookings');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#EE8200]">
            Instant B2B Group Reservation Engine
          </span>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[#0B0A09] mt-0.5">
            Flight POS (Point of Sale)
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 8 COLUMNS: Agent, Flight Selection, Segments, Passenger Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Select Sub Agent & Select Flight */}
          <div className="bg-white rounded-2xl border border-[#EE8200]/15 p-6 shadow-executive space-y-5">
            {/* Row 1: Agent Selection + Credit Limit & Balance */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1.5">
                  Select Agent:
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/20 text-xs font-bold focus:outline-none focus:border-[#EE8200]"
                >
                  {subAgents.map((a) => (
                    <option key={a.SubCompanyID} value={a.SubCompanyID}>
                      {a.CompanyName} ({a.City})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                  Credit Limit:
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/15 font-mono font-bold text-xs text-[#EE8200]">
                  {formatCurrencyPKR(selectedAgent?.CreditLimit || 0)}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                  Account Balance:
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#EE8200] text-white font-mono font-bold text-xs">
                  {formatCurrencyPKR(selectedAgent?.CreditLimitBalance || 0)}
                </div>
              </div>
            </div>

            {/* Row 2: Select Flight (Air Group) + Total Seats & Available Seats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#0B0A09] mb-1.5">
                  Select Flight:
                </label>
                <select
                  value={selectedFlightId}
                  onChange={(e) => setSelectedFlightId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAFAFA] border border-[#EE8200]/20 text-xs font-bold focus:outline-none focus:border-[#EE8200]"
                >
                  {flights.map((f) => (
                    <option key={f.AirGroupID} value={f.AirGroupID}>
                      {f.Title} ({f.Airline} • {f.SeatsLeft} Seats Left)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                  Total Seats:
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-[#FAFAFA] border border-neutral-200 font-mono font-bold text-xs">
                  {selectedFlight?.TotalSeats || 0} Seats
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 mb-1.5">
                  Available Seats:
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 font-mono font-bold text-xs">
                  {selectedFlight?.SeatsLeft || 0} Available
                </div>
              </div>
            </div>

            {/* Selected Flight Segments Table */}
            <div>
              <h6 className="font-display font-bold text-xs uppercase tracking-wider text-[#EE8200] mb-2">
                Flight Segments
              </h6>
              <div className="overflow-x-auto border border-[#EE8200]/15 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#EE8200] text-white font-bold">
                      <th className="py-2.5 px-3">Departure IATA</th>
                      <th className="py-2.5 px-3">Departure Date</th>
                      <th className="py-2.5 px-3">Arrival IATA</th>
                      <th className="py-2.5 px-3">Arrival Date</th>
                      <th className="py-2.5 px-3">Flight Class</th>
                      <th className="py-2.5 px-3">Class Code</th>
                      <th className="py-2.5 px-3">Flight Number</th>
                      <th className="py-2.5 px-3">Operating Airline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {(selectedFlight?.Segments || []).length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-neutral-500">
                          No segments available.
                        </td>
                      </tr>
                    ) : (
                      (selectedFlight?.Segments || []).map((seg) => (
                        <tr key={seg.AirGroupSegmentID} className="hover:bg-[#FAFAFA]">
                          <td className="py-2.5 px-3 font-bold text-[#EE8200]">
                            {seg.DepartureIata} ({seg.DepartureCity})
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {formatDateTime(seg.DepartureDate)}
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#0B0A09]">
                            {seg.ArrivalIata} ({seg.ArrivalCity})
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {formatDateTime(seg.ArrivalDate)}
                          </td>
                          <td className="py-2.5 px-3">{seg.FlightClass}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{seg.FlightClassCode}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#EE8200]">
                            {seg.FlightNumber}
                          </td>
                          <td className="py-2.5 px-3">{seg.OperatingAirlineName}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Passenger Counter & Add Details / NTBA Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end pt-2 border-t border-neutral-100">
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Adults:</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={adultsCount}
                  onChange={(e) => setAdultsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Children:</label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={childrenCount}
                  onChange={(e) => setChildrenCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Infants:</label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={infantsCount}
                  onChange={(e) => setInfantsCount(Math.max(0, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-bold text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => handleGeneratePassengers(false)}
                className="py-2.5 px-4 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold text-xs transition cursor-pointer"
              >
                Add Details
              </button>
              <button
                type="button"
                onClick={() => handleGeneratePassengers(true)}
                className="py-2.5 px-4 rounded-xl bg-[#0B0A09] hover:bg-[#EE8200] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                title="Auto-fill NTBA & PAK placeholder details for rapid block booking"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>NTBA</span>
              </button>
            </div>

            {/* Contact & Remarks Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Email:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Mobile No:</label>
                <input
                  type="text"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B0A09] mb-1">Remarks:</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Optional group notes..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Passenger Forms List */}
          {passengers.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-display font-bold text-base text-[#0B0A09]">
                Passenger Manifest Entry ({passengers.length} Passengers)
              </h3>
              {passengers.map((pax, idx) => {
                const isPassportExpiredBeforeReturn =
                  pax.PassportExpiryDate &&
                  lastSegmentArrivalDate &&
                  new Date(pax.PassportExpiryDate) < new Date(lastSegmentArrivalDate);

                return (
                  <div
                    key={pax.id || idx}
                    className="bg-white rounded-2xl border border-[#EE8200]/20 p-5 shadow-xs space-y-4 text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                      <span className="px-3 py-1 rounded-lg bg-[#EE8200] text-white font-bold text-xs">
                        Passenger #{idx + 1} — {pax.PassengerType}
                      </span>
                      {pax.PassportImageName && (
                        <span className="text-emerald-700 font-bold">
                          Attached: {pax.PassportImageName}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block font-bold mb-1">Title</label>
                        <select
                          value={pax.Title}
                          onChange={(e) => updatePaxField(idx, 'Title', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        >
                          <option value="MR">MR</option>
                          <option value="MRS">MRS</option>
                          <option value="MSTR">MSTR</option>
                          <option value="MISS">MISS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold mb-1">First Name</label>
                        <input
                          type="text"
                          value={pax.FirstName}
                          onChange={(e) =>
                            updatePaxField(idx, 'FirstName', e.target.value.toUpperCase())
                          }
                          placeholder="First Name"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Last Name</label>
                        <input
                          type="text"
                          value={pax.LastName}
                          onChange={(e) =>
                            updatePaxField(idx, 'LastName', e.target.value.toUpperCase())
                          }
                          placeholder="Last Name"
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Gender</label>
                        <select
                          value={pax.Gender}
                          onChange={(e) => updatePaxField(idx, 'Gender', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                      <div>
                        <label className="block font-bold mb-1">Nationality</label>
                        <input
                          type="text"
                          value={pax.Nationality}
                          onChange={(e) =>
                            updatePaxField(idx, 'Nationality', e.target.value.toUpperCase())
                          }
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">DOB</label>
                        <input
                          type="date"
                          value={pax.DOB}
                          onChange={(e) => updatePaxField(idx, 'DOB', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Passport Number</label>
                        <input
                          type="text"
                          value={pax.PassportNumber}
                          onChange={(e) =>
                            updatePaxField(idx, 'PassportNumber', e.target.value.toUpperCase())
                          }
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Passport Issue</label>
                        <input
                          type="date"
                          value={pax.PassportIssueDate}
                          onChange={(e) =>
                            updatePaxField(idx, 'PassportIssueDate', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">Passport Expiry</label>
                        <input
                          type="date"
                          value={pax.PassportExpiryDate}
                          onChange={(e) =>
                            updatePaxField(idx, 'PassportExpiryDate', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl border border-neutral-300"
                        />
                      </div>
                    </div>

                    {isPassportExpiredBeforeReturn && (
                      <div className="text-red-600 font-bold text-xs flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Passport will be expired at the time of your return flight.</span>
                      </div>
                    )}

                    {/* Upload / Remove Passport */}
                    <div className="flex items-center gap-2 pt-1">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFF7ED] border border-[#EE8200]/20 text-[#EE8200] font-bold hover:bg-[#EE8200] hover:text-white transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Passport</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png"
                          onChange={(e) => handlePassportUpload(idx, e.target.files?.[0])}
                          className="hidden"
                        />
                      </label>
                      {pax.PassportImageName && (
                        <button
                          type="button"
                          onClick={() => {
                            updatePaxField(idx, 'PassportImageName', '');
                            updatePaxField(idx, 'PassportFileData', '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold text-[11px]"
                        >
                          Remove Passport
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT 4 COLUMNS: Sticky Fare Summary Card (Matches Fare Summary in FlightPOS.razor) */}
        <div className="lg:col-span-4 sticky top-24">
          <div className="bg-white rounded-2xl border border-[#EE8200]/20 shadow-executive overflow-hidden">
            <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between">
              <h5 className="font-display font-bold text-base">Fare Summary</h5>
              <Calculator className="w-5 h-5 text-white/80" />
            </div>

            <div className="p-6 space-y-5 text-xs">
              {/* Adult Breakdown */}
              <div className="space-y-1.5 pb-4 border-b border-neutral-200">
                <h6 className="font-bold text-sm text-[#EE8200]">Adult</h6>
                <div className="flex justify-between text-neutral-600">
                  <span>Base Fare:</span>
                  <span className="font-mono">{formatCurrencyPKR(fareBreakdown.adtBasic)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Tax:</span>
                  <span className="font-mono">{formatCurrencyPKR(fareBreakdown.adtTax)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Price:</span>
                  <span className="font-mono font-semibold">
                    {formatCurrencyPKR(fareBreakdown.adtPrice)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>No. of Adults:</span>
                  <span className="font-mono font-bold">{adultsCount}</span>
                </div>
                <div className="flex justify-between font-bold text-[#0B0A09] pt-1">
                  <span>Total:</span>
                  <span className="font-mono text-[#EE8200]">
                    {formatCurrencyPKR(fareBreakdown.adtTotal)}
                  </span>
                </div>
              </div>

              {/* Child Breakdown */}
              {childrenCount > 0 && (
                <div className="space-y-1.5 pb-4 border-b border-neutral-200">
                  <h6 className="font-bold text-sm text-[#EE8200]">Child</h6>
                  <div className="flex justify-between text-neutral-600">
                    <span>Base Fare:</span>
                    <span className="font-mono">{formatCurrencyPKR(fareBreakdown.cnnBasic)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tax:</span>
                    <span className="font-mono">{formatCurrencyPKR(fareBreakdown.cnnTax)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>No. of Children:</span>
                    <span className="font-mono font-bold">{childrenCount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#0B0A09] pt-1">
                    <span>Total:</span>
                    <span className="font-mono text-[#EE8200]">
                      {formatCurrencyPKR(fareBreakdown.cnnTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Infant Breakdown */}
              {infantsCount > 0 && (
                <div className="space-y-1.5 pb-4 border-b border-neutral-200">
                  <h6 className="font-bold text-sm text-[#EE8200]">Infant</h6>
                  <div className="flex justify-between text-neutral-600">
                    <span>Base Fare:</span>
                    <span className="font-mono">{formatCurrencyPKR(fareBreakdown.infBasic)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>Tax:</span>
                    <span className="font-mono">{formatCurrencyPKR(fareBreakdown.infTax)}</span>
                  </div>
                  <div className="flex justify-between text-neutral-600">
                    <span>No. of Infant:</span>
                    <span className="font-mono font-bold">{infantsCount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#0B0A09] pt-1">
                    <span>Total:</span>
                    <span className="font-mono text-[#EE8200]">
                      {formatCurrencyPKR(fareBreakdown.infTotal)}
                    </span>
                  </div>
                </div>
              )}

              {/* Grand Total */}
              <div className="p-4 rounded-xl bg-[#FFF7ED] border border-[#EE8200]/20 flex items-center justify-between">
                <span className="font-display font-extrabold text-base text-[#0B0A09]">
                  Grand Total:
                </span>
                <span className="font-mono font-extrabold text-lg text-[#EE8200]">
                  {formatCurrencyPKR(fareBreakdown.grandTotal)}
                </span>
              </div>

              <button
                type="button"
                disabled={submitting}
                onClick={handleBookNow}
                className="w-full py-3.5 px-6 rounded-xl bg-[#EE8200] hover:bg-black text-white font-bold text-sm transition shadow-lg cursor-pointer"
              >
                {submitting ? 'Creating PNR...' : 'Book Now'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
