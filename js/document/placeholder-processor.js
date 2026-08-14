(function () {
  function extractPlaceholders(text) {
    const matches = new Set();
    String(text || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, token) => {
      matches.add(token);
      return token;
    });
    return Array.from(matches);
  }

  function replaceText(text, deal, settings = {}, contractType) {
    return PlaceholderEngine.replace(text, deal, settings, contractType);
  }

  function mapKnownPlaceholders(deal, settings = {}) {
    return PlaceholderEngine.buildMap(deal, settings);
  }

  window.PlaceholderProcessor = { extractPlaceholders, replaceText, mapKnownPlaceholders };
})();
