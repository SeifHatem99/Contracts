(function () {
  function scan(text) {
    const map = new Map();
    String(text || "").replace(/\{\{([^{}]+)\}\}/g, (_, token) => {
      const key = token.trim();
      const item = map.get(key) || { name: key, occurrences: 0 };
      item.occurrences += 1;
      map.set(key, item);
      return token;
    });
    return Array.from(map.values());
  }

  function classify(placeholders, requiredMap) {
    return placeholders.map((p) => ({
      ...p,
      required: !!requiredMap[p.name],
      missingData: requiredMap[p.name] ? !requiredMap[p.name].present : false,
      unknown: !requiredMap[p.name],
      duplicate: p.occurrences > 1,
      status: !requiredMap[p.name] ? "Unknown" : !requiredMap[p.name].present ? "Missing Data" : p.occurrences > 1 ? "Duplicate" : "OK",
    }));
  }

  window.PlaceholderScanner = { scan, classify };
})();
