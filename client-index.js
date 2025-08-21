import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import axios from "axios";
const CityScene = dynamic(() => import("../components/CityScene"), { ssr: false });
export default function Home() {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Loading 3D City Map…");
  const [cityName, setCityName] = useState("New York City");
  const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";
  const fetchByCity = async (city = "New York") => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiBase}/weather`, { params: { city } });
      setWeather(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  const fetchByLatLon = async ({ lat, lon }) => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${apiBase}/weather`, { params: { lat, lon } });
      setWeather(data);
    } catch (e) {
      alert("Failed to fetch weather for that point.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    setStatus("Preparing colorful buildings…");
    const t = setTimeout(() => setStatus(null), 1200);
    fetchByCity("New York");
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{ height: "100vh", display: "grid", gridTemplateRows: "auto 1fr", background: "#0a0f1a" }}>
      <header style={{ display: "flex", gap: 8, alignItems: "center", padding: 12, color: "#fff" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>🌆 3D City Map — Live Weather</h1>
        <div style={{ marginLeft: 12, opacity: 0.8 }}>
          Touch & drag: pan • Wheel/pinch: zoom • Right-drag: rotate
        </div>
        <div style={{ marginLeft: "auto", opacity: 0.9 }}>
          {weather ? (<b>{weather.city}</b>) : "—"} • {weather ? `${Math.round(weather.temp)}°C` : "—"} • {weather ? weather.condition : "—"}
        </div>
      </header>
      <main style={{ position: "relative" }}>
        <CityScene
          weather={weather}
          onPickLatLon={fetchByLatLon}
          onBootReady={() => setStatus(null)}
        />
        {/* Status / Loader */}
        {status && (
          <div style={{
            position: "absolute", left: 16, top: 16,
            padding: "10px 12px", borderRadius: 10,
            background: "rgba(0,0,0,0.55)", color: "#fff"
          }}>
            {status}
          </div>
        )}
        {/* Weather card */}
        <div style={{
          position: "absolute", right: 16, bottom: 16,
          padding: 12, borderRadius: 12,
          background: "rgba(0,0,0,0.5)", color: "#fff",
          lineHeight: 1.4, minWidth: 220
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Weather</div>
          <div>City: {weather?.city ?? "—"}</div>
          <div>Temp: {weather ? `${Math.round(weather.temp)}°C` : "—"}</div>
          <div>Humidity: {weather ? `${weather.humidity}%` : "—"}</div>
          <div>Wind: {weather ? `${weather.wind} m/s` : "—"}</div>
          <div>Condition: {weather?.description || weather?.condition || "—"}</div>
          {loading && <div style={{ marginTop: 6, opacity: 0.8 }}>Updating…</div>}
        </div>
      </main>
    </div>
  );
}
