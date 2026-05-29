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

  // 4% rule + UK State Pension top-up
  function retirementIncome({ pot, includeStatePension = true }) {
    const fourPct = pot * 0.04;
    const stateAnnual = window.UK_RATES.statePension.annualFull;
    return {
      drawdownAnnual: fourPct,
      drawdownMonthly: fourPct / 12,
      statePensionAnnual: includeStatePension ? stateAnnual : 0,
      statePensionMonthly: includeStatePension ? stateAnnual / 12 : 0,
      totalAnnual: fourPct + (includeStatePension ? stateAnnual : 0),
      totalMonthly: (fourPct + (includeStatePension ? stateAnnual : 0)) / 12
    };
  }

  // Simple level annuity rough estimate (~5% rate single life, level)
  function annuityIncome(pot, ratePct = 5.5) {
    return { annual: pot * (ratePct / 100), monthly: pot * (ratePct / 100) / 12 };
  }

  return { projectPot, retirementIncome, annuityIncome };
})();
