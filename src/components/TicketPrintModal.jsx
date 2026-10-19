import React, { useRef } from 'react';
import { Printer, X } from 'lucide-react';

function extractTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) {
    const parts = String(dtStr).split('T');
    return parts[1] ? parts[1].slice(0, 5) : dtStr;
  }
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function extractShortDate(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
}

function formatDobShort(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
}

export default function TicketPrintModal({ booking, onClose }) {
  const printRef = useRef(null);

  if (!booking) return null;

  const isIssued = booking.ApprovalStatus === 'Ticket Issued';
  const statusSubtitle = isIssued ? '(Ticket Issued)' : `(${booking.ApprovalStatus || 'Booked'})`;

  const handlePrint = () => {
    const content = printRef.current ? printRef.current.innerHTML : '';
    const win = window.open('', '_blank', 'width=900,height=950');
    if (!win) {
      window.print();
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>TABAN AIRLINES BOOKING — ${booking.PNR}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Roboto, Arial, sans-serif;
            background: #FFFFFF;
            color: #334155;
            margin: 0;
            padding: 18px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const segments = booking.Segments || [];
  const passengers = booking.Passengers || [];
  const logoUrl = `${window.location.origin}/images/Taban%20Air%20Gradient%20Airline%20Logo.png`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <div className="bg-[#1D314F] text-white px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/images/Taban Air Gradient Airline Logo.png"
              alt="Taban Air"
              className="w-8 h-8 rounded bg-white p-0.5 object-contain"
            />
            <div>
              <h3 className="font-semibold text-sm tracking-wide">
                E-Ticket & Booking Receipt — {booking.PNR}
              </h3>
              <p className="text-[11px] text-white/75">
                Booking ID: {booking.AirGroupBookingID} • Status: {booking.ApprovalStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-[#1D314F] hover:bg-slate-100 font-semibold text-xs transition shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body (Exact PDF Match) */}
        <div className="p-5 overflow-y-auto bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            style={{
              width: '780px',
              border: '1px solid #e2e8f0',
              borderRadius: '4px',
              padding: '22px',
              backgroundColor: '#ffffff',
              color: '#334155',
              fontFamily: "'Segoe UI', Roboto, Arial, sans-serif"
            }}
          >
            {/* TOP NAVY HEADER BAR */}
            <div
              style={{
                background: '#1D314F',
                padding: '11px 16px',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 700,
                letterSpacing: '0.2px'
              }}
            >
              TABAN AIRLINES BOOKING {statusSubtitle}
            </div>

            {/* LOGO BOX ON LEFT (No PNR_AIRLINE on top right) */}
            <div style={{ marginTop: '14px', marginBottom: '14px' }}>
              <div
                style={{
                  display: 'inline-block',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  backgroundColor: '#ffffff'
                }}
              >
                <img
                  src={logoUrl}
                  alt="Taban Air"
                  style={{ width: '88px', height: '88px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            </div>

            {/* SUMMARY METADATA BOX */}
            <div
              style={{
                padding: '16px 28px',
                fontSize: '12.5px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                marginBottom: '18px',
                color: '#475569'
              }}
            >
              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <span style={{ width: '260px', fontWeight: 600, color: '#64748b' }}>BOOKING PNR</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>{booking.PNR}</span>
              </div>

              <div style={{ display: 'flex', marginBottom: '8px' }}>
                <span style={{ width: '260px', fontWeight: 600, color: '#64748b' }}>
                  {isIssued ? 'ISSUE DATE' : 'BOOKING DATE'}
                </span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {isIssued ? (booking.ApprovalDateTime || booking.TimeStamp) : booking.TimeStamp}
                </span>
              </div>

              <div style={{ display: 'flex', marginBottom: !isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' ? '8px' : '8px' }}>
                <span style={{ width: '260px', fontWeight: 600, color: '#64748b' }}>ISSUING AIRLINE</span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {booking.ValidatingCarrierName || 'Taban Airlines'}
                </span>
              </div>

              {/* Show BOOKING TIMELIMIT ONLY when ticket is NOT issued yet */}
              {!isIssued && booking.BookingTimeLimit && booking.BookingTimeLimit !== '—' && (
                <div style={{ display: 'flex', marginBottom: '8px' }}>
                  <span style={{ width: '260px', fontWeight: 600, color: '#64748b' }}>BOOKING TIMELIMIT</span>
                  <span style={{ fontWeight: 600, color: '#334155' }}>{booking.BookingTimeLimit}</span>
                </div>
              )}

              <div style={{ display: 'flex' }}>
                <span style={{ width: '260px', fontWeight: 600, color: '#64748b' }}>
                  BOOKING ID / AGENT ID
                </span>
                <span style={{ fontWeight: 600, color: '#334155' }}>
                  {booking.AirGroupBookingID} / {booking.SubCompanyID}
                </span>
              </div>
            </div>

            {/* FLIGHT INFORMATION */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px',
                  marginBottom: '12px',
                  color: '#1e293b',
                  fontSize: '15px'
                }}
              >
                Flight Information
              </div>

              {segments.length === 0 ? (
                <div style={{ fontSize: '12.5px', color: '#64748b', padding: '6px 0' }}>
                  {booking.FlightTitle || 'Flight Sector'}
                </div>
              ) : (
                segments.map((seg, idx) => {
                  const adtBag =
                    seg.BaggageADT !== undefined && seg.BaggageADT !== ''
                      ? seg.BaggageADT
                      : seg.BaggageCountADT || '20';
                  const cnnBag =
                    seg.BaggageCNN !== undefined && seg.BaggageCNN !== ''
                      ? seg.BaggageCNN
                      : seg.BaggageCountCNN || '20';
                  const infBag =
                    seg.BaggageINF !== undefined && seg.BaggageINF !== ''
                      ? seg.BaggageINF
                      : seg.BaggageCountINF || '0';

                  return (
                    <div
                      key={seg.AirGroupSegmentID || idx}
                      style={{ marginBottom: idx < segments.length - 1 ? '16px' : 0 }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '13.5px',
                          marginBottom: '12px',
                          background: '#f1f3f5',
                          color: '#334155',
                          padding: '9px 14px',
                          borderRadius: '4px'
                        }}
                      >
                        Flight {idx + 1} - {seg.DepartureCity} ({seg.DepartureIata}) to {seg.ArrivalCity} ({seg.ArrivalIata})
                      </div>

                      <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse', color: '#475569' }}>
                        <thead>
                          <tr>
                            <td style={{ width: '135px', padding: '4px 6px', fontWeight: 600, color: '#64748b' }}>
                              Carrier Flight No
                            </td>
                            <td style={{ width: '210px', padding: '4px 6px', fontWeight: 600, color: '#64748b' }}>
                              Depart
                            </td>
                            <td style={{ width: '215px', padding: '4px 6px', fontWeight: 600, color: '#64748b' }}>
                              Arrive
                            </td>
                            <td style={{ padding: '4px 6px' }}></td>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={{ padding: '8px 6px', verticalAlign: 'middle', fontWeight: 500, color: '#334155' }}>
                              {seg.FlightNumber}
                            </td>
                            <td style={{ padding: '8px 6px', verticalAlign: 'top', lineHeight: '1.55' }}>
                              <div style={{ fontWeight: 700, color: '#334155' }}>
                                {extractTime(seg.DepartureDate)}
                              </div>
                              <div>
                                {seg.DepartureCity}, {seg.DepartureIata}
                              </div>
                              <div>{seg.DepartureAirport}</div>
                              <div>{extractShortDate(seg.DepartureDate)}</div>
                            </td>
                            <td style={{ padding: '8px 6px', verticalAlign: 'top', lineHeight: '1.55' }}>
                              <div style={{ fontWeight: 700, color: '#334155' }}>
                                {extractTime(seg.ArrivalDate)}
                              </div>
                              <div>
                                {seg.ArrivalCity}, {seg.ArrivalIata}
                              </div>
                              <div>{seg.ArrivalAirport}</div>
                              <div>{extractShortDate(seg.ArrivalDate)}</div>
                            </td>
                            <td style={{ padding: '8px 6px', verticalAlign: 'top', lineHeight: '1.55' }}>
                              <div>
                                <b>Cabin:</b> {seg.FlightClass || 'Economy'}, {seg.FlightClassCode || 'Y'}
                              </div>
                              <div>
                                <b>Baggage:</b>
                              </div>
                              <div>Adult={adtBag},</div>
                              <div>
                                Child={cnnBag}, Infant={infBag}
                              </div>
                              <div>
                                <b>Aircraft:</b> {seg.AirCraft || 'A320'}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })
              )}
            </div>

            {/* PASSENGER INFORMATION */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '16px',
                marginBottom: '18px'
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px',
                  marginBottom: '12px',
                  color: '#1e293b',
                  fontSize: '15px'
                }}
              >
                Passenger Information
              </div>

              <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', color: '#475569' }}>
                <thead>
                  <tr style={{ background: '#f1f3f5', color: '#334155', fontWeight: 700 }}>
                    <td style={{ padding: '8px 8px' }}>Title</td>
                    <td style={{ padding: '8px 8px' }}>First Name</td>
                    <td style={{ padding: '8px 8px' }}>Last Name</td>
                    <td style={{ padding: '8px 8px' }}>Type</td>
                    <td style={{ padding: '8px 8px' }}>DOB</td>
                    <td style={{ padding: '8px 8px' }}>Nationality</td>
                    <td style={{ padding: '8px 8px' }}>Passport #</td>
                    <td style={{ padding: '8px 8px' }}>Ticket #</td>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((p, idx) => (
                    <tr
                      key={p.PassengerID || idx}
                      style={{ borderBottom: idx < passengers.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                    >
                      <td style={{ padding: '10px 8px' }}>{p.Title}</td>
                      <td style={{ padding: '10px 8px' }}>{p.FirstName}</td>
                      <td style={{ padding: '10px 8px' }}>{p.LastName}</td>
                      <td style={{ padding: '10px 8px' }}>{p.PassengerType}</td>
                      <td style={{ padding: '10px 8px' }}>{formatDobShort(p.DOB)}</td>
                      <td style={{ padding: '10px 8px' }}>{p.Nationality}</td>
                      <td style={{ padding: '10px 8px' }}>{p.PassportNumber}</td>
                      <td style={{ padding: '10px 8px' }}>{p.TicketNumber || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DISCLAIMER */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '16px'
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '8px',
                  marginBottom: '12px',
                  color: '#1e293b',
                  fontSize: '15px'
                }}
              >
                Disclaimer
              </div>

              <div style={{ fontSize: '12px', lineHeight: '1.7', color: '#475569', padding: '0 6px' }}>
                <div style={{ fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  داشتن ویزا ،معتبر واچر هتل و بلیط برگشت برای مسافران ایرانی هنگام ورود به پاکستان الزامی است
                </div>

                <div style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Ticket Terms and Conditions
                </div>

                <div style={{ marginBottom: '6px', paddingLeft: '14px' }}>
                  <div>
                    اگر از خروج یا ورود مسافران ایرانی توسط پلیس مهاجرت و گذرنامه جلوگیری شود تمام هزینه‌های مربوطه از جمله حمل و نقل برگشت و ،اقامتبر عهده مسافر خواهد بود شرکت هواپیمایی تابان هیچ مسئولیتی در این زمینه ندارد
                  </div>
                  <div>Passengers must check in at least 3 hours prior to scheduled departure.</div>
                  <div>The Airline accepts no liability for valuables in checked or unchecked baggage.</div>
                  <div>
                    Flight schedules and times are not guaranteed. In case of delay, cancellation, or denied boarding, the Airline&apos;s liability is limited to refund of the unused portion of the ticket, in accordance with fare rules.
                  </div>
                  <div>Tickets are non-transferable and non-endorsable.</div>
                  <div>Excess baggage charges apply. Prohibited or dangerous items must not be carried.</div>
                  <div>All tickets are non refundable.</div>
                  <div>
                    Refunds, if permitted, shall be processed at the place of ticket issuance upon presentation of the original ticket and required Airline endorsement.
                  </div>
                  <div>
                    All known taxes are collected at booking; additional taxes may be payable at departure.
                  </div>
                  <div>Valid passport and visa must be presented at check-in and boarding.</div>
                  <div>
                    In cases of Force Majeure (including war, security or operational disruptions, or flight cancellation), Taban Airline may, at its sole discretion, re-accommodate the passenger or issue a travel voucher for unused sectors.
                  </div>
                  <div>
                    If re-accommodation involves a higher fare, the passenger shall pay the difference; no refund shall apply for lower fare alternatives.
                  </div>
                  <div>No refund shall be due in cases of no-show or offload.</div>
                  <div>
                    Passengers must carry a minimum of USD 350 and present it upon request at check-in.
                  </div>
                  <div>
                    Purchase of this ticket constitutes acceptance of the Airline&apos;s Conditions of Carriage and liability limitations.
                  </div>
                  <div>
                    In case of force majeure, war, flight cancellation, or any changes initiated by Taban Airline or CAA Iran, tickets will be non-refundable.
                  </div>
                  <div>
                    Each passenger is required to submit four (4) copies of their visa at the boarding counter.
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '12px',
                    fontWeight: 700,
                    color: '#475569'
                  }}
                >
                  I have read all the terms and conditions above mentioned and accepted them before purchasing the tickets.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
