(function () {
  const TemplateUtils = {};

  TemplateUtils.now = function now() {
    const d = new Date();
    return {
      date: d.toISOString().slice(0, 10),
      time: d.toTimeString().slice(0, 8),
      iso: d.toISOString(),
    };
  };

  TemplateUtils.slug = function slug(value) {
    return String(value || "")
      .replace(/[^A-Za-z0-9]+/g, "")
      .slice(0, 40) || "Template";
  };

  TemplateUtils.clone = function clone(value) {
    return Utils.deepClone(value);
  };

  TemplateUtils.wordCount = function wordCount(text) {
    const words = String(text || "").trim().match(/\S+/g);
    return words ? words.length : 0;
  };

  TemplateUtils.pageCount = function pageCount(text) {
    const words = TemplateUtils.wordCount(text);
    return Math.max(1, Math.ceil(words / 450));
  };

  window.TemplateUtils = TemplateUtils;
})();
