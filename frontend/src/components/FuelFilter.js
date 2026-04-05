import { useState, useRef, useEffect } from "react";
import { useFuelTypes } from "@/hooks/useFuelStations";
import { Droplet, ChevronDown, Check } from "lucide-react";

export default function FuelFilter({ selectedFuel, onFuelChange }) {
  const fuels = useFuelTypes();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const label = selectedFuel || "Tutti i carburanti";

  // Show popular fuels first
  const popular = ["Gasolio", "Benzina", "GPL", "Metano"];
  const popularFuels = popular.filter((f) => fuels.includes(f));
  const otherFuels = fuels.filter((f) => !popular.includes(f));

  return (
    <div ref={ref} className="relative" data-testid="fuel-filter-wrapper">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-black/5 rounded-full shadow-md px-4 h-10 active:scale-95 transition-all w-full"
        data-testid="fuel-filter-trigger"
      >
        <Droplet size={14} strokeWidth={2.5} className="text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-700 flex-1 text-left truncate">
          {label}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.5}
          className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 overflow-hidden z-50 animate-fadeIn">
          <div className="max-h-72 overflow-y-auto py-1">
            {/* All fuels option */}
            <FuelOption
              label="Tutti i carburanti"
              selected={!selectedFuel}
              onClick={() => { onFuelChange(""); setOpen(false); }}
              testId="fuel-option-all"
            />

            {/* Popular fuels */}
            {popularFuels.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Popolari</span>
                </div>
                {popularFuels.map((f) => (
                  <FuelOption
                    key={f}
                    label={f}
                    selected={selectedFuel === f}
                    onClick={() => { onFuelChange(f); setOpen(false); }}
                    testId={`fuel-option-${f}`}
                  />
                ))}
              </>
            )}

            {/* Other fuels */}
            {otherFuels.length > 0 && (
              <>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Altri</span>
                </div>
                {otherFuels.map((f) => (
                  <FuelOption
                    key={f}
                    label={f}
                    selected={selectedFuel === f}
                    onClick={() => { onFuelChange(f); setOpen(false); }}
                    testId={`fuel-option-${f}`}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FuelOption({ label, selected, onClick, testId }) {
  return (
    <button
      className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
        selected ? "bg-gray-900 text-white" : "hover:bg-gray-50 active:bg-gray-100 text-gray-700"
      }`}
      onClick={onClick}
      data-testid={testId}
    >
      <Check
        size={14}
        strokeWidth={3}
        className={selected ? "opacity-100" : "opacity-0"}
      />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
