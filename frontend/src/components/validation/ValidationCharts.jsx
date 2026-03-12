import React from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  BarChart, Bar, ResponsiveContainer
} from "recharts";

const sampleData = [
  { day: "Mon", cpcb: 210, model: 205 },
  { day: "Tue", cpcb: 240, model: 230 },
  { day: "Wed", cpcb: 280, model: 275 },
  { day: "Thu", cpcb: 300, model: 295 },
  { day: "Fri", cpcb: 250, model: 245 }
];

const pollutantData = [
  { pollutant: "PM2.5", cpcb: 148, model: 152 },
  { pollutant: "PM10",  cpcb: 190, model: 194 },
  { pollutant: "NO2",   cpcb: 68,  model: 70  }
];

export default function ValidationCharts() {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3 style={{ marginBottom: "20px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
        CPCB vs Model AQI Trend
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={sampleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="day" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="cpcb" 
            stroke="#8884d8" 
            name="CPCB AQI" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line 
            type="monotone" 
            dataKey="model" 
            stroke="#82ca9d" 
            name="Model AQI" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: "40px", marginBottom: "20px", fontSize: "18px", fontWeight: "600", color: "#333" }}>
        Pollutant Comparison (CPCB vs Model)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={pollutantData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="pollutant" stroke="#666" />
          <YAxis stroke="#666" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <Legend />
          <Bar dataKey="cpcb" fill="#8884d8" name="CPCB Value" radius={[4, 4, 0, 0]} />
          <Bar dataKey="model" fill="#82ca9d" name="Model Value" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

