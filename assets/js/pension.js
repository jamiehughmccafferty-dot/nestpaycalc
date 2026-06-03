/* NestPayCalc - Pension / retirement engine */
window.NPPension = (function () {

  function projectPot({ currentPot, monthlyContribEmployee, monthlyContribEmployer, salary, growthPct, salaryGrowthPct, currentAge, retireAge }) {
    const years = Math.max(0, retireAge - currentAge);
    const monthlyRate = (growthPct / 100) / 12;
    const yearlyRows = [];
    let pot = currentPot;
    let mthlyEe = monthlyContribEmployee;
    let mthlyEr = monthlyContribEmployer;

    for (let y = 1; y <= years; y++) {
      let yearContrib = 0;
      for (let m = 1; m <= 12; m++) {
        pot += mthlyEe + mthlyEr;
        yearContrib += mthlyEe + mthlyEr;
        pot *= (1 + monthlyRate);
      }
      // bump contributions with salary growth
      mthlyEe *= (1 + salaryGrowthPct / 100);
      mthlyEr *= (1 + salaryGrowthPct / 100);
      yearlyRows.push({ year: y, age: currentAge + y, balance: pot, contributedThisYear: yearContrib });
    }
    return { finalPot: pot, yearlyRows };
  }

  /**
   * Apply UK rUK income-tax bands to a gross annual income figure.
   * Pension drawdown + State Pension are taxed as income (no NI).
   * Personal-allowance taper above £100k applies; most retirees are
   * well below that line so it rarely bites, but we honour it for
   * high-pot scenarios.
   */
  function calcRetirementTax(grossIncome) {
    if (!grossIncome || grossIncome <= 0) return 0;
    const r = window.UK_RATES.rUK;
    let pa = r.personalAllowance;
    if (grossIncome > r.paTaperStart) {
      pa = Math.max(0, pa - Math.floor((grossIncome - r.paTaperStart) / 2));
    }
    const bands = r.bands.map(b => ({ ...b }));
    bands[0].upTo = pa;
    let tax = 0, prev = 0;
    for (const b of bands) {
      const top = Math.min(grossIncome, b.upTo);
      tax += Math.max(0, top - prev) * b.rate;
      prev = top;
      if (grossIncome <= b.upTo) break;
    }
    return tax;
  }

  /**
   * Retirement-income breakdown for a given pot.
   *   - 4% drawdown rule (Bengen) on the full pot
   *   - State Pension topped up if requested
   *   - 25% tax-free lump sum (PCLS) exposed as a separate figure
   *   - Estimated income tax applied to drawdown + State combined
   *   - Returns BOTH gross and net so the UI can show the difference
   */
  function retirementIncome({ pot, includeStatePension = true }) {
    const fourPct = (pot || 0) * 0.04;
    const pcls = (pot || 0) * 0.25; // tax-free lump-sum option at age 55+ (rising to 57 in 2028)
    const stateAnnual = window.UK_RATES.statePension.annualFull;
    const statePensionAnnual = includeStatePension ? stateAnnual : 0;

    const totalGrossAnnual = fourPct + statePensionAnnual;
    const incomeTax = calcRetirementTax(totalGrossAnnual);
    const totalNetAnnual = Math.max(0, totalGrossAnnual - incomeTax);

    return {
      // Existing fields kept for backward-compat with anything reading them
      drawdownAnnual: fourPct,
      drawdownMonthly: fourPct / 12,
      statePensionAnnual,
      statePensionMonthly: statePensionAnnual / 12,
      totalAnnual: totalNetAnnual,             // NOTE: now NET (was gross before this audit)
      totalMonthly: totalNetAnnual / 12,
      // New fields
      pcls,                                    // 25% tax-free lump sum
      totalGrossAnnual,
      totalGrossMonthly: totalGrossAnnual / 12,
      incomeTax,
      effectiveTaxRate: totalGrossAnnual > 0 ? incomeTax / totalGrossAnnual : 0
    };
  }

  /**
   * Annual Allowance check. Standard £60,000 for 2026/27, with a £10k
   * floor under the £260k+ tapered AA (which we don't fully model here -
   * tapering needs total adjusted income, not just salary). For now we
   * compare salary-based contributions to the standard AA and flag any
   * excess. Tapered-AA support is Tier 2.
   */
  function checkAnnualAllowance({ salary, employeePct, employerPct }) {
    const rates = window.UK_RATES.pensionAllowance || { standard: 60000 };
    const aa = rates.standard;
    const annualContrib = (+salary || 0) * (((+employeePct || 0) + (+employerPct || 0)) / 100);
    return {
      annualContrib,
      aa,
      exceeded: annualContrib > aa,
      excess: Math.max(0, annualContrib - aa),
      pctOfAA: aa > 0 ? (annualContrib / aa) * 100 : 0
    };
  }

  /** Discount a future pot back to today's purchasing power. */
  function inflationAdjust(amount, years, inflationPct) {
    return amount / Math.pow(1 + ((+inflationPct || 0) / 100), Math.max(0, +years || 0));
  }

  // Simple level annuity rough estimate (~5.5% rate single life, level).
  // Joint-life / inflation-linked annuities pay materially less - Tier 2.
  function annuityIncome(pot, ratePct = 5.5) {
    return { annual: pot * (ratePct / 100), monthly: pot * (ratePct / 100) / 12 };
  }

  return { projectPot, retirementIncome, annuityIncome, checkAnnualAllowance, inflationAdjust, calcRetirementTax };
})();
