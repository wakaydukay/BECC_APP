import { SavingsAccount, SavingsTransaction, Member } from '../types';

export const SAVINGS_CONFIG = {
  annualInterestRate: 0.03, // 3.0% per annum
  monthlyInterestRate: 0.03 / 12, // 0.25% per month
  maxInterestEarningBalance: 300000, // ₱300,000 maximum interest earning balance
  dormancyThresholdDays: 730, // 2 years (365 * 2)
  dormancyThresholdYears: 2,
  standardDormancyServiceFee: 100.00, // ₱100 standard dormancy service fee
};

export interface SavingsInterestCalculation {
  totalBalance: number;
  earningBalance: number; // Amount up to ₱300k earning 3%
  nonEarningBalance: number; // Amount exceeding ₱300k earning 0%
  annualInterestRate: number; // 0.03
  monthlyInterestRate: number; // 0.0025 (0.25% / mo)
  estimatedMonthlyInterest: number;
  estimatedAnnualInterest: number;
  projectedInterestForMonths: number;
  isCapped: boolean; // True if balance > 300,000
  capWarning?: string;
}

export interface DormancyCheckResult {
  isDormant: boolean;
  daysInactive: number;
  yearsInactive: number;
  lastTxDate: string;
  recommendedServiceFee: number;
  notificationMessage: string;
}

/**
 * Calculates interest for cooperative savings accounts based on the 3% p.a. formula
 * and the strict ₱300,000 interest-earning cap.
 */
export function calculateSavingsInterest(
  totalBalance: number,
  months: number = 1
): SavingsInterestCalculation {
  const safeBalance = Math.max(0, Number(totalBalance) || 0);
  const earningBalance = Math.min(safeBalance, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, safeBalance - SAVINGS_CONFIG.maxInterestEarningBalance);
  const isCapped = safeBalance > SAVINGS_CONFIG.maxInterestEarningBalance;

  const estimatedMonthlyInterest = Math.round(earningBalance * SAVINGS_CONFIG.monthlyInterestRate * 100) / 100;
  const estimatedAnnualInterest = Math.round(earningBalance * SAVINGS_CONFIG.annualInterestRate * 100) / 100;
  const projectedInterestForMonths = Math.round(earningBalance * SAVINGS_CONFIG.monthlyInterestRate * months * 100) / 100;

  return {
    totalBalance: safeBalance,
    earningBalance,
    nonEarningBalance,
    annualInterestRate: SAVINGS_CONFIG.annualInterestRate,
    monthlyInterestRate: SAVINGS_CONFIG.monthlyInterestRate,
    estimatedMonthlyInterest,
    estimatedAnnualInterest,
    projectedInterestForMonths,
    isCapped,
    capWarning: isCapped
      ? `₱${nonEarningBalance.toLocaleString()} exceeds the ₱300,000 maximum interest earning limit and will not earn interest.`
      : undefined,
  };
}

/**
 * Checks whether an account has been inactive for 2 years or more.
 */
export function checkDormancyStatus(
  lastTransactionDateStr?: string,
  referenceDate: Date = new Date()
): DormancyCheckResult {
  if (!lastTransactionDateStr) {
    return {
      isDormant: false,
      daysInactive: 0,
      yearsInactive: 0,
      lastTxDate: 'N/A',
      recommendedServiceFee: SAVINGS_CONFIG.standardDormancyServiceFee,
      notificationMessage: 'Account is active.',
    };
  }

  const lastDate = new Date(lastTransactionDateStr);
  const diffTime = referenceDate.getTime() - lastDate.getTime();
  const daysInactive = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const yearsInactive = Number((daysInactive / 365.25).toFixed(1));
  const isDormant = daysInactive >= SAVINGS_CONFIG.dormancyThresholdDays;

  return {
    isDormant,
    daysInactive,
    yearsInactive,
    lastTxDate: lastTransactionDateStr,
    recommendedServiceFee: SAVINGS_CONFIG.standardDormancyServiceFee,
    notificationMessage: isDormant
      ? `Dormancy Alert: No transaction recorded for ${yearsInactive} years (${daysInactive} days, exceeding the 2-year threshold). In accordance with cooperative policy, a service fee must be charged.`
      : `Account is active (last transaction: ${daysInactive} days ago).`,
  };
}

/**
 * Generates an automatic standard Savings Account upon member approval / registration.
 */
