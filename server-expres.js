
import express from "express";
import cors from "cors";
import axios from "axios";
import dotenv from "dotenv";
import morgan from "morgan";
import NodeCache from "node-cache";
dotenv.config();
const app = express();
app.use(cors());
app.use(morgan("tiny"));
const PORT = process.env.PORT || 4000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const cache = new NodeCache({ stdTTL: 300, useClones: false });
if (!API_KEY) {
  console.error("❌ Missing OPENWEATHER_API_KEY in server/.env");
  process.exit(1);
}
app.get("/weather", async (req, res) => {
  try {
    const { lat, lon, city } = req.query;
    let cacheKey = "";
    let params = { appid: API_KEY, units: "metric" };
    let url = "https://api.openweathermap.org/data/2.5/weather";
    if (lat && lon) {
      cacheKey = `latlon:${lat},${lon}`;
      params.lat = lat;
      params.lon = lon;
    } else if (city) {
      cacheKey = `city:${city.toLowerCase().trim()}`;
      params.q = city;
    } else {
      return res.status(400).json({ error: "Provide lat/lon or city." });
    }
    const hit = cache.get(cacheKey);
    if (hit) return res.json(hit);
    const { data } = await axios.get(url, { params });
    const payload = {
      city: data.name,
      coord: data.coord,
      temp: data.main.temp,
      humidity: data.main.humidity,
      wind: data.wind.speed,
      condition: data.weather?.[0]?.main || "Clear",
      description: data.weather?.[0]?.description || "",
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
      timezone: data.timezone,
      dt: data.dt,
    };

    cache.set(cacheKey, payload);
    res.json(payload);
  } catch (e) {
    console.error(e?.response?.data || e.message);
    res.status(500).json({ error: "Failed to fetch weather", details: e.message });
  }
});
app.get("/health", (_req, res) => res.json({ ok: true }));
app.listen(PORT, () => console.log(`✅ API running http://localhost:${PORT}`));
