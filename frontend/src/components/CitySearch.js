import { useState, useEffect, useRef } from "react";
import { useCitySearch } from "@/hooks/useFuelStations";
import { Search, MapPin, X, Loader2 } from "lucide-react";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function CitySearch({ value, onChange }) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedQuery = useDebounce(query, 300);
  const { cities, loading } = useCitySearch(debouncedQuery);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full" data-testid="city-search-wrapper">
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
          strokeWidth={2.5}
        />
        <input
          type="text"
          placeholder="Cerca citta (es. Milano)"
          className="w-full h-12 pl-11 pr-10 bg-white/90 backdrop-blur-xl border border-black/5 rounded-full shadow-lg text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 focus:ring-black/10 transition-shadow"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          data-testid="input-city-search"
        />
        {loading && (
          <Loader2
            className="absolute right-10 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
            size={16}
          />
        )}
        {value && (
          <button
            onClick={() => { onChange(""); setQuery(""); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-transform"
            data-testid="clear-search"
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {open && query.length > 2 && (
        <div className="absolute top-full left-2 right-2 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-black/5 overflow-hidden z-50 animate-fadeIn">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-400">Ricerca in corso...</div>
          ) : cities.length > 0 ? (
            <ul className="max-h-64 overflow-auto py-1">
              {cities.map((c, i) => (
                <li key={`${c.comune}-${c.provincia}-${i}`}>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3"
                    onClick={() => { onChange(c.comune); setQuery(c.comune); setOpen(false); }}
                    data-testid={`city-option-${c.comune}`}
                  >
                    <MapPin size={16} strokeWidth={2.5} className="text-gray-400 shrink-0" />
                    <div>
                      <span className="text-sm font-semibold text-gray-900 block">{c.comune}</span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{c.provincia}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-gray-400">Nessuna citta trovata</div>
          )}
        </div>
      )}
    </div>
  );
}
