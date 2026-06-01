station({
  slug: "aachen",
  name: "Aachen",
  country: "Germany",
  coords: [50.7678, 6.0915],
  folder: "../images/Germany/Aachen/",
  description: "Rail photography in Aachen.",

  photos: [
    {
      id: "photo-0",
      operator: "DB",
      date: "16 February 2024",
      photographer: "trainbelgium",
      alt: "Aachen 5x DoSto + BR 146 005",
      numbers: "146 005",
      leadTraction: "BR 146 005",
      leadMaterial: "BR 146 005",
      consist: [carriage("5x DoSto", true), { kind: "traction", label: "BR 146 005", lead: true }],
      images: ["Aachen_DoStoBR146005.webp"],
    }
  ],
});
