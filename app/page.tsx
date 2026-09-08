"use client";
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const MapViewer = dynamic(() => import('../components/MapViewer'), { ssr: false });

export default function Home() {
  const [maps, setMaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMaps = async () => {
    const res = await fetch('/api/maps');
    const data = await res.json();
    setMaps(Array.isArray(data) ? data : []);
  };
  useEffect(() => { fetchMaps(); }, []);

  const handleUpload = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    await fetch('/api/upload', { method: 'POST', body: formData });
    e.target.reset();
    fetchMaps();
    setLoading(false);
  };

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">🗺️ GeoShare</h1>
      
      <form onSubmit={handleUpload} className="bg-white p-6 rounded-xl border shadow-sm mb-10">
        <div className="flex flex-col gap-4">
          <input name="title" placeholder="Map Title (e.g. Morning Hike)" className="border p-2 rounded" required />
          <input type="file" name="file" accept=".gpx,.kml,.json" className="text-sm" required />
          <button disabled={loading} className="bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">
            {loading ? "Uploading to GitHub..." : "Upload & Share"}
          </button>
        </div>
      </form>

      <div className="grid gap-6">
        {maps.map((m: any) => (
          <div key={m.id} className="border p-4 rounded-xl bg-gray-50">
            <h2 className="text-xl font-semibold mb-2">{m.title}</h2>
            <MapViewer url={m.fileUrl} type={m.type} />
          </div>
        ))}
      </div>
    </main>
  );
}
