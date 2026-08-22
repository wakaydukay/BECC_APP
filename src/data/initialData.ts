import { Member, LoanApplication, PaymentTransaction, SavingsAccount, SavingsTransaction } from '../types';
import { calculateAmortization } from '../services/loanService';
import { SAVINGS_CONFIG } from '../services/savingsService';

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'mem-001',
    memberNumber: 'COOP-2021-0104',
    fullName: 'Maria Elena Santos',
    email: 'maria.santos@coopmail.ph',
    phone: '+63 917 555 0192',
    
    // Official Cooperative Registration Details
    tinNumber: '293-104-582-000',
    dateAccepted: '2021-03-15',
    bodResolutionNo: 'BOD-RES-2021-042',
    sharesSubscribed: 500,
    subscribedAmount: 50000,
    initialPaidUp: 12500,
    shareCapital: 48500,
    savingsDeposit: 48500,
    savingsAccountNumber: 'SA-2021-0104',
    
    // Personal & Demographic Details
    address: 'Block 12 Lot 5, Sampaguita St., Brgy. San Isidro, Antipolo City, Rizal',
    dateOfBirth: '1988-06-24',
    age: 38,
    gender: 'Female',
    civilStatus: 'Married',
    highestEduAttainment: 'College Graduate (BS Nursing)',
    occupationOrSourceOfIncome: 'Government Nurse II (Provincial Health Office)',
    numberOfDependents: 2,
    religionOrAffiliation: 'Roman Catholic / Phil. Nurses Association',
    annualIncome: 456000,
    
    // Termination Details (None - Active)
    dateOfTermination: undefined,
    terminationResolution: undefined,
    
    // Operational & Aid Program Details
    joinDate: '2021-03-15',
    employerOrBusiness: 'Provincial Health Office (Nurse II)',
    monthlySalaryOrIncome: 38000,
    memberType: 'regular',
    status: 'good_standing',
    isHapMember: true,
    isMapMember: true,
    hapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1000,
      paidDate: '2026-01-15',
      validUntil: '2027-01-15',
      receiptNo: 'OR-HAP-9012',
      benefitCoverage: '₱10,000 Hospitalization Assistance'
    },
    mapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1500,
      paidDate: '2026-01-15',
      validUntil: '2027-01-15',
      receiptNo: 'OR-MAP-8801',
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
    },
    activeLoanCount: 1,
    totalLoanBalance: 65200,
    pastDueAmount: 0,
    creditScoreCategory: 'A (Excellent)',
    emergencyContact: {
      name: 'Roberto Santos',
      phone: '+63 918 444 8821',
      relationship: 'Spouse'
    },
    version: 1,
    updatedAt: '2026-08-10T08:30:00.000Z'
  },
  {
    id: 'mem-002',
    memberNumber: 'COOP-2020-0042',
    fullName: 'Danilo Ramos Jr.',
    email: 'danilo.ramos@coopmail.ph',
    phone: '+63 920 888 2311',
    
    // Official Cooperative Registration Details
    tinNumber: '184-902-114-000',
    dateAccepted: '2020-01-20',
    bodResolutionNo: 'BOD-RES-2020-011',
    sharesSubscribed: 400,
    subscribedAmount: 40000,
    initialPaidUp: 10000,
    shareCapital: 31000,
    savingsDeposit: 8400,
    savingsAccountNumber: 'SA-2020-0042',
    
    // Personal & Demographic Details
    address: '142 Rizal Ave., Poblacion 2, Silang, Cavite',
    dateOfBirth: '1982-11-14',
    age: 43,
    gender: 'Male',
    civilStatus: 'Married',
    highestEduAttainment: 'Vocational Diploma (Agri-Business & Veterinary Tech)',
    occupationOrSourceOfIncome: 'Agrivet Retailer & Poultry Farmer',
    numberOfDependents: 4,
    religionOrAffiliation: 'Iglesia ni Cristo / Silang Market Vendors Guild',
    annualIncome: 336000,
    
    // Termination Details (None)
    dateOfTermination: undefined,
    terminationResolution: undefined,
    
    joinDate: '2020-01-20',
    employerOrBusiness: 'Silang Public Market Agrivet Store',
    monthlySalaryOrIncome: 28000,
    memberType: 'regular',
    status: 'past_due',
    isHapMember: true,
    isMapMember: false,
    hapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1000,
      paidDate: '2026-02-10',
      validUntil: '2027-02-10',
      receiptNo: 'OR-HAP-9044',
      benefitCoverage: '₱10,000 Hospitalization Assistance'
    },
    mapInfo: {
      isEnrolled: true,
      isPaid: false,
      feeAmount: 1500,
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance (Unpaid Fee)'
    },
    activeLoanCount: 1,
    totalLoanBalance: 82400,
    pastDueAmount: 16840,
    creditScoreCategory: 'D (Delinquent)',
    emergencyContact: {
      name: 'Corazon Ramos',
      phone: '+63 921 777 9012',
      relationship: 'Mother'
    },
    version: 3,
    updatedAt: '2026-08-15T14:10:00.000Z'
  },
  {
    id: 'mem-003',
    memberNumber: 'COOP-2022-0219',
    fullName: 'Engr. Aris Bautista',
    email: 'aris.bautista@coopmail.ph',
    phone: '+63 919 222 7654',
    
    // Official Cooperative Registration Details
    tinNumber: '445-129-873-000',
    dateAccepted: '2022-06-10',
    bodResolutionNo: 'BOD-RES-2022-098',
    sharesSubscribed: 1000,
    subscribedAmount: 100000,
    initialPaidUp: 25000,
    shareCapital: 75000,
    savingsDeposit: 165000,
    savingsAccountNumber: 'SA-2022-0219',
    
    // Personal & Demographic Details
    address: 'Phase 3, Greenwoods Executive Village, Cainta, Rizal',
    dateOfBirth: '1985-04-18',
    age: 41,
    gender: 'Male',
    civilStatus: 'Married',
    highestEduAttainment: 'Post Graduate (MS Construction Management, BS Civil Eng)',
    occupationOrSourceOfIncome: 'Senior Project Engineer & Contractor',
    numberOfDependents: 3,
    religionOrAffiliation: 'Roman Catholic / PICE Member',
    annualIncome: 780000,
    
    joinDate: '2022-06-10',
    employerOrBusiness: 'Mega Builders Engineering Corp.',
    monthlySalaryOrIncome: 65000,
    memberType: 'regular',
    status: 'active',
    isHapMember: true,
    isMapMember: true,
    hapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1000,
      paidDate: '2026-03-01',
      validUntil: '2027-03-01',
      receiptNo: 'OR-HAP-9110',
      benefitCoverage: '₱10,000 Hospitalization Assistance'
    },
    mapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1500,
      paidDate: '2026-03-01',
      validUntil: '2027-03-01',
      receiptNo: 'OR-MAP-8920',
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
    },
    activeLoanCount: 1,
    totalLoanBalance: 120500,
    pastDueAmount: 0,
    creditScoreCategory: 'A (Excellent)',
    emergencyContact: {
      name: 'Lianne Bautista',
      phone: '+63 919 222 7655',
      relationship: 'Spouse'
    },
    version: 1,
    updatedAt: '2026-08-12T09:00:00.000Z'
  },
  {
    id: 'mem-004',
    memberNumber: 'COOP-2023-0388',
    fullName: 'Lourdes "Lulu" Dela Cruz',
    email: 'lourdes.delacruz@coopmail.ph',
    phone: '+63 928 333 4910',
    
    // Official Cooperative Registration Details
    tinNumber: '312-589-401-000',
    dateAccepted: '2023-02-14',
    bodResolutionNo: 'BOD-RES-2023-028',
    sharesSubscribed: 300,
    subscribedAmount: 30000,
    initialPaidUp: 7500,
    shareCapital: 19500,
    savingsDeposit: 15200,
    savingsAccountNumber: 'SA-2023-0388',
    
    // Personal & Demographic Details
    address: 'Purok 4, Sitio Maligaya, Brgy. Bucal, Calamba, Laguna',
    dateOfBirth: '1979-09-03',
    age: 46,
    gender: 'Female',
    civilStatus: 'Widowed',
    highestEduAttainment: 'High School Graduate & Culinary Vocational Cert',
    occupationOrSourceOfIncome: 'Eatery Owner & Food Processing Micro-enterprise',
    numberOfDependents: 3,
    religionOrAffiliation: 'Born Again Christian / Laguna Micro-Vendors Assoc',
    annualIncome: 264000,
    
    joinDate: '2023-02-14',
    employerOrBusiness: 'Dela Cruz Eatery & Catering',
    monthlySalaryOrIncome: 22000,
    memberType: 'regular',
    status: 'past_due',
    isHapMember: false,
    isMapMember: true,
    hapInfo: {
      isEnrolled: true,
      isPaid: false,
      feeAmount: 1000,
      benefitCoverage: '₱10,000 Hospitalization Assistance (Unpaid Fee)'
    },
    mapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1500,
      paidDate: '2026-01-20',
      validUntil: '2027-01-20',
      receiptNo: 'OR-MAP-8845',
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
    },
    activeLoanCount: 1,
    totalLoanBalance: 34200,
    pastDueAmount: 9850,
    creditScoreCategory: 'D (Delinquent)',
    emergencyContact: {
      name: 'Fernando Dela Cruz',
      phone: '+63 928 333 4911',
      relationship: 'Brother'
    },
    version: 2,
    updatedAt: '2026-08-18T11:45:00.000Z'
  },
  {
    id: 'mem-005',
    memberNumber: 'COOP-2019-0012',
    fullName: 'Dr. Teresa G. Mendoza',
    email: 'teresa.mendoza@coopmail.ph',
    phone: '+63 917 111 8900',
    
    // Official Cooperative Registration Details
    tinNumber: '109-843-221-000',
    dateAccepted: '2019-05-02',
    bodResolutionNo: 'BOD-RES-2019-005',
    sharesSubscribed: 1200,
    subscribedAmount: 120000,
    initialPaidUp: 30000,
    shareCapital: 110000,
    savingsDeposit: 385000, // Exceeds ₱300,000 interest cap!
    savingsAccountNumber: 'SA-2019-0012',
    
    // Personal & Demographic Details
    address: '88 Malakas St., Teachers Village, Diliman, Quezon City',
    dateOfBirth: '1974-03-29',
    age: 52,
    gender: 'Female',
    civilStatus: 'Married',
    highestEduAttainment: 'Doctorate (Ph.D. in Education Administration)',
    occupationOrSourceOfIncome: 'University Professor & Academic Consultant',
    numberOfDependents: 1,
    religionOrAffiliation: 'Roman Catholic / Philippine Association of Educators',
    annualIncome: 1020000,
    
    joinDate: '2019-05-02',
    employerOrBusiness: 'State University Faculty Member',
    monthlySalaryOrIncome: 85000,
    memberType: 'regular',
    status: 'good_standing',
    isHapMember: true,
    isMapMember: true,
    hapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1000,
      paidDate: '2026-01-05',
      validUntil: '2027-01-05',
      receiptNo: 'OR-HAP-8980',
      benefitCoverage: '₱10,000 Hospitalization Assistance'
    },
    mapInfo: {
      isEnrolled: true,
      isPaid: true,
      feeAmount: 1500,
      paidDate: '2026-01-05',
      validUntil: '2027-01-05',
      receiptNo: 'OR-MAP-8760',
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
    },
    activeLoanCount: 0,
    totalLoanBalance: 0,
    pastDueAmount: 0,
    creditScoreCategory: 'A (Excellent)',
    emergencyContact: {
      name: 'Gabriel Mendoza',
      phone: '+63 917 111 8901',
      relationship: 'Son'
    },
    version: 1,
    updatedAt: '2026-08-01T10:00:00.000Z'
  },
  {
    id: 'mem-006',
    memberNumber: 'COOP-2024-0491',
    fullName: 'Jomar Vincent Alcantara',
    email: 'jomar.alcantara@coopmail.ph',
    phone: '+63 939 444 1928',
    
    // Official Cooperative Registration Details
    tinNumber: '501-229-381-000',
    dateAccepted: '2024-01-18',
    bodResolutionNo: 'BOD-RES-2024-014',
    sharesSubscribed: 250,
    subscribedAmount: 25000,
    initialPaidUp: 6250,
    shareCapital: 15000,
    savingsDeposit: 24000,
    savingsAccountNumber: 'SA-2024-0491',
    
    // Personal & Demographic Details
    address: '74 M.H. Del Pilar St., Brgy. San Nicolas, Pasig City',
    dateOfBirth: '1995-12-08',
    age: 30,
    gender: 'Male',
    civilStatus: 'Single',
    highestEduAttainment: 'College Graduate (BS Information Technology)',
    occupationOrSourceOfIncome: 'Logistics Operations Dispatcher & Freelance Web Dev',
    numberOfDependents: 1,
    religionOrAffiliation: 'Roman Catholic / Pasig Youth Development Council',
    annualIncome: 384000,
    
    joinDate: '2024-01-18',
    employerOrBusiness: 'Logistics Courier Hub Dispatcher',
    monthlySalaryOrIncome: 32000,
    memberType: 'associate',
    status: 'active',
    isHapMember: false,
    isMapMember: false,
    hapInfo: {
      isEnrolled: false,
      isPaid: false,
      feeAmount: 1000,
      benefitCoverage: '₱10,000 Hospitalization Assistance (Enrollment Pending)'
    },
    mapInfo: {
      isEnrolled: false,
      isPaid: false,
      feeAmount: 1500,
      benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance (Enrollment Pending)'
    },
    activeLoanCount: 1,
    totalLoanBalance: 28500,
    pastDueAmount: 0,
    creditScoreCategory: 'B (Good)',
    emergencyContact: {
      name: 'Marites Alcantara',
      phone: '+63 939 444 1929',
      relationship: 'Mother'
    },
    version: 1,
    updatedAt: '2026-08-16T15:20:00.000Z'
  }
];

