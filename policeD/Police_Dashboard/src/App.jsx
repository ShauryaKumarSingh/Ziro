import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

// --- Leaflet Icon Fix (Keeps the map marker icon from breaking) ---
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const SOCKET_SERVER_URL = "http://localhost:5000";

export default function App() {
  const [alerts, setAlerts] = useState({}); // Use object: { touristId: alertData }
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const mapRef = useRef(null); // Reference to the map instance

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL);

    socket.on('connect', () => {
      console.log('✅ Connected to real-time server!');
      socket.emit('joinDashboard');
    });


    socket.on('new-alert', (newAlert) => {
      console.log('🚨 New SOS Alert Received:', newAlert);
      setAlerts(prev => ({
        ...prev,
        [newAlert.touristId]: {
          touristId: newAlert.touristId,
          location: newAlert.location,
          userId: newAlert.userId || { username: 'Unknown', email: 'N/A' },
          updatedAt: new Date().toISOString(),
          status: newAlert.status || 'Active',
        },
      }));

    });

    socket.on('location-update', (update) => {
      console.log('📍 Location Update:', update);
      setAlerts(prev => {
        const newAlertsState = { ...prev };
        const alertToUpdate = newAlertsState[update.touristId];
        if (alertToUpdate) {
          newAlertsState[update.touristId] = {
            ...alertToUpdate,
            location: update.location,
            updatedAt: new Date().toISOString(),
          };
          return newAlertsState;
        }
        // If we receive a location before a 'new-alert', create an entry so it shows on the map
        if (update && update.touristId && update.location) {
          newAlertsState[update.touristId] = {
            touristId: update.touristId,
            location: update.location,
            userId: update.userId || { username: 'Unknown', email: 'N/A' },
            updatedAt: new Date().toISOString(),
            status: update.status || 'Active',
          };
          return newAlertsState;
        }
        return prev;
      });
    });

    return () => socket.disconnect();
  }, []);

  const handleAlertSelect = (alert) => {
    setSelectedAlertId(alert.touristId);
    if (mapRef.current) {
      mapRef.current.flyTo([alert.location.latitude, alert.location.longitude], 14);
    }
  };

  const alertList = Object.values(alerts);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Active SOS Alerts</h1>
        <div style={styles.alertList}>
        {alertList.length === 0 && (
          <p style={styles.noAlertsText}>No alerts</p>
        )}

        {alertList.map((alert) => (
  alert && alert.location ? (
    <div
      key={alert.touristId}
      onClick={() => handleAlertSelect(alert)}
      style={selectedAlertId === alert.touristId ? styles.selectedAlertItem : styles.alertItem}
    >
      <p style={styles.noAlertsText}>New Alert</p>
      <p style={styles.alertId}>ID: {alert.touristId}</p>
      <p style={styles.alertInfo}>User: {alert.userId?.username || 'N/A'}</p>
      <p style={styles.alertInfo}>Updated: {new Date(alert.updatedAt).toLocaleTimeString()}</p>
    </div>
  ) : null
))}

        



        </div>
      </div>
      <div style={styles.mapContainer}>
        <MapContainer
          center={[28.6139, 77.2090]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          whenCreated={(mapInstance) => {
            mapRef.current = mapInstance;
          }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {alertList
            .filter(a => a && a.location && typeof a.location.latitude === 'number' && typeof a.location.longitude === 'number')
            .map(alert => (
              <Marker
                key={`${alert.touristId}-${alert.updatedAt}`}
                position={[alert.location.latitude, alert.location.longitude]}
              >
                <Popup>
                  <b>Tourist ID:</b> {alert.touristId} <br />
                  <b>User:</b> {alert.userId?.username} ({alert.userId?.email})<br />
                  <b>Status:</b> {alert.status}
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}

// --- Styles ---
const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif' },
  sidebar: { width: '350px', backgroundColor: '#2c3e50', color: 'white', padding: '15px', overflowY: 'auto' },
  sidebarTitle: { marginTop: 0, borderBottom: '1px solid #4a627a', paddingBottom: '15px' },
  alertList: {},
  alertItem: { padding: '15px', borderBottom: '1px solid #4a627a', cursor: 'pointer', transition: 'background-color 0.2s' },
  selectedAlertItem: { padding: '15px', borderBottom: '1px solid #4a627a', cursor: 'pointer', backgroundColor: '#3498db' },
  alertId: { margin: 0, fontWeight: 'bold', fontSize: '1.1em' },
  alertInfo: { margin: '5px 0 0', fontSize: '0.9em', opacity: 0.8 },
  noAlertsText: { textAlign: 'center', color: '#95a5a6', marginTop: '20px' },
  mapContainer: { flex: 1 },
};