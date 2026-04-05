import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Share, Plus } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_EXPIRY_DAYS = 7;

function isStandalone() {
  // Check if app is already installed / running in standalone mode
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://")
  );
}

function isDismissed() {
  try {
    const data = localStorage.getItem(DISMISS_KEY);
    if (!data) return false;
    const { timestamp } = JSON.parse(data);
    const daysSince = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
    return daysSince < DISMISS_EXPIRY_DAYS;
  } catch {
    return false;
  }
}

function setDismissed() {
  localStorage.setItem(DISMISS_KEY, JSON.stringify({ timestamp: Date.now() }));
}

function getDevice() {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) return "ios";
  if (/android/i.test(ua)) return "android";
  return "desktop";
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [device, setDevice] = useState("desktop");

  useEffect(() => {
    // Don't show if already installed or recently dismissed
    if (isStandalone() || isDismissed()) return;

    setDevice(getDevice());

    // Listen for the native install prompt (Chrome/Edge/Android)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Small delay so the app loads first
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // For iOS (no beforeinstallprompt), show manual instructions after delay
    const d = getDevice();
    if (d === "ios") {
      const timer = setTimeout(() => setShow(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("beforeinstallprompt", handler);
      };
    }

    // For desktop/android without prompt event, show after delay
    const fallbackTimer = setTimeout(() => {
      setShow((prev) => {
        // Only show if beforeinstallprompt didn't fire
        if (!prev && d !== "desktop") return true;
        return prev;
      });
    }, 4000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Also hide if app becomes standalone while prompt is showing
  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    const onChange = () => {
      if (mq.matches) setShow(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShow(false);
      }
      setDeferredPrompt(null);
    }
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShow(false);
    setDismissed();
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-3 right-3 z-[900] bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden"
        data-testid="install-prompt"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-emerald-400 to-emerald-600" />

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="shrink-0 w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
              <img src="/icon.svg" alt="PienoPerfetto" className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">
                Installa PienoPerfetto
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Accesso rapido dalla schermata home
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-400 active:scale-90 transition-transform"
              data-testid="dismiss-install-prompt"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>

          {/* Install action */}
          {device === "ios" ? (
            <IOSInstructions />
          ) : deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="mt-3 flex items-center justify-center gap-2 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold active:scale-[0.98] transition-transform"
              data-testid="install-app-button"
            >
              <Download size={16} strokeWidth={2.5} />
              Installa app
            </button>
          ) : (
            <AndroidInstructions />
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function IOSInstructions() {
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3" data-testid="ios-install-instructions">
      <p className="text-xs font-semibold text-gray-700 mb-2">Come installare su iPhone:</p>
      <div className="space-y-2">
        <Step number={1} icon={<Share size={13} strokeWidth={2.5} />}>
          Tocca il pulsante <strong>Condividi</strong> in basso
        </Step>
        <Step number={2} icon={<Plus size={13} strokeWidth={2.5} />}>
          Scorri e tocca <strong>"Aggiungi a Home"</strong>
        </Step>
        <Step number={3} icon={<Download size={13} strokeWidth={2.5} />}>
          Tocca <strong>"Aggiungi"</strong> in alto a destra
        </Step>
      </div>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="mt-3 bg-gray-50 rounded-xl p-3" data-testid="android-install-instructions">
      <p className="text-xs font-semibold text-gray-700 mb-2">Come installare:</p>
      <div className="space-y-2">
        <Step number={1}>
          Tocca il menu <strong>(tre puntini)</strong> del browser
        </Step>
        <Step number={2}>
          Seleziona <strong>"Aggiungi a schermata Home"</strong>
        </Step>
      </div>
    </div>
  );
}

function Step({ number, icon, children }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="shrink-0 w-5 h-5 rounded-full bg-gray-900 text-white flex items-center justify-center">
        <span className="text-[10px] font-bold">{number}</span>
      </div>
      {icon && <span className="text-gray-500">{icon}</span>}
      <p className="text-[11px] text-gray-600 leading-tight">{children}</p>
    </div>
  );
}
