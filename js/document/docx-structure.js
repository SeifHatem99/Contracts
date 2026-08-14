(function () {
  function removeParagraphContainingToken(xmlText, token) {
    if (!xmlText || !token) return xmlText;
    const pattern = new RegExp(`<w:p\\b[^>]*>[\\s\\S]*?${token}[\\s\\S]*?<\\/w:p>`, "g");
    return String(xmlText).replace(pattern, "");
  }

  window.DocxStructure = { removeParagraphContainingToken };
})();