export function generateInitialSavingsAccounts(): SavingsAccount[] {
  return [
    {
      id: 'sa-mem-001',
      accountNumber: 'SA-2021-0104',
      memberId: 'mem-001',
      memberName: 'Maria Elena Santos',
      balance: 48500,
      earningBalance: 48500,
      nonEarningBalance: 0,
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2021-03-15',
      lastTransactionDate: '2026-07-20',
      isDormant: false,
      daysSinceLastTransaction: 32,
      totalInterestEarned: 2450.75,
      status: 'active',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-10T08:30:00.000Z',
      transactions: [
        {
          id: 'stx-001-1',
          receiptOrRef: 'OR-SAV-2026-0720',
          savingsAccountId: 'sa-mem-001',
          accountNumber: 'SA-2021-0104',
          memberId: 'mem-001',
          memberName: 'Maria Elena Santos',
          type: 'deposit',
          amount: 5000,
          balanceAfter: 48500,
          date: '2026-07-20',
          performedBy: 'Account Officer',
          notes: 'Regular monthly savings contribution',
          isSynced: true
        },
        {
          id: 'stx-001-2',
          receiptOrRef: 'INT-3PCT-2026-0630',
          savingsAccountId: 'sa-mem-001',
          accountNumber: 'SA-2021-0104',
          memberId: 'mem-001',
          memberName: 'Maria Elena Santos',
          type: 'interest_crediting',
          amount: 108.75,
          balanceAfter: 43500,
          date: '2026-06-30',
          performedBy: 'System Batch',
          notes: '3% p.a. monthly savings interest posted',
          isSynced: true
        }
      ]
    },
    {
      id: 'sa-mem-002',
      accountNumber: 'SA-2020-0042',
      memberId: 'mem-002',
      memberName: 'Danilo Ramos Jr.',
      balance: 8400,
      earningBalance: 8400,
      nonEarningBalance: 0,
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2020-01-20',
      lastTransactionDate: '2024-03-12', // > 2 years ago! (892 days inactive)
      isDormant: true,
      daysSinceLastTransaction: 892,
      totalInterestEarned: 480.00,
      status: 'dormant',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-15T14:10:00.000Z',
      transactions: [
        {
          id: 'stx-002-1',
          receiptOrRef: 'OR-SAV-2024-0312',
          savingsAccountId: 'sa-mem-002',
          accountNumber: 'SA-2020-0042',
          memberId: 'mem-002',
          memberName: 'Danilo Ramos Jr.',
          type: 'deposit',
          amount: 1200,
          balanceAfter: 8400,
          date: '2024-03-12',
          performedBy: 'Account Officer',
          notes: 'Last over-the-counter deposit before inactivity',
          isSynced: true
        }
      ]
    },
    {
      id: 'sa-mem-003',
      accountNumber: 'SA-2022-0219',
      memberId: 'mem-003',
      memberName: 'Engr. Aris Bautista',
      balance: 165000,
      earningBalance: 165000,
      nonEarningBalance: 0,
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2022-06-10',
      lastTransactionDate: '2026-08-05',
      isDormant: false,
      daysSinceLastTransaction: 16,
      totalInterestEarned: 8920.00,
      status: 'active',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-12T09:00:00.000Z',
      transactions: [
        {
          id: 'stx-003-1',
          receiptOrRef: 'OR-SAV-2026-0805',
          savingsAccountId: 'sa-mem-003',
          accountNumber: 'SA-2022-0219',
          memberId: 'mem-003',
          memberName: 'Engr. Aris Bautista',
          type: 'deposit',
          amount: 25000,
          balanceAfter: 165000,
          date: '2026-08-05',
          performedBy: 'Account Officer',
          notes: 'Project profit retention deposit',
          isSynced: true
        }
      ]
    },
    {
      id: 'sa-mem-004',
      accountNumber: 'SA-2023-0388',
      memberId: 'mem-004',
      memberName: 'Lourdes "Lulu" Dela Cruz',
      balance: 15200,
      earningBalance: 15200,
      nonEarningBalance: 0,
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2023-02-14',
      lastTransactionDate: '2026-06-18',
      isDormant: false,
      daysSinceLastTransaction: 64,
      totalInterestEarned: 620.50,
      status: 'active',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-18T11:45:00.000Z',
      transactions: [
        {
          id: 'stx-004-1',
          receiptOrRef: 'OR-SAV-2026-0618',
          savingsAccountId: 'sa-mem-004',
          accountNumber: 'SA-2023-0388',
          memberId: 'mem-004',
          memberName: 'Lourdes "Lulu" Dela Cruz',
          type: 'deposit',
          amount: 2000,
          balanceAfter: 15200,
          date: '2026-06-18',
          performedBy: 'Account Officer',
          notes: 'Weekly catering proceeds deposit',
          isSynced: true
        }
      ]
    },
    {
      id: 'sa-mem-005',
      accountNumber: 'SA-2019-0012',
      memberId: 'mem-005',
      memberName: 'Dr. Teresa G. Mendoza',
      balance: 385000, // Exceeds ₱300,000 cap!
      earningBalance: 300000, // Cap reached
      nonEarningBalance: 85000, // ₱85,000 does not earn interest
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2019-05-02',
      lastTransactionDate: '2026-08-01',
      isDormant: false,
      daysSinceLastTransaction: 20,
      totalInterestEarned: 28450.00,
      status: 'active',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-01T10:00:00.000Z',
      transactions: [
        {
          id: 'stx-005-1',
          receiptOrRef: 'OR-SAV-2026-0801',
          savingsAccountId: 'sa-mem-005',
          accountNumber: 'SA-2019-0012',
          memberId: 'mem-005',
          memberName: 'Dr. Teresa G. Mendoza',
          type: 'deposit',
          amount: 50000,
          balanceAfter: 385000,
          date: '2026-08-01',
          performedBy: 'Account Officer',
          notes: 'Consultancy honorarium deposit (Noted: ₱85k excess over ₱300k interest-earning cap)',
          isSynced: true
        },
        {
          id: 'stx-005-2',
          receiptOrRef: 'INT-3PCT-2026-0731',
          savingsAccountId: 'sa-mem-005',
          accountNumber: 'SA-2019-0012',
          memberId: 'mem-005',
          memberName: 'Dr. Teresa G. Mendoza',
          type: 'interest_crediting',
          amount: 750.00, // Exactly ₱300k * 3% / 12 = ₱750 max
          balanceAfter: 335000,
          date: '2026-07-31',
          performedBy: 'System Batch',
          notes: 'Max monthly 3% p.a. interest posted (Capped at ₱300,000 principal)',
          isSynced: true
        }
      ]
    },
    {
      id: 'sa-mem-006',
      accountNumber: 'SA-2024-0491',
      memberId: 'mem-006',
      memberName: 'Jomar Vincent Alcantara',
      balance: 24000,
      earningBalance: 24000,
      nonEarningBalance: 0,
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: '2024-01-18',
      lastTransactionDate: '2026-07-30',
      isDormant: false,
      daysSinceLastTransaction: 22,
      totalInterestEarned: 890.00,
      status: 'active',
      dormancyFeeCount: 0,
      updatedAt: '2026-08-16T15:20:00.000Z',
      transactions: [
        {
          id: 'stx-006-1',
          receiptOrRef: 'OR-SAV-2026-0730',
          savingsAccountId: 'sa-mem-006',
          accountNumber: 'SA-2024-0491',
          memberId: 'mem-006',
          memberName: 'Jomar Vincent Alcantara',
          type: 'deposit',
          amount: 4000,
          balanceAfter: 24000,
          date: '2026-07-30',
          performedBy: 'Account Officer',
          notes: 'Freelance gig savings deposit',
          isSynced: true
        }
      ]
    }
  ];
}

