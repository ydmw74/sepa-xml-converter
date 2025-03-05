# SEPA XML Converter

## Overview
The SEPA XML Converter is a web-based tool designed to convert Excel files into SEPA XML format. This application is particularly useful for financial institutions and businesses that need to process SEPA payments efficiently. The app features a user-friendly web interface for easy interaction. The tool reads an Excel file containing payment details, validates the data, and generates a SEPA XML file for payment processing.

## Features
- **Excel to SEPA XML Conversion**: Convert Excel files containing payment details into SEPA XML format.
- **Validation**: Validate the Excel files before conversion to ensure data integrity.
- **Preview**: Preview the Excel file content before conversion.
- **Output**: Generate SEPA XML files that can be used for payment processing.

## Getting Started

### Prerequisites
- Node.js (version 14 or later)
- npm (version 6 or later)
- A modern web browser (e.g., Chrome, Firefox, Safari)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/ydmw74/sepa-xml-converter.git
   cd sepa-xml-converter
   ```

2. Install the dependencies & build the app:
   ```bash
   npm install
   npm run build
   ```

### Usage
1. **Access the Web Interface**:
   - Open your web browser and navigate to `http(s)://<your-domain.tld>.
   - The web interface will load, allowing you to upload your Excel file and perform the conversion.

2. **Convert Excel to SEPA XML**:
   - Use the web interface to upload your Excel file.
   - Follow the on-screen instructions to complete the conversion process.

3. **Validate Excel File**:
   - Use the web interface to validate the Excel file.
   - The web interface will display the validation results.

4. **Preview Excel File**:
   - Use the web interface to preview the Excel file content.
   - The web interface will display the content of the Excel file.

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
