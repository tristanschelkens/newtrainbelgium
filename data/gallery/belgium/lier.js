station({
  slug: "lier",
  name: "Lier",
  country: "Belgium",
  coords: [51.1358, 4.5592],
  folder: "../images/Belgium/Lier/",
  description: "Rail photography in Lier.",

  photos: [
    {
      id: "photo-0",
      operator: "NMBS/SNCB",
      alt: "Lier 8x M6 + HLE 18/19",
      consist: [carriage("8x M6", true), traction("HLE18 42")],
      images: ["Lier_M6HLE1819.webp"],
    },
    {
      id: "photo-1",
      operator: "NMBS/SNCB",
      date: "27 May 2024",
      alt: "Lier MW4124 + MW41 + MW41 + MW41",
      numbers: "4124",
      consist: [traction("AR41 24"), traction("AR41 36"), traction("AR41 76"), traction("AR41 27")],
      images: ["Lier_MW4124MW41MW41MW41.webp"],
    }
  ],
});
