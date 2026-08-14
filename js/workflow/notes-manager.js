(function () {
  function ensureDeal(deal) {
    deal.notes = Array.isArray(deal.notes) ? deal.notes : [];
    return deal;
  }

  function add(deal, type, text) {
    ensureDeal(deal);
    const note = {
      id: Utils.uid("note"),
      type,
      text,
      timestamp: new Date().toISOString(),
    };
    deal.notes.unshift(note);
    ActivityLogger.log(deal, "Note Added", `${type}: ${text.slice(0, 80)}`);
    return note;
  }

  function remove(deal, noteId) {
    ensureDeal(deal);
    deal.notes = deal.notes.filter((note) => note.id !== noteId);
  }

  window.NotesManager = { add, remove };
})();
