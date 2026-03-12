import React from "react";

export default function ValidationFlowDiagram() {
  return (
    <div style={{
      marginTop: "30px",
      padding: "20px",
      background: "#f9f9f9",
      borderRadius: "8px"
    }}>
      <h3 style={{ 
        marginBottom: "20px", 
        fontSize: "18px", 
        fontWeight: "600", 
        color: "#333",
        textAlign: "center"
      }}>
        Validation Pipeline Flow
      </h3>
      <div style={{
        display: "flex",
        gap: "15px",
        marginTop: "20px",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <div style={{ 
          padding: "15px 20px", 
          border: "2px solid #4CAF50", 
          borderRadius: "8px",
          background: "white",
          fontWeight: "500",
          color: "#333",
          textAlign: "center",
          minWidth: "150px"
        }}>
          Satellite Data + Weather Data
        </div>
        <span style={{ fontSize: "24px", color: "#4CAF50" }}>➡</span>
        <div style={{ 
          padding: "15px 20px", 
          border: "2px solid #2196F3", 
          borderRadius: "8px",
          background: "white",
          fontWeight: "500",
          color: "#333",
          textAlign: "center",
          minWidth: "150px"
        }}>
          ML Model Estimation
        </div>
        <span style={{ fontSize: "24px", color: "#4CAF50" }}>➡</span>
        <div style={{ 
          padding: "15px 20px", 
          border: "2px solid #FF9800", 
          borderRadius: "8px",
          background: "white",
          fontWeight: "500",
          color: "#333",
          textAlign: "center",
          minWidth: "150px"
        }}>
          CPCB Ground Station Reference
        </div>
        <span style={{ fontSize: "24px", color: "#4CAF50" }}>➡</span>
        <div style={{ 
          padding: "15px 20px", 
          border: "2px solid #9C27B0", 
          borderRadius: "8px",
          background: "white",
          fontWeight: "500",
          color: "#333",
          textAlign: "center",
          minWidth: "150px"
        }}>
          Trend Matching Validation
        </div>
      </div>
      <p style={{
        marginTop: "20px",
        textAlign: "center",
        fontSize: "14px",
        color: "#666",
        fontStyle: "italic"
      }}>
        Our model predictions are continuously validated against CPCB monitoring station data for accuracy.
      </p>
    </div>
  );
}

