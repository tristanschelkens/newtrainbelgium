station({
  slug: "leuven",
  name: "Leuven",
  country: "Belgium",
  coords: [50.8814, 4.7162],
  folder: "../images/Belgium/Leuven/",
  description: "Rail photography in Leuven.",

  photos: [
        {
      id: "photo-0",
      operator: "TGV INOUI",
      date: "1 April 2026",
      photographer: "trainbelgium",
      alt: "TGV M 1402",
      numbers: "1402",
      consist: [traction("TGV M 1402")],
      images: ["Leuven_TGV1402.webp", "Leuven_TGV1402_2.webp", "Leuven_TGV1402_3.webp", "Leuven_TGV1402_4.webp", "Leuven_TGV1402_5.webp", "Leuven_TGV1402_6.webp", "Leuven_TGV1402_7.webp"],
    },
    {
      id: "photo-1",
      operator: "NMBS/SNCB",
      date: "9 April 2025",
      photographer: "trainbelgium",
      alt: "Leuven HLE 1913 + 6x M7 ",
      numbers: "1913",
      consist: [traction("HLE19 13"), traction("6x M7", false)],
      images: ["Leuven_HLE1913M7.webp"],
    }
  ],
});
