import { supabase } from "@/integrations/supabase/client";

export async function setupArtBarberHomepage() {
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

  // Update business with branding
  const { error: brandingError } = await supabase
    .from("businesses")
    .update({
      primary_color: "#1a1a1a", // Dark gray/black
      secondary_color: "#d4af37", // Gold accent
      tagline: "Premium Barbering & Grooming",
    })
    .eq("id", businessId);

  if (brandingError) {
    console.error("Error updating business branding:", brandingError);
  }

  // Set up homepage settings
  const { error: homepageError } = await supabase
    .from("homepage_settings")
    .upsert({
      business_id: businessId,
      hero_title: "Art Barber - Premium Cuts & Grooming",
      hero_subtitle: "Expert barbering for the modern gentleman",
      show_services: true,
      show_about: true,
      about_title: "About Art Barber",
      about_content: `At Art Barber, we combine traditional barbering techniques with modern style to deliver the perfect cut every time. Our experienced barbers are dedicated to providing premium grooming services in a relaxed, professional environment.

Whether you're looking for a classic cut, modern fade, or a complete grooming experience, we've got you covered. We use only the finest products and take pride in our attention to detail.

Walk-ins welcome, or book your appointment online for guaranteed service at your preferred time.`,
      cta_text: "Book Now",
      is_active: true,
    });

  if (homepageError) {
    console.error("Error setting up homepage:", homepageError);
    return { success: false, error: homepageError };
  }

  console.log("✅ Art Barber homepage settings created successfully!");
  return { success: true };
}
