station({
  slug: "luxembourg",
  name: "Luxembourg",
  country: "Luxembourg",
  coords: [49.6, 6.1347],
  folder: "../images/Luxembourg/Luxembourg/",
  description: "Rail photography in Luxembourg.",

  photos: [
     {
      id: "photo-0",
      operator: "CFL",
      date: "13 May 2026",
      photographer: "trainbelgium",
      alt: "Coradia Max 2419",
      numbers: "2419",
      consist: [traction("Coradia Max 2419")],
      images: ["Luxembourg_CoradiaMax2419.webp"],
    },
    {
      id: "photo-1",
      operator: "CFL",
      date: "4 July 2025",
      photographer: "trainbelgium",
      alt: "Luxembourg TRAXX 4018 + 5x Twindexx Vario",
      numbers: "4018",
      consist: [carriage("5x Twindexx Vario"), traction("TRAXX 4018")],
      images: ["Luxembourg_TRAXX40185xTwindexxVario.webp"],
    }
  ],
});
