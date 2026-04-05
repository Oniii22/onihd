export default function AdBanner({ slot, format = "auto", className = "" }) {
  return (
    <div
      className={`ad-container overflow-hidden ${className}`}
      data-testid={`ad-banner-${slot}`}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
