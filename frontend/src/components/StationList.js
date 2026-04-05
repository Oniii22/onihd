import { MapPin, Navigation } from "lucide-react";
import AdBanner from "@/components/AdBanner";

export default function StationList({ stations, cheapestId, selectedFuel, onSelect }) {
  const items = [];

  stations.forEach((station, i) => {
    items.push(
      <StationCard
        key={station.id}
        station={station}
        cheapest={station.id === cheapestId}
        selectedFuel={selectedFuel}
        onClick={() => onSelect(station)}
      />
    );

    // #5: Insert ad after every 3 stations
    if ((i + 1) % 3 === 0 && i < stations.length - 1) {
      items.push(
        <div key={`ad-${i}`} className="mx-4">
          <AdBanner slot="LIST_AD_SLOT" format="fluid" className="my-1" />
        </div>
      );
    }
  });

  return (
    <div className="px-4 py-2 space-y-2.5 stagger-children" data-testid="station-list">
      {items}
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
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-bold text-gray-900 truncate">
              {station.gestore || "Stazione indipendente"}
            </h3>
            {cheapest && (
              <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                Migliore
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-400 mt-1 flex items-center gap-1 truncate">
            <MapPin size={12} strokeWidth={2.5} className="shrink-0" />
            {station.indirizzo}
          </p>
        </div>

        {mainPrice && (
          <div className={`shrink-0 text-right ${cheapest ? "text-emerald-600" : "text-gray-900"}`}>
            <span className="font-mono text-[22px] font-bold tracking-tighter">
              {mainPrice.prezzo.toFixed(3).replace(".", ",")}
            </span>
            <span className="text-[11px] font-bold text-gray-400 ml-0.5">EUR</span>
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">
              {mainPrice.self_service ? "Self" : "Servito"}
            </div>
          </div>
        )}
      </div>

      {/* Price chips */}
      {otherPrices.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          {otherPrices.map((p, i) => (
            <div
              key={`${p.tipo}-${p.self_service}-${i}`}
              className="shrink-0 bg-gray-50 rounded-lg px-3 py-2 text-center min-h-[44px] flex flex-col justify-center"
            >
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 truncate max-w-[72px]">
                {p.tipo}
              </div>
              <div className="font-mono text-[13px] font-bold text-gray-700">
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
          className="mt-3 flex items-center justify-center gap-2 w-full bg-gray-900 text-white min-h-[48px] py-3 rounded-xl text-[14px] font-bold active:scale-[0.98] transition-transform hover:bg-gray-800"
          data-testid={`navigate-btn-${station.id}`}
        >
          <Navigation size={16} strokeWidth={2.5} />
          Naviga
        </a>
      )}
    </div>
  );
}
