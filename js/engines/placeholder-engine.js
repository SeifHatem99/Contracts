(function () {
  function buildMap(deal, settings = {}, contractType) {
    return DealEngine.editableFieldMap(contractType, deal, settings);
  }

  function cloneMap(map) {
    return Object.fromEntries(Object.entries(map).map(([key, value]) => [key, Array.isArray(value) ? value.slice() : value]));
  }

  function consumeValue(map, token) {
    if (!Object.prototype.hasOwnProperty.call(map, token)) return undefined;
    const value = map[token];
    if (Array.isArray(value)) return value.length ? value.shift() : "";
    return value;
  }

  function splitTokenPattern(token) {
    const escapeChar = (char) => char.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    return new RegExp(`{{${token}}}`.split("").map(escapeChar).join("(?:<[^>]+>)*"), "g");
  }

  function replace(template, deal, settings = {}, contractType) {
    const map = cloneMap(buildMap(deal, settings, contractType));
    let output = String(template || "").replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, token) => {
      const value = consumeValue(map, token);
      if (value === undefined) return match;
      return Utils.escapeHtml(value ?? "");
    });
    Object.keys(map).forEach((token) => {
      output = output.replace(splitTokenPattern(token), () => Utils.escapeHtml(consumeValue(map, token) ?? ""));
    });
    return output;
  }

  function preview(template, deal, settings = {}, contractType) {
    return replace(template, deal, settings, contractType);
  }

  window.PlaceholderEngine = { buildMap, replace, preview };
})();
