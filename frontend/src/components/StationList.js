import { MapPin, Navigation } from "lucide-react";

export default function StationList({ stations, cheapestId, selectedFuel, onSelect }) {
  return (
    <div className="px-4 py-2 space-y-2.5 stagger-children" data-testid="station-list">
      {stations.map((station) => (
        <StationCard
          key={station.id}
          station={station}
          cheapest={station.id === cheapestId}
          selectedFuel={selectedFuel}
          onClick={() => onSelect(station)}
        />
      ))}
    </div>
  );
}

function StationCard({ station, cheapest, selectedFuel, onClick }) {
  const mainPrice = selectedFuel
    ? station.prezzi.find((p) => p.tipo === selectedFuel)
    : station.prezzi[0];

  const otherPrices = station.prezzi
    .filter((p) => p !== mainPrice)
    .sort((a, b) => a.prezzo - b.prezzo)
    .slice(0, 3);

  const mapsUrl = station.lat && station.lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}`
    : null;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all active:scale-[0.98] cursor-pointer ${
        cheapest
          ? "bg-emerald-50/60 border-emerald-200"
          : "bg-white border-gray-100 hover:border-gray-200"
      }`}
      onClick={onClick}
      data-testid={`station-card-${station.id}`}
    >
      {/* Top row: brand + price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-900 truncate">
              {station.gestore || "Stazione indipendente"}
            </h3>
            {cheapest && (
              <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Migliore
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 truncate">
            <MapPin size={10} strokeWidth={2.5} />
            {station.indirizzo}
          </p>
        </div>

        {mainPrice && (
          <div className={`shrink-0 text-right ${cheapest ? "text-emerald-600" : "text-gray-900"}`}>
            <span className="font-mono text-xl font-bold tracking-tighter">
              {mainPrice.prezzo.toFixed(3).replace(".", ",")}
            </span>
            <span className="text-[10px] font-bold text-gray-400 ml-0.5">EUR</span>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
              {mainPrice.self_service ? "Self" : "Servito"}
            </div>
          </div>
        )}
      </div>

      {/* Price chips */}
      {otherPrices.length > 0 && (
        <div className="flex gap-1.5 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {otherPrices.map((p, i) => (
            <div
              key={`${p.tipo}-${p.self_service}-${i}`}
              className="shrink-0 bg-gray-50 rounded-lg px-2.5 py-1.5 text-center"
            >
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400 truncate max-w-[64px]">
                {p.tipo}
              </div>
              <div className="font-mono text-xs font-bold text-gray-700">
                {p.prezzo.toFixed(3).replace(".", ",")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigate button */}
      {mapsUrl && (
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-3 flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-transform hover:bg-gray-800"
          data-testid={`navigate-btn-${station.id}`}
        >
          <Navigation size={14} strokeWidth={2.5} />
          Naviga
        </a>
      )}
    </div>
  );
}
