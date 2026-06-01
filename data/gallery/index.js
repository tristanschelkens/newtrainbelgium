window.GALLERY_STATIONS = window.GALLERY_STATIONS || [];

function station(data) {
  window.GALLERY_STATIONS.push(data);
}

function train(label, options) {
  return {
    train: label,
    ...(options || {}),
  };
}

function image(file, options) {
  return options ? { file: file, ...options } : file;
}

function mainImage(file, options) {
  return { file: file, main: true, ...(options || {}) };
}

(function loadGalleryStationFiles() {
  var currentScript = document.currentScript;
  var baseUrl = currentScript && currentScript.src
    ? currentScript.src.replace(/\/[^\/]*$/, "/")
    : "../data/gallery/";

  var stations = [
    "austria/vienna",
    "belgium/antwerp-central",
    "belgium/brussels-midi",
    "belgium/charleroi-central",
    "belgium/duffel",
    "belgium/eupen",
    "belgium/hasselt",
    "belgium/herentals",
    "belgium/leuven",
    "belgium/liege-guillemins",
    "belgium/lier",
    "belgium/antwerp-luchtbal",
    "belgium/mechelen",
    "belgium/schaerbeek",
    "france/paris_gare-de-lyon",
    "germany/aachen",
    "germany/dusseldorf",
    "luxembourg/luxembourg",
    "netherlands/amsterdam",
    "netherlands/roosendaal",
    "slovakia/bratislava",
    "united-kingdom/london",
  ];

  stations.forEach(function(stationPath) {
    document.write('<script src="' + baseUrl + stationPath + '.js"><\/script>');
  });

  document.write('<script src="' + baseUrl + 'community.js"><\/script>');
  document.write('<script src="' + baseUrl + 'build.js"><\/script>');
})();
