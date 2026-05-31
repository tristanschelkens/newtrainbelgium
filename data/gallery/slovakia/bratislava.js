station({
  slug: "bratislava",
  name: "Bratislava",
  country: "Slovakia",
  coords: [48.1590, 17.1063],
  folder: "../images/Slovakia/Bratislava/",
  description: "Rail photography in Bratislava.",

  photos: [
    {
      id: "photo-0",
      operator: "ZSSK",
      date: "23 March 2026",
      photographer: "trainbelgium",
      alt: "Bratislava ZSSK 263 003-6",
      numbers: "263 003-6",
      consist: [traction("Škoda 263 003-6", { active: true, filterKey: "skoda-263", filterLabel: "Škoda 263" }), carriage("4x DoSto")],
      images: [mainImage("Bratislava_ZSSK_263003.jpeg"), image("Bratislava_ZSSK_263003_Side.jpeg", { alt: "Bratislava ZSSK 263 003-6 side view" }), image("Bratislava_ZSSK_263003_Wide.jpeg", { alt: "Bratislava ZSSK 263 003-6 wide view" })],
    }
  ],
});