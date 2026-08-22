import { useState } from 'react';
import { 
  User, 
  CreditCard, 
  PieChart, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  ArrowUpRight, 
  Receipt, 
  Download, 
  Building,
  Phone,
  Mail,
  Shield,
  Heart,
  HeartHandshake,
  Check,
  FileText,
  Clock,
  Sparkles,
  PiggyBank,
  TrendingUp,
  ShieldAlert,
  Coins,
  Info,
  RotateCcw
} from 'lucide-react';
import { Member, LoanApplication, PaymentTransaction, SavingsAccount, SavingsTransaction, LoanType } from '../types';
import { formatCurrency, LOAN_PRODUCTS } from '../services/loanService';
import { calculateSavingsInterest, checkDormancyStatus, generateSavingsAccountForMember, SAVINGS_CONFIG } from '../services/savingsService';

interface MemberPortalViewProps {
  member: Member;
  loans: LoanApplication[];
  transactions: PaymentTransaction[];
  savingsAccounts?: SavingsAccount[];
  savingsTransactions?: SavingsTransaction[];
  onOpenLoanApply: (defaultType?: LoanType, overdueLoanId?: string) => void;
  onOpenPaymentModal: (loan?: LoanApplication) => void;
  onViewLoanSchedule: (loan: LoanApplication) => void;
  onPayAidProgram?: (member: Member, programType: 'hap' | 'map') => void;
}

