# SEPA XML Converter

## Overview
The SEPA XML Converter is a tool designed to convert Excel files into SEPA XML format. This application is particularly useful for financial institutions and businesses that need to process SEPA payments efficiently.

## Features
- **Excel to SEPA XML Conversion**: Convert Excel files containing payment details into SEPA XML format.
- **Validation**: Validate the Excel files before conversion to ensure data integrity.
- **Preview**: Preview the Excel file content before conversion.
- **Output**: Generate SEPA XML files that can be used for payment processing.

## Getting Started

### Prerequisites
- Node.js (version 14 or later)
- npm (version 6 or later)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sepa-xml-converter.git
   cd sepa-xml-converter
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

### Usage
1. **Convert Excel to SEPA XML**:
   - Place your Excel file in the root directory of the project.
   - Run the conversion script:
     ```bash
     node create-excel.js
     ```
   - The generated SEPA XML file will be saved in the root directory.

2. **Validate Excel File**:
   - Run the validation script:
     ```bash
     node validators.js
     ```
   - The script will output the validation results.

3. **Preview Excel File**:
   - Run the preview script:
     ```bash
     node src/components/ExcelPreview.jsx
     ```
   - The script will display the content of the Excel file in the terminal.

## File Structure
```
sepa-xml-converter/
├── .gitignore
├── create-excel.js
├── example.xlsx
├── index.html
├── index.js
├── output.xml
├── package-lock.json
├── package.json
├── README.md
├── validators.js
└── src/
    ├── App.jsx
    ├── index.css
    ├── main.jsx
    ├── sepaConverter.js
    ├── validators.js
    └── components/
        └── ExcelPreview.jsx
```

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
