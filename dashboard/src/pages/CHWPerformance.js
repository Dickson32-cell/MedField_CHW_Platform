import React, { useState, useEffect } from 'react';
import { Bar, Radar } from 'react-chartjs-2';
import api from '../services/api';

const CHWPerformance = () => {
  const [chwList, setChwList] = useState([]);
  const [selectedChw, setSelectedChw] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCHWs();
  }, []);

  useEffect(() => {
    if (selectedChw) {
      fetchPerformance(selectedChw);
    }
  }, [selectedChw]);

  const fetchCHWs = async () => {
    try {
      const response = await api.get('/users?role=chw');
      setChwList(response.data);
      if (response.data.length > 0) {
        setSelectedChw(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching CHWs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (chwId) => {
    try {
      const response = await api.get(`/analytics/performance/${chwId}`);
      setPerformanceData(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    }
  };

  const performanceMetrics = performanceData ? {
    labels: ['Visits', 'Punctuality', 'Patient Satisfaction', 'Report Submission', 'Follow-up Rate'],
    datasets: [
      {
        label: selectedChw?.username || 'CHW',
        data: [
          performanceData.visitScore || 0,
          performanceData.punctualityScore || 0,
          performanceData.satisfactionScore || 0,
          performanceData.reportScore || 0,
          performanceData.followUpScore || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2
      }
    ]
  } : null;

  const comparisonData = performanceData ? {
    labels: ['Visits Completed', 'Expected', 'Referrals Made', 'Reports On Time'],
    datasets: [
      {
        label: 'This CHW',
        data: [
          performanceData.visitsCompleted || 0,
          performanceData.visitsExpected || 0,
          performanceData.referralsMade || 0,
          performanceData.reportsOnTime || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.5)'
      },
      {
        label: 'District Average',
        data: [
          performanceData.districtAvgVisits || 0,
          performanceData.districtAvgVisits || 0,
          performanceData.districtAvgReferrals || 0,
          performanceData.districtAvgReports || 0
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.5)'
      }
    ]
  } : null;

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">CHW Performance</h1>
        <select
          value={selectedChw?.id || ''}
          onChange={(e) => setSelectedChw(chwList.find(c => c.id === parseInt(e.target.value)))}
          className="border rounded px-3 py-2"
        >
          {chwList.map(chw => (
            <option key={chw.id} value={chw.id}>{chw.username}</option>
          ))}
        </select>
      </div>

      {performanceData && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Overall Score</h3>
              <p className="text-4xl font-bold text-blue-600">
                {performanceData.overallScore || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {performanceData.rank ? `Rank #${performanceData.rank} in district` : ''}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Visits This Month</h3>
              <p className="text-4xl font-bold text-green-600">
                {performanceData.visitsCompleted || 0}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {performanceData.visitsExpected ? `Target: ${performanceData.visitsExpected}` : ''}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-gray-500 text-sm">Patient Satisfaction</h3>
              <p className="text-4xl font-bold text-yellow-600">
                {performanceData.satisfactionScore || 0}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Based on {performanceData.surveysCompleted || 0} surveys
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Performance Radar</h2>
              <div className="h-64">
                <Radar data={performanceMetrics} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">vs District Average</h2>
              <div className="h-64">
                <Bar 
                  data={comparisonData}
                  options={{
                    responsive: true,
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Date</th>
                  <th className="text-left py-2">Activity</th>
                  <th className="text-left py-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {(performanceData.recentActivity || []).map((activity, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-2">{activity.date}</td>
                    <td className="py-2">{activity.description}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        activity.score >= 80 ? 'bg-green-100 text-green-800' :
                        activity.score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {activity.score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default CHWPerformance;
