import React from 'react';
import { useTasks, useUpdateTask } from '../hooks/useQueries';
import { SkeletonPage } from '../components/SkeletonLoader';
import type { Task } from '../types';

const Tasks: React.FC = () => {
  const { data: tasks, isLoading, error } = useTasks({ limit: 50 });
  const updateTask = useUpdateTask();

  if (isLoading) {
    return <SkeletonPage />;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="alert alert-danger">
          Error loading tasks: {error.message}
        </div>
      </div>
    );
  }

  const getPriorityBadgeClass = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      default: return 'badge-success';
    }
  };

  const getStatusBadgeClass = (status: string): string => {
    return status === 'completed' ? 'badge-success' : 'badge-warning';
  };

  const handleStatusChange = (taskId: string, newStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled') => {
    updateTask.mutate({ id: taskId, data: { status: newStatus } });
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Tasks</h3>
        </div>
        <div className="card-body">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Patient</th>
                <th>Type</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks && tasks.length > 0 ? (
                tasks.map((task: Task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>
                      {task.patient && `${task.patient.first_name} ${task.patient.last_name}`}
                    </td>
                    <td>{task.task_type}</td>
                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      {task.status !== 'completed' && (
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleStatusChange(task.id, 'completed')}
                          disabled={updateTask.isPending}
                        >
                          Mark Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '20px' }}>
                    No tasks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
