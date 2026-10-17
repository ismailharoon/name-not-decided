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
 * Formats a date string into DD-MMM (e.g., "27-Oct") for Excel cell D2 fallback
 */
export function formatExcelFlightDate(dtStr) {
  if (!dtStr) return '27-Oct';
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return dtStr;
  const dd = String(d.getDate()).padStart(2, '0');
  const mmm = MONTHS_TITLE[d.getMonth()];
  return `${dd}-${mmm}`;
}

/**
 * Converts a JS Date/string into an Excel serial date number (1900 date system)
 */
function toExcelDateSerial(dtStr) {
  if (!dtStr) return null;
  const d = new Date(dtStr);
  if (isNaN(d.getTime())) return null;
  const utcMs = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round(utcMs / 86400000) + 25569;
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
 * Minimal pure-JS ZIP builder (STORE method) to generate authentic OpenXML .xlsx and .docx files
 */
function createZipBlob(files, mimeType) {
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
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true);
    lv.setUint16(6, 0x0800, true);
    lv.setUint16(8, 0, true);
    lv.setUint16(10, 0, true);
    lv.setUint16(12, 0x5421, true);
    lv.setUint32(14, crc, true);
    lv.setUint32(18, size, true);
    lv.setUint32(22, size, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(centralHeader.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0x0800, true);
    cv.setUint16(10, 0, true);
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
    type: mimeType
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

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const EXCEL_COL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I',
  'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'
];

/**
 * Pure RGB OpenXML Stylesheet matching KHI-IKA-27OCT26-7212.xlsx:
 *  - fillId="2": #DCDCDC (Grey header rows 1 & 3)
 *  - fillId="3": #FFFF00 (Yellow flight info row 2)
 *  - fillId="4": #8DB4E2 (Cornflower Blue passenger rows 4+)
 */
const REFERENCE_EXCEL_STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/><charset val="1"/></font>
    <font><sz val="11"/><color rgb="FF000000"/><name val="Calibri"/><family val="2"/></font>
    <font><sz val="22"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/></font>
    <font><sz val="10"/><color rgb="FF000000"/><name val="Arial"/><family val="2"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFDCDCDC"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFFF00"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF8DB4E2"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="9">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
    <xf numFmtId="16" fontId="1" fillId="3" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
    <xf numFmtId="0" fontId="1" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left" vertical="top"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment horizontal="left"/></xf>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="3" fillId="4" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="left"/></xf>
  </cellXfs>
  <cellStyles count="1">
    <cellStyle name="Normal" xfId="0" builtinId="0"/>
  </cellStyles>
  <dxfs count="0"/>
  <tableStyles count="0" defaultTableStyle="TableStyleMedium9" defaultPivotStyle="PivotStyleLight16"/>
</styleSheet>`;

/**
 * Excel Export matching reference file: KHI-IKA-27OCT26-7212.xlsx
 * Includes exact colors/fills:
 *  - Row 1 (A1:D1): Grey (#DCDCDC) fill — From | To | Flight No | Flight Date
 *  - Row 2 (A2:D2): Yellow (#FFFF00) fill — KHI | IKA | 7212 | 27-Oct (numFmtId=16 d-mmm)
 *  - Row 3 (A3:R3): Grey (#DCDCDC) fill — R | Action | Age Type (A,C,I) | ... | Cabin
 *  - Row 4+ (A4:R...): Blue (#8DB4E2) fill — Passenger rows
 */
export function downloadExcelManifest(segment, passengers = []) {
  const depIata = (segment?.DepartureIata || 'KHI').toUpperCase();
  const arrIata = (segment?.ArrivalIata || 'IKA').toUpperCase();
  const dateToken = formatDDMMMYY(segment?.DepartureDate, '27OCT26');
  const { flightDigits } = parseFlightNumberParts(segment);

  const filename = `${depIata}-${arrIata}-${dateToken}-${flightDigits}.xlsx`;

  // Shared strings table builder
  const sharedStrings = [];
  const sharedMap = new Map();
  let totalStringRefs = 0;

  const getSharedStringIndex = (val) => {
    const str = String(val ?? '');
    totalStringRefs += 1;
    if (sharedMap.has(str)) {
      return sharedMap.get(str);
    }
    const idx = sharedStrings.length;
    sharedStrings.push(str);
    sharedMap.set(str, idx);
    return idx;
  };

  const makeStringCell = (cellRef, styleIdx, text) => {
    const str = String(text ?? '');
    if (str === '') {
      return `<c r="${cellRef}" s="${styleIdx}"/>`;
    }
    const sIdx = getSharedStringIndex(str);
    return `<c r="${cellRef}" s="${styleIdx}" t="s"><v>${sIdx}</v></c>`;
  };

  const makeNumberCell = (cellRef, styleIdx, numVal) => {
    return `<c r="${cellRef}" s="${styleIdx}"><v>${numVal}</v></c>`;
  };

  const xmlRows = [];

  // Row 1: Grey header (From | To | Flight No | Flight Date) -> s="1"
  const row1Headers = ['From', 'To', 'Flight No', 'Flight Date'];
  const row1Cells = row1Headers
    .map((h, i) => makeStringCell(`${EXCEL_COL_LETTERS[i]}1`, 1, h))
    .join('');
  xmlRows.push(
    `<row r="1" spans="1:18" ht="14.85" customHeight="1">${row1Cells}</row>`
  );

  // Row 2: Yellow values (KHI | IKA | 7212 | 27-Oct) -> A2:C2 s="2", D2 s="4" (d-mmm date serial)
  const c2IsNumeric = /^\d+$/.test(flightDigits);
  const c2Xml = c2IsNumeric
    ? makeNumberCell('C2', 2, Number(flightDigits))
    : makeStringCell('C2', 2, flightDigits);

  const excelSerial = toExcelDateSerial(segment?.DepartureDate);
  const d2Xml =
    excelSerial !== null
      ? makeNumberCell('D2', 4, excelSerial)
      : makeStringCell('D2', 2, formatExcelFlightDate(segment?.DepartureDate));

  const row2Cells = [
    makeStringCell('A2', 2, depIata),
    makeStringCell('B2', 2, arrIata),
    c2Xml,
    d2Xml
  ].join('');
  xmlRows.push(
    `<row r="2" spans="1:18" ht="14.85" customHeight="1">${row2Cells}</row>`
  );

  // Row 3: Grey passenger table headers (A3:R3) -> s="1"
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
  const row3Cells = row3Headers
    .map((h, i) => makeStringCell(`${EXCEL_COL_LETTERS[i]}3`, 1, h))
    .join('');
  xmlRows.push(
    `<row r="3" spans="1:18" ht="14.85" customHeight="1">${row3Cells}</row>`
  );

  // Row 4+: Blue passenger rows -> s="5" (and s="6" when blank, both #8DB4E2 blue fill)
  passengers.forEach((p, idx) => {
    const rowNum = 4 + idx;
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

    const rowValues = [
      idx === 0 ? '1' : idx + 1,
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

    const cellsXml = rowValues
      .map((val, colIdx) => {
        const ref = `${EXCEL_COL_LETTERS[colIdx]}${rowNum}`;
        if (colIdx === 0 && typeof val === 'number') {
          return makeNumberCell(ref, 5, val);
        }
        if (val === '' || val === null || val === undefined) {
          return `<c r="${ref}" s="6"/>`;
        }
        return makeStringCell(ref, 5, val);
      })
      .join('');

    xmlRows.push(
      `<row r="${rowNum}" spans="1:18" ht="14.85" customHeight="1">${cellsXml}</row>`
    );
  });

  const lastRow = Math.max(3 + passengers.length, 3);
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:R${lastRow}"/><sheetViews><sheetView tabSelected="1" workbookViewId="0"/></sheetViews><sheetFormatPr defaultRowHeight="13.2"/><cols><col min="1" max="1" width="5.109375" customWidth="1"/><col min="2" max="2" width="7.6640625" customWidth="1"/><col min="3" max="3" width="15.44140625" customWidth="1"/><col min="4" max="4" width="11.5546875" customWidth="1"/><col min="5" max="6" width="18" customWidth="1"/><col min="7" max="7" width="30.6640625" bestFit="1" customWidth="1"/><col min="8" max="8" width="18" customWidth="1"/><col min="9" max="12" width="11.5546875" customWidth="1"/><col min="13" max="14" width="7.6640625" customWidth="1"/><col min="15" max="15" width="10.21875" customWidth="1"/><col min="16" max="16" width="12.88671875" customWidth="1"/><col min="17" max="17" width="18" customWidth="1"/><col min="18" max="18" width="9" customWidth="1"/></cols><sheetData>${xmlRows.join(
    ''
  )}</sheetData><pageMargins left="0.39" right="0.39" top="0.39" bottom="0.39" header="0" footer="0"/><pageSetup fitToHeight="0" orientation="landscape"/></worksheet>`;

  const sharedStringsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${totalStringRefs}" uniqueCount="${
    sharedStrings.length
  }">${sharedStrings.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('')}</sst>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Page 1" sheetId="1" r:id="rId1"/></sheets></workbook>`;

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`;

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`;

  const blob = createZipBlob(
    [
      { name: '[Content_Types].xml', content: contentTypesXml },
      { name: '_rels/.rels', content: rootRelsXml },
      { name: 'xl/workbook.xml', content: workbookXml },
      { name: 'xl/_rels/workbook.xml.rels', content: workbookRelsXml },
      { name: 'xl/styles.xml', content: REFERENCE_EXCEL_STYLES_XML },
      { name: 'xl/sharedStrings.xml', content: sharedStringsXml },
      { name: 'xl/worksheets/sheet1.xml', content: sheetXml }
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );

  triggerBlobDownload(blob, filename);
}

// Alias so both Excel buttons produce the exact reference format
export const downloadExcelPassengersList = downloadExcelManifest;

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

  const blob = createZipBlob(
    [
      { name: '[Content_Types].xml', content: contentTypesXml },
      { name: '_rels/.rels', content: relsXml },
      { name: 'word/_rels/document.xml.rels', content: wordRelsXml },
      { name: 'word/document.xml', content: documentXml }
    ],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  );

  triggerBlobDownload(blob, filename);
}
