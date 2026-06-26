import { useState, useEffect, useCallback } from "react";
import { reverseGeocode } from "../api/geoService.js";

export type LocationStatus = "loading" | "success" | "manual_input_required";

export interface GeolocationResult {
  status: LocationStatus;
  coordinates: number[] | null; // [lng, lat]
  detectedAddress: string | null;
  error: string | null;
  retry: () => void;
  setManualLocation: (address: string, coordinates?: number[]) => void;
}

export function useGeolocation(): GeolocationResult {
  const [status, setStatus] = useState<LocationStatus>("manual_input_required");
  const [coordinates, setCoordinates] = useState<number[] | null>(null);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLocation = useCallback(async () => {
    setStatus("manual_input_required");
    setError(null);
    setCoordinates(null);
    setDetectedAddress(null);
  }, []);

  const runTier2IPFallback = async (reason: string) => {
    setStatus("manual_input_required");
  };

  const runTier3ManualFallback = (reason: string) => {
    setError(reason);
    setCoordinates(null);
    setDetectedAddress(null);
    setStatus("manual_input_required");
  };

  // Allow setting a manual location from the UI
  const setManualLocation = useCallback((address: string, coords?: number[]) => {
    setDetectedAddress(address);
    if (coords && coords.length === 2) {
      setCoordinates(coords);
    } else {
      // Default null coordinates if not supplied, preventing hardcoded assumptions
      setCoordinates(null);
    }
    setStatus("success");
    setError(null);
  }, []);

  // Run on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  return {
    status,
    coordinates,
    detectedAddress,
    error,
    retry: fetchLocation,
    setManualLocation,
  };
}
