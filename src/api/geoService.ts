/**
 * Geolocation Service for reverse geocoding.
 * Uses OpenStreetMap's free Nominatim API to fetch actual street addresses from coordinates.
 */

// Helper to fetch with retry for 429 and 5xx errors
async function fetchWithRetry(url: string, options?: RequestInit, retries = 2, initialDelay = 800): Promise<Response> {
  let delay = initialDelay;
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options);
      
      // If we hit a 429 or 5xx error, implement a brief delay and retry
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (i === retries) {
          console.warn(`[GeoService] Max retries reached for ${url} with status ${response.status}.`);
          return response;
        }
        console.warn(`[GeoService] Received status ${response.status} for ${url}. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries) {
        throw err;
      }
      console.warn(`[GeoService] Fetch error for ${url}:`, err, `. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error("Fetch failed after retries");
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Attempt to use the server-side Google Maps / Nominatim proxy endpoint with retry support
    const response = await fetchWithRetry(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        return data.address;
      }
    }
    throw new Error("Proxy geocode response not valid");
  } catch (err) {
    console.warn("Server-side geocoding failed, trying direct OpenStreetMap Nominatim:", err);
    try {
      const response = await fetchWithRetry(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept": "application/json",
            "User-Agent": "CommunityHeroApp/1.0 (vrtiwary2006@gmail.com)"
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.display_name) {
        return data.display_name;
      }
    } catch (osmErr) {
      console.warn("Direct OpenStreetMap geocoding failed as well:", osmErr);
    }
    
    // Default fallback to raw coordinates rather than hardcoded mock name
    return `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
  }
}

