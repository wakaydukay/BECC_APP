import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, 
  TrendingUp, 
  AlertTriangle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  Coins, 
  Search, 
  Filter, 
  CheckCircle2, 
  Calculator, 
  DollarSign, 
  ShieldAlert, 
  Info, 
  Calendar, 
  FileText,
  User,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { Member, SavingsAccount, SavingsTransaction } from '../types';
import { 
  SAVINGS_CONFIG, 
  calculateSavingsInterest, 
  checkDormancyStatus, 
  depositToSavings, 
  withdrawFromSavings, 
  creditSavingsInterest, 
  chargeDormancyServiceFee 
} from '../services/savingsService';
import { formatCurrency } from '../services/loanService';

interface SavingsManagementViewProps {
  savingsAccounts: SavingsAccount[];
  savingsTransactions: SavingsTransaction[];
  members: Member[];
  onUpdateAccount: (updatedAccount: SavingsAccount, newTx?: SavingsTransaction) => void;
  onSelectMember: (member: Member) => void;
}

export function SavingsManagementView({
  savingsAccounts,
  savingsTransactions,
  members,
  onUpdateAccount,
  onSelectMember
}: SavingsManagementViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'dormant' | 'capped'>('all');
  
  // Selected Account for Modal Action
  const [activeActionModal, setActiveActionModal] = useState<{
    type: 'deposit' | 'withdraw' | 'credit_interest' | 'charge_dormancy' | 'history';
    account: SavingsAccount;
  } | null>(null);

  // Form States for Modals
  const [amountInput, setAmountInput] = useState<number>(1000);
  const [feeInput, setFeeInput] = useState<number>(100);
  const [officerNameInput, setOfficerNameInput] = useState<string>('Account Officer');
  const [notesInput, setNotesInput] = useState<string>('');
  const [interestMonthsInput, setInterestMonthsInput] = useState<number>(1);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Live Savings Calculator State
  const [calcDeposit, setCalcDeposit] = useState<number>(350000);
  const [calcMonths, setCalcMonths] = useState<number>(12);

  const liveCalc = useMemo(() => {
    return calculateSavingsInterest(calcDeposit, calcMonths);
  }, [calcDeposit, calcMonths]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let totalSavings = 0;
    let totalEarningSavings = 0;
    let totalNonEarningSavings = 0;
    let dormantCount = 0;
    let cappedCount = 0;

    savingsAccounts.forEach((acc) => {
      totalSavings += acc.balance;
      const earning = Math.min(acc.balance, SAVINGS_CONFIG.maxInterestEarningBalance);
      totalEarningSavings += earning;
      totalNonEarningSavings += Math.max(0, acc.balance - SAVINGS_CONFIG.maxInterestEarningBalance);

      const dormancy = checkDormancyStatus(acc.lastTransactionDate);
      if (dormancy.isDormant || acc.isDormant || acc.status === 'dormant') {
        dormantCount++;
      }
      if (acc.balance > SAVINGS_CONFIG.maxInterestEarningBalance) {
        cappedCount++;
      }
    });

    const estAnnualCoopInterest = totalEarningSavings * SAVINGS_CONFIG.annualInterestRate;

    return {
      totalAccounts: savingsAccounts.length,
      totalSavings,
      totalEarningSavings,
      totalNonEarningSavings,
      estAnnualCoopInterest,
      dormantCount,
      cappedCount
    };
  }, [savingsAccounts]);

  // Filtered Accounts List
  const filteredAccounts = useMemo(() => {
    return savingsAccounts.filter((acc) => {
      const member = members.find((m) => m.id === acc.memberId);
      const matchesSearch = 
        acc.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member && member.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      const dormancy = checkDormancyStatus(acc.lastTransactionDate);
      const isAccDormant = dormancy.isDormant || acc.isDormant || acc.status === 'dormant';
      const isAccCapped = acc.balance > SAVINGS_CONFIG.maxInterestEarningBalance;

      if (statusFilter === 'dormant') return isAccDormant;
      if (statusFilter === 'capped') return isAccCapped;
      if (statusFilter === 'active') return !isAccDormant;

      return true;
    });
  }, [savingsAccounts, members, searchTerm, statusFilter]);

  const handleOpenAction = (account: SavingsAccount, type: 'deposit' | 'withdraw' | 'credit_interest' | 'charge_dormancy' | 'history') => {
    setActiveActionModal({ type, account });
    setActionSuccessMessage(null);
    setActionErrorMessage(null);
    if (type === 'deposit') {
      setAmountInput(2000);
      setNotesInput('Over-the-counter savings deposit');
    } else if (type === 'withdraw') {
      setAmountInput(Math.min(5000, account.balance));
      setNotesInput('OTC savings withdrawal');
    } else if (type === 'credit_interest') {
      setInterestMonthsInput(1);
    } else if (type === 'charge_dormancy') {
      setFeeInput(SAVINGS_CONFIG.standardDormancyServiceFee);
      setNotesInput(`Periodic dormancy service fee charged due to account inactivity > 2 years (Last Tx: ${account.lastTransactionDate})`);
    }
  };

  const handleExecuteAction = () => {
    if (!activeActionModal) return;
    const { type, account } = activeActionModal;
    setActionErrorMessage(null);

    try {
      if (type === 'deposit') {
        if (amountInput <= 0) {
          setActionErrorMessage('Deposit amount must be greater than 0.');
          return;
        }
        const { updatedAccount, transaction } = depositToSavings(account, amountInput, officerNameInput, notesInput);
        onUpdateAccount(updatedAccount, transaction);
        setActionSuccessMessage(`Successfully deposited ₱${amountInput.toLocaleString()} to ${account.accountNumber}! Ref: ${transaction.receiptOrRef}`);
      } else if (type === 'withdraw') {
        if (amountInput <= 0) {
          setActionErrorMessage('Withdrawal amount must be greater than 0.');
          return;
        }
        const { updatedAccount, transaction } = withdrawFromSavings(account, amountInput, officerNameInput, notesInput);
        onUpdateAccount(updatedAccount, transaction);
        setActionSuccessMessage(`Successfully withdrew ₱${amountInput.toLocaleString()} from ${account.accountNumber}! Ref: ${transaction.receiptOrRef}`);
      } else if (type === 'credit_interest') {
        const { updatedAccount, transaction, interestAmount } = creditSavingsInterest(account, interestMonthsInput, officerNameInput);
        onUpdateAccount(updatedAccount, transaction);
        setActionSuccessMessage(`Credited ₱${interestAmount.toLocaleString()} interest (3% p.a., ${interestMonthsInput} mo.) to ${account.accountNumber}!`);
      } else if (type === 'charge_dormancy') {
        if (feeInput <= 0) {
          setActionErrorMessage('Fee amount must be greater than 0.');
          return;
        }
        const { updatedAccount, transaction } = chargeDormancyServiceFee(account, feeInput, officerNameInput, notesInput);
        onUpdateAccount(updatedAccount, transaction);
        setActionSuccessMessage(`Dormancy service fee of ₱${feeInput.toLocaleString()} charged by ${officerNameInput}. Ref: ${transaction.receiptOrRef}`);
      }
    } catch (err: any) {
      setActionErrorMessage(err.message || 'Operation failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy and Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-emerald-800/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                Official Cooperative Savings Policy
              </span>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/40">
                3.0% Per Annum • ₱300k Cap
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Automated Member Savings Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every cooperative member automatically receives a dedicated savings account upon membership approval. 
              Savings earn <strong className="text-emerald-300 font-semibold">3.0% interest per annum</strong> up to a <strong className="text-emerald-300 font-semibold">maximum cap of ₱300,000.00</strong>. 
              All amounts exceeding ₱300,000 earn 0% interest. Accounts with no transaction for <strong className="text-amber-300 font-semibold">2 years</strong> are flagged with dormancy alerts and charged a service fee by the Account Officer.
            </p>
          </div>

          <div className="bg-slate-800/80 backdrop-blur-xs p-4 rounded-xl border border-slate-700/80 shrink-0 lg:w-72 space-y-2 text-xs">
            <div className="font-bold text-slate-200 flex items-center gap-1.5 border-b border-slate-700 pb-2">
              <PiggyBank className="w-4 h-4 text-emerald-400" />
              <span>Savings Rules Summary</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Interest Rate:</span>
              <span className="font-bold text-emerald-400 font-mono">3.0% p.a.</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Interest-Earning Cap:</span>
              <span className="font-bold text-white font-mono">₱300,000.00</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Excess (&gt; ₱300k):</span>
              <span className="font-bold text-amber-400 font-mono">0% (No interest)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Dormancy Threshold:</span>
              <span className="font-bold text-rose-400 font-mono">2 Years (730 days)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Dormancy Service Fee:</span>
              <span className="font-bold text-amber-300 font-mono">₱100.00 / charge</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global Inactivity / Dormancy Alert Banner if any dormant accounts exist */}
      {metrics.dormantCount > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-xl p-4 flex items-start justify-between gap-4 text-amber-950">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                ⚠️ Dormancy Action Required: {metrics.dormantCount} Account{metrics.dormantCount > 1 ? 's' : ''} Inactive for Over 2 Years
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                The cooperative system identified accounts with zero financial activity for 24+ months (730 days). 
                Account Officers must review these dormant accounts and charge the required periodic dormancy service fee.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusFilter('dormant')}
            className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1.5"
          >
            <span>View Dormant Accounts</span>
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Member Savings</span>
            <PiggyBank className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-2">
            {formatCurrency(metrics.totalSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{metrics.totalAccounts} Active Accounts</span>
            <span className="font-semibold text-emerald-700">100% Guaranteed</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Earning Balance (3% p.a.)</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-bold font-mono text-teal-800 mt-2">
            {formatCurrency(metrics.totalEarningSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Subject to 3% interest</span>
            <span className="font-semibold text-teal-700 font-mono">~{formatCurrency(metrics.estAnnualCoopInterest)}/yr</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Excess Non-Earning Balance</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-800 mt-2">
            {formatCurrency(metrics.totalNonEarningSavings)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>{metrics.cappedCount} account(s) &gt; ₱300k</span>
            <span className="font-semibold text-amber-700">0% above cap</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Dormancy Status (&gt; 2 Yrs)</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-800 mt-2">
            {metrics.dormantCount} Account{metrics.dormantCount !== 1 ? 's' : ''}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Inactive &gt; 730 days</span>
            {metrics.dormantCount > 0 ? (
              <span className="font-bold text-rose-600 animate-pulse">Fee Action Required</span>
            ) : (
              <span className="font-semibold text-emerald-600">All Active</span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Interactive 3% Calculator + Savings Directory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left / Top: Interactive 3% p.a. & ₱300,000 Cap Calculator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Interactive Savings & 3% Interest Calculator
                </h3>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-mono">
                3% p.a.
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Test how cooperative interest is calculated under the strict ₱300,000 interest-earning cap.
            </p>

            {/* Slider 1: Deposit Amount */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Savings Deposit Amount:</span>
                <span className="font-mono text-emerald-800 font-bold text-sm">{formatCurrency(calcDeposit)}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={600000}
                step={5000}
                value={calcDeposit}
                onChange={(e) => setCalcDeposit(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>₱5k</span>
                <span className="font-bold text-amber-600">₱300k (Cap Threshold)</span>
                <span>₱600k</span>
              </div>
            </div>

            {/* Slider 2: Duration in Months */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-700">Projection Period:</span>
                <span className="font-mono text-slate-900 font-bold">{calcMonths} Month{calcMonths > 1 ? 's' : ''} ({Number(calcMonths / 12).toFixed(1)} Year)</span>
              </div>
              <input
                type="range"
                min={1}
                max={36}
                step={1}
                value={calcMonths}
                onChange={(e) => setCalcMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>1 mo</span>
                <span>12 mo (1 yr)</span>
                <span>24 mo (2 yrs)</span>
                <span>36 mo (3 yrs)</span>
              </div>
            </div>

            {/* Visual Cap Meter */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-600">Principal Tier Breakdown</span>
                <span className={`text-[11px] font-bold ${liveCalc.isCapped ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {liveCalc.isCapped ? '⚠️ Capped Above ₱300,000' : '✓ 100% Interest Earning'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 h-3.5 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (liveCalc.earningBalance / Math.max(1, calcDeposit)) * 100)}%` }}
                  title="3% Earning Balance"
                />
                {liveCalc.nonEarningBalance > 0 && (
                  <div 
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${(liveCalc.nonEarningBalance / calcDeposit) * 100}%` }}
                    title="0% Non-earning Excess"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Earning Balance (3% p.a.)</span>
                  <span className="font-bold font-mono text-emerald-800 text-sm">
                    {formatCurrency(liveCalc.earningBalance)}
                  </span>
                </div>
                <div className="bg-white p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Excess (0% Interest)</span>
                  <span className={`font-bold font-mono text-sm ${liveCalc.nonEarningBalance > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                    {formatCurrency(liveCalc.nonEarningBalance)}
                  </span>
                </div>
              </div>

              {liveCalc.isCapped && (
                <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200/60 leading-snug">
                  <strong>Cap Limit Policy:</strong> ₱{liveCalc.nonEarningBalance.toLocaleString()} exceeds the ₱300,000 maximum interest earning ceiling and does not earn interest.
                </div>
              )}
            </div>

            {/* Interest Outputs */}
            <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-4 rounded-xl shadow-xs space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">Monthly Interest Yield (0.25%/mo):</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {formatCurrency(liveCalc.estimatedMonthlyInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                <span className="text-slate-300">Annual Interest Yield (3.0%/yr):</span>
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {formatCurrency(liveCalc.estimatedAnnualInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-slate-800 pt-2">
                <span className="text-slate-200 font-semibold">Projected Yield ({calcMonths} Months):</span>
                <span className="font-mono font-extrabold text-amber-300 text-base">
                  {formatCurrency(liveCalc.projectedInterestForMonths)}
                </span>
              </div>
            </div>

            {/* Formula Reference Box */}
            <div className="text-[11px] text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <span className="font-bold text-slate-800 block">Applied Mathematical Formula:</span>
              <code className="text-xs text-emerald-900 font-mono block bg-white p-1 rounded border border-slate-200">
                Interest = min(Balance, ₱300,000) × (3.0% / 12) × Months
              </code>
            </div>
          </div>
        </div>

        {/* Right / Bottom: Member Savings Directory & Operational Ledger */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-emerald-600" />
                  <span>Member Savings Accounts</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Review balances, charge dormancy fees, and execute deposits or withdrawals.
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs self-start sm:self-auto">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({savingsAccounts.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    statusFilter === 'active'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('dormant')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                    statusFilter === 'dormant'
                      ? 'bg-white text-rose-800 shadow-xs'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  <span>Dormant (&gt; 2y)</span>
                  {metrics.dormantCount > 0 && (
                    <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                      {metrics.dormantCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setStatusFilter('capped')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    statusFilter === 'capped'
                      ? 'bg-white text-amber-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  &gt; ₱300k Cap
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by member name, account number (SA-...), or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50 focus:bg-white"
              />
            </div>

            {/* Accounts Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5">Account & Member</th>
                    <th className="py-3 px-3 text-right">Total Balance</th>
                    <th className="py-3 px-3 text-right">Earning Principal (3%)</th>
                    <th className="py-3 px-3">Last Transaction</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                        No savings accounts found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => {
                      const member = members.find((m) => m.id === account.memberId);
                      const dormancy = checkDormancyStatus(account.lastTransactionDate);
                      const isDormant = dormancy.isDormant || account.isDormant || account.status === 'dormant';
                      const isCapped = account.balance > SAVINGS_CONFIG.maxInterestEarningBalance;
                      const monthlyEst = Math.round(account.earningBalance * (0.03 / 12) * 100) / 100;

                      return (
                        <tr 
                          key={account.id}
                          className={`hover:bg-slate-50/80 transition ${
                            isDormant ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5">
                            <div className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => member && onSelectMember(member)}>
                              {account.memberName}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className="bg-slate-200 text-slate-800 px-1 py-0.2 rounded font-semibold">{account.accountNumber}</span>
                              {member && <span>• {member.memberNumber}</span>}
                            </div>
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(account.balance)}
                          </td>

                          <td className="py-3 px-3 text-right font-mono">
                            <span className="text-emerald-800 font-semibold block">
                              {formatCurrency(account.earningBalance)}
                            </span>
                            {isCapped ? (
                              <span className="text-[10px] text-amber-700 font-semibold block">
                                +{formatCurrency(account.nonEarningBalance)} (0%)
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 block font-normal">
                                ~₱{monthlyEst}/mo yield
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-slate-600">
                            <div className="font-medium text-slate-800">{account.lastTransactionDate || 'N/A'}</div>
                            <div className={`text-[10px] font-semibold ${isDormant ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                              {dormancy.daysInactive} days ago {isDormant ? `(${dormancy.yearsInactive} yrs)` : ''}
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            {isDormant ? (
                              <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span>Dormant (&gt; 2y)</span>
                              </span>
                            ) : isCapped ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <span>₱300k Capped</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Active (3%)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {isDormant && (
                                <button
                                  onClick={() => handleOpenAction(account, 'charge_dormancy')}
                                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-2 py-1 rounded text-[10px] transition shadow-2xs flex items-center gap-1"
                                  title="Charge Dormancy Service Fee (Account Inactive > 2 Years)"
                                >
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Charge Fee</span>
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleOpenAction(account, 'deposit')}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-2 py-1 rounded text-[10px] transition shadow-2xs flex items-center gap-1"
                                title="Deposit"
                              >
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>Deposit</span>
                              </button>

                              <button
                                onClick={() => handleOpenAction(account, 'credit_interest')}
                                className="bg-teal-700 hover:bg-teal-800 text-white font-bold px-2 py-1 rounded text-[10px] transition shadow-2xs flex items-center gap-1"
                                title="Credit 3% Interest"
                              >
                                <TrendingUp className="w-3 h-3" />
                                <span>3% Int</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal for Deposits, Withdrawals, Interest Crediting, Dormancy Fee */}
      {activeActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeActionModal.type === 'charge_dormancy' && <ShieldAlert className="w-5 h-5 text-rose-400" />}
                {activeActionModal.type === 'deposit' && <ArrowDownLeft className="w-5 h-5 text-emerald-400" />}
                {activeActionModal.type === 'withdraw' && <ArrowUpRight className="w-5 h-5 text-amber-400" />}
                {activeActionModal.type === 'credit_interest' && <TrendingUp className="w-5 h-5 text-teal-400" />}
                <h3 className="font-bold text-sm text-white">
                  {activeActionModal.type === 'charge_dormancy' && 'Charge Dormancy Service Fee (> 2 Years Inactive)'}
                  {activeActionModal.type === 'deposit' && 'Savings Account Deposit'}
                  {activeActionModal.type === 'withdraw' && 'Savings Account Withdrawal'}
                  {activeActionModal.type === 'credit_interest' && 'Post 3.0% p.a. Savings Interest'}
                </h3>
              </div>
              <button 
                onClick={() => setActiveActionModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Account Summary Banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{activeActionModal.account.memberName}</span>
                  <span className="font-mono text-slate-500 text-[11px]">{activeActionModal.account.accountNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">Current Balance</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{formatCurrency(activeActionModal.account.balance)}</span>
                </div>
              </div>

              {/* Feedback messages */}
              {actionSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}
              {actionErrorMessage && (
                <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded-xl font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{actionErrorMessage}</span>
                </div>
              )}

              {/* Dormancy Fee Notice */}
              {activeActionModal.type === 'charge_dormancy' && (
                <div className="bg-rose-50/80 border border-rose-200 p-3 rounded-xl space-y-2 text-rose-950">
                  <div className="font-bold flex items-center gap-1.5 text-rose-900">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Inactivity Rule: Account Inactive for &gt; 2 Years</span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    Last transaction was recorded on <strong>{activeActionModal.account.lastTransactionDate}</strong>. 
                    In accordance with cooperative bylaws, dormant accounts require a service fee charge by the Account Officer.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-rose-900 mb-1">
                      Dormancy Service Fee Amount (PHP) *
                    </label>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={feeInput}
                      onChange={(e) => setFeeInput(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold px-3 py-2 border border-rose-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Deposit / Withdraw Amount Input */}
              {(activeActionModal.type === 'deposit' || activeActionModal.type === 'withdraw') && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {activeActionModal.type === 'deposit' ? 'Deposit Amount (PHP) *' : 'Withdrawal Amount (PHP) *'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">₱</span>
                    <input
                      type="number"
                      min={100}
                      step={100}
                      value={amountInput}
                      onChange={(e) => setAmountInput(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold pl-7 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* Interest Crediting Month Selector */}
              {activeActionModal.type === 'credit_interest' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Interest Crediting Period (Months)
                  </label>
                  <select
                    value={interestMonthsInput}
                    onChange={(e) => setInterestMonthsInput(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={1}>1 Month (0.25% monthly rate)</option>
                    <option value={3}>3 Months (Quarterly)</option>
                    <option value={6}>6 Months (Semi-annual)</option>
                    <option value={12}>12 Months (Full 3.0% Annual)</option>
                  </select>

                  <div className="bg-teal-50 p-3 rounded-lg border border-teal-200 text-teal-950 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span>Eligible Principal (Max ₱300k):</span>
                      <span className="font-bold font-mono">{formatCurrency(activeActionModal.account.earningBalance)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-teal-900 border-t border-teal-200 pt-1">
                      <span>Interest to be Credited:</span>
                      <span className="font-mono text-xs">
                        {formatCurrency(calculateSavingsInterest(activeActionModal.account.balance, interestMonthsInput).projectedInterestForMonths)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Officer & Notes Input */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Authorized Officer
                  </label>
                  <input
                    type="text"
                    value={officerNameInput}
                    onChange={(e) => setOfficerNameInput(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Transaction Remarks
                  </label>
                  <input
                    type="text"
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Optional notes"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleExecuteAction}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition shadow-xs flex items-center gap-1.5 ${
                  activeActionModal.type === 'charge_dormancy'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Confirm & Post Transaction</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
