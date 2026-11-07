import { products } from "@/data/products";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";

/** JSON-LD structured data for Google rich results. */
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/icon.png`,
        slogan: "Bigger Crunch. Better Fun.",
        description: SITE_DESCRIPTION,
        email: "hello@yumso.ca",
        address: { "@type": "PostalAddress", addressCountry: "CA" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: `+${WHATSAPP_NUMBER}`,
          areaServed: "CA",
          availableLanguage: ["English"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-CA",
      },
      {
        "@type": "ItemList",
        name: "YUMSO Snacks",
        itemListElement: products.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Product",
            name: `YUMSO ${p.name} - ${p.flavor}`,
            image: `${SITE_URL}${p.image}`,
            description: p.description,
            brand: { "@type": "Brand", name: SITE_NAME },
            countryOfOrigin: "CA",
            weight: p.weight,
            url: `${SITE_URL}/#products`,
          },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
