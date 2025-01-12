import React, { useState } from 'react';
import { processExcel } from './sepaConverter';

function App() {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [xmlData, setXmlData] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid Excel (.xlsx) file');
      setFile(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.xlsx')) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Please drop a valid Excel (.xlsx) file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleConvert = async () => {
    try {
      setError(null);
      setSuccess(null);
      const result = await processExcel(file);
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

  return (
    <div className="container">
      <h1>SEPA Direct Debit Converter</h1>
      
      <div 
        className="dropzone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
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
    </div>
  );
}

export default App;
