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

  /**
   * Parse a UK PAYE tax code and return how it affects the tax calc.
   *
   * Returns { valid, normalised, adjusted, codePA, kCodeAddition, specialCode }
   *   valid          — whether the code was parseable
   *   normalised     — canonical form (uppercase, no whitespace/punctuation)
   *   adjusted       — gross-for-tax after K-code addition
   *   codePA         — personal allowance the code grants
   *   kCodeAddition  — extra taxable income added by a K code (0 otherwise)
   *   specialCode    — 'BR' | 'D0' | 'D1' | 'NT' | '0T' | null
   *
   * Supported forms:
   *   - Standard numeric: 1257L, 1257M, 1257N, 1257T, 1257Y, 1257X (suffix optional)
   *   - K-codes:          K500 (adds £5,000 to taxable income)
   *   - Special codes:    BR, D0, D1, NT, 0T (case/whitespace-insensitive)
   *   - Emergency suffix: 1257L W1, 1257L M1, 1257L X — treated as the base code
   */
  function adjustForTaxCode(grossForTax, taxCode, defaultPA) {
    if (!taxCode) return { valid: true, normalised: '1257L', adjusted: grossForTax, codePA: defaultPA, kCodeAddition: 0, specialCode: null };

    // Strip whitespace + hyphens, uppercase. "1257 L" / "1257-L" / "1257l" → "1257L".
    // Trailing emergency suffix (W1 / M1 / X) gets stripped since we always
    // compute on an annual basis.
    const tc = String(taxCode).replace(/[\s\-]/g, '').toUpperCase().replace(/(W1|M1|X)$/, '');

    // Special codes — everything taxed at one rate, or no tax at all.
    if (tc === 'NT') {
      return { valid: true, normalised: 'NT', adjusted: 0, codePA: 0, kCodeAddition: 0, specialCode: 'NT' };
    }
    if (tc === '0T') {
      return { valid: true, normalised: '0T', adjusted: grossForTax, codePA: 0, kCodeAddition: 0, specialCode: '0T' };
    }
    if (tc === 'BR' || tc === 'D0' || tc === 'D1') {
      // We model BR/D0/D1 via codePA=0 plus a single-band override in the
      // caller. Return the raw flag and let calculate() apply the rate.
      return { valid: true, normalised: tc, adjusted: grossForTax, codePA: 0, kCodeAddition: 0, specialCode: tc };
    }

    // Standard numeric code with optional letter suffix
    const m = tc.match(/^(K?)(\d+)([LMNPTYX]?)$/);
    if (!m) {
      // Unparseable — fall back to the default PA but flag invalid for UI
      return { valid: false, normalised: tc, adjusted: grossForTax, codePA: defaultPA, kCodeAddition: 0, specialCode: null };
    }
    const isK = m[1] === 'K';
    const num = parseInt(m[2], 10);
    if (isK) {
      return { valid: true, normalised: 'K' + num, adjusted: grossForTax + num * 10, codePA: 0, kCodeAddition: num * 10, specialCode: null };
    }
    return { valid: true, normalised: num + (m[3] || 'L'), adjusted: grossForTax, codePA: num * 10, kCodeAddition: 0, specialCode: null };
  }

  /**
   * Marginal-rate curve for a given region + student-loan plans.
   * Returns an array of segments: { from, to, rate, label, components }
   * where `rate` is the combined marginal tax + NI + student loan rate the
   * worker would pay on the *next* pound earned within that band.
   *
   * Powers the band chart on the salary calc and the per-bonus annotation.
   */
  function marginalCurve(region, studentPlans) {
    region = region === 'scotland' ? 'scotland' : 'rUK';
    const r = window.UK_RATES[region];
    const ni = window.UK_RATES.ni;
    const sl = window.UK_RATES.studentLoans;

    // Collect every breakpoint where the marginal rate changes: PA, each
    // income-tax band edge, the £100k taper start, the taper end (PA exhausted),
    // both NI thresholds, and every student loan plan threshold.
    const breakpoints = new Set([0]);
    breakpoints.add(r.personalAllowance);
    r.bands.forEach(b => { if (isFinite(b.upTo)) breakpoints.add(b.upTo); });
    breakpoints.add(r.paTaperStart);                                  // £100,000
    breakpoints.add(r.paTaperStart + r.personalAllowance * 2);        // £125,140 — PA fully tapered
    breakpoints.add(ni.primaryThreshold);
    breakpoints.add(ni.upperEarningsLimit);
    (studentPlans || []).forEach(key => { if (sl[key]) breakpoints.add(sl[key].threshold); });

    const sorted = [...breakpoints].filter(n => n >= 0).sort((a, b) => a - b);

    function rateAt(income) {
      // Income tax marginal: which band is the *next* £1 in, after PA taper.
      let pa = r.personalAllowance;
      if (income > r.paTaperStart) pa = Math.max(0, pa - Math.floor((income - r.paTaperStart) / 2));
      // PA-taper extra cost: each £1 earned between £100k-£125,140 also loses
      // 50p of PA, which becomes 50p × 40% = 20p of extra tax. We model this
      // as a 20% adder on top of the band rate.
      const taperExtra = (income > r.paTaperStart && income < r.paTaperStart + r.personalAllowance * 2) ? 0.20 : 0;

      let bandRate = 0;
      let prevTop = 0;
      for (const b of r.bands) {
        const top = b.upTo;
        const lowerEdge = prevTop === 0 ? pa : prevTop;
        if (income >= lowerEdge && income < top) { bandRate = b.rate; break; }
        prevTop = top;
        if (top === Infinity) { bandRate = b.rate; break; }
      }
      // Hack: when income > paTaperStart and pa is already partially-tapered,
      // the "PA band" edge has moved, so any income above the now-shrunk PA
      // is actually in the higher band, not the 0% band. The loop above
      // covers this because we use the tapered `pa` as the first edge.

      // NI marginal
      let niRate = 0;
      if (income >= ni.primaryThreshold && income < ni.upperEarningsLimit) niRate = ni.mainRate;
      else if (income >= ni.upperEarningsLimit) niRate = ni.upperRate;

      // Student loans marginal
      let slRate = 0;
      (studentPlans || []).forEach(key => {
        const plan = sl[key];
        if (plan && income >= plan.threshold) slRate += plan.rate;
      });

      const total = bandRate + taperExtra + niRate + slRate;
      return {
        total,
        components: { incomeTax: bandRate, paTaper: taperExtra, ni: niRate, studentLoan: slRate }
      };
    }

    // Walk the sorted breakpoints. For each adjacent pair, the marginal rate
    // is constant inside the interval, so we sample the midpoint.
    const segments = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i];
      const to = sorted[i + 1];
      if (to <= from) continue;
      const sample = rateAt((from + to) / 2);
      segments.push({ from, to, rate: sample.total, components: sample.components });
    }
    // Open-ended top segment
    const last = sorted[sorted.length - 1];
    const tailSample = rateAt(last + 1);
    segments.push({ from: last, to: Infinity, rate: tailSample.total, components: tailSample.components });

    // Merge adjacent segments with the same rate
    const merged = [];
    for (const seg of segments) {
      const tail = merged[merged.length - 1];
      if (tail && Math.abs(tail.rate - seg.rate) < 0.0001) tail.to = seg.to;
      else merged.push({ ...seg });
    }

    // Attach human-readable labels to each segment based on what's binding
    return merged.map(seg => {
      const parts = [];
      const c = seg.components;
      if (c.incomeTax > 0) parts.push(Math.round(c.incomeTax * 100) + '% tax');
      if (c.paTaper > 0)   parts.push(Math.round(c.paTaper * 100) + '% PA taper');
      if (c.ni > 0)        parts.push(Math.round(c.ni * 100) + '% NI');
      if (c.studentLoan > 0) parts.push(Math.round(c.studentLoan * 100) + '% student loan');
      return { ...seg, label: parts.join(' + ') || '0%', isTrap: seg.rate > 0.55 };
    });
  }

  /** Marginal rate at a specific income level (handy for bonus annotations). */
  function marginalRateAt(income, region, studentPlans) {
    const curve = marginalCurve(region, studentPlans);
    const hit = curve.find(seg => income >= seg.from && income < seg.to);
    return hit ? hit.rate : (curve[curve.length - 1] || { rate: 0 }).rate;
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
    //   Special BR/D0/D1/NT/0T:  PA = 0 (single-band override handled below)
    //   Bespoke non-K code:      use the code's PA verbatim (HMRC has already adjusted)
    let effectivePA;
    if (codeAdj.kCodeAddition || codeAdj.specialCode) {
      effectivePA = 0;
    } else if (codeAdj.codePA === r.personalAllowance) {
      effectivePA = r.personalAllowance;
      if (taxableForTaxCalc > r.paTaperStart) {
        effectivePA = Math.max(0, r.personalAllowance - Math.floor((taxableForTaxCalc - r.paTaperStart) / 2));
      }
    } else {
      effectivePA = codeAdj.codePA;
    }

    // Compute income tax. Special codes (BR/D0/D1/NT) override the band
    // structure with a single flat rate; everything else uses the regional
    // band ladder with the (possibly tapered) PA as the first edge.
    let tax = 0, prevTop = 0;
    const breakdown = [];
    if (codeAdj.specialCode === 'NT') {
      breakdown.push({ name: 'No tax (NT code)', rate: 0, amountInBand: taxableForTaxCalc, tax: 0, from: 0, to: taxableForTaxCalc });
    } else if (codeAdj.specialCode === 'BR' || codeAdj.specialCode === 'D0' || codeAdj.specialCode === 'D1') {
      const flatRate = codeAdj.specialCode === 'BR' ? 0.20 : codeAdj.specialCode === 'D0' ? 0.40 : 0.45;
      const flatName = codeAdj.specialCode === 'BR' ? 'Basic rate (BR code)' : codeAdj.specialCode === 'D0' ? 'Higher rate (D0 code)' : 'Additional rate (D1 code)';
      tax = taxableForTaxCalc * flatRate;
      breakdown.push({ name: flatName, rate: flatRate, amountInBand: taxableForTaxCalc, tax, from: 0, to: taxableForTaxCalc });
    } else {
      const customBands = r.bands.map(b => ({ ...b }));
      customBands[0].upTo = effectivePA;
      for (const b of customBands) {
        const top = Math.min(taxableForTaxCalc, b.upTo);
        const inBand = Math.max(0, top - prevTop);
        const t = inBand * b.rate;
        breakdown.push({ name: b.name, rate: b.rate, amountInBand: inBand, tax: t, from: prevTop, to: top });
        tax += t;
        prevTop = top;
        if (taxableForTaxCalc <= b.upTo) break;
      }
    }
    const incomeTax = { tax, personalAllowance: effectivePA, breakdown };
    const usedPA = effectivePA;

    const ni = calcNI(grossForNI);
    const sl = calcStudentLoans(grossForTax, studentPlans);

    // Take-home
    const takeHome = totalGross - incomeTax.tax - ni.ni - sl.total - pensionFromNet
                     - (pensionType === 'salary-sacrifice' ? employeePension : 0)
                     - (pensionType === 'net-pay' ? employeePension : 0);

    // Marginal rate the user pays on their next pound — drives the band
    // chart and the bonus-tax annotation. Computed against `grossForTax`
    // since that's the income the engine actually deducted tax from.
    const marginalRate = marginalRateAt(grossForTax, region, studentPlans);

    return {
      inputs: { ...input, totalGross, region, taxCode },
      totalGross,
      bik,
      region,
      personalAllowance: usedPA,
      taxCodeInfo: {
        valid: codeAdj.valid,
        normalised: codeAdj.normalised,
        specialCode: codeAdj.specialCode,
        kCodeAddition: codeAdj.kCodeAddition
      },
      marginalRate,
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

  return { calculate, calcIncomeTax, calcNI, calcStudentLoans, marginalCurve, marginalRateAt };
})();
