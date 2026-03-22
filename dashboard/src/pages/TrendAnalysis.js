import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import api from '../services/api';

const TrendAnalysis = () => {
  const [timeRange, setTimeRange] = useState('30'); // days
  const [metrics, setMetrics] = useState({
    visits: [],
    patients: [],
    referrals: [],
    outcomes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrends();
  }, [timeRange]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/analytics/trends?days=${timeRange}`);
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'System Trends' }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const visitData = {
    labels: metrics.visits.map(d => d.date),
    datasets: [
      {
        label: 'Visits Completed',
        data: metrics.visits.map(d => d.count),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)'
      },
      {
        label: 'Visits Scheduled',
        data: metrics.visits.map(d => d.scheduled),
        borderColor: 'rgb(107, 114, 128)',
        backgroundColor: 'rgba(107, 114, 128, 0.5)'
      }
    ]
  };

  const outcomeData = {
    labels: metrics.outcomes.map(d => d.date),
    datasets: [
      {
        label: 'Positive Outcomes',
        data: metrics.outcomes.map(d => d.positive),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.5)'
      },
      {
        label: 'Referrals Made',
        data: metrics.outcomes.map(d => d.referrals),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.5)'
      }
    ]
  };

  if (loading) return <div className="p-4">Loading trends...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trend Analysis</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Visit Trends</h2>
          <div className="h-64">
            <Line data={visitData} options={chartOptions} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Outcome Trends</h2>
          <div className="h-64">
            <Line data={outcomeData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600">Average Daily Visits</p>
            <p className="text-2xl font-bold">
              {Math.round(metrics.visits.reduce((a, b) => a + b.count, 0) / metrics.visits.length) || 0}
            </p>
          </div>
          <div className="p-4 bg-green-50 rounded">
            <p className="text-sm text-gray-600">Completion Rate</p>
            <p className="text-2xl font-bold">
              {Math.round((metrics.visits.reduce((a, b) => a + b.count, 0) / 
                metrics.visits.reduce((a, b) => a + b.scheduled, 0)) * 100) || 0}%
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded">
            <p className="text-sm text-gray-600">Referral Rate</p>
            <p className="text-2xl font-bold">
              {Math.round((metrics.outcomes.reduce((a, b) => a + b.referrals, 0) / 
                metrics.outcomes.reduce((a, b) => a + b.positive + b.referrals, 0)) * 100) || 0}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;
