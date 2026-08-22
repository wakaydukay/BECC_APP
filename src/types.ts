export type MemberStatus = 'active' | 'past_due' | 'good_standing' | 'probationary' | 'inactive';
export type MemberType = 'regular' | 'associate';

export type LoanType = 'salary_loan' | 'emergency_loan' | 'special_loan' | 'productivity_loan' | 'restructuring_loan';

export type LoanStatus = 'pending' | 'approved' | 'active' | 'past_due' | 'fully_paid' | 'rejected' | 'restructured';

export interface LoanProductConfig {
  id: LoanType;
  name: string;
  interestRatePerAnnum: number; // 0.15 for 15%
  maxTermMonths: number; // e.g. 48 for Salary/Productivity, 12 for Emergency/Special
  maxLoanableAmount: number; // 200,000
  description: string;
  requirements: string[];
  purpose: string;
  badgeColor: string;
}

export interface AmortizationScheduleItem {
  period: number; // Month 1, 2, ...
  dueDate: string;
  beginningBalance: number;
  principalPayment: number;
  interestPayment: number;
  totalMonthlyPayment: number;
  endingBalance: number;
  isPaid: boolean;
  paidAt?: string;
  paymentRef?: string;
}

export interface LoanApplication {
  id: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  loanType: LoanType;
  principalAmount: number; // Max 200,000
  termMonths: number; // Max 48 or 12 depending on loan
  annualInterestRate: number; // 0.15
  monthlyAmortization: number;
  totalInterest: number;
  serviceFee: number; // Service Charge (3% of amount applied)
  applicationFee: number; // Application Fee (fixed ₱100)
  guaranteeFee: number; // Guarantee Fee (1% of amount applied)
  capitalBuildUp: number; // Loan Retention for Capital Build Up (5% of amount applied)
  totalDeductions: number; // Total deductions amount
  loanInsurance?: number; // Optional/legacy
  netProceeds: number;
  status: LoanStatus;
  purpose: string;
  appliedDate: string;
  approvedDate?: string;
  maturityDate: string;
  nextDueDate: string;
  remainingBalance: number;
  totalPaid: number;
  overdueAmount: number;
  daysOverdue: number;
  schedule: AmortizationScheduleItem[];
  coMakers?: string[];
  // Loan Restructuring Fields
  isRestructured?: boolean;
  restructuredFromLoanId?: string;
  restructuredFromLoanNumber?: string;
  restructuredPrincipalPaid?: number;
  netCashDisbursed?: number;
  restructuringNotes?: string;
  version: number;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  loanId: string;
  loanNumber: string;
  memberId: string;
  memberName: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  penaltyPaid: number;
  paymentDate: string;
  channel: 'cash_teller' | 'bank_transfer' | 'salary_deduction' | 'offline_agent' | 'restructuring_offset';
  notes?: string;
  isSynced: boolean;
  version: number;
  updatedAt: string;
}

export interface ProgramAidInfo {
  isEnrolled: boolean;
  isPaid: boolean;
  feeAmount: number;
  paidDate?: string;
  validUntil?: string;
  receiptNo?: string;
  benefitCoverage: string;
}

export type SavingsTransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'interest_crediting' 
  | 'interest_credited' 
  | 'dormancy_fee' 
  | 'initial_opening' 
  | 'account_opening';

export interface SavingsTransaction {
  id: string;
  receiptOrRef: string;
  savingsAccountId: string;
  accountNumber: string;
  memberId: string;
  memberName: string;
  type: SavingsTransactionType;
  amount: number;
  balanceAfter: number;
  date: string; // YYYY-MM-DD
  performedBy: string; // e.g. "Account Officer" | "System Batch" | "Member Self-Service"
  notes?: string;
  isSynced?: boolean;
}

export interface SavingsAccount {
  id: string;
  accountNumber: string; // e.g. SA-2024-001
  memberId: string;
  memberName: string;
  balance: number; // Current Total Savings Balance
  earningBalance: number; // min(balance, 300000)
  nonEarningBalance: number; // max(0, balance - 300000)
  annualInterestRate: number; // 0.03 (3% per annum)
  interestCap: number; // 300000 (Max ₱300,000 earning interest)
  openedDate: string; // Date Accepted / Opened
  lastTransactionDate: string; // YYYY-MM-DD
  isDormant: boolean; // True if no transaction within 2 years (>= 730 days)
  daysSinceLastTransaction: number;
  totalInterestEarned: number;
  status: 'active' | 'dormant' | 'frozen';
  dormancyFeeCount?: number;
  lastDormancyFeeDate?: string;
  transactions?: SavingsTransaction[];
  version?: number;
  updatedAt: string;
}

