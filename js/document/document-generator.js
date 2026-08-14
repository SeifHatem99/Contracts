(function () {
  function cleanFilenamePart(value, fallback) {
    return String(value || fallback || "")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || fallback;
  }

  function buildFilename(deal, templateName, settings = {}, existingFilenames = [], extension = "docx") {
    const contractType = cleanFilenamePart(templateName || deal.contractTypeLabel, "Contract");
    const street = cleanFilenamePart(String(deal.propertyAddress || deal.property || "Property").split(",")[0], "Property");
    const ext = String(extension || "docx").replace(/^\./, "");
    const base = `${street} - ${contractType}`;
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
    const placeholderState = PlaceholderProcessor.mapKnownPlaceholders(deal, settings, templateInfo.type);

    Object.keys(entries).forEach((name) => {
      const text = new TextDecoder().decode(entries[name].data);
      if (name.endsWith(".xml")) {
        let xmlText = fillXml(text, deal, settings, templateInfo.type);
        if (!String(placeholderState.SELLER_SIGNATURE_2 || "").trim()) {
          // Remove only the exact paragraph containing the optional Seller 2 token.
          // The templates place this token in its own paragraph, so this stays deterministic.
          xmlText = DocxStructure.removeParagraphContainingToken(xmlText, "{{SELLER_SIGNATURE_2}}");
        }
        xmlEntries[name] = new TextEncoder().encode(xmlText);
      } else {
        xmlEntries[name] = entries[name].data;
      }
    });

    const output = DocxZip.build(xmlEntries);
    const renderedText = new TextDecoder().decode(xmlEntries["word/document.xml"] || new Uint8Array());
    const filenameLabel = window.ContractDefinitions?.getFilenameLabel(templateInfo.type) || templateInfo.name || templateInfo.type;
    return {
      filename: buildFilename(deal, filenameLabel, settings, settings.existingFilenames || [], "docx"),
      renderedText,
      blob: new Blob([output], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    };
  }

  window.DocumentGenerator = { buildFilename, generateDocx };
})();
