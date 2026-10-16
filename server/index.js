import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initialSeedData } from './seedData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to read db.json, re-seeding:', err.message);
  }
  const cloned = JSON.parse(JSON.stringify(initialSeedData));
  fs.writeFileSync(DB_FILE, JSON.stringify(cloned, null, 2), 'utf-8');
  return cloned;
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

let db = loadDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

function formatNow() {
  const d = new Date();
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function generatePNR(prefix = 'TB') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = prefix;
  for (let i = 0; i < 4; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function enrichData() {
  const segmentsById = Object.fromEntries(db.segments.map((s) => [s.AirGroupSegmentID, s]));
  const flights = db.flights.map((f) => {
    const groupBookings = db.bookings.filter((b) => b.AirGroupID === f.AirGroupID);
    const activeBookings = groupBookings.filter(
      (b) => b.ApprovalStatus !== 'Rejected' && b.ApprovalStatus !== 'Ticket Void'
    );
    const bookedSeats = activeBookings.reduce(
      (sum, b) => sum + (Number(b.AdultCount) || 0) + (Number(b.ChildCount) || 0),
      0
    );
    const pendingCount = groupBookings.filter((b) => b.ApprovalStatus === 'Pending').length;
    const attachedSegments = (f.SegmentIDs || [])
      .map((id) => segmentsById[id])
      .filter(Boolean);
    const firstSeg = attachedSegments[0];
    return {
      ...f,
      GroupDepartureDate: firstSeg ? firstSeg.DepartureDate : f.GroupDepartureDate,
      GroupDepartureIata: firstSeg ? firstSeg.DepartureIata : f.GroupDepartureIata,
      TotalSeatsSegment: f.TotalSeats,
      SeatsLeft: Math.max(0, (Number(f.TotalSeats) || 0) - bookedSeats),
      TotalBookings: groupBookings.length,
      ApprovalPending: pendingCount,
      Segments: attachedSegments
    };
  });

  const flightsById = Object.fromEntries(flights.map((f) => [f.AirGroupID, f]));

  const bookings = db.bookings.map((b) => {
    const flight = flightsById[b.AirGroupID];
    return {
      ...b,
      FlightTitle: flight ? flight.Title : 'Custom Charter Block',
      FlightCategory: flight ? flight.Category : 'Tourism',
      TripType: flight ? flight.TripType : 'One Way',
      Segments: flight ? flight.Segments : []
    };
  });

  const totalUsers = db.subAgents.reduce((acc, sa) => acc + (sa.Users ? sa.Users.length : 0), 0);
  const validSalesBookings = bookings.filter(
    (b) => b.ApprovalStatus !== 'Rejected' && b.ApprovalStatus !== 'Ticket Void'
  );
  const totalSales = validSalesBookings.reduce((acc, b) => acc + (Number(b.TotalPrice) || 0), 0);

  return {
    stats: {
      TotalSubAgents: db.subAgents.length,
      TotalBookings: bookings.length,
      TotalUsers: totalUsers,
      TotalBookingPrice: totalSales
    },
    airports: db.airports,
    airlines: db.airlines,
    suppliers: db.suppliers,
    segments: db.segments,
    flights,
    bookings,
    subAgents: db.subAgents
  };
}

// --- AUTHENTICATION ---
app.post('/api/auth/login', (req, res) => {
  const { loginId, password, require2FA } = req.body;
  if (!loginId || !password) {
    return res.status(400).json({ message: 'Please enter both Login ID and Password.' });
  }

  let matchedUser = null;
  let matchedAgent = null;

  for (const agent of db.subAgents) {
    for (const u of agent.Users || []) {
      if (u.LoginID.toLowerCase() === String(loginId).trim().toLowerCase() && u.PassCode === password) {
        matchedUser = u;
        matchedAgent = agent;
        break;
      }
    }
    if (matchedUser) break;
  }

  // Fallback master check for Atta / GhC@*589
  if (!matchedUser && String(loginId).trim().toLowerCase() === 'atta' && password === 'GhC@*589') {
    matchedAgent = db.subAgents[0];
    matchedUser = {
      UserID: 'USR-101',
      LoginID: 'Atta',
      FullName: 'Atta Ur Rehman',
      Email: 'atta@smartmovesl.com',
      Designation: 'Director Group Operations',
      AccountType: 'Administrator',
      AccountStatus: 'Enable'
    };
  }

  if (!matchedUser) {
    return res.status(401).json({ message: 'Invalid Login ID or Password.' });
  }

  if (matchedUser.AccountStatus === 'Disable') {
    return res.status(403).json({ message: 'Your user account is currently disabled.' });
  }

  if (require2FA) {
    return res.json({
      status: '2fa_required',
      otpCodeHint: '482910',
      manualKey: 'JBSWY3DPEHPK3PXP',
      user: {
        LoginID: matchedUser.LoginID,
        FullName: matchedUser.FullName,
        Email: matchedUser.Email,
        Designation: matchedUser.Designation,
        AccountType: matchedUser.AccountType,
        SubCompanyID: matchedAgent?.SubCompanyID || 'SUB-201',
        SubCompanyName: matchedAgent?.CompanyName || 'Taban Executive HQ'
      }
    });
  }

  return res.json({
    status: 'authenticated',
    token: `jwt-taban-${Date.now()}`,
    user: {
      LoginID: matchedUser.LoginID,
      FullName: matchedUser.FullName,
      Email: matchedUser.Email,
      Designation: matchedUser.Designation,
      AccountType: matchedUser.AccountType,
      SubCompanyID: matchedAgent?.SubCompanyID || 'SUB-201',
      SubCompanyName: matchedAgent?.CompanyName || 'Taban Executive HQ'
    }
  });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { loginId, otp } = req.body;
  if (!otp || String(otp).trim().length < 4) {
    return res.status(400).json({ message: 'Please enter a valid OTP or 2FA authentication code.' });
  }
  return res.json({
    status: 'authenticated',
    token: `jwt-taban-2fa-${Date.now()}`,
    loginId
  });
});

// --- BOOTSTRAP DATA ---
app.get('/api/bootstrap', (req, res) => {
  res.json(enrichData());
});

app.post('/api/reset-demo', (req, res) => {
  db = JSON.parse(JSON.stringify(initialSeedData));
  saveDb(db);
  res.json({ message: 'Demo database restored to initial state.', data: enrichData() });
});

// --- BOOKINGS ENDPOINTS ---
app.post('/api/bookings', (req, res) => {
  const {
    AirGroupID,
    SubCompanyID,
    EmailAddress,
    MobileNumber,
    Remarks,
    Passengers = [],
    BookingChannelName = 'Flight POS Desk'
  } = req.body;

  const flight = db.flights.find((f) => f.AirGroupID === AirGroupID);
  if (!flight) {
    return res.status(400).json({ message: 'Please Select Flight Group.' });
  }
  const agent = db.subAgents.find((a) => a.SubCompanyID === SubCompanyID);
  if (!agent) {
    return res.status(400).json({ message: 'Please Select Sub Agent.' });
  }
  if (!Passengers.length) {
    return res.status(400).json({ message: 'Please add at least one passenger.' });
  }

  const adults = Passengers.filter((p) => p.PassengerType === 'Adult').length;
  const children = Passengers.filter((p) => p.PassengerType === 'Child').length;
  const infants = Passengers.filter((p) => p.PassengerType === 'Infant').length;

  const totalPrice =
    adults * (Number(flight.AdultPrice) || 0) +
    children * (Number(flight.ChildPrice) || 0) +
    infants * (Number(flight.InfantPrice) || 0);

  const pnr = generatePNR(flight.Airline || 'TB');
  const bookingId = `BK-${Math.floor(10000 + Math.random() * 90000)}`;

  const formattedPassengers = Passengers.map((p, idx) => ({
    PassengerID: p.PassengerID || `PAX-${Date.now()}-${idx + 1}`,
    PassengerType: p.PassengerType || 'Adult',
    Title: p.Title || 'MR',
    FirstName: (p.FirstName || 'NTBA').toUpperCase(),
    LastName: (p.LastName || 'NTBA').toUpperCase(),
    PersianFirstName: p.PersianFirstName || '',
    PersianLastName: p.PersianLastName || '',
    Gender: p.Gender || (p.Title === 'MRS' || p.Title === 'MISS' ? 'Female' : 'Male'),
    DOB: p.DOB || '1990-01-01',
    Nationality: (p.Nationality || 'PAK').toUpperCase(),
    NationalId: p.NationalId || '',
    PassportNumber: (p.PassportNumber || 'NTBA').toUpperCase(),
    PassportIssueDate: p.PassportIssueDate || '2024-01-01',
    PassportExpiryDate: p.PassportExpiryDate || '2029-01-01',
    TicketNumber: p.TicketNumber || '',
    WithAdult: p.WithAdult || '',
    SSRCode: p.SSRCode || (p.PassengerType === 'Infant' ? 'INFT' : p.PassengerType === 'Child' ? 'CHLD' : 'TKNE'),
    PassportImageName: p.PassportImageName || '',
    PassportFileData: p.PassportFileData || ''
  }));

  const newBooking = {
    AirGroupBookingID: bookingId,
    AirGroupID: flight.AirGroupID,
    SubCompanyID: agent.SubCompanyID,
    SubCompanyName: agent.CompanyName,
    BookingChannelName,
    PNR: pnr,
    PNR_AIRLINE: flight.PNR_AIRLINE || `${flight.Airline || 'HH'}882MX`,
    ValidatingCarrierName: flight.ValidatingCarrierName || `${flight.Airline || 'HH'} Airlines`,
    ApprovalStatus: 'Pending',
    AdultCount: adults,
    ChildCount: children,
    InfantCount: infants,
    TotalPrice: totalPrice,
    BookingTimeLimit: flight.TimeLimit ? flight.TimeLimit.replace('T', ' ') : '2026-11-25 18:00',
    ApprovalLoginID: '',
    ApprovalDateTime: '',
    VoidLoginID: '',
    VoidDateTime: '',
    VoidReason: '',
    EmailAddress: EmailAddress || agent.Email,
    MobileNumber: MobileNumber || agent.MobileNumber,
    Remarks: Remarks || 'Booked via Flight POS',
    TimeStamp: formatNow(),
    Passengers: formattedPassengers
  };

  db.bookings.unshift(newBooking);
  agent.CreditLimitBalance = Math.max(0, (Number(agent.CreditLimitBalance) || 0) - totalPrice);
  saveDb(db);

  res.status(201).json({
    message: `Booking Created Successfully. PNR : ${pnr}`,
    booking: newBooking,
    data: enrichData()
  });
});

app.put('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  const { SubCompanyID, BookingTimeLimit, EmailAddress, MobileNumber, Remarks, PNR } = req.body;
  if (SubCompanyID) {
    const agent = db.subAgents.find((a) => a.SubCompanyID === SubCompanyID);
    if (agent) {
      booking.SubCompanyID = agent.SubCompanyID;
      booking.SubCompanyName = agent.CompanyName;
    }
  }
  if (BookingTimeLimit !== undefined) booking.BookingTimeLimit = BookingTimeLimit;
  if (EmailAddress !== undefined) booking.EmailAddress = EmailAddress;
  if (MobileNumber !== undefined) booking.MobileNumber = MobileNumber;
  if (Remarks !== undefined) booking.Remarks = Remarks;
  if (PNR !== undefined) booking.PNR = PNR;

  saveDb(db);
  res.json({ message: 'Booking Updated Successfully.', data: enrichData() });
});

app.post('/api/bookings/:id/approve', (req, res) => {
  const { id } = req.params;
  const { loginId = 'Atta' } = req.body;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.ApprovalStatus = 'Approved';
  booking.ApprovalLoginID = loginId;
  booking.ApprovalDateTime = formatNow();
  saveDb(db);
  res.json({ message: `Booking ${id} approved successfully.`, data: enrichData() });
});

app.post('/api/bookings/:id/reject', (req, res) => {
  const { id } = req.params;
  const { loginId = 'Atta' } = req.body;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.ApprovalStatus = 'Rejected';
  booking.ApprovalLoginID = loginId;
  booking.ApprovalDateTime = formatNow();
  saveDb(db);
  res.json({ message: `Booking ${id} rejected successfully.`, data: enrichData() });
});

app.post('/api/bookings/:id/issue', (req, res) => {
  const { id } = req.params;
  const { loginId = 'Atta' } = req.body;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.ApprovalStatus = 'Ticket Issued';
  if (!booking.ApprovalLoginID) booking.ApprovalLoginID = loginId;
  booking.ApprovalDateTime = formatNow();

  const baseTicket = Math.floor(4800000000 + Math.random() * 5000000000);
  booking.Passengers = (booking.Passengers || []).map((pax, i) => ({
    ...pax,
    TicketNumber: pax.TicketNumber && pax.TicketNumber.trim() ? pax.TicketNumber : `721-${baseTicket + i}`
  }));

  saveDb(db);
  res.json({ message: 'Booking Issued Successfully.', data: enrichData() });
});

app.post('/api/bookings/:id/void', (req, res) => {
  const { id } = req.params;
  const { loginId = 'Atta', reason = '' } = req.body;
  if (!String(reason).trim()) {
    return res.status(400).json({ message: 'Void Remarks are required to void a booking.' });
  }
  const booking = db.bookings.find((b) => b.AirGroupBookingID === id);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.ApprovalStatus = 'Ticket Void';
  booking.VoidLoginID = loginId;
  booking.VoidDateTime = formatNow();
  booking.VoidReason = reason;
  saveDb(db);
  res.json({ message: 'Booking Void Successfully.', data: enrichData() });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  db.bookings = db.bookings.filter((b) => b.AirGroupBookingID !== id);
  saveDb(db);
  res.json({ message: 'Booking Deleted Successfully.', data: enrichData() });
});

// --- PASSENGERS ENDPOINTS ---
app.put('/api/bookings/:bookingId/passengers/:passengerId', (req, res) => {
  const { bookingId, passengerId } = req.params;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  const idx = (booking.Passengers || []).findIndex((p) => p.PassengerID === passengerId);
  if (idx === -1) return res.status(404).json({ message: 'Passenger not found.' });

  booking.Passengers[idx] = {
    ...booking.Passengers[idx],
    ...req.body
  };
  saveDb(db);
  res.json({ message: 'Passenger Updated Successfully.', data: enrichData() });
});

app.delete('/api/bookings/:bookingId/passengers/:passengerId', (req, res) => {
  const { bookingId, passengerId } = req.params;
  const booking = db.bookings.find((b) => b.AirGroupBookingID === bookingId);
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });

  booking.Passengers = (booking.Passengers || []).filter((p) => p.PassengerID !== passengerId);
  booking.AdultCount = booking.Passengers.filter((p) => p.PassengerType === 'Adult').length;
  booking.ChildCount = booking.Passengers.filter((p) => p.PassengerType === 'Child').length;
  booking.InfantCount = booking.Passengers.filter((p) => p.PassengerType === 'Infant').length;
  saveDb(db);
  res.json({ message: 'Passenger Deleted Successfully.', data: enrichData() });
});

