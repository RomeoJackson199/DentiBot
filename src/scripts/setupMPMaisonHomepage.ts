import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/mp-salon-interior-1.png";
import interior2 from "@/assets/mp-salon-interior-2.png";
import interior3 from "@/assets/mp-salon-interior-3.png";
import logo from "@/assets/mp-logo.png";

export async function setupMPMaisonHomepage() {
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

  // Update business with logo
  const { error: logoError } = await supabase
    .from("businesses")
    .update({
      logo_url: logo,
      primary_color: "#C8A882", // Gold/beige from logo
      secondary_color: "#000000", // Black from logo
      tagline: "Salon de coiffure et institut de beauté",
    })
    .eq("id", businessId);

  if (logoError) {
    console.error("Error updating business logo:", logoError);
  }

  // Set up homepage settings
  const { error: homepageError } = await supabase
    .from("homepage_settings")
    .upsert({
      business_id: businessId,
      hero_title: "Maison Mp - Élégance & Bien-être",
      hero_subtitle: "Salon de coiffure et institut de beauté à Tervuren",
      hero_image_url: heroImage,
      show_services: true,
      show_about: true,
      about_title: "Bienvenue à la Maison Mp",
      about_content: `À Tervuren, au sud de Bruxelles, la Maison Mp coiffe et prend soin de la beauté des femmes et des hommes. Le salon de coiffure est aussi un institut de beauté et propose, en plus de couper les cheveux et de les colorer, des prestations esthétiques pour sublimer votre visage et votre corps.

La professionnelle Mauranne vous accueille dans un cadre élégant et intime, où on a tout de suite envie de s'installer pour un moment de bien-être. Ancienne cheminée en marbre, fauteuils au look vintage, végétation parsemée en peu partout, l'endroit offre une expérience originale et tentante.

Brushing, coupe, coloration, mais aussi beauté du regard, des mains et du visage, épilation à la cire, la carte est vaste et vous offre un grand choix. Mauranne a un savoir-faire étendu et il faut avouer que c'est pratique de pouvoir prendre rendez-vous à la fois pour une manucure et un balayage.

Et si vous avez envie de redonner beaucoup d'éclat à votre visage grâce à un soin innovant, c'est aussi possible dans la Maison Mp à Tervuren. Une adresse à tester sans plus tarder. ;)`,
      cta_text: "Réserver en ligne",
      is_active: true,
    });

  if (homepageError) {
    console.error("Error setting up homepage:", homepageError);
    return { success: false, error: homepageError };
  }

  console.log("✅ Homepage settings created successfully!");
  return { success: true };
}
