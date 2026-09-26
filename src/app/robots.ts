import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** Les espaces privés (comptes, administration, panier) ne doivent pas être indexés. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/acces-equipe", "/reinitialiser", "/vendeur", "/livreur", "/compte", "/messages", "/notifications", "/panier", "/commande", "/api/"],
      },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