// --- FLIGHTS (AIR GROUPS) ENDPOINTS ---
app.post('/api/flights', (req, res) => {
  const payload = req.body;
  const newFlight = {
    AirGroupID: payload.AirGroupID || `AG-${Math.floor(500 + Math.random() * 9000)}`,
    Title: payload.Title || 'New Group Charter Block',
    Category: payload.Category || 'Tourism',
    TripType: payload.TripType || 'Round',
    Airline: payload.Airline || payload.ValidatingCarrier || 'HH',
    ValidatingCarrier: payload.ValidatingCarrier || 'HH',
    ValidatingCarrierName: payload.ValidatingCarrierName || 'Taban Air (HH-721)',
    SupplierName: payload.SupplierName || 'Taban Aviation Charter Desk',
    isDomestic: Boolean(payload.isDomestic),
    isSOTO: Boolean(payload.isSOTO),
    isEnabled: payload.isEnabled !== undefined ? Boolean(payload.isEnabled) : true,
    PNR_GDS: payload.PNR_GDS || generatePNR('GD'),
    PNR_AIRLINE: payload.PNR_AIRLINE || generatePNR('HH'),
    TimeLimit: payload.TimeLimit || '2026-12-01T18:00:00',
    GroupDepartureDate: payload.GroupDepartureDate || '2026-12-05T08:00:00',
    GroupDepartureIata: payload.GroupDepartureIata || 'KHI',
    TotalSeats: Number(payload.TotalSeats) || 160,
    SeatsLeft: Number(payload.TotalSeats) || 160,
    AdultPrice: Number(payload.AdultPrice) || 0,
    AdultBasicFare: Number(payload.AdultBasicFare) || 0,
    AdultTax: Number(payload.AdultTax) || 0,
    ChildPrice: Number(payload.ChildPrice) || 0,
    ChildBasicFare: Number(payload.ChildBasicFare) || 0,
    ChildTax: Number(payload.ChildTax) || 0,
    InfantPrice: Number(payload.InfantPrice) || 0,
    InfantBasicFare: Number(payload.InfantBasicFare) || 0,
    InfantTax: Number(payload.InfantTax) || 0,
    SegmentIDs: Array.isArray(payload.SegmentIDs) ? payload.SegmentIDs : [],
    Timestamp: formatNow()
  };

  db.flights.unshift(newFlight);
  saveDb(db);
  res.status(201).json({ message: 'Flight Saved Successfully.', data: enrichData() });
});

