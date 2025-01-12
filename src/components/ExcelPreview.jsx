import React from 'react';

function ExcelPreview({ data }) {
  if (!data || !data.headers || !data.rows) {
    return null;
  }

  return (
    <div className="preview-container">
      <h3>Excel Preview</h3>
      <div className="table-container">
        <table className="preview-table">
          <thead>
            <tr>
              {data.headers.map((header, index) => (
                <th key={index}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {data.headers.map((header, colIndex) => (
                  <td key={colIndex}>{row[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ExcelPreview;
