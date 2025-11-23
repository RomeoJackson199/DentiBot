import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SCROLL_KEY = "scroll:positions";

export function useScrollRestoration() {
  const location = useLocation();

  useEffect(() => {
    let positions: Record<string, number> = {};
    try {
      positions = JSON.parse(sessionStorage.getItem(SCROLL_KEY) || "{}");
    } catch (error) {
      console.error('Failed to parse scroll positions from sessionStorage:', error);
      positions = {};
    }

    const key = location.pathname + location.hash;
    if (positions[key] != null) {
      requestAnimationFrame(() => window.scrollTo({ top: positions[key], behavior: "auto" }));
    }

    const onScroll = () => {
      positions[key] = window.scrollY;
      try {
        sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions));
      } catch (error) {
        console.error('Failed to save scroll position to sessionStorage:', error);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname, location.hash]);
}

