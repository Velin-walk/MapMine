"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { gpx, kml } from '@mapbox/togeojson';
import L from 'leaflet';

// Fix leaflet default icon - directly use the URLs without .src
const DefaultIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.setIcon(DefaultIcon);

function ZoomToData({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data) {
      const layer = L.geoJSON(data);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds);
      }
    }
  }, [data, map]);
  return null;
}

export default function MapViewer({ url, type }: { url: string, type: string }) {
  const [geoData, setGeoData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error(`Failed to fetch: ${r.status}`);
        return r.text();
      })
      .then(text => {
        try {
          let converted;
          
          if (type === 'gpx') {
            const dom = new DOMParser().parseFromString(text, "text/xml");
            converted = gpx(dom);
          } else if (type === 'kml') {
            const dom = new DOMParser().parseFromString(text, "text/xml");
            converted = kml(dom);
          } else {
            converted = JSON.parse(text);
          }
          
          if (!converted || !Array.isArray(converted.features) || converted.features.length === 0) {
            throw new Error('No map data found');
          }
          
          setGeoData(converted);
        } catch (err) {
          console.error('Parse error:', err);
          setError('Failed to parse map data');
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(`Failed to load map: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url, type]);

  if (loading) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden border bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden border bg-red-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer center={[27.7, 85.3]} zoom={8} className="h-full w-full">
        <TileLayer 
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          attribution='&copy; OpenStreetMap contributors'
          maxZoom={19}
        />
        {geoData && (
          <>
            <GeoJSON data={geoData} />
            <ZoomToData data={geoData} />
          </>
        )}
      </MapContainer>
    </div>
  );
}