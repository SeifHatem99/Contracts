(function () {
  function ensureDeal(deal) {
    deal.documents = Array.isArray(deal.documents) ? deal.documents : [];
    return deal;
  }

  function add(deal, record) {
    ensureDeal(deal);
    const doc = {
      id: Utils.uid("doc"),
      status: "Generated",
      createdAt: new Date().toISOString(),
      ...record,
    };
    deal.documents.unshift(doc);
    ActivityLogger.log(deal, "Export Completed", record.filename || record.name || "Document generated");
    return doc;
  }

  function compare(docA, docB) {
    return ComparisonEngine.renderDiff(docA?.renderedText || docA?.content || "", docB?.renderedText || docB?.content || "");
  }

  function rename(deal, documentId, filename) {
    const doc = (deal.documents || []).find((item) => item.id === documentId);
    if (!doc) throw new Error("Document not found.");
    doc.filename = filename;
    ActivityLogger.log(deal, "Contract Updated", `Document renamed to ${filename}`);
  }

  function duplicate(deal, documentId) {
    const doc = (deal.documents || []).find((item) => item.id === documentId);
    if (!doc) throw new Error("Document not found.");
    const copy = { ...Utils.deepClone(doc), id: Utils.uid("doc"), filename: doc.filename.replace(/(\.docx)$/i, "_copy$1") };
    deal.documents.unshift(copy);
    ActivityLogger.log(deal, "Contract Updated", `Duplicated document ${doc.filename}`);
    return copy;
  }

  function archive(deal, documentId) {
    const doc = (deal.documents || []).find((item) => item.id === documentId);
    if (!doc) throw new Error("Document not found.");
    doc.archived = true;
    ActivityLogger.log(deal, "Contract Updated", `Archived document ${doc.filename}`);
  }

  function remove(deal, documentId) {
    deal.documents = (deal.documents || []).filter((item) => item.id !== documentId);
    ActivityLogger.log(deal, "Contract Updated", `Deleted document ${documentId}`);
  }

  function list(deal) {
    return (deal.documents || []).slice();
  }

  window.DocumentManager = { add, rename, duplicate, archive, remove, list, compare };
})();
