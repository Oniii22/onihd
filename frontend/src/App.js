import React, { useState, useMemo, useCallback } from "react";
import "@/App.css";
import CitySearch from "@/components/CitySearch";
import FuelFilter from "@/components/FuelFilter";
import StationList from "@/components/StationList";
import MapView from "@/components/MapView";
import StationDetail from "@/components/StationDetail";
import EmptyState from "@/components/EmptyState";
import { useFuelStations } from "@/hooks/useFuelStations";
import { Map, List, ArrowUpDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function App() {
  const [city, setCity] = useState("");
  const [fuel, setFuel] = useState("Gasolio");
  const [viewMode, setViewMode] = useState("map");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedStation, setSelectedStation] = useState(null);

  const { stations, loading } = useFuelStations(city, fuel);

  const { sorted, cheapestId } = useMemo(() => {
    if (!stations || stations.length === 0) return { sorted: [], cheapestId: null };

    let filtered = stations.filter((s) =>
      fuel ? s.prezzi.some((p) => p.tipo === fuel) : s.prezzi.length > 0
    );

    if (fuel) {
      filtered.sort((a, b) => {
        const pA = a.prezzi.find((p) => p.tipo === fuel)?.prezzo ?? Infinity;
        const pB = b.prezzi.find((p) => p.tipo === fuel)?.prezzo ?? Infinity;
        return sortDir === "asc" ? pA - pB : pB - pA;
      });
    }

    const cId = filtered.length > 0
      ? filtered.reduce((best, s) => {
          const bP = best.prezzi.find((p) => !fuel || p.tipo === fuel)?.prezzo ?? Infinity;
          const sP = s.prezzi.find((p) => !fuel || p.tipo === fuel)?.prezzo ?? Infinity;
          return sP < bP ? s : best;
        }).id
      : null;

    return { sorted: filtered, cheapestId: cId };
  }, [stations, fuel, sortDir]);

  const handleCityChange = useCallback((v) => {
    setCity(v);
    setSelectedStation(null);
  }, []);

  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    if (viewMode === "list") setViewMode("map");
  }, [viewMode]);

  const handleCloseDetail = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const toggleView = useCallback(() => {
    setViewMode((v) => (v === "map" ? "list" : "map"));
    setSelectedStation(null);
  }, []);

  const toggleSort = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  return (
    <div data-testid="app-root" className="h-full w-full relative overflow-hidden bg-white">
      {/* Map always renders in background */}
      <div className="absolute inset-0">
        <MapView
          stations={sorted}
          selectedFuel={fuel}
          cheapestStationId={cheapestId}
          selectedStation={selectedStation}
          onStationSelect={setSelectedStation}
          hasCity={!!city}
        />
      </div>

      {/* Top floating controls */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none">
        <div className="p-4 pb-0 pointer-events-auto">
          <CitySearch value={city} onChange={handleCityChange} />
        </div>
        <div className="px-4 pt-3 pointer-events-auto">
          <FuelFilter selectedFuel={fuel} onFuelChange={setFuel} />
        </div>
      </div>

      {/* List view - slides up over map */}
      <AnimatePresence>
        {viewMode === "list" && (
          <motion.div
            key="list-view"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-[600] bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
            style={{ top: "140px" }}
            data-testid="list-view-panel"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>

            {/* List header */}
            {city && sorted.length > 0 && (
              <div className="flex items-center justify-between px-5 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">
                    {sorted.length} distributori
                  </span>
                  {fuel && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                      {fuel}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
                  data-testid="sort-toggle"
                >
                  <ArrowUpDown size={12} strokeWidth={2.5} />
                  Prezzo {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
            )}

            {/* List content */}
            <div className="overflow-y-auto pb-24" style={{ maxHeight: "calc(100vh - 220px)" }}>
              {!city ? (
                <EmptyState />
              ) : loading ? (
                <LoadingSkeleton />
              ) : sorted.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-sm font-medium">
                  Nessun distributore trovato.
                </div>
              ) : (
                <StationList
                  stations={sorted}
                  cheapestId={cheapestId}
                  selectedFuel={fuel}
                  onSelect={handleStationSelect}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Station detail bottom card (map mode) */}
      <AnimatePresence>
        {viewMode === "map" && selectedStation && (
          <StationDetail
            station={selectedStation}
            cheapest={selectedStation.id === cheapestId}
            selectedFuel={fuel}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>

      {/* Empty state overlay for map mode without city */}
      {viewMode === "map" && !city && (
        <div className="absolute inset-x-0 bottom-20 z-[500] flex justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl px-6 py-4 shadow-lg mx-4 text-center pointer-events-auto">
            <p className="text-sm font-semibold text-gray-900">Cerca una citta</p>
            <p className="text-xs text-gray-500 mt-1">Inserisci il nome per trovare i distributori</p>
          </div>
        </div>
      )}

      {/* Floating view toggle */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[700]">
        <button
          onClick={toggleView}
          className="flex items-center gap-2.5 bg-gray-900 text-white pl-5 pr-6 py-3.5 rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.3)] active:scale-95 transition-all duration-150 hover:bg-gray-800"
          data-testid="view-toggle"
        >
          {viewMode === "map" ? (
            <>
              <List size={18} strokeWidth={2.5} />
              <span className="text-sm font-bold tracking-tight">Lista</span>
            </>
          ) : (
            <>
              <Map size={18} strokeWidth={2.5} />
              <span className="text-sm font-bold tracking-tight">Mappa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="px-4 py-3 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-gray-50 rounded-2xl p-5 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
          <div className="h-3 bg-gray-100 rounded w-full mb-4" />
          <div className="flex gap-2">
            <div className="h-14 bg-gray-200 rounded-xl flex-1" />
            <div className="h-14 bg-gray-100 rounded-xl flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default App;
