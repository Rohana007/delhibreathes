import React from 'react';
import { motion } from 'framer-motion';
import AccuracyRing from '../components/validation/AccuracyRing';
import ValidationComparisonCards from '../components/validation/ValidationComparisonCards';
import ValidationCharts from '../components/validation/ValidationCharts';
import ValidationFlowDiagram from '../components/validation/ValidationFlowDiagram';

export default function CPCBValidationPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4" style={{ color: '#0F172A' }}>
              CPCB Validation Dashboard
            </h1>
            <p className="text-lg" style={{ color: '#64748B' }}>
              Model accuracy validation against Central Pollution Control Board standards
            </p>
          </div>

          {/* Validation Overview Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              padding: "30px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "30px", fontSize: "24px", fontWeight: "600" }}>
              CPCB Validation Overview <span style={{
                background: "#4CAF50",
                color: "white",
                padding: "4px 10px",
                marginLeft: "10px",
                borderRadius: "6px",
                fontSize: "14px"
              }}>VALIDATED</span>
            </h2>
            <AccuracyRing percentage={92} />
            <ValidationComparisonCards />
          </motion.div>

          {/* Validation Visualizations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              marginTop: "40px",
              padding: "30px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              background: "white",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}
          >
            <h2 style={{ 
              textAlign: "center", 
              marginBottom: "30px",
              fontSize: "24px",
              fontWeight: "600",
              color: "#333"
            }}>
              CPCB Validation Visualizations
            </h2>
            <ValidationCharts />
            <ValidationFlowDiagram />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

