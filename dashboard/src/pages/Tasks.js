import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      });
      if (response.data.success) {
        setTasks(response.data.data.tasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
    setLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      default: return 'badge-success';
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

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
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.patient ? `${task.patient.first_name} ${task.patient.last_name}` : '-'}</td>
                  <td>{task.task_type}</td>
                  <td>{new Date(task.due_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Tasks;
