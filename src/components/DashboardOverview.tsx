import { 
  Users, 
  AlertCircle, 
  Banknote, 
  PieChart, 
  ShieldCheck, 
  ArrowUpRight, 
  Clock, 
  FileText, 
  CheckCircle2, 
  TrendingUp,
  Percent,
  Layers,
  ChevronRight,
  Heart,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { Member, LoanApplication, PaymentTransaction } from '../types';
import { formatCurrency, LOAN_PRODUCTS } from '../services/loanService';
import { BeccLogo } from './BeccLogo';

interface DashboardOverviewProps {
  members: Member[];
  loans: LoanApplication[];
  transactions: PaymentTransaction[];
  pendingQueueCount: number;
  lastSyncTime: string | null;
  onNavigateTab: (tab: string) => void;
  onOpenLoanApply: () => void;
  onOpenPaymentModal: () => void;
  onOpenVault: () => void;
}

export function DashboardOverview({
  members,
  loans,
  transactions,
  pendingQueueCount,
  lastSyncTime,
  onNavigateTab,
  onOpenLoanApply,
  onOpenPaymentModal,
  onOpenVault
}: DashboardOverviewProps) {
  // Aggregate Metrics
  const activeMembers = members.filter((m) => m.status === 'active' || m.status === 'good_standing');
  const pastDueMembers = members.filter((m) => m.status === 'past_due');
  const hapMembers = members.filter((m) => m.isHapMember || (m.hapInfo && m.hapInfo.isPaid));
  const mapMembers = members.filter((m) => m.isMapMember || (m.mapInfo && m.mapInfo.isPaid));
  const dualAidMembers = members.filter((m) => (m.isHapMember || m.hapInfo?.isPaid) && (m.isMapMember || m.mapInfo?.isPaid));

  const totalShareCapital = members.reduce((sum, m) => sum + (m.shareCapital || 0), 0);
  const totalSavings = members.reduce((sum, m) => sum + (m.savingsDeposit || 0), 0);

  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'past_due');
  const totalLoanPortfolio = activeLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const totalPastDueAmount = activeLoans
    .filter((l) => l.status === 'past_due')
    .reduce((sum, l) => sum + (l.overdueAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* BECC Cooperative Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-emerald-700/40 relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-4">
          <BeccLogo className="w-56 h-56" />
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm p-1 border border-white/20 shadow-inner shrink-0">
            <BeccLogo className="w-full h-full" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Batanes Educators Credit Cooperative (BECC)
              </h1>
              <span className="text-[10px] bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-semibold px-2 py-0.5 rounded-full uppercase">
                CDA Reg. No. 9520-02001428
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl">
              Basco, Batanes • Fostering educator empowerment, financial stability, 3% p.a. savings, and cooperative credit since 1982.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 relative z-10 text-xs">
          <button
            onClick={onOpenLoanApply}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Process Loan</span>
          </button>
          <button
            onClick={onOpenPaymentModal}
            className="bg-white/10 hover:bg-white/20 text-white font-semibold px-3.5 py-2 rounded-xl transition border border-white/20 flex items-center gap-1.5"
          >
            <Banknote className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Top Banner Alert if Past Due accounts exist or offline sync pending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pastDueMembers.length > 0 && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-rose-900">
                  Attention: {pastDueMembers.length} Past Due Accounts
                </h2>
                <span className="text-xs font-semibold text-rose-700">
                  {formatCurrency(totalPastDueAmount)} Overdue
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-1">
                Delinquent cooperative members requiring collection notices or loan restructuring.
              </p>
              <button
                id="btn-view-past-due"
                onClick={() => onNavigateTab('members')}
                className="mt-2 text-xs font-semibold text-rose-800 hover:text-rose-950 flex items-center gap-1"
              >
                <span>Review Past Due Accounts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 shadow-xs">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-emerald-900">
                Encrypted Offline Vault Active
              </h2>
              <span className="text-xs font-semibold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                AES-GCM 256
              </span>
            </div>
            <p className="text-xs text-emerald-700 mt-1">
              {pendingQueueCount > 0
                ? `${pendingQueueCount} offline transactions locally encrypted, awaiting internet sync.`
                : 'All local cooperative records are encrypted and synchronized.'}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                id="btn-dash-sync"
                onClick={() => onNavigateTab('sync')}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Open Sync & Conflict Center</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-dash-vault"
                onClick={onOpenVault}
                className="text-xs text-slate-600 hover:text-slate-900 underline"
              >
                Vault Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Members
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{activeMembers.length}</span>
            <span className="text-xs text-slate-500">of {members.length} registered</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{Math.round((activeMembers.length / Math.max(1, members.length)) * 100)}% Good Standing</span>
          </div>
        </div>

        {/* Past Due Accounts */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Past Due Accounts
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{pastDueMembers.length}</span>
            <span className="text-xs text-rose-600 font-medium">
              ({formatCurrency(totalPastDueAmount)})
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Overdue amortization receivables
          </div>
        </div>

        {/* Total Loan Portfolio */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Active Loan Portfolio
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatCurrency(totalLoanPortfolio)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-700 font-medium">
            <Percent className="w-3.5 h-3.5" />
            <span>15% p.a. Standard Interest Rate</span>
          </div>
        </div>

        {/* Total Capital & Savings */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Total Share Capital
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xl sm:text-2xl font-bold text-slate-900">
              {formatCurrency(totalShareCapital)}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Savings: {formatCurrency(totalSavings)}
          </div>
        </div>
      </div>

      {/* Welfare Aid Program Status Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Cooperative Welfare Program Enrollment</span>
              <span className="text-[10px] bg-teal-500/30 text-teal-300 px-2 py-0.5 rounded-full font-mono">
                {dualAidMembers.length} Dual Protected
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              HAP (Health Aid @ ₱1,200/yr) & MAP (Mutual Aid @ ₱1,500/yr) active coverage tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div 
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-2 bg-slate-800/80 border border-teal-500/40 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700 transition"
          >
            <Heart className="w-3.5 h-3.5 text-teal-400 fill-teal-400" />
            <span className="text-xs font-bold text-white">{hapMembers.length} HAP Members</span>
            <span className="text-[10px] text-teal-300">({Math.round((hapMembers.length / Math.max(1, members.length)) * 100)}%)</span>
          </div>

          <div 
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-2 bg-slate-800/80 border border-indigo-500/40 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700 transition"
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400" />
            <span className="text-xs font-bold text-white">{mapMembers.length} MAP Members</span>
            <span className="text-[10px] text-indigo-300">({Math.round((mapMembers.length / Math.max(1, members.length)) * 100)}%)</span>
          </div>

          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs font-semibold text-teal-300 hover:text-white flex items-center gap-1"
          >
            <span>Filter Members</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Cooperative Loan Services Showcase (Salary, Emergency, Special, Productivity) */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Cooperative Loan Services & Policy Terms
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Maximum Loanable Amount: <strong>₱200,000.00</strong> • Maximum Term: <strong>4 Years (48 Months)</strong> • Interest: <strong>15% per annum</strong>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-dash-apply-loan"
              onClick={onOpenLoanApply}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Apply for Loan (Offline OK)</span>
            </button>
            <button
              id="btn-dash-record-payment"
              onClick={onOpenPaymentModal}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-lg transition shadow-xs flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Record Repayment</span>
            </button>
          </div>
        </div>

        {/* 4 Loan Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* 1. Salary Loan */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-emerald-500/60 transition bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                15% p.a.
              </span>
              <span className="text-xs text-slate-500 font-medium">Up to 4 Yrs</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              {LOAN_PRODUCTS.salary_loan.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {LOAN_PRODUCTS.salary_loan.description}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Max Ceiling:</span>
                <span className="font-semibold text-slate-900">₱200,000</span>
              </div>
              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span className="font-semibold text-slate-900">48 Months</span>
              </div>
            </div>
          </div>

          {/* 2. Emergency Loan */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-rose-500/60 transition bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                15% p.a.
              </span>
              <span className="text-xs text-slate-500 font-medium">Max 1 Year</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              {LOAN_PRODUCTS.emergency_loan.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {LOAN_PRODUCTS.emergency_loan.description}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Max Ceiling:</span>
                <span className="font-semibold text-slate-900">₱200,000</span>
              </div>
              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span className="font-semibold text-slate-900">12 Months (1 Yr)</span>
              </div>
            </div>
          </div>

          {/* 3. Special Loan */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-amber-500/60 transition bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                15% p.a.
              </span>
              <span className="text-xs text-slate-500 font-medium">Max 1 Year</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              {LOAN_PRODUCTS.special_loan.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {LOAN_PRODUCTS.special_loan.description}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Max Ceiling:</span>
                <span className="font-semibold text-slate-900">₱200,000</span>
              </div>
              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span className="font-semibold text-slate-900">12 Months (1 Yr)</span>
              </div>
            </div>
          </div>

          {/* 4. Productivity Loan */}
          <div className="border border-slate-200 rounded-xl p-4 hover:border-blue-500/60 transition bg-slate-50/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                15% p.a.
              </span>
              <span className="text-xs text-slate-500 font-medium">Up to 4 Yrs</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mt-2">
              {LOAN_PRODUCTS.productivity_loan.name}
            </h3>
            <p className="text-xs text-slate-600 mt-1 line-clamp-2">
              {LOAN_PRODUCTS.productivity_loan.description}
            </p>
            <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Max Ceiling:</span>
                <span className="font-semibold text-slate-900">₱200,000</span>
              </div>
              <div className="flex justify-between">
                <span>Max Duration:</span>
                <span className="font-semibold text-slate-900">48 Months (4 Yrs)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Active Loans & Recent Offline / Synced Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Cooperative Loans */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Active Loans Status
            </h2>
            <button
              id="btn-dash-all-loans"
              onClick={() => onNavigateTab('loans')}
              className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
            >
              <span>View All ({loans.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {loans.slice(0, 4).map((loan) => {
              const config = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;
              return (
                <div
                  key={loan.id}
                  className="p-3.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {loan.memberName}
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${config.badgeColor}`}>
                        {config.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                      <span>{loan.loanNumber}</span>
                      <span>•</span>
                      <span>Next Due: {loan.nextDueDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {formatCurrency(loan.remainingBalance)}
                    </div>
                    {loan.status === 'past_due' ? (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        {loan.daysOverdue}d Past Due
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Active (15% p.a.)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Payment Transactions & Vouchers */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Recent Repayments & Vouchers
            </h2>
            <span className="text-xs text-slate-500">
              {transactions.length} Total Records
            </span>
          </div>

          <div className="space-y-3">
            {transactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="p-3.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {tx.memberName}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                      {tx.receiptNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-3">
                    <span>{tx.paymentDate}</span>
                    <span>•</span>
                    <span className="capitalize">{tx.channel.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-700">
                    +{formatCurrency(tx.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Principal: {formatCurrency(tx.principalPaid)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

