import { motion } from "framer-motion";
import { Navigation, X } from "lucide-react";

export default function StationDetail({ station, cheapest, selectedFuel, onClose }) {
  const mainPrice = selectedFuel
    ? station.prezzi.find((p) => p.tipo === selectedFuel)
    : null;

  const allPrices = [...station.prezzi].sort((a, b) => a.prezzo - b.prezzo);
  const showAll = !selectedFuel && allPrices.length > 0;

  const mapsUrl = station.lat && station.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`
    : null;

  return (
    <motion.div
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 350 }}
      className="absolute bottom-20 left-3 right-3 z-[800] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_-2px_30px_rgba(0,0,0,0.12)] border border-black/5"
      data-testid="station-detail-card"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {/* Price bubble */}
        {mainPrice && (
          <div className={`shrink-0 rounded-xl px-3 py-2 text-center min-w-[72px] ${
            cheapest ? "bg-emerald-500" : "bg-gray-900"
          }`}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              {mainPrice.self_service ? "Self" : "Servito"}
            </div>
            <div className="font-mono text-lg font-bold text-white tracking-tighter">
              {mainPrice.prezzo.toFixed(3).replace(".", ",")}
            </div>
          </div>
        )}

        {/* Name + address */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm font-bold text-gray-900 truncate">
            {station.gestore || "Stazione indipendente"}
          </p>
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {station.indirizzo}
          </p>
          {cheapest && (
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Prezzo migliore
            </span>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-transform"
          data-testid="close-detail"
        >
          <X size={16} strokeWidth={2.5} />
        </button>
      </div>

      {/* All prices row */}
      {showAll && (
        <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {allPrices.map((p, i) => (
            <div key={i} className="shrink-0 bg-gray-50 rounded-lg px-2.5 py-1.5 text-center min-w-[68px]">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate max-w-[68px]">
                {p.tipo}
              </div>
              <div className="text-[10px] text-gray-400">{p.self_service ? "Self" : "Serv."}</div>
              <div className="font-mono text-sm font-bold text-gray-800">
                {p.prezzo.toFixed(3).replace(".", ",")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigate CTA */}
      {mapsUrl && (
        <div className="px-4 pb-4 pt-1">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform hover:bg-gray-800"
            data-testid="navigate-to-station"
          >
            <Navigation size={16} strokeWidth={2.5} />
            Naviga
          </a>
        </div>
      )}
    </motion.div>
  );
}
