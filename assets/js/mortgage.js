/* NestPayCalc - Mortgage & SDLT engine */
window.NPMortgage = (function () {

  function repayment(principal, annualRatePct, termYears) {
    const r = (annualRatePct / 100) / 12;
    const n = termYears * 12;
    if (r === 0) return principal / n;
    return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  function buildSchedule(principal, annualRatePct, termYears, monthlyOverpayment = 0) {
    const r = (annualRatePct / 100) / 12;
    const m = repayment(principal, annualRatePct, termYears);
    const schedule = [];
    let balance = principal;
    let month = 0;
    let totalInterest = 0;
    while (balance > 0.01 && month < termYears * 12 + 600) {
      month++;
      const interest = balance * r;
      let principalPaid = m - interest;
      let pay = m;
      if (monthlyOverpayment > 0) {
        principalPaid += monthlyOverpayment;
        pay += monthlyOverpayment;
      }
      if (principalPaid > balance) {
        principalPaid = balance;
        pay = principalPaid + interest;
      }
      balance -= principalPaid;
      totalInterest += interest;
      schedule.push({ month, interest, principal: principalPaid, payment: pay, balance: Math.max(0, balance) });
      if (balance <= 0.005) break;
    }
    return { monthlyPayment: m, totalInterest, monthsToPayoff: schedule.length, schedule };
  }

  function interestOnly(principal, annualRatePct, termYears) {
    // For an IO mortgage the principal never reduces during the term - the
    // balance line on the amortisation chart is flat at `principal`, and
    // each month the borrower pays only the interest. Returning a schedule
    // (vs the old shape that only returned totals) means the UI can render
    // the chart + yearly table the same way it does for a repayment loan.
    const monthlyInterest = principal * (annualRatePct / 100) / 12;
    const months = Math.max(0, Math.round(termYears * 12));
    const schedule = [];
    for (let m = 1; m <= months; m++) {
      schedule.push({ month: m, interest: monthlyInterest, principal: 0, payment: monthlyInterest, balance: principal });
    }
    return {
      monthlyPayment: monthlyInterest,
      totalInterest: monthlyInterest * months,
      totalCost: principal + monthlyInterest * months,
      monthsToPayoff: months,
      schedule
    };
  }

  /* ----- Stamp duty ----- */
  function bandedTax(price, bands) {
    let tax = 0, prev = 0;
    for (const b of bands) {
      if (price <= prev) break;
      const top = Math.min(price, b.upTo);
      tax += (top - prev) * b.rate;
      prev = top;
    }
    return tax;
  }

  function sdltEngland(price, opts = {}) {
    const sdlt = window.UK_RATES.sdlt;
    const ftb = !!opts.firstTimeBuyer;
    const additional = !!opts.additional;
    let tax = 0;
    if (ftb && price <= sdlt.firstTimeBuyer.maxPrice) {
      tax = bandedTax(price, sdlt.firstTimeBuyer.bands);
    } else {
      tax = bandedTax(price, sdlt.standard);
    }
    if (additional) tax += price * sdlt.additionalSurcharge;
    return tax;
  }

  function lbttScotland(price, opts = {}) {
    const lbtt = window.UK_RATES.lbtt;
    const ftb = !!opts.firstTimeBuyer;
    const additional = !!opts.additional;
    let tax = 0;
    if (ftb) {
      const bands = [
        { upTo: lbtt.firstTimeBuyer.reliefThreshold, rate: 0 },
        ...lbtt.standard.filter(b => b.upTo > lbtt.firstTimeBuyer.reliefThreshold)
      ];
      tax = bandedTax(price, bands);
    } else {
      tax = bandedTax(price, lbtt.standard);
    }
    if (additional) tax += price * lbtt.additionalSurcharge;
    return tax;
  }

  function lttWales(price, opts = {}) {
    const ltt = window.UK_RATES.ltt;
    let tax = bandedTax(price, ltt.standard);
    if (opts.additional) tax += price * ltt.additionalSurcharge;
    return tax;
  }

  function calcStampDuty(price, region, opts) {
    if (region === 'scotland') return lbttScotland(price, opts);
    if (region === 'wales') return lttWales(price, opts);
    return sdltEngland(price, opts);
  }

  return { repayment, buildSchedule, interestOnly, calcStampDuty };
})();
