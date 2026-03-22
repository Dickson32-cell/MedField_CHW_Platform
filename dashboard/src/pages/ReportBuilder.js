import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../services/api';

const ReportBuilder = () => {
  const [components, setComponents] = useState([]);
  const [reportConfig, setReportConfig] = useState({
    title: '',
    sections: [],
    filters: {},
    dateRange: { start: '', end: '' }
  });
  const [savedReports, setSavedReports] = useState([]);
  const [preview, setPreview] = useState(false);

  const availableComponents = [
    { id: 'summary', name: 'Summary Statistics', icon: '📊' },
    { id: 'visits', name: 'Visit Records', icon: '📋' },
    { id: 'patients', name: 'Patient List', icon: '👥' },
    { id: 'referrals', name: 'Referral Report', icon: '➡️' },
    { id: 'performance', name: 'CHW Performance', icon: '⭐' },
    { id: 'geographic', name: 'Geographic Map', icon: '🗺️' },
    { id: 'trends', name: 'Trend Charts', icon: '📈' },
    { id: 'supply', name: 'Supply Chain', icon: '💊' }
  ];

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const newComponent = {
      ...availableComponents.find(c => c.id === result.destination.droppableId),
      instanceId: `${result.destination.droppableId}-${Date.now()}`
    };

    setComponents([...components, newComponent]);
  };

  const removeComponent = (instanceId) => {
    setComponents(components.filter(c => c.instanceId !== instanceId));
  };

  const generateReport = async () => {
    try {
      const response = await api.post('/reports/generate', {
        ...reportConfig,
        components: components.map(c => c.id)
      });
      return response.data;
    } catch (error) {
      console.error('Error generating report:', error);
      return null;
    }
  };

  const exportReport = async (format) => {
    const data = await generateReport();
    if (!data) return;

    if (format === 'pdf') {
      window.print(); // Browser print dialog
    } else if (format === 'csv') {
      // Convert to CSV and download
      const csv = jsonToCsv(data);
      downloadFile(csv, `${reportConfig.title || 'report'}.csv`, 'text/csv');
    } else if (format === 'json') {
      downloadFile(JSON.stringify(data, null, 2), `${reportConfig.title || 'report'}.json`, 'application/json');
    }
  };

  const jsonToCsv = (json) => {
    if (!json || !json.data) return '';
    const headers = Object.keys(json.data[0] || {});
    const rows = json.data.map(row => 
      headers.map(h => JSON.stringify(row[h] || '')).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Report Builder</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setPreview(!preview)}
            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => exportReport('pdf')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportReport('csv')}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Palette */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Available Components</h2>
          <p className="text-sm text-gray-500 mb-4">Drag components to build your report</p>
          
          <Droppable droppableId="palette">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="space-y-2"
              >
                {availableComponents.map((comp, index) => (
                  <Draggable key={comp.id} draggableId={comp.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="p-3 bg-gray-50 rounded border cursor-move hover:bg-gray-100 flex items-center gap-2"
                      >
                        <span>{comp.icon}</span>
                        <span className="text-sm">{comp.name}</span>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Report Canvas */}
        <div className="bg-white p-4 rounded-lg shadow lg:col-span-2">
          <input
            type="text"
            placeholder="Report Title"
            value={reportConfig.title}
            onChange={(e) => setReportConfig({...reportConfig, title: e.target.value})}
            className="w-full text-xl font-bold border-b mb-4 pb-2 outline-none"
          />

          <Droppable droppableId="canvas">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="min-h-96 border-2 border-dashed rounded p-4"
              >
                {components.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    Drag components here to build your report
                  </p>
                ) : (
                  components.map((comp, index) => (
                    <Draggable key={comp.instanceId} draggableId={comp.instanceId} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="p-4 bg-blue-50 rounded mb-2 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2">
                            <span {...provided.dragHandleProps}>⋮⋮</span>
                            <span>{comp.icon}</span>
                            <span>{comp.name}</span>
                          </div>
                          <button
                            onClick={() => removeComponent(comp.instanceId)}
                            className="text-red-500 hover:text-red-700"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
