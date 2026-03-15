import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useDashboardStats, useRecentActivity } from '../hooks/useQueries';
import { SkeletonDashboard } from '../components/SkeletonLoader';
import CHWDashboard from './chw/CHWDashboard';
import { useAuthStore } from '../store/authStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: activity, isLoading: activityLoading } = useRecentActivity();
  
  // Render CHW-specific dashboard for CHW role
  if (user?.role === 'chw') {
    return <CHWDashboard />;
  }

  const visitChartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Visits',
      data: [12, 19, 15, 17, 22, 8, 5],
      backgroundColor: '#2196F3'
    }]
  };

  const patientChartData = {
    labels: ['Active', 'Pregnant', 'High Risk', 'Chronic'],
    datasets: [{
      data: [450, 85, 42, 120],
      backgroundColor: ['#4CAF50', '#E91E63', '#F44336', '#FF9800']
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const }
    }
  };

  if (statsLoading) {
    return <SkeletonDashboard />;
  }

  if (statsError) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading dashboard: {statsError.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <span>&#128100;</span>
          </div>
          <div className="stat-content">
            <h3>{(stats as any)?.total_chws || 0}</h3>
            <p>Total CHWs</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <span>&#129489;</span>
          </div>
          <div className="stat-content">
            <h3>{(stats as any)?.total_patients || 0}</h3>
            <p>Total Patients</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <span>&#128197;</span>
          </div>
          <div className="stat-content">
            <h3>{stats?.today_visits || 0}</h3>
            <p>Today's Visits</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <span>&#9888;</span>
          </div>
          <div className="stat-content">
            <h3>{stats?.pending_referrals || 0}</h3>
            <p>Pending Referrals</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div className="card">
          <div className="card-header">
            <h3>Weekly Visit Trends</h3>
          </div>
          <div className="card-body chart-container">
            <Bar data={visitChartData} options={chartOptions} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Patient Categories</h3>
          </div>
          <div className="card-body chart-container">
            <Doughnut data={patientChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Activity</h3>
          <button className="btn btn-sm btn-outline">View All</button>
        </div>
        <div className="card-body">
          <table className="table-container">
            <thead>
              <tr>
                <th>CHW</th>
                <th>Activity</th>
                <th>Patient</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activityLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                    Loading activity...
                  </td>
                </tr>
              ) : activity && activity.length > 0 ? (
                activity.map((log: any) => (
                  <tr key={log.id}>
                    <td>{log.user ? `${log.user.first_name} ${log.user.last_name}` : 'Unknown'}</td>
                    <td>{log.type === 'push' ? 'Data Upload' : 'Data Download'}</td>
                    <td>{log.records_pushed || log.records_pulled || 0} records</td>
                    <td>{new Date(log.timestamp || log.started_at).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${log.status === 'success' ? 'badge-success' : 'badge-warning'}`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>No recent activity</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
