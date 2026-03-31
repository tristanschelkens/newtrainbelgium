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

(function initPhotoFilters() {
  const filters = document.getElementById("photoFilters");
  const grid = document.getElementById("photoGrid");
  const mapSection = document.getElementById("stationsMap")?.closest("section");
  const searchInput = document.getElementById("photoSearch");
  const resetFiltersButton = document.getElementById("photoResetFilters");
  const filterMenu = document.getElementById("photoFilterMenu");
  const filterToggle = document.getElementById("photoFilterToggle");
  const filterPanel = document.getElementById("photoFilterPanel");
  const filterSummary = document.getElementById("photoFilterSummary");
  const operatorFilters = document.getElementById("photoOperatorFilters");
  const materialFilters = document.getElementById("photoMaterialFilters");
  const stationData = window.STATIONS_DATA || {};

  if (!filters || !grid) return;

  const buttons = Array.from(filters.querySelectorAll(".filter-btn"));
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

  function normalizeSearchValue(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function buildSearchIndex(value) {
    const normalized = normalizeSearchValue(value);
    const compact = normalized.replace(/[^a-z0-9]+/g, "");
    return `${normalized} ${compact}`.trim();
  }

  function esc(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatSearchTagLabel(label) {
    return String(label || "").replace(
      /(\d+)\s*x\s*/gi,
      (_, n) => `${n}${String.fromCharCode(215)} `,
    );
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
        const kind = String(item.kind || "carriage").toLowerCase();
        const cls =
          kind === "traction"
            ? item.active !== false
              ? "station-meta-chip"
              : "station-meta-inactive"
            : "station-meta-carriage";
        const plus =
          index < visibleItems.length - 1
            ? '<span class="station-meta-plus">+</span>'
            : "";

        return `<span class="${cls}">${esc(formatSearchTagLabel(item.label || ""))}</span>${plus}`;
      })
      .join("");

    return hasOverflow ? `${tagsHtml}<span class="station-meta-plus">+</span>` : tagsHtml;
  }

  function normalizeFacetKey(value) {
    return normalizeSearchValue(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  function deriveMaterialFacet(item) {
    if (!item) return null;
    const kind = String(item.kind || "").toLowerCase();
    if (kind !== "traction" && kind !== "carriage") return null;

    const explicitLabel = String(item.filterLabel || "").trim();
    const explicitKey = String(item.filterKey || "").trim();
    if (explicitLabel) {
      return {
        key: normalizeFacetKey(explicitKey || explicitLabel),
        label: explicitLabel,
      };
    }

    const label = String(item.label || "").trim();
    if (!label) return null;

    const normalized = normalizeSearchValue(label);
    const withoutCount = normalized.replace(/^\d+\s*x\s*/i, "").trim();

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
    if (withoutCount.startsWith("flirt 3")) {
      return { key: "flirt-3", label: "FLIRT 3" };
    }
    if (withoutCount.startsWith("virm")) {
      return { key: "virm", label: "VIRM" };
    }
    if (withoutCount.startsWith("mw41")) {
      return { key: "mw41", label: "MW41" };
    }
    if (withoutCount.startsWith("am08")) {
      return { key: "am08", label: "AM08" };
    }
    if (withoutCount.startsWith("e320")) {
      return { key: "e320", label: "E320" };
    }
    if (withoutCount.startsWith("traxx")) {
      return { key: "traxx", label: "TRAXX" };
    }
    if (withoutCount.startsWith("br146")) {
      return { key: "br146", label: "BR146" };
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
      if (
        compact.startsWith("hle18") ||
        compact.startsWith("hle19") ||
        compact.startsWith("hle18/19") ||
        compact.startsWith("hle18-19")
      ) {
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
      <div class="station-lightbox-watermark">&copy; trainbelgium.com</div>
    </div>
  `;
  document.body.appendChild(searchLightbox);

  const searchLightboxImg = searchLightbox.querySelector(".station-lightbox-media img");
  const searchLightboxOperator = searchLightbox.querySelector(".station-lightbox-operator");
  const searchLightboxDate = searchLightbox.querySelector(".station-lightbox-date");
  const searchLightboxMeta = searchLightbox.querySelector(".station-lightbox-meta");
  const searchLightboxClose = searchLightbox.querySelector(".station-lightbox-close");
  const searchLightboxPrev = searchLightbox.querySelector(".station-lightbox-nav.prev");
  const searchLightboxNext = searchLightbox.querySelector(".station-lightbox-nav.next");
  let currentSearchSeriesPool = [];
  let currentSearchSeriesPosition = 0;

  function closeSearchLightbox() {
    searchLightbox.classList.remove("is-open");
    searchLightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
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
          .map((label) => `<span class="station-meta-chip">${esc(label)}</span>`)
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
      searchLightboxMeta.innerHTML = entry.fullMetaHtml || entry.metaHtml || "";
      searchLightboxMeta.style.display = Boolean(entry.fullMetaHtml || entry.metaHtml)
        ? "flex"
        : "none";
    }

    searchLightbox.classList.add("is-open");
    searchLightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
    updateSearchLightboxNav();
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

  function setActiveButton(value) {
    buttons.forEach((btn) => {
      const isActive = (btn.dataset.filter || "").toLowerCase() === value;
      btn.classList.toggle("active", isActive);
    });

    if (filterSummary) {
      const activeButton = buttons.find(
        (btn) => (btn.dataset.filter || "").toLowerCase() === value,
      );
      const parts = [];
      if (value !== "all") parts.push(activeButton?.textContent?.trim() || "Country");
      if (activeOperatorFilter !== "all") {
        const btn = operatorFilters?.querySelector(`[data-operator-filter="${activeOperatorFilter}"]`);
        parts.push(btn?.textContent?.trim() || "Operator");
      }
      if (activeMaterialFilter !== "all") {
        const btn = materialFilters?.querySelector(`[data-material-filter="${activeMaterialFilter}"]`);
        parts.push(btn?.textContent?.trim() || "Train type");
      }
      filterSummary.textContent = parts.length > 0 ? parts.join(" · ") : "All filters";
    }
  }

  function setFilterMenuOpen(isOpen) {
    if (!filterToggle || !filterPanel) return;
    filterToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    filterPanel.hidden = !isOpen;
  }

  function applyFilters() {
    let visibleCount = 0;
    const queryTerms = normalizeSearchValue(activeQuery)
      .split(/\s+/)
      .filter(Boolean);
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
          queryTerms.every((term) => photo.search.includes(term));
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
            >
              <img loading="lazy" src="${esc(photo.src)}" alt="${esc(photo.alt)}" />
              <div class="overlay"><h3>${esc(photo.stationName)}</h3></div>
            </button>
          `,
        )
        .join("");

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
        queryTerms.every((term) => searchText.includes(term));
      const show = countryMatch && operatorMatch && materialMatch && queryMatch;

      let targetHref = defaultHref;
      if (queryTerms.length > 0) {
        const matchingPhoto = photoEntries.find((entry) =>
          queryTerms.every((term) => entry.search.includes(term)),
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

  function resetPhotoFilters() {
    activeFilter = "all";
    activeOperatorFilter = "all";
    activeMaterialFilter = "all";
    activeQuery = "";

    if (searchInput) {
      searchInput.value = "";
    }

    renderFacetButtons(operatorFilters, operatorOptions, activeOperatorFilter, "data-operator-filter");
    renderFacetButtons(materialFilters, sortedMaterialOptions, activeMaterialFilter, "data-material-filter");
    setActiveButton(activeFilter);
    applyFilters();
    persistPhotoFilter(activeFilter);
    persistPhotoSearch(activeQuery);
    persistFacetParam("operator", activeOperatorFilter);
    persistFacetParam("material", activeMaterialFilter);
    setFilterMenuOpen(false);
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
      setFilterMenuOpen(false);
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

  if (filterToggle && filterPanel) {
    filterToggle.addEventListener("click", () => {
      const isOpen = filterToggle.getAttribute("aria-expanded") === "true";
      setFilterMenuOpen(!isOpen);
    });

    document.addEventListener("click", (e) => {
      if (!filterMenu || !filterMenu.contains(e.target)) {
        setFilterMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        setFilterMenuOpen(false);
      }
    });
  }

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

  resetFiltersButton?.addEventListener("click", resetPhotoFilters);

  const urlParams = new URLSearchParams(window.location.search);
  const queryFilter = (urlParams.get("filter") || "all").toLowerCase();
  const querySearch = (urlParams.get("q") || "").trim();
  const queryOperator = (urlParams.get("operator") || "all").toLowerCase();
  const queryMaterial = (urlParams.get("material") || "all").toLowerCase();
  const initialFilter = availableFilters.has(queryFilter) ? queryFilter : "all";
  activeFilter = initialFilter;
  activeOperatorFilter =
    queryOperator === "all" || operatorOptions.some((option) => option.key === queryOperator)
      ? queryOperator
      : "all";
  activeMaterialFilter =
    queryMaterial === "all" || sortedMaterialOptions.some((option) => option.key === queryMaterial)
      ? queryMaterial
      : "all";
  activeQuery = querySearch;

  if (searchInput) {
    searchInput.value = activeQuery;
  }

  renderFacetButtons(operatorFilters, operatorOptions, activeOperatorFilter, "data-operator-filter");
  renderFacetButtons(materialFilters, sortedMaterialOptions, activeMaterialFilter, "data-material-filter");
  setActiveButton(initialFilter);
  applyFilters();
  setFilterMenuOpen(false);

  grid.addEventListener("click", (e) => {
    const searchCard = e.target.closest(".photo-search-result");
    if (!searchCard) return;

    const slug = String(searchCard.dataset.photoSlug || "").trim().toLowerCase();
    const index = Number(searchCard.dataset.photoIndex || 0);
    const entry = (photoSeriesGroups.get(searchCard.dataset.seriesKey || "") || []).find(
      (photo) => photo.slug === slug && photo.index === index,
    );

    if (entry) {
      openSearchLightboxEntry(entry);
    }
  });
})();

(function initLatestHomePhoto() {
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
  const mapEl = document.getElementById("stationsMap");
  const grid = document.getElementById("photoGrid");

  if (!mapEl || !grid || typeof window.L === "undefined") return;

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
    const typeWithoutCount = lowerType.replace(/^\d+\s*[xÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½]\s*/, "");
    const normalizedType = typeWithoutCount.replace(/\s+/g, " ").trim();
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

    const withoutCount = normalized.replace(/^\d+\s*[xÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½]\s*/i, "");
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
          const tractionLabel = label
            .replace(/^\d+\s*[xÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â½]\s*/i, "")
            .trim();
          const parts = tractionLabel.split(/\s+/).filter(Boolean);
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
          showOnCard: entry.showOnCard !== false,
          filterKey:
            String(entry.filterKey || "").trim().toLowerCase() ||
            (kind === "traction"
              ? normalizeVehicleType(inferredType, inferredNumber)
              : kind === "carriage" && entry.active === true
                ? normalizeCarriageType(label)
                : ""),
          filterLabel:
            String(entry.filterLabel || "").trim() ||
            (kind === "traction"
              ? getVehicleFilterLabel(
                  String(entry.filterKey || "").trim().toLowerCase() ||
                    normalizeVehicleType(inferredType, inferredNumber),
                )
              : ""),
        };
      })
      .filter(Boolean);
  }

  function formatTagLabel(label) {
    return String(label || "").replace(
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
        const cls =
          item.kind === "traction"
            ? item.active
              ? "station-meta-chip"
              : "station-meta-inactive"
            : "station-meta-carriage";

        const plus =
          index < visibleItems.length - 1
            ? '<span class="station-meta-plus">+</span>'
            : "";

        return `<span class="${cls}">${esc(formatTagLabel(item.label))}</span>${plus}`;
      })
      .join("");

    return hasOverflow ? `${tagsHtml}<span class="station-meta-plus">+</span>` : tagsHtml;
  }

  const photos = station.photos.map((photo, sourceIndex) => {
    const consist = normalizeConsist(photo);
    const series = String(photo.series || "").trim().toLowerCase() || `photo-${sourceIndex}`;
    const explicitIsMain = typeof photo.isMain === "boolean" ? photo.isMain : null;

    return {
      src: photo.src || "",
      alt: photo.alt || station.name,
      label: photo.label || station.name,
      date: String(photo.date || "").trim(),
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
      <div class="station-lightbox-watermark">&copy; trainbelgium.com</div>
    </div>
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector(".station-lightbox-media img");
  const lightboxOperator = lightbox.querySelector(".station-lightbox-operator");
  const lightboxDate = lightbox.querySelector(".station-lightbox-date");
  const lightboxMeta = lightbox.querySelector(".station-lightbox-meta");
  const closeBtn = lightbox.querySelector(".station-lightbox-close");
  const prevBtn = lightbox.querySelector(".station-lightbox-nav.prev");
  const nextBtn = lightbox.querySelector(".station-lightbox-nav.next");
  let currentPhotoIndex = 0;
  let currentSeriesPool = [];
  let currentSeriesPosition = 0;

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
  }

  function openLightbox(src, alt, metaHtml, dateLabel, operatorLabel) {
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
      lightboxMeta.innerHTML = metaHtml || "";
      lightboxMeta.style.display = metaHtml ? "flex" : "none";
    }

    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
  }

  function updateLightboxNav() {
    const hasMultiple = currentSeriesPool.length > 1;
    if (prevBtn) prevBtn.style.display = hasMultiple ? "inline-flex" : "none";
    if (nextBtn) nextBtn.style.display = hasMultiple ? "inline-flex" : "none";
  }

  function openLightboxByIndex(sourceIndex) {
    const photo = photoBySourceIndex.get(sourceIndex);
    if (!photo) return;

    currentPhotoIndex = photo.sourceIndex;
    currentSeriesPool = seriesPools.get(photo.series) || [photo.sourceIndex];
    const pos = currentSeriesPool.indexOf(photo.sourceIndex);
    currentSeriesPosition = pos >= 0 ? pos : 0;

    const photoDate = (photo.date || "").trim();
    openLightbox(
      photo.src,
      photo.alt,
      photo.fullMetaHtml || photo.metaHtml || "",
      photoDate,
      photo.operator || "",
    );
    updateLightboxNav();
  }
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
        openLightboxByIndex(index);
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

  document.addEventListener("keydown", (e) => {
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






