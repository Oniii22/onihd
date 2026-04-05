import React, { useState, useMemo, useCallback, useRef } from "react";
import "@/App.css";
import CitySearch from "@/components/CitySearch";
import FuelFilter from "@/components/FuelFilter";
import StationList from "@/components/StationList";
import MapView from "@/components/MapView";
import StationDetail from "@/components/StationDetail";
import EmptyState from "@/components/EmptyState";
import { useFuelStations } from "@/hooks/useFuelStations";
import { Map, List, ArrowUpDown } from "lucide-react";
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

      {/* #1: Empty state hint — moved higher, above toggle */}
      {viewMode === "map" && !city && (
        <div className="absolute inset-x-0 z-[500] flex justify-center pointer-events-none" style={{ bottom: "50%" }}>
          <div className="bg-white/95 backdrop-blur-xl border border-black/5 rounded-2xl px-6 py-5 shadow-lg mx-6 text-center pointer-events-auto">
            <p className="text-[15px] font-bold text-gray-900">Cerca una citta</p>
            <p className="text-[13px] text-gray-500 mt-1.5">Inserisci il nome per trovare i distributori</p>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      <InstallPrompt />

      {/* #2: Floating view toggle — emerald accent color for visibility */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[700]">
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
      style={{ top: "140px", y }}
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
