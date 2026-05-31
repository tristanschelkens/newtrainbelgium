station({
  slug: "hasselt",
  name: "Hasselt",
  country: "Belgium",
  coords: [50.9305, 5.3278],
  folder: "../images/Belgium/Hasselt/",
  description: "Rail photography in Hasselt.",

  photos: [
    {
      id: "photo-0",
      operator: "NMBS/SNCB",
      date: "8 March 2026",
      photographer: "trainbelgium",
      alt: "Hasselt HLE 1914 HLE 1853 + I10 + 8x M7 + HLE 1814",
      numbers: "1914, 1853, 12759, 72149, 72049, 73011, 79020, 1814",
      consist: [traction("HLE19 14"), traction("HLE18 53", false), carriage("I10"), carriage("8x M7"), traction("HLE18 14")],
      images: ["IMG_4814.webp"],
    }
  ],
});
