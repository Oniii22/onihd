import React, { useState, useMemo, useCallback, useRef } from "react";
import "@/App.css";
import CitySearch from "@/components/CitySearch";
import FuelFilter from "@/components/FuelFilter";
import StationList from "@/components/StationList";
import MapView from "@/components/MapView";
import StationDetail from "@/components/StationDetail";
import EmptyState from "@/components/EmptyState";
import { useFuelStations } from "@/hooks/useFuelStations";
import { Map, List, ArrowUpDown, Loader2 } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useTransform, useAnimation } from "framer-motion";
import InstallPrompt from "@/components/InstallPrompt";

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

    // Get the relevant price for a station
    const getPrice = (s) => {
      if (fuel) {
        return s.prezzi.find((p) => p.tipo === fuel)?.prezzo ?? Infinity;
      }
      // No fuel selected: use the cheapest price across all fuel types
      return s.prezzi.length > 0
        ? Math.min(...s.prezzi.map((p) => p.prezzo))
        : Infinity;
    };

    // Always sort by price
    filtered.sort((a, b) => {
      const pA = getPrice(a);
      const pB = getPrice(b);
      return sortDir === "asc" ? pA - pB : pB - pA;
    });

    // Cheapest is always the one with lowest price (regardless of sort direction)
    const cId = filtered.length > 0
      ? filtered.reduce((best, s) => {
          return getPrice(s) < getPrice(best) ? s : best;
        }).id
      : null;

    return { sorted: filtered, cheapestId: cId };
  }, [stations, fuel, sortDir]);

  const handleCityChange = useCallback((v) => {
    setCity(v);
    setSelectedStation(null);
    setViewMode("map"); // #7: close list when editing city
  }, []);

  const handleFuelChange = useCallback((v) => {
    setFuel(v);
    setViewMode("map"); // #7: close list when editing fuel
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

  const closeList = useCallback(() => {
    setViewMode("map");
  }, []);

  const toggleSort = useCallback(() => {
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }, []);

  return (
    <div data-testid="app-root" className="w-full relative overflow-hidden bg-white" style={{ height: "100dvh", height: "100%" }}>
      {/* Map always renders in background — full edge-to-edge */}
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

      {/* Loading overlay when fetching stations */}
      <AnimatePresence>
        {loading && city && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[450] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl px-6 py-4 shadow-lg flex items-center gap-3">
              <Loader2 size={20} strokeWidth={2.5} className="text-emerald-500 spin-pulse" />
              <span className="text-[14px] font-semibold text-gray-700">Aggiornamento prezzi...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top floating controls — safe area inset for notch */}
      <div className="absolute top-0 left-0 right-0 z-[500] pointer-events-none" style={{ paddingTop: "max(16px, env(safe-area-inset-top))" }}>
        <div className="px-4 pb-0 pointer-events-auto">
          <CitySearch value={city} onChange={handleCityChange} onInteract={closeList} />
        </div>
        <div className="px-4 pt-3 pointer-events-auto">
          <FuelFilter selectedFuel={fuel} onFuelChange={handleFuelChange} onInteract={closeList} />
        </div>
      </div>

      {/* List view - slides up over map, draggable to close (#3) */}
      <AnimatePresence>
        {viewMode === "list" && (
          <DraggableListPanel onClose={closeList}>
            {/* List header */}
            {city && sorted.length > 0 && (
              <div className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-gray-900">
                    {sorted.length} distributori
                  </span>
                  {fuel && (
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                      {fuel}
                    </span>
                  )}
                </div>
                <button
                  onClick={toggleSort}
                  className="flex items-center gap-1.5 text-[13px] font-semibold text-gray-500 bg-gray-100 px-4 py-2.5 rounded-full active:scale-95 transition-transform min-h-[44px]"
                  data-testid="sort-toggle"
                >
                  <ArrowUpDown size={14} strokeWidth={2.5} />
                  Prezzo {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>
            )}

            {/* List content */}
            <div className="overflow-y-auto pb-28" style={{ maxHeight: "calc(100vh - 230px)" }}>
              {!city ? (
                <EmptyState />
              ) : loading ? (
                <LoadingSkeleton />
              ) : sorted.length === 0 ? (
                <div className="text-center py-16 text-gray-400 text-[15px] font-medium">
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
          </DraggableListPanel>
        )}
      </AnimatePresence>

      {/* Station detail bottom card (map mode) — #6: positioned above toggle */}
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

      {/* #1: Empty state hint — centered on screen */}
      {viewMode === "map" && !city && (
        <div className="absolute inset-x-0 z-[500] flex justify-center pointer-events-none" style={{ top: "45%" }}>
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl px-6 py-5 shadow-lg mx-6 text-center pointer-events-auto">
            <p className="text-[15px] font-bold text-gray-900">Cerca una citta</p>
            <p className="text-[13px] text-gray-500 mt-1.5">Inserisci il nome per trovare i distributori</p>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* #2: Floating view toggle — safe area for home indicator */}
      <div className="absolute left-1/2 -translate-x-1/2 z-[700]" style={{ bottom: "max(64px, calc(env(safe-area-inset-bottom) + 48px))" }}>
        <button
          onClick={toggleView}
          className="flex items-center gap-2.5 bg-emerald-500 text-white pl-5 pr-6 py-4 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-95 transition-all duration-150 hover:bg-emerald-600 min-h-[52px]"
          data-testid="view-toggle"
        >
          {viewMode === "map" ? (
            <>
              <List size={20} strokeWidth={2.5} />
              <span className="text-[15px] font-bold tracking-tight">Lista</span>
            </>
          ) : (
            <>
              <Map size={20} strokeWidth={2.5} />
              <span className="text-[15px] font-bold tracking-tight">Mappa</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* #3: Draggable list panel — swipe down to close */
function DraggableListPanel({ onClose, children }) {
  const y = useMotionValue(0);
  const controls = useAnimation();
  const scrollRef = useRef(null);
  const isDraggingHandle = useRef(false);

  const handleDragEnd = (_, info) => {
    if (info.offset.y > 100 || info.velocity.y > 400) {
      onClose();
    } else {
      controls.start({ y: 0 });
    }
    isDraggingHandle.current = false;
  };

  return (
    <motion.div
      key="list-view"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 300 }}
      className="absolute inset-x-0 bottom-0 z-[600] bg-white rounded-t-3xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)]"
      style={{ top: "max(140px, calc(env(safe-area-inset-top) + 120px))", y }}
      data-testid="list-view-panel"
    >
      {/* Drag handle area */}
      <motion.div
        className="cursor-grab active:cursor-grabbing touch-none"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.4}
        onDragEnd={handleDragEnd}
        style={{ y }}
      >
        <div className="flex justify-center pt-3.5 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-gray-300" />
        </div>
      </motion.div>

      {children}
    </motion.div>
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
