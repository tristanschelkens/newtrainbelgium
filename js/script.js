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

(function initButtonHoverLabels() {
  const buttons = document.querySelectorAll(".btn, .filter-btn");

  buttons.forEach((button) => {
    if (button.querySelector(".btn-label")) return;

    const textNodes = Array.from(button.childNodes).filter(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );

    if (textNodes.length !== 1) return;

    const label = document.createElement("span");
    label.className = "btn-label";
    label.textContent = textNodes[0].textContent.trim();

    button.replaceChild(label, textNodes[0]);
  });
})();

(function initHeroSlideshow() {
  const primary = document.getElementById("heroBgPrimary");
  const secondary = document.getElementById("heroBgSecondary");
  const stationData = window.STATIONS_DATA;

  if (!primary || !secondary || !stationData || typeof stationData !== "object") return;

  const heroImages = Object.values(stationData)
    .flatMap((station) =>
      Array.isArray(station?.photos)
        ? station.photos
            .filter((photo) => photo && photo.src)
            .map((photo) => ({
              src: photo.src,
              alt: String(photo.alt || `${station.name || "Gallery"}`).trim(),
            }))
        : [],
    );

  const uniqueHeroImages = Array.from(
    new Map(heroImages.map((image) => [image.src, image])).values(),
  );

  if (uniqueHeroImages.length < 2) return;

  let activeImage = primary;
  let inactiveImage = secondary;
  let currentIndex = 0;
  let playQueue = [];

  function applyImage(element, image) {
    element.src = image.src;
    element.alt = image.alt;
  }

  function buildQueue(lastIndex) {
    const indexes = uniqueHeroImages.map((_, index) => index);

    for (let i = indexes.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = indexes[i];
      indexes[i] = indexes[j];
      indexes[j] = temp;
    }

    if (indexes[0] === lastIndex && indexes.length > 1) {
      const temp = indexes[0];
      indexes[0] = indexes[1];
      indexes[1] = temp;
    }

    return indexes;
  }

  function getNextIndex() {
    if (playQueue.length === 0) {
      playQueue = buildQueue(currentIndex);
    }

    return playQueue.shift();
  }

  applyImage(primary, uniqueHeroImages[0]);
  currentIndex = 0;
  playQueue = buildQueue(currentIndex);
  applyImage(secondary, uniqueHeroImages[getNextIndex()]);

  window.setInterval(() => {
    currentIndex = getNextIndex();
    const nextImage = uniqueHeroImages[currentIndex];

    applyImage(inactiveImage, nextImage);
    inactiveImage.classList.add("is-active");
    activeImage.classList.remove("is-active");

    const previousActive = activeImage;
    activeImage = inactiveImage;
    inactiveImage = previousActive;
  }, 10000);
})();

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

function renderPhotoGalleryCardsFromData(grid, stationData) {
  if (!grid || !stationData || typeof stationData !== "object") return;

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildPhotographerBadge(photographer) {
    const name = String(photographer || "").trim();
    return name ? `<span class="station-photographer-badge">By ${esc(name)}</span>` : "";
  }

  function getStationCoverPhoto(station) {
    const photos = Array.isArray(station?.photos) ? station.photos : [];
    if (photos.length === 0) return null;

    const groupedPhotos = new Map();
    photos.forEach((photo, index) => {
      const key = String(photo?.series || `photo-${index}`).trim().toLowerCase();
      if (!groupedPhotos.has(key)) groupedPhotos.set(key, []);
      groupedPhotos.get(key).push(photo);
    });

    for (const group of groupedPhotos.values()) {
      const mainPhoto =
        group.find((photo) => photo?.isMain === true) ||
        group.find((photo) => photo?.isMain !== false) ||
        group[0];
      if (mainPhoto?.src) return mainPhoto;
    }

    return photos.find((photo) => photo?.src) || null;
  }

  function getPrimaryOperatorLabel(operatorValue) {
    return String(operatorValue || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)[0] || "";
  }

  function getStationFallbackSources(station, preferredSrc) {
    const photos = Array.isArray(station?.photos) ? station.photos : [];
    const list = photos
      .map((photo) => String(photo?.src || "").trim())
      .filter(Boolean);
    const unique = Array.from(new Set(list));
    const preferred = String(preferredSrc || "").trim();
    if (!preferred) return unique;
    return [preferred, ...unique.filter((item) => item !== preferred)];
  }

  const cardsHtml = Object.entries(stationData)
    .filter(([, station]) => Array.isArray(station?.photos) && station.photos.length > 0)
    .sort(([, a], [, b]) =>
      String(a?.name || "").localeCompare(String(b?.name || "")),
    )
    .map(([slug, station]) => {
      const coverPhoto = getStationCoverPhoto(station);
      if (!coverPhoto?.src) return "";

      const name = station?.name || coverPhoto.label || slug;
      const country = String(station?.country || "").toLowerCase();
      const primaryOperator = getPrimaryOperatorLabel(coverPhoto.operator || "");
      const fallbackSources = getStationFallbackSources(station, coverPhoto.src);

      return `
        <a
          class="photo-card"
          data-country="${esc(country)}"
          data-sort-place="${esc(name)}"
          data-sort-company="${esc(primaryOperator)}"
          href="Station.html?slug=${encodeURIComponent(slug)}"
        >
          <img
            loading="lazy"
            src="${esc(coverPhoto.src)}"
            alt="${esc(name)}"
            data-fallback-sources="${esc(fallbackSources.join("|||"))}"
          />
          <div class="overlay"><h3>${esc(name)}</h3></div>
        </a>
      `;
    })
    .join("");

  if (cardsHtml.trim()) {
    grid.innerHTML = cardsHtml;
    prepareImageFallbacks(grid);
  }
}

function getImageFallbackQueue(src) {
  const raw = String(src || "").trim();
  if (!raw) return [];

  const [base, query = ""] = raw.split("?");
  const match = base.match(/^(.*)\.([a-z0-9]+)$/i);
  if (!match) return [];

  const stem = match[1];
  const ext = match[2].toLowerCase();
  const candidates = ["webp", "jpg", "jpeg", "png"];
  const ordered = [ext, ...candidates.filter((item) => item !== ext)];

  return ordered.map((item) => `${stem}.${item}${query ? `?${query}` : ""}`);
}

function prepareImageFallbacks(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const images = scope.querySelectorAll("img");

  images.forEach((img) => {
    if (img.dataset.fallbackReady === "true") return;

    const baseQueue = getImageFallbackQueue(img.getAttribute("src"));
    const extraSources = String(img.dataset.fallbackSources || "")
      .split("|||")
      .map((item) => item.trim())
      .filter(Boolean);
    const extraQueue = extraSources.flatMap((source) => getImageFallbackQueue(source));
    const queue = Array.from(new Set([...baseQueue, ...extraQueue]));
    if (queue.length <= 1) return;

    img.dataset.fallbackReady = "true";
    img.dataset.fallbackQueue = JSON.stringify(queue);
    img.dataset.fallbackIndex = "0";

    function tryNextFallback() {
      let list = [];
      try {
        list = JSON.parse(img.dataset.fallbackQueue || "[]");
      } catch {
        list = [];
      }
      if (!Array.isArray(list) || list.length === 0) return;

      const current = Number.parseInt(img.dataset.fallbackIndex || "0", 10);
      const next = Number.isNaN(current) ? 1 : current + 1;
      if (next >= list.length) return;

      img.dataset.fallbackIndex = String(next);
      img.src = list[next];
    }

    img.addEventListener("error", tryNextFallback);

    if (img.complete && img.naturalWidth === 0) {
      tryNextFallback();
    }
  });
}

function renderCountryFiltersFromData(filters, stationData) {
  if (!filters || !stationData || typeof stationData !== "object") return;

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  const countries = Array.from(
    new Set(
      Object.values(stationData)
        .map((station) => String(station?.country || "").trim())
        .filter(Boolean),
    ),
  ).sort((a, b) => a.localeCompare(b));

  if (countries.length === 0) return;

  filters.innerHTML = [
    '<button class="filter-btn active" type="button" data-filter="all">All</button>',
    ...countries.map(
      (country) =>
        `<button class="filter-btn" type="button" data-filter="${esc(country.toLowerCase())}">${esc(country)}</button>`,
    ),
  ].join("");
}

function normalizeStationCoords(value) {
  if (!value) return null;
  if (Array.isArray(value) && value.length >= 2) {
    const latArr = Number(value[0]);
    const lngArr = Number(value[1]);
    if (Number.isFinite(latArr) && Number.isFinite(lngArr)) return [latArr, lngArr];
    return null;
  }
  const lat = Number(value.lat);
  const lng = Number(value.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return [lat, lng];
}

const stationSlugAliases = {
  "antwerpen-berchem": "antwerp-berchem",
  "antwerpen-centraal": "antwerp-central",
  "antwerpen-linkeroever": "antwerp-linkeroever",
  "antwerpen-luchtbal": "antwerp-luchtbal",
  "antwerpen-noorderdokken": "antwerp-noorderdokken",
  "antwerpen-zuid": "antwerp-south",
};

const stationNameAliases = {
  "antwerp-berchem": "Antwerp-Berchem",
  "antwerp-central": "Antwerp-Central",
  "antwerp-linkeroever": "Antwerp-Linkeroever",
  "antwerp-luchtbal": "Antwerp-Luchtbal",
  "antwerp-noorderdokken": "Antwerp-Noorderdokken",
  "antwerp-south": "Antwerp-South",
  "antwerpen-berchem": "Antwerp-Berchem",
  "antwerpen-centraal": "Antwerp-Central",
  "antwerpen-linkeroever": "Antwerp-Linkeroever",
  "antwerpen-luchtbal": "Antwerp-Luchtbal",
  "antwerpen-noorderdokken": "Antwerp-Noorderdokken",
  "antwerpen-zuid": "Antwerp-South",
};

function slugifyStationValue(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function canonicalStationSlug(value) {
  const slug = slugifyStationValue(value);
  return stationSlugAliases[slug] || slug;
}

function canonicalStationName(name, slug) {
  const nameKey = slugifyStationValue(name);
  const slugKey = canonicalStationSlug(slug || nameKey);
  return stationNameAliases[nameKey] || stationNameAliases[slugKey] || String(name || "").trim();
}

const vehiclePrefixNames = {
  am: "AM",
  ar: "AR",
  br: "BR",
  desiro: "Desiro",
  e: "E",
  hld: "HLD",
  hle: "HLE",
  hlr: "HLR",
  i: "I",
  m: "M",
  p: "P",
  mw: "MW",
  ms: "MS",
  skoda: "�koda",
  traxx: "TRAXX",
  tgv: "TGV",
};

const spacedVehiclePrefixes = new Set(["am", "ar", "hle", "hld", "hlr", "mw", "ms"]);
const compactVehiclePrefixes = new Set(["i", "m", "p"]);

function normalizeVehicleLabel(value) {
  const raw = String(value || "").trim().replace(/\s+/g, " ");
  if (!raw) return "";

  const compact = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");

  const match = compact.match(/^([a-z]+)(\d+)(.*)$/);
  if (!match) {
    return raw
      .split(" ")
      .map((part) => vehiclePrefixNames[part.toLowerCase()] || part)
      .join(" ");
  }

  const prefixKey = match[1];
  const prefix = vehiclePrefixNames[prefixKey] || prefixKey.toUpperCase();
  const digits = match[2];
  const tail = match[3] ? ` ${match[3].toUpperCase()}` : "";

  if (prefixKey === "br") {
    if (digits.length === 7) {
      return `BR ${digits.slice(0, 3)} ${digits.slice(3, 6)}-${digits.slice(6)}${tail}`;
    }
    if (digits.length === 6) {
      return `BR ${digits.slice(0, 3)} ${digits.slice(3)}${tail}`;
    }
  }

  if (spacedVehiclePrefixes.has(prefixKey)) {
    if (digits.length <= 2) return `${prefix} ${digits.padStart(2, "0")}${tail}`;
    return `${prefix} ${digits}${tail}`;
  }

  if (compactVehiclePrefixes.has(prefixKey) || prefixKey.length === 1) {
    return `${prefix}${digits}${tail}`;
  }

  return `${prefix} ${digits}${tail}`;
}

function splitTrainNumber(value) {
  const normalized = normalizeVehicleLabel(value).replace(/^\d+\s*x\s*/i, "").trim();
  if (!normalized) return { train: "", number: "" };
  const compact = normalized.replace(/\s+/g, " ").trim();
  if (/^flirt\s+\d{1,2}$/i.test(compact)) {
    return { train: compact.toUpperCase(), number: "" };
  }
  const parts = compact.split(" ").filter(Boolean);
  if (parts.length < 2) return { train: compact, number: "" };
  const familyPrefixes = new Set(["AM", "AR", "HLE", "HLD", "HLR", "TRAXX", "BR", "E", "MW", "MS", "SKODA"]);
  if (parts.length >= 2 && familyPrefixes.has(parts[0].toUpperCase()) && /^\d{1,4}$/.test(parts[1])) {
    const train = `${parts[0]} ${parts[1]}`;
    const maybeNumber = parts[2] || "";
    return { train, number: /^\d+(?:-\d+)?$/.test(maybeNumber) ? maybeNumber : "" };
  }
  if (parts[0].toLowerCase() === "class" && /^\d{1,4}$/.test(parts[1])) {
    const train = `Class ${parts[1]}`;
    const maybeNumber = parts[2] || "";
    return { train, number: /^\d+(?:-\d+)?$/.test(maybeNumber) ? maybeNumber : "" };
  }
  const last = parts[parts.length - 1];
  if (/^\d+(?:-\d+)?$/.test(last)) {
    return {
      train: parts.slice(0, -1).join(" ").trim(),
      number: last,
    };
  }
  return { train: compact, number: "" };
}

function composeTrainLabel(item) {
  const train = String(item?.train || item?.label || "").trim();
  const number = String(item?.number || "").trim();
  if (!train) return number;
  return number ? `${train} ${number}` : train;
}

function pickLeadCompositionItem(parts) {
  const list = Array.isArray(parts) ? parts.filter(Boolean) : [];
  if (list.length === 0) return null;
  const explicitLead = list.find((part) => part?.lead === true);
  if (explicitLead) return explicitLead;
  const firstTraction = list.find((part) => String(part?.train || part?.label || "").trim());
  return firstTraction || list[0];
}

function normalizeSubmissionConsist(parts) {
  if (!Array.isArray(parts)) return [];
  const normalized = parts
    .map((part) => {
      const raw = part?.train || part?.label;
      const split = splitTrainNumber(raw);
      if (!split.train) return null;
      return { train: split.train, number: split.number, active: true, lead: Boolean(part?.lead) };
    })
    .filter(Boolean);
  const lead = pickLeadCompositionItem(normalized);
  return lead ? [lead] : [];
}

function buildApprovedSubmissionPhoto(item, stationSlug, stationName) {
  const photoId = String(item?.id || "").trim();
  if (!photoId) return null;

  const src = String(item?.image || "").trim();
  if (!src) return null;

  return {
    id: photoId,
    series: `${stationSlug}-${photoId}`,
    isMain: true,
    operator: String(item?.operator || "").trim(),
    date: String(item?.date || "").trim(),
    src,
    alt: String(item?.title || stationName || stationSlug).trim(),
    label: String(stationName || stationSlug).trim(),
    numbers: "",
    photographer: String(item?.submittedBy || "").trim(),
    consist: normalizeSubmissionConsist(item?.composition),
  };
}

async function mergeApprovedSubmissionsIntoStationData(stationData) {
  if (!stationData || typeof stationData !== "object") return;
  try {
    const cacheKey = "tb_approved_submissions_cache_v2";
    const cacheTtlMs = 1000 * 60 * 5;
    let items = [];
    try {
      const cachedRaw = sessionStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if (
          cached &&
          Number.isFinite(Number(cached.ts)) &&
          Date.now() - Number(cached.ts) < cacheTtlMs &&
          Array.isArray(cached.items)
        ) {
          items = cached.items;
        }
      }
    } catch {}

    if (items.length === 0) {
      const res = await fetch("/api/submissions/approved?limit=60", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = await res.json();
      items = Array.isArray(data?.items) ? data.items : [];
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), items }));
      } catch {}
    }

    items.forEach((item) => {
      const stationSlug = canonicalStationSlug(item?.stationSlug || item?.stationName);
      if (!stationSlug) return;
      const stationName = canonicalStationName(item?.stationName, stationSlug) || stationSlug;

      if (!stationData[stationSlug] || typeof stationData[stationSlug] !== "object") {
        stationData[stationSlug] = {
          slug: stationSlug,
          name: stationName,
          province: String(item?.stationProvince || "").trim(),
          country: String(item?.stationCountry || "").trim(),
          coords: normalizeStationCoords(item?.stationCoords),
          photos: [],
        };
      }

      const station = stationData[stationSlug];
      if (!Array.isArray(station.photos)) station.photos = [];
      station.name = canonicalStationName(station.name || stationName, stationSlug) || stationName;
      if (!station.province) station.province = String(item?.stationProvince || "").trim();
      if (!station.country) station.country = String(item?.stationCountry || "").trim();
      if (!station.coords) station.coords = normalizeStationCoords(item?.stationCoords);

      const photoId = String(item?.id || "").trim();
      if (!photoId) return;
      const exists = station.photos.some((photo) => String(photo?.id || "").trim() === photoId);
      if (exists) return;

      const photo = buildApprovedSubmissionPhoto(item, stationSlug, station.name);
      if (photo) station.photos.push(photo);
    });
  } catch {}
}

