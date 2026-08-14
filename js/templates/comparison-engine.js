(function () {
  function tokenize(text) {
    return String(text || "")
      .split(/(\s+)/)
      .filter((part) => part !== "");
  }

  function compare(a, b) {
    const left = tokenize(a);
    const right = tokenize(b);
    const result = [];
    const max = Math.max(left.length, right.length);
    for (let i = 0; i < max; i += 1) {
      const l = left[i];
      const r = right[i];
      if (l === r) result.push({ type: "same", value: l || "" });
      else {
        if (l) result.push({ type: "removed", value: l });
        if (r) result.push({ type: "added", value: r });
      }
    }
    return result;
  }

  function renderDiff(a, b) {
    return compare(a, b).map((part) => `<span class="${part.type}">${Utils.escapeHtml(part.value)}</span>`).join("");
  }

  window.ComparisonEngine = { compare, renderDiff };
})();
