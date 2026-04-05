import { useEffect, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function createPriceIcon(price, isCheapest, isSelf, noPrice, isSelected) {
  const bg = isSelected
    ? "#111827"
    : noPrice
    ? "#9CA3AF"
    : isCheapest
    ? "#10B981"
    : "#FFFFFF";

  const textColor = isSelected || isCheapest || noPrice ? "#FFFFFF" : "#111827";
  const border = isSelected
    ? "3px solid #3B82F6"
    : isCheapest
    ? "2px solid #059669"
    : noPrice
    ? "1px solid #D1D5DB"
    : "1px solid rgba(0,0,0,0.08)";

  const shadow = isSelected
    ? "0 0 0 4px rgba(59,130,246,0.25), 0 4px 12px rgba(0,0,0,0.25)"
    : isCheapest
    ? "0 2px 8px rgba(16,185,129,0.35)"
    : "0 2px 8px rgba(0,0,0,0.12)";

  const scale = isSelected ? "transform: scale(1.15); transform-origin: bottom center;" : "";
  const pulseRing = isCheapest && !isSelected
    ? `<div style="position:absolute;top:-4px;left:-4px;right:-4px;bottom:-8px;border-radius:999px;border:2px solid #10B981;opacity:0;" class="marker-pulse-ring"></div>`
    : "";

  const selfDot = isSelf && !noPrice
    ? `<div style="position:absolute;top:-2px;right:-2px;width:6px;height:6px;border-radius:50%;background:#F59E0B;border:1px solid white;"></div>`
    : "";

  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;width:72px;${scale};position:relative;">
      ${pulseRing}
      <div style="
        position:relative;
        background:${bg};
        color:${textColor};
        font-weight:700;
        font-size:12px;
        font-family:'JetBrains Mono','Work Sans',system-ui,sans-serif;
        padding:5px 10px;
        border-radius:999px;
        white-space:nowrap;
        border:${border};
        line-height:1.2;
        box-shadow:${shadow};
        text-align:center;
        letter-spacing:-0.02em;
      ">${noPrice ? "N/D" : "€" + price}${selfDot}</div>
      <div style="
        width:0;height:0;
        border-left:5px solid transparent;
        border-right:5px solid transparent;
        border-top:6px solid ${bg};
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));
      "></div>
    </div>
  `;

  return L.divIcon({
    className: "",
    html,
    iconSize: [72, 34],
    iconAnchor: [36, 34],
  });
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 36 : count < 50 ? 42 : 48;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:#111827;color:#fff;
        border-radius:50%;display:flex;
        align-items:center;justify-content:center;
        font-weight:700;font-size:12px;
        font-family:'Work Sans',system-ui,sans-serif;
        box-shadow:0 2px 10px rgba(0,0,0,0.3);
        border:2px solid rgba(255,255,255,0.8);
        letter-spacing:-0.02em;
      ">${count}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function FitBounds({ stations }) {
  const map = useMap();
  const prevKey = useRef("");

  useEffect(() => {
    const valid = stations.filter((s) => s.lat != null && s.lng != null);
    if (valid.length === 0) return;

    const key = valid.map((s) => s.id).sort().join(",");
    if (key === prevKey.current) return;
    prevKey.current = key;

    const bounds = L.latLngBounds(valid.map((s) => [s.lat, s.lng]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
  }, [stations, map]);

  return null;
}

function PanTo({ station }) {
  const map = useMap();
  useEffect(() => {
    if (station?.lat != null && station?.lng != null) {
      map.setView([station.lat, station.lng], 17, { animate: true });
    }
  }, [station, map]);
  return null;
}

export default function MapView({
  stations,
  selectedFuel,
  cheapestStationId,
  selectedStation,
  onStationSelect,
  hasCity,
}) {
  const markers = useMemo(() => {
    return stations
      .filter((s) => s.lat != null && s.lng != null)
      .map((station) => {
        const isSelected = station.id === selectedStation?.id;
        let displayPrice = "";
        let isSelf = false;
        let noPrice = false;

        if (selectedFuel) {
          const p = station.prezzi.find((p) => p.tipo === selectedFuel);
          if (p) {
            displayPrice = p.prezzo.toFixed(3);
            isSelf = p.self_service;
          } else {
            noPrice = true;
          }
        } else if (station.prezzi.length > 0) {
          // No fuel selected: show the cheapest price across all types
          const cheapest = station.prezzi.reduce((best, p) =>
            p.prezzo < best.prezzo ? p : best
          );
          displayPrice = cheapest.prezzo.toFixed(3);
          isSelf = cheapest.self_service;
        } else {
          noPrice = true;
        }

        const isCheapest = !noPrice && station.id === cheapestStationId;

        return {
          station,
          icon: createPriceIcon(displayPrice, isCheapest, isSelf, noPrice, isSelected),
          zIndex: isSelected ? 1000 : isCheapest ? 500 : 0,
        };
      });
  }, [stations, selectedFuel, cheapestStationId, selectedStation]);

  return (
    <div style={{ width: "100%", height: "100%" }} data-testid="map-container">
      <MapContainer
        center={[42.0, 12.5]}
        zoom={6}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {hasCity && <FitBounds stations={stations} />}
        <PanTo station={selectedStation} />

        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={60}
          showCoverageOnHover={false}
          spiderfyOnMaxZoom
          disableClusteringAtZoom={16}
        >
          {markers.map(({ station, icon, zIndex }) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              icon={icon}
              zIndexOffset={zIndex}
              eventHandlers={{
                click: () => onStationSelect(station),
              }}
            />
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