(async function initPhotoFilters() {
  const filters = document.getElementById("photoFilters");
  const grid = document.getElementById("photoGrid");
  const mapSection = document.getElementById("stationsMap")?.closest("section");
  const searchInput = document.getElementById("photoSearch");
  const operatorFilters = document.getElementById("photoOperatorFilters");
  const materialFilters = document.getElementById("photoMaterialFilters");
  const sortByPlaceBtn = document.getElementById("photoSortPlace");
  const sortByCompanyBtn = document.getElementById("photoSortCompany");
  const breadcrumbBar = document.getElementById("photoBreadcrumbBar");
  const breadcrumb = document.getElementById("photoBreadcrumb");
  const breadcrumbBackBtn = document.getElementById("photoBreadcrumbBack");
  const photosSearchBlock = document.querySelector(".photos-search");
  const galleryHead = document.querySelector(".photos-gallery-head");
  const galleryTitle = galleryHead?.querySelector("h2");
  const stationData = window.STATIONS_DATA || {};

  if (!grid) return;

  await mergeApprovedSubmissionsIntoStationData(stationData);
  if (filters) renderCountryFiltersFromData(filters, stationData);
  renderPhotoGalleryCardsFromData(grid, stationData);
  window.dispatchEvent(new CustomEvent("gallery:rendered"));

  const buttons = filters ? Array.from(filters.querySelectorAll(".filter-btn")) : [];
  const cards = Array.from(grid.querySelectorAll(".photo-card"));
  const originalGridHtml = grid.innerHTML;
  const noResults = document.getElementById("noResults");
  const availableFilters = new Set(
    buttons.map((btn) => (btn.dataset.filter || "").toLowerCase()),
  );
  const cardPhotoEntries = new Map();
  const allPhotoEntries = [];
  const photoSeriesGroups = new Map();
  let activeFilter = "all";
  let activeOperatorFilter = "all";
  let activeMaterialFilter = "all";
  let activeQuery = "";
  let activeSortMode = "place";
  let companyDrillOperator = "";
  let companyDrillMaterial = "";
  let companyDrillNumber = "";
  let placeDrillCountry = "";
  let placeDrillStation = "";
  let placeDrillMaterial = "";
  let placeDrillNumber = "";
  const scrollStateKey = "photos-scroll-y";

  function isNumberDrillLevel() {
    if (activeSortMode === "company") return Boolean(companyDrillNumber);
    if (activeSortMode === "place") return Boolean(placeDrillNumber);
    return false;
  }

  function updatePhotosPageUiState() {
    const onNumberLevel = isNumberDrillLevel();
    if (photosSearchBlock) {
      photosSearchBlock.hidden = onNumberLevel;
      photosSearchBlock.style.display = onNumberLevel ? "none" : "";
    }
    if (galleryTitle) {
      galleryTitle.hidden = true;
    }
  }

  function normalizeSearchValue(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function buildSearchIndex(value) {
    return normalizeSearchValue(value);
  }

  function getSearchTokens(searchText) {
    return String(searchText || "").match(/[a-z0-9]+/g) || [];
  }

  function getSearchNumberGroups(searchText) {
    return String(searchText || "").match(/\d+/g) || [];
  }

  function matchesSearchTerm(searchText, term) {
    const normalizedTerm = normalizeSearchValue(term);
    if (!normalizedTerm) return true;

    if (/^\d+$/.test(normalizedTerm)) {
      const tokens = getSearchTokens(searchText);
      const numberGroups = getSearchNumberGroups(searchText);
      const compactNumberPairs = numberGroups
        .map((group, index) =>
          index < numberGroups.length - 1 ? `${group}${numberGroups[index + 1]}` : "",
        )
        .filter(Boolean);

      return (
        numberGroups.includes(normalizedTerm) ||
        compactNumberPairs.includes(normalizedTerm) ||
        tokens.some(
          (token) => /^[a-z]+\d+$/.test(token) && token.endsWith(normalizedTerm),
        )
      );
    }

    return String(searchText || "").includes(normalizedTerm);
  }

  function matchesSearchTerms(searchText, terms) {
    return terms.every((term) => matchesSearchTerm(searchText, term));
  }

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildPhotographerBadge(photographer) {
    const name = String(photographer || "").trim();
    return name ? `<span class="station-photographer-badge">By ${esc(name)}</span>` : "";
  }

  function formatSearchTagLabel(label) {
    return normalizeVehicleLabel(label).replace(
      /(\d+)\s*x\s*/gi,
      (_, n) => `${n}${String.fromCharCode(215)} `,
    );
  }

  function getProfileAvatarForUser(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user) return "../images/default-avatar.svg";
    try {
      const raw = localStorage.getItem("tb_profiles_v1");
      const profiles = raw ? JSON.parse(raw) : {};
      const profile = profiles && typeof profiles === "object" ? profiles[user] : null;
      const avatar = String(profile?.avatar || "").trim();
      return avatar || "../images/default-avatar.svg";
    } catch {
      return "../images/default-avatar.svg";
    }
  }

  function buildSearchMetaHtml(consist, options = {}) {
    const visibleItems = (Array.isArray(consist) ? consist : []).filter(
      (item) => item && item.showOnCard !== false,
    );
    const maxVisible =
      Number.isInteger(options.maxVisible) && options.maxVisible > 0
        ? options.maxVisible
        : null;
    const renderedItems = maxVisible ? visibleItems.slice(0, maxVisible) : visibleItems;
    const hasOverflow = maxVisible ? visibleItems.length > maxVisible : false;

    const tagsHtml = renderedItems
      .map((item, index) => {
        const cls = item.active !== false ? "station-meta-chip" : "station-meta-inactive";
        const separatorLabel = String(item.separatorAfter || "").trim();
        const plus =
          index < renderedItems.length - 1
            ? separatorLabel
              ? `<span class="station-meta-separator">${esc(separatorLabel)}</span>`
              : '<span class="station-meta-plus">+</span>'
            : "";

        return `<span class="${cls}">${esc(formatSearchTagLabel(composeTrainLabel(item)))}</span>${plus}`;
      })
      .join("");

    return hasOverflow ? `${tagsHtml}<span class="station-meta-plus">+</span>` : tagsHtml;
  }

  function normalizeFacetKey(value) {
    return normalizeSearchValue(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function deriveMaterialFacet(item) {
    if (!item) return null;

    const explicitLabel = String(item.filterLabel || "").trim();
    const explicitKey = String(item.filterKey || "").trim();
    if (explicitLabel) {
      return {
        key: normalizeFacetKey(explicitKey || explicitLabel),
        label: explicitLabel,
      };
    }

    const label = String(item.train || item.label || "").trim();
    if (!label) return null;

    const normalized = normalizeSearchValue(label);
    const combinedNormalized = normalizeSearchValue(
      `${label} ${String(item.number || "").trim()}`.trim(),
    );
    const withoutCount = normalized.replace(/^\d+\s*x\s*/i, "").trim();
    const combinedWithoutCount = combinedNormalized.replace(/^\d+\s*x\s*/i, "").trim();

    if (withoutCount.startsWith("vectron")) {
      return { key: "vectron", label: "Vectron" };
    }
    if (withoutCount.startsWith("taurus")) {
      return { key: "taurus", label: "Taurus" };
    }
    if (withoutCount.startsWith("railjet")) {
      return { key: "railjet", label: "Railjet" };
    }
    if (withoutCount.startsWith("desiro ml")) {
      return { key: "desiro-ml", label: "Desiro ML" };
    }
    if (withoutCount.startsWith("kiss")) {
      return { key: "kiss", label: "KISS" };
    }
    if (withoutCount.startsWith("cityshuttle")) {
      return { key: "cityshuttle", label: "CityShuttle" };
    }
    if (withoutCount.startsWith("cityjet")) {
      return { key: "cityjet", label: "CityJet" };
    }
    if (withoutCount.startsWith("nightjet")) {
      return { key: "nightjet", label: "NightJet" };
    }
    if (withoutCount.startsWith("coradia max")) {
      return { key: "coradia-max", label: "Coradia Max" };
    }
    if (withoutCount.startsWith("flirt 3") || combinedWithoutCount.startsWith("flirt 3")) {
      return { key: "flirt-3", label: "FLIRT 3" };
    }
    if (withoutCount.startsWith("flirt")) {
      return { key: "flirt", label: "FLIRT" };
    }
    if (withoutCount.startsWith("virm")) {
      return { key: "virm", label: "VIRM" };
    }
    if (withoutCount.startsWith("mw41")) {
      return { key: "mw41", label: "MW41" };
    }
    if (withoutCount.startsWith("hld")) {
      const match = withoutCount.match(/^hld\s*(\d{1,3})/i);
      if (match) {
        return {
          key: `hld-${match[1]}`,
          label: `HLD ${match[1]}`,
        };
      }
      return { key: "hld", label: "HLD" };
    }
    {
      const emuMatch = withoutCount.match(/^(am|ar)\s*(\d{2,3})\b/i);
      if (emuMatch) {
        const family = `${emuMatch[1].toUpperCase()} ${emuMatch[2]}`;
        return {
          key: normalizeFacetKey(family),
          label: family,
        };
      }
    }
    if (withoutCount.startsWith("am08")) {
      return { key: "am08", label: "AM 08" };
    }
    if (withoutCount.startsWith("e320")) {
      return { key: "e320", label: "E320" };
    }
    if (withoutCount.startsWith("traxx")) {
      return { key: "traxx", label: "TRAXX" };
    }
    if (withoutCount.startsWith("skoda 263") || combinedWithoutCount.startsWith("skoda 263")) {
      return { key: "skoda-263", label: "�koda 263" };
    }
    if (withoutCount.startsWith("skoda")) {
      return { key: "skoda", label: "�koda" };
    }
    if (withoutCount.startsWith("br146")) {
      return { key: "br146", label: "BR 146" };
    }
    if (withoutCount.startsWith("class ")) {
      const match = withoutCount.match(/^class\s+(\d+)/);
      if (match) {
        return {
          key: `class-${match[1]}`,
          label: `Class ${match[1]}`,
        };
      }
    }
    if (withoutCount.startsWith("hle")) {
      const compact = withoutCount.replace(/\s+/g, "");
      if (compact.startsWith("hle18")) {
        return { key: "hle-18", label: "HLE 18" };
      }
      if (compact.startsWith("hle19")) {
        return { key: "hle-19", label: "HLE 19" };
      }
      if (compact.startsWith("hle18/19") || compact.startsWith("hle18-19")) {
        return { key: "hle-18-19", label: "HLE 18/19" };
      }
      const match = withoutCount.match(/^hle\s*(\d+)/);
      if (match) {
        const family = match[1];
        return {
          key: `hle-${family}`,
          label: `HLE ${family}`,
        };
      }
    }
    if (withoutCount.startsWith("tgv duplex")) {
      return { key: "tgv-duplex", label: "TGV Duplex" };
    }
    if (withoutCount.startsWith("pba")) {
      return { key: "pba", label: "PBA" };
    }
    if (withoutCount.startsWith("m7")) {
      return { key: "m7", label: "M7" };
    }
    if (withoutCount.startsWith("m6")) {
      return { key: "m6", label: "M6" };
    }
    if (withoutCount.startsWith("m4")) {
      return { key: "m4", label: "M4" };
    }
    if (withoutCount.startsWith("i11")) {
      return { key: "i11", label: "I11" };
    }
    if (withoutCount.startsWith("i10")) {
      return { key: "i10", label: "I10" };
    }
    if (withoutCount.startsWith("icr")) {
      return { key: "icr", label: "ICR" };
    }
    if (withoutCount.startsWith("uic-z") || withoutCount.startsWith("uicz")) {
      return { key: "uic-z", label: "UIC-Z" };
    }
    if (withoutCount.startsWith("dosto")) {
      return { key: "dosto", label: "DoSto" };
    }
    if (withoutCount.startsWith("twindexx vario")) {
      return { key: "twindexx-vario", label: "Twindexx Vario" };
    }

    return {
      key: normalizeFacetKey(withoutCount),
      label: withoutCount.toUpperCase() === withoutCount ? withoutCount : label.replace(/^\d+\s*x\s*/i, "").trim(),
    };
  }

  function deriveLeadMaterialFacets(consist, photo = null) {
    const items = Array.isArray(consist) ? consist : [];
    const preferredLabel = String(photo?.leadMaterial || photo?.primaryMaterial || "").trim().toLowerCase();
    const preferredItem =
      preferredLabel
        ? items.find((item) => String(item?.label || "").trim().toLowerCase() === preferredLabel)
        : null;
    const explicitLead = items.find((item) => item && item.lead === true);
    const first = preferredItem || explicitLead || items[0];
    const facet = deriveMaterialFacet(first);
    return facet ? [facet] : [];
  }

  function getLeadPowerLabel(consist, photo = null) {
    const items = Array.isArray(consist) ? consist : [];
    const preferredLabel = String(photo?.leadTraction || photo?.primaryTraction || "").trim().toLowerCase();
    const preferredTraction =
      preferredLabel
        ? items.find(
            (item) =>
              String(item?.train || item?.label || "").trim().toLowerCase() === preferredLabel,
          )
        : null;
    const explicitLead = items.find((item) => item?.lead === true);
    const firstTraction = items.find((item) => String(item?.train || item?.label || "").trim());
    const chosen = preferredTraction || explicitLead || firstTraction;
    return chosen ? composeTrainLabel(chosen) : "";
  }

  function trainOrderValue(value) {
    const normalized = normalizeSearchValue(value).replace(/\s+/g, "");
    if (!normalized) return Number.POSITIVE_INFINITY;
    const groups = normalized.match(/\d+/g);
    if (!groups || groups.length === 0) return Number.POSITIVE_INFINITY;
    const joined = groups.join("");
    const parsed = Number.parseInt(joined, 10);
    return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
  }

  function leadPowerNumberValue(label, materialKey = "", explicitNumber = "") {
    const explicit = String(explicitNumber || "").trim();
    if (explicit) {
      const firstExplicit = explicit.split(",")[0].trim();
      if (firstExplicit) return formatDrillNumber(materialKey, firstExplicit);
    }
    const raw = String(label || "").trim();
    if (!raw) return "";
    const splitNumber = raw.match(/(\d{2,4}\s*-\s*\d)\b/);
    if (splitNumber && splitNumber[1]) {
      return splitNumber[1].replace(/\s+/g, "");
    }
    const groups = raw.match(/\d+/g);
    if (!groups || groups.length === 0) return "";
    const fallback = groups[groups.length - 1];
    return formatDrillNumber(materialKey, fallback);
  }

  function hydratePhotoCard(card) {
    const href = card.getAttribute("href") || "";
    const slug = (new URLSearchParams(href.split("?")[1] || "").get("slug") || "")
      .trim()
      .toLowerCase();
    const station = stationData[slug];
    const stationPhotos = Array.isArray(station?.photos) ? station.photos : [];

    const searchParts = [
      slug,
      station?.name,
      station?.country,
      station?.description,
      card.querySelector(".overlay h3")?.textContent,
      card.querySelector("img")?.alt,
      ...stationPhotos.flatMap((photo) => [
        photo?.operator,
        photo?.alt,
        photo?.label,
        photo?.numbers,
        ...(Array.isArray(photo?.consist)
          ? photo.consist.map((item) => item?.label)
          : []),
      ]),
    ]
      .filter(Boolean)
      .join(" ");

    card.dataset.search = buildSearchIndex(searchParts);
    card.dataset.defaultHref = href;

    const photoEntries = stationPhotos.map((photo, index) => {
      const photoSearch = [
        slug,
        station?.name,
        station?.country,
        station?.description,
        photo?.operator,
        photo?.alt,
        photo?.label,
        photo?.numbers,
        ...(Array.isArray(photo?.consist)
          ? photo.consist.map((item) => item?.label)
          : []),
      ]
        .filter(Boolean)
        .join(" ");

      return {
        photoId: String(photo?.id || "").trim(),
        index,
        slug,
        series:
          String(photo?.series || "").trim().toLowerCase() || `photo-${index}`,
        seriesKey: `${slug}::${String(photo?.series || "").trim().toLowerCase() || `photo-${index}`}`,
        explicitIsMain: typeof photo?.isMain === "boolean" ? photo.isMain : null,
        stationName: station?.name || slug,
        country: String(station?.country || "").toLowerCase(),
        src: photo?.src || "",
        alt: photo?.alt || station?.name || slug,
        date: String(photo?.date || "").trim(),
        photographer: String(photo?.photographer || "").trim(),
        operator: String(photo?.operator || "").trim(),
        operatorKeys: String(photo?.operator || "")
          .split(",")
          .map((item) => normalizeFacetKey(item))
          .filter(Boolean),
        materialFacets: Array.isArray(photo?.consist)
          ? Array.from(
              new Map(
                photo.consist
                  .map((item) => deriveMaterialFacet(item))
                  .filter(Boolean)
                  .map((facet) => [facet.key, facet]),
              ).values(),
            )
          : [],
        leadMaterialFacets: deriveLeadMaterialFacets(photo?.consist, photo),
        leadPowerLabel: getLeadPowerLabel(photo?.consist, photo),
        leadPowerNumber: leadPowerNumberValue(
          getLeadPowerLabel(photo?.consist, photo),
          deriveLeadMaterialFacets(photo?.consist, photo)?.[0]?.key || "",
          photo?.numbers,
        ),
        metaHtml: buildSearchMetaHtml(photo?.consist, { maxVisible: 3 }),
        fullMetaHtml: buildSearchMetaHtml(photo?.consist),
        href: `Station.html?slug=${encodeURIComponent(slug)}&photo=${index}&lightbox=1`,
        search: buildSearchIndex(photoSearch),
      };
    });

    cardPhotoEntries.set(card, photoEntries);
    allPhotoEntries.push(...photoEntries);
    card.dataset.operators = Array.from(
      new Set(photoEntries.flatMap((entry) => entry.operatorKeys)),
    ).join("|");
    card.dataset.materials = Array.from(
      new Set(photoEntries.flatMap((entry) => entry.materialFacets.map((facet) => facet.key))),
    ).join("|");
    photoEntries.forEach((entry) => {
      if (!photoSeriesGroups.has(entry.seriesKey)) photoSeriesGroups.set(entry.seriesKey, []);
      photoSeriesGroups.get(entry.seriesKey).push(entry);
    });
  }

  cards.forEach((card) => {
    hydratePhotoCard(card);
  });

  const searchLightbox = document.createElement("div");
  searchLightbox.className = "station-lightbox";
  searchLightbox.setAttribute("aria-hidden", "true");
  searchLightbox.innerHTML = `
    <button class="station-lightbox-close" type="button" aria-label="Close image">&times;</button>
    <div class="station-lightbox-media">
      <button class="station-lightbox-nav prev" type="button" aria-label="Previous photo">&#10094;</button>
      <img src="" alt="" />
      <button class="station-lightbox-nav next" type="button" aria-label="Next photo">&#10095;</button>
      <div class="station-lightbox-operator" aria-hidden="true"></div>
      <div class="station-lightbox-date" aria-hidden="true"></div>
      <div class="station-lightbox-meta" aria-hidden="true"></div>
      <button class="station-lightbox-delete" type="button" id="photoSearchDeleteBtn" hidden>Delete photo</button>
      <div class="station-lightbox-watermark">&copy; eurorailshots.com</div>
    </div>
    <div class="station-lightbox-panel">
      <div class="station-lightbox-panel-top">
        <h3>Comments</h3>
        <p class="muted">Join the discussion for this photo.</p>
      </div>
      <div class="station-lightbox-comments" id="photoSearchCommentsList"></div>
      <form class="login-form" id="photoSearchCommentForm">
        <input id="photoSearchCommentInput" name="comment" type="text" maxlength="400" placeholder="Write your comment..." />
        <button class="btn btn-primary" type="submit">Post comment</button>
      </form>
      <p class="muted" id="photoSearchCommentStatus"></p>
    </div>
  `;
  document.body.appendChild(searchLightbox);

  const searchLightboxImg = searchLightbox.querySelector(".station-lightbox-media img");
  const searchLightboxMedia = searchLightbox.querySelector(".station-lightbox-media");
  const searchLightboxOperator = searchLightbox.querySelector(".station-lightbox-operator");
  const searchLightboxDate = searchLightbox.querySelector(".station-lightbox-date");
  const searchLightboxMeta = searchLightbox.querySelector(".station-lightbox-meta");
  const searchLightboxDeleteBtn = searchLightbox.querySelector("#photoSearchDeleteBtn");
  const searchLightboxWatermark = searchLightbox.querySelector(".station-lightbox-watermark");
  const searchLightboxClose = searchLightbox.querySelector(".station-lightbox-close");
  const searchLightboxPrev = searchLightbox.querySelector(".station-lightbox-nav.prev");
  const searchLightboxNext = searchLightbox.querySelector(".station-lightbox-nav.next");
  const searchLightboxPanel = searchLightbox.querySelector(".station-lightbox-panel");
  const searchCommentsList = searchLightbox.querySelector("#photoSearchCommentsList");
  const searchCommentForm = searchLightbox.querySelector("#photoSearchCommentForm");
  const searchCommentInput = searchLightbox.querySelector("#photoSearchCommentInput");
  const searchCommentStatus = searchLightbox.querySelector("#photoSearchCommentStatus");
  let currentSearchSeriesPool = [];
  let currentSearchSeriesPosition = 0;
  let currentSearchEntry = null;

  function activeUserName() {
    return String(localStorage.getItem("tb_active_user_v1") || "").trim().toLowerCase();
  }

  function ownerUserName() {
    return String(localStorage.getItem("tb_owner_user_v1") || "EURORAILSHOTS").trim().toLowerCase();
  }

  function activeUserId() {
    return String(localStorage.getItem("tb_active_user_id_v1") || "").trim();
  }

  function ownerUserId() {
    return String(localStorage.getItem("tb_owner_user_id_v1") || "").trim();
  }

  function readProfilesStore() {
    try {
      return JSON.parse(localStorage.getItem("tb_profiles_v1") || "{}");
    } catch {
      return {};
    }
  }

  function canModerateUser(user) {
    const normalized = String(user || "").trim().toLowerCase();
    const activeId = activeUserId();
    const ownerId = ownerUserId();
    if (!normalized && !activeId) return false;
    const owner = ownerUserName();
    if ((ownerId && activeId && activeId === ownerId) || normalized === owner) return true;
    try {
      const roles = JSON.parse(localStorage.getItem("tb_roles_v1") || '{"moderators":[],"moderatorIds":[]}' );
      const modIds = Array.isArray(roles?.moderatorIds) ? roles.moderatorIds.map((id) => String(id || "").trim()) : [];
      if (activeId && modIds.includes(activeId)) return true;
      const mods = Array.isArray(roles?.moderators) ? roles.moderators.map((item) => String(item || "").trim().toLowerCase()) : [];
      return mods.includes(normalized);
    } catch {
      return false;
    }
  }

  function currentSearchCommentKey() {
    if (!currentSearchEntry) return "";
    return `${currentSearchEntry.slug}::${currentSearchEntry.series}`;
  }

  function setSearchCommentStatus(message, isError = false) {
    if (!searchCommentStatus) return;
    searchCommentStatus.textContent = message || "";
    searchCommentStatus.classList.toggle("is-error", Boolean(isError && message));
    searchCommentStatus.classList.toggle("is-success", Boolean(!isError && message));
  }

  async function renderSearchComments() {
    if (!searchCommentsList) return;
    const key = currentSearchCommentKey();
    if (!key) {
      searchCommentsList.innerHTML = '<p class="muted">No comments yet.</p>';
      return;
    }
    const profiles = readProfilesStore();
    let items = [];
    try {
      const res = await fetch(`/api/comments?photoKey=${encodeURIComponent(key)}`, { credentials: "include" });
      const data = await res.json().catch(() => ({}));
      items = Array.isArray(data?.items) ? data.items : [];
    } catch {
      items = [];
    }
    const user = activeUserName();
    const canModerate = canModerateUser(user);
    if (items.length === 0) {
      searchCommentsList.innerHTML = '<p class="muted">No comments yet.</p>';
      return;
    }
    searchCommentsList.innerHTML = items
      .map((item) => {
        const author = String(item.author || item.user || "user").toLowerCase();
        const avatar = String((profiles[author] || {}).avatar || "../images/default-avatar.svg");
        const canDelete = canModerate || user === author;
        return `
          <article class="station-lightbox-comment">
            <div class="station-lightbox-comment-header">
              <span class="station-comment-author">
                <img src="${esc(avatar)}" alt="${esc(author)} avatar" />
                <strong>${esc(author)}</strong>
              </span>
              ${canDelete ? `<button class="station-lightbox-comment-delete" type="button" data-search-comment-delete="${Number(item.id || 0)}">Delete</button>` : ""}
            </div>
            <p>${esc(item.body || item.text || "")}</p>
            <small>${esc(new Date(item.created_at || item.createdAt || Date.now()).toLocaleString("en-GB", { hour12: false }))}</small>
          </article>
        `;
      })
      .join("");
  }

  function persistSearchLightboxState(entry) {
    const url = new URL(window.location.href);
    if (!entry) {
      url.searchParams.delete("lb");
      url.searchParams.delete("lb_slug");
      url.searchParams.delete("lb_idx");
      url.searchParams.delete("lb_series");
      window.history.replaceState({}, "", url);
      return;
    }
    url.searchParams.set("lb", "1");
    url.searchParams.set("lb_slug", entry.slug);
    url.searchParams.set("lb_idx", String(entry.index));
    url.searchParams.set("lb_series", entry.seriesKey);
    window.history.replaceState({}, "", url);
  }

  function closeSearchLightbox() {
    searchLightbox.classList.remove("is-open");
    searchLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
    currentSearchEntry = null;
    persistSearchLightboxState(null);
    if (searchLightboxPanel) searchLightboxPanel.style.width = "";
  }

  function syncSearchLightboxPanelWidth() {
    if (!searchLightboxPanel) return;
    const width = Math.round(Number(searchLightboxMedia?.offsetWidth || 0));
    if (!width) return;
    searchLightboxPanel.style.width = `${width}px`;
    searchLightboxPanel.style.maxWidth = `${width}px`;
  }

  function updateSearchLightboxNav() {
    const hasMultiple = currentSearchSeriesPool.length > 1;
    if (searchLightboxPrev) {
      searchLightboxPrev.style.display = hasMultiple ? "inline-flex" : "none";
    }
    if (searchLightboxNext) {
      searchLightboxNext.style.display = hasMultiple ? "inline-flex" : "none";
    }
  }

  function openSearchLightboxEntry(entry) {
    if (!entry || !searchLightboxImg) return;
    currentSearchEntry = entry;

    currentSearchSeriesPool = Array.from(
      new Map(
        (photoSeriesGroups.get(entry.seriesKey) || [entry]).map((item) => [
          `${item.slug}::${item.index}`,
          item,
        ]),
      ).values(),
    );
    const foundIndex = currentSearchSeriesPool.findIndex(
      (item) => item.slug === entry.slug && item.index === entry.index,
    );
    currentSearchSeriesPosition = foundIndex >= 0 ? foundIndex : 0;

    searchLightboxImg.src = entry.src;
    searchLightboxImg.alt = entry.alt || entry.stationName;

    if (searchLightboxOperator) {
      if (entry.operator) {
        const labels = entry.operator
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        searchLightboxOperator.innerHTML = labels
          .map(
            (label) =>
              `<button class="station-meta-chip station-meta-chip-link" type="button" data-lightbox-operator="${esc(normalizeFacetKey(label))}">${esc(label)}</button>`,
          )
          .join("");
        searchLightboxOperator.style.display = "flex";
      } else {
        searchLightboxOperator.innerHTML = "";
        searchLightboxOperator.style.display = "none";
      }
    }

    if (searchLightboxDate) {
      if (entry.date) {
        searchLightboxDate.innerHTML = `<span class="station-meta-number">${esc(entry.date)}</span>`;
        searchLightboxDate.style.display = "flex";
      } else {
        searchLightboxDate.innerHTML = "";
        searchLightboxDate.style.display = "none";
      }
    }

    if (searchLightboxMeta) {
      searchLightboxMeta.innerHTML = "";
      searchLightboxMeta.style.display = "none";
    }

    if (searchLightboxWatermark) {
      const owner = (entry.photographer || "").trim() || "eurorailshots.com";
      searchLightboxWatermark.innerHTML = `&copy; ${esc(owner)}`;
    }

    if (searchLightboxDeleteBtn) {
      const canDelete = activeUserName() === ownerUserName();
      const photoId = String(entry?.photoId || "").trim();
      const deletable = canDelete && photoId.startsWith("sub_");
      searchLightboxDeleteBtn.hidden = !deletable;
      searchLightboxDeleteBtn.dataset.photoId = deletable ? photoId : "";
    }

    searchLightbox.classList.add("is-open");
    searchLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
    renderSearchComments();
    persistSearchLightboxState(entry);
    updateSearchLightboxNav();
    window.requestAnimationFrame(syncSearchLightboxPanelWidth);
    window.setTimeout(syncSearchLightboxPanelWidth, 20);
  }

  function openSiblingSearchLightbox(step) {
    if (!currentSearchSeriesPool.length) return;
    const count = currentSearchSeriesPool.length;
    currentSearchSeriesPosition =
      ((currentSearchSeriesPosition + step) % count + count) % count;
    openSearchLightboxEntry(currentSearchSeriesPool[currentSearchSeriesPosition]);
  }

  if (searchLightboxClose) {
    searchLightboxClose.addEventListener("click", closeSearchLightbox);
  }

  if (searchLightboxPrev) {
    searchLightboxPrev.addEventListener("click", (e) => {
      e.stopPropagation();
      openSiblingSearchLightbox(-1);
    });
  }

  if (searchLightboxNext) {
    searchLightboxNext.addEventListener("click", (e) => {
      e.stopPropagation();
      openSiblingSearchLightbox(1);
    });
  }

  searchLightbox.addEventListener("click", (e) => {
    if (e.target === searchLightbox) {
      closeSearchLightbox();
    }
  });

  searchLightboxOperator?.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-lightbox-operator]");
    if (!chip) return;
    const operatorKey = String(chip.dataset.lightboxOperator || "").trim().toLowerCase();
    if (!operatorKey) return;
    activeSortMode = "company";
    companyDrillOperator = operatorKey;
    companyDrillMaterial = "";
    companyDrillNumber = "";
    placeDrillCountry = "";
    placeDrillStation = "";
    placeDrillMaterial = "";
    placeDrillNumber = "";
    closeSearchLightbox();
    updateSortButtons();
    applyFilters(true);
  });

  searchLightboxDeleteBtn?.addEventListener("click", async (event) => {
    event.stopPropagation();
    const id = String(searchLightboxDeleteBtn.dataset.photoId || "").trim();
    if (!id) return;
    if (!confirm("Delete this photo permanently?")) return;
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Could not delete photo."));
      sessionStorage.removeItem("tb_approved_submissions_cache_v1");
      sessionStorage.removeItem("tb_approved_submissions_cache_v2");
      closeSearchLightbox();
      window.location.reload();
    } catch (err) {
      setSearchCommentStatus(String(err?.message || "Could not delete photo."), true);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!searchLightbox.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closeSearchLightbox();
      return;
    }

    if (e.key === "ArrowLeft") {
      openSiblingSearchLightbox(-1);
      return;
    }

    if (e.key === "ArrowRight") {
      openSiblingSearchLightbox(1);
    }
  });

  searchCommentForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = activeUserName();
    if (!user) {
      setSearchCommentStatus("Log in to post a comment.", true);
      return;
    }
    const text = String(searchCommentInput?.value || "").trim();
    if (!text) {
      setSearchCommentStatus("Please write a comment first.", true);
      return;
    }
    const key = currentSearchCommentKey();
    if (!key) return;
    fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ photoKey: key, body: text }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Could not post comment."));
        if (searchCommentInput) searchCommentInput.value = "";
        setSearchCommentStatus("Comment posted.");
        renderSearchComments();
      })
      .catch((err) => {
        setSearchCommentStatus(String(err?.message || "Could not post comment."), true);
      });
  });

  searchCommentsList?.addEventListener("click", (event) => {
    const deleteBtn = event.target.closest("[data-search-comment-delete]");
    if (!deleteBtn) return;
    const user = activeUserName();
    const key = currentSearchCommentKey();
    if (!user || !key) return;
    const commentId = Number(deleteBtn.dataset.searchCommentDelete || 0);
    if (!Number.isInteger(commentId) || commentId < 1) return;
    fetch(`/api/comments/${commentId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Could not remove comment."));
        setSearchCommentStatus("Comment removed.");
        renderSearchComments();
      })
      .catch((err) => {
        setSearchCommentStatus(String(err?.message || "Could not remove comment."), true);
      });
  });

  function setActiveButton(value) {
    buttons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "").toLowerCase() === value;
      btn.classList.toggle("active", isActive);
    });
  }

  searchLightboxImg?.addEventListener("load", syncSearchLightboxPanelWidth);
  searchLightboxMedia?.addEventListener("transitionend", syncSearchLightboxPanelWidth);
  window.addEventListener("resize", () => {
    if (searchLightbox.classList.contains("is-open")) {
      syncSearchLightboxPanelWidth();
    }
  });

  function sortVisibleCards() {
    const cardsToSort = Array.from(grid.querySelectorAll(".photo-card"));
    if (cardsToSort.length <= 1) return;
    const key = activeSortMode === "company" ? "sortCompany" : "sortPlace";
    cardsToSort.sort((a, b) =>
      String(a.dataset[key] || "").localeCompare(String(b.dataset[key] || ""), undefined, {
        sensitivity: "base",
      }),
    );
    cardsToSort.forEach((card) => grid.appendChild(card));
  }

  function updateSortButtons() {
    sortByPlaceBtn?.classList.toggle("active", activeSortMode === "place");
    sortByCompanyBtn?.classList.toggle("active", activeSortMode === "company");
  }

  function formatCompanyLabel(label) {
    return String(label || "").replace(/\//g, " / ");
  }

  function operatorLabelByKey(key) {
    for (const entry of allPhotoEntries) {
      if (normalizeFacetKey(firstOperatorLabel(entry)) === key) {
        return firstOperatorLabel(entry);
      }
    }
    return String(key || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function materialLabelByKey(key) {
    for (const entry of allPhotoEntries) {
      const match = (entry.materialFacets || []).find((facet) => facet.key === key);
      if (match?.label) return match.label;
    }
    return String(key || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function formatDrillNumber(materialKey, number) {
    const key = String(materialKey || "").trim().toLowerCase();
    const raw = String(number || "").trim();
    if (!raw) return "";
    if (key === "e320" && /^320\d{3,5}$/.test(raw)) {
      return raw.slice(3);
    }
    if (key === "am08" && /^08\d{2,5}$/.test(raw)) {
      return raw.slice(2).replace(/^0+/, "") || "0";
    }
    if (key === "br146" && /^146\d{2,5}$/.test(raw)) {
      return raw.slice(3);
    }
    if (
      (key === "hle-18" || key === "hle-19" || key === "hle-18-19") &&
      /^(18|19)\d{2}$/.test(raw)
    ) {
      return raw.slice(2);
    }
    return raw;
  }

  function stationLabelBySlug(slug) {
    const station = stationData[String(slug || "").toLowerCase()];
    if (station?.name) return station.name;
    return String(slug || "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (m) => m.toUpperCase());
  }

  function placeCountryLabelByKey(countryKey) {
    const key = String(countryKey || "").trim().toLowerCase();
    if (!key) return "";
    const entry = allPhotoEntries.find(
      (item) => String(item?.country || "").trim().toLowerCase() === key,
    );
    if (entry?.slug) {
      const station = stationData[String(entry.slug || "").toLowerCase()];
      const explicit = String(station?.country || "").trim();
      if (explicit) return explicit;
    }
    return key
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  function updateBreadcrumbs() {
    if (!breadcrumbBar || !breadcrumb) return;

    if (activeSortMode !== "company" && activeSortMode !== "place") {
      breadcrumbBar.hidden = true;
      breadcrumb.innerHTML = "";
      return;
    }

    const parts = [];

    if (activeSortMode === "company") {
      parts.push('<button class="photos-crumb-btn" type="button" data-crumb-level="company-root">Company</button>');

      if (companyDrillOperator) {
        parts.push(
          '<span class="photos-crumb-sep">/</span>',
        );
        if (companyDrillMaterial || companyDrillNumber) {
          parts.push(
            `<button class="photos-crumb-btn" type="button" data-crumb-level="company-operator">${esc(formatCompanyLabel(operatorLabelByKey(companyDrillOperator)))}</button>`,
          );
        } else {
          parts.push(`<span class="photos-crumb-current">${esc(formatCompanyLabel(operatorLabelByKey(companyDrillOperator)))}</span>`);
        }
      }

      if (companyDrillMaterial) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        if (companyDrillNumber) {
          parts.push(`<button class="photos-crumb-btn" type="button" data-crumb-level="company-material">${esc(materialLabelByKey(companyDrillMaterial))}</button>`);
        } else {
          parts.push(`<span class="photos-crumb-current">${esc(materialLabelByKey(companyDrillMaterial))}</span>`);
        }
      }

      if (companyDrillNumber) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        parts.push(
          `<span class="photos-crumb-current">${esc(
            formatDrillNumber(companyDrillMaterial, companyDrillNumber),
          )}</span>`,
        );
      }
    } else if (activeSortMode === "place") {
      parts.push('<button class="photos-crumb-btn" type="button" data-crumb-level="place-root">Place</button>');

      if (placeDrillCountry) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        if (placeDrillStation || placeDrillMaterial || placeDrillNumber) {
          parts.push(
            `<button class="photos-crumb-btn" type="button" data-crumb-level="place-country">${esc(placeCountryLabelByKey(placeDrillCountry))}</button>`,
          );
        } else {
          parts.push(`<span class="photos-crumb-current">${esc(placeCountryLabelByKey(placeDrillCountry))}</span>`);
        }
      }

      if (placeDrillStation) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        if (placeDrillMaterial || placeDrillNumber) {
          parts.push(
            `<button class="photos-crumb-btn" type="button" data-crumb-level="place-station">${esc(stationLabelBySlug(placeDrillStation))}</button>`,
          );
        } else {
          parts.push(`<span class="photos-crumb-current">${esc(stationLabelBySlug(placeDrillStation))}</span>`);
        }
      }

      if (placeDrillMaterial) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        if (placeDrillNumber) {
          parts.push(
            `<button class="photos-crumb-btn" type="button" data-crumb-level="place-material">${esc(materialLabelByKey(placeDrillMaterial))}</button>`,
          );
        } else {
          parts.push(`<span class="photos-crumb-current">${esc(materialLabelByKey(placeDrillMaterial))}</span>`);
        }
      }

      if (placeDrillNumber) {
        parts.push('<span class="photos-crumb-sep">/</span>');
        parts.push(
          `<span class="photos-crumb-current">${esc(
            formatDrillNumber(placeDrillMaterial, placeDrillNumber),
          )}</span>`,
        );
      }
    }

    breadcrumb.innerHTML = parts.join("");
    breadcrumbBar.hidden = false;
    if (breadcrumbBackBtn) {
      if (activeSortMode === "company") {
        breadcrumbBackBtn.hidden = !(companyDrillOperator || companyDrillMaterial || companyDrillNumber);
      } else if (activeSortMode === "place") {
        breadcrumbBackBtn.hidden = !(placeDrillCountry || placeDrillStation || placeDrillMaterial || placeDrillNumber);
      }
    }
  }

  function firstOperatorLabel(entry) {
    return String(entry?.operator || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)[0] || "Unknown";
  }

  function uniquePreviewSources(list) {
    return Array.from(
      new Set(
        (Array.isArray(list) ? list : [])
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
  }

  function getRotatingPreviewSrc(rotationKey, sources) {
    const items = uniquePreviewSources(sources);
    if (items.length === 0) return "";
    const storageKey = "tb_preview_rotation_v1";
    let state = {};
    try {
      state = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
    } catch {
      state = {};
    }
    const currentIndex = Number(state?.[rotationKey] || 0);
    const index = Number.isFinite(currentIndex) ? ((currentIndex % items.length) + items.length) % items.length : 0;
    state[rotationKey] = index + 1;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {}
    return items[index] || items[0];
  }

  function renderOperatorDrillCards() {
    const operatorMap = new Map();
    allPhotoEntries.forEach((entry) => {
      const label = firstOperatorLabel(entry);
      const key = normalizeFacetKey(label) || "unknown";
      if (!operatorMap.has(key)) {
        operatorMap.set(key, {
          key,
          label,
          count: 0,
          previewSources: [],
        });
      }
      if (entry.src) operatorMap.get(key).previewSources.push(entry.src);
      operatorMap.get(key).count += 1;
    });
    const cards = Array.from(operatorMap.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `company:operator:${item.key}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-company-card="${esc(item.key)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.label)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.label)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");
    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = operatorMap.size === 0 ? "block" : "none";
  }

  function renderMaterialDrillCards() {
    const materialMap = new Map();
    allPhotoEntries
      .filter((entry) => normalizeFacetKey(firstOperatorLabel(entry)) === companyDrillOperator)
      .forEach((entry) => {
        entry.leadMaterialFacets.forEach((facet) => {
          const key = facet.key || "unknown";
          if (!materialMap.has(key)) {
            materialMap.set(key, {
              key,
              label: facet.label || key,
              count: 0,
              previewSources: [],
            });
          }
          if (entry.src) materialMap.get(key).previewSources.push(entry.src);
          materialMap.get(key).count += 1;
        });
      });
    const cards = Array.from(materialMap.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `company:${companyDrillOperator}:material:${item.key}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-material-card="${esc(item.key)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.label)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.label)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");
    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = materialMap.size === 0 ? "block" : "none";
  }

  function renderPlaceCountryDrillCards() {
    const countryMap = new Map();
    allPhotoEntries.forEach((entry) => {
      const countryKey = String(entry?.country || "").trim().toLowerCase();
      if (!countryKey) return;
      if (!countryMap.has(countryKey)) countryMap.set(countryKey, []);
      countryMap.get(countryKey).push(entry);
    });

    const cards = Array.from(countryMap.entries())
      .sort((a, b) => placeCountryLabelByKey(a[0]).localeCompare(placeCountryLabelByKey(b[0])))
      .map(([countryKey, entries]) => {
        const previewSrc = getRotatingPreviewSrc(
          `place:country:${countryKey}`,
          entries.map((entry) => entry.src),
        );
        const label = placeCountryLabelByKey(countryKey);
        return `
          <button class="photo-card photo-search-result" type="button" data-place-country-card="${esc(countryKey)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(label)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(label)}</h3>
            </div>
          </button>
        `;
      })
      .join("");

    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = countryMap.size === 0 ? "block" : "none";
  }

  function renderPlaceDrillCards() {
    const stationMap = new Map();
    allPhotoEntries.forEach((entry) => {
      if (String(entry?.country || "").trim().toLowerCase() !== String(placeDrillCountry || "").trim().toLowerCase()) return;
      if (!entry.slug) return;
      if (!stationMap.has(entry.slug)) {
        stationMap.set(entry.slug, {
          slug: entry.slug,
          label: stationLabelBySlug(entry.slug),
          previewSources: [],
        });
      }
      if (entry.src) stationMap.get(entry.slug).previewSources.push(entry.src);
    });

    const cards = Array.from(stationMap.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `place:${placeDrillCountry}:station:${item.slug}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-place-card="${esc(item.slug)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.label)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.label)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");

    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = stationMap.size === 0 ? "block" : "none";
  }

  function renderPlaceMaterialDrillCards() {
    const materialMap = new Map();
    allPhotoEntries
      .filter((entry) => String(entry?.country || "").trim().toLowerCase() === String(placeDrillCountry || "").trim().toLowerCase())
      .filter((entry) => entry.slug === placeDrillStation)
      .forEach((entry) => {
        entry.leadMaterialFacets.forEach((facet) => {
          const key = facet.key || "unknown";
          if (!materialMap.has(key)) {
            materialMap.set(key, {
              key,
              label: facet.label || key,
              previewSources: [],
            });
          }
          if (entry.src) materialMap.get(key).previewSources.push(entry.src);
        });
      });

    const cards = Array.from(materialMap.values())
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `place:${placeDrillCountry}:${placeDrillStation}:material:${item.key}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-place-material-card="${esc(item.key)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.label)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.label)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");

    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = materialMap.size === 0 ? "block" : "none";
  }

  function renderPlaceNumberDrillCards() {
    const numberMap = new Map();
    allPhotoEntries
      .filter((entry) => String(entry?.country || "").trim().toLowerCase() === String(placeDrillCountry || "").trim().toLowerCase())
      .filter((entry) => entry.slug === placeDrillStation)
      .filter((entry) => entry.leadMaterialFacets.some((f) => f.key === placeDrillMaterial))
      .forEach((entry) => {
        const number = String(entry.leadPowerNumber || "").trim();
        if (!number) return;
        if (!numberMap.has(number)) {
          numberMap.set(number, {
            number,
            previewSources: [],
            leadLabel: number,
          });
        }
        if (entry.src) numberMap.get(number).previewSources.push(entry.src);
      });

    const cards = Array.from(numberMap.values())
      .sort((a, b) => trainOrderValue(a.number) - trainOrderValue(b.number))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `place:${placeDrillCountry}:${placeDrillStation}:${placeDrillMaterial}:number:${item.number}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-place-number-card="${esc(item.number)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.leadLabel)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.leadLabel)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");

    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = numberMap.size === 0 ? "block" : "none";
  }

  function placeMaterialHasAnyNumber() {
    return allPhotoEntries
      .filter((entry) => String(entry?.country || "").trim().toLowerCase() === String(placeDrillCountry || "").trim().toLowerCase())
      .filter((entry) => entry.slug === placeDrillStation)
      .filter((entry) => entry.leadMaterialFacets.some((f) => f.key === placeDrillMaterial))
      .some((entry) => String(entry.leadPowerNumber || "").trim() !== "");
  }

  function renderPlacePhotoCards() {
    const entries = allPhotoEntries.filter((entry) => {
      const countryOk = String(entry?.country || "").trim().toLowerCase() === String(placeDrillCountry || "").trim().toLowerCase();
      const stationOk = entry.slug === placeDrillStation;
      const materialOk = entry.leadMaterialFacets.some((f) => f.key === placeDrillMaterial);
      const numberOk =
        !String(placeDrillNumber || "").trim() ||
        String(entry.leadPowerNumber || "") === String(placeDrillNumber || "");
      return countryOk && stationOk && materialOk && numberOk;
    });

    const grouped = Array.from(
      new Map(entries.map((entry) => [`${entry.slug}::${entry.index}`, entry])).values(),
    )
      .sort((a, b) => {
        const aLead = trainOrderValue(a.leadPowerLabel || a.numbers || "");
        const bLead = trainOrderValue(b.leadPowerLabel || b.numbers || "");
        if (aLead !== bLead) return aLead - bLead;
        return String(a.leadPowerLabel || a.alt || "").localeCompare(String(b.leadPowerLabel || b.alt || ""));
      });

    grid.innerHTML = grouped
      .map((photo) => {
        const operatorBadges = String(photo.operator || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean)
          .map(
            (label) =>
              `<span class="station-operator-badge station-operator-badge-link" role="button" tabindex="0" data-photo-operator="${esc(normalizeFacetKey(label))}">${esc(label)}</span>`,
          )
          .join("");
        const operatorBadge = operatorBadges
          ? `<div class="station-operator-stack">${operatorBadges}</div>`
          : "";
        const displayNumber = String(photo.leadPowerNumber || "").trim();
        const leadMeta = displayNumber
          ? `<div class="station-meta"><span class="station-meta-chip">${esc(displayNumber)}</span></div>`
          : "";
        const title = String(displayNumber || photo.leadPowerLabel || photo.alt || "").trim();
        const stationName = String(photo.stationName || "").trim();
        const date = String(photo.date || "").trim();
        const photographer = String(photo.photographer || "").trim();
        const avatarSrc = getProfileAvatarForUser(photographer);
        const avatarAlt = photographer ? `Profile photo of ${photographer}` : "Profile photo";
        const metaRow = [stationName, date].filter(Boolean).join(" � ");

        return `
          <button
            class="photo-card station-photo-card station-photo-card-detailed photo-search-result"
            type="button"
            data-series-key="${esc(photo.seriesKey)}"
            data-photo-index="${photo.index}"
            data-photo-slug="${esc(photo.slug)}"
          >
            ${operatorBadge}
            ${buildPhotographerBadge(photo.photographer)}
            <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
            ${leadMeta}
            <div class="station-photo-info">
              <div class="station-photo-info-title">${esc(title)}</div>
              ${metaRow ? `<div class="station-photo-info-meta">${esc(metaRow)}</div>` : ""}
              <div class="station-photo-info-footer">
                <img class="station-photo-avatar" loading="lazy" src="${esc(avatarSrc)}" alt="${esc(avatarAlt)}" />
                <div class="station-photo-info-user">${esc(photographer)}</div>
              </div>
            </div>
          </button>
        `;
      })
      .join("");

    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = grouped.length === 0 ? "block" : "none";
  }

  function renderCompanyPhotoCards() {
    const entries = allPhotoEntries.filter((entry) => {
      const opOk = normalizeFacetKey(firstOperatorLabel(entry)) === companyDrillOperator;
      const matOk = entry.leadMaterialFacets.some((f) => f.key === companyDrillMaterial);
      const numOk = String(entry.leadPowerNumber || "") === String(companyDrillNumber || "");
      return opOk && matOk && numOk;
    });
    const grouped = Array.from(
      new Map(entries.map((entry) => [entry.seriesKey, entry])).values(),
    )
      .map((entry) => {
        const seriesPool = (photoSeriesGroups.get(entry.seriesKey) || []).slice();
        if (seriesPool.length === 0) return entry;
        const mainPhoto =
          seriesPool.find((photo) => photo.explicitIsMain === true) ||
          seriesPool.find((photo) => photo.explicitIsMain !== false) ||
          seriesPool[0];
        return mainPhoto || entry;
      })
      .sort((a, b) => {
        const aLead = trainOrderValue(a.leadPowerLabel || a.numbers || "");
        const bLead = trainOrderValue(b.leadPowerLabel || b.numbers || "");
        if (aLead !== bLead) return aLead - bLead;
        return String(a.leadPowerLabel || a.alt || "").localeCompare(String(b.leadPowerLabel || b.alt || ""));
      });
    grid.innerHTML = grouped
      .map((photo) => {
        const operatorBadges = String(photo.operator || "")
          .split(",")
          .map((label) => label.trim())
          .filter(Boolean)
          .map(
            (label) =>
              `<span class="station-operator-badge station-operator-badge-link" role="button" tabindex="0" data-photo-operator="${esc(normalizeFacetKey(label))}">${esc(label)}</span>`,
          )
          .join("");
        const operatorBadge = operatorBadges
          ? `<div class="station-operator-stack">${operatorBadges}</div>`
          : "";
        const displayNumber = String(photo.leadPowerNumber || "").trim();
        const leadMeta = displayNumber
          ? `<div class="station-meta"><span class="station-meta-chip">${esc(displayNumber)}</span></div>`
          : "";
        const title = String(displayNumber || photo.leadPowerLabel || photo.alt || "").trim();
        const stationName = String(photo.stationName || "").trim();
        const date = String(photo.date || "").trim();
        const photographer = String(photo.photographer || "").trim();
        const avatarSrc = getProfileAvatarForUser(photographer);
        const avatarAlt = photographer ? `Profile photo of ${photographer}` : "Profile photo";
        const metaRow = [stationName, date].filter(Boolean).join(" � ");

        return `
          <button
            class="photo-card station-photo-card station-photo-card-detailed photo-search-result"
            type="button"
            data-series-key="${esc(photo.seriesKey)}"
            data-photo-index="${photo.index}"
            data-photo-slug="${esc(photo.slug)}"
          >
            ${operatorBadge}
            ${buildPhotographerBadge(photo.photographer)}
            <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
            ${leadMeta}
            <div class="station-photo-info">
              <div class="station-photo-info-title">${esc(title)}</div>
              ${metaRow ? `<div class="station-photo-info-meta">${esc(metaRow)}</div>` : ""}
              <div class="station-photo-info-footer">
                <img class="station-photo-avatar" loading="lazy" src="${esc(avatarSrc)}" alt="${esc(avatarAlt)}" />
                <div class="station-photo-info-user">${esc(photographer)}</div>
              </div>
            </div>
          </button>
        `;
      })
      .join("");
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = grouped.length === 0 ? "block" : "none";
  }

  function renderCompanyNumberDrillCards() {
    const numberMap = new Map();
    allPhotoEntries
      .filter((entry) => normalizeFacetKey(firstOperatorLabel(entry)) === companyDrillOperator)
      .filter((entry) => entry.leadMaterialFacets.some((f) => f.key === companyDrillMaterial))
      .forEach((entry) => {
        const number = String(entry.leadPowerNumber || "").trim();
        if (!number) return;
        if (!numberMap.has(number)) {
          numberMap.set(number, {
            number,
            previewSources: [],
            leadLabel: number,
          });
        }
        if (entry.src) numberMap.get(number).previewSources.push(entry.src);
      });

    const cards = Array.from(numberMap.values())
      .sort((a, b) => trainOrderValue(a.number) - trainOrderValue(b.number))
      .map(
        (item) => {
          const previewSrc = getRotatingPreviewSrc(
            `company:${companyDrillOperator}:${companyDrillMaterial}:number:${item.number}`,
            item.previewSources,
          );
          return `
          <button class="photo-card photo-search-result" type="button" data-company-number-card="${esc(item.number)}">
            <img loading="lazy" src="${esc(previewSrc)}" alt="${esc(item.leadLabel)}" />
            <div class="overlay" style="opacity:1;background:linear-gradient(180deg,rgba(0,0,0,.38),rgba(0,0,0,.52));color:#fff;">
              <h3>${esc(item.leadLabel)}</h3>
            </div>
          </button>
        `;
        },
      )
      .join("");

    grid.innerHTML = cards;
    prepareImageFallbacks(grid);
    if (noResults) noResults.style.display = numberMap.size === 0 ? "block" : "none";
  }

  function applyFilters(pushHistory = false) {
    const queryTerms = normalizeSearchValue(activeQuery)
      .split(/\s+/)
      .filter(Boolean);

    if (activeSortMode === "place") {
      if (queryTerms.length > 0) {
        const filtered = allPhotoEntries.filter((entry) => {
          if (!matchesSearchTerms(entry.search, queryTerms)) return false;
          if (placeDrillCountry && String(entry.country || "") !== String(placeDrillCountry || "")) return false;
          if (placeDrillStation && entry.slug !== placeDrillStation) return false;
          if (placeDrillMaterial && !entry.leadMaterialFacets.some((f) => f.key === placeDrillMaterial)) return false;
          if (placeDrillNumber && String(entry.leadPowerNumber || "") !== String(placeDrillNumber || "")) return false;
          return true;
        });
        const grouped = Array.from(new Map(filtered.map((entry) => [entry.seriesKey, entry])).values());
        grid.innerHTML = grouped
          .map(
            (photo) => `
              <button
                class="photo-card photo-search-result"
                type="button"
                data-series-key="${esc(photo.seriesKey)}"
                data-photo-index="${photo.index}"
              data-photo-slug="${esc(photo.slug)}"
            >
                ${buildPhotographerBadge(photo.photographer)}
                <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
                <div class="overlay"><h3>${esc(photo.leadPowerLabel || photo.alt || "")}</h3></div>
              </button>
            `,
          )
          .join("");
        prepareImageFallbacks(grid);
        if (noResults) noResults.style.display = grouped.length === 0 ? "block" : "none";
        grid.classList.toggle("has-few", false);
        if (mapSection) mapSection.style.display = "none";
        updateBreadcrumbs();
        updatePhotosPageUiState();
        persistSortState(pushHistory);
        return;
      }
      if (!placeDrillCountry) {
        renderPlaceCountryDrillCards();
      } else if (!placeDrillStation) {
        renderPlaceDrillCards();
      } else if (!placeDrillMaterial) {
        renderPlaceMaterialDrillCards();
      } else if (!placeDrillNumber) {
        if (placeMaterialHasAnyNumber()) {
          renderPlaceNumberDrillCards();
        } else {
          renderPlacePhotoCards();
        }
      } else {
        renderPlacePhotoCards();
      }
      grid.classList.toggle("has-few", false);
      if (mapSection) mapSection.style.display = "none";
      updateBreadcrumbs();
      updatePhotosPageUiState();
      persistSortState(pushHistory);
      return;
    }

    if (activeSortMode === "company") {
      if (queryTerms.length > 0) {
        const filtered = allPhotoEntries.filter((entry) => {
          if (!matchesSearchTerms(entry.search, queryTerms)) return false;
          if (companyDrillOperator && normalizeFacetKey(firstOperatorLabel(entry)) !== companyDrillOperator) return false;
          if (companyDrillMaterial && !entry.leadMaterialFacets.some((f) => f.key === companyDrillMaterial)) return false;
          if (companyDrillNumber && String(entry.leadPowerNumber || "") !== String(companyDrillNumber || "")) return false;
          return true;
        });
        const grouped = Array.from(new Map(filtered.map((entry) => [entry.seriesKey, entry])).values());
        grid.innerHTML = grouped
          .map(
            (photo) => `
              <button
                class="photo-card photo-search-result"
                type="button"
                data-series-key="${esc(photo.seriesKey)}"
                data-photo-index="${photo.index}"
              data-photo-slug="${esc(photo.slug)}"
            >
                ${buildPhotographerBadge(photo.photographer)}
                <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
                <div class="overlay"><h3>${esc(photo.leadPowerLabel || photo.alt || "")}</h3></div>
              </button>
            `,
          )
          .join("");
        prepareImageFallbacks(grid);
        if (noResults) noResults.style.display = grouped.length === 0 ? "block" : "none";
        grid.classList.toggle("has-few", false);
        if (mapSection) mapSection.style.display = "none";
        updateBreadcrumbs();
        updatePhotosPageUiState();
        persistSortState(pushHistory);
        return;
      }
      if (!companyDrillOperator) {
        renderOperatorDrillCards();
      } else if (!companyDrillMaterial) {
        renderMaterialDrillCards();
      } else if (!companyDrillNumber) {
        renderCompanyNumberDrillCards();
      } else {
        renderCompanyPhotoCards();
      }
      grid.classList.toggle("has-few", false);
      if (mapSection) mapSection.style.display = "none";
      updateBreadcrumbs();
      updatePhotosPageUiState();
      persistSortState(pushHistory);
      return;
    }

    let visibleCount = 0;
    const usePhotoResults =
      queryTerms.length > 0 ||
      activeOperatorFilter !== "all" ||
      activeMaterialFilter !== "all";

    if (usePhotoResults) {
      const matchingPhotos = allPhotoEntries.filter((photo) => {
        const countryMatch = activeFilter === "all" || photo.country === activeFilter;
        const operatorMatch =
          activeOperatorFilter === "all" ||
          photo.operatorKeys.includes(activeOperatorFilter);
        const materialMatch =
          activeMaterialFilter === "all" ||
          photo.materialFacets.some((facet) => facet.key === activeMaterialFilter);
        const queryMatch =
          queryTerms.length === 0 ||
          matchesSearchTerms(photo.search, queryTerms);
        return countryMatch && operatorMatch && materialMatch && queryMatch;
      });

      const matchingSeriesKeys = Array.from(
        new Set(matchingPhotos.map((photo) => photo.seriesKey)),
      );
      const groupedResults = matchingSeriesKeys
        .map((seriesKey) => {
          const group = photoSeriesGroups.get(seriesKey) || [];
          const explicitMains = group.filter((photo) => photo.explicitIsMain === true);
          return (
            explicitMains[0] ||
            group.find((photo) => photo.explicitIsMain !== false) ||
            group[0] ||
            null
          );
        })
        .filter(Boolean);

      grid.innerHTML = groupedResults
        .map(
          (photo) => `
            <button
              class="photo-card photo-search-result"
              type="button"
              data-series-key="${esc(photo.seriesKey)}"
              data-photo-index="${photo.index}"
              data-photo-slug="${esc(photo.slug)}"
              data-sort-place="${esc(photo.stationName || "")}"
              data-sort-company="${esc(
                String(photo.operator || "")
                  .split(",")
                  .map((part) => part.trim())
                  .filter(Boolean)[0] || "",
              )}"
            >
              ${buildPhotographerBadge(photo.photographer)}
              <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
              <div class="overlay"><h3>${esc(photo.stationName)}</h3></div>
            </button>
          `
        )
        .join("");
      sortVisibleCards();

      visibleCount = groupedResults.length;

      if (noResults) {
        noResults.style.display = visibleCount === 0 ? "block" : "none";
      }

      grid.classList.toggle("has-few", visibleCount <= 2);

      if (mapSection) {
        mapSection.style.display = "none";
      }

      return;
    }

    if (grid.innerHTML !== originalGridHtml) {
      grid.innerHTML = originalGridHtml;
      cardPhotoEntries.clear();
      allPhotoEntries.length = 0;
      photoSeriesGroups.clear();
      Array.from(grid.querySelectorAll(".photo-card")).forEach((card) => {
        hydratePhotoCard(card);
      });
    }

    Array.from(grid.querySelectorAll(".photo-card")).forEach((card) => {
      const country = (card.dataset.country || "").toLowerCase();
      const searchText = card.dataset.search || "";
      const defaultHref = card.dataset.defaultHref || card.getAttribute("href") || "";
      const photoEntries = cardPhotoEntries.get(card) || [];
      const operatorKeys = (card.dataset.operators || "").split("|").filter(Boolean);
      const materialKeys = (card.dataset.materials || "").split("|").filter(Boolean);
      const countryMatch = activeFilter === "all" || country === activeFilter;
      const operatorMatch =
        activeOperatorFilter === "all" || operatorKeys.includes(activeOperatorFilter);
      const materialMatch =
        activeMaterialFilter === "all" || materialKeys.includes(activeMaterialFilter);
      const queryMatch =
        queryTerms.length === 0 ||
        matchesSearchTerms(searchText, queryTerms);
      const show = countryMatch && operatorMatch && materialMatch && queryMatch;

      let targetHref = defaultHref;
      if (queryTerms.length > 0) {
        const matchingPhoto = photoEntries.find((entry) =>
          matchesSearchTerms(entry.search, queryTerms),
        );

        if (matchingPhoto) {
          targetHref = matchingPhoto.href;
        }
      }

      card.setAttribute("href", targetHref);

      card.classList.toggle("is-hidden", !show);

      if (show) visibleCount++;
    });

    if (noResults) {
      noResults.style.display = visibleCount === 0 ? "block" : "none";
    }

    grid.classList.toggle("has-few", visibleCount <= 2);

    if (mapSection) {
      const showMap = activeFilter === "all" && queryTerms.length === 0;
      mapSection.style.display = showMap ? "" : "none";

    if (showMap && window.photoStationsMap) {
        window.setTimeout(() => {
          window.photoStationsMap.invalidateSize();
        }, 0);
      }
    }
    sortVisibleCards();
    updateBreadcrumbs();
    updatePhotosPageUiState();
    persistSortState(pushHistory);
  }

  function persistPhotoFilter(value) {
    const url = new URL(window.location.href);

    if (value === "all") {
      url.searchParams.delete("filter");
    } else {
      url.searchParams.set("filter", value);
    }

    window.history.replaceState({}, "", url);
  }

  function persistPhotoSearch(value) {
    const url = new URL(window.location.href);

    if (!value) {
      url.searchParams.delete("q");
    } else {
      url.searchParams.set("q", value);
    }

    window.history.replaceState({}, "", url);
  }

  function persistFacetParam(name, value) {
    const url = new URL(window.location.href);

    if (value === "all") {
      url.searchParams.delete(name);
    } else {
      url.searchParams.set(name, value);
    }

    window.history.replaceState({}, "", url);
  }

  function persistSortState(pushHistory = false) {
    const url = new URL(window.location.href);

    if (activeSortMode === "company") {
      url.searchParams.set("sort", "company");
    } else {
      url.searchParams.set("sort", "place");
    }

    if (companyDrillOperator) url.searchParams.set("company", companyDrillOperator);
    else url.searchParams.delete("company");

    if (companyDrillMaterial) url.searchParams.set("company_material", companyDrillMaterial);
    else url.searchParams.delete("company_material");
    if (companyDrillNumber) url.searchParams.set("company_number", companyDrillNumber);
    else url.searchParams.delete("company_number");

    if (placeDrillCountry) url.searchParams.set("place_country", placeDrillCountry);
    else url.searchParams.delete("place_country");

    if (placeDrillStation) url.searchParams.set("place", placeDrillStation);
    else url.searchParams.delete("place");

    if (placeDrillMaterial) url.searchParams.set("place_material", placeDrillMaterial);
    else url.searchParams.delete("place_material");

    if (placeDrillNumber) url.searchParams.set("place_number", placeDrillNumber);
    else url.searchParams.delete("place_number");

    if (pushHistory) {
      const next = url.toString();
      const current = window.location.href;
      if (next !== current) {
        window.history.pushState({}, "", url);
        return;
      }
    }
    window.history.replaceState({}, "", url);
  }

  function renderFacetButtons(container, options, activeValue, dataAttr) {
    if (!container) return;

    container.innerHTML = [
      `<button class="filter-btn${activeValue === "all" ? " active" : ""}" type="button" ${dataAttr}="all">All</button>`,
      ...options.map(
        (option) =>
          `<button class="filter-btn${activeValue === option.key ? " active" : ""}" type="button" ${dataAttr}="${esc(option.key)}">${esc(option.label)}</button>`,
      ),
    ].join("");
  }

  const operatorOptions = Array.from(
    new Map(
      allPhotoEntries
        .flatMap((entry) =>
          entry.operator
            .split(",")
            .map((label) => label.trim())
            .filter(Boolean)
            .map((label) => [normalizeFacetKey(label), { key: normalizeFacetKey(label), label }]),
        ),
    ).values(),
  ).sort((a, b) => a.label.localeCompare(b.label));

  const materialLookup = new Map();
  allPhotoEntries.forEach((entry) => {
    entry.materialFacets.forEach((facet) => {
      if (facet?.key && facet?.label && !materialLookup.has(facet.key)) {
        materialLookup.set(facet.key, facet);
      }
    });
  });

  const sortedMaterialOptions = Array.from(materialLookup.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  renderFacetButtons(operatorFilters, operatorOptions, activeOperatorFilter, "data-operator-filter");
  renderFacetButtons(materialFilters, sortedMaterialOptions, activeMaterialFilter, "data-material-filter");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = (btn.dataset.filter || "all").toLowerCase();
      activeFilter = value;
      setActiveButton(value);
      applyFilters();
      persistPhotoFilter(value);
      persistPhotoSearch(activeQuery);
      persistFacetParam("operator", activeOperatorFilter);
      persistFacetParam("material", activeMaterialFilter);
    });
  });

  operatorFilters?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-operator-filter]");
    if (!btn) return;
    activeOperatorFilter = (btn.dataset.operatorFilter || "all").toLowerCase();
    renderFacetButtons(operatorFilters, operatorOptions, activeOperatorFilter, "data-operator-filter");
    setActiveButton(activeFilter);
    applyFilters();
    persistPhotoFilter(activeFilter);
    persistPhotoSearch(activeQuery);
    persistFacetParam("operator", activeOperatorFilter);
    persistFacetParam("material", activeMaterialFilter);
  });

  materialFilters?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-material-filter]");
    if (!btn) return;
    activeMaterialFilter = (btn.dataset.materialFilter || "all").toLowerCase();
    renderFacetButtons(materialFilters, sortedMaterialOptions, activeMaterialFilter, "data-material-filter");
    setActiveButton(activeFilter);
    applyFilters();
    persistPhotoFilter(activeFilter);
    persistPhotoSearch(activeQuery);
    persistFacetParam("operator", activeOperatorFilter);
    persistFacetParam("material", activeMaterialFilter);
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      activeQuery = searchInput.value.trim();
      applyFilters();
      persistPhotoFilter(activeFilter);
      persistPhotoSearch(activeQuery);
      persistFacetParam("operator", activeOperatorFilter);
      persistFacetParam("material", activeMaterialFilter);
    });
  }

  sortByPlaceBtn?.addEventListener("click", () => {
    activeSortMode = "place";
    companyDrillOperator = "";
    companyDrillMaterial = "";
    companyDrillNumber = "";
    placeDrillCountry = "";
    placeDrillStation = "";
    placeDrillMaterial = "";
    placeDrillNumber = "";
    updateSortButtons();
    renderPlaceDrillCards();
    applyFilters(true);
  });

  sortByCompanyBtn?.addEventListener("click", () => {
    activeSortMode = "company";
    companyDrillOperator = "";
    companyDrillMaterial = "";
    companyDrillNumber = "";
    placeDrillCountry = "";
    placeDrillStation = "";
    placeDrillMaterial = "";
    placeDrillNumber = "";
    updateSortButtons();
    applyFilters(true);
  });

  breadcrumbBackBtn?.addEventListener("click", () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    if (activeSortMode === "company") {
      if (companyDrillNumber) companyDrillNumber = "";
      else if (companyDrillMaterial) companyDrillMaterial = "";
      else if (companyDrillOperator) companyDrillOperator = "";
    } else if (activeSortMode === "place") {
      if (placeDrillNumber) placeDrillNumber = "";
      else if (placeDrillMaterial) placeDrillMaterial = "";
      else if (placeDrillStation) placeDrillStation = "";
      else if (placeDrillCountry) placeDrillCountry = "";
    }
    applyFilters(true);
  });

  breadcrumb?.addEventListener("click", (event) => {
    const crumb = event.target.closest("[data-crumb-level]");
    if (!crumb) return;
    const level = String(crumb.dataset.crumbLevel || "");

    if (level === "company-root") {
      companyDrillOperator = "";
      companyDrillMaterial = "";
      companyDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "company-operator") {
      companyDrillMaterial = "";
      companyDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "company-material") {
      companyDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "place-root") {
      placeDrillCountry = "";
      placeDrillStation = "";
      placeDrillMaterial = "";
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "place-country") {
      placeDrillStation = "";
      placeDrillMaterial = "";
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "place-station") {
      placeDrillMaterial = "";
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    if (level === "place-material") {
      placeDrillNumber = "";
      applyFilters(true);
    }
  });

  function applyStateFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const queryFilter = (urlParams.get("filter") || "all").toLowerCase();
    const querySearch = (urlParams.get("q") || "").trim();
    const queryOperator = (urlParams.get("operator") || "all").toLowerCase();
    const queryMaterial = (urlParams.get("material") || "all").toLowerCase();
    const querySort = (urlParams.get("sort") || "place").toLowerCase();
    const queryCompany = (urlParams.get("company") || "").trim().toLowerCase();
    const queryCompanyMaterial = (urlParams.get("company_material") || "").trim().toLowerCase();
    const queryCompanyNumber = String(urlParams.get("company_number") || "").trim();
    const queryPlaceCountry = (urlParams.get("place_country") || "").trim().toLowerCase();
    const queryPlace = (urlParams.get("place") || "").trim().toLowerCase();
    const queryPlaceMaterial = (urlParams.get("place_material") || "").trim().toLowerCase();
    const queryPlaceNumber = String(urlParams.get("place_number") || "").trim();

    const initialFilter = availableFilters.has(queryFilter) ? queryFilter : "all";
    activeFilter = initialFilter;
    activeOperatorFilter =
      operatorFilters &&
      (queryOperator === "all" || operatorOptions.some((option) => option.key === queryOperator))
        ? queryOperator
        : "all";
    activeMaterialFilter =
      materialFilters &&
      (queryMaterial === "all" || sortedMaterialOptions.some((option) => option.key === queryMaterial))
        ? queryMaterial
        : "all";
    activeQuery = querySearch;
    activeSortMode = querySort === "company" ? "company" : "place";
    companyDrillOperator = activeSortMode === "company" ? queryCompany : "";
    companyDrillMaterial = activeSortMode === "company" ? queryCompanyMaterial : "";
    companyDrillNumber = activeSortMode === "company" ? queryCompanyNumber : "";
    placeDrillCountry = activeSortMode === "place" ? queryPlaceCountry : "";
    placeDrillStation = activeSortMode === "place" ? queryPlace : "";
    placeDrillMaterial = activeSortMode === "place" ? queryPlaceMaterial : "";
    placeDrillNumber = activeSortMode === "place" ? queryPlaceNumber : "";
    if (activeSortMode === "place" && !placeDrillCountry && placeDrillStation) {
      const station = stationData[String(placeDrillStation || "").toLowerCase()];
      const derivedCountry = String(station?.country || "").trim().toLowerCase();
      if (derivedCountry) placeDrillCountry = derivedCountry;
    }

    if (searchInput) searchInput.value = activeQuery;
    renderFacetButtons(operatorFilters, operatorOptions, activeOperatorFilter, "data-operator-filter");
    renderFacetButtons(materialFilters, sortedMaterialOptions, activeMaterialFilter, "data-material-filter");
    updateSortButtons();
    setActiveButton(initialFilter);
    applyFilters(false);
  }

  applyStateFromUrl();

  window.addEventListener("popstate", () => {
    applyStateFromUrl();
  });

  const urlParams = new URLSearchParams(window.location.search);
  const lbOpen = (urlParams.get("lb") || "") === "1";
  const lbSlug = String(urlParams.get("lb_slug") || "").trim().toLowerCase();
  const lbIndex = Number(urlParams.get("lb_idx") || -1);
  const lbSeries = String(urlParams.get("lb_series") || "").trim();
  if (lbOpen) {
    const fromSeries = (photoSeriesGroups.get(lbSeries) || []).find(
      (item) => item.slug === lbSlug && item.index === lbIndex,
    );
    const fallback = allPhotoEntries.find(
      (item) => item.slug === lbSlug && item.index === lbIndex,
    );
    const toOpen = fromSeries || fallback || null;
    if (toOpen) {
      window.requestAnimationFrame(() => openSearchLightboxEntry(toOpen));
    }
  }

  const savedScroll = Number(sessionStorage.getItem(scrollStateKey) || "0");
  if (Number.isFinite(savedScroll) && savedScroll > 0) {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: savedScroll, behavior: "auto" });
    });
  }

  let scrollWriteTimer = null;
  function persistScrollPosition() {
    sessionStorage.setItem(scrollStateKey, String(Math.max(0, Math.round(window.scrollY || 0))));
  }

  window.addEventListener("scroll", () => {
    if (scrollWriteTimer) window.clearTimeout(scrollWriteTimer);
    scrollWriteTimer = window.setTimeout(persistScrollPosition, 80);
  }, { passive: true });

  window.addEventListener("beforeunload", persistScrollPosition);

  grid.addEventListener("click", (e) => {
    const photoOperatorBadge = e.target.closest("[data-photo-operator]");
    if (photoOperatorBadge) {
      e.preventDefault();
      e.stopPropagation();
      const operatorKey = String(photoOperatorBadge.dataset.photoOperator || "").trim().toLowerCase();
      if (!operatorKey) return;
      activeSortMode = "company";
      companyDrillOperator = operatorKey;
      companyDrillMaterial = "";
      companyDrillNumber = "";
      placeDrillCountry = "";
      placeDrillStation = "";
      placeDrillMaterial = "";
      placeDrillNumber = "";
      updateSortButtons();
      applyFilters(true);
      return;
    }

    const placeCountryCard = e.target.closest("[data-place-country-card]");
    if (placeCountryCard) {
      placeDrillCountry = String(placeCountryCard.dataset.placeCountryCard || "");
      placeDrillStation = "";
      placeDrillMaterial = "";
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    const placeCard = e.target.closest("[data-place-card]");
    if (placeCard) {
      placeDrillStation = String(placeCard.dataset.placeCard || "");
      if (!placeDrillCountry && placeDrillStation) {
        const station = stationData[String(placeDrillStation || "").toLowerCase()];
        placeDrillCountry = String(station?.country || "").trim().toLowerCase();
      }
      placeDrillMaterial = "";
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    const placeMaterialCard = e.target.closest("[data-place-material-card]");
    if (placeMaterialCard) {
      placeDrillMaterial = String(placeMaterialCard.dataset.placeMaterialCard || "");
      placeDrillNumber = "";
      applyFilters(true);
      return;
    }

    const placeNumberCard = e.target.closest("[data-place-number-card]");
    if (placeNumberCard) {
      placeDrillNumber = String(placeNumberCard.dataset.placeNumberCard || "");
      applyFilters(true);
      return;
    }

    const companyCard = e.target.closest("[data-company-card]");
    if (companyCard) {
      companyDrillOperator = String(companyCard.dataset.companyCard || "");
      companyDrillMaterial = "";
      companyDrillNumber = "";
      applyFilters(true);
      return;
    }

    const materialCard = e.target.closest("[data-material-card]");
    if (materialCard) {
      companyDrillMaterial = String(materialCard.dataset.materialCard || "");
      companyDrillNumber = "";
      applyFilters(true);
      return;
    }

    const companyNumberCard = e.target.closest("[data-company-number-card]");
    if (companyNumberCard) {
      companyDrillNumber = String(companyNumberCard.dataset.companyNumberCard || "");
      applyFilters(true);
      return;
    }

    const searchCard = e.target.closest(".photo-search-result");
    if (!searchCard) return;

    const slug = String(searchCard.dataset.photoSlug || "").trim().toLowerCase();
    const index = Number(searchCard.dataset.photoIndex || 0);
    const entry = (photoSeriesGroups.get(searchCard.dataset.seriesKey || "") || []).find(
      (photo) => photo.slug === slug && photo.index === index,
    );

    if (!entry) return;

    const hasQuery = String(activeQuery || "").trim().length > 0;
    if (hasQuery) {
      if (activeSortMode === "place") {
        const targetCountry = String(entry.country || "").trim().toLowerCase();
        const targetStation = String(entry.slug || "");
        const leadMaterialKey = String(entry.leadMaterialFacets?.[0]?.key || "");
        const targetNumber = String(entry.leadPowerNumber || "");
        const alreadyAtTarget =
          placeDrillCountry === targetCountry &&
          placeDrillStation === targetStation &&
          placeDrillMaterial === leadMaterialKey &&
          String(placeDrillNumber || "") === targetNumber;
        if (!alreadyAtTarget) {
          placeDrillCountry = targetCountry;
          placeDrillStation = targetStation;
          placeDrillMaterial = leadMaterialKey;
          placeDrillNumber = targetNumber;
          applyFilters(true);
          return;
        }
      }
      if (activeSortMode === "company") {
        const targetOperator = normalizeFacetKey(firstOperatorLabel(entry));
        const leadMaterialKey = String(entry.leadMaterialFacets?.[0]?.key || "");
        const targetNumber = String(entry.leadPowerNumber || "");
        const alreadyAtTarget =
          companyDrillOperator === targetOperator &&
          companyDrillMaterial === leadMaterialKey &&
          String(companyDrillNumber || "") === targetNumber;
        if (!alreadyAtTarget) {
          companyDrillOperator = targetOperator;
          companyDrillMaterial = leadMaterialKey;
          companyDrillNumber = targetNumber;
          applyFilters(true);
          return;
        }
      }
    }

    openSearchLightboxEntry(entry);
  });
})();

