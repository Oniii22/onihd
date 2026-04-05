import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function useFuelStations(city, fuel) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!city) {
      setStations([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const startTime = Date.now();
    const MIN_LOADING_MS = 500; // minimum visible loading time

    const params = { comune: city };
    if (fuel) params.fuel = fuel;

    axios
      .get(`${API}/fuel/stations`, { params })
      .then((res) => {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, MIN_LOADING_MS - elapsed);
        setTimeout(() => {
          if (!cancelled) {
            setStations(res.data);
            setLoading(false);
          }
        }, delay);
      })
      .catch((err) => {
        console.error("Failed to fetch stations:", err);
        if (!cancelled) {
          setStations([]);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [city, fuel]);

  return { stations, loading };
}

export function useCitySearch(query) {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 3) {
      setCities([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    axios
      .get(`${API}/fuel/cities`, { params: { q: query } })
      .then((res) => {
        if (!cancelled) setCities(res.data);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [query]);

  return { cities, loading };
}

export function useFuelTypes() {
  const [fuels, setFuels] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/fuel/fuels`)
      .then((res) => setFuels(res.data))
      .catch(() => setFuels([]));
  }, []);

  return fuels;
}
