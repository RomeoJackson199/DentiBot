import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Centralized SEO configuration per route
const seoMap: Record<string, { title: string; description: string; structuredData?: object }>
  = {
  "/": {
    title: "Caberu — AI-Powered Dental Practice Management Software",
    description: "Complete dental practice management platform with AI-powered scheduling, patient records, billing, and inventory tracking. HIPAA-compliant solution for modern dental practices.",
    structuredData: {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://caberu.be/#organization",
          name: "Caberu",
          url: "https://caberu.be",
          logo: {
            "@type": "ImageObject",
            url: "https://caberu.be/lovable-uploads/bd9069b9-f5b0-427d-8acb-8b6a25ccba24.png"
          },
          description: "AI-powered dental practice management software for modern dental professionals",
          sameAs: [
            "https://twitter.com/caberu_be"
          ],
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "Customer Support",
            availableLanguage: ["English"]
          }
        },
        {
          "@type": "WebSite",
          "@id": "https://caberu.be/#website",
          url: "https://caberu.be",
          name: "Caberu",
          description: "Complete Dental Practice Management Platform",
          publisher: {
            "@id": "https://caberu.be/#organization"
          },
          potentialAction: {
            "@type": "SearchAction",
            target: "https://caberu.be/?s={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        },
        {
          "@type": "SoftwareApplication",
          name: "Caberu",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web Browser",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD"
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            ratingCount: "127"
          },
          description: "AI-powered dental practice management software with scheduling, patient records, billing, and inventory management"
        }
      ]
    }
  },
  "/about": {
    title: "About Caberu — Modern Dental Practice Management Software",
    description: "Learn about Caberu's mission to transform dental practice management with AI-powered scheduling, patient care, and practice optimization tools.",
  },
  "/pricing": {
    title: "Pricing Plans — Affordable Dental Practice Management | Caberu",
    description: "Flexible pricing plans for dental practices of all sizes. Start free and scale as you grow. No hidden fees. HIPAA-compliant and secure.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "Caberu Dental Practice Management Software",
      description: "Complete dental practice management platform with AI-powered features",
      brand: {
        "@type": "Brand",
        name: "Caberu"
      },
      offers: [
        {
          "@type": "Offer",
          name: "Free Plan",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          name: "Professional Plan",
          price: "49",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "49",
            priceCurrency: "USD",
            unitText: "MONTH"
          },
          availability: "https://schema.org/InStock"
        },
        {
          "@type": "Offer",
          name: "Enterprise Plan",
          price: "99",
          priceCurrency: "USD",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "99",
            priceCurrency: "USD",
            unitText: "MONTH"
          },
          availability: "https://schema.org/InStock"
        }
      ]
    }
  },
  "/dentists": {
    title: "Find Dentists — Browse Profiles, Reviews & Availability | Caberu",
    description: "Browse verified dentist profiles with ratings and real-time availability. Book appointments with the right dental expert for your needs.",
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
    title: "Help & Support — FAQs, Documentation & Guides | Caberu",
    description: "Get help with Caberu dental practice management software. Find answers to common questions, tutorials, and comprehensive documentation.",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Is Caberu HIPAA compliant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Caberu is fully HIPAA compliant. We use industry-standard encryption, secure data storage, and follow all required healthcare data protection regulations."
          }
        },
        {
          "@type": "Question",
          name: "How does AI-powered scheduling work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Our AI analyzes patient needs, provider availability, and practice patterns to suggest optimal appointment times. It also helps with emergency triage and automated booking confirmations."
          }
        },
        {
          "@type": "Question",
          name: "Can I import my existing patient data?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, Caberu supports importing patient data from CSV files and integrates with many popular dental practice management systems for seamless data migration."
          }
        },
        {
          "@type": "Question",
          name: "What kind of support do you offer?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We offer email support, comprehensive documentation, video tutorials, and live chat support for premium plans. Our team is dedicated to helping your practice succeed."
          }
        },
        {
          "@type": "Question",
          name: "Is there a free trial?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, we offer a free plan that includes basic features. You can upgrade to paid plans anytime to access advanced features like multi-provider support and advanced analytics."
          }
        }
      ]
    }
  },
  "/login": {
    title: "Login — Access Your Dental Practice Dashboard | Caberu",
    description: "Sign in to your Caberu account to manage appointments, patient records, billing, and more. Secure dental practice management portal.",
  },
  "/signup": {
    title: "Sign Up — Start Your Free Trial | Caberu",
    description: "Create your free Caberu account and start managing your dental practice today. No credit card required. HIPAA-compliant and secure.",
  },
  "/book-appointment": {
    title: "Book Appointment — AI-Powered Dental Booking | Caberu",
    description: "Book your dental appointment with AI-powered scheduling. Fast, secure, and convenient online booking for dental practices.",
  },
  "/privacy": {
    title: "Privacy Policy — HIPAA-Compliant Data Protection | Caberu",
    description: "Learn how Caberu protects your healthcare data with HIPAA-compliant security, encryption, and privacy policies. Your data security is our priority.",
  },
  "/terms": {
    title: "Terms of Service — Usage Agreement & Policies | Caberu",
    description: "Read the terms of service and usage policies for Caberu dental practice management software. Transparent and fair terms for healthcare providers.",
  },
  "/chat": {
    title: "AI Dental Assistant — Instant Chat Support & Triage | Caberu",
    description: "Chat with our AI dental assistant for instant answers, appointment booking, and emergency triage. 24/7 intelligent patient support.",
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

// Generate breadcrumb structured data
function generateBreadcrumbs(pathname: string) {
  const pathParts = pathname.split('/').filter(Boolean);
  if (pathParts.length === 0) return null;

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://caberu.be/"
      }
    ]
  };

  let currentPath = "";
  pathParts.forEach((part, index) => {
    currentPath += `/${part}`;
    const pageName = part
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    breadcrumbList.itemListElement.push({
      "@type": "ListItem",
      position: index + 2,
      name: pageName,
      item: `https://caberu.be${currentPath}`
    });
  });

  return breadcrumbList;
}

function addBreadcrumbSchema(pathname: string) {
  const breadcrumbs = generateBreadcrumbs(pathname);
  if (!breadcrumbs) return;

  // Remove previous breadcrumb schema
  const existing = document.querySelectorAll("script[data-breadcrumb-jsonld='true']");
  existing.forEach((n) => n.parentElement?.removeChild(n));

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.setAttribute("data-breadcrumb-jsonld", "true");
  script.text = JSON.stringify(breadcrumbs);
  document.head.appendChild(script);
}

export function applySEO(pathname: string) {
  const basis = seoMap[pathname] || {
    title: "Caberu — Complete Dental Practice Management",
    description: "AI-powered dental practice management platform for modern dental professionals.",
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
  upsertMetaTag("og:url", `${base}${pathname}`);
  upsertMetaTag("twitter:title", basis.title);
  upsertMetaTag("twitter:description", basis.description);

  // Structured data if provided
  setJsonLd(basis.structuredData);

  // Add breadcrumb schema for all non-homepage pages
  if (pathname !== "/") {
    addBreadcrumbSchema(pathname);
  }
}

export const SeoManager = () => {
  const location = useLocation();
  useEffect(() => {
    applySEO(location.pathname);
  }, [location.pathname]);
  return null;
};
