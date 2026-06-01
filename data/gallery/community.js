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
    function splitTrainNumber(value) {
      var raw = String(value || "").trim().replace(/^\d+\s*x\s*/i, "");
      if (!raw) return { train: "", number: "" };
      var pieces = raw.split(/\s+/).filter(Boolean);
      if (pieces.length < 2) return { train: raw, number: "" };
      var p0 = String(pieces[0] || "").toUpperCase();
      var p1 = String(pieces[1] || "");
      var families = ["AM", "AR", "HLE", "HLD", "HLR", "TRAXX", "BR", "E", "MW", "MS"];
      if (families.includes(p0) && /^\d{1,4}$/.test(p1)) {
        var trainFam = pieces[0] + " " + pieces[1];
        var famNum = String(pieces[2] || "");
        return { train: trainFam, number: /^\d+(?:-\d+)?$/.test(famNum) ? famNum : "" };
      }
      if (String(pieces[0] || "").toLowerCase() === "class" && /^\d{1,4}$/.test(p1)) {
        var trainClass = "Class " + pieces[1];
        var clsNum = String(pieces[2] || "");
        return { train: trainClass, number: /^\d+(?:-\d+)?$/.test(clsNum) ? clsNum : "" };
      }
      var last = pieces[pieces.length - 1];
      if (/^\d+(?:-\d+)?$/.test(last)) {
        return { train: pieces.slice(0, -1).join(" "), number: last };
      }
      return { train: raw, number: "" };
    }
    var normalized = parts
      .map(function(part) {
        var split = splitTrainNumber(part && (part.train || part.label) ? (part.train || part.label) : "");
        if (!split.train) return null;
        return { train: split.train, number: split.number, active: true, lead: Boolean(part && part.lead) };
      })
      .filter(Boolean);
    var lead = normalized.find(function(part) { return part && part.lead === true; }) || normalized[0] || null;
    return lead ? [lead] : [];
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
