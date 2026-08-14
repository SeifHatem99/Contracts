(function () {
  const TEMPLATE_FILES = {
    psa: "PSA.docx",
    psa_marketing: "PSA(with marketing).docx",
    aif: "AIF.docx",
    novation: "Novation.docx",
    addendum: "Addendum.docx",
    cancellation: "Cancellation.docx",
  };

  const TEMPLATE_ALIASES = {
    psa: "psa",
    "psa_marketing": "psa_marketing",
    aif: "aif",
    novation: "novation",
    addendum: "addendum",
    cancellation: "cancellation",
    [`${"purchase"}_${"agreement"}`]: "psa",
    [`${"cancellation"}_${"agreement"}`]: "cancellation",
    [`${"price"}_${"addendum"}`]: "addendum",
    [`${"assignment"}_${"agreement"}`]: "novation",
    [`${"PSA"}`]: "psa",
    [`${"PSA"} (${ "with marketing" })`]: "psa_marketing",
    [`${"AIF"}`]: "aif",
    [`${"Novation"}`]: "novation",
    [`${"Addendum"}`]: "addendum",
    [`${"Price Addendum"}`]: "addendum",
    [`${"Cancellation Agreement"}`]: "cancellation",
    [`${"Cancellation"}`]: "cancellation",
  };

  function resolveFileName(templateRef) {
    if (!templateRef) return null;
    if (typeof templateRef === "string") {
      const key = TEMPLATE_ALIASES[templateRef] || templateRef;
      return TEMPLATE_FILES[key] || templateRef;
    }
    const key = TEMPLATE_ALIASES[templateRef.type] || TEMPLATE_ALIASES[templateRef.name] || templateRef.type;
    return templateRef.fileName || templateRef.masterFile || TEMPLATE_FILES[key] || templateRef.type || null;
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

  window.TemplateLoader = { load, filename, resolveFileName, TEMPLATE_FILES };
})();
