(function () {
  function previewHtml(deal, template, settings) {
    return PlaceholderEngine.preview(template.content, deal, settings);
  }

  function generateDocumentBundle(deal, template, settings) {
    return {
      dealId: deal.id,
      contractType: template.type,
      title: template.name,
      html: previewHtml(deal, template, settings),
      createdAt: new Date().toISOString(),
    };
  }

  window.Exporter = { previewHtml, generateDocumentBundle };
})();
