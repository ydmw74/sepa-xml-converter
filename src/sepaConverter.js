import * as XLSX from 'xlsx';
import { Builder } from 'xml2js';
import { validateIBAN, validateBIC, validateAmount, validateMandateId, validateMandateDate } from './validators.js';

const CREDITOR_NAME = "Your Company Name";
let CREDITOR_IBAN = "DE02701500000000594937";
let CREDITOR_BIC = "SSKMDEMM";
const CREDITOR_ID = "DE98ZZZ09999999999";

function formatDate(dateString) {
  // Handle Excel date number format
  if (typeof dateString === 'number') {
    // Excel dates are number of days since 1900-01-01 (or 1904-01-01)
    const date = new Date((dateString - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }

  // Handle string date formats
  const date = new Date(dateString);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try to parse common European date formats (DD.MM.YYYY or DD/MM/YYYY)
  const parts = dateString.split(/[./]/);
  if (parts.length === 3) {
    // Assume DD.MM.YYYY or DD/MM/YYYY format
    const [day, month, year] = parts;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  throw new Error('Invalid date format');
}

function parseAmount(amount, decimalSeparator) {
  if (typeof amount === 'number') {
    return amount;
  }

  const cleanAmount = amount.toString()
    .replace(/[^0-9.,]/g, '')
    .replace(decimalSeparator === ',' ? /,([^,]*)$/ : /\.([^.]*)$/, '.$1')
    .replace(/[,]/g, '');

  return parseFloat(cleanAmount);
}

function validateTransaction(transaction, index, decimalSeparator) {
  const errors = [];

  if (!validateIBAN(transaction.IBAN)) {
    errors.push(`Row ${index + 1}: Invalid IBAN`);
  }
  if (!validateBIC(transaction.BIC)) {
    errors.push(`Row ${index + 1}: Invalid BIC`);
  }
  if (!transaction.Name || transaction.Name.length > 70) {
    errors.push(`Row ${index + 1}: Invalid Name (max 70 characters)`);
  }

  const amount = parseAmount(transaction.Amount, decimalSeparator);
  if (isNaN(amount) || !validateAmount(amount)) {
    errors.push(`Row ${index + 1}: Invalid Amount`);
  }

  if (!validateMandateId(transaction['Mandate ID'])) {
    errors.push(`Row ${index + 1}: Invalid Mandate ID`);
  }

  try {
    const formattedDate = formatDate(transaction['Mandate Date']);
    if (!validateMandateDate(formattedDate)) {
      errors.push(`Row ${index + 1}: Invalid Mandate Date`);
    }
  } catch (error) {
    errors.push(`Row ${index + 1}: Invalid Mandate Date format`);
  }

  if (!transaction.Description || transaction.Description.length > 140) {
    errors.push(`Row ${index + 1}: Invalid Description (max 140 characters)`);
  }

  return errors;
}

function generateSepaXML(transactions, decimalSeparator, creditorIBAN, creditorBIC, initgPty, cdtrSchmeId, seqTp) {
  const now = new Date();
  const msgId = `MSG${now.getTime()}`;
  const pmtInfId = `PMT${now.getTime()}`;

  const parsedTransactions = transactions.map(t => ({
    ...t,
    Amount: parseAmount(t.Amount, decimalSeparator),
    'Mandate Date': formatDate(t['Mandate Date'])
  }));

  const totalAmount = parsedTransactions.reduce((sum, t) => sum + t.Amount, 0);

  // Log values for debugging
  console.log('creditorIBAN:', creditorIBAN);
  console.log('creditorBIC:', creditorBIC);
  console.log('initgPty:', initgPty);
  console.log('cdtrSchmeId:', cdtrSchmeId);
  console.log('seqTp:', seqTp);

  // Validate required fields
  if (!creditorIBAN || !creditorBIC || !initgPty || !cdtrSchmeId || !seqTp) {
    throw new Error('Missing required fields for XML generation');
  }

  const xmlObj = {
    Document: {
      '$': {
        'xmlns': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02',
        'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
        'xsi:schemaLocation': 'urn:iso:std:iso:20022:tech:xsd:pain.008.001.02 pain.008.001.02.xsd'
      },
      CstmrDrctDbtInitn: {
        GrpHdr: {
          MsgId: msgId,
          CreDtTm: now.toISOString(),
          NbOfTxs: transactions.length,
          CtrlSum: totalAmount.toFixed(2),
          InitgPty: {
            Nm: initgPty
          }
        },
        PmtInf: {
          PmtInfId: pmtInfId,
          PmtMtd: 'DD',
          NbOfTxs: transactions.length,
          CtrlSum: totalAmount.toFixed(2),
          PmtTpInf: {
            SvcLvl: { Cd: 'SEPA' },
            LclInstrm: { Cd: 'CORE' },
            SeqTp: seqTp
          },
          ReqdColltnDt: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
          Cdtr: {
            Nm: initgPty
          },
          CdtrAcct: {
            Id: { IBAN: creditorIBAN }
          },
          CdtrAgt: {
            FinInstnId: { BIC: creditorBIC }
          },
          ChrgBr: 'SLEV',
          CdtrSchmeId: {
            Id: {
              PrvtId: {
                Othr: {
                  Id: cdtrSchmeId,
                  SchmeNm: { Prtry: 'SEPA' }
                }
              }
            }
          },
          DrctDbtTxInf: parsedTransactions.map(t => ({
            PmtId: { EndToEndId: `NOTPROVIDED` },
            InstdAmt: { '_': t.Amount.toFixed(2), '$': { Ccy: 'EUR' } },
            DrctDbtTx: {
              MndtRltdInf: {
                MndtId: t['Mandate ID'],
                DtOfSgntr: t['Mandate Date']
              }
            },
            DbtrAgt: {
              FinInstnId: { BIC: t.BIC }
            },
            Dbtr: { Nm: t.Name },
            DbtrAcct: {
              Id: { IBAN: t.IBAN }
            },
            RmtInf: { Ustrd: t.Description }
          }))
        }
      }
    }
  };

  const builder = new Builder({ headless: true });
  return builder.buildObject(xmlObj);
}

function detectDecimalSeparator(worksheet) {
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const rows = data.slice(1);

  for (const row of rows) {
    const amountCell = row[data[0].findIndex(header => header === 'Amount')];
    if (amountCell) {
      const amountStr = amountCell.toString();
      if (amountStr.includes(',')) return ',';
      if (amountStr.includes('.')) return '.';
    }
  }
  return '.';
}

const sepaConverter = {
  async previewExcel(file, selectedSheet = null) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', raw: true });

          const sheets = workbook.SheetNames;

          if (sheets.length === 0) {
            throw new Error('No sheets found in Excel file');
          }

          const sheetName = selectedSheet || sheets[0];
          const worksheet = workbook.Sheets[sheetName];

          const detectedSeparator = detectDecimalSeparator(worksheet);

          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: ''
          });

          if (jsonData.length === 0) {
            throw new Error('No data found in selected sheet');
          }

          const headers = Object.keys(jsonData[0]);
          const previewRows = jsonData.slice(0, 5);

          resolve({
            sheets,
            firstSheet: sheets[0],
            preview: {
              headers,
              rows: previewRows,
              detectedSeparator
            }
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  },

  async processExcel(file, decimalSeparator, selectedSheet) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[selectedSheet];
          const transactions = XLSX.utils.sheet_to_json(worksheet);

          if (transactions.length === 0) {
            throw new Error('No transactions found in Excel file');
          }

          const allErrors = [];
          transactions.forEach((transaction, index) => {
            const errors = validateTransaction(transaction, index, decimalSeparator);
            allErrors.push(...errors);
          });

          if (allErrors.length > 0) {
            throw new Error('Validation errors found:\n' + allErrors.join('\n'));
          }

const creditorIBAN = transactions[0]['Creditor IBAN'];
const creditorBIC = transactions[0]['Creditor BIC'];
const initgPty = transactions[0]['Creditor Name'];
const cdtrSchmeId = transactions[0]['Creditor ID'];
const seqTp = transactions[0]['Sequence Type'];

          const xml = generateSepaXML(transactions, decimalSeparator, creditorIBAN, creditorBIC, initgPty, cdtrSchmeId, seqTp);
          const totalAmount = transactions.reduce((sum, t) =>
            sum + parseAmount(t.Amount, decimalSeparator), 0
          ).toFixed(2);

          resolve({
            xml,
            transactionCount: transactions.length,
            totalAmount
          });
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsArrayBuffer(file);
    });
  },

  generateTemplate() {
const templateData = [
  {
    'IBAN': 'DE89370400440532013000',
    'BIC': 'DEUTDEBBXXX',
    'Name': 'John Doe GmbH',
    'Amount': '1234.56',
    'Mandate ID': 'MANDATE-2023-001',
    'Mandate Date': '2023-01-01',
    'Description': 'Invoice 2023-001',
    'Creditor IBAN': 'DE02701500000000594937',
    'Creditor BIC': 'SSKMDEMM',
    'Creditor Name': 'Your Company Name',
    'Creditor ID': 'DE98ZZZ09999999999',
    'Sequence Type': 'RCUR'
  }
];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([]);

const headerComments = {
  'IBAN': 'Debtor\'s IBAN (e.g., DE89370400440532013000)',
  'BIC': 'Debtor\'s BIC (e.g., DEUTDEBBXXX)',
  'Name': 'Debtor\'s name (max 70 characters)',
  'Amount': 'Amount in EUR (e.g., 1234.56 or 1234,56)',
  'Mandate ID': 'Unique mandate reference (max 35 characters)',
  'Mandate Date': 'Date when mandate was signed (YYYY-MM-DD, DD.MM.YYYY, or DD/MM/YYYY)',
  'Description': 'Payment reference (max 140 characters)',
  'Creditor IBAN': 'Creditor\'s IBAN (e.g., DE02701500000000594937)',
  'Creditor BIC': 'Creditor\'s BIC (e.g., SSKMDEMM)',
  'Creditor Name': 'Creditor Name (e.g., Your Company Name)',
  'Creditor ID': 'Creditor ID (e.g., DE98ZZZ09999999999)',
  'Sequence Type': 'Sequence Type (e.g., RCUR)'
};

const colWidths = {
  'IBAN': 25,
  'BIC': 15,
  'Name': 30,
  'Amount': 15,
  'Mandate ID': 20,
  'Mandate Date': 15,
  'Description': 40,
  'Creditor IBAN': 25,
  'Creditor BIC': 15,
  'Creditor Name': 30,
  'Creditor ID': 25,
  'Sequence Type': 15
};

    XLSX.utils.sheet_add_json(ws, templateData);

    const range = XLSX.utils.decode_range(ws['!ref']);
    const cols = [];

    Object.keys(headerComments).forEach((header, idx) => {
      const headerCell = XLSX.utils.encode_cell({ r: 0, c: idx });
      if (!ws[headerCell].c) ws[headerCell].c = [];
      ws[headerCell].c.push({ t: headerComments[header] });

      cols.push({ wch: colWidths[header] });
    });

    ws['!cols'] = cols;

    XLSX.utils.book_append_sheet(wb, ws, 'SEPA Template');
    XLSX.writeFile(wb, 'sepa-direct-debit-template.xlsx');
  }
};

export default sepaConverter;
