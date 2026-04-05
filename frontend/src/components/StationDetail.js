import { motion } from "framer-motion";
import { Navigation, X } from "lucide-react";
import AdBanner from "@/components/AdBanner";

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
      className="absolute left-3 right-3 z-[800] bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_-2px_30px_rgba(0,0,0,0.12)] border border-black/5"
      style={{ bottom: "100px" }}
      data-testid="station-detail-card"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-2">
        {/* Price bubble */}
        {mainPrice && (
          <div className={`shrink-0 rounded-xl px-4 py-2.5 text-center min-w-[80px] ${
            cheapest ? "bg-emerald-500" : "bg-gray-900"
          }`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/70">
              {mainPrice.self_service ? "Self" : "Servito"}
            </div>
            <div className="font-mono text-[20px] font-bold text-white tracking-tighter">
              {mainPrice.prezzo.toFixed(3).replace(".", ",")}
            </div>
          </div>
        )}

        {/* Name + address */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-[15px] font-bold text-gray-900 truncate">
            {station.gestore || "Stazione indipendente"}
          </p>
          <p className="text-[13px] text-gray-400 truncate mt-0.5">
            {station.indirizzo}
          </p>
          {cheapest && (
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
              Prezzo migliore
            </span>
          )}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:scale-90 transition-transform"
          data-testid="close-detail"
        >
          <X size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* All prices row */}
      {showAll && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {allPrices.map((p, i) => (
            <div key={i} className="shrink-0 bg-gray-50 rounded-lg px-3 py-2 text-center min-w-[72px] min-h-[44px] flex flex-col justify-center">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate max-w-[72px]">
                {p.tipo}
              </div>
              <div className="text-[11px] text-gray-400">{p.self_service ? "Self" : "Serv."}</div>
              <div className="font-mono text-[14px] font-bold text-gray-800">
                {p.prezzo.toFixed(3).replace(".", ",")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* #4: AdSense banner in station detail */}
      <div className="px-4 pb-2">
        <AdBanner slot="DETAIL_AD_SLOT" format="horizontal" className="rounded-xl" />
      </div>

      {/* Navigate CTA */}
      {mapsUrl && (
        <div className="px-4 pb-4">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gray-900 text-white min-h-[52px] py-3.5 rounded-xl text-[15px] font-bold active:scale-[0.98] transition-transform hover:bg-gray-800"
            data-testid="navigate-to-station"
          >
            <Navigation size={18} strokeWidth={2.5} />
            Naviga
          </a>
        </div>
      )}
    </motion.div>
  );
}
