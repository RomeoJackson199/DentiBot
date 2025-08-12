import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Centralized SEO configuration per route
const seoMap: Record<string, { title: string; description: string; structuredData?: object }>
  = {
  "/": {
    title: "DentiSmart Scheduler — AI Dental Booking & Triage",
    description: "AI dental assistant for smart booking, emergency triage, and patient care. Secure, fast, and ready for your practice.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "DentiSmart Scheduler",
      url: typeof window !== "undefined" ? window.location.origin : "",
      logo: typeof window !== "undefined" ? `${window.location.origin}/favicon.ico` : "",
      sameAs: []
    }
  },
  "/dentists": {
    title: "Find Dentists — Reviews, Expertise & Availability",
    description: "Browse dentist profiles with ratings and availability. Book the right expert for your dental needs.",
  },
  "/dashboard": {
    title: "Dashboard — Appointments, Tasks & Insights",
    description: "Manage appointments, patients, and tasks with real-time insights and secure records.",
  },
  "/analytics": {
    title: "Analytics — Practice Performance & Trends",
    description: "Track practice KPIs, patient trends, and revenue insights in one place.",
  },
  "/schedule": {
    title: "Schedule — Smart Calendar & Availability",
    description: "Plan efficiently with smart scheduling, slots, and availability management.",
  },
  "/support": {
    title: "Support — Help & Documentation",
    description: "Get help, documentation, and answers to common questions.",
  },
  "/privacy": {
    title: "Privacy Policy — Data Protection & Security",
    description: "Learn how we protect your data with robust security and privacy policies.",
  },
  "/terms": {
    title: "Terms of Service — Usage & Policies",
    description: "Read the terms and policies governing use of our platform.",
  },
  "/chat": {
    title: "AI Dental Chat — Instant Answers & Guidance",
    description: "Chat with an AI dental assistant for quick guidance and triage.",
  },
};

function upsertMetaTag(name: string, content: string) {
  if (!content) return;
  let el = document.querySelector(`meta[name='${name}']`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  const href = url.replace(/\/$/, "");
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

function setJsonLd(data?: object) {
  // Remove previous JSON-LD blocks added by us
  const existing = document.querySelectorAll("script[data-seo-jsonld='true']");
  existing.forEach((n) => n.parentElement?.removeChild(n));

  if (!data) return;
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-seo-jsonld", "true");
  script.text = JSON.stringify(data);
  document.head.appendChild(script);
}

export function applySEO(pathname: string) {
  const basis = seoMap[pathname] || {
    title: "DentiSmart Scheduler",
    description: "Smart dental practice management and patient booking system.",
  };

  // Title (under 60 chars recommended)
  document.title = basis.title;
  // Meta description (under 160 chars)
  upsertMetaTag("description", basis.description);

  // Canonical
  const base = window.location.origin;
  setCanonical(`${base}${pathname}`);

  // Open Graph & Twitter basics
  upsertMetaTag("og:title", basis.title);
  upsertMetaTag("og:description", basis.description);
  upsertMetaTag("twitter:title", basis.title);
  upsertMetaTag("twitter:description", basis.description);

  // Structured data if provided
  setJsonLd(basis.structuredData);
}

export const SeoManager = () => {
  const location = useLocation();
  useEffect(() => {
    applySEO(location.pathname);
  }, [location.pathname]);
  return null;
};
