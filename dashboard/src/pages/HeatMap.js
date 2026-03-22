/**
 * HeatMap.js
 * Geographic disease prevalence visualization
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, Tooltip as MapTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import { Select } from '../components/Select';
import { Legend as LegendComponent } from '../components/Legend';
import { fetchDiseaseData, fetchGeographicData } from '../utils/api';

const COLORS = ['#05416b', '#0a6a9e', '#0f8ccf', '#14ade0', '#19d0f1', '#1ef3ff', '#4ff770', '#90fb45', '#d1fc1a', '#f1ff00'];

const HeatMap = () => {
  const [diseaseData, setDiseaseData] = useState([]);
  const [geoData, setGeoData] = useState(null);
  const [selectedDisease, setSelectedDisease] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedDisease, selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [diseases, geo] = await Promise.all([
        fetchDiseaseData({ period: selectedPeriod }),
        fetchGeographicData()
      ]);
      setDiseaseData(diseases);
      setGeoData(geo);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (selectedDisease === 'all') return diseaseData;
    return diseaseData.filter(d => d.disease === selectedDisease);
  }, [diseaseData, selectedDisease]);

  const getIntensityColor = (count, max) => {
    const ratio = count / max;
    const index = Math.floor(ratio * (COLORS.length - 1));
    return COLORS[index];
  };

  const maxCases = Math.max(...filteredData.map(d => d.cases), 1);

  const diseases = useMemo(() => {
    const unique = new Set(diseaseData.map(d => d.disease));
    return ['all', ...Array.from(unique)];
  }, [diseaseData]);

  if (loading) return <div className="p-8 text-center">Loading geographic data...</div>;
  if (error) return <div className="p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Geographic Disease Prevalence Heat Map</CardTitle>
            <div className="flex gap-4">
              <Select
                value={selectedDisease}
                onChange={setSelectedDisease}
                options={diseases.map(d => ({ value: d, label: d === 'all' ? 'All Diseases' : d }))}
              />
              <Select
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                options={[
                  { value: '7', label: 'Last 7 days' },
                  { value: '30', label: 'Last 30 days' },
                  { value: '90', label: 'Last 90 days' },
                  { value: '365', label: 'Last year' }
                ]}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Map View */}
            <div className="h-96 rounded-lg overflow-hidden border">
              <MapContainer center={[9.0, 8.67]} zoom={6} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {filteredData.map((location, idx) => (
                  <CircleMarker
                    key={idx}
                    center={[location.latitude, location.longitude]}
                    radius={Math.sqrt(location.cases) * 3}
                    fillColor={getIntensityColor(location.cases, maxCases)}
                    color="#fff"
                    weight={1}
                    opacity={1}
                    fillOpacity={0.7}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold">{location.village || location.zone}</h3>
                        <p><strong>Disease:</strong> {location.disease}</p>
                        <p><strong>Cases:</strong> {location.cases}</p>
                        <p><strong>Last 30 days:</strong> {location.recentCases}</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Bar Chart */}
            <div className="h-96">
              <h3 className="text-lg font-semibold mb-4">Cases by Location</h3>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={filteredData.slice(0, 15)}>
                  <XAxis dataKey="location" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cases" name="Total Cases">
                    {filteredData.slice(0, 15).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getIntensityColor(entry.cases, maxCases)} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6">
            <h4 className="font-semibold mb-2">Prevalence Intensity</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm">Low</span>
              <div className="flex-1 h-4 flex rounded overflow-hidden">
                {COLORS.map((color, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: color }} />
                ))}
              </div>
              <span className="text-sm">High</span>
            </div>
          </div>

          {/* Statistics Table */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Top Affected Areas</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="p-3 text-left">Location</th>
                    <th className="p-3 text-left">Disease</th>
                    <th className="p-3">Cases</th>
                    <th className="p-3">Recent (30d)</th>
                    <th className="p-3">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .sort((a, b) => b.cases - a.cases)
                    .slice(0, 10)
                    .map((row, idx) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-3">{row.location}</td>
                        <td className="p-3">{row.disease}</td>
                        <td className="p-3 text-center">{row.cases}</td>
                        <td className="p-3 text-center">{row.recentCases}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            row.trend === 'increasing' ? 'bg-red-100 text-red-700' :
                            row.trend === 'decreasing' ? 'bg-green-100 text-green-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {row.trend}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HeatMap;
