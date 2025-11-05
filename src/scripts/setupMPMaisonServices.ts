import { supabase } from "@/integrations/supabase/client";

export async function setupMPMaisonServices() {
  // First, get the business ID for mp_maison or mp-maison
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .or("slug.eq.mp_maison,slug.eq.mp-maison")
    .single();

  if (businessError || !business) {
    console.error("Business not found:", businessError);
    return { success: false, error: "Business not found. Please create the business first." };
  }

  const businessId = business.id;

  // Define all services
  const services = [
    // Hair treatments - IN DE KIJKER section
    {
      name: "K18 treatment met brushing",
      description: "",
      duration_minutes: 60,
      price_cents: 5500, // à partir de 55 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Kleuren knippen brushen",
      description: "Inclusief shampoo, verzorging, mousse, lak en serum",
      duration_minutes: 160,
      price_cents: 11500, // 115 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Balayage, gloss, brushing",
      description: "",
      duration_minutes: 200,
      price_cents: 14000, // à partir de 140 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Mechen gloss knippen brushen",
      description: "",
      duration_minutes: 220,
      price_cents: 19000, // à partir de 190 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Knippen + brushing",
      description: "",
      duration_minutes: 60,
      price_cents: 6500, // 65 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Brushing",
      description: "",
      duration_minutes: 30,
      price_cents: 3000, // 30 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Brushing lang",
      description: "",
      duration_minutes: 40,
      price_cents: 4000, // 40 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Knippen en drogen",
      description: "",
      duration_minutes: 45,
      price_cents: 4500, // 45 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Droog knippen",
      description: "Enkel op proper haar",
      duration_minutes: 30,
      price_cents: 3300, // 33 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Knippen kleuren en brushen",
      description: "",
      duration_minutes: 130,
      price_cents: 11500, // à partir de 115 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Kleuren",
      description: "",
      duration_minutes: 80,
      price_cents: 5000, // 50 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Highlights half hoofd",
      description: "",
      duration_minutes: 60,
      price_cents: 6500, // à partir de 65 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Highlights volledig hoofd",
      description: "",
      duration_minutes: 120,
      price_cents: 10000, // à partir de 100 €
      category: "Coiffure",
      is_active: true,
    },
    {
      name: "Balayage",
      description: "Freehand technique zonder folie",
      duration_minutes: 120,
      price_cents: 8000, // à partir de 80 €
      category: "Coiffure",
      is_active: true,
    },
    // Facial treatments
    {
      name: "Basis zonder massage",
      description: "",
      duration_minutes: 45,
      price_cents: 4500, // 45 €
      category: "Soins du visage",
      is_active: true,
    },
    {
      name: "Purifying treatment",
      description: "",
      duration_minutes: 55,
      price_cents: 6000, // 60 €
      category: "Soins du visage",
      is_active: true,
    },
    {
      name: "Soin apaisant camomille",
      description: "",
      duration_minutes: 60,
      price_cents: 7000, // 70 €
      category: "Soins du visage",
      is_active: true,
    },
    {
      name: "GLOW treatment",
      description: "",
      duration_minutes: 60,
      price_cents: 7500, // 75 €
      category: "Soins du visage",
      is_active: true,
    },
    // Waxing
    {
      name: "Épilation jambes demi",
      description: "",
      duration_minutes: 30,
      price_cents: 2500, // 25 €
      category: "Épilation",
      is_active: true,
    },
    {
      name: "Épilation jambes complètes",
      description: "",
      duration_minutes: 40,
      price_cents: 4200, // 42 €
      category: "Épilation",
      is_active: true,
    },
    {
      name: "Épilation bikini",
      description: "",
      duration_minutes: 30,
      price_cents: 2000, // 20 €
      category: "Épilation",
      is_active: true,
    },
    {
      name: "Épilation oksels",
      description: "",
      duration_minutes: 30,
      price_cents: 1500, // 15 €
      category: "Épilation",
      is_active: true,
    },
    // Eyebrow/eyelash treatments
    {
      name: "Tint wenkbrauwen",
      description: "Reflectocil",
      duration_minutes: 35,
      price_cents: 2000, // 20 €
      category: "Beauté du regard",
      is_active: true,
    },
    {
      name: "Tint wimpers",
      description: "Reflectocil",
      duration_minutes: 35,
      price_cents: 2000, // 20 €
      category: "Beauté du regard",
      is_active: true,
    },
    {
      name: "Tint wenkbrauwen + wimpers",
      description: "Reflectocil",
      duration_minutes: 40,
      price_cents: 3600, // 36 €
      category: "Beauté du regard",
      is_active: true,
    },
  ];

  // Insert all services
  const { error: servicesError } = await supabase
    .from("business_services")
    .insert(
      services.map(service => ({
        ...service,
        business_id: businessId,
      }))
    );

  if (servicesError) {
    console.error("Error inserting services:", servicesError);
    return { success: false, error: servicesError };
  }

  console.log("✅ Services created successfully!");
  return { success: true };
}
