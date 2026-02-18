import React, { useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

const Reports = () => {
  const [reportType, setReportType] = useState('visits');

  const visitData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{
      label: 'Visits Completed',
      data: [120, 145, 132, 158],
      backgroundColor: '#2196F3'
    }, {
      label: 'Visits Missed',
      data: [12, 8, 15, 10],
      backgroundColor: '#F44336'
    }]
  };

  const patientData = {
    labels: ['0-5 years', '5-18 years', '18-40 years', '40-60 years', '60+ years'],
    datasets: [{
      data: [120, 180, 250, 150, 80],
      backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336']
    }]
  };

  const performanceData = {
    labels: ['CHW 1', 'CHW 2', 'CHW 3', 'CHW 4', 'CHW 5'],
    datasets: [{
      label: 'Visits This Month',
      data: [45, 52, 38, 61, 55],
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      fill: true
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    }
  };

  return (
    <div>
      <div className="filters">
        <div className="filter-group">
          <label>Report Type:</label>
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="visits">Visit Reports</option>
            <option value="patients">Patient Reports</option>
            <option value="performance">CHW Performance</option>
          </select>
        </div>
        <button className="btn btn-primary">Export PDF</button>
      </div>

      {reportType === 'visits' && (
        <div className="card">
          <div className="card-header">
            <h3>Visit Trends</h3>
          </div>
          <div className="card-body" style={{ height: 400 }}>
            <Bar data={visitData} options={chartOptions} />
          </div>
        </div>
      )}

      {reportType === 'patients' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-header">
              <h3>Age Distribution</h3>
            </div>
            <div className="card-body" style={{ height: 300 }}>
              <Pie data={patientData} options={chartOptions} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3>Patient Categories</h3>
            </div>
            <div className="card-body">
              <table>
                <thead>
                  <tr><th>Category</th><th>Count</th><th>%</th></tr>
                </thead>
                <tbody>
                  <tr><td>Active Patients</td><td>450</td><td>60%</td></tr>
                  <tr><td>Pregnant Women</td><td>85</td><td>11%</td></tr>
                  <tr><td>High Risk</td><td>42</td><td>6%</td></tr>
                  <tr><td>Chronic Conditions</td><td>120</td><td>16%</td></tr>
                  <tr><td>Under 5</td><td>95</td><td>13%</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {reportType === 'performance' && (
        <div className="card">
          <div className="card-header">
            <h3>CHW Performance</h3>
          </div>
          <div className="card-body" style={{ height: 400 }}>
            <Line data={performanceData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