export function generateInitialSavingsTransactions(): SavingsTransaction[] {
  const accounts = generateInitialSavingsAccounts();
  const txs: SavingsTransaction[] = [];
  accounts.forEach((acc) => {
    if (acc.transactions) {
      txs.push(...acc.transactions);
    }
  });
  return txs;
}

export function generateInitialLoans(): LoanApplication[] {
  // 1. Maria Elena Santos: Salary Loan (₱100,000, 24 months, @15% p.a.)
  const loan1Calc = calculateAmortization(100000, 24, 0.15, new Date('2025-08-15'));
  // Mark 8 periods paid
  loan1Calc.schedule.forEach((item, idx) => {
    if (idx < 8) {
      item.isPaid = true;
      item.paidAt = `202${idx < 5 ? 5 : 6}-${String(((idx + 8) % 12) + 1).padStart(2, '0')}-15`;
      item.paymentRef = `OR-SAL-${1000 + idx}`;
    }
  });

  const loan1: LoanApplication = {
    id: 'loan-001',
    loanNumber: 'LN-SAL-2025-081',
    memberId: 'mem-001',
    memberName: 'Maria Elena Santos',
    loanType: 'salary_loan',
    principalAmount: 100000,
    termMonths: 24,
    annualInterestRate: 0.15,
    monthlyAmortization: loan1Calc.monthlyAmortization,
    totalInterest: loan1Calc.totalInterest,
    serviceFee: loan1Calc.serviceFee,
    applicationFee: loan1Calc.applicationFee,
    guaranteeFee: loan1Calc.guaranteeFee,
    capitalBuildUp: loan1Calc.capitalBuildUp,
    totalDeductions: loan1Calc.totalDeductions,
    loanInsurance: 0,
    netProceeds: loan1Calc.netProceeds,
    status: 'active',
    purpose: 'Home electrical renovation & emergency fund replenishment',
    appliedDate: '2025-08-10',
    approvedDate: '2025-08-14',
    maturityDate: '2027-08-15',
    nextDueDate: '2026-09-15',
    remainingBalance: 65200,
    totalPaid: 38750,
    overdueAmount: 0,
    daysOverdue: 0,
    schedule: loan1Calc.schedule,
    coMakers: ['Engr. Aris Bautista (COOP-2022-0219)'],
    version: 1,
    updatedAt: '2026-08-15T08:30:00.000Z'
  };

  // 2. Danilo Ramos Jr: Productivity Loan (₱120,000, 36 months, @15% p.a. - PAST DUE)
  const loan2Calc = calculateAmortization(120000, 36, 0.15, new Date('2025-01-10'));
  // Paid first 7 months, missed last 3 months
  loan2Calc.schedule.forEach((item, idx) => {
    if (idx < 7) {
      item.isPaid = true;
      item.paidAt = `2025-0${idx + 2}-10`;
      item.paymentRef = `OR-PRD-${2000 + idx}`;
    }
  });

  const loan2: LoanApplication = {
    id: 'loan-002',
    loanNumber: 'LN-PRD-2025-009',
    memberId: 'mem-002',
    memberName: 'Danilo Ramos Jr.',
    loanType: 'productivity_loan',
    principalAmount: 120000,
    termMonths: 36,
    annualInterestRate: 0.15,
    monthlyAmortization: loan2Calc.monthlyAmortization,
    totalInterest: loan2Calc.totalInterest,
    serviceFee: loan2Calc.serviceFee,
    applicationFee: loan2Calc.applicationFee,
    guaranteeFee: loan2Calc.guaranteeFee,
    capitalBuildUp: loan2Calc.capitalBuildUp,
    totalDeductions: loan2Calc.totalDeductions,
    loanInsurance: 0,
    netProceeds: loan2Calc.netProceeds,
    status: 'past_due',
    purpose: 'Poultry farm feeds inventory and solar inverter installation',
    appliedDate: '2025-01-05',
    approvedDate: '2025-01-09',
    maturityDate: '2028-01-10',
    nextDueDate: '2026-07-10',
    remainingBalance: 82400,
    totalPaid: 29120,
    overdueAmount: 16840,
    daysOverdue: 72,
    schedule: loan2Calc.schedule,
    coMakers: ['Lourdes Dela Cruz (COOP-2023-0388)'],
    version: 2,
    updatedAt: '2026-08-15T14:10:00.000Z'
  };

  // 3. Aris Bautista: Productivity Loan (₱180,000, 48 months, @15% p.a. - MAX TERM 4 YRS)
  const loan3Calc = calculateAmortization(180000, 48, 0.15, new Date('2025-11-20'));
  loan3Calc.schedule.forEach((item, idx) => {
    if (idx < 9) {
      item.isPaid = true;
      item.paidAt = `2026-0${idx + 1}-20`;
      item.paymentRef = `OR-PRD-${3000 + idx}`;
    }
  });

  const loan3: LoanApplication = {
    id: 'loan-003',
    loanNumber: 'LN-PRD-2025-142',
    memberId: 'mem-003',
    memberName: 'Engr. Aris Bautista',
    loanType: 'productivity_loan',
    principalAmount: 180000,
    termMonths: 48,
    annualInterestRate: 0.15,
    monthlyAmortization: loan3Calc.monthlyAmortization,
    totalInterest: loan3Calc.totalInterest,
    serviceFee: loan3Calc.serviceFee,
    applicationFee: loan3Calc.applicationFee,
    guaranteeFee: loan3Calc.guaranteeFee,
    capitalBuildUp: loan3Calc.capitalBuildUp,
    totalDeductions: loan3Calc.totalDeductions,
    loanInsurance: 0,
    netProceeds: loan3Calc.netProceeds,
    status: 'active',
    purpose: 'Total Station Survey Equipment and AutoCAD Workstation',
    appliedDate: '2025-11-15',
    approvedDate: '2025-11-19',
    maturityDate: '2029-11-20',
    nextDueDate: '2026-09-20',
    remainingBalance: 120500,
    totalPaid: 45000,
    overdueAmount: 0,
    daysOverdue: 0,
    schedule: loan3Calc.schedule,
    coMakers: ['Dr. Teresa G. Mendoza (COOP-2019-0012)'],
    version: 1,
    updatedAt: '2026-08-12T09:00:00.000Z'
  };

  // 4. Lourdes Dela Cruz: Special Loan (₱50,000, 12 months, @15% p.a. - PAST DUE)
  const loan4Calc = calculateAmortization(50000, 12, 0.15, new Date('2025-10-05'));
  loan4Calc.schedule.forEach((item, idx) => {
    if (idx < 4) {
      item.isPaid = true;
      item.paidAt = `2025-1${idx}-05`;
      item.paymentRef = `OR-SPC-${4000 + idx}`;
    }
  });

  const loan4: LoanApplication = {
    id: 'loan-004',
    loanNumber: 'LN-SPC-2025-055',
    memberId: 'mem-004',
    memberName: 'Lourdes "Lulu" Dela Cruz',
    loanType: 'special_loan',
    principalAmount: 50000,
    termMonths: 12,
    annualInterestRate: 0.15,
    monthlyAmortization: loan4Calc.monthlyAmortization,
    totalInterest: loan4Calc.totalInterest,
    serviceFee: loan4Calc.serviceFee,
    applicationFee: loan4Calc.applicationFee,
    guaranteeFee: loan4Calc.guaranteeFee,
    capitalBuildUp: loan4Calc.capitalBuildUp,
    totalDeductions: loan4Calc.totalDeductions,
    loanInsurance: 0,
    netProceeds: loan4Calc.netProceeds,
    status: 'past_due',
    purpose: 'College enrollment tuition for 2 children (Semester 2)',
    appliedDate: '2025-10-01',
    approvedDate: '2025-10-04',
    maturityDate: '2026-10-05',
    nextDueDate: '2026-06-05',
    remainingBalance: 34200,
    totalPaid: 18040,
    overdueAmount: 9850,
    daysOverdue: 60,
    schedule: loan4Calc.schedule,
    coMakers: ['Danilo Ramos Jr. (COOP-2020-0042)'],
    version: 2,
    updatedAt: '2026-08-18T11:45:00.000Z'
  };

  // 5. Jomar Alcantara: Emergency Loan (₱35,000, 12 months @15% p.a. - UP TO DATE)
  const loan5Calc = calculateAmortization(35000, 12, 0.15, new Date('2026-03-01'));
  loan5Calc.schedule.forEach((item, idx) => {
    if (idx < 5) {
      item.isPaid = true;
      item.paidAt = `2026-0${idx + 3}-01`;
      item.paymentRef = `OR-EMG-${5000 + idx}`;
    }
  });

  const loan5: LoanApplication = {
    id: 'loan-005',
    loanNumber: 'LN-EMG-2026-018',
    memberId: 'mem-006',
    memberName: 'Jomar Vincent Alcantara',
    loanType: 'emergency_loan',
    principalAmount: 35000,
    termMonths: 12,
    annualInterestRate: 0.15,
    monthlyAmortization: loan5Calc.monthlyAmortization,
    totalInterest: loan5Calc.totalInterest,
    serviceFee: loan5Calc.serviceFee,
    applicationFee: loan5Calc.applicationFee,
    guaranteeFee: loan5Calc.guaranteeFee,
    capitalBuildUp: loan5Calc.capitalBuildUp,
    totalDeductions: loan5Calc.totalDeductions,
    loanInsurance: 0,
    netProceeds: loan5Calc.netProceeds,
    status: 'active',
    purpose: 'Urgent motorcycle repair for courier dispatch livelihood',
    appliedDate: '2026-02-26',
    approvedDate: '2026-02-28',
    maturityDate: '2027-03-01',
    nextDueDate: '2026-09-01',
    remainingBalance: 28500,
    totalPaid: 15800,
    overdueAmount: 0,
    daysOverdue: 0,
    schedule: loan5Calc.schedule,
    coMakers: ['Maria Elena Santos (COOP-2021-0104)'],
    version: 1,
    updatedAt: '2026-08-16T15:20:00.000Z'
  };

  return [loan1, loan2, loan3, loan4, loan5];
}

