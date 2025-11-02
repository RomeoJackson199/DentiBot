import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hairdresser-hero.jpg";
import mensHaircut from "@/assets/mens-haircut.jpg";
import womensHaircut from "@/assets/womens-haircut.jpg";
import hairColoring from "@/assets/hair-coloring.jpg";

export async function setupMPHomepage() {
  const businessId = "f7349d05-cbfb-4a02-9cd3-b261ed48b163";

  // 1. Set up homepage settings
  const { error: homepageError } = await supabase
    .from("homepage_settings")
    .upsert({
      business_id: businessId,
      hero_title: "Transform Your Look at MP",
      hero_subtitle: "Expert hairstyling and modern cuts for every style",
      hero_image_url: heroImage,
      show_services: true,
      show_about: true,
      about_title: "Why Choose MP?",
      about_content: `At MP, we believe that great hair is the best accessory. Our talented team of stylists stays ahead of the latest trends while honoring timeless classics. Whether you're looking for a bold transformation or a subtle refresh, we're here to bring your vision to life.

With years of experience and a passion for perfection, we create personalized looks that complement your unique features and lifestyle. From precision cuts to stunning color treatments, every service is delivered with care and expertise.

Visit us and discover why MP is the trusted choice for discerning clients who demand excellence.`,
      cta_text: "Book Your Appointment",
      is_active: true,
    });

  if (homepageError) {
    console.error("Error setting up homepage:", homepageError);
    return { success: false, error: homepageError };
  }

  // 2. Update services with images
  const services = [
    {
      id: "6eb42087-cbb7-4cbd-ba10-e055b655d5f9",
      image_url: mensHaircut,
      description: "Professional men's cuts including fades, tapers, and modern styles"
    },
    {
      id: "ee45c00d-7bba-427b-ac6d-cab3e470d4bc",
      image_url: womensHaircut,
      description: "Expert women's cuts, layers, and styling for all hair types"
    },
    {
      id: "19e3748d-4df3-44a3-b79b-77e1c45b655d",
      image_url: hairColoring,
      description: "Complete color transformation with premium products and techniques"
    },
    {
      id: "8592830c-4132-4e13-ab05-e6fd87def75c",
      image_url: hairColoring,
      description: "Balayage, highlights, and custom color treatments"
    }
  ];

  for (const service of services) {
    const { error } = await supabase
      .from("business_services")
      .update({
        image_url: service.image_url,
        description: service.description,
      })
      .eq("id", service.id);

    if (error) {
      console.error(`Error updating service ${service.id}:`, error);
    }
  }

  return { success: true };
}