export interface Member {
  id: string;
  memberNumber: string; // e.g. COOP-2024-001
  fullName: string;
  email: string;
  phone: string;
  
  // Official Cooperative Registration Details
  tinNumber: string; // T.I.N.
  dateAccepted: string; // Date Accepted (YYYY-MM-DD)
  bodResolutionNo: string; // BOD Resolution No.
  sharesSubscribed: number; // No. of Shares Subscribed
  subscribedAmount: number; // Amount (Total Subscribed Share Capital)
  initialPaidUp: number; // Initial Paid-up
  shareCapital: number; // Current Total Paid-up Share Capital
  savingsDeposit: number; // Current Savings Deposit
  savingsAccountNumber?: string;
  savingsAccount?: SavingsAccount;
  
  // Personal & Demographic Details
  address: string; // Residential Address
  dateOfBirth: string; // Date of Birth (YYYY-MM-DD)
  age: number; // Age
  gender: 'Male' | 'Female' | 'Other' | string; // Gender
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated' | 'Divorced' | string; // Civil Status
  highestEduAttainment: 'Elementary' | 'High School' | 'Vocational' | 'College' | 'Post Graduate' | string; // Highest Edu. Attainment
  occupationOrSourceOfIncome: string; // Occupation/Source of Income
  numberOfDependents: number; // No. of Dependent/s
  religionOrAffiliation: string; // Religion/soc Affiliation
  annualIncome: number; // Annual Income (PHP)
  
  // Termination Details (Optional / If Terminated)
  dateOfTermination?: string; // Date of Termination (YYYY-MM-DD)
  terminationResolution?: string; // Termination Resolution No. / BOD Res
  
  // Backward compatibility & Operational fields
  joinDate: string; // Same as dateAccepted
  employerOrBusiness: string; // Alias of occupationOrSourceOfIncome
  monthlySalaryOrIncome: number; // Monthly equivalent of annual income
  memberType: MemberType;
  status: MemberStatus;
  
  // Aid Programs (HAP & MAP)
  isHapMember: boolean; // True if Health Aid Program fee is paid
  isMapMember: boolean; // True if Mutual Aid Program fee is paid
  hapInfo: ProgramAidInfo;
  mapInfo: ProgramAidInfo;
  
  // Loan & Credit Standing
  activeLoanCount: number;
  totalLoanBalance: number;
  pastDueAmount: number;
  creditScoreCategory: 'A (Excellent)' | 'B (Good)' | 'C (Fair)' | 'D (Delinquent)';
  emergencyContact: {
    name: string;
    phone: string;
    relationship: string;
  };
  version: number;
  updatedAt: string;
}

export interface QueuedOfflineMutation {
  id: string;
  entityType: 'loan' | 'member' | 'payment' | 'savings' | 'savings_tx';
  action: 'create' | 'update' | 'delete';
  entityId: string;
  payload: any;
  timestamp: number;
  clientVersion: number;
  status: 'pending' | 'syncing' | 'resolved' | 'failed';
  retryCount: number;
  error?: string;
}

export interface ConflictRecord {
  id: string;
  entityType: 'loan' | 'member' | 'payment' | 'savings' | 'savings_tx';
  entityId: string;
  field: string;
  localValue: any;
  serverValue: any;
  resolvedValue: any;
  resolutionStrategy: 'additive_balance' | 'field_merge' | 'last_write_wins' | 'server_priority' | 'client_priority' | 'manual_merged';
  explanation: string;
  timestamp: string;
  status: 'auto_resolved' | 'requires_review' | 'acknowledged';
}

export interface SyncReport {
  id: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  itemsUploaded: number;
  itemsDownloaded: number;
  conflictsDetected: number;
  conflictsAutoResolved: number;
  status: 'success' | 'partial' | 'failed';
  details: string[];
}

export interface EncryptionVaultState {
  isInitialized: boolean;
  isUnlocked: boolean;
  isCustomKeySet: boolean;
  lastEncryptedAt: string;
  payloadCipherSize: number;
  algorithm: string;
}

export interface NetworkSimulationState {
  mode: 'online' | 'offline' | 'slow_3g';
  latencyMs: number;
  isOfflineSimulated: boolean;
}
