/* NestPayCalc - Debt payoff (snowball / avalanche) */
window.NPDebt = (function () {
  function clone(d) { return JSON.parse(JSON.stringify(d)); }

  function simulate(debts, extraMonthly, strategy = 'avalanche') {
    const list = clone(debts).filter(d => d.balance > 0);
    // Capture original minimum payments. These don't shrink as balances do —
    // when a debt is paid off, its freed minimum cascades into the priority
    // debt's payment. That cascade is the whole point of snowball/avalanche.
    const originalMins = list.map(d => +d.minPayment || 0);
    const baseBudget = originalMins.reduce((s, m) => s + m, 0) + (+extraMonthly || 0);

    let month = 0;
    let totalInterest = 0;
    const monthly = [];
    const safety = 600;
    while (list.some(d => d.balance > 0.01) && month < safety) {
      month++;

      // 1. Accrue interest
      for (const d of list) {
        if (d.balance <= 0) continue;
        const r = (d.aprPct / 100) / 12;
        const interest = d.balance * r;
        d.interestAccrued = (d.interestAccrued || 0) + interest;
        totalInterest += interest;
        d.balance += interest;
      }

      // 2. Pay each active debt its ORIGINAL minimum (capped at remaining balance).
      // Whatever isn't needed (paid-off debts, near-zero balances) stays in budget
      // and rolls into the priority debt below.
      let budget = baseBudget;
      for (let i = 0; i < list.length; i++) {
        const d = list[i];
        if (d.balance <= 0) continue;
        const pay = Math.min(originalMins[i], d.balance, budget);
        d.balance -= pay;
        budget -= pay;
      }

      // 3. Apply remaining budget (= extra + freed minimums) in priority order
      const active = list.filter(d => d.balance > 0);
      active.sort((a, b) => strategy === 'snowball' ? a.balance - b.balance : b.aprPct - a.aprPct);
      for (const target of active) {
        if (budget <= 0.005) break;
        const pay = Math.min(budget, target.balance);
        target.balance -= pay;
        budget -= pay;
      }

      const total = list.reduce((s, d) => s + Math.max(0, d.balance), 0);
      monthly.push(total);
    }
    return { monthsToFree: month, totalInterest, monthly, finalDebts: list };
  }

  function compare(debts, extraMonthly) {
    const sn = simulate(debts, extraMonthly, 'snowball');
    const av = simulate(debts, extraMonthly, 'avalanche');
    return { snowball: sn, avalanche: av };
  }

  return { simulate, compare };
})();
