import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import io from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import { BASE_URL } from './config/apiConfig';

// --- Leaflet Icon Fix ---
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const SOCKET_SERVER_URL = BASE_URL;

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [selectedAlertId, setSelectedAlertId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [masterKey, setMasterKey] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [notification, setNotification] = useState('');

  const socketRef = useRef(null);
  const mapRef = useRef(null);

  const normalizeLocation = (location) => {
    if (!location) return null;
    if (location.latitude !== undefined && location.longitude !== undefined) {
      return location;
    }
    if (location.lat !== undefined && location.lng !== undefined) {
      return { latitude: location.lat, longitude: location.lng };
    }
    return null;
  };

  const authenticate = async () => {
    if (!masterKey.trim()) {
      alert('Please enter the master key');
      return;
    }

    setIsLoggingIn(true);
    console.log('🔐 Attempting police login with master key...');

    try {
      const loginResponse = await fetch(`${BASE_URL}/api/auth/police-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ masterKey }),
      });

      console.log('📨 Response status:', loginResponse.status);
      const loginData = await loginResponse.json();
      console.log('📨 Response data:', loginData);

      if (!loginResponse.ok) {
        throw new Error(loginData.msg || 'Login failed');
      }

      const token = loginData.token;
      setAuthToken(token);

      if (socketRef.current) {
        if (socketRef.current.connected) {
          socketRef.current.emit('authenticate', { token });
        } else {
          socketRef.current.once('connect', () => {
            socketRef.current?.emit('authenticate', { token });
          });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to real-time server!');
    });

    socket.on('authenticated', () => {
      console.log('✅ Dashboard authenticated successfully!');
      setIsAuthenticated(true);
      setIsLoggingIn(false);
      if (!socketRef.current?.joinedDashboard) {
        socketRef.current.joinedDashboard = true;
        socket.emit('joinDashboard');
      }
    });

    socket.on('dashboard-joined', () => {
      console.log('📌 Police dashboard join confirmed');
    });

    socket.on('unauthorized', (data) => {
      console.error('❌ Authentication failed:', data?.message);
      alert('Authentication failed: ' + data?.message);
      socket.disconnect();
      setIsLoggingIn(false);
    });

    socket.on('new-alert', (newAlert) => {
      console.log('🚨 New SOS Alert Received:', newAlert);
      const normalizedLocation = normalizeLocation(newAlert.location);
      const alertPayload = {
        ...newAlert,
        location: normalizedLocation || newAlert.location,
        updatedAt: new Date().toISOString(),
        status: newAlert.status || 'Active',
      };

      setAlerts(prev => {
        const existingIndex = prev.findIndex(alert => alert.touristId === alertPayload.touristId);
        if (existingIndex >= 0) {
          return prev.map((alert, idx) => idx === existingIndex ? alertPayload : alert);
        }
        return [...prev, alertPayload];
      });
    });

    socket.on('location-update', (update) => {
      console.log('📍 Location Update:', update);
      const normalizedLocation = normalizeLocation(update.location);

      if (!normalizedLocation) {
        console.warn('⚠️ Received unsupported location format', update.location);
        return;
      }

      const newData = {
        touristId: update.touristId,
        userId: { username: 'Unknown' },
        location: normalizedLocation,
        updatedAt: new Date().toISOString(),
        status: 'Active',
      };

      setAlerts(prev => {
        const existingIndex = prev.findIndex(alert => alert.touristId === newData.touristId);
        if (existingIndex >= 0) {
          return prev.map((alert, idx) => idx === existingIndex ? { ...alert, ...newData } : alert);
        }
        return [...prev, newData];
      });
    });

    socket.on('stop-sos', (data) => {
      console.log('🛑 SOS stopped:', data);
      if (!data?.touristId) return;

      setAlerts(prev => prev.filter((alert) => alert.touristId !== data.touristId));
      setNotification(`SOS alert resolved for ${data.touristId}`);
      setTimeout(() => setNotification(''), 4500);
    });

    socket.on('sos-stopped', (data) => {
      console.log('🛑 SOS stopped (legacy event):', data);
      if (!data?.touristId) return;

      setAlerts(prev => prev.filter((alert) => alert.touristId !== data.touristId));
      setNotification(`SOS alert resolved for ${data.touristId}`);
      setTimeout(() => setNotification(''), 4500);
    });

    socket.on('alert-resolved', (data) => {
      console.log('✅ Alert resolved:', data);
      if (!data?.touristId) return;
      setAlerts(prev => prev.filter((alert) => alert.touristId !== data.touristId));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const handleAlertSelect = (alert) => {
    setSelectedAlertId(alert.touristId);
    if (mapRef.current) {
      mapRef.current.flyTo([alert.location.latitude, alert.location.longitude], 14);
    }
  };

  const alertList = alerts;

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ color: '#2c3e50' }}>Ziro: Police Access</h2>
        <p>Enter the master key to access the live SOS tracking dashboard.</p>
        <input
          type="password"
          value={masterKey}
          onChange={(e) => setMasterKey(e.target.value)}
          placeholder="Enter master key"
          style={{ width: '100%', padding: '12px', margin: '15px 0', borderRadius: '5px', border: '1px solid #ddd' }}
          disabled={isLoggingIn}
        />
        <button
          onClick={authenticate}
          disabled={isLoggingIn}
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: isLoggingIn ? '#95a5a6' : '#e74c3c', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            fontWeight: 'bold', 
            cursor: isLoggingIn ? 'not-allowed' : 'pointer' 
          }}
        >
          {isLoggingIn ? 'LOGGING IN...' : 'LOG IN TO DASHBOARD'}
        </button>
        <div style={{ marginTop: '15px', fontSize: '0.8em', color: '#7f8c8d' }}>
          <p>🔐 Secure police dashboard access</p>
          <p>📍 Real-time SOS tracking enabled</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <h1 style={styles.sidebarTitle}>Live SOS Alerts</h1>
        {notification ? <div style={styles.notification}>{notification}</div> : null}
        <div style={styles.emergencySection}>
          <h3 style={{ color: '#ff7675', marginTop: 0, fontSize: '0.9em', borderBottom: '1px solid #485460', paddingBottom: '10px' }}>EMERGENCY NUMBERS</h3>
          <div style={{ fontSize: '0.85em', lineHeight: '1.8', color: '#ccc' }}>
            <div style={{ marginBottom: '8px' }}><strong style={{ color: '#ff7675' }}>Police:</strong> 100</div>
            <div style={{ marginBottom: '8px' }}><strong style={{ color: '#ff7675' }}>Hospital:</strong> 108</div>
            <div style={{ marginBottom: '8px' }}><strong style={{ color: '#ff7675' }}>Fire:</strong> 101</div>
            <div style={{ marginBottom: '8px' }}><strong style={{ color: '#ff7675' }}>Ambulance:</strong> 112</div>
          </div>
        </div>
        <div style={styles.alertList}>
          {alertList.length === 0 ? (
            <p style={styles.noAlertsText}>No active emergencies</p>
          ) : (
            alertList.map((alert) => (
              <div
                key={alert.touristId}
                onClick={() => handleAlertSelect(alert)}
                style={selectedAlertId === alert.touristId ? styles.selectedAlertItem : styles.alertItem}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={styles.alertId}>ID: {alert.touristId}</span>
                  <span style={{ fontSize: '0.7em', color: '#ff7675' }}>● LIVE</span>
                </div>
                <p style={styles.alertInfo}>User: {alert.userId?.username || 'N/A'}</p>
                <p style={styles.alertInfo}>Time: {new Date(alert.timestamp || alert.updatedAt).toLocaleTimeString()}</p>
                <p style={styles.alertInfo}>Location: {alert.location ? `${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}` : 'N/A'}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div style={styles.mapContainer}>
        <MapContainer
          center={mapCenter}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {alertList.map(alert => (
            <Marker
              key={`${alert.touristId}-${alert.updatedAt}`}
              position={[alert.location.latitude, alert.location.longitude]}
            >
              <Popup>
                <div style={{ color: '#d63031' }}>
                  <strong>EMERGENCY ALERT</strong><br />
                  <b>Tourist:</b> {alert.userId?.username}<br />
                  <b>ID:</b> {alert.touristId}<br />
                  <b>Time:</b> {new Date(alert.timestamp || alert.updatedAt).toLocaleTimeString()}<br />
                  <b>Status:</b> {alert.status || 'Active'}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', fontFamily: 'sans-serif' },
  sidebar: { width: '350px', backgroundColor: '#1e272e', color: 'white', padding: '15px', overflowY: 'auto' },
  sidebarTitle: { marginTop: 0, borderBottom: '1px solid #485460', paddingBottom: '15px', color: '#ff7675' },
  emergencySection: { backgroundColor: '#243447', padding: '12px', borderRadius: '5px', marginBottom: '15px', borderLeft: '3px solid #ff7675' },
  notification: { backgroundColor: '#27ae60', color: '#ffffff', padding: '10px 12px', borderRadius: '6px', marginBottom: '12px', textAlign: 'center', fontWeight: '600' },
  alertItem: { padding: '15px', borderBottom: '1px solid #485460', cursor: 'pointer', borderRadius: '5px', marginVertical: '5px' },
  selectedAlertItem: { padding: '15px', borderBottom: '1px solid #485460', cursor: 'pointer', backgroundColor: '#c0392b', borderRadius: '5px' },
  alertId: { margin: 0, fontWeight: 'bold', fontSize: '1.1em' },
  alertInfo: { margin: '5px 0 0', fontSize: '0.9em', opacity: 0.8 },
  noAlertsText: { textAlign: 'center', color: '#808e9b', marginTop: '50px' },
  mapContainer: { flex: 1 },
};