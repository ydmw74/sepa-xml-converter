import * as XLSX from 'xlsx';

const data = [
  {
    'IBAN': 'DE89370400440532013000',
    'BIC': 'DEUTDEBBXXX',
    'Name': 'John Doe',
    'Amount': 100.50,
    'Mandate ID': 'MANDATE123',
    'Mandate Date': '2023-01-01',
    'Description': 'Invoice 123'
  },
  {
    'IBAN': 'DE27100777770209299700',
    'BIC': 'DEUTDEBBXXX',
    'Name': 'Jane Smith',
    'Amount': 75.25,
    'Mandate ID': 'MANDATE124',
    'Mandate Date': '2023-01-02',
    'Description': 'Invoice 124'
  }
];

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(data);
XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
XLSX.writeFile(workbook, 'input.xlsx');

console.log('Sample Excel file created successfully!');
