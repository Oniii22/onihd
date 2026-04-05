import { useEffect, useRef } from "react";

export default function AdBanner({ slot = "1234567890", format = "auto", className = "" }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense not loaded yet or blocked
    }
  }, []);

  return (
    <div
      className={`ad-container overflow-hidden bg-gray-50 rounded-xl ${className}`}
      data-testid={`ad-banner-${slot}`}
      ref={adRef}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: "50px" }}
        data-ad-client="ca-pub-0000000000000000"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
      {/* Placeholder visible when AdSense hasn't loaded */}
      <div className="ad-placeholder flex items-center justify-center py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">
        Annuncio
      </div>
    </div>
  );
}
