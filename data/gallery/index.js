window.GALLERY_STATIONS = window.GALLERY_STATIONS || [];

function station(data) {
  window.GALLERY_STATIONS.push(data);
}

function traction(label, activeOrOptions, options) {
  var itemOptions =
    activeOrOptions && typeof activeOrOptions === "object"
      ? activeOrOptions
      : options || {};
  var active =
    typeof activeOrOptions === "boolean" ? activeOrOptions : itemOptions.active;

  return {
    kind: "traction",
    label: label,
    active: active !== false,
    ...itemOptions,
  };
}

function inactiveTraction(label, options) {
  return traction(label, false, options);
}

function carriage(label, activeOrOptions, options) {
  var itemOptions =
    activeOrOptions && typeof activeOrOptions === "object"
      ? activeOrOptions
      : options || {};
  var active =
    typeof activeOrOptions === "boolean" ? activeOrOptions : itemOptions.active;

  return {
    kind: "carriage",
    label: label,
    ...(typeof active === "boolean" ? { active: active } : {}),
    ...itemOptions,
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

  // Add new stations here, without ".js".
  var stations = [
    "austria/vienna",
    "belgium/antwerp",
    "belgium/brussels-midi",
    "belgium/charleroi-central",
    "belgium/duffel",
    "belgium/eupen",
    "belgium/hasselt",
    "belgium/herentals",
    "belgium/leuven",
    "belgium/liege",
    "belgium/lier",
    "belgium/luchtbal",
    "belgium/mechelen",
    "belgium/schaerbeek",
    "france/paris",
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

  document.write('<script src="' + baseUrl + 'build.js"><\/script>');
})();
