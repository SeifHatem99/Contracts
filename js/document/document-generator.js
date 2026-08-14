(function () {
  function cleanFilenamePart(value, fallback) {
    return String(value || fallback || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || fallback;
  }

  function buildFilename(deal, templateName, settings = {}, existingFilenames = [], extension = "docx") {
    const property = cleanFilenamePart(deal.propertyAddress || deal.property, "Property");
    const contractType = cleanFilenamePart(templateName || deal.contractTypeLabel, "Contract");
    const ext = String(extension || "docx").replace(/^\./, "");
    const base = `${property} - ${contractType}`;
    const used = new Set((existingFilenames || []).map((name) => String(name || "").toLowerCase()));
    let filename = `${base}.${ext}`;
    let count = 2;
    while (used.has(filename.toLowerCase())) {
      filename = `${base} (${count}).${ext}`;
      count += 1;
    }
    return filename;
  }

  function fillXml(entryText, deal, settings, contractType) {
    return PlaceholderProcessor.replaceText(entryText, deal, settings, contractType);
  }

  async function generateDocx(deal, templateInfo, settings = {}) {
    const templateBuffer = await TemplateLoader.load(templateInfo);
    const entries = await DocxZip.parse(templateBuffer);
    const xmlEntries = {};

    Object.keys(entries).forEach((name) => {
      const text = new TextDecoder().decode(entries[name].data);
      if (name.endsWith(".xml")) {
        xmlEntries[name] = new TextEncoder().encode(fillXml(text, deal, settings, templateInfo.type));
      } else {
        xmlEntries[name] = entries[name].data;
      }
    });

    const output = DocxZip.build(xmlEntries);
    const renderedText = new TextDecoder().decode(xmlEntries["word/document.xml"] || new Uint8Array());
    return {
      filename: buildFilename(deal, templateInfo.name || templateInfo.type, settings, settings.existingFilenames || [], "docx"),
      renderedText,
      blob: new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    };
  }

  window.DocumentGenerator = { buildFilename, generateDocx };
})();
