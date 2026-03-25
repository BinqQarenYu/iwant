import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix typical Leaflet icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LocationMarker = ({ position, setPosition, onAddressFound }) => {
  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
      reverseGeocode(e.latlng.lat, e.latlng.lng);
    },
  });

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await response.json();
      if (data && data.display_name) {
        onAddressFound(data.display_name);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  return position === null ? null : (
    <Marker position={position} />
  );
};

export default function LocationPicker({ onChange, initialAddress }) {
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState(initialAddress || '');
  const [loading, setLoading] = useState(false);
  const defaultCenter = { lat: 15.9758, lng: 120.5707 }; // Urdaneta City

  const handleAddressChange = (newAddress) => {
    setAddress(newAddress);
    onChange({ address: newAddress, lat: position?.lat, lng: position?.lng });
  };

  const locateUser = useCallback(() => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          
          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
              handleAddressChange(data.display_name);
            }
          } catch (error) {
            console.error('Failed to get address name', error);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error getting location", error);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLoading(false);
    }
  }, [onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium">
          <MapPin className="w-4 h-4 text-[#FF6B00]" />
          Delivery Location
        </label>
        <button
          type="button"
          onClick={locateUser}
          className="text-xs text-[#FF6B00] font-medium flex items-center gap-1 hover:underline"
          disabled={loading}
        >
          <Navigation className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Locating...' : 'Use My Location'}
        </button>
      </div>

      <div className="h-[200px] w-full rounded-xl overflow-hidden border border-border relative z-0">
        <MapContainer 
          center={position || defaultCenter} 
          zoom={13} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker 
            position={position} 
            setPosition={(pos) => {
              setPosition(pos);
              onChange({ address, lat: pos.lat, lng: pos.lng });
            }} 
            onAddressFound={handleAddressChange} 
          />
        </MapContainer>
      </div>

      <textarea
        placeholder="Enter your complete delivery address or click on the map"
        value={address}
        onChange={(e) => handleAddressChange(e.target.value)}
        className="flex min-h-[80px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
        rows={3}
      />
    </div>
  );
}
