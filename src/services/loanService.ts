import { LoanProductConfig, LoanType, AmortizationScheduleItem, LoanApplication, Member } from '../types';

export const LOAN_PRODUCTS: Record<LoanType, LoanProductConfig> = {
  salary_loan: {
    id: 'salary_loan',
    name: 'Salary Loan',
    interestRatePerAnnum: 0.15, // 15% per annum
    maxTermMonths: 48, // 4 years
    maxLoanableAmount: 200000, // 200k max
    description: 'Quick credit line for regular cooperative members tied to monthly compensation with terms up to 4 years at 15% p.a.',
    requirements: [
      'Latest 3 months payslips',
      'Certificate of Employment / Active Coop membership > 6 mos',
      'At least 1 active co-maker in good standing',
      'Minimum Share Capital of ₱10,000'
    ],
    purpose: 'Personal expenses, home improvements, medical support, general liquidity',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  },
  emergency_loan: {
    id: 'emergency_loan',
    name: 'Emergency Loan',
    interestRatePerAnnum: 0.15, // 15% per annum
    maxTermMonths: 12, // Payable in 1 year
    maxLoanableAmount: 200000,
    description: 'Expedited crisis assistance payable in maximum 1 year at 15% p.a. for immediate urgent financial needs.',
    requirements: [
      'Proof of emergency (Hospital bill, disaster certificate, medical prescription)',
      'Government Issued ID',
      'Coop Member in active status'
    ],
    purpose: 'Hospitalization, sudden calamity repair, urgent bereavement or medical bills',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300'
  },
  special_loan: {
    id: 'special_loan',
    name: 'Special Loan',
    interestRatePerAnnum: 0.15, // 15% per annum
    maxTermMonths: 12, // Payable in 1 year
    maxLoanableAmount: 200000,
    description: 'Short-term financing payable in 1 year at 15% p.a. for periodic needs such as tuition fees, seasonal events, and travel.',
    requirements: [
      'Tuition assessment / travel invoice / seasonal requirement docs',
      'Coop Member in Good Standing',
      'Proof of income source'
    ],
    purpose: 'School tuition, educational equipment, holiday seasons, milestone celebrations',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
  },
  productivity_loan: {
    id: 'productivity_loan',
    name: 'Productivity Loan',
    interestRatePerAnnum: 0.15, // 15% per annum
    maxTermMonths: 48, // Up to 4 years
    maxLoanableAmount: 200000,
    description: 'Micro-enterprise and livelihood capital for business equipment, agriculture inputs, and inventory with terms up to 4 years @ 15% p.a.',
    requirements: [
      'Business permit / DTI registration / Farm certification',
      'Projected cash flow or sales ledger',
      '2 Co-makers in good standing'
    ],
    purpose: 'Business expansion, farm equipment, inventory stock, workshop tools',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  restructuring_loan: {
    id: 'restructuring_loan',
    name: 'Restructuring Loan (Refinance Overdue)',
    interestRatePerAnnum: 0.15, // 15% per annum
    maxTermMonths: 48, // Up to 4 years
    maxLoanableAmount: 200000,
    description: 'Refinancing facility specifically for members with overdue/past-due loans to pay off the outstanding principal balance and establish a fresh diminishing amortization schedule up to 48 months at 15% p.a.',
    requirements: [
      'Active overdue loan record under cooperative registry',
      'Signed Loan Restructuring & Promissory Agreement',
      'Updated Proof of Income / Livelihood Source',
      'At least 1 Co-maker in Good Standing'
    ],
    purpose: 'Pay off overdue loan principal, restore member to active/good standing, and establish affordable monthly amortizations',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300'
  }
};

export const MAX_GLOBAL_LOAN_AMOUNT = 200000;
export const MAX_GLOBAL_LOAN_TERM_MONTHS = 48; // 4 years

/**
 * Diminishing Balance / Diminishing Amount Amortization Calculation
 * Under the diminishing amount formula (Equal Principal Installments + Declining Interest):
 * - Principal is divided equally: P / N each month
 * - Interest is computed on the unpaid beginning balance: Balance * (15% / 12) = Balance * 1.25%
 * - Total Monthly Payment diminishes each month as principal balance reduces
 */
export function calculateAmortization(
  principal: number,
  termMonths: number,
  annualInterestRate: number = 0.15,
  startDate: Date = new Date()
): {
  monthlyAmortization: number; // Month 1 initial payment (highest)
  firstMonthlyPayment: number; // Month 1 payment
  lastMonthlyPayment: number; // Month N payment (lowest)
  monthlyPrincipalPayment: number; // Equal monthly principal portion
  averageMonthlyPayment: number; // Average monthly payment across term
  totalInterest: number;
  totalRepayment: number;
  serviceFee: number; // Service Charge (3% of amount applied)
  applicationFee: number; // Application Fee (fixed ₱100)
  guaranteeFee: number; // Guarantee Fee (1% of amount applied)
  capitalBuildUp: number; // Loan Retention for Capital Build Up (5% of amount applied)
  totalDeductions: number; // Total deductions amount
  loanInsurance: number; // 0 (retained for backward compatibility)
  netProceeds: number;
  schedule: AmortizationScheduleItem[];
} {
  const safePrincipal = Math.min(Math.max(1000, principal), MAX_GLOBAL_LOAN_AMOUNT);
  const safeTerm = Math.min(Math.max(1, termMonths), MAX_GLOBAL_LOAN_TERM_MONTHS);
  const monthlyRate = annualInterestRate / 12; // 1.25% per month for 15% p.a.

  const basePrincipalPayment = Math.round((safePrincipal / safeTerm) * 100) / 100;
  let currentBalance = safePrincipal;
  let totalInterest = 0;
  let cumulativePrincipalPaid = 0;
  const schedule: AmortizationScheduleItem[] = [];

  for (let period = 1; period <= safeTerm; period++) {
    const interestPayment = Math.round(currentBalance * monthlyRate * 100) / 100;
    
    // Equal principal per month, with final period absorbing any cent rounding difference
    let principalPayment = basePrincipalPayment;
    if (period === safeTerm || cumulativePrincipalPaid + principalPayment > safePrincipal) {
      principalPayment = Math.round((safePrincipal - cumulativePrincipalPaid) * 100) / 100;
    }

    const totalMonthlyPayment = Math.round((principalPayment + interestPayment) * 100) / 100;
    const endingBalance = Math.max(0, Math.round((currentBalance - principalPayment) * 100) / 100);

    totalInterest += interestPayment;
    cumulativePrincipalPaid += principalPayment;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + period);

    schedule.push({
      period,
      dueDate: dueDate.toISOString().split('T')[0],
      beginningBalance: Math.round(currentBalance * 100) / 100,
      principalPayment,
      interestPayment,
      totalMonthlyPayment,
      endingBalance,
      isPaid: false,
    });

    currentBalance = endingBalance;
  }

  const firstMonthlyPayment = schedule.length > 0 ? schedule[0].totalMonthlyPayment : 0;
  const lastMonthlyPayment = schedule.length > 0 ? schedule[schedule.length - 1].totalMonthlyPayment : 0;
  const totalRepayment = Math.round((safePrincipal + totalInterest) * 100) / 100;
  const averageMonthlyPayment = Math.round((totalRepayment / safeTerm) * 100) / 100;

  // Cooperative deductions breakdown:
  // 1. Service Charge (3% of the amount applied)
  const serviceFee = Math.round(safePrincipal * 0.03 * 100) / 100;
  // 2. Application Fee (fixed ₱100)
  const applicationFee = 100.00;
  // 3. Guarantee Fee (1% of the amount applied)
  const guaranteeFee = Math.round(safePrincipal * 0.01 * 100) / 100;
  // 4. Loan Retention for Capital Build Up (5% of the amount applied)
  const capitalBuildUp = Math.round(safePrincipal * 0.05 * 100) / 100;
  
  const loanInsurance = 0; // Removed/replaced
  const totalDeductions = Math.round((serviceFee + applicationFee + guaranteeFee + capitalBuildUp) * 100) / 100;
  const netProceeds = Math.max(0, Math.round((safePrincipal - totalDeductions) * 100) / 100);

  return {
    monthlyAmortization: firstMonthlyPayment,
    firstMonthlyPayment,
    lastMonthlyPayment,
    monthlyPrincipalPayment: basePrincipalPayment,
    averageMonthlyPayment,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalRepayment,
    serviceFee,
    applicationFee,
    guaranteeFee,
    capitalBuildUp,
    totalDeductions,
    loanInsurance,
    netProceeds,
    schedule,
  };
}

