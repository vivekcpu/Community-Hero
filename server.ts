import express from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import { connectDB } from "./server/db.js";
import authRoutes from "./server/routes/authRoutes.js";
import reportRoutes from "./server/routes/reportRoutes.js";
import leaderboardRoutes from "./server/routes/leaderboardRoutes.js";
import userRoutes from "./server/routes/userRoutes.js";
import adminRoutes from "./server/routes/adminRoutes.js";
import noticeRoutes from "./server/routes/noticeRoutes.js";
import { errorHandler } from "./server/middleware/errorMiddleware.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. Establish databases
  await connectDB();

  // 2. Setup standard middlewares
  app.use(
    cors({
      origin: true, // Allow dev and preview URLs dynamically
      credentials: true
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));

  // 3. Mount Backend API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date() });
  });

  // Google Maps Geolocation & Geocoding API Endpoint
  app.get("/api/geocode", async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : null;
      let lng = req.query.lng ? parseFloat(req.query.lng as string) : null;
      const key = process.env.GOOGLE_MAPS_PLATFORM_KEY;

      // 1. If coordinates are not provided, try Google Geolocation API to get coordinates from IP
      if ((lat === null || lng === null) && key) {
        console.log("[Geocode] Coordinates not provided. Requesting IP-based geolocation from Google Maps Geolocation API...");
        try {
          const geoResponse = await fetch(`https://www.googleapis.com/geolocation/v1/geolocate?key=${key}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          });
          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            if (geoData.location) {
              lat = geoData.location.lat;
              lng = geoData.location.lng;
              console.log(`[Geocode] Google Geolocation resolved coordinates: lat=${lat}, lng=${lng}`);
            }
          } else {
            console.warn(`[Geocode] Google Geolocation API error: ${geoResponse.status}`);
          }
        } catch (geoErr) {
          console.error("[Geocode] Error calling Google Geolocation API:", geoErr);
        }
      }

      // 2. If we have coordinates, try to reverse-geocode them
      if (lat !== null && lng !== null) {
        if (key) {
          console.log(`[Geocode] Reverse geocoding lat=${lat}, lng=${lng} using Google Maps Geocoding API...`);
          try {
            const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`;
            const response = await fetch(googleUrl);
            if (response.ok) {
              const data = await response.json();
              if (data.status === "OK" && data.results && data.results.length > 0) {
                const formattedAddress = data.results[0].formatted_address;
                return res.json({
                  coordinates: [lng, lat],
                  address: formattedAddress,
                  provider: "google"
                });
              } else {
                console.warn(`[Geocode] Google Maps Geocoding API status: ${data.status}`);
              }
            } else {
              console.warn(`[Geocode] Google Maps Geocoding API HTTP error: ${response.status}`);
            }
          } catch (googleErr) {
            console.error("[Geocode] Error calling Google Geocoding API:", googleErr);
          }
        }

        // Fallback: OpenStreetMap Nominatim (if Google key is missing or failed)
        console.log(`[Geocode] Reverse geocoding lat=${lat}, lng=${lng} falling back to OpenStreetMap Nominatim...`);
        try {
          const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
          const response = await fetch(nominatimUrl, {
            headers: {
              "Accept": "application/json",
              "User-Agent": "CommunityHeroApp/1.0 (vrtiwary2006@gmail.com)"
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
              return res.json({
                coordinates: [lng, lat],
                address: data.display_name,
                provider: "openstreetmap"
              });
            }
          }
        } catch (osmErr) {
          console.error("[Geocode] Error calling OpenStreetMap Nominatim:", osmErr);
        }

        // Last-resort fallback with coordinates
        return res.json({
          coordinates: [lng, lat],
          address: `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`,
          provider: "none"
        });
      }

      // 3. No coordinates available and geolocation failed/unavailable
      return res.status(400).json({ error: "Could not fetch location or resolve coordinates" });
    } catch (err: any) {
      console.error("[Geocode] Unexpected endpoint error:", err);
      res.status(500).json({ error: err.message || "Geocoding failed" });
    }
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/leaderboard", leaderboardRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notices", noticeRoutes);

  // 4. Global Error handling middleware
  app.use(errorHandler);

  // 5. Mount Vite Dev Server in Development, or Serve Static Assets in Production
  if (process.env.NODE_ENV !== "production") {
    console.log("❇️ Mounting Vite dev server middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    console.log("❇️ Serving static files from dist...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Community Hero Server running on http://localhost:${PORT}`);
  });
}

startServer();
