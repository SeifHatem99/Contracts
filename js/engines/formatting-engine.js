(function () {
  const FormattingEngine = {};

  FormattingEngine.currency = function currency(value, currencyCode = "USD") {
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    if (Number.isNaN(num)) return "";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(num));
  };

  FormattingEngine.number = function number(value) {
    const num = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isNaN(num) ? 0 : num;
  };

  FormattingEngine.date = function date(value) {
    if (!value) return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(parsed);
  };

  FormattingEngine.words = function words(value) {
    const num = Math.floor(Math.abs(FormattingEngine.number(value)));
    if (!num) return "ZERO DOLLARS";
    const ones = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
    const teens = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
    const tens = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];
    const scales = ["", "THOUSAND", "MILLION", "BILLION"];

    const chunkToWords = (chunk) => {
      const parts = [];
      const hundred = Math.floor(chunk / 100);
      const rem = chunk % 100;
      if (hundred) parts.push(`${ones[hundred]} HUNDRED`);
      if (rem >= 10 && rem < 20) parts.push(teens[rem - 10]);
      else {
        const ten = Math.floor(rem / 10);
        const one = rem % 10;
        if (ten) parts.push(tens[ten]);
        if (one) parts.push(ones[one]);
      }
      return parts.join(" ");
    };

    let remaining = num;
    let scaleIndex = 0;
    const segments = [];
    while (remaining > 0) {
      const chunk = remaining % 1000;
      if (chunk) {
        const words = chunkToWords(chunk);
        segments.unshift(`${words}${scales[scaleIndex] ? ` ${scales[scaleIndex]}` : ""}`.trim());
      }
      remaining = Math.floor(remaining / 1000);
      scaleIndex += 1;
    }
    return `${segments.join(" ")} DOLLARS`.replace(/\s+/g, " ").trim();
  };

  window.FormattingEngine = FormattingEngine;
})();