/**
 * Format currency in Philippine Peso (₱)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Helper to calculate Loan Restructuring & Payoff Breakdown
 */
export function calculateRestructuringSettlement(
  newPrincipal: number,
  termMonths: number,
  overdueLoan: LoanApplication,
  annualInterestRate: number = 0.15
): {
  standardCalc: ReturnType<typeof calculateAmortization>;
  overduePrincipalDue: number;
  totalDeductions: number;
  overduePayoffAmount: number;
  totalAllocated: number;
  netCashToBorrower: number;
  isSufficient: boolean;
  recommendedMinPrincipal: number;
} {
  const standardCalc = calculateAmortization(newPrincipal, termMonths, annualInterestRate);
  const overduePrincipalDue = Math.round(overdueLoan.remainingBalance * 100) / 100;
  const overduePayoffAmount = overduePrincipalDue;
  
  // Total deductions = 3% Service + ₱100 App + 1% Guarantee + 5% CBU
  const totalDeductions = standardCalc.totalDeductions;
  const totalAllocated = Math.round((totalDeductions + overduePayoffAmount) * 100) / 100;
  const netCashToBorrower = Math.round((newPrincipal - totalAllocated) * 100) / 100;
  
  // Recommended minimum principal to yield >= 0 net cash after deductions:
  // Principal - (0.09 * Principal + 100) - Overdue >= 0  => 0.91 * Principal >= Overdue + 100
  const recommendedMinPrincipal = Math.min(
    MAX_GLOBAL_LOAN_AMOUNT,
    Math.ceil(((overduePrincipalDue + 100) / 0.91) / 1000) * 1000
  );

  return {
    standardCalc,
    overduePrincipalDue,
    totalDeductions,
    overduePayoffAmount,
    totalAllocated,
    netCashToBorrower,
    isSufficient: newPrincipal >= overduePrincipalDue,
    recommendedMinPrincipal
  };
}

