function toggleMenu() {
  const nav = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");
  if (!nav) return;

  const willOpen = !nav.classList.contains("active");
  nav.classList.toggle("active", willOpen);
  nav.setAttribute("aria-hidden", willOpen ? "false" : "true");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", willOpen ? "true" : "false");
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;

  const nav = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");
  if (!nav || !nav.classList.contains("active")) return;

  nav.classList.remove("active");
  nav.setAttribute("aria-hidden", "true");
  if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
});

document.addEventListener("click", (e) => {
  const nav = document.getElementById("navLinks");
  const menuBtn = document.getElementById("menuBtn");
  if (!nav) return;

  if (e.target.closest("#navLinks a")) {
    nav.classList.remove("active");
    nav.setAttribute("aria-hidden", "true");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    return;
  }

  if (
    nav.classList.contains("active") &&
    !e.target.closest("#navLinks") &&
    !e.target.closest(".menu-btn")
  ) {
    nav.classList.remove("active");
    nav.setAttribute("aria-hidden", "true");
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
  }
});
function handleNavbarScroll() {
  const navbar = document.getElementById("siteNavbar");
  if (!navbar) return;

  const hasHero = !!document.querySelector(".hero");

  if (!hasHero || window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
}

window.addEventListener("scroll", handleNavbarScroll);

function setActiveNavLink() {
  const links = document.querySelectorAll(".nav-links a");
  const rawPage =
    window.location.pathname.split("/").pop().toLowerCase() || "home.html";
  const photoDetailPages = new Set(["station.html"]);
  const currentPage = photoDetailPages.has(rawPage) ? "photos.html" : rawPage;

  if (!links.length) return;

  links.forEach((link) => {
    const linkPage = (link.getAttribute("href") || "").toLowerCase();

    if (linkPage === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

(function initPhotoFilters() {
  const filters = document.getElementById("photoFilters");
  const grid = document.getElementById("photoGrid");

  if (!filters || !grid) return;

  const buttons = Array.from(filters.querySelectorAll(".filter-btn"));
  const cards = Array.from(grid.querySelectorAll(".photo-card"));
  const noResults = document.getElementById("noResults");
  const availableFilters = new Set(
    buttons.map((btn) => (btn.dataset.filter || "").toLowerCase()),
  );

  function setActiveButton(value) {
    buttons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "").toLowerCase() === value;
      btn.classList.toggle("active", isActive);
    });
  }

  function applyFilter(value) {
    let visibleCount = 0;

    cards.forEach((card) => {
      const country = (card.dataset.country || "").toLowerCase();
      const show = value === "all" || country === value;

      card.classList.toggle("is-hidden", !show);

      if (show) visibleCount++;
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }

    grid.classList.toggle("has-few", visibleCount <= 2);
  }

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = (btn.dataset.filter || "all").toLowerCase();
      setActiveButton(value);
      applyFilter(value);
    });
  });

  const queryFilter = (
    new URLSearchParams(window.location.search).get("filter") || "all"
  ).toLowerCase();
  const initialFilter = availableFilters.has(queryFilter) ? queryFilter : "all";

  setActiveButton(initialFilter);
  applyFilter(initialFilter);
})();

