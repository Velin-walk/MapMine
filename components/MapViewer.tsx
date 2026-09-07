"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import togeojson from "togeojson";
import L from 'leaflet';

function ZoomToData({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data) {
      const layer = L.geoJSON(data);
      map.fitBounds(layer.getBounds());
    }
  }, [data, map]);
  return null;
}

export default function MapViewer({ url, type }: { url: string, type: string }) {
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch(url).then(r => r.text()).then(text => {
      const dom = new DOMParser().parseFromString(text, "text/xml");
      const converted = type === 'gpx' ? gpx(dom) : type === 'kml' ? kml(dom) : JSON.parse(text);
      setGeoData(converted);
    });
  }, [url, type]);

  return (
    <div className="h-[500px] w-full rounded-lg overflow-hidden border">
      <MapContainer center={[0, 0]} zoom={2} className="h-full w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {geoData && <><GeoJSON data={geoData} /><ZoomToData data={geoData} /></>}
      </MapContainer>
    </div>
  );
}
