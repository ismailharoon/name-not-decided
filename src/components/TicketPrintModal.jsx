import React, { useRef } from 'react';
import { Printer, X, Plane, ShieldCheck, Download } from 'lucide-react';
import { formatDateTime } from '../utils/exporters';

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
            font-family: 'Segoe UI', Arial, sans-serif;
            background: #FFFFFF;
            color: #0B0A09;
            margin: 0;
            padding: 20px;
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
            }, 250);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const segments = booking.Segments || [];
  const passengers = booking.Passengers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#EE8200]/20 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Action Bar */}
        <div className="bg-[#EE8200] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
              <Plane className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide">
                E-Ticket & Booking Receipt Preview — {booking.PNR}
              </h3>
              <p className="text-xs text-white/75">
                Booking ID: {booking.AirGroupBookingID} • Status: {booking.ApprovalStatus}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-[#EE8200] hover:bg-espresso-50 font-semibold text-xs transition shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-6 overflow-y-auto bg-[#FAFAFA] flex justify-center">
          <div
            ref={printRef}
            style={{
              width: '780px',
              border: '1px solid #d6d0c8',
              padding: '24px',
              backgroundColor: '#ffffff',
              color: '#0B0A09',
              fontFamily: "'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif"
            }}
          >
            {/* HEADER */}
            <div
              style={{
                background: '#EE8200',
                padding: '12px 16px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '6px'
              }}
            >
              <span>TABAN AIRLINES BOOKING {statusSubtitle}</span>
              <span style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '1px' }}>
                PNR: {booking.PNR}
              </span>
            </div>

            {/* BRAND & AIRLINE PNR BAR */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '14px',
                marginBottom: '14px',
                padding: '0 8px'
              }}
            >
              <div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#EE8200', letterSpacing: '-0.5px' }}>
                  TABAN AIRLINES
                </div>
                <div style={{ fontSize: '12px', color: '#555', fontWeight: 600 }}>
                  Executive Charter & Group Consolidation Division
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', fontWeight: 700 }}>
                  Airline Reference (PNR_AIRLINE)
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 800,
                    color: '#0B0A09',
                    background: '#FFF7ED',
                    border: '1px solid #EE8200',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    marginTop: '3px',
                    display: 'inline-block'
                  }}
                >
                  {booking.PNR_AIRLINE || booking.PNR}
                </div>
              </div>
            </div>

            {/* SUMMARY METADATA BOX */}
            <div
              style={{
                padding: '14px 24px',
                fontSize: '13px',
                border: '1px solid #d6d0c8',
                borderRadius: '8px',
                backgroundColor: '#FAFAFA',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                <span style={{ display: 'inline-block', width: '260px', color: '#EE8200' }}>BOOKING PNR</span>
                <span>{booking.PNR}</span>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                <span style={{ display: 'inline-block', width: '260px', color: '#EE8200' }}>ISSUING AIRLINE</span>
                <span>{booking.ValidatingCarrierName || 'Taban Air (HH-721)'}</span>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                <span style={{ display: 'inline-block', width: '260px', color: '#EE8200' }}>BOOKING TIMELIMIT</span>
                <span>{booking.BookingTimeLimit || '—'}</span>
              </div>
              <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                <span style={{ display: 'inline-block', width: '260px', color: '#EE8200' }}>ISSUE DATE</span>
                <span>{booking.ApprovalDateTime || booking.TimeStamp}</span>
              </div>
              <div style={{ fontWeight: 'bold' }}>
                <span style={{ display: 'inline-block', width: '260px', color: '#EE8200' }}>
                  BOOKING ID / AGENT ID
                </span>
                <span>
                  {booking.AirGroupBookingID} / {booking.SubCompanyID} ({booking.SubCompanyName})
                </span>
              </div>
            </div>

            {/* FLIGHT DETAILS */}
            <div
              style={{
                border: '1px solid #d6d0c8',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <h4
                style={{
                  fontWeight: 'bold',
                  borderBottom: '2px solid #EE8200',
                  paddingBottom: '6px',
                  marginTop: 0,
                  marginBottom: '10px',
                  color: '#EE8200',
                  fontSize: '15px'
                }}
              >
                Flight Information
              </h4>

              {segments.length === 0 ? (
                <div style={{ fontSize: '13px', color: '#666', padding: '8px 0' }}>
                  {booking.FlightTitle || 'Direct Group Charter Sector'}
                </div>
              ) : (
                segments.map((seg, idx) => (
                  <div key={seg.AirGroupSegmentID || idx} style={{ marginBottom: idx < segments.length - 1 ? '14px' : 0 }}>
                    <div
                      style={{
                        fontWeight: 'bold',
                        fontSize: '14px',
                        marginBottom: '6px',
                        background: '#FFF7ED',
                        color: '#EE8200',
                        padding: '8px 12px',
                        borderLeft: '4px solid #EE8200'
                      }}
                    >
                      Flight {idx + 1}: {seg.DepartureCity} ({seg.DepartureIata}) &rarr; {seg.ArrivalCity} ({seg.ArrivalIata})
                    </div>
                    <table style={{ width: '100%', fontSize: '12.5px', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e0d8', color: '#EE8200' }}>
                          <td style={{ width: '130px', padding: '6px' }}>
                            <b>Carrier Flight No</b>
                          </td>
                          <td style={{ width: '210px', padding: '6px' }}>
                            <b>Depart</b>
                          </td>
                          <td style={{ width: '210px', padding: '6px' }}>
                            <b>Arrive</b>
                          </td>
                          <td style={{ padding: '6px' }}>
                            <b>Cabin & Baggage</b>
                          </td>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '8px 6px', verticalAlign: 'top', fontWeight: 'bold' }}>
                            <div>{seg.MarketingAirline || 'HH'}</div>
                            <div style={{ fontSize: '14px', color: '#EE8200' }}>{seg.FlightNumber}</div>
                            <div style={{ fontSize: '11px', color: '#666' }}>{seg.OperatingAirlineName}</div>
                          </td>
                          <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                              {seg.DepartureCity} ({seg.DepartureIata})
                            </div>
                            <div style={{ color: '#444' }}>{seg.DepartureAirport}</div>
                            <div style={{ fontWeight: 'bold', marginTop: '3px', color: '#EE8200' }}>
                              {formatDateTime(seg.DepartureDate)}
                            </div>
                          </td>
                          <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>
                            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
                              {seg.ArrivalCity} ({seg.ArrivalIata})
                            </div>
                            <div style={{ color: '#444' }}>{seg.ArrivalAirport}</div>
                            <div style={{ fontWeight: 'bold', marginTop: '3px', color: '#EE8200' }}>
                              {formatDateTime(seg.ArrivalDate)}
                            </div>
                          </td>
                          <td style={{ padding: '8px 6px', verticalAlign: 'top', lineHeight: 1.5 }}>
                            <div>
                              <b>Cabin:</b> {seg.FlightClass} ({seg.FlightClassCode})
                            </div>
                            <div>
                              <b>Baggage:</b> Adult={seg.BaggageCountADT || '30 KG'}, Child=
                              {seg.BaggageCountCNN || '20 KG'}, Infant={seg.BaggageCountINF || '10 KG'}
                            </div>
                            <div>
                              <b>Aircraft:</b> {seg.AirCraft || 'Boeing 737'}
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>

            {/* PASSENGER SECTION */}
            <div
              style={{
                border: '1px solid #d6d0c8',
                borderRadius: '8px',
                padding: '14px',
                marginBottom: '16px'
              }}
            >
              <h4
                style={{
                  fontWeight: 'bold',
                  borderBottom: '2px solid #EE8200',
                  paddingBottom: '6px',
                  marginTop: 0,
                  marginBottom: '10px',
                  color: '#EE8200',
                  fontSize: '15px'
                }}
              >
                Passenger Information ({passengers.length})
              </h4>
              <table
                style={{
                  width: '100%',
                  marginTop: '5px',
                  borderCollapse: 'collapse',
                  fontSize: '12.5px',
                  tableLayout: 'fixed'
                }}
              >
                <thead>
                  <tr style={{ background: '#EE8200', textAlign: 'left', color: '#ffffff' }}>
                    <th style={{ padding: '7px 6px', width: '8%' }}>Title</th>
                    <th style={{ padding: '7px 6px', width: '16%' }}>First Name</th>
                    <th style={{ padding: '7px 6px', width: '16%' }}>Last Name</th>
                    <th style={{ padding: '7px 6px', width: '9%' }}>Type</th>
                    <th style={{ padding: '7px 6px', width: '12%' }}>DOB</th>
                    <th style={{ padding: '7px 6px', width: '10%' }}>Nat.</th>
                    <th style={{ padding: '7px 6px', width: '13%' }}>Passport #</th>
                    <th style={{ padding: '7px 6px', width: '16%' }}>Ticket #</th>
                  </tr>
                </thead>
                <tbody>
                  {passengers.map((pax, i) => (
                    <tr
                      key={pax.PassengerID || i}
                      style={{
                        borderBottom: '1px solid #e5e0d8',
                        backgroundColor: i % 2 === 1 ? '#FAFAFA' : '#ffffff'
                      }}
                    >
                      <td style={{ padding: '7px 6px', fontWeight: 600 }}>{pax.Title}</td>
                      <td style={{ padding: '7px 6px', fontWeight: 700 }}>{pax.FirstName}</td>
                      <td style={{ padding: '7px 6px', fontWeight: 700 }}>{pax.LastName}</td>
                      <td style={{ padding: '7px 6px' }}>{pax.PassengerType}</td>
                      <td style={{ padding: '7px 6px' }}>{pax.DOB}</td>
                      <td style={{ padding: '7px 6px' }}>{pax.Nationality}</td>
                      <td style={{ padding: '7px 6px', fontFamily: 'monospace' }}>{pax.PassportNumber}</td>
                      <td style={{ padding: '7px 6px', fontFamily: 'monospace', fontWeight: 700, color: '#EE8200' }}>
                        {pax.TicketNumber || 'PENDING'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DISCLAIMER SECTION */}
            <div style={{ border: '1px solid #d6d0c8', borderRadius: '8px', padding: '14px' }}>
              <h4
                style={{
                  fontWeight: 'bold',
                  borderBottom: '2px solid #EE8200',
                  paddingBottom: '6px',
                  marginTop: 0,
                  marginBottom: '8px',
                  color: '#EE8200',
                  fontSize: '15px'
                }}
              >
                Disclaimer & Conditions of Carriage
              </h4>
              <div style={{ padding: '6px', fontSize: '11.5px', lineHeight: '1.55', color: '#222' }}>
                <div
                  dir="rtl"
                  style={{
                    marginBottom: '10px',
                    fontWeight: 'bold',
                    background: '#FFF7ED',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    color: '#EE8200',
                    fontSize: '12.5px'
                  }}
                >
                  مسافران گرامی لطفاً حداقل ۳ ساعت قبل از زمان پرواز در فرودگاه حضور داشته باشید و اصل گذرنامه، ویزا و ۴ نسخه کپی ویزا را به همراه داشته باشید.
                </div>
                <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#0B0A09' }}>
                  Ticket Terms and Conditions
                </div>
                <ul style={{ paddingLeft: '18px', margin: 0 }}>
                  <li>Passengers must check in at least 3 hours prior to scheduled departure.</li>
                  <li>The Airline accepts no liability for valuables in checked or unchecked baggage.</li>
                  <li>
                    Flight schedules and times are not guaranteed. In case of delay, cancellation, or denied boarding,
                    the Airline&apos;s liability is limited to refund of the unused portion of the ticket, in accordance
                    with fare rules.
                  </li>
                  <li>Tickets are non-transferable and non-endorsable.</li>
                  <li>Excess baggage charges apply. Prohibited or dangerous items must not be carried.</li>
                  <li>All tickets are non refundable.</li>
                  <li>
                    Refunds, if permitted, shall be processed at the place of ticket issuance upon presentation of the
                    original ticket and required Airline endorsement.
                  </li>
                  <li>
                    All known taxes are collected at booking; additional taxes may be payable at departure.
                  </li>
                  <li>Valid passport and visa must be presented at check-in and boarding.</li>
                  <li>
                    In cases of Force Majeure (including war, security or operational disruptions, or flight
                    cancellation), Taban Airline may, at its sole discretion, re-accommodate the passenger or issue a
                    travel voucher for unused sectors.
                  </li>
                  <li>
                    If re-accommodation involves a higher fare, the passenger shall pay the difference; no refund shall
                    apply for lower fare alternatives.
                  </li>
                  <li>No refund shall be due in cases of no-show or offload.</li>
                  <li>
                    Passengers must carry a minimum of USD 350 and present it upon request at check-in.
                  </li>
                  <li>
                    Purchase of this ticket constitutes acceptance of the Airline&apos;s Conditions of Carriage and
                    liability limitations.
                  </li>
                  <li>
                    In case of force majeure, war, flight cancellation, or any changes initiated by Taban Airline or CAA
                    Iran, tickets will be non-refundable.
                  </li>
                  <li>
                    Each passenger is required to submit four (4) copies of their visa at the boarding counter.
                  </li>
                </ul>
                <div
                  style={{
                    marginTop: '10px',
                    fontWeight: 'bold',
                    color: '#EE8200',
                    borderTop: '1px dashed #ccc',
                    paddingTop: '8px'
                  }}
                >
                  I have read all the terms and conditions above mentioned and accepted them before purchasing the
                  tickets.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
