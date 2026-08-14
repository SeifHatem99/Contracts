(function () {
  const Utils = {};

  Utils.uid = function uid(prefix = "id") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  };

  Utils.formatCurrency = function formatCurrency(value, currency = "USD") {
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(num)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(num));
  };

  Utils.parseCurrency = function parseCurrency(value) {
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(num) ? 0 : num;
  };

  Utils.escapeHtml = function escapeHtml(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  Utils.deepClone = function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  };

  Utils.debounce = function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  Utils.formatDate = function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(date);
  };

  Utils.toWords = function toWords(value) {
    const num = Math.floor(Math.abs(Number(value)));
    if (Number.isNaN(num)) return "";
    if (num === 0) return "Zero Dollars";
    const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
    const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const scales = ["", "Thousand", "Million", "Billion"];

    const chunkToWords = (chunk) => {
      const parts = [];
      const hundred = Math.floor(chunk / 100);
      const rem = chunk % 100;
      if (hundred) parts.push(`${ones[hundred]} Hundred`);
      if (rem >= 10 && rem < 20) parts.push(teens[rem - 10]);
      else {
        const ten = Math.floor(rem / 10);
        const one = rem % 10;
        if (ten) parts.push(tens[ten]);
        if (one) parts.push(ones[one]);
      }
      return parts.join(" ");
    };

    const segments = [];
    let remaining = num;
    let scaleIndex = 0;
    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk) {
        const words = chunkToWords(chunk);
        segments.unshift(`${words}${scales[scaleIndex] ? ` ${scales[scaleIndex]}` : ""}`.trim());
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex += 1;
    }
    return `${segments.join(" ")} Dollars`;
  };

  Utils.query = (selector, root = document) => root.querySelector(selector);
  Utils.queryAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  Utils.nowISO = () => new Date().toISOString().slice(0, 10);

  window.Utils = Utils;
})();
