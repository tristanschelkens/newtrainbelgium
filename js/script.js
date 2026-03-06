function toggleMenu() {
  const nav = document.getElementById("navLinks");
  if (!nav) return;
  nav.classList.toggle("active");
}

document.addEventListener("click", (e) => {
  const nav = document.getElementById("navLinks");
  if (!nav) return;
  if (e.target.matches("#navLinks a")) nav.classList.remove("active");
});

(function initPhotoFilters() {
  const filters = document.getElementById("photoFilters");
  const grid = document.getElementById("photoGrid");
  if (!filters || !grid) return; // alleen op Photos pagina

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