(async function initLatestHomePhoto() {
  const link = document.getElementById("latestPhotoLink");
  const image = document.getElementById("latestPhotoImage");
  const caption = document.getElementById("latestPhotoCaption");
  const overlayText = document.getElementById("latestPhotoOverlayText");
  const stationData = window.STATIONS_DATA;

  if (
    !link ||
    !image ||
    !caption ||
    !overlayText ||
    !stationData ||
    typeof stationData !== "object"
  ) {
    return;
  }

  await mergeApprovedSubmissionsIntoStationData(stationData);

  const monthMap = {
    january: 0,
    februari: 1,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    juni: 5,
    june: 5,
    july: 6,
    augustus: 7,
    august: 7,
    september: 8,
    oktober: 9,
    october: 9,
    november: 10,
    december: 11,
  };

  function parsePhotoDate(value) {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const numericMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
    if (numericMatch) {
      const day = Number(numericMatch[1]);
      const month = Number(numericMatch[2]) - 1;
      const rawYear = String(numericMatch[3] || "");
      const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
      const dt = new Date(year, month, day);
      if (
        dt.getFullYear() === year &&
        dt.getMonth() === month &&
        dt.getDate() === day
      ) {
        return dt;
      }
      return null;
    }

    const match = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = monthMap[match[2].toLowerCase()];
    const year = Number(match[3]);

    if (
      !Number.isInteger(day) ||
      month === undefined ||
      !Number.isInteger(year)
    ) {
      return null;
    }

    return new Date(year, month, day);
  }

  function formatPhotoDate(date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  }

  const allPhotos = Object.entries(stationData).flatMap(([slug, station]) =>
    (station?.photos || []).map((photo, index) => ({
      ...photo,
      stationName: station?.name || photo?.label || "Unknown location",
      stationSlug: slug,
      sourceIndex: index,
      sortIndex: index,
      parsedDate: parsePhotoDate(photo?.date),
    })),
  );

  const latestPhoto = allPhotos
    .filter(
      (photo) =>
        photo.src &&
        photo.parsedDate instanceof Date &&
        !Number.isNaN(photo.parsedDate.getTime()),
    )
    .sort((a, b) => {
      const dateDiff = b.parsedDate.getTime() - a.parsedDate.getTime();
      if (dateDiff !== 0) return dateDiff;
      return a.sortIndex - b.sortIndex;
    })[0];

  if (!latestPhoto) return;

  const stationLink = latestPhoto.stationSlug
    ? `Station.html?slug=${encodeURIComponent(latestPhoto.stationSlug)}`
    : "Photos.html";
  const directPhotoLink =
    latestPhoto.stationSlug && Number.isInteger(latestPhoto.sourceIndex)
      ? `Station.html?slug=${encodeURIComponent(latestPhoto.stationSlug)}&photo=${latestPhoto.sourceIndex}&lightbox=1`
      : stationLink;

  link.href = directPhotoLink;
  link.setAttribute("aria-label", latestPhoto.stationName);
  image.src = latestPhoto.src;
  image.alt = latestPhoto.alt || `${latestPhoto.stationName} featured photo`;
  image.style.objectPosition =
    latestPhoto.stationSlug === "brussels-midi" ? "28% center" : "center";
  overlayText.textContent = latestPhoto.stationName;

  caption.classList.add("latest-photo-line");
  caption.innerHTML = `<span class="latest-photo-tag">Newest upload</span><span class="latest-photo-separator">·</span><a class="latest-photo-link" href="${stationLink}">${latestPhoto.stationName}</a><span class="latest-photo-separator">·</span><span class="latest-photo-date">${formatPhotoDate(latestPhoto.parsedDate)}</span>`;
})();