export function MemberPortalView({
  member,
  loans,
  transactions,
  savingsAccounts = [],
  savingsTransactions = [],
  onOpenLoanApply,
  onOpenPaymentModal,
  onViewLoanSchedule,
  onPayAidProgram
}: MemberPortalViewProps) {
  const memberLoans = loans.filter((l) => l.memberId === member.id);
  const memberTransactions = transactions.filter((t) => t.memberId === member.id);
  const isPastDue = member.status === 'past_due' || member.pastDueAmount > 0;

  const isHap = member.isHapMember || (member.hapInfo && member.hapInfo.isPaid);
  const isMap = member.isMapMember || (member.mapInfo && member.mapInfo.isPaid);

  // Retrieve or generate member's savings account
  const memberSavingsAccount: SavingsAccount = savingsAccounts.find(s => s.memberId === member.id) || 
    member.savingsAccount || 
    generateSavingsAccountForMember(member, member.savingsDeposit || 2000).account;

  const memberSavingsTx = savingsTransactions.filter(t => t.savingsAccountId === memberSavingsAccount.id);
  const dormancyStatus = checkDormancyStatus(memberSavingsAccount.lastTransactionDate);
  const isDormant = dormancyStatus.isDormant || memberSavingsAccount.isDormant || memberSavingsAccount.status === 'dormant';
  const interestCalc = calculateSavingsInterest(memberSavingsAccount.balance, 12);
  const monthlyInterest = calculateSavingsInterest(memberSavingsAccount.balance, 1).projectedInterestForMonths;
  const isOverCapped = memberSavingsAccount.balance > SAVINGS_CONFIG.maxInterestEarningBalance;

  return (
    <div className="space-y-6">
      {/* Member Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-bold text-xl flex items-center justify-center shadow-md shrink-0">
              {member.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {member.fullName}
                </h2>
                {isPastDue ? (
                  <span className="text-xs font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Past Due Account
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Good Standing
                  </span>
                )}

                {/* HAP & MAP Member Indicators in Header */}
                {isHap ? (
                  <span className="text-xs font-bold text-teal-900 bg-teal-100 border border-teal-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Heart className="w-3.5 h-3.5 text-teal-600 fill-teal-600" />
                    HAP Member
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-slate-400" />
                    HAP Unpaid
                  </span>
                )}

                {isMap ? (
                  <span className="text-xs font-bold text-indigo-900 bg-indigo-100 border border-indigo-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                    <Shield className="w-3.5 h-3.5 text-indigo-600 fill-indigo-200" />
                    MAP Member
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    MAP Unpaid
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-1">
                Member ID: {member.memberNumber} • Joined: {member.joinDate}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {member.employerOrBusiness} • TIN: {member.tinNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-portal-apply-loan"
              onClick={onOpenLoanApply}
              disabled={isPastDue}
              className={`text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 ${
                isPastDue
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
              title={isPastDue ? 'Settle past due balance first before applying' : 'Apply for cooperative loan'}
            >
              <FileText className="w-4 h-4" />
              <span>Apply for Loan (15% p.a.)</span>
            </button>
            <button
              id="btn-portal-pay"
              onClick={() => onOpenPaymentModal(memberLoans[0])}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5"
            >
              <Receipt className="w-4 h-4" />
              <span>Pay Amortization</span>
            </button>
          </div>
        </div>

        {/* Past Due Alert Warning */}
        {isPastDue && (
          <div className="mt-5 bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-rose-900">
                  You have an Overdue Amortization of {formatCurrency(member.pastDueAmount)}
                </h3>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Please make a payment as soon as possible to maintain Good Standing and restore borrowing eligibility.
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenPaymentModal(memberLoans.find((l) => l.status === 'past_due'))}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shrink-0"
            >
              Settle Overdue Now
            </button>
          </div>
        )}

        {/* Inactive / Dormancy Alert Notice */}
        {isDormant && (
          <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-4 text-amber-950">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>Savings Account Notice: Inactive / Dormant (&gt; 2 Years)</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-full font-mono">
                    {dormancyStatus.daysInactive} days inactive
                  </span>
                </h3>
                <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                  No transaction has been made on your cooperative savings account (<strong>{memberSavingsAccount.accountNumber}</strong>) since <strong>{memberSavingsAccount.lastTransactionDate}</strong>.
                  Under cooperative policy, accounts inactive for 2 continuous years (730 days) are charged a service fee by an Account Officer. Visit the cooperative office to perform a deposit or transaction.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cooperative Aid Programs (HAP & MAP) Showcase Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cooperative Aid Programs (HAP & MAP)
              </h2>
              <p className="text-xs text-slate-500">
                Health Aid Program (HAP) and Mutual Aid Program (MAP) protection and welfare benefits.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Annual membership renewals valid for 12 months
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Health Aid Program (HAP) Card */}
          <div className={`p-4 rounded-xl border transition ${
            isHap 
              ? 'bg-teal-50/70 border-teal-300' 
              : 'bg-slate-50/50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isHap ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Heart className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Health Aid Program (HAP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Hospitalization & Emergency Medical Aid
                  </p>
                </div>
              </div>
              {isHap ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-900 bg-teal-200 px-2.5 py-0.5 rounded-full border border-teal-300">
                  <Check className="w-3.5 h-3.5" />
                  ACTIVE HAP MEMBER
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  UNPAID / INACTIVE
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Benefit Coverage:</span>
                <span className="font-bold text-slate-900">₱10,000 Hospitalization Assistance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Program Fee:</span>
                <span className="font-mono font-bold text-slate-800">₱1,000.00 / year</span>
              </div>
              {isHap && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Date & Receipt:</span>
                    <span className="font-mono text-slate-700">{member.hapInfo?.paidDate || '2026-01-15'} ({member.hapInfo?.receiptNo || 'OR-HAP-OK'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Through:</span>
                    <span className="text-emerald-700 font-semibold">{member.hapInfo?.validUntil || '2027-01-15'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                {isHap ? 'Eligible for hospital reimbursement' : 'Pay annual fee to unlock benefits'}
              </span>
              {onPayAidProgram && !isHap && (
                <button
                  onClick={() => onPayAidProgram(member, 'hap')}
                  className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pay HAP Fee (₱1,200)</span>
                </button>
              )}
            </div>
          </div>

          {/* Mutual Aid Program (MAP) Card */}
          <div className={`p-4 rounded-xl border transition ${
            isMap 
              ? 'bg-indigo-50/70 border-indigo-300' 
              : 'bg-slate-50/50 border-slate-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isMap ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <Shield className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Mutual Aid Program (MAP)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mutual Life & Damayan Family Protection
                  </p>
                </div>
              </div>
              {isMap ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-900 bg-indigo-200 px-2.5 py-0.5 rounded-full border border-indigo-300">
                  <Check className="w-3.5 h-3.5" />
                  ACTIVE MAP MEMBER
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  UNPAID / INACTIVE
                </span>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Benefit Coverage:</span>
                <span className="font-bold text-slate-900">₱100,000 Life & Damayan Assistance</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Annual Program Fee:</span>
                <span className="font-mono font-bold text-slate-800">₱1,500.00 / year</span>
              </div>
              {isMap && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Date & Receipt:</span>
                    <span className="font-mono text-slate-700">{member.mapInfo?.paidDate || '2026-01-15'} ({member.mapInfo?.receiptNo || 'OR-MAP-OK'})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Valid Through:</span>
                    <span className="text-emerald-700 font-semibold">{member.mapInfo?.validUntil || '2027-01-15'}</span>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 pt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">
                {isMap ? 'Beneficiaries fully protected' : 'Pay annual fee to unlock benefits'}
              </span>
              {onPayAidProgram && !isMap && (
                <button
                  onClick={() => onPayAidProgram(member, 'map')}
                  className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Pay MAP Fee (₱1,500)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balances Grid: Share Capital, Savings, Total Active Loan Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Share Capital */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Share Capital Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(member.shareCapital)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">
            Earns annual patronage dividends & interest
          </div>
        </div>

        {/* Savings Deposit */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Savings Account
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(memberSavingsAccount.balance)}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
              isDormant ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isDormant ? 'Dormant (>2y)' : '3% p.a.'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex justify-between font-mono">
            <span>{memberSavingsAccount.accountNumber}</span>
            <span className="text-emerald-700 font-medium">+{formatCurrency(interestCalc.estimatedAnnualInterest)}/yr est.</span>
          </div>
        </div>

        {/* Total Outstanding Loan Balance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Loan Balance
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {formatCurrency(member.totalLoanBalance)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Across {memberLoans.length} active credit line{memberLoans.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Member Savings Account & Passbook Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Cooperative Savings Account ({memberSavingsAccount.accountNumber})
              </h2>
              <p className="text-xs text-slate-500">
                Auto-provisioned membership savings • 3.0% annual interest on balances up to ₱300,000.00
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isDormant ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {isDormant ? 'Status: Inactive / Dormant (> 2y)' : 'Status: Active Account'}
            </span>
          </div>
        </div>

        {/* Savings Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Interest-Bearing Balance (3.0% p.a.)</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {formatCurrency(memberSavingsAccount.earningBalance)}
            </div>
            <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
              Capped at max ₱300,000.00
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium">Non-Interest Balance (Exceeding ₱300k)</span>
            <div className="text-lg font-bold text-slate-900 font-mono mt-1">
              {formatCurrency(memberSavingsAccount.nonEarningBalance)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {isOverCapped ? 'Excess earns 0% interest' : 'No excess funds above cap'}
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-900 font-medium">Projected Annual Interest (3.0%)</span>
            <div className="text-lg font-bold text-emerald-800 font-mono mt-1">
              +{formatCurrency(interestCalc.estimatedAnnualInterest)}
            </div>
            <div className="text-[10px] text-emerald-700 mt-0.5 font-mono">
              ~{formatCurrency(monthlyInterest)} / month
            </div>
          </div>
        </div>

        {/* Savings Ledger Table */}
        <div className="pt-2">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
            Savings Passbook History ({memberSavingsTx.length})
          </h3>
          {memberSavingsTx.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-lg">
              No transactions recorded on this savings passbook yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Receipt / Ref</th>
                    <th className="py-2 px-3">Type</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                    <th className="py-2 px-3 text-right">Balance</th>
                    <th className="py-2 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {memberSavingsTx.map(tx => {
                    const isPlus = tx.type === 'deposit' || tx.type === 'interest_credited' || tx.type === 'account_opening';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">{tx.date}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 font-semibold">{tx.receiptOrRef}</td>
                        <td className="py-2 px-3">
                          {tx.type === 'interest_credited' && <span className="text-teal-700 font-bold">3% Interest</span>}
                          {tx.type === 'dormancy_fee' && <span className="text-rose-700 font-bold">Dormancy Fee</span>}
                          {tx.type === 'deposit' && <span className="text-emerald-700 font-bold">Deposit</span>}
                          {tx.type === 'withdrawal' && <span className="text-amber-700 font-bold">Withdrawal</span>}
                          {tx.type === 'account_opening' && <span className="text-blue-700 font-bold">Opening</span>}
                        </td>
                        <td className={`py-2 px-3 text-right font-mono font-bold ${isPlus ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isPlus ? '+' : '-'}{formatCurrency(tx.amount)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(tx.balanceAfter)}
                        </td>
                        <td className="py-2 px-3 text-slate-500 max-w-xs truncate">{tx.notes || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Active Member Loans List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Active Cooperative Loans
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Diminishing balance amortization schedules with 15% annual interest.
            </p>
          </div>
        </div>

        {memberLoans.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600 font-medium">
              You currently have no active loans with the cooperative.
            </p>
            <button
              onClick={onOpenLoanApply}
              className="mt-3 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
            >
              Apply for a Loan Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {memberLoans.map((loan) => {
              const config = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;
              const percentPaid = Math.min(100, Math.round((loan.totalPaid / Math.max(1, loan.principalAmount)) * 100));

              return (
                <div
                  key={loan.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {config.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${config.badgeColor}`}>
                          15% p.a. • {loan.termMonths} Mos
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {loan.loanNumber} • Purpose: {loan.purpose}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {loan.status === 'past_due' && (
                        <button
                          onClick={() => onOpenLoanApply('restructuring_loan', loan.id)}
                          className="text-xs font-bold bg-purple-700 hover:bg-purple-800 text-white px-3 py-1.5 rounded-lg transition flex items-center gap-1 shadow-2xs"
                          title="Apply for a new loan to pay off overdue principal"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Restructure Overdue Loan</span>
                        </button>
                      )}
                      <button
                        onClick={() => onViewLoanSchedule(loan)}
                        className="text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg transition"
                      >
                        Schedule
                      </button>
                      <button
                        onClick={() => onOpenPaymentModal(loan)}
                        className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition"
                      >
                        Pay Amortization
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                      <span>Repayment Progress ({percentPaid}%)</span>
                      <span>
                        Paid: <strong className="text-emerald-700">{formatCurrency(loan.totalPaid)}</strong> / Balance: <strong className="text-slate-900">{formatCurrency(loan.remainingBalance)}</strong>
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentPaid}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/80 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Monthly Amortization:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCurrency(loan.monthlyAmortization)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Next Due Date:</span>
                      <span className="font-bold text-slate-900">{loan.nextDueDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Maturity Date:</span>
                      <span className="font-bold text-slate-900">{loan.maturityDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Status:</span>
                      {loan.status === 'past_due' ? (
                        <span className="font-bold text-rose-600">{loan.daysOverdue} Days Overdue</span>
                      ) : (
                        <span className="font-bold text-emerald-700">Good Standing</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Receipts History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          Payment Transactions & Vouchers
        </h2>
        {memberTransactions.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No transaction records found for this member yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Receipt No.</th>
                  <th className="py-2.5 px-3">Loan Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-center">Sync Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{tx.receiptNumber}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{tx.loanNumber}</td>
                    <td className="py-2.5 px-3 text-slate-600">{tx.paymentDate}</td>
                    <td className="py-2.5 px-3 capitalize text-slate-600">{tx.channel.replace('_', ' ')}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 font-mono">
                      +{formatCurrency(tx.amount)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        Synced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
