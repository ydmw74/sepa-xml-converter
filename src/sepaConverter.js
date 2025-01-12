import * as XLSX from 'xlsx';
import { Builder } from 'xml2js';
import { validateIBAN, validateBIC, validateAmount, validateMandateId, validateMandateDate } from '../validators.js';

const CREDITOR_NAME = "Your Company Name";
const CREDITOR_IBAN = "DE02701500000000594937";
const CREDITOR_BIC = "SSKMDEMM";
const CREDITOR_ID = "DE98ZZZ09999999999";

function parseAmount(amount, decimalSeparator) {
  if (typeof amount === 'number') {
    return amount;
  }
  
  // Handle string amounts
  const cleanAmount = amount.toString()
    // Remove any currency symbols and whitespace
    .replace(/[^0-9.,]/g, '')
    // Replace the selected decimal separator with a dot
    .replace(decimalSeparator === ',' ? /,([^,]*)$/ : /\.([^.]*)$/, '.$1')
    // Remove any remaining separators
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
  if (!validateMandateDate(transaction['Mandate Date'])) {
    errors.push(`Row ${index + 1}: Invalid Mandate Date`);
  }
  if (!transaction.Description || transaction.Description.length > 140) {
    errors.push(`Row ${index + 1}: Invalid Description (max 140 characters)`);
  }

  return errors;
}

function generateSepaXML(transactions, decimalSeparator) {
  const now = new Date();
  const msgId = `MSG${now.getTime()}`;
  const pmtInfId = `PMT${now.getTime()}`;
  
  // Parse amounts and calculate total
  const parsedTransactions = transactions.map(t => ({
    ...t,
    Amount: parseAmount(t.Amount, decimalSeparator)
  }));
  
  const totalAmount = parsedTransactions.reduce((sum, t) => sum + t.Amount, 0);

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
            Nm: CREDITOR_NAME
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
            SeqTp: 'FRST'
          },
          ReqdColltnDt: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
          Cdtr: {
            Nm: CREDITOR_NAME
          },
          CdtrAcct: {
            Id: { IBAN: CREDITOR_IBAN }
          },
          CdtrAgt: {
            FinInstnId: { BIC: CREDITOR_BIC }
          },
          ChrgBr: 'SLEV',
          CdtrSchmeId: {
            Id: {
              PrvtId: {
                Othr: {
                  Id: CREDITOR_ID,
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

export async function processExcel(file, decimalSeparator) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const transactions = XLSX.utils.sheet_to_json(worksheet);

        if (transactions.length === 0) {
          throw new Error('No transactions found in Excel file');
        }

        // Validate all transactions
        const allErrors = [];
        transactions.forEach((transaction, index) => {
          const errors = validateTransaction(transaction, index, decimalSeparator);
          allErrors.push(...errors);
        });

        if (allErrors.length > 0) {
          throw new Error('Validation errors found:\n' + allErrors.join('\n'));
        }

        const xml = generateSepaXML(transactions, decimalSeparator);
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
}
