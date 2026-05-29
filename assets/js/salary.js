/* ============================================================
 * NestPayCalc - Salary / Take-Home Pay engine
 * Implements UK PAYE for 2026/27:
 *   - Income tax (rUK + Scotland) including PA taper above £100k
 *   - National Insurance Class 1 (employee)
 *   - Pension contributions: relief at source vs net pay
 *   - Student loans Plans 1, 2, 4, 5, Postgraduate (stackable)
 *   - Tax code adjustment (numeric portion)
 *   - Bonuses, overtime, BIK (company car, etc.)
 * ============================================================ */
window.NPSalary = (function () {

  // Build effective tax bands after PA taper
  function effectiveBands(region, taxableSalary) {
    const r = window.UK_RATES[region]; // 'rUK' or 'scotland'
    let pa = r.personalAllowance;
    if (taxableSalary > r.paTaperStart) {
      pa = Math.max(0, pa - Math.floor((taxableSalary - r.paTaperStart) / 2));
    }
    // Clone bands and replace the PA upTo with the tapered PA
    const bands = r.bands.map(b => ({ ...b }));
    bands[0].upTo = pa;
    return { bands, personalAllowance: pa };
  }

  function calcIncomeTax(taxablePay, region) {
    const { bands, personalAllowance } = effectiveBands(region, taxablePay);
    const breakdown = [];
    let tax = 0, prevTop = 0;
    for (const b of bands) {
      const top = Math.min(taxablePay, b.upTo);
      const inBand = Math.max(0, top - prevTop);
      const t = inBand * b.rate;
      breakdown.push({ name: b.name, rate: b.rate, amountInBand: inBand, tax: t, from: prevTop, to: top });
      tax += t;
      prevTop = top;
      if (taxablePay <= b.upTo) break;
    }
    return { tax, personalAllowance, breakdown };
  }

  function calcNI(grossPay) {
    const ni = window.UK_RATES.ni;
    let nic = 0;
    const breakdown = [];
    if (grossPay > ni.primaryThreshold) {
      const upper = Math.min(grossPay, ni.upperEarningsLimit);
      const main = upper - ni.primaryThreshold;
      breakdown.push({ name: 'Main rate', rate: ni.mainRate, from: ni.primaryThreshold, to: upper, ni: main * ni.mainRate });
      nic += main * ni.mainRate;
      if (grossPay > ni.upperEarningsLimit) {
        const ext = grossPay - ni.upperEarningsLimit;
        breakdown.push({ name: 'Upper rate', rate: ni.upperRate, from: ni.upperEarningsLimit, to: grossPay, ni: ext * ni.upperRate });
        nic += ext * ni.upperRate;
      }
    }
    return { ni: nic, breakdown };
  }

  function calcStudentLoans(taxablePay, plans) {
    const sl = window.UK_RATES.studentLoans;
    let total = 0;
    const breakdown = [];
    for (const key of plans) {
      const plan = sl[key];
      if (!plan) continue;
      if (taxablePay > plan.threshold) {
        const amt = (taxablePay - plan.threshold) * plan.rate;
        breakdown.push({ plan: key, threshold: plan.threshold, rate: plan.rate, amount: amt });
        total += amt;
      } else {
        breakdown.push({ plan: key, threshold: plan.threshold, rate: plan.rate, amount: 0 });
      }
    }
    return { total, breakdown };
  }

  // Numeric tax code (e.g. 1257L → £12,570 PA). K codes add to taxable income.
  function adjustForTaxCode(grossForTax, taxCode, defaultPA) {
    if (!taxCode) return { adjusted: grossForTax, codePA: defaultPA, kCodeAddition: 0 };
    const tc = String(taxCode).trim().toUpperCase();
    const m = tc.match(/^(K?)(\d+)([LMNTYX]?)$/);
    if (!m) return { adjusted: grossForTax, codePA: defaultPA, kCodeAddition: 0 };
    const isK = m[1] === 'K';
    const num = parseInt(m[2], 10);
    if (isK) {
      // K code: PA = 0, taxable income increased
      return { adjusted: grossForTax + num * 10, codePA: 0, kCodeAddition: num * 10 };
    }
    return { adjusted: grossForTax, codePA: num * 10, kCodeAddition: 0 };
  }

  /**
   * Main calculation
   * input = {
   *   grossSalary, bonus, overtime, bik,
   *   region: 'rUK' | 'scotland',
   *   taxCode: string,
   *   pensionPercent, pensionType: 'relief-at-source' | 'net-pay' | 'salary-sacrifice',
   *   employerPensionPercent,
   *   studentPlans: ['plan1','plan2','plan4','plan5','postgrad']
   * }
   */
  function calculate(input) {
    const grossSalary    = +input.grossSalary || 0;
    const bonus          = +input.bonus || 0;
    const overtime       = +input.overtime || 0;
    const bik            = +input.bik || 0;
    const region         = input.region === 'scotland' ? 'scotland' : 'rUK';
    const pensionPct     = (+input.pensionPercent || 0) / 100;
    const pensionType    = input.pensionType || 'relief-at-source';
    const employerPct    = (+input.employerPensionPercent || 0) / 100;
    const taxCode        = input.taxCode || '1257L';
    const studentPlans   = input.studentPlans || [];

    const totalGross = grossSalary + bonus + overtime;

    // Pension contribution (employee)
    const employeePension = totalGross * pensionPct;
    const employerPension = totalGross * employerPct;

    // Build "taxable for income tax" depending on pension type
    // - salary-sacrifice: pension reduces gross BEFORE tax & NI
    // - net-pay: reduces taxable for tax, NI on full gross
    // - relief-at-source: tax & NI on full gross; relief given via pension provider
    let grossForNI = totalGross;
    let grossForTax = totalGross + bik;        // BIK is taxed via PAYE adjustment
    let pensionFromNet = 0;                    // for "relief at source" the user pays from net then HMRC tops up

    if (pensionType === 'salary-sacrifice') {
      grossForNI = totalGross - employeePension;
      grossForTax = grossForNI + bik;
    } else if (pensionType === 'net-pay') {
      grossForTax = totalGross - employeePension + bik;
    } else { // relief-at-source
      pensionFromNet = employeePension; // taken from take-home
    }

    // Tax code adjustment
    const r = window.UK_RATES[region];
    const codeAdj = adjustForTaxCode(grossForTax, taxCode, r.personalAllowance);
    const taxableForTaxCalc = codeAdj.adjusted;

    // Determine the effective Personal Allowance once, in one place:
    //   K-code:                  PA = 0 (taxable income already increased by codeAdj)
    //   Standard code (1257L):   apply HMRC's £100k income PA taper
    //   Bespoke non-K code:      use the code's PA verbatim (HMRC has already adjusted)
    let effectivePA;
    if (codeAdj.kCodeAddition) {
      effectivePA = 0;
    } else if (codeAdj.codePA === r.personalAllowance) {
      effectivePA = r.personalAllowance;
      if (taxableForTaxCalc > r.paTaperStart) {
        effectivePA = Math.max(0, r.personalAllowance - Math.floor((taxableForTaxCalc - r.paTaperStart) / 2));
      }
    } else {
      effectivePA = codeAdj.codePA;
    }

    // Compute income tax across the regional bands using the effective PA
    const customBands = r.bands.map(b => ({ ...b }));
    customBands[0].upTo = effectivePA;
    let tax = 0, prevTop = 0;
    const breakdown = [];
    for (const b of customBands) {
      const top = Math.min(taxableForTaxCalc, b.upTo);
      const inBand = Math.max(0, top - prevTop);
      const t = inBand * b.rate;
      breakdown.push({ name: b.name, rate: b.rate, amountInBand: inBand, tax: t, from: prevTop, to: top });
      tax += t;
      prevTop = top;
      if (taxableForTaxCalc <= b.upTo) break;
    }
    const incomeTax = { tax, personalAllowance: effectivePA, breakdown };
    const usedPA = effectivePA;

    const ni = calcNI(grossForNI);
    const sl = calcStudentLoans(grossForTax, studentPlans);

    // Take-home
    const takeHome = totalGross - incomeTax.tax - ni.ni - sl.total - pensionFromNet
                     - (pensionType === 'salary-sacrifice' ? employeePension : 0)
                     - (pensionType === 'net-pay' ? employeePension : 0);

    return {
      inputs: { ...input, totalGross, region, taxCode },
      totalGross,
      bik,
      region,
      personalAllowance: usedPA,
      incomeTax,
      ni,
      studentLoans: sl,
      pension: {
        employee: employeePension, employer: employerPension, type: pensionType, fromNet: pensionFromNet
      },
      takeHome,
      monthly: {
        gross: totalGross / 12,
        tax: incomeTax.tax / 12,
        ni: ni.ni / 12,
        studentLoan: sl.total / 12,
        pension: employeePension / 12,
        net: takeHome / 12
      },
      weekly: {
        gross: totalGross / 52,
        tax: incomeTax.tax / 52,
        ni: ni.ni / 52,
        studentLoan: sl.total / 52,
        pension: employeePension / 52,
        net: takeHome / 52
      },
      effectiveTaxRate: totalGross > 0 ? (incomeTax.tax + ni.ni) / totalGross : 0
    };
  }

  return { calculate, calcIncomeTax, calcNI, calcStudentLoans };
})();
