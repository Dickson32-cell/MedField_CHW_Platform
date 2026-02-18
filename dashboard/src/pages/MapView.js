import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const MapView = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Sample data - in production, this would come from API
    setLocations([
      { id: 1, name: 'CHW 1', position: [0.3476, 32.5825], visits: 12, patients: 45 },
      { id: 2, name: 'CHW 2', position: [0.3576, 32.5925], visits: 8, patients: 32 },
      { id: 3, name: 'CHW 3', position: [0.3376, 32.5725], visits: 15, patients: 58 },
      { id: 4, name: 'CHW 4', position: [0.3676, 32.6025], visits: 10, patients: 40 }
    ]);
  }, []);

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h3>Geographic View</h3>
        </div>
        <div className="card-body">
          <div className="map-container" style={{ height: 500 }}>
            <MapContainer
              center={[0.3476, 32.5825]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {locations.map((loc) => (
                <Marker key={loc.id} position={loc.position}>
                  <Popup>
                    <strong>{loc.name}</strong><br />
                    Visits today: {loc.visits}<br />
                    Total patients: {loc.patients}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
