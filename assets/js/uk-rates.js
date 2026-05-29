/* ============================================================
 * NestPayCalc - UK rates and thresholds
 * Tax year: 2026/27  (starts 6 April 2026)
 *
 * UPDATE THIS FILE EACH TAX YEAR (early April), and after any
 * UK Budget that changes thresholds.
 *
 * Current status of each section (as of April 2026):
 *   FROZEN until April 2028 (Autumn 2024 Budget extension):
 *     - Personal Allowance, basic-rate threshold, additional-rate threshold
 *     - NI Primary Threshold, NI Upper Earnings Limit
 *   UNCHANGED for 2026/27 (no announced change):
 *     - Class 1 employee NI rates (8% / 2%)
 *     - ISA / LISA / pension annual allowances
 *     - SDLT, LBTT, LTT bands
 *   ANNUALLY UPRATED — verify against gov.uk before publishing:
 *     - State Pension (triple-lock)
 *     - Plan 1 and Plan 4 student loan thresholds (RPI-linked)
 *
 * Sources to verify against:
 *   - HMRC: gov.uk/income-tax-rates
 *   - HMRC: gov.uk/national-insurance-rates-letters
 *   - SLC:  gov.uk/repaying-your-student-loan/what-you-pay
 *   - GOV:  gov.uk/state-pension
 *   - HMRC: gov.uk/stamp-duty-land-tax / Revenue Scotland (LBTT) / WRA (LTT)
 * ============================================================ */
window.UK_RATES = {
  taxYear: '2026/27',

  /* -------- Income tax: rest of UK (England, Wales, NI) --------
     All thresholds frozen until April 2028. */
  rUK: {
    personalAllowance: 12570,
    paTaperStart: 100000,        // £1 lost per £2 above this
    paTaperEnd: 125140,
    bands: [
      { name: 'Personal allowance', rate: 0,    upTo: 12570 },
      { name: 'Basic rate',         rate: 0.20, upTo: 50270 },
      { name: 'Higher rate',        rate: 0.40, upTo: 125140 },
      { name: 'Additional rate',    rate: 0.45, upTo: Infinity }
    ]
  },

  /* -------- Income tax: Scotland --------
     TODO 2026/27 — verify against the Scottish Government's
     2026/27 Budget. Bands are set annually and may differ.
     Below are 2025/26 figures kept as a conservative placeholder. */
  scotland: {
    personalAllowance: 12570,
    paTaperStart: 100000,
    paTaperEnd: 125140,
    bands: [
      { name: 'Personal allowance', rate: 0,    upTo: 12570 },
      { name: 'Starter rate',       rate: 0.19, upTo: 14876 },
      { name: 'Basic rate',         rate: 0.20, upTo: 26561 },
      { name: 'Intermediate rate',  rate: 0.21, upTo: 43662 },
      { name: 'Higher rate',        rate: 0.42, upTo: 75000 },
      { name: 'Advanced rate',      rate: 0.45, upTo: 125140 },
      { name: 'Top rate',           rate: 0.48, upTo: Infinity }
    ]
  },

  /* -------- National Insurance Class 1 (employee) --------
     Thresholds frozen with PA / basic-rate threshold.
     Rates unchanged for 2026/27. */
  ni: {
    primaryThreshold: 12570,
    upperEarningsLimit: 50270,
    mainRate: 0.08,
    upperRate: 0.02
  },

  /* -------- Student loans --------
     Plan 1 and Plan 4 are uprated annually with RPI.
     Plan 2, Plan 5, Postgrad were frozen — confirm freeze
     hasn't ended for 2026/27.
     TODO 2026/27 — verify all thresholds on gov.uk. Below are
     2025/26 figures retained as conservative placeholders. */
  studentLoans: {
    plan1:    { threshold: 26065, rate: 0.09 },  // TODO verify 2026/27 (RPI uprated)
    plan2:    { threshold: 28470, rate: 0.09 },  // confirm freeze still in place
    plan4:    { threshold: 32745, rate: 0.09 },  // TODO verify 2026/27 (RPI uprated)
    plan5:    { threshold: 25000, rate: 0.09 },  // confirm freeze still in place
    postgrad: { threshold: 21000, rate: 0.06 }   // confirm freeze still in place
  },

  /* -------- State Pension (full new flat-rate) --------
     Triple-lock uprating each April based on highest of
     CPI (Sept), avg earnings growth (May–Jul), or 2.5%.
     TODO 2026/27 — replace with confirmed figure once published.
     Below are 2025/26 figures as a conservative placeholder. */
  statePension: {
    weeklyFull: 230.25,
    annualFull: 11975          // weeklyFull * 52
  },

  /* -------- ISA allowances --------
     £20,000 / £4,000 LISA — unchanged for 2026/27. */
  isa: {
    annual: 20000,
    lifetimeIsaAnnual: 4000,
    lifetimeIsaBonusRate: 0.25
  },

  /* -------- Pension annual allowance --------
     £60,000 standard — unchanged for 2026/27. */
  pensionAllowance: {
    standard: 60000,
    minimumTapered: 10000
  },

  /* ============================================================
   * SDLT — Stamp Duty Land Tax (England & NI)
   * Rates from 1 April 2025 — unchanged for 2026/27.
   * ============================================================ */
  sdlt: {
    standard: [
      { upTo: 125000,  rate: 0 },
      { upTo: 250000,  rate: 0.02 },
      { upTo: 925000,  rate: 0.05 },
      { upTo: 1500000, rate: 0.10 },
      { upTo: Infinity, rate: 0.12 }
    ],
    firstTimeBuyer: {
      maxPrice: 500000,           // FTB relief withdrawn above this
      bands: [
        { upTo: 300000,  rate: 0 },
        { upTo: 500000,  rate: 0.05 }
      ]
    },
    additionalSurcharge: 0.05    // additional / second homes (from Oct 2024)
  },

  /* LBTT — Scotland (unchanged for 2026/27) */
  lbtt: {
    standard: [
      { upTo: 145000,  rate: 0 },
      { upTo: 250000,  rate: 0.02 },
      { upTo: 325000,  rate: 0.05 },
      { upTo: 750000,  rate: 0.10 },
      { upTo: Infinity, rate: 0.12 }
    ],
    firstTimeBuyer: { reliefThreshold: 175000 },
    additionalSurcharge: 0.08    // ADS
  },

  /* LTT — Wales (unchanged for 2026/27) */
  ltt: {
    standard: [
      { upTo: 225000,  rate: 0 },
      { upTo: 400000,  rate: 0.06 },
      { upTo: 750000,  rate: 0.075 },
      { upTo: 1500000, rate: 0.10 },
      { upTo: Infinity, rate: 0.12 }
    ],
    additionalSurcharge: 0.05
  },

  /* -------- UK averages for sensible defaults -------- */
  defaults: {
    averageSalary: 37430,
    averageMortgageRate: 4.75,
    averageEasyAccessSavings: 4.0,
    averageFixedSavings: 4.6,
    averageCreditCardAPR: 24.9,
    inflation: 2.5
  }
};
