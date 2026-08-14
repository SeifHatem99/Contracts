(function () {
  function summary(state) {
    const deals = state.deals || [];
    const signed = deals.filter((d) => d.status === "Signed" || d.status === "Closed").length;
    const active = deals.filter((d) => !["Closed", "Cancelled"].includes(d.status)).length;
    const avgPrice = deals.length ? deals.reduce((sum, d) => sum + Number(d.purchasePrice || 0), 0) / deals.length : 0;
    const byStatus = deals.reduce((acc, deal) => {
      acc[deal.status || "Draft"] = (acc[deal.status || "Draft"] || 0) + 1;
      return acc;
    }, {});
    return {
      totalDeals: deals.length,
      contractsGenerated: (state.generated || []).length,
      contractsSigned: signed,
      activeDeals: active,
      averagePurchasePrice: avgPrice,
      dealsByStatus: byStatus,
      recentActivity: (state.backups || []).slice(0, 10),
    };
  }

  window.AnalyticsEngine = { summary };
})();