app.put('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.flights.findIndex((f) => f.AirGroupID === id);
  if (idx === -1) return res.status(404).json({ message: 'Flight Group not found.' });

  db.flights[idx] = {
    ...db.flights[idx],
    ...req.body
  };
  saveDb(db);
  res.json({ message: 'Flight Updated Successfully.', data: enrichData() });
});

app.delete('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  db.flights = db.flights.filter((f) => f.AirGroupID !== id);
  saveDb(db);
  res.json({ message: 'Flight Deleted Successfully.', data: enrichData() });
});

// --- SEGMENTS ENDPOINTS ---
app.post('/api/segments', (req, res) => {
  const p = req.body;
  const newSeg = {
    AirGroupSegmentID: p.AirGroupSegmentID || `SEG-${Math.floor(1000 + Math.random() * 9000)}`,
    FlightNumber: p.FlightNumber || 'HH-7214',
    MarketingAirline: p.MarketingAirline || 'HH',
    OperatingAirline: p.OperatingAirline || 'HH',
    OperatingAirlineName: p.OperatingAirlineName || 'Taban Air',
    DepartureIata: p.DepartureIata || 'KHI',
    DepartureAirport: p.DepartureAirport || 'Jinnah International Airport',
    DepartureCity: p.DepartureCity || 'Karachi',
    DepartureCountry: p.DepartureCountry || 'Pakistan',
    DepartureDate: p.DepartureDate || '2026-12-01T06:00:00',
    ArrivalIata: p.ArrivalIata || 'IKA',
    ArrivalAirport: p.ArrivalAirport || 'Imam Khomeini International Airport',
    ArrivalCity: p.ArrivalCity || 'Tehran',
    ArrivalCountry: p.ArrivalCountry || 'Iran',
    ArrivalDate: p.ArrivalDate || '2026-12-01T08:30:00',
    TotalSeats: Number(p.TotalSeats) || 160,
    AvailableSeats: Number(p.TotalSeats) || 160,
    FlightClass: p.FlightClass || 'Economy',
    FlightClassCode: p.FlightClassCode || 'Y',
    FlightTime: p.FlightTime || '03h 30m',
    FlightMinutes: Number(p.FlightMinutes) || 210,
    LayoverDuration: Number(p.LayoverDuration) || 0,
    AirCraft: p.AirCraft || 'Boeing 737-400',
    Meal: p.Meal || 'Yes',
    AdultFareBasisCode: p.AdultFareBasisCode || 'Y26PK',
    ChildFareBasisCode: p.ChildFareBasisCode || 'CH26PK',
    InfantFareBasisCode: p.InfantFareBasisCode || 'IN26PK',
    BaggageTypeADT: p.BaggageTypeADT || 'Pieces',
    BaggageCountADT: p.BaggageCountADT || '1 PC (30 KG)',
    BaggageTypeCNN: p.BaggageTypeCNN || 'Pieces',
    BaggageCountCNN: p.BaggageCountCNN || '1 PC (20 KG)',
    BaggageTypeINF: p.BaggageTypeINF || 'Pieces',
    BaggageCountINF: p.BaggageCountINF || '1 PC (10 KG)',
    AdultPrice: Number(p.AdultPrice) || 0,
    AdultBasicFare: Number(p.AdultBasicFare) || 0,
    AdultTax: Number(p.AdultTax) || 0,
    ChildPrice: Number(p.ChildPrice) || 0,
    ChildBasicFare: Number(p.ChildBasicFare) || 0,
    ChildTax: Number(p.ChildTax) || 0,
    InfantPrice: Number(p.InfantPrice) || 0,
    InfantBasicFare: Number(p.InfantBasicFare) || 0,
    InfantTax: Number(p.InfantTax) || 0,
    AdultPriceSupplier: Number(p.AdultPriceSupplier) || 0,
    AdultBasicFareSupplier: Number(p.AdultBasicFareSupplier) || 0,
    AdultTaxSupplier: Number(p.AdultTaxSupplier) || 0,
    ChildPriceSupplier: Number(p.ChildPriceSupplier) || 0,
    ChildBasicFareSupplier: Number(p.ChildBasicFareSupplier) || 0,
    ChildTaxSupplier: Number(p.ChildTaxSupplier) || 0,
    InfantPriceSupplier: Number(p.InfantPriceSupplier) || 0,
    InfantBasicFareSupplier: Number(p.InfantBasicFareSupplier) || 0,
    InfantTaxSupplier: Number(p.InfantTaxSupplier) || 0
  };
  db.segments.unshift(newSeg);
  saveDb(db);
  res.status(201).json({ message: 'Segment saved successfully.', data: enrichData() });
});