export function generateSavingsAccountForMember(
  member: Pick<Member, 'id' | 'fullName' | 'memberNumber' | 'dateAccepted' | 'savingsDeposit'>,
  initialDeposit?: number
): { account: SavingsAccount; initialTx?: SavingsTransaction } {
  const deposit = initialDeposit !== undefined ? initialDeposit : (member.savingsDeposit || 0);
  const year = new Date().getFullYear();
  const suffix = member.memberNumber.split('-')[2] || Math.floor(1000 + Math.random() * 9000).toString();
  const accountNumber = `SA-${year}-${suffix}`;
  const openedDate = member.dateAccepted || new Date().toISOString().split('T')[0];
  const lastTxDate = openedDate;

  const earningBalance = Math.min(deposit, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, deposit - SAVINGS_CONFIG.maxInterestEarningBalance);

  const accountId = `sa-${member.id}`;
  const account: SavingsAccount = {
    id: accountId,
    accountNumber,
    memberId: member.id,
    memberName: member.fullName,
    balance: deposit,
    earningBalance,
    nonEarningBalance,
    annualInterestRate: SAVINGS_CONFIG.annualInterestRate,
    interestCap: SAVINGS_CONFIG.maxInterestEarningBalance,
    openedDate,
    lastTransactionDate: lastTxDate,
    isDormant: false,
    daysSinceLastTransaction: 0,
    totalInterestEarned: 0,
    status: 'active',
    dormancyFeeCount: 0,
    updatedAt: new Date().toISOString(),
  };

  let initialTx: SavingsTransaction | undefined = undefined;
  if (deposit > 0) {
    initialTx = {
      id: `stx-init-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      receiptOrRef: `OR-SAV-INIT-${Math.floor(10000 + Math.random() * 90000)}`,
      savingsAccountId: accountId,
      accountNumber,
      memberId: member.id,
      memberName: member.fullName,
      type: 'initial_opening',
      amount: deposit,
      balanceAfter: deposit,
      date: openedDate,
      performedBy: 'Cooperative Registry System',
      notes: 'Initial opening savings deposit upon member approval',
      isSynced: true,
    };
    account.transactions = [initialTx];
  }

  return { account, initialTx };
}

/**
 * Creates a deposit transaction and updates account balance and dates.
 */
export function depositToSavings(
  account: SavingsAccount,
  amount: number,
  performedBy: string = 'Account Officer',
  notes: string = 'Over-the-counter savings deposit'
): { updatedAccount: SavingsAccount; transaction: SavingsTransaction } {
  const depositAmount = Math.max(0, Number(amount) || 0);
  const newBalance = Math.round((account.balance + depositAmount) * 100) / 100;
  const today = new Date().toISOString().split('T')[0];
  const earningBalance = Math.min(newBalance, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, newBalance - SAVINGS_CONFIG.maxInterestEarningBalance);

  const tx: SavingsTransaction = {
    id: `stx-dep-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    receiptOrRef: `OR-SAV-${Math.floor(100000 + Math.random() * 900000)}`,
    savingsAccountId: account.id,
    accountNumber: account.accountNumber,
    memberId: account.memberId,
    memberName: account.memberName,
    type: 'deposit',
    amount: depositAmount,
    balanceAfter: newBalance,
    date: today,
    performedBy,
    notes,
    isSynced: false,
  };

  const updatedAccount: SavingsAccount = {
    ...account,
    balance: newBalance,
    earningBalance,
    nonEarningBalance,
    lastTransactionDate: today,
    isDormant: false,
    daysSinceLastTransaction: 0,
    status: 'active',
    transactions: [tx, ...(account.transactions || [])],
    updatedAt: new Date().toISOString(),
  };

  return { updatedAccount, transaction: tx };
}

/**
 * Creates a withdrawal transaction and updates account balance.
 */
export function withdrawFromSavings(
  account: SavingsAccount,
  amount: number,
  performedBy: string = 'Account Officer',
  notes: string = 'Savings withdrawal'
): { updatedAccount: SavingsAccount; transaction: SavingsTransaction } {
  const withdrawAmount = Math.max(0, Number(amount) || 0);
  if (withdrawAmount > account.balance) {
    throw new Error(`Insufficient savings balance. Current balance is ₱${account.balance.toLocaleString()}.`);
  }

  const newBalance = Math.round((account.balance - withdrawAmount) * 100) / 100;
  const today = new Date().toISOString().split('T')[0];
  const earningBalance = Math.min(newBalance, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, newBalance - SAVINGS_CONFIG.maxInterestEarningBalance);

  const tx: SavingsTransaction = {
    id: `stx-wd-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    receiptOrRef: `WD-SAV-${Math.floor(100000 + Math.random() * 900000)}`,
    savingsAccountId: account.id,
    accountNumber: account.accountNumber,
    memberId: account.memberId,
    memberName: account.memberName,
    type: 'withdrawal',
    amount: withdrawAmount,
    balanceAfter: newBalance,
    date: today,
    performedBy,
    notes,
    isSynced: false,
  };

  const updatedAccount: SavingsAccount = {
    ...account,
    balance: newBalance,
    earningBalance,
    nonEarningBalance,
    lastTransactionDate: today,
    isDormant: false,
    daysSinceLastTransaction: 0,
    status: 'active',
    transactions: [tx, ...(account.transactions || [])],
    updatedAt: new Date().toISOString(),
  };

  return { updatedAccount, transaction: tx };
}

/**
 * Credits monthly or periodic interest (3% p.a. on capped balance) to savings account.
 */
export function creditSavingsInterest(
  account: SavingsAccount,
  months: number = 1,
  performedBy: string = 'System / Account Officer'
): { updatedAccount: SavingsAccount; transaction: SavingsTransaction; interestAmount: number } {
  const calc = calculateSavingsInterest(account.balance, months);
  const interestAmount = calc.projectedInterestForMonths;

  if (interestAmount <= 0) {
    throw new Error('Account balance has no accrued interest to credit.');
  }

  const newBalance = Math.round((account.balance + interestAmount) * 100) / 100;
  const today = new Date().toISOString().split('T')[0];
  const earningBalance = Math.min(newBalance, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, newBalance - SAVINGS_CONFIG.maxInterestEarningBalance);

  const tx: SavingsTransaction = {
    id: `stx-int-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    receiptOrRef: `INT-3PCT-${Math.floor(100000 + Math.random() * 900000)}`,
    savingsAccountId: account.id,
    accountNumber: account.accountNumber,
    memberId: account.memberId,
    memberName: account.memberName,
    type: 'interest_crediting',
    amount: interestAmount,
    balanceAfter: newBalance,
    date: today,
    performedBy,
    notes: `Credited 3% p.a. interest (${months} mo.) on eligible balance ₱${calc.earningBalance.toLocaleString()}${calc.isCapped ? ' (capped at ₱300,000)' : ''}`,
    isSynced: false,
  };

  const updatedAccount: SavingsAccount = {
    ...account,
    balance: newBalance,
    earningBalance,
    nonEarningBalance,
    totalInterestEarned: Math.round(((account.totalInterestEarned || 0) + interestAmount) * 100) / 100,
    transactions: [tx, ...(account.transactions || [])],
    updatedAt: new Date().toISOString(),
  };

  return { updatedAccount, transaction: tx, interestAmount };
}

/**
 * Charges dormancy service fee when account has no transaction for >= 2 years.
 */
export function chargeDormancyServiceFee(
  account: SavingsAccount,
  feeAmount: number = SAVINGS_CONFIG.standardDormancyServiceFee,
  officerName: string = 'Account Officer',
  notes?: string
): { updatedAccount: SavingsAccount; transaction: SavingsTransaction } {
  const fee = Math.max(0, Number(feeAmount) || SAVINGS_CONFIG.standardDormancyServiceFee);
  const newBalance = Math.max(0, Math.round((account.balance - fee) * 100) / 100);
  const today = new Date().toISOString().split('T')[0];
  const earningBalance = Math.min(newBalance, SAVINGS_CONFIG.maxInterestEarningBalance);
  const nonEarningBalance = Math.max(0, newBalance - SAVINGS_CONFIG.maxInterestEarningBalance);

  const tx: SavingsTransaction = {
    id: `stx-dorm-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    receiptOrRef: `DFEE-${Math.floor(100000 + Math.random() * 900000)}`,
    savingsAccountId: account.id,
    accountNumber: account.accountNumber,
    memberId: account.memberId,
    memberName: account.memberName,
    type: 'dormancy_fee',
    amount: fee,
    balanceAfter: newBalance,
    date: today,
    performedBy: officerName,
    notes: notes || `Dormancy service fee charged due to account inactivity exceeding 2 years (Last Tx: ${account.lastTransactionDate})`,
    isSynced: false,
  };

  const updatedAccount: SavingsAccount = {
    ...account,
    balance: newBalance,
    earningBalance,
    nonEarningBalance,
    dormancyFeeCount: (account.dormancyFeeCount || 0) + 1,
    lastDormancyFeeDate: today,
    transactions: [tx, ...(account.transactions || [])],
    updatedAt: new Date().toISOString(),
  };

  return { updatedAccount, transaction: tx };
}
