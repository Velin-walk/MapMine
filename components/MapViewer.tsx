"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { gpx, kml } from '@mapbox/togeojson';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet icon issue
let DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
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

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(text => {
        try {
          const dom = new DOMParser().parseFromString(text, "text/xml");
          let converted;
          
          if (type === 'gpx') {
            converted = gpx(dom);
          } else if (type === 'kml') {
            converted = kml(dom);
          } else {
            converted = JSON.parse(text);
          }
          
          setGeoData(converted);
        } catch (err) {
          setError('Failed to parse geo data');
          console.error(err);
        }
      })
      .catch(err => {
        setError('Failed to load map data');
        console.error(err);
      });
  }, [url, type]);

  if (error) {
    return (
      <div className="h-[500px] w-full rounded-lg overflow-hidden border bg-red-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
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