export const INITIAL_TRANSACTIONS: PaymentTransaction[] = [
  {
    id: 'tx-001',
    receiptNumber: 'OR-2026-0881',
    loanId: 'loan-001',
    loanNumber: 'LN-SAL-2025-081',
    memberId: 'mem-001',
    memberName: 'Maria Elena Santos',
    amount: 4843.75,
    principalPaid: 4031.25,
    interestPaid: 812.50,
    penaltyPaid: 0,
    paymentDate: '2026-08-15',
    channel: 'salary_deduction',
    notes: 'August 2026 payroll deduction',
    isSynced: true,
    version: 1,
    updatedAt: '2026-08-15T08:30:00.000Z'
  },
  {
    id: 'tx-002',
    receiptNumber: 'OR-2026-0792',
    loanId: 'loan-003',
    loanNumber: 'LN-PRD-2025-142',
    memberId: 'mem-003',
    memberName: 'Engr. Aris Bautista',
    amount: 5000.00,
    principalPaid: 3750.00,
    interestPaid: 1250.00,
    penaltyPaid: 0,
    paymentDate: '2026-08-12',
    channel: 'bank_transfer',
    notes: 'Online bills payment remittance',
    isSynced: true,
    version: 1,
    updatedAt: '2026-08-12T09:00:00.000Z'
  },
  {
    id: 'tx-003',
    receiptNumber: 'OR-2026-0805',
    loanId: 'loan-005',
    loanNumber: 'LN-EMG-2026-018',
    memberId: 'mem-006',
    memberName: 'Jomar Vincent Alcantara',
    amount: 3150.00,
    principalPaid: 2712.50,
    interestPaid: 437.50,
    penaltyPaid: 0,
    paymentDate: '2026-08-01',
    channel: 'cash_teller',
    notes: 'Branch OTC Cash payment',
    isSynced: true,
    version: 1,
    updatedAt: '2026-08-01T14:15:00.000Z'
  }
];
