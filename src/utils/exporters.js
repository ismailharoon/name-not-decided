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

const MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const MONTHS_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Formats a date string into DDMMMYY (e.g., "27OCT26" or "17MAR85")
 */
export function formatDDMMMYY(dtStr, fallback = '27OCT26') {
  if (!dtStr) return fallback;
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = MONTHS_SHORT[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mmm}${yy}`;
}

/**
 * Formats a date string into DDMMM (e.g., "27OCT")
 */
export function formatDDMMM(dtStr, fallback = '27OCT') {
  if (!dtStr) return fallback;
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return fallback;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = MONTHS_SHORT[d.getMonth()];
  return `${dd}${mmm}`;
}

/**
 * Formats a date string into DD-MMM-YY (e.g., "27-Oct-26") for Excel cell D2
 */
export function formatExcelFlightDate(dtStr) {
  if (!dtStr) return '';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = MONTHS_TITLE[d.getMonth()];
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mmm}-${yy}`;
}

/**
 * Extracts numeric flight number (e.g., "HH 7212" -> "7212") and carrier prefix (e.g., "HH")
 */
export function parseFlightNumberParts(segment) {
  const raw = String(segment?.FlightNumber || '7212').trim();
  const digitsMatch = raw.match(/\d+/);
  const flightDigits = digitsMatch ? digitsMatch[0] : raw.replace(/[^a-zA-Z0-9]/g, '');
  const prefixMatch = raw.match(/^[A-Za-z0-9]{2}(?=[\s-]+\d|\d)/);
  const carrierCode = (
    segment?.OperatingAirline ||
    segment?.MarketingAirline ||
    (prefixMatch ? prefixMatch[0] : 'HH')
  )
    .toUpperCase()
    .trim();
  return { flightDigits, carrierCode };
}

/**
 * Excel Export matching reference file: KHI-IKA-27OCT26-7212.xlsx
 * Sheet Name: "Page 1"
 * Row 1: From | To | Flight No | Flight Date
 * Row 2: KHI  | IKA| 7212      | 27-Oct-26
 * Row 3: R | Action | Age Type (A,C,I) | Title (M/F) | English First Name | English Last Name | Persian First Name | Persian Last Name | Birth date | With Adult | National Id | Passport Id | Mobile | Email | SSR Code | Agency PNR | Agency Ticket No. | Cabin
 */
export function downloadExcelManifest(segment, passengers = []) {
  const depIata = (segment?.DepartureIata || 'KHI').toUpperCase();
  const arrIata = (segment?.ArrivalIata || 'IKA').toUpperCase();
  const dateToken = formatDDMMMYY(segment?.DepartureDate, '27OCT26');
  const { flightDigits } = parseFlightNumberParts(segment);

  const filename = `${depIata}-${arrIata}-${dateToken}-${flightDigits}.xlsx`;

  const row1 = ['From', 'To', 'Flight No', 'Flight Date'];
  const flightNoValue = /^\d+$/.test(flightDigits) ? Number(flightDigits) : flightDigits;
  const row2 = [depIata, arrIata, flightNoValue, formatExcelFlightDate(segment?.DepartureDate)];

  const row3Headers = [
    'R',
    'Action',
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
    'Email',
    'SSR Code',
    'Agency PNR',
    'Agency Ticket No.',
    'Cabin'
  ];

  const paxRows = passengers.map((p, idx) => {
    const ageType =
      p.PassengerType === 'Infant' ? 'I' : p.PassengerType === 'Child' ? 'C' : 'A';
    const genderCode =
      p.Gender === 'Female' || p.Title === 'MRS' || p.Title === 'MISS' || p.Title === 'MS'
        ? 'F'
        : 'M';
    const firstName = (p.FirstName || '').toUpperCase().trim();
    const lastName = (p.LastName || '').toUpperCase().trim();
    const persianFirst = (p.PersianFirstName || firstName).toUpperCase().trim();
    const persianLast = (p.PersianLastName || lastName).toUpperCase().trim();
    const dob = p.DOB || '';
    const withAdult = ageType === 'I' ? 'X' : p.WithAdult || '';
    const nationalId = p.NationalId || '';

    const nat = (p.Nationality || 'PAK').toUpperCase().trim();
    const passNo = (p.PassportNumber || '').toUpperCase().trim();
    const dobToken = formatDDMMMYY(p.DOB, '01JAN90');
    const expToken = formatDDMMMYY(p.PassportExpiryDate, '01JAN30');

    // Exact reference format: PAK/AE3743832/PAK/17MAR85/M/05APR28/PANHWAR/MAZHAR HASSAN
    const passportDocsId = `${nat}/${passNo}/${nat}/${dobToken}/${genderCode}/${expToken}/${lastName}/${firstName}`;

    const mobile = p.MobileNumber || '';
    const email = (p.EmailAddress || p.Email || '').toUpperCase().trim();
    const ssrCode =
      p.SSRCode && !['TKNE', 'INFT', 'CHLD'].includes(p.SSRCode) ? p.SSRCode : '';
    const agencyPnr = (p.PNR || '').toUpperCase().trim();
    const ticketNo = p.TicketNumber || '';
    const cabin = segment?.FlightClass || 'Economy';

    return [
      idx + 1,
      'I',
      ageType,
      genderCode,
      firstName,
      lastName,
      persianFirst,
      persianLast,
      dob,
      withAdult,
      nationalId,
      passportDocsId,
      mobile,
      email,
      ssrCode,
      agencyPnr,
      ticketNo,
      cabin
    ];
  });

  const wsData = [row1, row2, row3Headers, ...paxRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 5 },  // A: R
    { wch: 8 },  // B: Action
    { wch: 16 }, // C: Age Type (A,C,I)
    { wch: 12 }, // D: Title (M/F)
    { wch: 22 }, // E: English First Name
    { wch: 18 }, // F: English Last Name
    { wch: 22 }, // G: Persian First Name
    { wch: 18 }, // H: Persian Last Name
    { wch: 12 }, // I: Birth date
    { wch: 11 }, // J: With Adult
    { wch: 12 }, // K: National Id
    { wch: 58 }, // L: Passport Id
    { wch: 14 }, // M: Mobile
    { wch: 28 }, // N: Email
    { wch: 10 }, // O: SSR Code
    { wch: 12 }, // P: Agency PNR
    { wch: 18 }, // Q: Agency Ticket No.
    { wch: 11 }  // R: Cabin
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Page 1');
  XLSX.writeFile(wb, filename);
}

