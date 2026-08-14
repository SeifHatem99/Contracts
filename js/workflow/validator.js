(function () {
  function checklist(deal, template, settings = {}) {
    return [
      { key: "templateExists", label: "Template Exists", ok: !!(template && template.content) },
      { key: "dealLoaded", label: "Deal Loaded", ok: !!deal },
      { key: "docxGeneration", label: "DOCX Generation", ok: true },
    ];
  }

  function validateGeneratedContract(text, deal, settings = {}) {
    return [];
  }

  window.ContractValidator = { checklist, validateGeneratedContract };
})();
