/* NestPayCalc - Savings & compound interest engine */
window.NPSavings = (function () {

  // Personal Savings Allowance + marginal rates by income-tax band, for the
  // 2026/27 tax year. PSA only applies to interest from non-ISA accounts.
  // Anything inside a Cash ISA, Stocks & Shares ISA or Lifetime ISA is fully
  // tax-free and ignores these limits.
  const TAX_RULES = {
    basic:      { psa: 1000, rate: 0.20 },
    higher:     { psa: 500,  rate: 0.40 },
    additional: { psa: 0,    rate: 0.45 }
  };

  function isTaxableAccount(accountType) {
    return !['cash-isa', 'stocks-isa', 'lisa'].includes(accountType);
  }

  /**
   * input: {
   *   initial, monthly, annualRatePct, years,
   *   compoundFreq: 'monthly' | 'annual' | 'daily',
   *   accountType: 'easy' | 'fixed' | 'cash-isa' | 'stocks-isa' | 'lisa',
   *   taxBand: 'basic' | 'higher' | 'additional'   // only used for non-ISA accounts
   * }
   *
   * Returns:
   *   finalBalance         - after all tax deducted
   *   totalContributions   - what the saver put in
   *   totalInterest        - GROSS interest earned across the term
   *   totalTax             - cumulative tax paid (0 for ISA accounts)
   *   netInterest          - totalInterest - totalTax
   *   isTaxable            - whether the account is non-ISA
   *   taxRule              - the PSA + marginal-rate pair applied
   *   yearlyRows           - per-year breakdown with contributions, interest, tax, balance
   */
  function project(input) {
    const initial = +input.initial || 0;
    const monthly = +input.monthly || 0;
    const ratePct = +input.annualRatePct || 0;
    const years = +input.years || 0;
    const freq = input.compoundFreq || 'monthly';
    const periodsPerYear = freq === 'annual' ? 1 : freq === 'daily' ? 365 : 12;
    const periodRate = (ratePct / 100) / periodsPerYear;
    const totalPeriods = years * periodsPerYear;
    const isTaxable = isTaxableAccount(input.accountType);
    const taxRule = TAX_RULES[input.taxBand] || TAX_RULES.basic;

    let balance = initial;
    let totalContributions = initial;
    let totalInterest = 0;
    let totalTax = 0;
    let yearInterest = 0;          // running tally for the current tax year
    const yearlyRows = [];
    const monthly4Each = monthly * 12 / periodsPerYear; // contribution per compound period

    for (let p = 1; p <= totalPeriods; p++) {
      balance += monthly4Each;
      totalContributions += monthly4Each;
      const interest = balance * periodRate;
      balance += interest;
      totalInterest += interest;
      yearInterest += interest;

      if (p % periodsPerYear === 0) {
        // End-of-year tax sweep on non-ISA accounts: interest earned this year
        // above the user's PSA gets taxed at their marginal rate. Tax is taken
        // out of the running balance so it compounds correctly next year.
        let yearTax = 0;
        if (isTaxable && yearInterest > taxRule.psa) {
          yearTax = (yearInterest - taxRule.psa) * taxRule.rate;
          balance -= yearTax;
          totalTax += yearTax;
        }
        yearlyRows.push({
          year: p / periodsPerYear,
          balance,
          contributions: totalContributions,
          interest: totalInterest,
          tax: yearTax
        });
        yearInterest = 0;
      }
    }

    return {
      finalBalance: balance,
      totalContributions,
      totalInterest,
      totalTax,
      netInterest: totalInterest - totalTax,
      isTaxable,
      taxRule,
      yearlyRows
    };
  }

  function inflationAdjust(amount, years, inflationPct) {
    return amount / Math.pow(1 + (inflationPct / 100), years);
  }

  return { project, inflationAdjust, isTaxableAccount, TAX_RULES };
})();
