window.GALLERY_STATIONS = window.GALLERY_STATIONS || [];

(function appendApprovedCommunitySubmissions() {
  function readSubmissions() {
    try {
      var raw = localStorage.getItem("tb_photo_submissions_v1");
      var data = raw ? JSON.parse(raw) : [];
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function toSlug(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function normalizeCoords(value) {
    if (!value) return null;
    if (Array.isArray(value) && value.length >= 2) {
      var latArr = Number(value[0]);
      var lngArr = Number(value[1]);
      if (Number.isFinite(latArr) && Number.isFinite(lngArr)) return [latArr, lngArr];
      return null;
    }
    var lat = Number(value.lat);
    var lng = Number(value.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return [lat, lng];
  }

  function normalizeConsist(parts) {
    if (!Array.isArray(parts)) return [];
    return parts
      .map(function(part) {
        var kind = String(part && part.kind ? part.kind : "").trim().toLowerCase();
        var label = String(part && part.label ? part.label : "").trim();
        if (!kind || !label) return null;
        if (kind === "carriage") {
          var count = Number(part.count || 0);
          if (count > 0) return { kind: "carriage", label: count + "x " + label, active: true };
          return { kind: "carriage", label: label, active: true };
        }
        return { kind: "traction", label: label, active: true };
      })
      .filter(Boolean);
  }

  function stationBySlug(slug) {
    return window.GALLERY_STATIONS.find(function(station) {
      return station && String(station.slug || "").trim().toLowerCase() === slug;
    });
  }

  var approved = readSubmissions()
    .filter(function(item) {
      return item && String(item.status || "").trim().toLowerCase() === "approved";
    })
    .sort(function(a, b) {
      return String(a.moderatedAt || a.submittedAt || "").localeCompare(
        String(b.moderatedAt || b.submittedAt || ""),
      );
    });

  approved.forEach(function(item) {
    var stationSlug = String(item.stationSlug || "").trim().toLowerCase();
    var stationName = String(item.stationName || stationSlug).trim();
    var stationCountry = String(item.stationCountry || "").trim();
    if (!stationSlug || !stationName) return;

    var station = stationBySlug(stationSlug);
    if (!station) {
      station = {
        slug: stationSlug || toSlug(stationName),
        name: stationName,
        country: stationCountry,
        coords: normalizeCoords(item.stationCoords),
        folder: "",
        description: "",
        photos: [],
      };
      window.GALLERY_STATIONS.push(station);
    } else {
      if (!station.name) station.name = stationName;
      if (!station.country) station.country = stationCountry;
      if (!station.coords) station.coords = normalizeCoords(item.stationCoords);
      if (!Array.isArray(station.photos)) station.photos = [];
    }

    var photoId = String(item.id || "").trim();
    if (!photoId) return;
    var exists = station.photos.some(function(photo) {
      return String(photo && photo.id ? photo.id : "").trim() === photoId;
    });
    if (exists) return;

    station.photos.push({
      id: photoId,
      operator: String(item.operator || "").trim(),
      date: String(item.date || "").trim(),
      alt: String(item.title || stationName).trim(),
      numbers: "",
      photographer: String(item.submittedBy || "").trim(),
      consist: normalizeConsist(item.composition),
      images: [{ file: String(item.image || "").trim(), main: true }],
    });
  });
})();
