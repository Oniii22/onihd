import { useEffect, useRef, useState } from "react";

const ADSENSE_CLIENT = "ca-pub-0000000000000000"; // Replace with your AdSense publisher ID
const IS_TEST = ADSENSE_CLIENT.includes("0000000000");

export default function AdBanner({ slot = "1234567890", format = "auto", className = "" }) {
  const adRef = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (IS_TEST || pushed.current) return;
    try {
      if (window.adsbygoogle && adRef.current) {
        window.adsbygoogle.push({});
        pushed.current = true;
      }
    } catch (e) {
      // AdSense not loaded
    }
  }, []);

  // Show placeholder when using test IDs
  if (IS_TEST) {
    return (
      <div
        className={`flex items-center justify-center h-[50px] bg-gray-100 rounded-xl ${className}`}
        data-testid={`ad-banner-${slot}`}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-gray-300">
          Annuncio
        </span>
      </div>
    );
  }

  // Real AdSense ad
  return (
    <div
      className={`ad-container overflow-hidden rounded-xl ${className}`}
      data-testid={`ad-banner-${slot}`}
      ref={adRef}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
