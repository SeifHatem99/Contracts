(function () {
  function resolveFileName(templateRef) {
    if (!templateRef) return null;
    const contract = window.ContractDefinitions?.contractFromTemplateRef(templateRef);
    if (contract) return contract.templateFile;
    if (typeof templateRef === "string") return templateRef;
    return templateRef.fileName || templateRef.masterFile || templateRef.type || null;
  }

  async function load(templateRef) {
    const fileName = resolveFileName(templateRef);
    if (!fileName) throw new Error("Missing template mapping.");
    const response = await fetch(`./templates/${encodeURIComponent(fileName)}`);
    if (!response.ok) throw new Error(`Missing Template: ${fileName}`);
    return await response.arrayBuffer();
  }

  function filename(templateRef) {
    const fileName = resolveFileName(templateRef);
    return fileName || `${typeof templateRef === "string" ? templateRef : templateRef?.type || "template"}.docx`;
  }

  window.TemplateLoader = { load, filename, resolveFileName };
})();