app.put('/api/segments/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.segments.findIndex((s) => s.AirGroupSegmentID === id);
  if (idx === -1) return res.status(404).json({ message: 'Segment not found.' });

  db.segments[idx] = {
    ...db.segments[idx],
    ...req.body
  };
  saveDb(db);
  res.json({ message: 'Segment saved successfully.', data: enrichData() });
});

app.delete('/api/segments/:id', (req, res) => {
  const { id } = req.params;
  db.segments = db.segments.filter((s) => s.AirGroupSegmentID !== id);
  saveDb(db);
  res.json({ message: 'Segment Deleted Successfully.', data: enrichData() });
});

// --- SUB AGENTS & USERS ENDPOINTS ---
app.post('/api/subagents', (req, res) => {
  const p = req.body;
  if (!p.CompanyName) {
    return res.status(400).json({ message: 'Company Name is required.' });
  }
  const newAgent = {
    SubCompanyID: `SUB-${Math.floor(205 + Math.random() * 800)}`,
    CompanyName: p.CompanyName,
    City: p.City || 'Karachi',
    Country: p.Country || 'Pakistan',
    MobileNumber: p.MobileNumber || '',
    ContactNumber: p.ContactNumber || '',
    AccountStatus: p.AccountStatus || 'Enable',
    AccountType: p.AccountType || 'SubAgent',
    Address: p.Address || '',
    Email: p.Email || '',
    AccountsEmail: p.AccountsEmail || '',
    CreditLimit: Number(p.CreditLimit) || 5000000,
    CreditLimitBalance: Number(p.CreditLimitBalance ?? p.CreditLimit) || 5000000,
    VoidCharges: Number(p.VoidCharges) || 3500,
    VoidChargesSupplier: Number(p.VoidChargesSupplier) || 2000,
    UserCurrency: p.UserCurrency || 'PKR',
    PrimaryColor: p.PrimaryColor || '#331700',
    SecondaryColor: p.SecondaryColor || '#0B0A09',
    LightColor: p.LightColor || '#FAF6F2',
    SubDomain: p.SubDomain || '',
    FacebookLink: p.FacebookLink || '',
    TwitterLink: p.TwitterLink || '',
    InstagramLink: p.InstagramLink || '',
    AboutUs: p.AboutUs || '',
    CompanyHeaderLogo: p.CompanyHeaderLogo || '',
    CompanyFooterLogo: p.CompanyFooterLogo || '',
    CompanyFavIcon: p.CompanyFavIcon || '',
    CompanyBackPicture: p.CompanyBackPicture || '',
    Created: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    Users: []
  };
  db.subAgents.unshift(newAgent);
  saveDb(db);
  res.status(201).json({ message: 'SubAgent created successfully.', data: enrichData() });
});

