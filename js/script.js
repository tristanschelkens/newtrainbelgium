function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (!nav) return;
  nav.classList.toggle("active");
}

document.addEventListener("click", (e) => {
  const nav = document.getElementById("navLinks");
  if (!nav) return;

  if (e.target.closest("#navLinks a")) {
    nav.classList.remove("active");
    return;
  }

  if (
    nav.classList.contains("active") &&
    !e.target.closest("#navLinks") &&
    !e.target.closest(".menu-btn")
  ) {
    nav.classList.remove("active");
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

(function initStationPage() {
  const grid = document.getElementById("stationGrid");
  if (!grid) return;

  const title = document.getElementById("stationTitle");
  const subtitle = document.getElementById("stationSubtitle");
  const notFound = document.getElementById("stationNotFound");

  const allStations = window.STATIONS_DATA || {};
  const slug = (new URLSearchParams(window.location.search).get("slug") || "")
    .trim()
    .toLowerCase();

  const station = allStations[slug];

  if (!station || !Array.isArray(station.photos) || station.photos.length === 0) {
    if (title) title.textContent = "Station not found";
    if (subtitle) subtitle.textContent = "No station data available for this link.";
    if (notFound) notFound.style.display = "block";
    return;
  }

  if (title) title.textContent = station.name;
  if (subtitle) {
    const description = station.description ? ` - ${station.description}` : "";
    subtitle.textContent = `${station.country}${description}`;
  }

  document.title = `${station.name} - trainbelgium.com`;

  const cardsHtml = station.photos
    .map((photo) => {
      const src = photo.src || "";
      const alt = photo.alt || station.name;
      const label = photo.label || station.name;

      return `
        <div class="photo-card station-photo-card">
          <img loading="lazy" src="${src}" alt="${alt}" />
          <div class="overlay"><h3>${label}</h3></div>
        </div>
      `;
    })
    .join("");

  grid.innerHTML = cardsHtml;
  grid.classList.toggle("has-few", station.photos.length <= 2);

  const lightbox = document.createElement("div");
  lightbox.className = "station-lightbox";
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.innerHTML = `
    <button class="station-lightbox-close" type="button" aria-label="Close image">&times;</button>
    <img src="" alt="" />
  `;
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const closeBtn = lightbox.querySelector(".station-lightbox-close");

  function closeLightbox() {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("station-lightbox-open");
  }

  function openLightbox(src, alt) {
    if (!lightboxImg) return;

    lightboxImg.src = src;
    lightboxImg.alt = alt || station.name;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("station-lightbox-open");
  }

  Array.from(grid.querySelectorAll(".station-photo-card img")).forEach((img) => {
    img.addEventListener("click", () => {
      openLightbox(img.src, img.alt);
    });
  });

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
      const response = await fetch("https://formsubmit.co/ajax/info@trainbelgium.com", {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: data,
      });

      const result = await response.json();
      if (!response.ok || (result.success !== true && result.success !== "true")) {
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

window.addEventListener("load", () => {
  handleNavbarScroll();
  setActiveNavLink();
});

window.addEventListener("component:loaded", (e) => {
  if (e.detail?.id !== "navbar") return;

  handleNavbarScroll();
  setActiveNavLink();
});







