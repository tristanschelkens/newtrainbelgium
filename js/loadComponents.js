function loadComponent(id, file) {
  fetch(file)
    .then((response) => response.text())
    .then((data) => {
      document.getElementById(id).innerHTML = data;
      window.dispatchEvent(
        new CustomEvent("component:loaded", { detail: { id } }),
      );
    })
    .catch((err) => console.error("Component load error:", file, err));
}

loadComponent("navbar", "../components/navbar.html");
loadComponent("footer", "../components/footer.html");