/**
 * Helper to validate loan eligibility against member capacity
 */
export function validateLoanEligibility(
  member: Member,
  loanType: LoanType,
  amount: number,
  termMonths: number,
  overdueLoanToRestructure?: LoanApplication
): { isEligible: boolean; warnings: string[]; errors: string[] } {
  const config = LOAN_PRODUCTS[loanType] || LOAN_PRODUCTS.salary_loan;
  const errors: string[] = [];
  const warnings: string[] = [];
  const isRestructuring = loanType === 'restructuring_loan' || !!overdueLoanToRestructure;

  if (amount > MAX_GLOBAL_LOAN_AMOUNT) {
    errors.push(`Amount exceeds overall maximum ceiling of ${formatCurrency(MAX_GLOBAL_LOAN_AMOUNT)}.`);
  }

  if (amount > config.maxLoanableAmount) {
    errors.push(`Amount exceeds ${config.name} limit of ${formatCurrency(config.maxLoanableAmount)}.`);
  }

  if (termMonths > config.maxTermMonths) {
    errors.push(`Term of ${termMonths} months exceeds ${config.name} maximum term limit (${config.maxTermMonths} months / ${config.maxTermMonths / 12} yr).`);
  }

  if (isRestructuring) {
    if (!overdueLoanToRestructure) {
      warnings.push('Please select the specific overdue loan to be restructured and settled.');
    } else {
      if (amount < overdueLoanToRestructure.remainingBalance) {
        errors.push(
          `Applied loan amount (${formatCurrency(amount)}) must be at least equal to the overdue principal (${formatCurrency(overdueLoanToRestructure.remainingBalance)}) to fully settle the overdue loan.`
        );
      }
      
      const { netCashToBorrower, recommendedMinPrincipal } = calculateRestructuringSettlement(
        amount,
        termMonths,
        overdueLoanToRestructure,
        config.interestRatePerAnnum
      );

      if (netCashToBorrower < 0) {
        warnings.push(
          `Cooperative deductions (9% + ₱100) exceed the remaining net proceeds by ${formatCurrency(Math.abs(netCashToBorrower))}. Suggested minimum loan amount is ${formatCurrency(recommendedMinPrincipal)} to avoid out-of-pocket settlement.`
        );
      }
    }
  } else {
    // Non-restructuring regular loan
    if (member.status === 'past_due' || member.pastDueAmount > 0) {
      errors.push('Member has active past due / delinquent loan records. Please use the "Loan Restructuring" facility to pay off overdue principal before applying for standard credit.');
    }
  }

  if (member.shareCapital < amount * 0.1) {
    warnings.push(`Share Capital (${formatCurrency(member.shareCapital)}) is below recommended 10% equity (${formatCurrency(amount * 0.1)}). Approval may require additional co-makers.`);
  }

  const { monthlyAmortization } = calculateAmortization(amount, termMonths, config.interestRatePerAnnum);
  if (member.monthlySalaryOrIncome > 0 && monthlyAmortization > member.monthlySalaryOrIncome * 0.4) {
    warnings.push(`Monthly amortization (${formatCurrency(monthlyAmortization)}) exceeds 40% of declared monthly income (${formatCurrency(member.monthlySalaryOrIncome)}).`);
  }

  return {
    isEligible: errors.length === 0,
    warnings,
    errors,
  };
}
