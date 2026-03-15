import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useDashboardStats, useMyTasks, useMyPatients } from '../../hooks/useQueries';
import { SkeletonCard } from '../../components/SkeletonLoader';
import './CHWDashboard.css';

const CHWDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: tasksData, isLoading: tasksLoading } = useMyTasks({ limit: 5 });
  const { data: patientsData, isLoading: patientsLoading } = useMyPatients({ limit: 5 });

  const tasks = tasksData?.tasks || [];
  const patients = patientsData?.patients || [];

  const quickActions = [
    { path: '/chw/tasks', label: 'My Tasks', icon: '✅', color: '#4CAF50' },
    { path: '/chw/patients', label: 'My Patients', icon: '👥', color: '#2196F3' },
    { path: '/chw/log-visit', label: 'Log Visit', icon: '📝', color: '#FF9800' },
    { path: '/chw/profile', label: 'Profile', icon: '👤', color: '#9C27B0' },
  ];

  return (
    <div className="chw-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <h1>Welcome, {user?.first_name}!</h1>
        <p className="subtitle">Community Health Worker Dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {statsLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E3F2FD' }}>📋</div>
              <div className="stat-content">
                <span className="stat-value">{stats?.pending_tasks || 0}</span>
                <span className="stat-label">Pending Tasks</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#E8F5E9' }}>👥</div>
              <div className="stat-content">
                <span className="stat-value">{(stats as any)?.total_patients || (stats as any)?.assigned_patients || 0}</span>
                <span className="stat-label">My Patients</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#FFF3E0' }}>📅</div>
              <div className="stat-content">
                <span className="stat-value">{stats?.today_visits || 0}</span>
                <span className="stat-label">Today's Visits</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          {quickActions.map((action) => (
            <Link key={action.path} to={action.path} className="action-card">
              <div 
                className="action-icon" 
                style={{ backgroundColor: `${action.color}20`, color: action.color }}
              >
                {action.icon}
              </div>
              <span className="action-label">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Tasks</h2>
          <Link to="/chw/tasks" className="view-all">View All →</Link>
        </div>
        <div className="tasks-list">
          {tasksLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : tasks.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">✅</span>
              <p>No pending tasks</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className={`task-item priority-${task.priority}`}>
                <div className="task-info">
                  <h4>{task.title}</h4>
                  <p>{task.description || 'No description'}</p>
                  <span className="task-due">
                    Due: {new Date(task.due_date).toLocaleDateString()}
                  </span>
                </div>
                <span className={`task-badge ${task.status}`}>
                  {task.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Patients */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>My Patients</h2>
          <Link to="/chw/patients" className="view-all">View All →</Link>
        </div>
        <div className="patients-list">
          {patientsLoading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : patients.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <p>No patients assigned</p>
            </div>
          ) : (
            patients.map((patient) => (
              <div key={patient.id} className="patient-item">
                <div className="patient-avatar">
                  {patient.first_name[0]}{patient.last_name[0]}
                </div>
                <div className="patient-info">
                  <h4>{patient.first_name} {patient.last_name}</h4>
                  <p>
                    {patient.is_pregnant && <span className="badge pregnant">Pregnant</span>}
                    {patient.risk_score > 50 && <span className="badge high-risk">High Risk</span>}
                  </p>
                </div>
                <Link to={`/chw/patients/${patient.id}`} className="btn-view">
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CHWDashboard;