// Alias so both Excel buttons produce the exact reference format
export const downloadExcelPassengersList = downloadExcelManifest;

/**
 * Minimal pure-JS ZIP builder (STORE method) to generate authentic OpenXML .docx files
 */
function createZipBlob(files) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const encoder = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const dataBytes =
      typeof file.content === 'string' ? encoder.encode(file.content) : file.content;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const lv = new DataView(localHeader.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // UTF-8 flag
    lv.setUint16(8, 0, true); // compression: STORE (0)
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x5421, true); // mod date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true); // signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // UTF-8 flag
    cv.setUint16(10, 0, true); // compression: STORE (0)
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0x5421, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    centralHeader.set(nameBytes, 46);

    localParts.push(localHeader, dataBytes);
    centralParts.push(centralHeader);
    offset += localHeader.length + size;
  });

  const centralSize = centralParts.reduce((acc, part) => acc + part.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, eocd], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
}

function escapeXml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Word Export matching reference file: IATA-Manifest-7212 KHI IKA 27OCT26.docx
 * Exact structure:
 *   TABAN AIR :: Iata Manifest | Passenger Service System  (centered, bold, Calibri 12pt)
 *   -
 *   PNL
 *   HH7212/27OCT KHI PART1
 *   -IKA126+2Y
 *   1SYEDTAHIR/HUSSAINZEHRA MR
 *   .R/7400000005157 HK1PAU222164/1
 *   ...
 *   ENDPNL
 */
export function downloadWordManifest(segment, passengers = []) {
  const depIata = (segment?.DepartureIata || 'KHI').toUpperCase();
  const arrIata = (segment?.ArrivalIata || 'IKA').toUpperCase();
  const dateTokenFull = formatDDMMMYY(segment?.DepartureDate, '27OCT26');
  const dateTokenShort = formatDDMMM(segment?.DepartureDate, '27OCT');
  const { flightDigits, carrierCode } = parseFlightNumberParts(segment);
  const cabinCode = (segment?.FlightClassCode || 'Y').toUpperCase();

  const filename = `IATA-Manifest-${flightDigits} ${depIata} ${arrIata} ${dateTokenFull}.docx`;

  const adultChildCount = passengers.filter((p) => p.PassengerType !== 'Infant').length;
  const infantCount = passengers.filter((p) => p.PassengerType === 'Infant').length;
  const countToken =
    infantCount > 0
      ? `-${arrIata}${adultChildCount}+${infantCount}${cabinCode}`
      : `-${arrIata}${adultChildCount}${cabinCode}`;

  const pnlParagraphs = [];

  // Title paragraph (centered, bold, Calibri 12pt)
  pnlParagraphs.push(
    `<w:p><w:pPr><w:spacing w:after="300"/><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:b/><w:bCs/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(
      'TABAN AIR :: Iata Manifest | Passenger Service System'
    )}</w:t></w:r></w:p>`
  );

  const addLine = (text) => {
    pnlParagraphs.push(
      `<w:p><w:pPr><w:spacing w:after="150"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t>${escapeXml(
        text
      )}</w:t></w:r></w:p>`
    );
  };

  addLine('-');
  addLine('PNL');
  addLine(`${carrierCode}${flightDigits}/${dateTokenShort} ${depIata} PART1`);
  addLine(countToken);

  passengers.forEach((p, idx) => {
    // Strip spaces inside names just like 1SYEDTAHIR/HUSSAINZEHRA MR
    const cleanFirst = (p.FirstName || 'GUEST').toUpperCase().replace(/\s+/g, '');
    const cleanLast = (p.LastName || 'PAX').toUpperCase().replace(/\s+/g, '');
    const title = (p.Title || 'MR').toUpperCase().trim();
    const ticketNo = (p.TicketNumber || `740000000${String(5000 + idx + 1)}`).replace(/[^a-zA-Z0-9]/g, '');
    const passportNo = (p.PassportNumber || 'NA').toUpperCase().replace(/\s+/g, '');

    addLine(`1${cleanFirst}/${cleanLast} ${title}`);
    addLine(`.R/${ticketNo} HK1${passportNo}/1`);
  });

  addLine('ENDPNL');

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${pnlParagraphs.join('')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;

  const blob = createZipBlob([
    { name: '[Content_Types].xml', content: contentTypesXml },
    { name: '_rels/.rels', content: relsXml },
    { name: 'word/_rels/document.xml.rels', content: wordRelsXml },
    { name: 'word/document.xml', content: documentXml }
  ]);

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