app.put('/api/subagents/:id', (req, res) => {
  const { id } = req.params;
  const idx = db.subAgents.findIndex((a) => a.SubCompanyID === id);
  if (idx === -1) return res.status(404).json({ message: 'SubAgent not found.' });

  db.subAgents[idx] = {
    ...db.subAgents[idx],
    ...req.body
  };
  saveDb(db);
  res.json({ message: 'SubAgent updated successfully.', data: enrichData() });
});

app.delete('/api/subagents/:id', (req, res) => {
  const { id } = req.params;
  db.subAgents = db.subAgents.filter((a) => a.SubCompanyID !== id);
  saveDb(db);
  res.json({ message: 'SubAgent Deleted Successfully.', data: enrichData() });
});

app.post('/api/subagents/:id/users', (req, res) => {
  const { id } = req.params;
  const agent = db.subAgents.find((a) => a.SubCompanyID === id);
  if (!agent) return res.status(404).json({ message: 'SubAgent not found.' });

  const u = req.body;
  if (!u.LoginID || !u.FullName || !u.Email) {
    return res.status(400).json({ message: 'Login ID, Full Name, and Email are required.' });
  }
  const newUser = {
    UserID: `USR-${Math.floor(100 + Math.random() * 9000)}`,
    SubCompanyID: id,
    LoginID: u.LoginID,
    PassCode: u.PassCode || 'Pass@123',
    FullName: u.FullName,
    Email: u.Email,
    Designation: u.Designation || 'Ticketing Executive',
    WhatsAppNumber: u.WhatsAppNumber || '',
    AccountType: u.AccountType || 'Operator',
    AccountStatus: u.AccountStatus || 'Enable',
    Reset2FA: Boolean(u.Reset2FA)
  };
  agent.Users = agent.Users || [];
  agent.Users.push(newUser);
  saveDb(db);
  res.status(201).json({ message: 'User created successfully.', data: enrichData() });
});

app.put('/api/subagents/:id/users/:userId', (req, res) => {
  const { id, userId } = req.params;
  const agent = db.subAgents.find((a) => a.SubCompanyID === id);
  if (!agent) return res.status(404).json({ message: 'SubAgent not found.' });

  const idx = (agent.Users || []).findIndex((u) => u.UserID === userId);
  if (idx === -1) return res.status(404).json({ message: 'User not found.' });

  agent.Users[idx] = {
    ...agent.Users[idx],
    ...req.body
  };
  saveDb(db);
  res.json({ message: 'User updated successfully.', data: enrichData() });
});

app.delete('/api/subagents/:id/users/:userId', (req, res) => {
  const { id, userId } = req.params;
  const agent = db.subAgents.find((a) => a.SubCompanyID === id);
  if (!agent) return res.status(404).json({ message: 'SubAgent not found.' });

  agent.Users = (agent.Users || []).filter((u) => u.UserID !== userId);
  saveDb(db);
  res.json({ message: 'User Deleted Successfully.', data: enrichData() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`AeroCrown Executive Aviation API running on http://localhost:${PORT}`);
});
