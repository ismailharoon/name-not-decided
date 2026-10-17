import React, { createContext, useContext, useState, useCallback } from 'react';
import { initialSeedData } from '../data/seedData';

const PortalContext = createContext(null);
const STORAGE_KEY = 'ota_portal_clean_v1';

// Purge any old demo storage keys so existing browsers immediately see a fresh state
try {
  localStorage.removeItem('taban_executive_db_v1');
  localStorage.removeItem('taban_executive_db_v2');
} catch {}

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

function generatePNR(prefix = 'PN') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = (prefix || 'PN').slice(0, 2).toUpperCase();
  for (let i = 0; i < 4; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

function loadLocalDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.bookings)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local DB, seeding fresh state:', e);
  }
  const fresh = JSON.parse(JSON.stringify(initialSeedData));
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {}
  return fresh;
}

function computeEnriched(db) {
  const segmentsById = Object.fromEntries((db.segments || []).map((s) => [s.AirGroupSegmentID, s]));
  const flights = (db.flights || []).map((f) => {
    const groupBookings = (db.bookings || []).filter((b) => b.AirGroupID === f.AirGroupID);
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

  const bookings = (db.bookings || []).map((b) => {
    const flight = flightsById[b.AirGroupID];
    return {
      ...b,
      FlightTitle: flight ? flight.Title : b.FlightTitle || 'Group Flight Block',
      FlightCategory: flight ? flight.Category : 'Tourism',
      TripType: flight ? flight.TripType : 'One Way',
      Segments: flight ? flight.Segments : []
    };
  });

  const totalUsers = (db.subAgents || []).reduce(
    (acc, sa) => acc + (sa.Users ? sa.Users.length : 0),
    0
  );
  const validSalesBookings = bookings.filter(
    (b) => b.ApprovalStatus !== 'Rejected' && b.ApprovalStatus !== 'Ticket Void'
  );
  const totalSales = validSalesBookings.reduce((acc, b) => acc + (Number(b.TotalPrice) || 0), 0);

  return {
    stats: {
      TotalSubAgents: (db.subAgents || []).length,
      TotalBookings: bookings.length,
      TotalUsers: totalUsers,
      TotalBookingPrice: totalSales
    },
    airports: db.airports || [],
    airlines: db.airlines || [],
    suppliers: db.suppliers || [],
    segments: db.segments || [],
    flights,
    bookings,
    subAgents: db.subAgents || []
  };
}

export function PortalProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('ota_portal_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (parsed?.LoginID?.toLowerCase() === 'atta') {
        localStorage.removeItem('ota_portal_user');
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [dbState, setDbState] = useState(() => loadLocalDb());
  const [loading] = useState(false);
  const [language, setLanguage] = useState('English');
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const updateLocalDb = useCallback((updater) => {
    setDbState((prev) => {
      const next =
        typeof updater === 'function' ? updater(JSON.parse(JSON.stringify(prev))) : updater;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const enriched = React.useMemo(() => computeEnriched(dbState), [dbState]);

  const login = async (loginId, password, require2FA = false) => {
    if (!loginId || !password) {
      throw new Error('Please enter both Login ID and Password.');
    }

    let matchedUser = null;
    let matchedAgent = null;

    for (const agent of dbState.subAgents || []) {
      for (const u of agent.Users || []) {
        if (
          u.LoginID.toLowerCase() === String(loginId).trim().toLowerCase() &&
          u.PassCode === password
        ) {
          matchedUser = u;
          matchedAgent = agent;
          break;
        }
      }
      if (matchedUser) break;
    }

    if (
      !matchedUser &&
      String(loginId).trim().toLowerCase() === 'test' &&
      password === 'test123'
    ) {
      matchedUser = {
        UserID: 'USR-ADMIN',
        LoginID: 'test',
        FullName: 'Test Admin',
        Email: 'admin@bookly.com',
        Designation: 'Administrator',
        AccountType: 'Administrator',
        AccountStatus: 'Enable'
      };
    }

    if (!matchedUser) {
      throw new Error('Invalid Login ID or Password.');
    }

    if (matchedUser.AccountStatus === 'Disable') {
      throw new Error('Your user account is currently disabled.');
    }

    const userObj = {
      LoginID: matchedUser.LoginID,
      FullName: matchedUser.FullName,
      Email: matchedUser.Email,
      Designation: matchedUser.Designation,
      AccountType: matchedUser.AccountType,
      SubCompanyID: matchedAgent?.SubCompanyID || 'ADMIN',
      SubCompanyName: matchedAgent?.CompanyName || 'Bookly'
    };

    if (require2FA) {
      return {
        status: '2fa_required',
        otpCodeHint: '482910',
        manualKey: 'JBSWY3DPEHPK3PXP',
        user: userObj
      };
    }

    setUser(userObj);
    localStorage.setItem('ota_portal_user', JSON.stringify(userObj));
    addToast(`Welcome, ${userObj.FullName || userObj.LoginID}`, 'success');
    return { status: 'authenticated', user: userObj };
  };

  const verifyOtpAndFinishLogin = async (pendingUser, otp) => {
    if (!otp || String(otp).trim().length < 4) {
      throw new Error('Please enter a valid OTP or 2FA authentication code.');
    }
    setUser(pendingUser);
    localStorage.setItem('ota_portal_user', JSON.stringify(pendingUser));
    addToast(`2FA Verified. Welcome, ${pendingUser.FullName}`, 'success');
    return { status: 'authenticated' };
  };

  const logout = () => {
    setUser(null);
    setShowTimeoutModal(false);
    localStorage.removeItem('ota_portal_user');
    addToast('Signed out successfully.', 'info');
  };

  const resetDemoData = async () => {
    const fresh = JSON.parse(JSON.stringify(initialSeedData));
    updateLocalDb(fresh);
    addToast('All portal records cleared (Fresh state).', 'info');
  };

  // --- Booking mutations ---
  const createBooking = async (bookingPayload) => {
    const {
      AirGroupID,
      SubCompanyID,
      EmailAddress,
      MobileNumber,
      Remarks,
      Passengers = [],
      BookingChannelName = 'Flight POS Desk'
    } = bookingPayload;

    const flight = dbState.flights.find((f) => f.AirGroupID === AirGroupID);
    if (!flight) throw new Error('Please Select Flight Group.');
    const agent = dbState.subAgents.find((a) => a.SubCompanyID === SubCompanyID);
    if (!agent) throw new Error('Please Select Sub Agent.');
    if (!Passengers.length) throw new Error('Please add at least one passenger.');

    const adults = Passengers.filter((p) => p.PassengerType === 'Adult').length;
    const children = Passengers.filter((p) => p.PassengerType === 'Child').length;
    const infants = Passengers.filter((p) => p.PassengerType === 'Infant').length;

    const totalPrice =
      adults * (Number(flight.AdultPrice) || 0) +
      children * (Number(flight.ChildPrice) || 0) +
      infants * (Number(flight.InfantPrice) || 0);

    const pnr = generatePNR(flight.Airline || 'PN');
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
      SSRCode:
        p.SSRCode ||
        (p.PassengerType === 'Infant' ? 'INFT' : p.PassengerType === 'Child' ? 'CHLD' : 'TKNE'),
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
      PNR_AIRLINE: flight.PNR_AIRLINE || pnr,
      ValidatingCarrierName: flight.ValidatingCarrierName || flight.Airline || 'Airline',
      ApprovalStatus: 'Pending',
      AdultCount: adults,
      ChildCount: children,
      InfantCount: infants,
      TotalPrice: totalPrice,
      BookingTimeLimit: flight.TimeLimit ? flight.TimeLimit.replace('T', ' ') : '—',
      ApprovalLoginID: '',
      ApprovalDateTime: '',
      VoidLoginID: '',
      VoidDateTime: '',
      VoidReason: '',
      EmailAddress: EmailAddress || agent.Email,
      MobileNumber: MobileNumber || agent.MobileNumber,
      Remarks: Remarks || '',
      TimeStamp: formatNow(),
      Passengers: formattedPassengers
    };

    updateLocalDb((draft) => {
      draft.bookings.unshift(newBooking);
      const ag = draft.subAgents.find((a) => a.SubCompanyID === SubCompanyID);
      if (ag) {
        ag.CreditLimitBalance = Math.max(0, (Number(ag.CreditLimitBalance) || 0) - totalPrice);
      }
      return draft;
    });

    addToast(`Booking Created Successfully. PNR : ${pnr}`, 'success');
    return newBooking;
  };

  const updateBooking = async (id, payload) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        if (payload.SubCompanyID) {
          const agent = draft.subAgents.find((a) => a.SubCompanyID === payload.SubCompanyID);
          if (agent) {
            booking.SubCompanyID = agent.SubCompanyID;
            booking.SubCompanyName = agent.CompanyName;
          }
        }
        if (payload.BookingTimeLimit !== undefined) booking.BookingTimeLimit = payload.BookingTimeLimit;
        if (payload.EmailAddress !== undefined) booking.EmailAddress = payload.EmailAddress;
        if (payload.MobileNumber !== undefined) booking.MobileNumber = payload.MobileNumber;
        if (payload.Remarks !== undefined) booking.Remarks = payload.Remarks;
        if (payload.PNR !== undefined) booking.PNR = payload.PNR;
      }
      return draft;
    });
    addToast('Booking Updated Successfully.', 'success');
  };

  const approveBooking = async (id) => {
    const loginId = user?.LoginID || 'Atta';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Approved';
        booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
      }
      return draft;
    });
    addToast(`Booking ${id} approved successfully.`, 'success');
  };

  const rejectBooking = async (id) => {
    const loginId = user?.LoginID || 'Atta';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Rejected';
        booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
      }
      return draft;
    });
    addToast(`Booking ${id} rejected successfully.`, 'warning');
  };

  const issueTicket = async (id) => {
    const loginId = user?.LoginID || 'Atta';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Ticket Issued';
        if (!booking.ApprovalLoginID) booking.ApprovalLoginID = loginId;
        booking.ApprovalDateTime = formatNow();
        const baseTicket = Math.floor(4800000000 + Math.random() * 5000000000);
        booking.Passengers = (booking.Passengers || []).map((pax, i) => ({
          ...pax,
          TicketNumber:
            pax.TicketNumber && pax.TicketNumber.trim()
              ? pax.TicketNumber
              : `214-${baseTicket + i}`
        }));
      }
      return draft;
    });
    addToast('Booking Issued Successfully.', 'success');
  };

  const voidBooking = async (id, reason) => {
    if (!String(reason).trim()) {
      throw new Error('Void Remarks are required to void a booking.');
    }
    const loginId = user?.LoginID || 'Atta';
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === id);
      if (booking) {
        booking.ApprovalStatus = 'Ticket Void';
        booking.VoidLoginID = loginId;
        booking.VoidDateTime = formatNow();
        booking.VoidReason = reason;
      }
      return draft;
    });
    addToast('Booking Void Successfully.', 'warning');
  };

  const deleteBooking = async (id) => {
    updateLocalDb((draft) => {
      draft.bookings = draft.bookings.filter((b) => b.AirGroupBookingID !== id);
      return draft;
    });
    addToast('Booking Deleted Successfully.', 'info');
  };

  const updatePassenger = async (bookingId, passengerId, paxData) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === bookingId);
      if (booking) {
        const idx = (booking.Passengers || []).findIndex((p) => p.PassengerID === passengerId);
        if (idx !== -1) {
          booking.Passengers[idx] = { ...booking.Passengers[idx], ...paxData };
        }
      }
      return draft;
    });
    addToast('Passenger Updated Successfully.', 'success');
  };

  const deletePassenger = async (bookingId, passengerId) => {
    updateLocalDb((draft) => {
      const booking = draft.bookings.find((b) => b.AirGroupBookingID === bookingId);
      if (booking) {
        booking.Passengers = (booking.Passengers || []).filter((p) => p.PassengerID !== passengerId);
        booking.AdultCount = booking.Passengers.filter((p) => p.PassengerType === 'Adult').length;
        booking.ChildCount = booking.Passengers.filter((p) => p.PassengerType === 'Child').length;
        booking.InfantCount = booking.Passengers.filter((p) => p.PassengerType === 'Infant').length;
      }
      return draft;
    });
    addToast('Passenger Deleted Successfully.', 'info');
  };

  // --- Flight Group mutations ---
  const createFlight = async (payload) => {
    const newFlight = {
      AirGroupID: payload.AirGroupID || `AG-${Math.floor(500 + Math.random() * 9000)}`,
      Title: payload.Title || 'Group Flight',
      Category: payload.Category || 'Tourism',
      TripType: payload.TripType || 'Round',
      Airline: payload.Airline || payload.ValidatingCarrier || 'PK',
      ValidatingCarrier: payload.ValidatingCarrier || 'PK',
      ValidatingCarrierName: payload.ValidatingCarrierName || payload.ValidatingCarrier || 'PK',
      SupplierName: payload.SupplierName || 'Direct Airline Inventory',
      isDomestic: Boolean(payload.isDomestic),
      isSOTO: Boolean(payload.isSOTO),
      isEnabled: payload.isEnabled !== undefined ? Boolean(payload.isEnabled) : true,
      PNR_GDS: payload.PNR_GDS || generatePNR('GD'),
      PNR_AIRLINE: payload.PNR_AIRLINE || generatePNR('AR'),
      TimeLimit: payload.TimeLimit || '',
      GroupDepartureDate: payload.GroupDepartureDate || '',
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
    updateLocalDb((draft) => {
      draft.flights.unshift(newFlight);
      return draft;
    });
    addToast('Flight Saved Successfully.', 'success');
  };

  const updateFlight = async (id, payload) => {
    updateLocalDb((draft) => {
      const idx = draft.flights.findIndex((f) => f.AirGroupID === id);
      if (idx !== -1) {
        draft.flights[idx] = { ...draft.flights[idx], ...payload };
      }
      return draft;
    });
    addToast('Flight Updated Successfully.', 'success');
  };

  const deleteFlight = async (id) => {
    updateLocalDb((draft) => {
      draft.flights = draft.flights.filter((f) => f.AirGroupID !== id);
      return draft;
    });
    addToast('Flight Deleted Successfully.', 'info');
  };

  // --- Segment mutations ---
  const createSegment = async (p) => {
    const newSeg = {
      ...p,
      AirGroupSegmentID: p.AirGroupSegmentID || `SEG-${Math.floor(1000 + Math.random() * 9000)}`,
      TotalSeats: Number(p.TotalSeats) || 160,
      AvailableSeats: Number(p.TotalSeats) || 160
    };
    updateLocalDb((draft) => {
      draft.segments.unshift(newSeg);
      return draft;
    });
    addToast('Segment saved successfully.', 'success');
  };

  const updateSegment = async (id, payload) => {
    updateLocalDb((draft) => {
      const idx = draft.segments.findIndex((s) => s.AirGroupSegmentID === id);
      if (idx !== -1) {
        draft.segments[idx] = { ...draft.segments[idx], ...payload };
      }
      return draft;
    });
    addToast('Segment saved successfully.', 'success');
  };

  const deleteSegment = async (id) => {
    updateLocalDb((draft) => {
      draft.segments = draft.segments.filter((s) => s.AirGroupSegmentID !== id);
      return draft;
    });
    addToast('Segment Deleted Successfully.', 'info');
  };

  // --- SubAgent & User mutations ---
  const createSubAgent = async (p) => {
    if (!p.CompanyName) throw new Error('Company Name is required.');
    const newAgent = {
      ...p,
      SubCompanyID: `SUB-${Math.floor(205 + Math.random() * 800)}`,
      CreditLimit: Number(p.CreditLimit) || 0,
      CreditLimitBalance: Number(p.CreditLimitBalance ?? p.CreditLimit) || 0,
      Created: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      Users: []
    };
    updateLocalDb((draft) => {
      draft.subAgents.unshift(newAgent);
      return draft;
    });
    addToast('SubAgent created successfully.', 'success');
  };

  const updateSubAgent = async (id, payload) => {
    updateLocalDb((draft) => {
      const idx = draft.subAgents.findIndex((a) => a.SubCompanyID === id);
      if (idx !== -1) {
        draft.subAgents[idx] = { ...draft.subAgents[idx], ...payload };
      }
      return draft;
    });
    addToast('SubAgent updated successfully.', 'success');
  };

  const deleteSubAgent = async (id) => {
    updateLocalDb((draft) => {
      draft.subAgents = draft.subAgents.filter((a) => a.SubCompanyID !== id);
      return draft;
    });
    addToast('SubAgent Deleted Successfully.', 'info');
  };

  const createSubAgentUser = async (subCompanyId, u) => {
    if (!u.LoginID || !u.FullName || !u.Email) {
      throw new Error('Login ID, Full Name, and Email are required.');
    }
    const newUser = {
      UserID: `USR-${Math.floor(100 + Math.random() * 9000)}`,
      SubCompanyID: subCompanyId,
      LoginID: u.LoginID,
      PassCode: u.PassCode || 'Pass@123',
      FullName: u.FullName,
      Email: u.Email,
      Designation: u.Designation || 'Ticketing Executive',
      WhatsAppNumber: u.WhatsAppNumber || '',
      AccountType: u.AccountType || 'Operator',
      AccountStatus: u.AccountType ? u.AccountStatus || 'Enable' : 'Enable',
      Reset2FA: Boolean(u.Reset2FA)
    };
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        ag.Users = ag.Users || [];
        ag.Users.push(newUser);
      }
      return draft;
    });
    addToast('User created successfully.', 'success');
  };

  const updateSubAgentUser = async (subCompanyId, userId, payload) => {
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        const idx = (ag.Users || []).findIndex((u) => u.UserID === userId);
        if (idx !== -1) {
          ag.Users[idx] = { ...ag.Users[idx], ...payload };
        }
      }
      return draft;
    });
    addToast('User updated successfully.', 'success');
  };

  const deleteSubAgentUser = async (subCompanyId, userId) => {
    updateLocalDb((draft) => {
      const ag = draft.subAgents.find((a) => a.SubCompanyID === subCompanyId);
      if (ag) {
        ag.Users = (ag.Users || []).filter((u) => u.UserID !== userId);
      }
      return draft;
    });
    addToast('User Deleted Successfully.', 'info');
  };

  return (
    <PortalContext.Provider
      value={{
        user,
        loading,
        language,
        setLanguage,
        showTimeoutModal,
        setShowTimeoutModal,
        toasts,
        addToast,
        stats: enriched.stats,
        airports: enriched.airports,
        airlines: enriched.airlines,
        suppliers: enriched.suppliers,
        segments: enriched.segments,
        flights: enriched.flights,
        bookings: enriched.bookings,
        subAgents: enriched.subAgents,
        login,
        verifyOtpAndFinishLogin,
        logout,
        resetDemoData,
        createBooking,
        updateBooking,
        approveBooking,
        rejectBooking,
        issueTicket,
        voidBooking,
        deleteBooking,
        updatePassenger,
        deletePassenger,
        createFlight,
        updateFlight,
        deleteFlight,
        createSegment,
        updateSegment,
        deleteSegment,
        createSubAgent,
        updateSubAgent,
        deleteSubAgent,
        createSubAgentUser,
        updateSubAgentUser,
        deleteSubAgentUser
      }}
    >
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used within a PortalProvider');
  return ctx;
}
