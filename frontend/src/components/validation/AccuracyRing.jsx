import React from "react";

export default function AccuracyRing({ percentage = 92 }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const svgSize = 160;
  const center = svgSize / 2;

  return (
    <div style={{ position: "relative", width: "160px", height: "160px", margin: "auto" }}>
      <svg width="160" height="160">
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e6e6e6"
          strokeWidth="12"
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#4CAF50"
          strokeWidth="12"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1.5s ease-in-out",
            transform: "rotate(-90deg)",
            transformOrigin: `${center}px ${center}px`
          }}
        />
      </svg>

      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -55%)",
        textAlign: "center",
        color: "#2D2D2D",
      }}>
        <div style={{ fontSize: "34px", fontWeight: "700", lineHeight: "1.2" }}>{percentage}%</div>
        <div style={{ fontSize: "14px", marginTop: "4px", color: "#444", lineHeight: "1.2" }}>
          Validation Match
        </div>
      </div>
    </div>
  );
}

