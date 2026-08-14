(function () {
  function render(state) {
    const commands = buildCommands(state);
    UI.modal(`
      <div class="modal-header">
        <div>
          <h3>Command Palette</h3>
          <p class="muted">Search deals, templates, commands, and settings.</p>
        </div>
        <button class="btn btn-secondary" data-close-modal>Close</button>
      </div>
      <div class="form-layout">
        <div class="field full"><input id="commandSearch" placeholder="Type to search..." autofocus /></div>
        <div id="commandResults" class="review-grid" style="max-height:420px; overflow:auto;">${renderList(commands)}</div>
      </div>
    `);
    const input = Utils.query("#commandSearch");
    const results = Utils.query("#commandResults");
    const run = () => {
      const term = input.value.trim().toLowerCase();
      const filtered = commands.filter((item) => item.search.includes(term));
      results.innerHTML = renderList(filtered);
      bind(commands, filtered);
    };
    input.addEventListener("input", run);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const first = commands.find((item) => item.search.includes(input.value.trim().toLowerCase()));
        if (first) first.action();
      }
      if (e.key === "Escape") UI.closeModal();
    });
    bind(commands, commands);
    setTimeout(() => input.focus(), 0);
  }

  function buildCommands(state) {
    const deal = state.deals[0];
    const items = [
      { label: "New Deal", search: "new deal create contract", action: () => { state.ui.activeDealId = null; UI.closeModal(); document.querySelector('[data-view="contract"]').click(); } },
      { label: "Open Search", search: "search global", action: () => { UI.closeModal(); document.querySelector('[data-view="search"]').click(); } },
      { label: "Open Templates", search: "templates template manager", action: () => { UI.closeModal(); document.querySelector('[data-view="templates"]').click(); } },
      { label: "Open Diagnostics", search: "diagnostics health errors", action: () => { UI.closeModal(); document.querySelector('[data-view="diagnostics"]').click(); } },
      { label: "Open File Center", search: "file center files documents backups", action: () => { UI.closeModal(); document.querySelector('[data-view="files"]').click(); } },
      { label: "Open Reports", search: "reports analytics export pdf csv", action: () => { UI.closeModal(); document.querySelector('[data-view="reports"]').click(); } },
      { label: "Save Draft", search: "save draft", action: () => { UI.closeModal(); document.querySelector('#saveDeal')?.click(); } },
      { label: "Generate Contract", search: "generate export docx pdf", action: () => { UI.closeModal(); document.querySelector('#previewContract')?.click(); } },
      { label: "Quick Open Latest Deal", search: "latest deal recent", action: () => { if (deal) { state.ui.activeDealId = deal.id; UI.closeModal(); document.querySelector('[data-view="deal"]').click(); } } },
    ];
    return items;
  }

  function renderList(items) {
    return items.map((item, index) => `
      <button class="card command-item" data-command-index="${index}" style="width:100%; text-align:left; border:none; background:transparent; cursor:pointer;">
        <div class="section-title"><h3>${Utils.escapeHtml(item.label)}</h3><span class="pill">Enter</span></div>
      </button>
    `).join("") || `<div class="muted">No commands found.</div>`;
  }

  function bind(allCommands, visibleCommands) {
    Utils.queryAll("[data-command-index]").forEach((btn) => {
      const command = visibleCommands[Number(btn.dataset.commandIndex)];
      if (!command) return;
      btn.onclick = () => command.action();
    });
  }

  window.CommandPaletteView = { render };
})();
