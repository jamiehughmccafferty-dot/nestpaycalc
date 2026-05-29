/* NestPayCalc - Savings & compound interest engine */
window.NPSavings = (function () {
  /**
   * input: { initial, monthly, annualRatePct, years, compoundFreq, isaCap, accountType }
   * compoundFreq: 'monthly' | 'annual' | 'daily'
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

    let balance = initial;
    let totalContributions = initial;
    let totalInterest = 0;
    const yearlyRows = [];
    const monthly4Each = monthly * 12 / periodsPerYear; // contribution per compound period

    for (let p = 1; p <= totalPeriods; p++) {
      balance += monthly4Each;
      totalContributions += monthly4Each;
      const interest = balance * periodRate;
      balance += interest;
      totalInterest += interest;

      if (p % periodsPerYear === 0) {
        yearlyRows.push({
          year: p / periodsPerYear,
          balance,
          contributions: totalContributions,
          interest: totalInterest
        });
      }
    }

    return {
      finalBalance: balance,
      totalContributions,
      totalInterest,
      yearlyRows
    };
  }

  function inflationAdjust(amount, years, inflationPct) {
    return amount / Math.pow(1 + (inflationPct / 100), years);
  }

  return { project, inflationAdjust };
})();
