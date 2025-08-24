import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY = "scroll:positions";

export function useScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    const positions: Record<string, number> = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
    const key = location.pathname + location.hash;
    if (positions[key] != null) {
      requestAnimationFrame(() => window.scrollTo({ top: positions[key], behavior: "auto" }));
    }

    const onScroll = () => {
      positions[key] = window.scrollY;
      sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, location.hash]);
}

