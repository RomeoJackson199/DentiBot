import { supabase } from "@/integrations/supabase/client";

export async function setupArtBarberServices() {
  // Get the business ID for artbarber or art-barber
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .or("slug.eq.artbarber,slug.eq.art-barber")
    .single();

  if (businessError || !business) {
    console.error("Business not found:", businessError);
    return { success: false, error: "Business not found. Please create the business first." };
  }

  const businessId = business.id;

  const services = [
    // Haircuts
    {
      name: "Classic Cut",
      description: "Traditional scissor cut with styling",
      duration_minutes: 30,
      price_cents: 3000,
      category: "Haircuts",
      currency: "EUR",
    },
    {
      name: "Fade Cut",
      description: "Modern fade with scissor work on top",
      duration_minutes: 45,
      price_cents: 3500,
      category: "Haircuts",
      currency: "EUR",
    },
    {
      name: "Skin Fade",
      description: "Ultra-clean skin fade with precision detailing",
      duration_minutes: 60,
      price_cents: 4000,
      category: "Haircuts",
      currency: "EUR",
    },
    {
      name: "Buzz Cut",
      description: "Clean all-over clipper cut",
      duration_minutes: 20,
      price_cents: 2000,
      category: "Haircuts",
      currency: "EUR",
    },
    {
      name: "Kids Cut (Under 12)",
      description: "Haircut for children under 12 years",
      duration_minutes: 30,
      price_cents: 2500,
      category: "Haircuts",
      currency: "EUR",
    },
    // Beard Services
    {
      name: "Beard Trim",
      description: "Shape and trim with hot towel finish",
      duration_minutes: 20,
      price_cents: 1500,
      category: "Beard",
      currency: "EUR",
    },
    {
      name: "Beard Sculpting",
      description: "Detailed beard design and shaping",
      duration_minutes: 30,
      price_cents: 2000,
      category: "Beard",
      currency: "EUR",
    },
    {
      name: "Hot Towel Shave",
      description: "Traditional straight razor shave with hot towels",
      duration_minutes: 40,
      price_cents: 3500,
      category: "Beard",
      currency: "EUR",
    },
    // Combo Packages
    {
      name: "Cut & Beard",
      description: "Haircut plus beard trim and styling",
      duration_minutes: 50,
      price_cents: 4500,
      category: "Packages",
      currency: "EUR",
    },
    {
      name: "Deluxe Package",
      description: "Cut, beard trim, hot towel shave, and facial massage",
      duration_minutes: 90,
      price_cents: 6500,
      category: "Packages",
      currency: "EUR",
    },
    {
      name: "The Works",
      description: "Full grooming experience: cut, shave, beard, facial, and head massage",
      duration_minutes: 120,
      price_cents: 8500,
      category: "Packages",
      currency: "EUR",
    },
    // Grooming
    {
      name: "Eyebrow Trim",
      description: "Clean up and shape eyebrows",
      duration_minutes: 10,
      price_cents: 800,
      category: "Grooming",
      currency: "EUR",
    },
    {
      name: "Nose & Ear Wax",
      description: "Professional waxing service",
      duration_minutes: 15,
      price_cents: 1200,
      category: "Grooming",
      currency: "EUR",
    },
    {
      name: "Grey Blending",
      description: "Natural-looking grey coverage",
      duration_minutes: 45,
      price_cents: 4000,
      category: "Grooming",
      currency: "EUR",
    },
  ];

  const servicesToInsert = services.map(service => ({
    ...service,
    business_id: businessId,
    is_active: true,
  }));

  const { error: servicesError } = await supabase
    .from("business_services")
    .insert(servicesToInsert);

  if (servicesError) {
    console.error("Error inserting services:", servicesError);
    return { success: false, error: servicesError };
  }

  console.log("✅ Art Barber services created successfully!");
  return { success: true };
}
