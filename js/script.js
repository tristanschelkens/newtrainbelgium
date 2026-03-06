function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (!nav) return;
  nav.classList.toggle("active");
}

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

window.addEventListener("scroll", handleNavbarScroll);
window.addEventListener("load", () => {
  handleNavbarScroll();
  setTimeout(handleNavbarScroll, 200);
  setTimeout(handleNavbarScroll, 500);
});

(function initPhotoFilters() {
  const filters = document.getElementById("photoFilters");
  const grid = document.getElementById("photoGrid");
  if (!filters || !grid) return;

  const buttons = Array.from(filters.querySelectorAll(".filter-btn"));
  const cards = Array.from(grid.querySelectorAll(".photo-card"));
  const noResults = document.getElementById("noResults");

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
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyFilter(btn.dataset.filter);
    });
  });

  applyFilter("all");
})();