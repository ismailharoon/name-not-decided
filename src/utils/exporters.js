import * as XLSX from 'xlsx';

export function formatCurrencyPKR(amount) {
  const num = Number(amount) || 0;
  return `PKR ${num.toLocaleString('en-US')}`;
}

export function formatDateTime(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

export function formatShortDate(dtStr) {
  if (!dtStr) return '—';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * 1. Manifest (Excel) — Passenger_Manifest_<FlightNo>.xlsx
 * Matches original window.downloadExcelManifest
 */
export function downloadExcelManifest(segment, passengers = []) {
  const flightClean = (segment.FlightNumber || 'FLIGHT').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Passenger_Manifest_${flightClean}.xlsx`;
  const title = `TABAN AIR :: Manifest — ${segment.FlightNumber} (${segment.DepartureIata} to ${segment.ArrivalIata})`;

  const headers = [
    'Sr #',
    'Pax Surname',
    'First Name',
    'Title',
    'Pax Type',
    'Ticket No.',
    'PNR',
    'Destination',
    'Nationality',
    'DOB',
    'Passport No.',
    'Passport Expiry'
  ];

  const rows = passengers.map((p, idx) => [
    idx + 1,
    p.LastName || '',
    p.FirstName || '',
    p.Title || '',
    p.PassengerType || 'Adult',
    p.TicketNumber || 'PENDING',
    p.PNR || '',
    segment.ArrivalIata || '',
    p.Nationality || 'PAK',
    p.DOB || '',
    p.PassportNumber || '',
    p.PassportExpiryDate || ''
  ]);

  const wsData = [[title], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  ws['!cols'] = headers.map((h, i) => {
    let max = h.length;
    rows.forEach((r) => {
      const len = String(r[i] ?? '').length;
      if (len > max) max = len;
    });
    return { wch: max + 4 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Manifest');
  XLSX.writeFile(wb, filename);
}

/**
 * 2. Passenger List (Excel) — Passenger_List_<FlightNo>.xlsx
 * Matches original window.downloadExcelPassengersList with all 15 columns
 */
export function downloadExcelPassengersList(segment, passengers = []) {
  const flightClean = (segment.FlightNumber || 'FLIGHT').replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Passenger_List_${flightClean}.xlsx`;
  const title = `TABAN AIR :: Passengers List — ${segment.FlightNumber} (${formatShortDate(segment.DepartureDate)})`;

  const headers = [
    'Age Type (A,C,I)',
    'Title (M/F)',
    'English First Name',
    'English Last Name',
    'Persian First Name',
    'Persian Last Name',
    'Birth date',
    'With Adult',
    'National Id',
    'Passport Id',
    'Mobile',
    'SSR Code',
    'Agency PNR',
    'Agency Ticket No.',
    'Cabin'
  ];

  const rows = passengers.map((p) => {
    const ageType =
      p.PassengerType === 'Infant' ? 'I' : p.PassengerType === 'Child' ? 'C' : 'A';
    const genderCode = p.Gender === 'Female' || p.Title === 'MRS' || p.Title === 'MISS' ? 'F' : 'M';
    return [
      ageType,
      genderCode,
      p.FirstName || '',
      p.LastName || '',
      p.PersianFirstName || '',
      p.PersianLastName || '',
      p.DOB || '',
      p.WithAdult || '',
      p.NationalId || '',
      p.PassportNumber || '',
      p.MobileNumber || '',
      p.SSRCode || 'TKNE',
      p.PNR || '',
      p.TicketNumber || '',
      segment.FlightClassCode || 'Y'
    ];
  });

  const wsData = [[title], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  ws['!cols'] = headers.map((h, i) => {
    let max = h.length;
    rows.forEach((r) => {
      const len = String(r[i] ?? '').length;
      if (len > max) max = len;
    });
    return { wch: max + 3 };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'PassengersList');
  XLSX.writeFile(wb, filename);
}

/**
 * 3. Manifest (Word / IATA PNL) — Manifest-<FlightNo>.doc
 * Matches original TABAN AIR :: Iata Manifest | Passenger Service System (PNL / ENDPNL)
 */
export function downloadWordManifest(segment, passengers = []) {
  const flightClean = (segment.FlightNumber || 'HH7212').replace(/[^a-zA-Z0-9]/g, '');
  const d = new Date(segment.DepartureDate || Date.now());
  const dayStr = String(d.getDate()).padStart(2, '0');
  const monStr = d.toLocaleString('en-US', { month: 'short' });
  const dateToken = `${dayStr}${monStr}`;

  const pnlLines = [
    'PNL',
    `${flightClean}/${dateToken} ${segment.DepartureIata || 'KHI'} PART1`,
    `-${segment.ArrivalIata || 'IKA'}${segment.TotalSeats || 160}${segment.FlightClassCode || 'Y'}`
  ];

  passengers.forEach((p, idx) => {
    const surname = (p.LastName || 'PAX').toUpperCase();
    const firstname = (p.FirstName || 'GUEST').toUpperCase();
    const title = (p.Title || 'MR').toUpperCase();
    const tkt = p.TicketNumber || `7210000000${idx + 1}`;
    pnlLines.push(`1${surname}/${firstname} ${title} .L/${p.PNR || 'TB9K4L'}`);
    pnlLines.push(`.R/${p.SSRCode || 'TKNE'} HK1 ${tkt}-1`);
    pnlLines.push(`.R/DOCS HK1/P/${p.Nationality || 'PAK'}/${p.PassportNumber || 'NA'}/${p.Nationality || 'PAK'}/${p.DOB || ''}/${p.Gender === 'Female' ? 'F' : 'M'}/${p.PassportExpiryDate || ''}/${surname}/${firstname}`);
  });

  pnlLines.push('ENDPNL');

  const htmlDoc = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>TABAN AIR :: Iata Manifest</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 11pt; color: #0B0A09; padding: 24px; }
        .header { background: #EE8200; color: #FFFFFF; padding: 12px 16px; font-family: Arial, sans-serif; font-weight: bold; font-size: 14pt; margin-bottom: 16px; }
        .meta { font-family: Arial, sans-serif; font-size: 10pt; margin-bottom: 16px; border: 1px solid #EE8200; padding: 10px; }
        pre { background: #FAFAFA; border: 1px solid #ccc; padding: 14px; font-family: 'Courier New', monospace; font-size: 10.5pt; line-height: 1.45; }
        table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9.5pt; margin-top: 20px; }
        th { background: #EE8200; color: #ffffff; padding: 6px 8px; text-align: left; }
        td { border: 1px solid #d4d4d4; padding: 6px 8px; }
      </style>
    </head>
    <body>
      <div class="header">TABAN AIR :: IATA MANIFEST | PASSENGER SERVICE SYSTEM</div>
      <div class="meta">
        <b>Flight:</b> ${segment.FlightNumber} &nbsp;|&nbsp;
        <b>Sector:</b> ${segment.DepartureCity} (${segment.DepartureIata}) &rarr; ${segment.ArrivalCity} (${segment.ArrivalIata}) &nbsp;|&nbsp;
        <b>Date:</b> ${formatDateTime(segment.DepartureDate)} &nbsp;|&nbsp;
        <b>Aircraft:</b> ${segment.AirCraft || 'Boeing 737'} &nbsp;|&nbsp;
        <b>Total Pax:</b> ${passengers.length}
      </div>
      <h3>IATA PNL TELETYPE MESSAGE</h3>
      <pre>${pnlLines.join('\n')}</pre>
      <h3>PASSENGER MANIFEST SUMMARY</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Type</th>
            <th>Passport #</th>
            <th>Nationality</th>
            <th>DOB</th>
            <th>Ticket #</th>
            <th>PNR</th>
          </tr>
        </thead>
        <tbody>
          ${passengers
            .map(
              (p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.Title || ''}</td>
              <td>${p.LastName || ''}</td>
              <td>${p.FirstName || ''}</td>
              <td>${p.PassengerType || ''}</td>
              <td>${p.PassportNumber || ''}</td>
              <td>${p.Nationality || ''}</td>
              <td>${p.DOB || ''}</td>
              <td>${p.TicketNumber || 'PENDING'}</td>
              <td>${p.PNR || ''}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlDoc], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Manifest-${flightClean}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
