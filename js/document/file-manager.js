(function () {
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 250);
  }

  function saveGenerated(state, record) {
    state.generated.unshift(record);
    state.generated = state.generated.slice(0, 100);
    state.documents = state.documents || [];
    state.documents.unshift(record);
    state.documents = state.documents.slice(0, 200);
  }

  window.FileManager = { downloadBlob, saveGenerated };
})();
