import xlsx from 'xlsx';
import { Builder } from 'xml2js';
import fs from 'fs';
import { validateIBAN, validateBIC, validateAmount, validateMandateId, validateMandateDate } from './validators.js';

const CREDITOR_NAME = "Your Company Name";
const CREDITOR_IBAN = "DE02701500000000594937";
const CREDITOR_BIC = "SSKMDEMM";
const CREDITOR_ID = "DE98ZZZ09999999999";

function validateTransaction(transaction, index) {
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
  if (!validateAmount(transaction.Amount)) {
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

function generateSepaXML(transactions) {
  const now = new Date();
  const msgId = `MSG${now.getTime()}`;
  const pmtInfId = `PMT${now.getTime()}`;
  const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.Amount), 0);

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
          DrctDbtTxInf: transactions.map(t => ({
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

function processExcel() {
  try {
    if (!fs.existsSync('input.xlsx')) {
      console.error('Error: input.xlsx file not found!');
      return;
    }

    const workbook = xlsx.readFile('input.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const transactions = xlsx.utils.sheet_to_json(worksheet);

    if (transactions.length === 0) {
      console.error('Error: No transactions found in Excel file');
      return;
    }

    // Validate all transactions
    const allErrors = [];
    transactions.forEach((transaction, index) => {
      const errors = validateTransaction(transaction, index);
      allErrors.push(...errors);
    });

    if (allErrors.length > 0) {
      console.error('Validation errors found:');
      allErrors.forEach(error => console.error(error));
      return;
    }

    const xml = generateSepaXML(transactions);
    fs.writeFileSync('output.xml', xml);
    console.log(`Successfully generated SEPA XML file with ${transactions.length} transactions`);
    console.log(`Total amount: ${transactions.reduce((sum, t) => sum + parseFloat(t.Amount), 0).toFixed(2)} EUR`);

  } catch (error) {
    console.error('Error processing file:', error.message);
  }
}

processExcel();