(function initPhotoMap() {
  const mapEl = document.getElementById("stationsMap");
  const grid = document.getElementById("photoGrid");

  if (!mapEl || !grid || typeof window.L === "undefined") return;

  const stationCoords = {
    antwerp: [51.2172, 4.4211],
    "brussels-midi": [50.8356, 4.3366],
    duffel: [51.0959, 4.5167],
    leuven: [50.8817, 4.7154],
    liege: [50.6246, 5.5662],
    lier: [51.1321, 4.5706],
    luchtbal: [51.2474, 4.4292],
    mechelen: [51.0179, 4.4816],
    schaerbeek: [50.8686, 4.3782],
    paris: [48.8443, 2.3744],
    aachen: [50.7678, 6.0915],
    dusseldorf: [51.2194, 6.7945],
    luxembourg: [49.6000, 6.1347],
    roosendaal: [51.5402, 4.4622],
    london: [51.5308, -0.1238],
  };

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const cards = Array.from(grid.querySelectorAll(".photo-card"));
  const stations = cards
    .map((card) => {
      const href = card.getAttribute("href") || "";
      const slug = new URLSearchParams(href.split("?")[1] || "").get("slug");
      const coords = slug ? stationCoords[slug] : null;
      const img = card.querySelector("img");
      const title = card.querySelector(".overlay h3")?.textContent?.trim() || img?.alt || slug;

      if (!slug || !coords || !img) return null;

      return {
        slug,
        coords,
        title,
        image: img.getAttribute("src") || "",
        href,
      };
    })
    .filter(Boolean);

  if (stations.length === 0) return;

  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    zoomControl: true,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const bounds = L.latLngBounds([]);
  const stationIcon = L.divIcon({
    className: "map-pin-icon",
    html: '<span class="map-pin-dot"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });

  stations.forEach((station) => {
    const marker = L.marker(station.coords, { icon: stationIcon }).addTo(map);

    const popupHtml = `
      <div class="map-popup">
        <a class="map-popup-image-link" href="${esc(station.href)}">
          <img src="${esc(station.image)}" alt="${esc(station.title)}" />
        </a>
        <div class="map-popup-footer">
          <a class="map-popup-title" href="${esc(station.href)}">${esc(station.title)}</a>
          <a class="map-popup-link" href="${esc(station.href)}">Open station</a>
        </div>
      </div>
    `;

    marker.bindPopup(popupHtml, { closeButton: true, offset: [0, -4] });
    marker.on("click", () => marker.openPopup());

    bounds.extend(station.coords);
  });

  if (stations.length === 1) {
    map.setView(stations[0].coords, 11);
  } else {
    map.fitBounds(bounds.pad(0.2));
  }

  window.addEventListener("resize", () => {
    map.invalidateSize();
  });
})();
(function initStationPage() {
  const grid = document.getElementById("stationGrid");
  if (!grid) return;

  const title = document.getElementById("stationTitle");
  const subtitle = document.getElementById("stationSubtitle");
  const notFound = document.getElementById("stationNotFound");
  const vehicleFilters = document.getElementById("stationVehicleFilters");

  const allStations = window.STATIONS_DATA || {};
  const slug = (new URLSearchParams(window.location.search).get("slug") || "")
    .trim()
    .toLowerCase();

  const station = allStations[slug];

  if (
    !station ||
    !Array.isArray(station.photos) ||
    station.photos.length === 0
  ) {
    if (title) title.textContent = "Station not found";
    if (subtitle)
      subtitle.textContent = "No station data available for this link.";
    if (notFound) notFound.style.display = "block";
    return;
  }

  if (title) title.textContent = station.name;
  if (subtitle) {
    const description = station.description ? ` - ${station.description}` : "";
    subtitle.textContent = `${station.country}${description}`;
  }

  document.title = `${station.name} - trainbelgium.com`;

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeVehicleType(type, number) {
    const rawType = String(type || "").trim();
    const rawNumber = String(number || "").trim();
    const lowerType = rawType.toLowerCase();
    const normalizedType = lowerType.replace(/\s+/g, " ").trim();
    const compactType = normalizedType.replace(/\s+/g, "");
    const compactNumber = rawNumber.toLowerCase().replace(/\s+/g, "");

    if (!rawType || normalizedType === "unknown") return "";

    if (normalizedType.startsWith("hle") || compactType.startsWith("hle")) {
      if (compactNumber.startsWith("13") || compactType === "hle13") return "hle13";
      if (compactNumber.startsWith("21") || compactType === "hle21") return "hle21";
      if (compactNumber.startsWith("27") || compactType === "hle27") return "hle27";
      if (compactNumber.startsWith("28") || compactType === "hle28") return "hle28";

      if (compactNumber.startsWith("18") || compactNumber.startsWith("19")) {
        return "hle18-19";
      }

      if (
        compactType === "hle18" ||
        compactType === "hle19" ||
        compactType === "hle18/19" ||
        compactType === "hle18-19"
      ) {
        return "hle18-19";
      }

      return "hle";
    }

    return normalizedType;
  }

  function normalizeCarriageType(label) {
    const normalized = String(label || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!normalized) return "";

    const withoutCount = normalized.replace(/^\d+\s*[x×]\s*/i, "");
    const parts = withoutCount.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";

    // Keep Stadler KISS together as one filter label.
    if (parts[0] === "stadler" && parts[1]) {
      return `stadler ${parts[1]}`;
    }

    return parts[0];
  }
  function getVehicleFilterLabel(key) {
    if (key === "hle18-19") return "HLE 18/19";
    if (key === "hle13") return "HLE 13";
    if (key === "hle21") return "HLE 21";
    if (key === "hle27") return "HLE 27";
    if (key === "hle28") return "HLE 28";
    if (key === "hle") return "HLE";
    return key.toUpperCase();
  }

  function buildConsistFromLegacy(photo) {
    const consist = [];
    const vehicleType = String(photo.vehicleType || "").trim();
    const vehicleNumber = String(photo.vehicleNumber || "").trim();

    if (vehicleType && vehicleType.toLowerCase() !== "unknown") {
      consist.push({
        kind: "traction",
        label: `${vehicleType}${vehicleNumber ? ` ${vehicleNumber}` : ""}`,
        vehicleType,
        vehicleNumber,
        active: true,
      });
    }

    const legacyCarriages = Array.isArray(photo.carriages)
      ? photo.carriages
      : typeof photo.carriages === "string"
        ? photo.carriages.split(",")
        : [];

    legacyCarriages
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .forEach((item) => {
        consist.push({ kind: "carriage", label: item });
      });

    return consist;
  }

  function normalizeConsist(photo) {
    const source =
      Array.isArray(photo.consist) && photo.consist.length > 0
        ? photo.consist
        : buildConsistFromLegacy(photo);

    return source
      .map((entry) => {
        const kind = String(entry.kind || "carriage").toLowerCase();
        const label = String(entry.label || "").trim();
        if (!label) return null;

        const explicitType = String(entry.vehicleType || "").trim();
        const explicitNumber = String(entry.vehicleNumber || "").trim();

        let inferredType = explicitType;
        let inferredNumber = explicitNumber;

        if (!inferredType && kind === "traction") {
          const parts = label.split(/\s+/).filter(Boolean);
          const first = parts[0] || "";
          const firstLower = first.toLowerCase();

          if (firstLower === "hle") {
            inferredType = "HLE";
            inferredNumber = parts[1] || "";
          } else if (/^am\d+/i.test(first)) {
            inferredType = first;
            inferredNumber = parts[1] || "";
          } else if (firstLower === "class" && parts[1]) {
            inferredType = `Class ${parts[1]}`;
            inferredNumber = parts[2] || "";
          } else if (firstLower === "tgv" && parts[1] && /^[a-z]+$/i.test(parts[1])) {
            inferredType = `TGV ${parts[1]}`;
            inferredNumber = parts[2] || "";
          } else {
            inferredType = first;
            inferredNumber = parts[1] || "";
          }
        }

        return {
          kind,
          label,
          active: kind === "traction" ? entry.active !== false : false,
          filterKey:
            kind === "traction"
              ? normalizeVehicleType(inferredType, inferredNumber)
              : kind === "carriage" && entry.active === true
                ? normalizeCarriageType(label)
                : "",
        };
      })
      .filter(Boolean);
  }

  const photos = station.photos.map((photo) => {
    const consist = normalizeConsist(photo);

    return {
      src: photo.src || "",
      alt: photo.alt || station.name,
      label: photo.label || station.name,
      consist,
      filterKeys: Array.from(
        new Set(consist.map((item) => item.filterKey).filter(Boolean)),
      ),
    };
  });

  const cardsHtml = photos
    .map((photo) => {
      function formatTagLabel(label) {
        return String(label || "").replace(/(\d+)\s*x\s*/gi, "$1× ");
      }

      const chips = photo.consist
        .map((item, index) => {
          const cls =
            item.kind === "traction"
              ? item.active
                ? "station-meta-chip"
                : "station-meta-inactive"
              : "station-meta-carriage";

          const plus =
            index < photo.consist.length - 1
              ? '<span class="station-meta-plus">+</span>'
              : "";

          return `<span class="${cls}">${esc(formatTagLabel(item.label))}</span>${plus}`;
        })
        .join("");

      return `
        <div class="photo-card station-photo-card" data-vehicle-types="${esc(photo.filterKeys.join("|"))}">
          <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
          ${chips ? `<div class="station-meta">${chips}</div>` : ""}
        </div>
      `;
    })
    .join("");

  grid.innerHTML = cardsHtml;

  const cards = Array.from(grid.querySelectorAll(".station-photo-card"));

  function applyVehicleFilter(value) {
    let visibleCount = 0;

    cards.forEach((card) => {
      const keys = (card.dataset.vehicleTypes || "")
        .split("|")
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean);

      const show = value === "all" || keys.includes(value);
      card.classList.toggle("is-hidden", !show);
      if (show) visibleCount++;
    });

    grid.classList.toggle("has-few", visibleCount <= 2);
  }

  const uniqueVehicleTypes = Array.from(
    new Set(photos.flatMap((photo) => photo.filterKeys).filter(Boolean)),
  );

  if (vehicleFilters && uniqueVehicleTypes.length > 1) {
    const filtersHtml = [
      '<button class="filter-btn active" type="button" data-vehicle-filter="all">All</button>',
      ...uniqueVehicleTypes
        .sort((a, b) => a.localeCompare(b))
        .map(
          (key) =>
            `<button class="filter-btn" type="button" data-vehicle-filter="${esc(key)}">${esc(getVehicleFilterLabel(key))}</button>`,
        ),
    ].join("");

    vehicleFilters.innerHTML = filtersHtml;
    vehicleFilters.style.display = "flex";

    const filterButtons = Array.from(
      vehicleFilters.querySelectorAll(".filter-btn"),
    );

    filterButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = (btn.dataset.vehicleFilter || "all").toLowerCase();

        filterButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyVehicleFilter(value);
      });
    });
  } else if (vehicleFilters) {
    vehicleFilters.innerHTML = "";
    vehicleFilters.style.display = "none";
  }

  applyVehicleFilter("all");

  const lightbox = document.createElement("div");
  lightbox.className = "station-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="station-lightbox-close" type="button" aria-label="Close image">&times;</button>
    <div class="station-lightbox-media">
      <img src="" alt="" />
      <div class="station-lightbox-meta" aria-hidden="true"></div>
      <div class="station-lightbox-watermark">&copy; trainbelgium.com</div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector(".station-lightbox-media img");
  const lightboxMeta = lightbox.querySelector(".station-lightbox-meta");
  const closeBtn = lightbox.querySelector(".station-lightbox-close");

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
  }

  function openLightbox(src, alt, metaHtml) {
    if (!lightboxImg) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt || station.name;

    if (lightboxMeta) {
      lightboxMeta.innerHTML = metaHtml || "";
      lightboxMeta.style.display = metaHtml ? "flex" : "none";
    }

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
  }

  Array.from(grid.querySelectorAll(".station-photo-card img")).forEach(
    (img) => {
      img.addEventListener("click", () => {
        const card = img.closest(".station-photo-card");
        const meta = card?.querySelector(".station-meta");
        openLightbox(img.src, img.alt, meta ? meta.innerHTML : "");
      });
    },
  );

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
})();
(function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  const submitBtn = form.querySelector('button[type="submit"]');
  const status = document.createElement("p");
  status.className = "muted";
  status.style.marginTop = "10px";
  status.style.fontSize = "13px";
  form.insertAdjacentElement("afterend", status);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";
    }

    status.style.color = "var(--muted)";
    status.textContent = "Sending your message...";

    try {
      const data = new FormData(form);
      const response = await fetch(
        "https://formsubmit.co/ajax/info@trainbelgium.com",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: data,
        },
      );

      const result = await response.json();
      if (
        !response.ok ||
        (result.success !== true && result.success !== "true")
      ) {
        throw new Error("Form submit failed");
      }

      status.style.color = "var(--nmbs-blue)";
      status.textContent = "Message sent successfully. Thank you!";
      form.reset();
    } catch (err) {
      console.error(err);
      status.style.color = "#c0392b";
      status.textContent = "Sending failed. Try again in a minute.";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send";
      }
    }
  });
})();

(function initImageProtection() {
  // This only raises the barrier against casual downloading.
  document.addEventListener("contextmenu", (e) => {
    if (e.target.closest("img, .photo-card, .station-lightbox")) {
      e.preventDefault();
    }
  });

  document.addEventListener("dragstart", (e) => {
    if (e.target.closest("img")) {
      e.preventDefault();
    }
  });

  document.addEventListener("keydown", (e) => {
    const key = (e.key || "").toLowerCase();
    const ctrlOrMeta = e.ctrlKey || e.metaKey;
    const blocked =
      (ctrlOrMeta && (key === "s" || key === "u" || key === "p")) ||
      (ctrlOrMeta && e.shiftKey && (key === "i" || key === "j")) ||
      key === "f12";

    if (blocked) {
      e.preventDefault();
    }
  });
})();
window.addEventListener("load", () => {
  handleNavbarScroll();
  setActiveNavLink();
});

window.addEventListener("component:loaded", (e) => {
  if (e.detail?.id !== "navbar") return;

  handleNavbarScroll();
  setActiveNavLink();
});










