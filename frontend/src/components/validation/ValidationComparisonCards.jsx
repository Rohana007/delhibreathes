import React from "react";

export default function ValidationComparisonCards() {
  const data = {
    cpcb: { pm25: 148, aqi: "Poor" },
    model: { pm25: 152, aqi: "Poor" }
  };

  return (
    <div style={{
      display: "flex",
      gap: "30px",
      justifyContent: "center",
      flexWrap: "wrap"
    }}>
      <div style={{
        border: "1px solid #DDD",
        borderRadius: "12px",
        padding: "20px 25px",
        width: "260px",
        background: "white",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#222", marginBottom: "16px", marginTop: "0" }}>
          CPCB Reference
        </h3>
        <p style={{ fontSize: "15px", color: "#222", margin: "10px 0", lineHeight: "1.6" }}>
          <strong style={{ color: "#222", fontWeight: "600" }}>PM2.5:</strong> {data.cpcb.pm25} µg/m³
        </p>
        <p style={{ fontSize: "15px", color: "#222", margin: "10px 0", lineHeight: "1.6" }}>
          <strong style={{ color: "#222", fontWeight: "600" }}>Category:</strong> {data.cpcb.aqi}
        </p>
      </div>
      <div style={{
        border: "1px solid #DDD",
        borderRadius: "12px",
        padding: "20px 25px",
        width: "260px",
        background: "white",
        textAlign: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.06)"
      }}>
        <h3 style={{ fontSize: "18px", fontWeight: "600", color: "#222", marginBottom: "16px", marginTop: "0" }}>
          Model Output
        </h3>
        <p style={{ fontSize: "15px", color: "#222", margin: "10px 0", lineHeight: "1.6" }}>
          <strong style={{ color: "#222", fontWeight: "600" }}>PM2.5:</strong> {data.model.pm25} µg/m³
        </p>
        <p style={{ fontSize: "15px", color: "#222", margin: "10px 0", lineHeight: "1.6" }}>
          <strong style={{ color: "#222", fontWeight: "600" }}>Category:</strong> {data.model.aqi}
        </p>
      </div>
    </div>
  );
}

