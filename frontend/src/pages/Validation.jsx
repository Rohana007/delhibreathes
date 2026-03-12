import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AccuracyRing from "../components/validation/AccuracyRing";
import ValidationComparisonCards from "../components/validation/ValidationComparisonCards";
import ValidationCharts from "../components/validation/ValidationCharts";
import ValidationFlowDiagram from "../components/validation/ValidationFlowDiagram";
import ForecastLineChart from "../components/forecasting/ForecastLineChart";
import ForecastCards from "../components/forecasting/ForecastCards";
import ForecastWarning from "../components/forecasting/ForecastWarning";

export default function ValidationPage() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      padding: "30px", 
      width: "100%", 
      minHeight: "100vh",
      background: "#f5f5f5" 
    }}>
      {/* Back Button */}
      <motion.button
        onClick={() => navigate('/dashboard')}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          marginBottom: "20px",
          backgroundColor: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: "600",
          color: "#334155",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#f1f5f9";
          e.currentTarget.style.borderColor = "#cbd5e1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "white";
          e.currentTarget.style.borderColor = "#e2e8f0";
        }}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </motion.button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 style={{ 
          textAlign: "center", 
          marginBottom: "30px",
          fontSize: "32px",
          fontWeight: "700",
          color: "#0F172A"
        }}>
          Data Validation & Forecasting Dashboard
        </h1>

        {/* ============================
            VALIDATION SECTION
        ============================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "white",
            padding: "30px",
            marginBottom: "30px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          <h2 style={{ 
            marginBottom: "30px",
            fontSize: "24px",
            fontWeight: "600",
            color: "#222",
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "10px"
          }}>
            CPCB Validation Overview
          </h2>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: "20px"
          }}>
            <AccuracyRing percentage={92} />

            <div style={{
              marginTop: "30px"
            }}>
              <ValidationComparisonCards />
            </div>
          </div>
          <div style={{ marginTop: "30px" }}>
            <ValidationCharts />
          </div>
          <div style={{ marginTop: "30px" }}>
            <ValidationFlowDiagram />
          </div>
        </motion.div>

        {/* ============================
            FORECASTING SECTION
        ============================ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
          }}
        >
          <h2 style={{ 
            marginBottom: "30px",
            fontSize: "24px",
            fontWeight: "600",
            color: "#333",
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "10px"
          }}>
            AQI Forecasting
          </h2>

          <ForecastLineChart />
          <ForecastCards />
        </motion.div>
      </motion.div>
    </div>
  );
}

