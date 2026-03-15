import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMyTasks, useUpdateTask } from '../../hooks/useQueries';
import { SkeletonCard } from '../../components/SkeletonLoader';
import './CHWTasks.css';

const CHWTasks: React.FC = () => {
  const [filter, setFilter] = useState<'pending' | 'in_progress' | 'completed' | 'all'>('pending');
  const { data, isLoading } = useMyTasks({ status: filter === 'all' ? undefined : filter });
  const updateTask = useUpdateTask();

  const tasks = data?.tasks || [];

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    try {
      await updateTask.mutateAsync({ id: taskId, data: { status: newStatus } });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196F3';
      case 'low': return '#4CAF50';
      default: return '#999';
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'visit': return '🏠';
      case 'follow_up': return '🔄';
      case 'referral': return '🏥';
      case 'assessment': return '📋';
      default: return '📌';
    }
  };

  return (
    <div className="chw-tasks">
      <div className="page-header">
        <Link to="/chw" className="back-link">← Back</Link>
        <h1>My Tasks</h1>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        {(['pending', 'in_progress', 'completed', 'all'] as const).map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="tasks-container">
        {isLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">✅</span>
            <h3>No {filter !== 'all' ? filter.replace('_', ' ') : ''} tasks</h3>
            <p>You're all caught up!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <div className="task-type">
                  <span className="type-icon">{getTaskTypeIcon(task.task_type)}</span>
                  <span className="type-label">{task.task_type.replace('_', ' ')}</span>
                </div>
                <span 
                  className="priority-badge"
                  style={{ backgroundColor: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority) }}
                >
                  {task.priority}
                </span>
              </div>

              <div className="task-body">
                <h3>{task.title}</h3>
                {task.description && <p className="task-description">{task.description}</p>}
                
                {task.patient && (
                  <div className="patient-info">
                    <span className="label">Patient:</span>
                    <span className="value">{task.patient.first_name} {task.patient.last_name}</span>
                  </div>
                )}

                <div className="task-meta">
                  <div className="meta-item">
                    <span className="meta-icon">📅</span>
                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="task-actions">
                {task.status === 'pending' && (
                  <>
                    <button 
                      className="btn-start"
                      onClick={() => handleStatusChange(task.id, 'in_progress')}
                      disabled={updateTask.isPending}
                    >
                      Start Task
                    </button>
                    <Link to={`/chw/log-visit?taskId=${task.id}`} className="btn-log">
                      Log Visit
                    </Link>
                  </>
                )}
                {task.status === 'in_progress' && (
                  <>
                    <button 
                      className="btn-complete"
                      onClick={() => handleStatusChange(task.id, 'completed')}
                      disabled={updateTask.isPending}
                    >
                      Mark Complete
                    </button>
                    <Link to={`/chw/log-visit?taskId=${task.id}`} className="btn-log">
                      Log Visit
                    </Link>
                  </>
                )}
                {task.status === 'completed' && (
                  <span className="status-completed">✓ Completed</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CHWTasks;
