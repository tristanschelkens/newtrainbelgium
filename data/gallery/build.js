window.GALLERY_STATIONS = window.GALLERY_STATIONS || [];

(function buildStationsDataFromGallery() {
  function normalizeConsistItem(item) {
    if (Array.isArray(item)) {
      return {
        kind: item[0] || "carriage",
        label: item[1] || "",
        ...(item.length > 2 ? { active: item[2] } : {}),
      };
    }

    if (!item || typeof item !== "object") {
      return { kind: "carriage", label: String(item || "") };
    }

    return {
      ...item,
      kind: item.kind || item.type || "carriage",
    };
  }

  function imageFileName(image) {
    return typeof image === "string" ? image : image && image.file ? image.file : "";
  }

  function imageMeta(image) {
    return image && typeof image === "object" ? image : {};
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
      var mainImage = photo.mainImage || imageFileName(images[0]);
      var series = station.slug + "-" + (photo.id || "photo-" + photoIndex);

      images.forEach(function(image, imageIndex) {
        var meta = imageMeta(image);
        var file = imageFileName(image);
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
