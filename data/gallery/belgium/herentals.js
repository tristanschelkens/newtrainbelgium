station({
  slug: "herentals",
  name: "Herentals",
  country: "Belgium",
  coords: [51.1807, 4.8275],
  folder: "../images/Belgium/Herentals/",
  description: "Rail photography in Herentals.",

  photos: [
    {
      id: "photo-0",
      photographer: "Leon Van de Sande",
      operator: "NMBS/SNCB",
      alt: "Herentals HLE 1701 + 4x I11",
      numbers: "1701",
      consist: [traction("HLE17 01"), carriage("4x I11", true)],
      images: ["Herentals_HLE1701I11.webp"],
    },
            {
      id: "photo-1",
      photographer: "Leon Van de Sande",
      operator: "NMBS/SNCB",
      alt: "Herentals 10x M7",
      numbers: "76010",
      consist: [traction("M7")],
      images: ["Herentals_M7.webp","Herentals_M7_2.webp"],
    },
        {
      id: "photo-2",
      operator: "NMBS/SNCB",
      alt: "Herentals HLE 1902 + 8x M6",
      numbers: "1902",
      consist: [traction("HLE19 02"), carriage("8x M6", true)],
      images: ["Herentals_HLE1902M6.webp"],
    },
       {
      id: "photo-3",
      operator: "Infrabel",
      alt: "Herentals HLD 6207 + HLD 6291",
      numbers: "6207, 6291",
      consist: [traction("HLD62 07"), traction("HLD62 91")],
      images: ["Herentals_HLD6207HLD6291.webp"],
    }
  ],
});