(function () {
  function pdfFilenameFromDocx(docxFilename) {
    return String(docxFilename || "Contract.docx").replace(/\.docx$/i, ".pdf");
  }

  function safeDocxFilename(filename) {
    const cleaned = String(filename || "Contract.docx")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const base = cleaned || "Contract.docx";
    return base.toLowerCase().endsWith(".docx") ? base : `${base.replace(/\.[^.]+$/, "")}.docx`;
  }

  async function status() {
    try {
      const response = await fetch("/api/converters/status", { method: "GET" });
      if (!response.ok) return { available: false, message: "PDF conversion helper is unavailable." };
      const data = await response.json();
      return {
        available: !!data.libreOfficeAvailable,
        engine: data.preferredEngine || "",
        microsoftWordAvailable: !!data.microsoftWordAvailable,
      };
    } catch {
      return { available: false, message: "PDF conversion helper is unavailable." };
    }
  }

  async function convert(docxBlob, docxFilename) {
    const filename = safeDocxFilename(docxFilename);
    let response;
    try {
      response = await fetch("/api/convert-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "X-Filename": encodeURIComponent(filename),
        },
        body: docxBlob,
      });
    } catch {
      return {
        ok: false,
        filename: pdfFilenameFromDocx(filename),
        message: "PDF conversion is unavailable on this device.",
      };
    }

    if (!response.ok) {
      let message = "PDF conversion is unavailable on this device.";
      try {
        const data = await response.json();
        message = data.error || message;
      } catch {
        // Keep the safe default message when the local helper cannot return JSON.
      }
      return { ok: false, filename: pdfFilenameFromDocx(filename), message };
    }

    return {
      ok: true,
      filename: pdfFilenameFromDocx(filename),
      blob: await response.blob(),
      engine: response.headers.get("X-Conversion-Engine") || "Local converter",
    };
  }

  window.PdfConverter = { convert, status, pdfFilenameFromDocx };
})();