(function initPhotoMap() {
  let initialized = false;

  function setupPhotoMap() {
    if (initialized) return true;
  const mapEl = document.getElementById("stationsMap");
  const grid = document.getElementById("photoGrid");
  const stationData = window.STATIONS_DATA || {};

    if (!mapEl || !grid || typeof window.L === "undefined") return true;

  const stationCoords = {
    antwerp: [51.2172, 4.4211],
    amsterdam: [52.3791, 4.8994],
    bratislava: [48.1459, 17.1077],
    "brussels-midi": [50.8356, 4.3366],
    duffel: [51.0959, 4.5167],
    eupen: [50.6299, 6.0369],
    hasselt: [50.9307, 5.3325],
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
    vienna: [48.1855, 16.3745],
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
      const coords = slug ? stationData[slug]?.coords || stationCoords[slug] : null;
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

    if (stations.length === 0) return false;

  initialized = true;
  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    zoomControl: true,
  });
  window.photoStationsMap = map;

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
    return true;
  }

  if (!setupPhotoMap()) {
    window.addEventListener("gallery:rendered", setupPhotoMap, { once: true });
  }
})();
(async function initStationPage() {
  const grid = document.getElementById("stationGrid");
  if (!grid) return;

  const title = document.getElementById("stationTitle");
  const subtitle = document.getElementById("stationSubtitle");
  const notFound = document.getElementById("stationNotFound");
  const vehicleFilters = document.getElementById("stationVehicleFilters");

  const allStations = window.STATIONS_DATA || {};
  await mergeApprovedSubmissionsIntoStationData(allStations);
  const slug = canonicalStationSlug(new URLSearchParams(window.location.search).get("slug") || "");
  const requestedPhotoIndex = Number(
    new URLSearchParams(window.location.search).get("photo"),
  );
  const shouldOpenLightbox =
    new URLSearchParams(window.location.search).get("lightbox") === "1";

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

  document.title = `${station.name} - eurorailshots.com`;

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function buildPhotographerBadge(photographer) {
    const name = String(photographer || "").trim();
    return name ? `<span class="station-photographer-badge">By ${esc(name)}</span>` : "";
  }

  function normalizeVehicleType(type, number) {
    const rawType = String(type || "").trim();
    const rawNumber = String(number || "").trim();
    const lowerType = rawType.toLowerCase();
    const typeWithoutCount = lowerType.replace(/^\d+\s*[xÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½]\s*/, "");
    const normalizedType = typeWithoutCount.replace(/\s+/g, " ").trim();
    const compactType = normalizedType.replace(/\s+/g, "");
    const compactNumber = rawNumber.toLowerCase().replace(/\s+/g, "");

    if (!rawType || normalizedType === "unknown") return "";

    if (
      normalizedType === "coradia max" ||
      (normalizedType === "coradia" && compactNumber === "max")
    ) {
      return "coradia-max";
    }

    if (normalizedType.startsWith("hle") || compactType.startsWith("hle")) {
      if (compactNumber.startsWith("13") || compactType === "hle13") return "hle13";
      if (compactNumber.startsWith("17") || compactType === "hle17") return "hle17";
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

    const withoutCount = normalized.replace(/^\d+\s*[xÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½]\s*/i, "");
    const parts = withoutCount.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "";

    if (parts[0] === "stadler" && parts[1]) {
      return `stadler ${parts[1]}`;
    }

    return parts[0];
  }
  function getVehicleFilterLabel(key) {
    const normalizedKey = String(key || "").trim().toLowerCase();
    const familyMatch = normalizedKey.match(/^(am|ar|mw|ms)-?(\d{2,3})$/);
    if (familyMatch) return `${familyMatch[1].toUpperCase()} ${familyMatch[2]}`;
    const brMatch = normalizedKey.match(/^br-?(\d{3})$/);
    if (brMatch) return `BR ${brMatch[1]}`;
    const eMatch = normalizedKey.match(/^e-?(\d{3})$/);
    if (eMatch) return `E ${eMatch[1]}`;
    if (key === "coradia-max") return "Coradia Max";
    if (key === "hle18-19") return "HLE 18/19";
    if (key === "hle13") return "HLE 13";
    if (key === "hle17") return "HLE 17";
    if (key === "hle21") return "HLE 21";
    if (key === "hle27") return "HLE 27";
    if (key === "hle28") return "HLE 28";
    if (key === "hle") return "HLE";
    if (key === "stadler" || key === "stadler flirt") return "FLIRT 3";
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

    const normalizedItems = source
      .map((entry) => {
        const split = splitTrainNumber(entry.train || entry.label || "");
        if (!split.train) return null;
        const filterKey =
          String(entry.filterKey || "").trim().toLowerCase() ||
          normalizeVehicleType(split.train, split.number);
        return {
          train: split.train,
          number: split.number,
          label: composeTrainLabel(split),
          active: entry.active !== false,
          showOnCard: entry.showOnCard !== false,
          separatorAfter: String(entry.separatorAfter || "").trim(),
          filterKey,
          filterLabel: String(entry.filterLabel || "").trim() || getVehicleFilterLabel(filterKey),
          lead: Boolean(entry.lead),
        };
      })
      .filter(Boolean);

    const lead = normalizedItems.find((item) => item?.lead === true) || normalizedItems[0] || null;
    return lead ? [lead] : [];
  }
function formatTagLabel(label) {
    return normalizeVehicleLabel(label).replace(
      /(\d+)\s*x\s*/gi,
      (_, n) => `${n}${String.fromCharCode(215)} `,
    );
  }

  function buildMetaHtml(consist, options = {}) {
    const visibleItems = consist.filter((item) => item.showOnCard !== false);
    const maxVisible =
      Number.isInteger(options.maxVisible) && options.maxVisible > 0
        ? options.maxVisible
        : null;
    const renderedItems = maxVisible ? visibleItems.slice(0, maxVisible) : visibleItems;
    const hasOverflow = maxVisible ? visibleItems.length > maxVisible : false;

    const tagsHtml = renderedItems
      .map((item, index) => {
        const cls = item.active ? "station-meta-chip" : "station-meta-inactive";

        const separatorLabel = String(item.separatorAfter || "").trim();
        const plus =
          index < renderedItems.length - 1
            ? separatorLabel
              ? `<span class="station-meta-separator">${esc(separatorLabel)}</span>`
              : '<span class="station-meta-plus">+</span>'
            : "";

        return `<span class="${cls}">${esc(formatTagLabel(composeTrainLabel(item)))}</span>${plus}`;
      })
      .join("");

    return hasOverflow ? `${tagsHtml}<span class="station-meta-plus">+</span>` : tagsHtml;
  }

  const photos = station.photos.map((photo, sourceIndex) => {
    const consist = normalizeConsist(photo);
    const series = String(photo.series || "").trim().toLowerCase() || `photo-${sourceIndex}`;
    const explicitIsMain = typeof photo.isMain === "boolean" ? photo.isMain : null;

    return {
      id: String(photo.id || "").trim(),
      src: photo.src || "",
      alt: photo.alt || station.name,
      label: photo.label || station.name,
      date: String(photo.date || "").trim(),
      photographer: String(photo.photographer || "").trim(),
      operator: String(photo.operator || "").trim(),
      operatorLabels: String(photo.operator || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      operatorKeys: String(photo.operator || "")
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
      series,
      explicitIsMain,
      consist,
      metaHtml: buildMetaHtml(consist, { maxVisible: 3 }),
      fullMetaHtml: buildMetaHtml(consist),
      sourceIndex,
      filterKeys: Array.from(
        new Set(consist.map((item) => item.filterKey).filter(Boolean)),
      ),
    };
  });

  const seriesGroups = new Map();
  photos.forEach((photo) => {
    if (!seriesGroups.has(photo.series)) seriesGroups.set(photo.series, []);
    seriesGroups.get(photo.series).push(photo);
  });

  const visibleSourceIndexes = new Set();
  seriesGroups.forEach((group) => {
    const explicitMains = group.filter((photo) => photo.explicitIsMain === true);
    if (explicitMains.length > 0) {
      explicitMains.forEach((photo) => visibleSourceIndexes.add(photo.sourceIndex));
      return;
    }

    const firstNonHidden =
      group.find((photo) => photo.explicitIsMain !== false) || group[0];
    if (firstNonHidden) visibleSourceIndexes.add(firstNonHidden.sourceIndex);
  });

  const visiblePhotos = photos.filter((photo) =>
    visibleSourceIndexes.has(photo.sourceIndex),
  );

  const photoBySourceIndex = new Map(
    photos.map((photo) => [photo.sourceIndex, photo]),
  );

  const seriesPools = new Map();
  seriesGroups.forEach((group, key) => {
    seriesPools.set(
      key,
      group.map((photo) => photo.sourceIndex),
    );
  });

  const cardsHtml = visiblePhotos
    .map((photo) => {
      const operatorBadges = photo.operatorLabels
        .map((label) => `<span class="station-operator-badge">${esc(label)}</span>`)
        .join("");

      const operatorBadge = operatorBadges
        ? `<div class="station-operator-stack">${operatorBadges}</div>`
        : "";

      return `
        <div class="photo-card station-photo-card" data-photo-index="${photo.sourceIndex}" data-vehicle-types="${esc(photo.filterKeys.join("|"))}" data-photo-date="${esc(photo.date)}" data-photo-operator="${esc(photo.operatorKeys.join("|"))}">
          ${operatorBadge}
          ${buildPhotographerBadge(photo.photographer)}
          <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
          ${photo.metaHtml ? `<div class="station-meta">${photo.metaHtml}</div>` : ""}
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

  const filterDefinitions = new Map();
  visiblePhotos.forEach((photo) => {
    photo.consist.forEach((item) => {
      if (!item.filterKey) return;
      if (!filterDefinitions.has(item.filterKey)) {
        filterDefinitions.set(
          item.filterKey,
          item.filterLabel || getVehicleFilterLabel(item.filterKey),
        );
      }
    });
  });

  const uniqueVehicleTypes = Array.from(filterDefinitions.keys());

  function persistVehicleFilter(value) {
    const url = new URL(window.location.href);

    if (value === "all") {
      url.searchParams.delete("vehicleFilter");
    } else {
      url.searchParams.set("vehicleFilter", value);
    }

    window.history.replaceState({}, "", url);
  }

  const queryVehicleFilter = (
    new URLSearchParams(window.location.search).get("vehicleFilter") || "all"
  ).toLowerCase();
  const initialVehicleFilter =
    queryVehicleFilter === "all" || filterDefinitions.has(queryVehicleFilter)
      ? queryVehicleFilter
      : "all";

  if (vehicleFilters && visiblePhotos.length > 1 && uniqueVehicleTypes.length > 1) {
    const filtersHtml = [
      '<button class="filter-btn" type="button" data-vehicle-filter="all">All</button>',
      ...uniqueVehicleTypes
        .sort((a, b) => a.localeCompare(b))
        .map(
          (key) =>
            `<button class="filter-btn" type="button" data-vehicle-filter="${esc(key)}">${esc(filterDefinitions.get(key) || getVehicleFilterLabel(key))}</button>`,
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
        persistVehicleFilter(value);
      });
    });

    const initialButton =
      filterButtons.find(
        (btn) =>
          (btn.dataset.vehicleFilter || "all").toLowerCase() === initialVehicleFilter,
      ) || filterButtons[0];

    filterButtons.forEach((b) => b.classList.remove("active"));
    if (initialButton) initialButton.classList.add("active");
  } else if (vehicleFilters) {
    vehicleFilters.innerHTML = "";
    vehicleFilters.style.display = "none";
  }

  applyVehicleFilter(initialVehicleFilter);

  const lightbox = document.createElement("div");
  lightbox.className = "station-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="station-lightbox-close" type="button" aria-label="Close image">&times;</button>
    <div class="station-lightbox-media">
      <button class="station-lightbox-nav prev" type="button" aria-label="Previous photo">&#10094;</button>
      <img src="" alt="" />
      <button class="station-lightbox-nav next" type="button" aria-label="Next photo">&#10095;</button>
      <div class="station-lightbox-operator" aria-hidden="true"></div>
      <div class="station-lightbox-date" aria-hidden="true"></div>
      <div class="station-lightbox-meta" aria-hidden="true"></div>
      <button class="station-lightbox-delete" type="button" id="stationLightboxDeleteBtn" hidden>Delete photo</button>
      <div class="station-lightbox-watermark">&copy; eurorailshots.com</div>
    </div>
    <div class="station-lightbox-panel">
      <div class="station-lightbox-panel-top">
        <h3>Comments</h3>
        <p class="muted" id="stationLightboxCommentsMeta">Join the discussion for this photo.</p>
      </div>
      <a class="btn btn-secondary station-lightbox-submit-link" id="stationLightboxSubmitSimilar" href="../pages/Submit.html">Submit photo of this train</a>
      <div class="station-lightbox-comments" id="stationLightboxCommentsList"></div>
      <form class="login-form" id="stationLightboxCommentForm" novalidate>
        <input
          id="stationLightboxCommentInput"
          name="comment"
          type="text"
          maxlength="240"
          placeholder="Write your comment..."
          required
        />
        <button class="btn btn-primary" type="submit">Post comment</button>
      </form>
      <p class="login-status" id="stationLightboxCommentStatus" role="status" aria-live="polite"></p>
    </div>
  `;
  document.body.appendChild(lightbox);
  const commenterProfileModal = document.createElement("div");
  commenterProfileModal.className = "station-profile-modal";
  commenterProfileModal.setAttribute("aria-hidden", "true");
  commenterProfileModal.innerHTML = `
    <div class="station-profile-card">
      <button class="station-profile-close" type="button" aria-label="Close profile">&times;</button>
      <div class="station-profile-head">
        <img id="stationProfileAvatar" src="../images/default-avatar.svg" alt="Profile avatar" />
        <div>
          <h3 id="stationProfileName">Member</h3>
          <p id="stationProfileUser" class="muted"></p>
        </div>
      </div>
      <div id="stationProfileDetails" class="station-profile-details"></div>
    </div>
  `;
  document.body.appendChild(commenterProfileModal);

  const lightboxImg = lightbox.querySelector(".station-lightbox-media img");
  const lightboxMedia = lightbox.querySelector(".station-lightbox-media");
  const lightboxOperator = lightbox.querySelector(".station-lightbox-operator");
  const lightboxDate = lightbox.querySelector(".station-lightbox-date");
  const lightboxMeta = lightbox.querySelector(".station-lightbox-meta");
  const lightboxDeleteBtn = lightbox.querySelector("#stationLightboxDeleteBtn");
  const lightboxWatermark = lightbox.querySelector(".station-lightbox-watermark");
  const closeBtn = lightbox.querySelector(".station-lightbox-close");
  const prevBtn = lightbox.querySelector(".station-lightbox-nav.prev");
  const nextBtn = lightbox.querySelector(".station-lightbox-nav.next");
  const lightboxCommentsMeta = lightbox.querySelector("#stationLightboxCommentsMeta");
  const lightboxCommentsList = lightbox.querySelector("#stationLightboxCommentsList");
  const lightboxPanel = lightbox.querySelector(".station-lightbox-panel");
  const lightboxCommentForm = lightbox.querySelector("#stationLightboxCommentForm");
  const lightboxCommentInput = lightbox.querySelector("#stationLightboxCommentInput");
  const lightboxCommentStatus = lightbox.querySelector("#stationLightboxCommentStatus");
  const lightboxSubmitSimilar = lightbox.querySelector("#stationLightboxSubmitSimilar");
  const stationProfileAvatar = commenterProfileModal.querySelector("#stationProfileAvatar");
  const stationProfileName = commenterProfileModal.querySelector("#stationProfileName");
  const stationProfileUser = commenterProfileModal.querySelector("#stationProfileUser");
  const stationProfileDetails = commenterProfileModal.querySelector("#stationProfileDetails");
  const stationProfileClose = commenterProfileModal.querySelector(".station-profile-close");
  let currentPhotoIndex = 0;
  let currentSeriesPool = [];
  let currentSeriesPosition = 0;

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
  }

  function syncLightboxPanelWidth() {
    if (!lightboxPanel || !lightboxImg || !lightboxMedia) return;
    const width = Math.round(lightboxMedia.getBoundingClientRect().width || 0);
    if (width > 0) {
      lightboxPanel.style.width = `${width}px`;
      lightboxPanel.style.maxWidth = "92vw";
    }
  }

  function getExpectedLightboxWidth(referenceImg) {
    const ratio =
      (referenceImg?.naturalWidth || 0) > 0 && (referenceImg?.naturalHeight || 0) > 0
        ? referenceImg.naturalWidth / referenceImg.naturalHeight
        : 16 / 10;
    const viewportW = window.innerWidth || 1280;
    const viewportH = window.innerHeight || 800;
    const maxW = Math.min(1200, viewportW * 0.92);
    const maxH = Math.max(320, viewportH - 230);
    return Math.round(Math.min(maxW, maxH * ratio));
  }

  function applyPredictedPanelWidth(referenceImg) {
    if (!lightboxPanel) return;
    const predicted = getExpectedLightboxWidth(referenceImg);
    if (predicted > 0) {
      lightboxPanel.style.width = `${predicted}px`;
      lightboxPanel.style.maxWidth = "92vw";
    }
  }

  function openCommenterProfile(username) {
    const user = String(username || "").trim().toLowerCase();
    if (!user || !stationProfileDetails || !stationProfileName || !stationProfileUser || !stationProfileAvatar) return;
    let profiles = {};
    let accounts = {};
    let roles = { moderators: [] };
    try {
      profiles = JSON.parse(localStorage.getItem("tb_profiles_v1") || "{}");
    } catch {}
    try {
      accounts = JSON.parse(localStorage.getItem("tb_accounts_v1") || "{}");
    } catch {}
    try {
      roles = JSON.parse(localStorage.getItem("tb_roles_v1") || '{"moderators":[]}');
    } catch {}
    const owner = String(localStorage.getItem("tb_owner_user_v1") || "EURORAILSHOTS").trim().toLowerCase();
    const profile = profiles[user] || {};
    const account = accounts[user] || {};
    const accountId = String(account?.id || "").trim();
    const ownerId = String(localStorage.getItem("tb_owner_user_id_v1") || "").trim();
    const modIds = Array.isArray(roles?.moderatorIds) ? roles.moderatorIds.map((id) => String(id || "").trim()) : [];
    const isOwnerById = Boolean(ownerId && accountId && ownerId === accountId);
    const isModById = Boolean(accountId && modIds.includes(accountId));
    const role = isOwnerById || user === owner ? "Owner" : isModById || (Array.isArray(roles?.moderators) && roles.moderators.includes(user)) ? "Moderator" : "Member";
    const avatar = String(profile.avatar || "../images/default-avatar.svg");
    const displayName = String(user);
    stationProfileAvatar.src = avatar;
    stationProfileName.textContent = displayName;
    stationProfileUser.textContent = "";
    stationProfileUser.style.display = "none";
    stationProfileDetails.innerHTML = `
      <p><strong>Role:</strong> ${esc(role)}</p>
      <p><strong>Email:</strong> ${esc(String(profile.email || account.email || "Not set"))}</p>
      <p><strong>Notifications:</strong> ${profile.notifications ? "Enabled" : "Disabled"}</p>
      <p><strong>Created:</strong> ${account.createdAt ? new Date(account.createdAt).toLocaleString("en-GB") : "Unknown"}</p>
      <p><strong>Avatar path:</strong> ${esc(avatar)}</p>
    `;
    commenterProfileModal.classList.add("is-open");
    commenterProfileModal.setAttribute("aria-hidden", "false");
  }

  function closeCommenterProfile() {
    commenterProfileModal.classList.remove("is-open");
    commenterProfileModal.setAttribute("aria-hidden", "true");
  }

  function openLightbox(
    src,
    alt,
    metaHtml,
    dateLabel,
    operatorLabel,
    photographerLabel,
    photoId = "",
  ) {
    if (!lightboxImg) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt || station.name;

    if (lightboxOperator) {
      if (operatorLabel) {
        const labels = String(operatorLabel || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
        lightboxOperator.innerHTML = labels
          .map((label) => `<span class="station-meta-chip">${esc(label)}</span>`)
          .join("");
        lightboxOperator.style.display = "flex";
      } else {
        lightboxOperator.innerHTML = "";
        lightboxOperator.style.display = "none";
      }
    }

    if (lightboxDate) {
      if (dateLabel) {
        lightboxDate.innerHTML = `<span class="station-meta-number">${esc(dateLabel)}</span>`;
        lightboxDate.style.display = "flex";
      } else {
        lightboxDate.innerHTML = "";
        lightboxDate.style.display = "none";
      }
    }

    if (lightboxMeta) {
      lightboxMeta.innerHTML = "";
      lightboxMeta.style.display = "none";
    }

    if (lightboxWatermark) {
      const owner = String(photographerLabel || "").trim() || "eurorailshots.com";
      const profileUser = owner.toLowerCase().endsWith(".com")
        ? owner.slice(0, -4)
        : owner;
      lightboxWatermark.innerHTML = `&copy; ${esc(owner)}`;
      lightboxWatermark.dataset.profileUser = String(profileUser || "").trim().toLowerCase();
      lightboxWatermark.setAttribute("role", "button");
      lightboxWatermark.setAttribute("tabindex", "0");
      lightboxWatermark.setAttribute(
        "aria-label",
        `Open profile of ${String(profileUser || owner).trim()}`,
      );
    }

    if (lightboxDeleteBtn) {
      const activeUser = getActiveUser();
      const ownerUser = String(localStorage.getItem("tb_owner_user_v1") || "EURORAILSHOTS")
        .trim()
        .toLowerCase();
      const activeUserId = String(localStorage.getItem("tb_active_user_id_v1") || "").trim();
      const ownerUserId = String(localStorage.getItem("tb_owner_user_id_v1") || "").trim();
      const canDelete = (ownerUserId && activeUserId && activeUserId === ownerUserId) || (activeUser && activeUser === ownerUser);
      const deletable = canDelete && String(photoId || "").startsWith("sub_");
      lightboxDeleteBtn.hidden = !deletable;
      lightboxDeleteBtn.dataset.photoId = deletable ? String(photoId || "") : "";
    }

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
    requestAnimationFrame(syncLightboxPanelWidth);
    setTimeout(syncLightboxPanelWidth, 240);
  }

  function updateLightboxNav() {
    const hasMultiple = currentSeriesPool.length > 1;
    if (prevBtn) prevBtn.style.display = hasMultiple ? "inline-flex" : "none";
    if (nextBtn) nextBtn.style.display = hasMultiple ? "inline-flex" : "none";
  }

  function openLightboxByIndex(sourceIndex, referenceImg = null) {
    const photo = photoBySourceIndex.get(sourceIndex);
    if (!photo) return;

    currentPhotoIndex = photo.sourceIndex;
    currentSeriesPool = seriesPools.get(photo.series) || [photo.sourceIndex];
    const pos = currentSeriesPool.indexOf(photo.sourceIndex);
    currentSeriesPosition = pos >= 0 ? pos : 0;

    const photoDate = (photo.date || "").trim();
    applyPredictedPanelWidth(referenceImg);
    openLightbox(
      photo.src,
      photo.alt,
      photo.fullMetaHtml || photo.metaHtml || "",
      photoDate,
      photo.operator || "",
      photo.photographer || "",
      photo.id || "",
    );
    renderLightboxComments();
    updateLightboxNav();
  }

  function getActiveUser() {
    return String(localStorage.getItem("tb_active_user_v1") || "").trim().toLowerCase();
  }

  function getCurrentCommentKey() {
    return `${slug}::${currentPhotoIndex}`;
  }

  lightboxWatermark?.addEventListener("click", () => {
    const user = String(lightboxWatermark.dataset.profileUser || "").trim();
    if (!user) return;
    openCommenterProfile(user);
  });

  lightboxWatermark?.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    const user = String(lightboxWatermark.dataset.profileUser || "").trim();
    if (!user) return;
    openCommenterProfile(user);
  });

  lightboxDeleteBtn?.addEventListener("click", async (event) => {
    event.stopPropagation();
    const id = String(lightboxDeleteBtn.dataset.photoId || "").trim();
    if (!id) return;
    if (!confirm("Delete this photo permanently?")) return;
    try {
      const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Could not delete photo."));
      sessionStorage.removeItem("tb_approved_submissions_cache_v1");
      sessionStorage.removeItem("tb_approved_submissions_cache_v2");
      closeLightbox();
      window.location.reload();
    } catch (err) {
      setCommentStatus(String(err?.message || "Could not delete photo."), true);
    }
  });

  function canModerateComments() {
    const user = getActiveUser();
    const userId = getActiveUserId();
    if (!user) return false;
    try {
      const owner = String(localStorage.getItem("tb_owner_user_v1") || "EURORAILSHOTS")
        .trim()
        .toLowerCase();
      if (user === owner) return true;
      const rawRoles = localStorage.getItem("tb_roles_v1");
      const roles = rawRoles ? JSON.parse(rawRoles) : {};
      const moderators = Array.isArray(roles?.moderators) ? roles.moderators : [];
      return moderators.map((name) => String(name || "").trim().toLowerCase()).includes(user);
    } catch {
      return false;
    }
  }

  function setCommentStatus(message, isError = false) {
    if (!lightboxCommentStatus) return;
    lightboxCommentStatus.textContent = message;
    lightboxCommentStatus.classList.toggle("is-error", isError);
    lightboxCommentStatus.classList.toggle("is-success", !isError && Boolean(message));
  }

  function renderLightboxComments() {
    if (!lightboxCommentsList) return;
    const profilesMap = (() => {
      try {
        const raw = localStorage.getItem("tb_profiles_v1");
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })();
    const allComments = (() => {
      try {
        const raw = localStorage.getItem("tb_photo_comments_v1");
        return raw ? JSON.parse(raw) : {};
      } catch {
        return {};
      }
    })();
    const comments = Array.isArray(allComments[getCurrentCommentKey()])
      ? allComments[getCurrentCommentKey()]
      : [];

    if (lightboxCommentsMeta) {
      lightboxCommentsMeta.textContent = "Join the discussion for this photo.";
    }

    if (comments.length === 0) {
      lightboxCommentsList.innerHTML = '<p class="muted">No comments yet.</p>';
    } else {
      lightboxCommentsList.innerHTML = comments
        .map((item, commentIndex) => {
          const commenter = String(item.user || "user").toLowerCase();
          const avatar = String((profilesMap[commenter] || {}).avatar || "../images/default-avatar.svg");
          return `
            <article class="station-lightbox-comment">
              <div class="station-lightbox-comment-header">
                <button class="station-comment-author" type="button" data-comment-user="${esc(item.user || "user")}">
                  <img src="${esc(avatar)}" alt="${esc(item.user || "user")} avatar" />
                  <strong>${esc(item.user || "user")}</strong>
                </button>
                ${
                  canModerateComments()
                    ? `<button class="station-lightbox-comment-delete" type="button" data-comment-delete="${commentIndex}">Delete</button>`
                    : ""
                }
              </div>
              <p>${esc(item.text || "")}</p>
              <small>${new Date(item.createdAt).toLocaleString("en-GB")}</small>
            </article>
          `;
        })
        .join("");
    }

    const activePhoto = photoBySourceIndex.get(currentPhotoIndex);
    if (lightboxSubmitSimilar && activePhoto) {
      const params = new URLSearchParams({
        station: slug,
        operator: String(activePhoto.operator || ""),
        date: String(activePhoto.date || ""),
        title: String(activePhoto.alt || "").slice(0, 120),
        notes: `Same train as photo #${currentPhotoIndex + 1}${activePhoto.numbers ? ` (${activePhoto.numbers})` : ""}`,
      });
      lightboxSubmitSimilar.href = `../pages/Submit.html?${params.toString()}`;
    }
  }

  lightboxCommentForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const user = getActiveUser();
    const userId = getActiveUserId();
    if (!user) {
      setCommentStatus("Log in to post a comment.", true);
      return;
    }
    const text = String(lightboxCommentInput?.value || "").trim();
    if (!text) {
      setCommentStatus("Please write a comment first.", true);
      return;
    }

    let allComments = {};
    try {
      const raw = localStorage.getItem("tb_photo_comments_v1");
      allComments = raw ? JSON.parse(raw) : {};
    } catch {
      allComments = {};
    }
    const key = getCurrentCommentKey();
    if (!Array.isArray(allComments[key])) allComments[key] = [];
    allComments[key].push({
      user,
      text,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("tb_photo_comments_v1", JSON.stringify(allComments));
    if (lightboxCommentInput) lightboxCommentInput.value = "";
    setCommentStatus("Comment posted.");
    renderLightboxComments();
  });

  lightboxImg?.addEventListener("load", syncLightboxPanelWidth);
  lightboxMedia?.addEventListener("transitionend", syncLightboxPanelWidth);
  window.addEventListener("resize", syncLightboxPanelWidth);

  lightboxCommentsList?.addEventListener("click", (event) => {
    const authorBtn = event.target.closest("[data-comment-user]");
    if (authorBtn) {
      openCommenterProfile(authorBtn.dataset.commentUser);
      return;
    }
    const deleteBtn = event.target.closest("[data-comment-delete]");
    if (!deleteBtn) return;
    if (!canModerateComments()) {
      setCommentStatus("Only moderators or owner can delete comments.", true);
      return;
    }
    const deleteIndex = Number(deleteBtn.dataset.commentDelete);
    if (!Number.isInteger(deleteIndex) || deleteIndex < 0) return;
    let allComments = {};
    try {
      const raw = localStorage.getItem("tb_photo_comments_v1");
      allComments = raw ? JSON.parse(raw) : {};
    } catch {
      allComments = {};
    }
    const key = getCurrentCommentKey();
    const list = Array.isArray(allComments[key]) ? allComments[key] : [];
    if (!list[deleteIndex]) return;
    list.splice(deleteIndex, 1);
    allComments[key] = list;
    localStorage.setItem("tb_photo_comments_v1", JSON.stringify(allComments));
    setCommentStatus("Comment deleted.");
    renderLightboxComments();
  });
  function openSiblingInSeries(step) {
    if (!Array.isArray(currentSeriesPool) || currentSeriesPool.length === 0) return;
    const count = currentSeriesPool.length;
    currentSeriesPosition = ((currentSeriesPosition + step) % count + count) % count;
    openLightboxByIndex(currentSeriesPool[currentSeriesPosition]);
  }

  Array.from(grid.querySelectorAll(".station-photo-card img")).forEach(
    (img) => {
      img.addEventListener("click", () => {
        const card = img.closest(".station-photo-card");
        const index = Number(card?.dataset.photoIndex || 0);
        openLightboxByIndex(index, img);
      });
    },
  );

  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSiblingInSeries(-1);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSiblingInSeries(1);
    });
  }

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });
  stationProfileClose?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeCommenterProfile();
  });
  commenterProfileModal.addEventListener("click", (event) => {
    const closeAction = event.target.closest(".station-profile-close");
    if (closeAction) {
      event.preventDefault();
      event.stopPropagation();
      closeCommenterProfile();
      return;
    }
    if (event.target === commenterProfileModal) closeCommenterProfile();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && commenterProfileModal.classList.contains("is-open")) {
      closeCommenterProfile();
      return;
    }
    if (!lightbox.classList.contains("is-open")) return;

    if (e.key === "Escape") {
      closeLightbox();
      return;
    }

    if (e.key === "ArrowLeft") {
      openSiblingInSeries(-1);
      return;
    }

    if (e.key === "ArrowRight") {
      openSiblingInSeries(1);
    }
  });

  if (shouldOpenLightbox && Number.isInteger(requestedPhotoIndex)) {
    openLightboxByIndex(requestedPhotoIndex);
  }
})();
(function initLiveTrainMap() {
  const mapEl = document.getElementById("liveTrainsMap");
  if (!mapEl || typeof window.L === "undefined") return;

  const refreshBtn = document.getElementById("liveMapRefreshBtn");
  const statusLabel = document.getElementById("liveMapStatusLabel");
  const trainCountLabel = document.getElementById("liveMapTrainCount");
  const updatedAtLabel = document.getElementById("liveMapUpdatedAt");
  const messageEl = document.getElementById("liveMapMessage");
  const FULL_FEED_URL = "../data/live-trains.json";

  const HUB_STATIONS = [
    "Antwerpen-Centraal",
    "Brussel-Centraal",
    "Brussel-Noord",
    "Brussel-Zuid",
    "Aalst",
    "Aarschot",
    "Berchem",
    "Bergen",
    "Blankenberge",
    "Brugge",
    "Charleroi-Centraal",
    "De Panne",
    "Dendermonde",
    "Diest",
    "Dinant",
    "Doornik",
    "Eupen",
    "Gent-Sint-Pieters",
    "Genk",
    "Halle",
    "Leuven",
    "Herentals",
    "Luik-Guillemins",
    "Hasselt",
    "Kortrijk",
    "Landen",
    "Lier",
    "Lokeren",
    "Louvain-la-Neuve",
    "Marche-en-Famenne",
    "Mechelen",
    "Mol",
    "Mons",
    "Mouscron",
    "Namur",
    "Neerpelt",
    "Nivelles",
    "Noorderkempen",
    "Oostende",
    "Ottignies",
    "Poperinge",
    "Roeselare",
    "Ronse",
    "Sint-Niklaas",
    "Spa-Geronstere",
    "Tienen",
    "Tongeren",
    "Turnhout",
    "Verviers-Centraal",
    "Waregem",
  ];
  const BELGIUM_BOUNDS = [
    [49.45, 2.4],
    [51.7, 6.45],
  ];
  const MAP_CENTER = [50.7, 4.6];
  const DEPARTURES_PER_STATION = 6;
  const LIVEBOARD_BATCH_SIZE = 6;
  const VEHICLE_BATCH_SIZE = 8;
  const BATCH_DELAY_MS = 700;

  const map = L.map(mapEl, {
    scrollWheelZoom: true,
    zoomControl: true,
    maxBoundsViscosity: 1,
    worldCopyJump: false,
  });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    noWrap: true,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  const railLayer = L.tileLayer("https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png", {
    maxZoom: 18,
    noWrap: true,
    opacity: 0,
    attribution:
      '&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>',
  }).addTo(map);

  map.setMaxBounds(BELGIUM_BOUNDS);
  map.fitBounds(BELGIUM_BOUNDS, { padding: [20, 20] });
  map.setView(MAP_CENTER, 8);

  const trainsLayer = L.layerGroup().addTo(map);
  const routeLayer = L.layerGroup().addTo(map);
  const selectedTrainLayer = L.layerGroup().addTo(map);

  const trainIcon = L.divIcon({
    className: "live-train-icon",
    html: '<span class="live-train-dot"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });

  let currentController = null;
  let activeRequestId = 0;
  let loading = false;
  let selectedTrainId = null;
  let currentRenderedTrains = [];
  const snappedRailCache = new Map();

  function updateRailOverlay() {
    const showRail = !!selectedTrainId && map.getZoom() >= 10;
    railLayer.setOpacity(showRail ? 0.26 : 0);
  }

  function getDistanceScore(aLat, aLng, bLat, bLng) {
    const latScale = 111320;
    const lngScale = Math.cos(((aLat + bLat) / 2) * (Math.PI / 180)) * 111320;
    const dLat = (aLat - bLat) * latScale;
    const dLng = (aLng - bLng) * lngScale;
    return dLat * dLat + dLng * dLng;
  }

  async function fetchNearestRailPoint(lat, lng, signal) {
    const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
    if (snappedRailCache.has(cacheKey)) {
      return snappedRailCache.get(cacheKey);
    }

    const query = `
      [out:json][timeout:10];
      (
        way["railway"~"rail|light_rail|narrow_gauge"](around:900,${lat},${lng});
        >;
      );
      out body;
    `.trim();

    try {
      const data = await fetchJson(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
        signal,
      );

      const nodes = toArray(data?.elements).filter(
        (element) =>
          element?.type === "node" &&
          Number.isFinite(element?.lat) &&
          Number.isFinite(element?.lon),
      );

      if (nodes.length === 0) {
        snappedRailCache.set(cacheKey, null);
        return null;
      }

      let nearest = null;
      let nearestScore = Number.POSITIVE_INFINITY;

      nodes.forEach((node) => {
        const score = getDistanceScore(lat, lng, Number(node.lat), Number(node.lon));
        if (score < nearestScore) {
          nearestScore = score;
          nearest = [Number(node.lat), Number(node.lon)];
        }
      });

      snappedRailCache.set(cacheKey, nearest);
      return nearest;
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      console.error("Rail snap request failed:", err);
      snappedRailCache.set(cacheKey, null);
      return null;
    }
  }

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function toArray(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  function wait(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  async function runInBatches(items, batchSize, delayMs, worker, onBatchDone) {
    const results = [];

    for (let index = 0; index < items.length; index += batchSize) {
      const batch = items.slice(index, index + batchSize);
      const batchResults = await Promise.all(
        batch.map((item, batchIndex) => worker(item, index + batchIndex)),
      );

      results.push(...batchResults);

      if (typeof onBatchDone === "function") {
        onBatchDone(batchResults, index, items.length);
      }

      if (index + batchSize < items.length && delayMs > 0) {
        await wait(delayMs);
      }
    }

    return results;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function isBelgiumCoord(lat, lng) {
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= BELGIUM_BOUNDS[0][0] &&
      lat <= BELGIUM_BOUNDS[1][0] &&
      lng >= BELGIUM_BOUNDS[0][1] &&
      lng <= BELGIUM_BOUNDS[1][1]
    );
  }

  function formatTime(timestampSeconds) {
    if (!timestampSeconds) return "-";

    return new Intl.DateTimeFormat("nl-BE", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(timestampSeconds * 1000));
  }

  function formatRelativeUpdate(date) {
    return new Intl.DateTimeFormat("nl-BE", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(date);
  }

  function getDelayVisual(delayMinutes) {
    const delay = Math.max(0, Number(delayMinutes) || 0);

    if (delay < 3) {
      return {
        className: "is-on-time",
        label: delay === 0 ? "On time" : `+${delay} min`,
      };
    }

    if (delay < 6) {
      return {
        className: "is-delay-1",
        label: `+${delay} min`,
      };
    }

    if (delay < 10) {
      return {
        className: "is-delay-2",
        label: `+${delay} min`,
      };
    }

    if (delay < 15) {
      return {
        className: "is-delay-3",
        label: `+${delay} min`,
      };
    }

    return {
      className: "is-delay-4",
      label: `+${delay} min`,
    };
  }

  function setStatus(text) {
    if (statusLabel) statusLabel.textContent = text;
  }

  function setMessage(text, isError) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.style.display = text ? "" : "none";
    messageEl.classList.toggle("is-error", !!isError);
  }

  async function fetchJson(url, signal) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  }

  function getStopCoords(stop) {
    const info = stop?.stationinfo || {};
    const lat = Number(info.locationY);
    const lng = Number(info.locationX);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return [lat, lng];
  }

  function getArrivalTime(stop) {
    const scheduled =
      toNumber(stop?.scheduledArrivalTime) ||
      toNumber(stop?.time) ||
      toNumber(stop?.scheduledDepartureTime);
    const delay = toNumber(stop?.arrivalDelay || stop?.delay);
    return scheduled + delay;
  }

  function getDepartureTime(stop) {
    const scheduled =
      toNumber(stop?.scheduledDepartureTime) ||
      toNumber(stop?.time) ||
      toNumber(stop?.scheduledArrivalTime);
    const delay = toNumber(stop?.departureDelay || stop?.delay);
    return scheduled + delay;
  }

  function normalizeStops(rawStops) {
    return toArray(rawStops)
      .map((stop) => {
        const coords = getStopCoords(stop);
        if (!coords) return null;

        return {
          name: stop.station || stop?.stationinfo?.name || "Unknown station",
          coords,
          arrival: getArrivalTime(stop),
          departure: getDepartureTime(stop),
          delay: Math.round(toNumber(stop?.delay || stop?.departureDelay) / 60),
          canceled: Number(stop?.canceled || stop?.departureCanceled || stop?.arrivalCanceled) === 1,
        };
      })
      .filter(Boolean)
      .filter((stop) => !stop.canceled)
      .sort((a, b) => a.arrival - b.arrival);
  }

  function buildRouteCoords(stops) {
    const coords = [];
    const seen = new Set();

    stops.forEach((stop) => {
      const lat = stop?.coords?.[0];
      const lng = stop?.coords?.[1];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
      if (seen.has(key)) return;
      seen.add(key);
      coords.push([lat, lng]);
    });

    return coords;
  }

  function drawTrainRoute(train) {
    routeLayer.clearLayers();
    selectedTrainLayer.clearLayers();
    updateRailOverlay();

    const coords = Array.isArray(train?.routeCoords) ? train.routeCoords : [];
    const zoomedIn = map.getZoom() >= 13;
    if (coords.length < 2 && !train) return;

    if (!zoomedIn && coords.length >= 2) {
      const line = L.polyline(coords, {
        color: "#005cb9",
        weight: 3,
        opacity: 0.82,
        dashArray: "8 7",
        lineCap: "round",
        lineJoin: "round",
        smoothFactor: 0,
      }).addTo(routeLayer);

      line.bindTooltip(`${train.shortName}: ${train.origin} -> ${train.destination}`, {
        sticky: true,
        direction: "top",
      });

      coords.forEach((coord, index) => {
        const isEndpoint = index === 0 || index === coords.length - 1;

        L.circleMarker(coord, {
          radius: isEndpoint ? 4 : 2.5,
          color: isEndpoint ? "#003b79" : "#005cb9",
          weight: 2,
          fillColor: isEndpoint ? "#ffffff" : "#b7d8ff",
          fillOpacity: 1,
          opacity: 1,
        }).addTo(routeLayer);
      });
    }
  }

  async function updateSelectedTrainMarker(train) {
    selectedTrainLayer.clearLayers();
    if (!train?.position) return;

    let snappedPoint = null;

    try {
      snappedPoint = await fetchNearestRailPoint(
        train.position.lat,
        train.position.lng,
        currentController?.signal,
      );
    } catch (err) {
      if (err?.name === "AbortError") return;
    }

    const point = snappedPoint || [train.position.lat, train.position.lng];

    L.circleMarker(point, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#005cb9",
      fillOpacity: 1,
      opacity: 1,
    }).addTo(selectedTrainLayer);
  }

  function interpolatePosition(stops, nowTs) {
    if (stops.length === 0) return null;

    for (let index = 0; index < stops.length; index += 1) {
      const stop = stops[index];
      const arrival = stop.arrival || stop.departure;
      const departure = stop.departure || stop.arrival;

      if (nowTs >= arrival && nowTs <= departure) {
        return {
          lat: stop.coords[0],
          lng: stop.coords[1],
          status: "At station",
          previousStop: stop,
          nextStop: stop,
          progress: 1,
        };
      }

      const nextStop = stops[index + 1];
      if (!nextStop) continue;

      const segmentStart = departure;
      const segmentEnd = nextStop.arrival || nextStop.departure;
      if (!segmentStart || !segmentEnd || segmentEnd <= segmentStart) continue;

      if (nowTs >= segmentStart && nowTs <= segmentEnd) {
        const rawProgress = (nowTs - segmentStart) / (segmentEnd - segmentStart);
        const progress = clamp(rawProgress, 0, 1);

        return {
          lat: stop.coords[0] + (nextStop.coords[0] - stop.coords[0]) * progress,
          lng: stop.coords[1] + (nextStop.coords[1] - stop.coords[1]) * progress,
          status: "Between stations",
          previousStop: stop,
          nextStop,
          progress,
        };
      }
    }

    const firstStop = stops[0];
    const lastStop = stops[stops.length - 1];

    if (nowTs < firstStop.arrival) {
      return {
        lat: firstStop.coords[0],
        lng: firstStop.coords[1],
        status: "Not departed yet",
        previousStop: firstStop,
        nextStop: firstStop,
        progress: 0,
      };
    }

    if (nowTs <= (lastStop.departure || lastStop.arrival) + 300) {
      return {
        lat: lastStop.coords[0],
        lng: lastStop.coords[1],
        status: "Arriving / terminated",
        previousStop: lastStop,
        nextStop: lastStop,
        progress: 1,
      };
    }

    return null;
  }

  function buildPopup(train) {
    const delayVisual = getDelayVisual(train.delayMinutes);
    const delayText = delayVisual.label;

    const viaText =
      train.position.status === "Between stations"
        ? `${esc(train.position.previousStop.name)} -> ${esc(train.position.nextStop.name)}`
        : esc(train.position.nextStop.name);

    return `
      <div class="live-popup">
        <div class="live-popup-top">
          <span class="live-popup-line">${esc(train.shortName)}</span>
          <span class="live-popup-delay ${esc(delayVisual.className)}">${esc(delayText)}</span>
        </div>
        <div class="live-popup-route">
          <strong>${esc(train.origin)}</strong>
          <span>to</span>
          <strong>${esc(train.destination)}</strong>
        </div>
        <div class="live-popup-meta">
          <div><span>Status</span><strong>${esc(train.position.status)}</strong></div>
          <div><span>Current segment</span><strong>${viaText}</strong></div>
          <div><span>Last realtime check</span><strong>${esc(formatTime(train.timestamp))}</strong></div>
        </div>
      </div>
    `;
  }

  function normalizeFeedTrain(train) {
    const lat = Number(train?.lat);
    const lng = Number(train?.lng);
    if (!isBelgiumCoord(lat, lng)) return null;

    const status = String(train?.status || "Live").trim() || "Live";
    const currentSegment = String(train?.currentSegment || train?.nextStop || "").trim();

    return {
      id: String(train?.id || train?.shortName || `${lat},${lng}`),
      shortName: String(train?.shortName || train?.id || "Train"),
      origin: String(train?.origin || "Unknown"),
      destination: String(train?.destination || "Unknown"),
      timestamp: toNumber(train?.timestamp),
      delayMinutes: Math.round(toNumber(train?.delayMinutes || train?.delay)),
      sourceStation: String(train?.sourceStation || ""),
      sourceCoords: Array.isArray(train?.sourceCoords) ? train.sourceCoords : null,
      routeCoords: toArray(train?.route)
        .map((point) => [Number(point?.lat), Number(point?.lng)])
        .filter((point) => isBelgiumCoord(point[0], point[1])),
      position: {
        lat,
        lng,
        status,
        previousStop: { name: String(train?.previousStop || "") },
        nextStop: { name: String(train?.nextStop || currentSegment || "") },
        progress: clamp(Number(train?.progress || 0), 0, 1),
      },
    };
  }

  async function fetchFullFeed(signal) {
    try {
      const data = await fetchJson(FULL_FEED_URL, signal);
      const trains = toArray(data?.trains)
        .map(normalizeFeedTrain)
        .filter(Boolean);

      if (trains.length === 0) return null;

      return {
        trains,
        updatedAt: data?.updatedAt || data?.timestamp || null,
      };
    } catch (err) {
      if (err?.name === "AbortError") throw err;
      return null;
    }
  }

  function renderTrains(trains) {
    currentRenderedTrains = Array.isArray(trains) ? trains.slice() : [];
    trainsLayer.clearLayers();

    trains.forEach((train) => {
      const delayVisual = getDelayVisual(train.delayMinutes);

      const marker = L.marker([train.position.lat, train.position.lng], {
        icon: L.divIcon({
          className: `live-train-icon ${delayVisual.className}`,
          html: '<span class="live-train-dot"></span>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          popupAnchor: [0, -10],
        }),
        title: train.shortName,
      }).addTo(trainsLayer);

      marker.bindPopup(buildPopup(train), {
        closeButton: true,
        offset: [0, -8],
      });

      marker.on("click", () => {
        selectedTrainId = train.id;
        drawTrainRoute(train);
        updateSelectedTrainMarker(train);
      });
    });

    if (trainCountLabel) {
      trainCountLabel.textContent = String(trains.length);
    }

    if (selectedTrainId) {
      const selectedTrain = trains.find((train) => train.id === selectedTrainId);
      drawTrainRoute(selectedTrain || null);
      updateSelectedTrainMarker(selectedTrain || null);
    } else {
      routeLayer.clearLayers();
      selectedTrainLayer.clearLayers();
      updateRailOverlay();
    }
  }

  async function collectDepartures(signal) {
    const vehicles = new Map();

    await runInBatches(
      HUB_STATIONS,
      LIVEBOARD_BATCH_SIZE,
      BATCH_DELAY_MS,
      async (station) => {
        setStatus(`Reading ${station}...`);

        try {
          const data = await fetchJson(
            `https://api.irail.be/liveboard/?station=${encodeURIComponent(station)}&format=json&lang=en&alerts=false`,
            signal,
          );

          return { station, data };
        } catch (err) {
          if (err?.name === "AbortError") throw err;

          console.error("Liveboard request failed:", station, err);
          return null;
        }
      },
      (batchResults) => {
        batchResults.filter(Boolean).forEach((entry) => {
          const { station, data } = entry;
          const departures = toArray(data?.departures?.departure)
            .filter((departure) => Number(departure?.canceled) !== 1)
            .slice(0, DEPARTURES_PER_STATION);

          departures.forEach((departure) => {
            const vehicleId = String(departure?.vehicle || "").trim();
            if (!vehicleId || vehicles.has(vehicleId)) return;

            vehicles.set(vehicleId, {
              id: vehicleId,
              shortName:
                departure?.vehicleinfo?.shortname ||
                vehicleId.replace(/^BE\.NMBS\./, ""),
              sourceStation: station,
              sourceCoords: [
                Number(data?.stationinfo?.locationY),
                Number(data?.stationinfo?.locationX),
              ],
            });
          });
        });
      },
    );

    return Array.from(vehicles.values());
  }

  async function collectTrains(vehicles, signal) {
    const trains = [];
    const nowTs = Math.floor(Date.now() / 1000);

    await runInBatches(
      vehicles,
      VEHICLE_BATCH_SIZE,
      BATCH_DELAY_MS,
      async (vehicle, index) => {
        setStatus(`Calculating ${vehicle.shortName} (${index + 1}/${vehicles.length})...`);

        try {
          const data = await fetchJson(
            `https://api.irail.be/vehicle/?id=${encodeURIComponent(vehicle.id)}&format=json&lang=en&alerts=false`,
            signal,
          );

          const stops = normalizeStops(data?.stops?.stop);
          const position = interpolatePosition(stops, nowTs);
          if (!position || !isBelgiumCoord(position.lat, position.lng)) return null;

          const origin = stops[0]?.name || vehicle.sourceStation;
          const destination = stops[stops.length - 1]?.name || "Unknown";
          const delayMinutes =
            position.nextStop?.delay ??
            position.previousStop?.delay ??
            0;

          return {
            id: vehicle.id,
            shortName:
              data?.vehicleinfo?.shortname ||
              vehicle.shortName ||
              vehicle.id.replace(/^BE\.NMBS\./, ""),
            origin,
            destination,
            timestamp: toNumber(data?.timestamp),
            delayMinutes,
            sourceStation: vehicle.sourceStation,
            sourceCoords: vehicle.sourceCoords,
            routeCoords: buildRouteCoords(stops),
            position,
          };
        } catch (err) {
          if (err?.name === "AbortError") throw err;

          console.error("Vehicle request failed:", vehicle.id, err);
          return null;
        }
      },
      (batchResults) => {
        batchResults.filter(Boolean).forEach((train) => {
          trains.push(train);
        });

        renderTrains(trains);
      },
    );

    return trains;
  }

  async function refreshLiveMap() {
    if (loading) return;

    loading = true;
    activeRequestId += 1;
    const requestId = activeRequestId;

    if (currentController) currentController.abort();
    currentController = new AbortController();

    if (refreshBtn) refreshBtn.disabled = true;

    setMessage(
      "Loading live trains from several major Belgian stations. This can take a few seconds.",
      false,
    );
    setStatus("Loading...");

    try {
      const fullFeed = await fetchFullFeed(currentController.signal);
      if (requestId !== activeRequestId) return;

      if (fullFeed) {
        renderTrains(fullFeed.trains);
        setStatus("Live");
        setMessage("", false);

        if (updatedAtLabel) {
          updatedAtLabel.textContent = fullFeed.updatedAt
            ? formatRelativeUpdate(new Date(fullFeed.updatedAt))
            : formatRelativeUpdate(new Date());
        }

        return;
      }

      setMessage(
        "No central full-network feed detected, so the page is using the slower estimated realtime fallback.",
        false,
      );

      const vehicles = await collectDepartures(currentController.signal);
      if (requestId !== activeRequestId) return;

      setMessage(
        "First trains appear as soon as a batch is ready, then the rest fills in automatically.",
        false,
      );

      const trains = await collectTrains(vehicles, currentController.signal);
      if (requestId !== activeRequestId) return;

      renderTrains(trains);
      setStatus(trains.length > 0 ? "Live" : "No trains found");
      setMessage("", false);

      if (updatedAtLabel) {
        updatedAtLabel.textContent = formatRelativeUpdate(new Date());
      }
    } catch (err) {
      if (err?.name !== "AbortError") {
        console.error(err);
        setStatus("Unavailable");
        setMessage(
          "The live map could not be updated right now. Please try again in a moment.",
          true,
        );
      }
    } finally {
      if (requestId === activeRequestId) {
        loading = false;
        if (refreshBtn) refreshBtn.disabled = false;
      }
    }
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      refreshLiveMap();
    });
  }

  refreshLiveMap();

  map.on("zoomend", () => {
    updateRailOverlay();
    if (!selectedTrainId) return;

    const selectedTrain = currentRenderedTrains.find(
      (train) => train.id === selectedTrainId,
    );

    drawTrainRoute(selectedTrain || null);
    updateSelectedTrainMarker(selectedTrain || null);
  });

  window.addEventListener("resize", () => {
    map.invalidateSize();
  });

  window.addEventListener("beforeunload", () => {
    if (currentController) currentController.abort();
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
        "https://formsubmit.co/ajax/info@eurorailshots.com",
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

(function initLoginPage() {
  const signInForm = document.getElementById("loginSignInForm");
  const createForm = document.getElementById("loginCreateForm");
  const verifyForm = document.getElementById("loginVerifyForm");
  const resetRequestForm = document.getElementById("loginResetRequestForm");
  const resetForm = document.getElementById("loginResetForm");
  const status = document.getElementById("loginStatus");
  const signInTab = document.getElementById("loginTabSignIn");
  const createTab = document.getElementById("loginTabCreate");
  const signInPanel = document.getElementById("loginPanelSignIn");
  const createPanel = document.getElementById("loginPanelCreate");
  const verifyPanel = document.getElementById("loginPanelVerify");
  const resetPanel = document.getElementById("loginPanelReset");
  const forgotPasswordToggle = document.getElementById("forgotPasswordToggle");
  const verifyActionBtn = document.getElementById("verifyActionBtn");
  const resetRequestGroup = document.getElementById("resetRequestGroup");
  const resetSetGroup = document.getElementById("resetSetGroup");
  const resetRequestSubmitBtn = resetRequestForm?.querySelector('button[type="submit"]');

  if (!signInForm || !createForm || !status) return;

  const sessionKey = "tb_active_user_v1";
  const sessionIdKey = "tb_active_user_id_v1";
  const storageKey = "tb_accounts_v1";
  let verifyMode = "verify";
  let resetTokenFromLink = "";
  let resetEmailFromLink = "";
  let resetCooldownTimer = null;
  let resetCooldownUntil = 0;

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
  }

  function readAccounts() {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  function stripEmailFieldsFromAccounts(accounts) {
    const normalized = {};
    Object.entries(accounts || {}).forEach(([username, value]) => {
      const item = value && typeof value === "object" ? value : {};
      normalized[username] = {
        createdAt: item.createdAt || new Date().toISOString(),
        id: item.id ? String(item.id) : "",
      };
    });
    return normalized;
  }

  function writeAccounts(accounts) {
    localStorage.setItem(storageKey, JSON.stringify(stripEmailFieldsFromAccounts(accounts)));
  }

  async function apiRequest(url, payload) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload || {}),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      const err = new Error(String(data?.error || "Request failed"));
      err.data = data || {};
      throw err;
    }
    return data;
  }

  function showStatus(message, isError = false) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
    status.classList.toggle("is-success", !isError && Boolean(message));
  }

  function clearFieldErrors(form) {
    form?.querySelectorAll("input").forEach((input) => input.classList.remove("is-error"));
  }

  function setFieldError(input, hasError) {
    if (!input) return;
    input.classList.toggle("is-error", Boolean(hasError));
  }

  function sanitizeLoginRedirect(rawTarget) {
    const target = String(rawTarget || "").trim();
    if (!target) return "";
    if (target.startsWith("http://") || target.startsWith("https://") || target.startsWith("//")) {
      return "";
    }
    if (!/^[A-Za-z0-9._-]+\.html(?:\?.*)?$/.test(target)) return "";
    return target;
  }

  function getPostLoginRedirect() {
    const params = new URLSearchParams(window.location.search || "");
    const fromQuery = sanitizeLoginRedirect(params.get("next"));
    if (fromQuery) {
      try {
        sessionStorage.removeItem("tb_post_login_redirect");
      } catch {}
      return fromQuery;
    }
    try {
      const fromStorage = sanitizeLoginRedirect(sessionStorage.getItem("tb_post_login_redirect"));
      if (fromStorage) {
        sessionStorage.removeItem("tb_post_login_redirect");
        return fromStorage;
      }
    } catch {}
    return "Photos.html";
  }

  function readAuthQueryParams() {
    const params = new URLSearchParams(window.location.search || "");
    return {
      mode: String(params.get("mode") || "").trim().toLowerCase(),
      email: String(params.get("email") || "").trim().toLowerCase(),
      code: String(params.get("code") || "").trim(),
      token: String(params.get("token") || "").trim(),
    };
  }

  function setResetRequestButtonState(label, disabled) {
    if (!resetRequestSubmitBtn) return;
    resetRequestSubmitBtn.textContent = label;
    resetRequestSubmitBtn.disabled = Boolean(disabled);
  }

  function stopResetCooldown() {
    if (resetCooldownTimer) {
      clearInterval(resetCooldownTimer);
      resetCooldownTimer = null;
    }
    resetCooldownUntil = 0;
    setResetRequestButtonState("Send reset link", false);
  }

  function startResetCooldown(seconds) {
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    if (resetCooldownTimer) clearInterval(resetCooldownTimer);
    resetCooldownUntil = Date.now() + seconds * 1000;
    function tick() {
      const msLeft = resetCooldownUntil - Date.now();
      if (msLeft <= 0) {
        stopResetCooldown();
        return;
      }
      const secsLeft = Math.ceil(msLeft / 1000);
      setResetRequestButtonState(`Send reset link (${secsLeft}s)`, true);
    }
    tick();
    resetCooldownTimer = setInterval(tick, 250);
  }

  // Legacy cleanup: old builds stored emails in localStorage.
  writeAccounts(readAccounts());

  function setTab(mode) {
    const isCreate = mode === "create";
    createPanel.hidden = !isCreate;
    signInPanel.hidden = isCreate;
    if (verifyPanel) verifyPanel.hidden = true;
    if (resetPanel) resetPanel.hidden = true;
    createTab.classList.toggle("active", isCreate);
    signInTab.classList.toggle("active", !isCreate);
    createTab.setAttribute("aria-selected", isCreate ? "true" : "false");
    signInTab.setAttribute("aria-selected", !isCreate ? "true" : "false");
    showStatus("");
  }

  function openVerifyPanel(email) {
    signInPanel.hidden = true;
    createPanel.hidden = true;
    if (resetPanel) resetPanel.hidden = true;
    if (verifyPanel) verifyPanel.hidden = false;
    signInTab.classList.remove("active");
    createTab.classList.remove("active");
    const verifyEmail = verifyForm?.querySelector("#verifyEmail");
    if (verifyEmail && email) verifyEmail.value = email;
    verifyMode = "verify";
    if (verifyActionBtn) verifyActionBtn.textContent = "Verify and continue";
  }

  function openResetPanel(email) {
    signInPanel.hidden = true;
    createPanel.hidden = true;
    if (verifyPanel) verifyPanel.hidden = true;
    if (resetPanel) resetPanel.hidden = false;
    signInTab.classList.remove("active");
    createTab.classList.remove("active");
    const resetEmail = resetRequestForm?.querySelector("#resetEmail");
    if (resetEmail && email) resetEmail.value = email;
    if (resetRequestGroup) resetRequestGroup.hidden = false;
    if (resetSetGroup) resetSetGroup.hidden = true;
  }

  signInTab?.addEventListener("click", () => setTab("signin"));
  createTab?.addEventListener("click", () => setTab("create"));
  forgotPasswordToggle?.addEventListener("click", () => {
    openResetPanel("");
    showStatus("");
  });

  createForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = createForm.querySelector("#createUsername");
    const emailInput = createForm.querySelector("#createEmail");
    const passwordInput = createForm.querySelector("#createPassword");
    const confirmInput = createForm.querySelector("#createPasswordConfirm");

    const username = normalizeUsername(usernameInput?.value);
    const email = String(emailInput?.value || "").trim().toLowerCase();
    const password = String(passwordInput?.value || "");
    const confirm = String(confirmInput?.value || "");
    clearFieldErrors(createForm);

    if (!username) {
      setFieldError(usernameInput, true);
      showStatus("Please enter a username.", true);
      return;
    }
    if (username.length < 3) {
      setFieldError(usernameInput, true);
      showStatus("Username must be at least 3 characters.", true);
      return;
    }
    if (!email) {
      setFieldError(emailInput, true);
      showStatus("Please enter your email address.", true);
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError(emailInput, true);
      showStatus("Please enter a valid email address.", true);
      return;
    }
    if (!password) {
      setFieldError(passwordInput, true);
      showStatus("Please choose a password.", true);
      return;
    }
    if (password.length < 6) {
      setFieldError(passwordInput, true);
      showStatus("Password must be at least 6 characters.", true);
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setFieldError(passwordInput, true);
      showStatus("Password must contain at least 1 uppercase letter.", true);
      return;
    }
    if (!/[0-9]/.test(password)) {
      setFieldError(passwordInput, true);
      showStatus("Password must contain at least 1 number.", true);
      return;
    }
    if (password !== confirm) {
      setFieldError(confirmInput, true);
      showStatus("Passwords do not match.", true);
      return;
    }

    apiRequest("/api/auth/register", { username, email, password })
      .then((data) => {
        if (data?.requiresEmailVerification) {
          openVerifyPanel(email);
          showStatus("We sent you a verification code by email. Enter it below.");
          return;
        }
        showStatus("Account created. Please sign in.");
        setTab("signin");
      })
      .catch((error) => {
        const msg = String(error?.message || "");
        if (msg.toLowerCase().includes("username")) setFieldError(usernameInput, true);
        if (msg.toLowerCase().includes("email")) setFieldError(emailInput, true);
        if (msg.toLowerCase().includes("password")) setFieldError(passwordInput, true);
        showStatus(msg || "Could not create account.", true);
      });
  });

  signInForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const usernameInput = signInForm.querySelector("#signinUsername");
    const passwordInput = signInForm.querySelector("#signinPassword");

    const username = normalizeUsername(usernameInput?.value);
    const password = String(passwordInput?.value || "");
    clearFieldErrors(signInForm);
    apiRequest("/api/auth/login", { username, password })
      .then((data) => {
        localStorage.setItem(sessionKey, data.user.username);
        localStorage.setItem(sessionIdKey, String(data?.user?.id || ""));
        const accounts = readAccounts();
        accounts[data.user.username] = {
          createdAt: accounts[data.user.username]?.createdAt || new Date().toISOString(),
          id: String(data?.user?.id || accounts[data.user.username]?.id || ""),
        };
        writeAccounts(accounts);
        window.location.replace(getPostLoginRedirect());
      })
      .catch((error) => {
        const msg = String(error?.message || "Invalid username or password.");
        if (msg.toLowerCase().includes("verification required")) {
          openVerifyPanel(String(error?.data?.email || ""));
          showStatus("Email verification required. Enter your email and code.", true);
          return;
        }
        setFieldError(usernameInput, true);
        setFieldError(passwordInput, true);
        showStatus(msg, true);
      });
  });

  verifyForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = String(verifyForm.querySelector("#verifyEmail")?.value || "").trim().toLowerCase();
    if (verifyMode === "resend") {
      apiRequest("/api/auth/resend-verification-code", { email })
        .then(() => {
          verifyMode = "verify";
          if (verifyActionBtn) verifyActionBtn.textContent = "Verify and continue";
          showStatus("New code sent. Check your email.");
        })
        .catch((error) => showStatus(String(error?.message || "Could not send new code."), true));
      return;
    }

    const code = String(verifyForm.querySelector("#verifyCode")?.value || "").trim();
    apiRequest("/api/auth/verify-email", { email, code })
      .then((data) => {
        localStorage.setItem(sessionKey, data.user.username);
        localStorage.setItem(sessionIdKey, String(data?.user?.id || ""));
        const accounts = readAccounts();
        accounts[data.user.username] = {
          createdAt: accounts[data.user.username]?.createdAt || new Date().toISOString(),
          id: String(data?.user?.id || accounts[data.user.username]?.id || ""),
        };
        writeAccounts(accounts);
        window.location.replace(getPostLoginRedirect());
      })
      .catch((error) => {
        const msg = String(error?.message || "Could not verify email.");
        if (msg.toLowerCase().includes("invalid or expired code")) {
          verifyMode = "resend";
          if (verifyActionBtn) verifyActionBtn.textContent = "Send new code";
        }
        showStatus(msg, true);
      });
  });

  resetRequestForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (Date.now() < resetCooldownUntil) return;
    const email = String(resetRequestForm.querySelector("#resetEmail")?.value || "").trim().toLowerCase();
    startResetCooldown(30);
    apiRequest("/api/auth/request-password-reset", { email })
      .then(() => {
        showStatus("If the email exists, a reset link has been sent.");
      })
      .catch((error) => {
        showStatus(String(error?.message || "Could not send reset link."), true);
      });
  });

  resetForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const requestEmail = String(resetRequestForm.querySelector("#resetEmail")?.value || "").trim().toLowerCase();
    const email = String(resetEmailFromLink || requestEmail).trim().toLowerCase();
    const password = String(resetForm.querySelector("#resetPassword")?.value || "");
    apiRequest("/api/auth/reset-password", { email, token: resetTokenFromLink, password })
      .then((data) => {
        const resetUser = data?.user || null;
        if (resetUser?.username) {
          localStorage.setItem(sessionKey, normalizeUsername(resetUser.username));
          localStorage.setItem(sessionIdKey, String(resetUser?.id || ""));
          const accounts = readAccounts();
          accounts[normalizeUsername(resetUser.username)] = {
            createdAt: accounts[normalizeUsername(resetUser.username)]?.createdAt || new Date().toISOString(),
            id: String(resetUser?.id || accounts[normalizeUsername(resetUser.username)]?.id || ""),
          };
          writeAccounts(accounts);
          window.location.replace(getPostLoginRedirect());
          return;
        }
        showStatus("Password reset completed.");
        resetTokenFromLink = "";
        resetEmailFromLink = "";
        if (resetRequestGroup) resetRequestGroup.hidden = false;
        if (resetSetGroup) resetSetGroup.hidden = true;
        setTab("signin");
      })
      .catch((error) => showStatus(String(error?.message || "Could not reset password."), true));
  });

  const createUsernameInput = createForm.querySelector("#createUsername");
  createUsernameInput?.addEventListener("input", () => {
    const username = normalizeUsername(createUsernameInput.value);
    if (!username) {
      createUsernameInput.classList.remove("is-error");
      return;
    }
    createUsernameInput.classList.toggle("is-error", false);
    if (status.classList.contains("is-error") && status.textContent === "This username already exists.") {
      showStatus("");
    }
  });

  fetch("/api/auth/session", { credentials: "include" })
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => {
      if (!data?.user?.username) return;
      const activeUser = normalizeUsername(data.user.username);
      localStorage.setItem(sessionKey, activeUser);
      localStorage.setItem(sessionIdKey, String(data?.user?.id || ""));
      showStatus(`Already logged in as ${activeUser}.`);
    })
    .catch(() => {
      const activeUser = normalizeUsername(localStorage.getItem(sessionKey));
      if (activeUser) showStatus(`Already logged in as ${activeUser}.`);
    });

  const authQuery = readAuthQueryParams();
  if (authQuery.mode === "reset") {
    openResetPanel(authQuery.email);
    resetTokenFromLink = authQuery.token;
    resetEmailFromLink = authQuery.email;
    if (resetTokenFromLink) {
      if (resetRequestGroup) resetRequestGroup.hidden = true;
      if (resetSetGroup) resetSetGroup.hidden = false;
      showStatus("Set your new password below.");
    } else {
      showStatus("Invalid reset link. Please request a new one.", true);
    }
  }
})();

