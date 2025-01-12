import React, { useState } from 'react';
import sepaConverter from './sepaConverter';
import ExcelPreview from './components/ExcelPreview';

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [xmlData, setXmlData] = useState(null);
  const [decimalSeparator, setDecimalSeparator] = useState('.');
  const [previewData, setPreviewData] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [availableSheets, setAvailableSheets] = useState([]);

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
      setError(null);
      try {
        const { sheets, preview, firstSheet } = await sepaConverter.previewExcel(selectedFile);
        setAvailableSheets(sheets);
        setSelectedSheet(firstSheet);
        setPreviewData(preview);
        if (preview.detectedSeparator) {
          setDecimalSeparator(preview.detectedSeparator);
        }
      } catch (err) {
        setError('Error reading Excel file: ' + err.message);
      }
    } else {
      setError('Please select a valid Excel (.xlsx) file');
      setFile(null);
      setPreviewData(null);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setError(null);
      try {
        const { sheets, preview, firstSheet } = await sepaConverter.previewExcel(droppedFile);
        setAvailableSheets(sheets);
        setSelectedSheet(firstSheet);
        setPreviewData(preview);
        if (preview.detectedSeparator) {
          setDecimalSeparator(preview.detectedSeparator);
        }
      } catch (err) {
        setError('Error reading Excel file: ' + err.message);
      }
    } else {
      setError('Please drop a valid Excel (.xlsx) file');
      setPreviewData(null);
    }
  };

  const handleSheetChange = async (event) => {
    const newSheet = event.target.value;
    setSelectedSheet(newSheet);
    try {
      const { preview } = await sepaConverter.previewExcel(file, newSheet);
      setPreviewData(preview);
      if (preview.detectedSeparator) {
        setDecimalSeparator(preview.detectedSeparator);
      }
    } catch (err) {
      setError('Error reading sheet: ' + err.message);
    }
  };

  const handleDecimalSeparatorChange = (event) => {
    setDecimalSeparator(event.target.value);
  };

  const handleConvert = async () => {
    try {
      setError(null);
      setSuccess(null);
      const result = await sepaConverter.processExcel(file, decimalSeparator, selectedSheet);
      setXmlData(result.xml);
      setSuccess(`Successfully converted ${result.transactionCount} transactions with total amount: ${result.totalAmount} EUR`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = () => {
    if (!xmlData) return;

    const blob = new Blob([xmlData], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sepa-direct-debit.xml';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setXmlData(null);
    setDecimalSeparator('.');
    setPreviewData(null);
    setSelectedSheet('');
    setAvailableSheets([]);
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    sepaConverter.generateTemplate();
  };

  return (
    <div className="container">
      <h1>SEPA Direct Debit Converter</h1>
      
      <div className="template-section">
        <p>New to SEPA Direct Debit? Start with our template:</p>
        <button 
          className="button button-secondary"
          onClick={handleDownloadTemplate}
        >
          Download Excel Template
        </button>
      </div>
      
      <div 
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          onChange={handleFileChange}
          accept=".xlsx"
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input">
          {file ? file.name : 'Drop Excel file here or click to select'}
        </label>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {previewData && (
        <div className="settings-panel">
          <div className="settings-row">
            <label>
              Select Sheet:
              <select 
                value={selectedSheet} 
                onChange={handleSheetChange}
                className="select"
              >
                {availableSheets.map(sheet => (
                  <option key={sheet} value={sheet}>{sheet}</option>
                ))}
              </select>
            </label>

            <label>
              Amount Decimal Separator:
              <select 
                value={decimalSeparator} 
                onChange={handleDecimalSeparatorChange}
                className="select"
              >
                <option value=".">Point (1234.56)</option>
                <option value=",">Comma (1234,56)</option>
              </select>
            </label>
          </div>

          <div className="preview-info">
            <p>Detected decimal separator: <strong>{previewData.detectedSeparator === ',' ? 'Comma' : 'Point'}</strong></p>
            <p>Please verify that the amounts are displayed correctly with the selected decimal separator.</p>
          </div>

          <ExcelPreview data={previewData} />
        </div>
      )}

      <div className="button-group">
        <button 
          className="button"
          onClick={handleConvert}
          disabled={!file}
        >
          Convert to SEPA XML
        </button>

        {xmlData && (
          <button 
            className="button"
            onClick={handleDownload}
          >
            Download XML
          </button>
        )}

        <button 
          className="button button-reset"
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

export default App;
