import { useEffect } from "react";

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const splash = document.getElementById("native-splash");
    const root = document.getElementById("root");

    if (!splash) {
      // No splash in DOM — reveal app and finish immediately
      if (root) root.style.opacity = "1";
      onFinish();
      return;
    }

    // Fade out splash and reveal app content
    const fadeTimer = setTimeout(() => {
      splash.style.opacity = "0";
      splash.style.pointerEvents = "none";
      if (root) root.style.opacity = "1";
      // Update status bar color to white
      document.querySelectorAll('meta[name="theme-color"]')
        .forEach((tag) => tag.setAttribute("content", "#FFFFFF"));
    }, 2800);

    // Remove splash from DOM after fade
    const removeTimer = setTimeout(() => {
      splash.remove();
      onFinish();
    }, 3300);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  return null;
}
