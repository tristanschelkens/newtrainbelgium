window.GALLERY_STATIONS = window.GALLERY_STATIONS || [];

(function buildStationsDataFromGallery() {
  function normalizeConsistItem(item) {
    function splitTrainNumber(value) {
      var raw = String(value || "").trim().replace(/^\d+\s*x\s*/i, "");
      if (!raw) return { train: "", number: "" };
      var parts = raw.split(/\s+/).filter(Boolean);
      if (parts.length < 2) return { train: raw, number: "" };
      var p0 = String(parts[0] || "").toUpperCase();
      var p1 = String(parts[1] || "");
      var families = ["AM", "AR", "HLE", "HLD", "HLR", "TRAXX", "BR", "E", "MW", "MS"];
      if (families.includes(p0) && /^\d{1,4}$/.test(p1)) {
        var trainFam = parts[0] + " " + parts[1];
        var famNum = String(parts[2] || "");
        return { train: trainFam, number: /^\d+(?:-\d+)?$/.test(famNum) ? famNum : "" };
      }
      if (String(parts[0] || "").toLowerCase() === "class" && /^\d{1,4}$/.test(p1)) {
        var trainClass = "Class " + parts[1];
        var clsNum = String(parts[2] || "");
        return { train: trainClass, number: /^\d+(?:-\d+)?$/.test(clsNum) ? clsNum : "" };
      }
      var last = parts[parts.length - 1];
      if (/^\d+(?:-\d+)?$/.test(last)) {
        return { train: parts.slice(0, -1).join(" "), number: last };
      }
      return { train: raw, number: "" };
    }

    if (Array.isArray(item)) {
      var splitA = splitTrainNumber(item[1] || "");
      return { train: splitA.train, number: splitA.number, ...(item.length > 2 ? { active: item[2] } : {}) };
    }

    if (!item || typeof item !== "object") {
      var splitB = splitTrainNumber(String(item || ""));
      return { train: splitB.train, number: splitB.number };
    }

    var splitC = splitTrainNumber(item.train || item.label || "");
    return { ...item, train: splitC.train, number: splitC.number };
  }

  function imageFileName(image) {
    return typeof image === "string" ? image : image && image.file ? image.file : "";
  }

  function imageMeta(image) {
    return image && typeof image === "object" ? image : {};
  }

  function normalizeImageFile(file) {
    var cleanFile = String(file || "").trim();
    if (!cleanFile) return "";
    return cleanFile;
  }

  var stations = {};

  window.GALLERY_STATIONS.forEach(function(station) {
    if (!station || !station.slug) return;

    var folder = station.folder || "";
    var photos = [];

    (station.photos || []).forEach(function(photo, photoIndex) {
      var images = Array.isArray(photo.images) && photo.images.length > 0
        ? photo.images
        : photo.image
          ? [photo.image]
          : [];
      var mainImage = normalizeImageFile(photo.mainImage || imageFileName(images[0]));
      var series = station.slug + "-" + (photo.id || "photo-" + photoIndex);

      images.forEach(function(image, imageIndex) {
        var meta = imageMeta(image);
        var file = normalizeImageFile(imageFileName(image));
        if (!file) return;

        var isMain = meta.main === true || file === mainImage || (imageIndex === 0 && !photo.mainImage);

        photos.push({
          series: series,
          isMain: isMain,
          operator: meta.operator || photo.operator || "",
          src: folder + file,
          alt: meta.alt || photo.alt || station.name || station.slug,
          label: station.name || station.slug,
          numbers: meta.numbers || photo.numbers || "",
          date: meta.date || photo.date || "",
          photographer: meta.photographer || photo.photographer || "",
          consist: (meta.consist || photo.consist || []).map(normalizeConsistItem),
        });
      });
    });

    stations[station.slug] = {
      name: station.name || station.slug,
      country: station.country || "",
      coords: station.coords || null,
      description: station.description || "",
      photos: photos,
    };
  });

  window.STATIONS_DATA = stations;
})();
