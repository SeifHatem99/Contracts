(function () {
  const TemplateLibrary = {
    psa() {
      return `PSA\n\nThis PSA is made on {{CONTRACT_DATE}} between {{SELLER_NAME}} ("Seller") and {{BUYER_NAME}} ("Buyer").\n\nProperty: {{PROPERTY_ADDRESS}}\nPurchase Price: {{PURCHASE_PRICE}} ({{PURCHASE_PRICE_WORDS}})\nEarnest Money: {{EARNEST_MONEY}}\nClosing Date: {{CLOSING_DATE}}\nTitle Company: {{TITLE_COMPANY}}\n\nAdditional Terms:\n{{ADDITIONAL_TERMS}}\n`;
    },
    psaMarketing() {
      return `PSA (with marketing)\n\nThis PSA (with marketing) is made on {{CONTRACT_DATE}} between {{SELLER_NAME}} and {{BUYER_NAME}} regarding {{PROPERTY_ADDRESS}}.\n\nMarketing Terms:\n{{ADDITIONAL_TERMS}}\n`;
    },
    aif() {
      return `AIF\n\nThis AIF is made on {{CONTRACT_DATE}} for {{PROPERTY_ADDRESS}} by {{SELLER_NAME}} and {{BUYER_NAME}}.\n\nAssignment Details:\n{{ADDITIONAL_TERMS}}\n`;
    },
    novation() {
      return `NOVATION\n\nThis Novation is made on {{CONTRACT_DATE}} by {{SELLER_NAME}} and {{BUYER_NAME}} for {{PROPERTY_ADDRESS}}.\n\nClosing Date: {{CLOSING_DATE}}\nTitle Company: {{TITLE_COMPANY}}\n\nAdditional Terms:\n{{ADDITIONAL_TERMS}}\n`;
    },
    addendum() {
      return `ADDENDUM\n\n{{DATE}}\n\nSeller: {{SELLER_NAME}}\nProperty: {{PROPERTY_ADDRESS}}\n\n{{BODY}}\n`;
    },
    cancellation() {
      return `CANCELLATION AGREEMENT\n\nSeller: {{SELLER_NAME}}\nProperty: {{PROPERTY_ADDRESS}}\n\n{{BODY}}\n`;
    },
  };

  function render(template, deal, settings) {
    return PlaceholderEngine.replace(template, deal, settings);
  }

  window.TemplateLibrary = TemplateLibrary;
  window.TemplateRenderer = { render };
})();