(function initImageProtection() {
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

(function initCommunityFeatures() {
  const accountsKey = "tb_accounts_v1";
  const sessionKey = "tb_active_user_v1";
  const profileKey = "tb_profiles_v1";
  const submissionsKey = "tb_photo_submissions_v1";
  const commentsKey = "tb_photo_comments_v1";
  const rolesKey = "tb_roles_v1";
  const ownerKey = "tb_owner_user_v1";
  const ownerIdKey = "tb_owner_user_id_v1";
  const sessionIdKey = "tb_active_user_id_v1";

  function normalizeUser(value) {
    return String(value || "").trim().toLowerCase();
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function purgeLegacyEmailCache() {
    const profiles = readJson(profileKey, {});
    let profilesChanged = false;
    Object.keys(profiles || {}).forEach((username) => {
      const item = profiles[username];
      if (item && typeof item === "object" && "email" in item) {
        delete item.email;
        profilesChanged = true;
      }
    });
    if (profilesChanged) writeJson(profileKey, profiles);

    const accounts = readJson(accountsKey, {});
    let accountsChanged = false;
    Object.keys(accounts || {}).forEach((username) => {
      const item = accounts[username];
      if (item && typeof item === "object" && "email" in item) {
        delete item.email;
        accountsChanged = true;
      }
    });
    if (accountsChanged) writeJson(accountsKey, accounts);
  }

  purgeLegacyEmailCache();

  function getActiveUser() {
    return normalizeUser(localStorage.getItem(sessionKey));
  }

  function getActiveUserId() {
    return String(localStorage.getItem(sessionIdKey) || "").trim();
  }

  async function syncActiveUserFromServer() {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) {
        localStorage.removeItem(sessionKey);
        localStorage.removeItem(sessionIdKey);
        return "";
      }
      const data = await res.json();
      const user = normalizeUser(data?.user?.username);
      if (!user) {
        localStorage.removeItem(sessionKey);
        localStorage.removeItem(sessionIdKey);
        return "";
      }
      localStorage.setItem(sessionKey, user);
      localStorage.setItem(sessionIdKey, String(data?.user?.id || ""));
      return user;
    } catch {
      return getActiveUser();
    }
  }

  async function fetchSessionUser() {
    try {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  function getOwnerUser() {
    const saved = normalizeUser(localStorage.getItem(ownerKey));
    if (saved) return saved;
    localStorage.setItem(ownerKey, "EURORAILSHOTS");
    return "EURORAILSHOTS";
  }

  function getOwnerUserId() {
    const saved = String(localStorage.getItem(ownerIdKey) || "").trim();
    if (saved) return saved;
    return "";
  }

  function findUserIdByUsername(username) {
    const key = normalizeUser(username);
    if (!key) return "";
    const accounts = readJson(accountsKey, {});
    return String(accounts?.[key]?.id || "").trim();
  }

  function readRoles() {
    const roles = readJson(rolesKey, { moderators: [], moderatorIds: [] });
    if (!Array.isArray(roles.moderators)) roles.moderators = [];
    if (!Array.isArray(roles.moderatorIds)) roles.moderatorIds = [];
    return roles;
  }

  function writeRoles(roles) {
    const normalizedModeratorIds = Array.from(new Set((roles?.moderatorIds || []).map((id) => String(id || "").trim()).filter(Boolean)));
    const normalizedModerators = Array.from(new Set((roles?.moderators || []).map((user) => normalizeUser(user)).filter(Boolean)));
    writeJson(rolesKey, { moderatorIds: normalizedModeratorIds, moderators: normalizedModerators });
  }

  function isOwner(user, userId = "") {
    const normalizedId = String(userId || "").trim();
    const ownerId = getOwnerUserId();
    if (ownerId && normalizedId) return normalizedId === ownerId;
    return normalizeUser(user) === getOwnerUser();
  }

  function isModerator(user, userId = "") {
    const normalized = normalizeUser(user);
    const normalizedId = String(userId || "").trim();
    if (!normalized && !normalizedId) return false;
    if (isOwner(normalized, normalizedId)) return true;
    const roles = readRoles();
    if (normalizedId && Array.isArray(roles.moderatorIds) && roles.moderatorIds.includes(normalizedId)) return true;
    return Array.isArray(roles.moderators) && roles.moderators.includes(normalized);
  }

  function showStatus(el, message, isError = false) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("is-error", isError);
    el.classList.toggle("is-success", !isError && Boolean(message));
  }

  function escHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  (function initNavVisibility() {
    function submitLoginHref() {
      return `Login.html?next=${encodeURIComponent("Submit.html")}`;
    }

    function applyNavVisibility() {
      const activeUser = getActiveUser();
      const navModerationItem = document.getElementById("navModerationItem");
      const navProfileItem = document.getElementById("navProfileItem");
      const navLoginItem = document.getElementById("navLoginItem");
      const navSubmitLink = document.getElementById("navSubmitLink");
      if (navModerationItem) {
        navModerationItem.style.display = isModerator(activeUser) ? "" : "none";
      }
      if (navProfileItem) {
        navProfileItem.style.display = activeUser ? "" : "none";
      }
      if (navLoginItem) {
        navLoginItem.style.display = activeUser ? "none" : "";
      }
      if (navSubmitLink) {
        navSubmitLink.setAttribute("href", activeUser ? "Submit.html" : submitLoginHref());
      }
    }

    syncActiveUserFromServer().finally(applyNavVisibility);
    applyNavVisibility();
    window.addEventListener("component:loaded", (event) => {
      if (event.detail?.id === "navbar") {
        syncActiveUserFromServer().finally(applyNavVisibility);
        applyNavVisibility();
      }
    });
    window.addEventListener("storage", applyNavVisibility);
    window.addEventListener("pageshow", applyNavVisibility);
  })();

  (function initSubmitPage() {
    const form = document.getElementById("submitPhotoForm");
    const status = document.getElementById("submitPhotoStatus");
    if (!form) return;
    const submitTarget =
      `${window.location.pathname.split("/").pop() || "Submit.html"}${window.location.search || ""}`;
    const submitBtn = form.querySelector('button[type="submit"]');
    let isSubmittingPhoto = false;
    function redirectToLoginForSubmit() {
      const target = String(submitTarget || "Submit.html");
      try {
        sessionStorage.setItem("tb_post_login_redirect", target);
      } catch {}
      window.location.replace(`Login.html?next=${encodeURIComponent(target)}`);
    }

    if (!getActiveUser()) {
      syncActiveUserFromServer().then((user) => {
        if (!user) redirectToLoginForSubmit();
      });
    }

    const imageInput = document.getElementById("submitImageUrl");
    const titleInput = document.getElementById("submitTitle");
    const stationInput = document.getElementById("submitStation");
    const stationSuggestions = document.getElementById("submitStationSuggestions");
    const stationClearBtn = document.getElementById("submitStationClear");
    const stationSelectedFlag = document.getElementById("submitStationSelectedFlag");
    const compositionRows = document.getElementById("submitCompositionRows");
    const imageFileInput = document.getElementById("submitImageFile");
    const imagePickBtn = document.getElementById("submitImagePickBtn");
    const operatorInput = document.getElementById("submitOperator");
    const operatorSuggestions = document.getElementById("submitOperatorSuggestions");
    const operatorClearBtn = document.getElementById("submitOperatorClear");
    const operatorChips = document.getElementById("submitOperatorChips");
    const operatorAddBtn = document.getElementById("submitOperatorAdd");
    const maxOperators = 4;
    const trainTypePicker = document.getElementById("submitTrainTypePicker");
    const trainTypeInput = document.getElementById("submitTrainType");
    const dateInput = document.getElementById("submitDate");
    let selectedStation = null;
    let selectedOperator = "";
    let selectedOperators = [];
    let isAddingOperator = false;
    let selectedImageDataUrl = "";
    let stationOptionsCache = null;
    let operatorOptionsCache = null;
    const europeanOperatorOptions = [
      "Arriva",
      "Arriva Rail London",
      "Avanti West Coast",
      "BDZ",
      "Caledonian Sleeper",
      "Captrain",
      "CargoNet",
      "CFL",
      "Chiltern Railways",
      "CIE",
      "Comboios de Portugal",
      "CrossCountry",
      "ČD",
      "DB",
      "DSB",
      "East Midlands Railway",
      "Eesti Liinirongid",
      "Eurostar",
      "Euskotren",
      "Ferrovie del Sud Est",
      "Freightliner",
      "Gatwick Express",
      "Govia Thameslink Railway",
      "Grand Central",
      "Great Northern",
      "Greater Anglia",
      "Green Cargo",
      "GWR",
      "Hellenic Train",
      "Hull Trains",
      "Iarnród Éireann",
      "Infrabel",
      "Italo",
      "LNER",
      "London Northwestern Railway",
      "Lumo",
      "LVR",
      "LTG Link",
      "MÁV-START",
      "Merseyrail",
      "Metronom",
      "MTRX",
      "National Express",
      "Network Rail",
      "NMBS/SNCB",
      "NordWestBahn",
      "Northern",
      "NS",
      "NTV",
      "ÖBB",
      "OUIGO",
      "PKP Intercity",
      "Polregio",
      "ProRail",
      "Rail Force One",
      "Renfe",
      "RegioJet",
      "SBB",
      "ScotRail",
      "SNCF",
      "South Western Railway",
      "Southeastern",
      "Southern",
      "SŽ",
      "Tågåkeriet i Bergslagen",
      "TCDD Taşımacılık",
      "Thalys",
      "Trenitalia",
      "Transdev",
      "TransPennine Express",
      "Transport for Wales",
      "Trenord",
      "Ukrainian Railways",
      "Vias",
      "Vlexx",
      "VR",
      "West Midlands Railway",
      "Westbahn",
      "ZSSK",
    ];

    imagePickBtn?.addEventListener("click", () => {
      imageFileInput?.click();
    });

    imageFileInput?.addEventListener("change", () => {
      const picked = imageFileInput.files && imageFileInput.files[0];
      if (!picked || !imageInput) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) return;
        const img = new Image();
        img.onload = () => {
          try {
            const maxSide = 2400;
            const ratio = Math.min(1, maxSide / Math.max(img.width || 1, img.height || 1));
            const width = Math.max(1, Math.round((img.width || 1) * ratio));
            const height = Math.max(1, Math.round((img.height || 1) * ratio));
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              imageInput.value = result;
              return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/webp", 0.86);
            selectedImageDataUrl = compressed || result;
            imageInput.value = selectedImageDataUrl;
          } catch {
            selectedImageDataUrl = result;
            imageInput.value = result;
          }
        };
        img.onerror = () => {
          selectedImageDataUrl = result;
          imageInput.value = result;
        };
        img.src = result;
      };
      reader.readAsDataURL(picked);
    });

    function getStationOptions() {
      if (stationOptionsCache) return stationOptionsCache;
      const countryToFlag = {
        albania: "../images/Other/Flags/Albania.svg",
        andorra: "../images/Other/Flags/Andorra.svg",
        austria: "../images/Other/Flags/Austria.svg",
        belarus: "../images/Other/Flags/Belarus.svg",
        belgium: "../images/Other/Flags/Belgium.svg",
        bosniaandherzegovina: "../images/Other/Flags/BosniëHerzegovina.svg",
        bulgaria: "../images/Other/Flags/Bulgaria.svg",
        croatia: "../images/Other/Flags/Croatia.svg",
        cyprus: "../images/Other/Flags/Cyprus.svg",
        czechrepublic: "../images/Other/Flags/CzechRepublic.svg",
        denmark: "../images/Other/Flags/Denmark.svg",
        estonia: "../images/Other/Flags/Estonia.svg",
        finland: "../images/Other/Flags/Finland.svg",
        france: "../images/Other/Flags/France.svg",
        germany: "../images/Other/Flags/Germany.svg",
        greece: "../images/Other/Flags/Greece.svg",
        hungary: "../images/Other/Flags/Hungary.svg",
        iceland: "../images/Other/Flags/Iceland.svg",
        ireland: "../images/Other/Flags/Ireland.svg",
        italy: "../images/Other/Flags/Italy.svg",
        latvia: "../images/Other/Flags/Latvia.svg",
        liechtenstein: "../images/Other/Flags/Liechtenstein.svg",
        lithuania: "../images/Other/Flags/Lithuania.svg",
        luxembourg: "../images/Other/Flags/Luxembourg.svg",
        malta: "../images/Other/Flags/Malta.svg",
        moldova: "../images/Other/Flags/Moldova.svg",
        monaco: "../images/Other/Flags/Monaco.svg",
        montenegro: "../images/Other/Flags/Montenegro.svg",
        netherlands: "../images/Other/Flags/Netherlands.svg",
        northmacedonia: "../images/Other/Flags/NorthMacedonia.svg",
        norway: "../images/Other/Flags/Norway.svg",
        poland: "../images/Other/Flags/Poland.svg",
        portugal: "../images/Other/Flags/Portugal.svg",
        romania: "../images/Other/Flags/Romania.svg",
        russia: "../images/Other/Flags/Russia.svg",
        sanmarino: "../images/Other/Flags/SanMarino.svg",
        serbia: "../images/Other/Flags/Serbia.svg",
        slovakia: "../images/Other/Flags/Slovakia.svg",
        slovenia: "../images/Other/Flags/Slovenia.svg",
        spain: "../images/Other/Flags/Spain.svg",
        sweden: "../images/Other/Flags/Sweden.svg",
        switzerland: "../images/Other/Flags/Switzerland.svg",
        turkey: "../images/Other/Flags/Turkey.svg",
        ukraine: "../images/Other/Flags/Ukraine.svg",
        unitedkingdom: "../images/Other/Flags/UnitedKingdom.svg",
        vaticancity: "../images/Other/Flags/VaticanCity.svg",
      };
      const sources = Object.keys(window)
        .filter((key) => key.startsWith("STATIONS_") && Array.isArray(window[key]))
        .map((key) => window[key]);
      const isUsefulStationName = (value) => {
        const name = String(value || "").trim();
        if (!name) return false;
        const lower = name.toLowerCase();
        if (/^\d+\s*km(?:\s|$)/i.test(name)) return false;
        if (/^\d+[a-z]?\s*kilometers?\b/i.test(lower)) return false;
        if (/^\d+\s*-\s*\d+\s*km\b/i.test(lower)) return false;
        if (/\brailway station$/i.test(lower) && /^\d+/.test(lower)) return false;
        if (/^km\s*\d+/i.test(lower)) return false;
        return true;
      };

      const merged = new Map();
      sources
        .flat()
        .forEach((item) => {
          const name = String(item?.name || "").trim();
          const slug = canonicalStationSlug(item?.slug || name);
          const displayName = canonicalStationName(name, slug) || name;
          const country = String(item?.country || "").trim();
          const province = String(item?.province || item?.region || item?.state || "").trim();
          if (!name || !slug || !country) return;
          if (!isUsefulStationName(name)) return;
          const existing = merged.get(slug) || {};
          merged.set(slug, {
            ...existing,
            slug,
            name: displayName,
            province: province || existing.province || "",
            country: country || existing.country || "",
            coordinates: item?.coordinates && typeof item.coordinates === "object"
              ? { lat: Number(item.coordinates.lat), lng: Number(item.coordinates.lng) }
              : existing.coordinates || null,
            flag: countryToFlag[slugifyStationValue(country).replaceAll("-", "")] || existing.flag || "",
          });
        });
      stationOptionsCache = Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name));
      return stationOptionsCache;
    }

    function getOperatorOptions() {
      if (operatorOptionsCache) return operatorOptionsCache;
      const stationData = window.STATIONS_DATA && typeof window.STATIONS_DATA === "object"
        ? window.STATIONS_DATA
        : {};
      const byKey = new Map();
      const addOperator = (value) => {
        const label = String(value || "").trim();
        if (!label) return;
        const key = normalizeSearchText(label).replace(/[^a-z0-9]+/g, "");
        if (!key) return;
        if (!byKey.has(key)) byKey.set(key, label);
      };
      europeanOperatorOptions.forEach(addOperator);
      Object.values(stationData).forEach((station) => {
        const photos = Array.isArray(station?.photos) ? station.photos : [];
        photos.forEach((photo) => {
          String(photo?.operator || "")
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .forEach(addOperator);
        });
      });
      operatorOptionsCache = Array.from(byKey.values()).sort((a, b) => a.localeCompare(b));
      return operatorOptionsCache;
    }

    function normalizeDigitsDate(value) {
      const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
      if (digits.length <= 2) return digits;
      if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    }

    function parseDdMmYyyy(value) {
      const match = String(value || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/);
      if (!match) return null;
      const day = Number(match[1]);
      const month = Number(match[2]);
      const rawYear = String(match[3] || "");
      const year = rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear);
      const dt = new Date(year, month - 1, day);
      if (
        dt.getFullYear() !== year ||
        dt.getMonth() !== month - 1 ||
        dt.getDate() !== day
      ) {
        return null;
      }
      return dt;
    }

    function validateDateInput() {
      if (!dateInput) return true;
      const dt = parseDdMmYyyy(dateInput.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const valid = Boolean(dt) && dt <= today;
      dateInput.classList.toggle("is-error", !valid && dateInput.value.trim() !== "");
      return valid;
    }

    function hideSuggestionList(el) {
      if (!el) return;
      el.hidden = true;
      el.innerHTML = "";
    }

    function validateStationSelection() {
      if (!stationInput) return true;
      const typed = String(stationInput.value || "").trim().toLowerCase();
      const selectedName = String(selectedStation?.name || "").trim().toLowerCase();
      const ok = typed !== "" && selectedName !== "" && typed === selectedName;
      stationInput.classList.toggle("is-error", typed !== "" && !ok);
      return ok;
    }

    function applySelectedStationUI() {
      if (!stationInput || !stationClearBtn || !stationSelectedFlag) return;
      const hasSelection = Boolean(selectedStation && selectedStation.name);
      stationInput.classList.toggle("has-operator-selection", hasSelection);
      stationClearBtn.hidden = !hasSelection;
      if (!hasSelection) {
        stationSelectedFlag.hidden = true;
        stationSelectedFlag.src = "";
        return;
      }
      const flagPath = String(selectedStation.flag || "").trim();
      if (flagPath) {
        stationSelectedFlag.src = flagPath;
        stationSelectedFlag.hidden = false;
      } else {
        stationSelectedFlag.hidden = true;
      }
    }

    function operatorInitials(value) {
      const words = String(value || "")
        .replaceAll("/", " ")
        .replaceAll("-", " ")
        .split(/\s+/)
        .filter(Boolean);
      if (words.length === 0) return "?";
      if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
      return `${words[0][0] || ""}${words[1][0] || ""}`.toUpperCase();
    }

    function normalizeSearchText(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
    }

    function operatorMatchesQuery(operator, query) {
      const normalizedOperator = normalizeSearchText(operator);
      const normalizedQuery = normalizeSearchText(query);
      if (!normalizedQuery) return false;

      if (normalizedOperator.startsWith(normalizedQuery)) return true;

      const segments = normalizedOperator
        .replace(/[\/,+\-]/g, " ")
        .split(/\s+/)
        .filter(Boolean);
      return segments.some((segment) => segment.startsWith(normalizedQuery));
    }

    function getOperatorLogoPath(value) {
      const raw = String(value || "").trim();
      const key = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      const has = (needle) => key.includes(needle);

      if (has("nmbs") || has("sncb")) return "../images/Other/OperatorLogos/NMBS-SNCB.svg";
      if (has("rail force one")) return "../images/Other/OperatorLogos/RailForceOne.svg";
      if (has("eurostar")) return "../images/Other/OperatorLogos/Eurostar.svg";
      if (has("infrabel")) return "../images/Other/OperatorLogos/Infrabel.svg";
      if (has("heathrow express") || has("heatrow express")) return "../images/Other/OperatorLogos/HeatrowExpress.svg";
      if (has("arriva")) return "../images/Other/OperatorLogos/Arriva.svg";
      if (has("tgv inoui") || has("inoui")) return "../images/Other/OperatorLogos/TGVouigo.svg";
      if (has("sncf")) return "../images/Other/OperatorLogos/SNCF.svg";
      if (has("zssk")) return "../images/Other/OperatorLogos/ZSSK.svg";
      if (has("mav start") || has("mav")) return "../images/Other/OperatorLogos/MAV-start.svg";
      if (has("gwr") || has("great western railway")) return "../images/Other/OperatorLogos/GWR.svg";
      if (has("cd") || has("ceske drahy")) return "../images/Other/OperatorLogos/CD.svg";
      if (has("cfl")) return "../images/Other/OperatorLogos/CFL.svg";
      if (has("deutsche bahn") || has("db")) return "../images/Other/OperatorLogos/DB.svg";
      if (has("nederlandse spoorwegen") || has("ns international") || has("ns")) return "../images/Other/OperatorLogos/NS.svg";
      if (has("obb") || has("oebb")) return "../images/Other/OperatorLogos/OBB.svg";
      return "";
    }

    function getOperatorLogoClass(value) {
      const key = String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
      if (key.includes("db")) return "logo-db";
      if (key.includes("cd")) return "logo-cd";
      if (key.includes("zssk")) return "logo-zssk";
      if (key.includes("eurostar")) return "logo-eurostar";
      if (key.includes("obb") || key.includes("oebb")) return "logo-obb";
      if (key.includes("sncf")) return "logo-sncf";
      return "";
    }

    function rowIsComplete(row) {
      const values = Array.from(row.querySelectorAll("[data-sp-slot]"))
        .map((input) => String(input.value || "").trim())
        .filter(Boolean);
      return values.length > 0;
    }

    function getCompositionItems() {
      if (!compositionRows) return [];
      const firstInput = compositionRows.querySelector("[data-sp-slot]");
      const label = normalizeVehicleLabel(firstInput?.value);
      if (!label) return [];
      return [{ kind: "train", label }];
    }

    function buildCompositionTitle(items) {
      const lead = pickLeadCompositionItem(items);
      if (!lead) return "";
      return composeTrainLabel(splitTrainNumber(lead.train || lead.label || ""));
    }

    function syncCompositionTitle() {
      const items = getCompositionItems();
      if (titleInput) titleInput.value = buildCompositionTitle(items);
      return items;
    }

    function applyTrainTypeUI() {
      const selectedType = "trainset";
      if (trainTypeInput) trainTypeInput.value = selectedType;
      if (compositionRows) {
        const hasRows = compositionRows.querySelectorAll(".submit-composition-row").length > 0;
        if (!hasRows) appendCompositionRow();
      }
      return true;
    }

    function appendCompositionRow() {
      if (!compositionRows) return;
      const row = document.createElement("div");
      row.className = "submit-composition-row trainset";
      row.innerHTML = `
        <div class="submit-trainset-slots" data-trainset-slots>
          <input type="text" placeholder="e.g. HLE 18, AM 08, Class 373" data-sp-slot="1" />
        </div>
      `;
      compositionRows.appendChild(row);
      const labelInput = row.querySelector("[data-sp-slot]");
      labelInput?.addEventListener("input", () => {
        syncCompositionTitle();
      });
      labelInput?.addEventListener("blur", () => {
        labelInput.value = normalizeVehicleLabel(labelInput.value);
        syncCompositionTitle();
      });
    }

    function renderStationSuggestions() {
      if (!stationInput || !stationSuggestions) return;
      const q = String(stationInput.value || "").trim().toLowerCase();
      if (!q) {
        hideSuggestionList(stationSuggestions);
        selectedStation = null;
        return;
      }

      const norm = (value) =>
        String(value || "")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

      const startsLikeStationQuery = (item, query) => {
        const normalizedQuery = norm(query).trim();
        if (!normalizedQuery) return false;
        const nameSegments = norm(item.name).split(/[^a-z0-9]+/).filter(Boolean);
        const slugSegments = String(item.slug || "").toLowerCase().split("-").filter(Boolean);
        if (norm(item.name).startsWith(normalizedQuery)) return true;
        if (String(item.slug || "").toLowerCase().startsWith(normalizedQuery)) return true;
        return nameSegments.some((segment) => segment.startsWith(normalizedQuery))
          || slugSegments.some((segment) => segment.startsWith(normalizedQuery));
      };

      const matches = getStationOptions()
        .filter((item) => startsLikeStationQuery(item, q))
        .slice(0, 8);
      if (matches.length === 0) {
        hideSuggestionList(stationSuggestions);
        selectedStation = null;
        return;
      }
      stationSuggestions.innerHTML = matches
        .map(
          (item) => `
            <button class="moderator-suggestion submit-suggestion submit-station-suggestion" type="button" data-station-slug="${escHtml(item.slug)}">
              ${item.flag ? `<img src="${escHtml(item.flag)}" alt="${escHtml(item.country)} flag" />` : `<img src="../images/default-avatar.svg" alt="" />`}
              <span>
                <strong>${escHtml(item.name || item.slug)}</strong>
                <small>${escHtml(item.province ? `${item.province}, ${item.country || "-"}` : (item.country || "-"))}</small>
              </span>
            </button>
          `
        )
        .join("");
      stationSuggestions.hidden = false;
      validateStationSelection();
    }

    function renderOperatorSuggestions() {
      if (!operatorInput || !operatorSuggestions) return;
      if (selectedOperators.length >= maxOperators) {
        hideSuggestionList(operatorSuggestions);
        return;
      }
      const q = normalizeSearchText(operatorInput.value);
      if (!q) {
        hideSuggestionList(operatorSuggestions);
        return;
      }
      const matches = getOperatorOptions()
        .filter((item) => !selectedOperators.includes(item))
        .filter((item) => operatorMatchesQuery(item, q))
        .slice(0, 8);
      if (matches.length === 0) {
        hideSuggestionList(operatorSuggestions);
        return;
      }
      operatorSuggestions.innerHTML = matches
        .map((item) => {
          const logo = getOperatorLogoPath(item);
          return `
            <button class="moderator-suggestion submit-suggestion submit-operator-suggestion" type="button" data-operator-value="${escHtml(item)}">
              <span class="submit-operator-logo">
                ${logo
                  ? `<img class="${escHtml(getOperatorLogoClass(item))}" src="${escHtml(logo)}" alt="${escHtml(item)} logo" onerror="this.style.display='none'; this.nextElementSibling.hidden=false;" /><span hidden>${escHtml(operatorInitials(item))}</span>`
                  : `<span>${escHtml(operatorInitials(item))}</span>`}
              </span>
              <span><strong>${escHtml(item)}</strong></span>
            </button>
          `;
        })
        .join("");
      operatorSuggestions.hidden = false;
    }

    function renderOperatorChips() {
      if (!operatorChips) return;
      operatorChips.innerHTML = selectedOperators
        .map((operator) => {
          const logo = getOperatorLogoPath(operator);
          return `
            <button class="submit-operator-chip" type="button" data-remove-operator="${escHtml(operator)}" aria-label="Remove ${escHtml(operator)}">
              ${logo
                ? `<img class="submit-operator-chip-logo ${escHtml(getOperatorLogoClass(operator))}" src="${escHtml(logo)}" alt="${escHtml(operator)} logo" />`
                : `<span class="submit-operator-chip-fallback">${escHtml(operatorInitials(operator))}</span>`}
              <span class="submit-operator-chip-remove" aria-hidden="true">&times;</span>
              <span>${escHtml(operator)}</span>
            </button>
          `;
        })
        .join("");
    }

    function applySelectedOperatorUI() {
      if (!operatorInput || !operatorClearBtn || !operatorAddBtn) return;
      const hasSelection = selectedOperators.length > 0;
      const hasRoom = selectedOperators.length < maxOperators;
      operatorClearBtn.hidden = true;
      operatorAddBtn.hidden = !hasSelection || !hasRoom;
      const showInput = !hasSelection || (hasRoom && isAddingOperator);
      operatorInput.hidden = !showInput;
      if (!showInput) {
        operatorInput.value = "";
        hideSuggestionList(operatorSuggestions);
      }
      selectedOperator = selectedOperators[0] || "";
    }

    operatorChips?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-remove-operator]");
      if (!btn) return;
      const value = String(btn.dataset.removeOperator || "").trim();
      if (!value) return;
      selectedOperators = selectedOperators.filter((item) => item !== value);
      if (selectedOperators.length === 0) {
        isAddingOperator = false;
      }
      renderOperatorChips();
      applySelectedOperatorUI();
      hideSuggestionList(operatorSuggestions);
    });

    stationInput?.addEventListener("input", () => {
      selectedStation = null;
      applySelectedStationUI();
      renderStationSuggestions();
      validateStationSelection();
    });

    stationSuggestions?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-station-slug]");
      if (!btn || !stationInput) return;
      const pickedSlug = String(btn.dataset.stationSlug || "").toLowerCase();
      const picked = getStationOptions().find((item) => item.slug === pickedSlug);
      selectedStation = picked || null;
      stationInput.value = picked ? picked.name : pickedSlug;
      applySelectedStationUI();
      hideSuggestionList(stationSuggestions);
      validateStationSelection();
    });

    stationInput?.addEventListener("blur", validateStationSelection);

    stationClearBtn?.addEventListener("click", () => {
      selectedStation = null;
      if (stationInput) {
        stationInput.value = "";
        stationInput.focus();
      }
      applySelectedStationUI();
      hideSuggestionList(stationSuggestions);
      validateStationSelection();
    });

    operatorInput?.addEventListener("input", () => {
      isAddingOperator = true;
      applySelectedOperatorUI();
      renderOperatorSuggestions();
    });

    operatorSuggestions?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-operator-value]");
      if (!btn || !operatorInput) return;
      if (selectedOperators.length >= maxOperators) return;
      const picked = String(btn.dataset.operatorValue || "").trim();
      if (picked && !selectedOperators.includes(picked)) selectedOperators.push(picked);
      isAddingOperator = false;
      operatorInput.value = "";
      renderOperatorChips();
      applySelectedOperatorUI();
      hideSuggestionList(operatorSuggestions);
    });

    operatorClearBtn?.addEventListener("click", () => {
      selectedOperator = "";
      selectedOperators = [];
      isAddingOperator = false;
      if (operatorInput) {
        operatorInput.value = "";
        operatorInput.focus();
      }
      renderOperatorChips();
      applySelectedOperatorUI();
      hideSuggestionList(operatorSuggestions);
    });

    operatorAddBtn?.addEventListener("click", () => {
      if (!operatorInput) return;
      if (selectedOperators.length >= maxOperators) return;
      isAddingOperator = true;
      applySelectedOperatorUI();
      operatorInput.focus();
      hideSuggestionList(operatorSuggestions);
    });

    trainTypePicker?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-train-type]");
      if (!btn || !trainTypeInput) return;
      trainTypeInput.value = String(btn.dataset.trainType || "");
      if (compositionRows) compositionRows.innerHTML = "";
      applyTrainTypeUI();
    });

    dateInput?.addEventListener("input", () => {
      dateInput.value = normalizeDigitsDate(dateInput.value);
      validateDateInput();
    });

    dateInput?.addEventListener("blur", validateDateInput);

    if (dateInput) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, "0");
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const yyyy = String(now.getFullYear());
      dateInput.placeholder = `${dd}/${mm}/${yyyy}`;
    }

    if (trainTypeInput && !String(trainTypeInput.value || "").trim()) {
      trainTypeInput.value = "trainset";
    }
    applySelectedStationUI();
    renderOperatorChips();
    applyTrainTypeUI();

    try {
      const params = new URLSearchParams(window.location.search || "");
      const stationParam = String(params.get("station") || "").trim().toLowerCase();
      const operatorParam = String(params.get("operator") || "").trim();
      const dateParam = String(params.get("date") || "").trim();
      const locationParam = String(params.get("location") || "").trim();
      const notesParam = String(params.get("notes") || "").trim();
      if (stationParam) {
        const bySlug = getStationOptions().find((item) => item.slug === stationParam);
        const byName = getStationOptions().find((item) => item.name.toLowerCase() === stationParam);
        const picked = bySlug || byName || null;
        if (picked && stationInput) {
          stationInput.value = picked.name;
          selectedStation = picked;
          applySelectedStationUI();
        }
      }
      if (operatorParam) {
        selectedOperators = Array.from(
          new Set(
            operatorParam
              .split(",")
              .map((part) => part.trim())
              .filter(Boolean),
          ),
        );
        selectedOperator = selectedOperators[0] || "";
        isAddingOperator = false;
        if (operatorInput) operatorInput.value = "";
        renderOperatorChips();
        applySelectedOperatorUI();
      }
      if (dateParam) form.date.value = dateParam;
      if (locationParam && stationInput && !stationInput.value) stationInput.value = locationParam;
      if (notesParam) form.notes.value = notesParam;
    } catch {}

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (isSubmittingPhoto) return;
      const user = getActiveUser();
    const userId = getActiveUserId();
      if (!user) {
        redirectToLoginForSubmit();
        return;
      }

      const stationName = String(stationInput?.value || "").trim();
      const pickedStation = getStationOptions().find(
        (item) => item.name.toLowerCase() === stationName.toLowerCase(),
      );
      const stationSlug = String(pickedStation?.slug || "").trim().toLowerCase();
      const stationCountry = String(pickedStation?.country || "").trim();
      const composition = syncCompositionTitle();
      const title = String(titleInput?.value || "").trim();
      const image = String(selectedImageDataUrl || imageInput?.value || "").trim();
      const date = String(dateInput?.value || "").trim();
      const operator = selectedOperators.join(", ").trim();
      const trainType = String(trainTypeInput?.value || "").trim();
      const notes = String(form.notes?.value || "").trim();
      compositionRows?.classList.remove("is-error");
      trainTypePicker?.classList.remove("is-error");

      if (!stationSlug || !stationCountry || !title || !image || !date || !operator || !trainType) {
        showStatus(status, "Please complete all required fields.", true);
        stationInput?.classList.toggle("is-error", !stationSlug || !pickedStation);
        compositionRows?.classList.toggle("is-error", !title);
        trainTypePicker?.classList.toggle("is-error", !trainType);
        imageInput?.classList.toggle("is-error", !image);
        dateInput?.classList.toggle("is-error", !date);
        operatorInput?.classList.toggle("is-error", !operator);
        return;
      }
      if (!selectedStation || !pickedStation || stationName.toLowerCase() !== String(selectedStation.name || "").toLowerCase()) {
        showStatus(status, "Please select a station from the list.", true);
        validateStationSelection();
        return;
      }
      if (!validateDateInput()) {
        showStatus(status, "Date must be valid and cannot be in the future.", true);
        return;
      }

      isSubmittingPhoto = true;
      if (submitBtn) submitBtn.disabled = true;

      fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          stationSlug,
          stationName,
          stationProvince: String(pickedStation?.province || ""),
          stationCountry,
          stationCoords: pickedStation?.coordinates || null,
          title,
          composition,
          trainType,
          image,
          date,
          operator,
          notes,
        }),
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Upload failed."));
          form.reset();
          selectedStation = null;
          selectedOperator = "";
          selectedOperators = [];
          isAddingOperator = false;
          selectedImageDataUrl = "";
          if (trainTypeInput) trainTypeInput.value = "trainset";
          applySelectedStationUI();
          applySelectedOperatorUI();
          applyTrainTypeUI();
          renderOperatorChips();
          if (compositionRows) {
            compositionRows.innerHTML = "";
            compositionRows.classList.remove("is-error");
            appendCompositionRow();
          }
          showStatus(status, "Submission sent to moderation.");
        })
        .catch((err) => {
          showStatus(status, String(err?.message || "Upload failed due to a save error."), true);
        })
        .finally(() => {
          isSubmittingPhoto = false;
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  })();

  (function initProfilePage() {
    const form = document.getElementById("profileForm");
    const status = document.getElementById("profileStatus");
    if (!form) return;
    const defaultAvatar = "../images/default-avatar.svg";
    const avatarFileInput = document.getElementById("profileAvatarFile");
    const avatarTrigger = document.getElementById("profileAvatarTrigger");
    const avatarPreview = document.getElementById("profileAvatarPreview");
    const summaryName = document.getElementById("profileSummaryName");
    const summaryMeta = document.getElementById("profileSummaryMeta");
    const roleBadge = document.getElementById("profileRoleBadge");
    const logoutBtn = document.getElementById("profileLogoutBtn");

    logoutBtn?.addEventListener("click", () => {
      fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      }).finally(() => {
        localStorage.removeItem(sessionKey);
        window.location.href = "Login.html";
      });
    });

    const user = getActiveUser();
    const userId = getActiveUserId();
    if (!user) {
      if (summaryName) summaryName.textContent = "Guest";
      if (summaryMeta) summaryMeta.textContent = "Not logged in";
      if (roleBadge) roleBadge.textContent = "Member";
      if (avatarPreview) avatarPreview.src = defaultAvatar;
      showStatus(status, "Please log in first to edit your profile.", true);
      form.querySelectorAll("input, button").forEach((el) => {
        el.disabled = true;
      });
      if (logoutBtn) logoutBtn.disabled = true;
      return;
    }

    const profiles = readJson(profileKey, {});
    const profile = profiles[user] || {};
    const owner = getOwnerUser();
    const userIsOwner = isOwner(user, userId);
    const userIsModerator = isModerator(user, userId);
    const moderatorCard = document.getElementById("moderatorManagementCard");
    const moderatorForm = document.getElementById("moderatorAssignForm");
    const moderatorStatus = document.getElementById("moderatorAssignStatus");
    const moderatorList = document.getElementById("moderatorList");
    const moderatorInput = document.getElementById("moderatorUsername");
    const moderatorSuggestions = document.getElementById("moderatorSuggestions");
    const moderatorAddBtn = document.getElementById("moderatorAddBtn");
    let selectedModeratorUser = "";
    let selectedModeratorId = "";

    form.profileUsername.value = user;
    let profileAvatarValue = String(profile.avatar || "").trim();
    form.profileEmail.value = "";
    form.profileEmail.readOnly = true;
    form.profileNotifications.checked = Boolean(profile.notifications);

    if (summaryName) summaryName.textContent = user;
    if (summaryMeta) summaryMeta.textContent = "Loading email...";
    if (roleBadge) roleBadge.textContent = userIsOwner ? "Owner" : userIsModerator ? "Moderator" : "Member";
    if (avatarPreview) {
      avatarPreview.src = profileAvatarValue || defaultAvatar;
      avatarPreview.alt = `${user} avatar`;
    }

    fetchSessionUser().then((sessionUser) => {
      const sessionEmail = String(sessionUser?.email || "").trim().toLowerCase();
      form.profileEmail.value = sessionEmail;
      if (summaryMeta) summaryMeta.textContent = sessionEmail || "No email set";
    });

    avatarTrigger?.addEventListener("click", () => {
      avatarFileInput?.click();
    });

    avatarFileInput?.addEventListener("change", () => {
      const picked = avatarFileInput.files && avatarFileInput.files[0];
      if (!picked) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) return;
        profileAvatarValue = result;
        if (avatarPreview) avatarPreview.src = result;
      };
      reader.readAsDataURL(picked);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      profiles[user] = {
        avatar: String(profileAvatarValue || "").trim(),
        notifications: Boolean(form.profileNotifications?.checked),
      };
      writeJson(profileKey, profiles);
      if (summaryName) summaryName.textContent = user;
      if (avatarPreview) avatarPreview.src = profiles[user].avatar || defaultAvatar;
      showStatus(status, "Profile saved.");
    });

    function renderModeratorList() {
      if (!moderatorList) return;
      const roles = readRoles();
      if (roles.moderatorIds.length === 0) {
        moderatorList.innerHTML = '<p class="muted">No extra moderators yet.</p>';
        return;
      }
      moderatorList.innerHTML = roles.moderatorIds
        .map((modId) => {
          const item = getUserSnapshotById(modId);
          return `
            <article class="moderation-item" data-mod-user-id="${item.id}">
              <h3>${item.label}</h3>
              <div class="moderation-actions">
                <button class="btn btn-danger" type="button" data-mod-action="remove">Remove moderator</button>
              </div>
            </article>
          `;
        })
        .join("");
    }

    function getUserSnapshotById(userId) {
      const id = String(userId || "").trim();
      const accountsMap = readJson(accountsKey, {});
      const profilesMap = readJson(profileKey, {});
      const usernames = Object.keys(accountsMap || {});
      const matchUsername = usernames.find((name) => String(accountsMap?.[name]?.id || "").trim() === id) || "";
      const profileItem = profilesMap[matchUsername] || {};
      return { id, username: matchUsername, label: matchUsername || `User #${id}`, avatar: String(profileItem.avatar || defaultAvatar), email: "" };
    }

    function getModeratorCandidates(query) {
      const accountsMap = readJson(accountsKey, {});
      const profilesMap = readJson(profileKey, {});
      const q = normalizeUser(query);
      if (!q) return [];
      const usernames = Array.from(new Set([...Object.keys(accountsMap || {}), ...Object.keys(profilesMap || {})]));
      return usernames
        .map((username) => normalizeUser(username))
        .filter((username) => {
          if (!username) return false;
          return username.includes(q);
        })
        .map((username) => {
          const profileItem = profilesMap[username] || {};
          const accountItem = accountsMap[username] || {};
          const id = String(accountItem?.id || "").trim();
          return { username, id, avatar: String(profileItem.avatar || defaultAvatar), email: "" };
        })
        .filter((item) => Boolean(item.id))
        .filter((item) => !isOwner(item.username, item.id))
        .slice(0, 8);
    }

    function hideModeratorSuggestions() {
      if (!moderatorSuggestions) return;
      moderatorSuggestions.hidden = true;
      moderatorSuggestions.innerHTML = "";
    }

    function renderModeratorSuggestions() {
      if (!moderatorSuggestions || !moderatorInput) return;
      const candidates = getModeratorCandidates(moderatorInput.value);
      const roles = readRoles();
      const filtered = candidates.filter((item) => !roles.moderatorIds.includes(item.id));
      if (filtered.length === 0) {
        hideModeratorSuggestions();
        selectedModeratorUser = "";
        selectedModeratorId = "";
        if (moderatorAddBtn) moderatorAddBtn.disabled = true;
        return;
      }
      moderatorSuggestions.innerHTML = filtered
        .map(
          (item) => `
            <button class="moderator-suggestion" type="button" data-mod-suggest="${item.username}" data-mod-suggest-id="${item.id}">
              <img src="${escHtml(item.avatar)}" alt="${escHtml(item.username)} avatar" />
              <span>
                <strong>${escHtml(item.username)}</strong>
                <small>${item.email ? escHtml(item.email) : ""}</small>
              </span>
            </button>
          `
        )
        .join("");
      moderatorSuggestions.hidden = false;
      if (moderatorAddBtn) moderatorAddBtn.disabled = !(selectedModeratorUser && selectedModeratorId);
    }

    if (userIsOwner && moderatorCard) {
      moderatorCard.hidden = false;
      renderModeratorList();
      renderModeratorSuggestions();

      moderatorInput?.addEventListener("input", renderModeratorSuggestions);
      moderatorInput?.addEventListener("input", () => {
        selectedModeratorUser = "";
        selectedModeratorId = "";
        if (moderatorAddBtn) moderatorAddBtn.disabled = true;
      });

      moderatorSuggestions?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-mod-suggest]");
        if (!btn || !moderatorInput) return;
        moderatorInput.value = String(btn.dataset.modSuggest || "");
        selectedModeratorUser = normalizeUser(btn.dataset.modSuggest || "");
        selectedModeratorId = String(btn.dataset.modSuggestId || "").trim();
        hideModeratorSuggestions();
        if (moderatorAddBtn) moderatorAddBtn.disabled = !(selectedModeratorUser && selectedModeratorId);
      });

      moderatorForm?.addEventListener("submit", (event) => {
        event.preventDefault();
        const candidate = normalizeUser(selectedModeratorUser || moderatorForm.moderator_username?.value);
        const candidateId = String(selectedModeratorId || findUserIdByUsername(candidate)).trim();
        if (!candidate || !candidateId) {
          showStatus(moderatorStatus, "Select a member from the list first.", true);
          return;
        }
        if (!selectedModeratorUser || candidate !== normalizeUser(moderatorInput?.value) || !candidateId) {
          showStatus(moderatorStatus, "Select a member from the list first.", true);
          return;
        }
        if (isOwner(candidate, candidateId)) {
          showStatus(moderatorStatus, "Owner already has full access.", true);
          return;
        }
        const roles = readRoles();
        const profilesMap = readJson(profileKey, {});
        const accountsMap = readJson(accountsKey, {});
        const accountExists = Boolean(accountsMap[candidate] || profilesMap[candidate]);
        if (!accountExists) {
          showStatus(moderatorStatus, "Select an existing member from the list.", true);
          return;
        }
        if (roles.moderatorIds.includes(candidateId)) {
          showStatus(moderatorStatus, "This user is already a moderator.", true);
          return;
        }
        roles.moderatorIds.push(candidateId);
        writeRoles(roles);
        moderatorForm.reset();
        selectedModeratorUser = "";
        selectedModeratorId = "";
        hideModeratorSuggestions();
        if (moderatorAddBtn) moderatorAddBtn.disabled = true;
        showStatus(moderatorStatus, "Moderator added.");
        renderModeratorList();
      });

      moderatorList?.addEventListener("click", (event) => {
        const btn = event.target.closest("[data-mod-action='remove']");
        if (!btn) return;
        const item = btn.closest("[data-mod-user-id]");
        const modId = String(item?.dataset.modUserId || "").trim();
        if (!modId) return;
        const roles = readRoles();
        roles.moderatorIds = roles.moderatorIds.filter((id) => id !== modId);
        writeRoles(roles);
        showStatus(moderatorStatus, "Moderator removed.");
        renderModeratorList();
        renderModeratorSuggestions();
      });
    }
  })();

  (function initModerationPage() {
    const list = document.getElementById("moderationList");
    const status = document.getElementById("moderationStatus");
    if (!list) return;

    const user = getActiveUser();
    const userId = getActiveUserId();
    if (!isModerator(user, userId)) {
      showStatus(status, "Only moderators can access this page.", true);
      return;
    }

    let pending = [];

    function formatSubmissionCompositionPart(part) {
      const label = normalizeVehicleLabel(part?.train || part?.label);
      if (!label) return "";
      return label;
    }

    function getSubmissionCompositionText(item) {
      const parts = Array.isArray(item?.composition) ? item.composition : [];
      const lead = pickLeadCompositionItem(parts);
      return lead ? formatSubmissionCompositionPart(lead) : "";
    }

    function render() {

      if (pending.length === 0) {
        list.innerHTML = '<p class="muted">No pending submissions.</p>';
        return;
      }

      list.innerHTML = pending
        .map(
          (item) => `
            <article class="moderation-item" data-submission-id="${item.id}">
              <h3>${escHtml(getSubmissionCompositionText(item) || item.title)}</h3>
              <p><strong>Station:</strong> ${item.stationName || item.stationSlug}</p>
              <div class="moderation-preview">
                ${item.image
                  ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.title)}" loading="lazy" />`
                  : ""}
                <p class="moderation-preview-fallback" ${item.image ? "hidden" : ""}>Image preview unavailable. Check submitted image path.</p>
              </div>
              <p><strong>Date:</strong> ${item.date}</p>
              ${Array.isArray(item.composition) && item.composition.length > 0
                ? `<p><strong>Train:</strong> ${escHtml(getSubmissionCompositionText(item))}</p>`
                : ""}
              <p><strong>Operator:</strong> ${item.operator}</p>
              <p><strong>By:</strong> ${item.submittedBy}</p>
              ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ""}
              <div class="moderation-actions">
                <button class="btn btn-primary" type="button" data-action="approve">Approve</button>
                <button class="btn btn-danger" type="button" data-action="reject">Reject</button>
              </div>
            </article>
          `
        )
        .join("");

      list.querySelectorAll(".moderation-preview").forEach((preview) => {
        const img = preview.querySelector("img");
        const fallback = preview.querySelector(".moderation-preview-fallback");
        if (!fallback) return;
        if (!img) {
          fallback.hidden = false;
          return;
        }
        const showImage = () => {
          img.style.display = "";
          fallback.hidden = true;
        };
        const showFallback = () => {
          img.style.display = "none";
          fallback.hidden = false;
        };
        if (img.complete) {
          if (img.naturalWidth > 0) {
            showImage();
          } else {
            showFallback();
          }
        }
        img.addEventListener("load", () => {
          showImage();
        });
        img.addEventListener("error", () => {
          showFallback();
        });
      });
    }

    list.addEventListener("click", async (event) => {
      const btn = event.target.closest("button[data-action]");
      if (!btn) return;
      const itemEl = btn.closest("[data-submission-id]");
      const id = itemEl?.dataset.submissionId;
      if (!id) return;
      const action = btn.dataset.action;
      try {
        const res = await fetch(`/api/submissions/${encodeURIComponent(id)}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Moderation failed."));
        try {
          sessionStorage.removeItem("tb_approved_submissions_cache_v1");
          sessionStorage.removeItem("tb_approved_submissions_cache_v2");
        } catch {}
        pending = pending.filter((item) => item.id !== id);
        render();
      } catch (err) {
        showStatus(status, String(err?.message || "Moderation failed."), true);
      }
    });

    fetch("/api/submissions/pending", { credentials: "include" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) throw new Error(String(data?.error || "Could not load submissions."));
        pending = Array.isArray(data.items) ? data.items : [];
        render();
      })
      .catch((err) => {
        showStatus(status, String(err?.message || "Could not load submissions."), true);
      });
  })();

})();

window.addEventListener("load", () => {
  handleNavbarScroll();
  setActiveNavLink();
  prepareImageFallbacks(document);
});

window.addEventListener("component:loaded", (e) => {
  if (e.detail?.id !== "navbar") return;

  handleNavbarScroll();
  setActiveNavLink();
});

