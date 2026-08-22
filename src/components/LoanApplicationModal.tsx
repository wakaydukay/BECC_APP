import { useState, FormEvent, useEffect } from 'react';
import { 
  X, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  RotateCcw,
  ShieldCheck, 
  Info,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { Member, LoanType, LoanApplication } from '../types';
import { 
  LOAN_PRODUCTS, 
  MAX_GLOBAL_LOAN_AMOUNT, 
  calculateAmortization, 
  calculateRestructuringSettlement,
  formatCurrency, 
  validateLoanEligibility 
} from '../services/loanService';

interface LoanApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  loans?: LoanApplication[];
  defaultMember?: Member;
  defaultLoanType?: LoanType;
  defaultOverdueLoanId?: string;
  onSubmitApplication: (loan: LoanApplication) => void;
}

export function LoanApplicationModal({
  isOpen,
  onClose,
  members,
  loans = [],
  defaultMember,
  defaultLoanType = 'salary_loan',
  defaultOverdueLoanId,
  onSubmitApplication
}: LoanApplicationModalProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string>(
    defaultMember ? defaultMember.id : members[0]?.id || ''
  );
  const [loanType, setLoanType] = useState<LoanType>(defaultLoanType);
  const [principalAmount, setPrincipalAmount] = useState<number>(50000);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [purpose, setPurpose] = useState<string>('');
  const [selectedCoMakerId, setSelectedCoMakerId] = useState<string>('');
  const [selectedOverdueLoanId, setSelectedOverdueLoanId] = useState<string>(defaultOverdueLoanId || '');

  const currentMember = members.find((m) => m.id === selectedMemberId) || members[0];
  const activeProduct = LOAN_PRODUCTS[loanType] || LOAN_PRODUCTS.salary_loan;

  // Find all loans for current member that can be restructured (past_due or active with balance)
  const memberOverdueLoans = loans.filter(
    (l) => l.memberId === selectedMemberId && (l.status === 'past_due' || l.daysOverdue > 0 || l.remainingBalance > 0)
  );

  const isRestructuring = loanType === 'restructuring_loan';

  // Target overdue loan to be settled
  const targetOverdueLoan = memberOverdueLoans.find((l) => l.id === selectedOverdueLoanId) || memberOverdueLoans[0];

  // Auto-switch defaults when member or default props change
  useEffect(() => {
    if (defaultOverdueLoanId) {
      setSelectedOverdueLoanId(defaultOverdueLoanId);
      setLoanType('restructuring_loan');
      const target = loans.find(l => l.id === defaultOverdueLoanId);
      if (target) {
        setSelectedMemberId(target.memberId);
        // Calculate recommended principal to cover overdue loan and deductions
        const rec = Math.min(
          MAX_GLOBAL_LOAN_AMOUNT,
          Math.max(5000, Math.ceil(((target.remainingBalance + 100) / 0.91) / 1000) * 1000)
        );
        setPrincipalAmount(rec);
        setTermMonths(Math.min(24, LOAN_PRODUCTS.restructuring_loan.maxTermMonths));
      }
    } else if (defaultLoanType) {
      setLoanType(defaultLoanType);
    }
  }, [defaultOverdueLoanId, defaultLoanType, defaultMember, isOpen]);

  // When member changes, check if they have overdue loans
  useEffect(() => {
    if (memberOverdueLoans.length > 0 && !selectedOverdueLoanId) {
      setSelectedOverdueLoanId(memberOverdueLoans[0].id);
    }
  }, [selectedMemberId, memberOverdueLoans]);

  if (!isOpen) return null;

  const handleLoanTypeChange = (type: LoanType) => {
    setLoanType(type);
    const prod = LOAN_PRODUCTS[type];
    if (termMonths > prod.maxTermMonths) {
      setTermMonths(prod.maxTermMonths);
    }

    // If switching to restructuring loan and member has overdue loans, auto adjust principal
    if (type === 'restructuring_loan' && targetOverdueLoan) {
      const rec = Math.min(
        MAX_GLOBAL_LOAN_AMOUNT,
        Math.max(5000, Math.ceil(((targetOverdueLoan.remainingBalance + 100) / 0.91) / 1000) * 1000)
      );
      setPrincipalAmount(rec);
      setPurpose(`Refinance and settle overdue loan #${targetOverdueLoan.loanNumber}`);
    }
  };

  const handleSelectOverdueLoan = (loanId: string) => {
    setSelectedOverdueLoanId(loanId);
    const target = memberOverdueLoans.find(l => l.id === loanId);
    if (target) {
      const rec = Math.min(
        MAX_GLOBAL_LOAN_AMOUNT,
        Math.max(5000, Math.ceil(((target.remainingBalance + 100) / 0.91) / 1000) * 1000)
      );
      setPrincipalAmount(rec);
      setPurpose(`Refinance and settle overdue loan #${target.loanNumber}`);
    }
  };

  const handleAutoFillRecommended = () => {
    if (targetOverdueLoan) {
      const rec = Math.min(
        MAX_GLOBAL_LOAN_AMOUNT,
        Math.max(5000, Math.ceil(((targetOverdueLoan.remainingBalance + 100) / 0.91) / 1000) * 1000)
      );
      setPrincipalAmount(rec);
    }
  };

  const validation = currentMember
    ? validateLoanEligibility(
        currentMember,
        loanType,
        principalAmount,
        termMonths,
        isRestructuring ? targetOverdueLoan : undefined
      )
    : { isEligible: true, warnings: [], errors: [] };

  const calculation = calculateAmortization(
    principalAmount,
    termMonths,
    activeProduct.interestRatePerAnnum
  );

  const restructuringDetails = (isRestructuring && targetOverdueLoan)
    ? calculateRestructuringSettlement(
        principalAmount,
        termMonths,
        targetOverdueLoan,
        activeProduct.interestRatePerAnnum
      )
    : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentMember || validation.errors.length > 0) return;

    const coMaker = members.find((m) => m.id === selectedCoMakerId);
    const now = new Date();
    const maturityDate = new Date(now);
    maturityDate.setMonth(maturityDate.getMonth() + termMonths);
    const nextDueDate = new Date(now);
    nextDueDate.setMonth(nextDueDate.getMonth() + 1);

    const typePrefixMap: Record<LoanType, string> = {
      salary_loan: 'SAL',
      emergency_loan: 'EMG',
      special_loan: 'SPC',
      productivity_loan: 'PRD',
      restructuring_loan: 'RST'
    };

    const newLoan: LoanApplication = {
      id: `loan-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      loanNumber: `LN-${typePrefixMap[loanType]}-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      memberId: currentMember.id,
      memberName: currentMember.fullName,
      loanType,
      principalAmount,
      termMonths,
      annualInterestRate: activeProduct.interestRatePerAnnum,
      monthlyAmortization: calculation.monthlyAmortization,
      totalInterest: calculation.totalInterest,
      serviceFee: calculation.serviceFee,
      applicationFee: calculation.applicationFee,
      guaranteeFee: calculation.guaranteeFee,
      capitalBuildUp: calculation.capitalBuildUp,
      totalDeductions: calculation.totalDeductions,
      loanInsurance: 0,
      netProceeds: calculation.netProceeds,
      status: 'active',
      purpose: purpose || (isRestructuring && targetOverdueLoan 
        ? `Loan Restructuring & Principal Refinance for ${targetOverdueLoan.loanNumber}`
        : activeProduct.purpose),
      appliedDate: now.toISOString().split('T')[0],
      approvedDate: now.toISOString().split('T')[0],
      maturityDate: maturityDate.toISOString().split('T')[0],
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      remainingBalance: principalAmount,
      totalPaid: 0,
      overdueAmount: 0,
      daysOverdue: 0,
      schedule: calculation.schedule,
      coMakers: coMaker ? [`${coMaker.fullName} (${coMaker.memberNumber})`] : [],
      
      // Restructuring Metadata
      isRestructured: isRestructuring,
      restructuredFromLoanId: isRestructuring && targetOverdueLoan ? targetOverdueLoan.id : undefined,
      restructuredFromLoanNumber: isRestructuring && targetOverdueLoan ? targetOverdueLoan.loanNumber : undefined,
      restructuredPrincipalPaid: isRestructuring && targetOverdueLoan ? targetOverdueLoan.remainingBalance : undefined,
      netCashDisbursed: restructuringDetails ? restructuringDetails.netCashToBorrower : calculation.netProceeds,
      restructuringNotes: isRestructuring && targetOverdueLoan 
        ? `Restructured to pay off outstanding principal balance of ${targetOverdueLoan.loanNumber} (${formatCurrency(targetOverdueLoan.remainingBalance)}).`
        : undefined,
      
      version: 1,
      updatedAt: now.toISOString()
    };

    onSubmitApplication(newLoan);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              isRestructuring ? 'bg-purple-500/20 text-purple-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {isRestructuring ? <RotateCcw className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {isRestructuring ? 'Loan Restructuring Application' : 'Cooperative Loan Application'}
                {isRestructuring && (
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    Refinance Overdue
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                15% Diminishing Balance per Annum • Max ₱200,000 • Up to 48 Months Term
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">
          {/* Member Selection */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
              Borrowing Member
            </label>
            <select
              id="select-loan-member"
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              {members.map((mem) => (
                <option key={mem.id} value={mem.id}>
                  {mem.fullName} ({mem.memberNumber}) - Status: {mem.status.toUpperCase()} {mem.status === 'past_due' ? '⚠️ (Past Due)' : ''} - Share: {formatCurrency(mem.shareCapital)}
                </option>
              ))}
            </select>
          </div>

          {/* Overdue Member Restructuring Alert Banner */}
          {currentMember.status === 'past_due' && memberOverdueLoans.length > 0 && !isRestructuring && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start justify-between gap-3 text-amber-900">
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Member has {memberOverdueLoans.length} Overdue Loan(s)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Regular loans are restricted for past-due members. You can switch to <strong>Loan Restructuring</strong> to apply for a new loan that pays off the principal of the overdue loan and restores good credit standing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleLoanTypeChange('restructuring_loan')}
                className="shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition shadow-xs flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restructure Loan</span>
              </button>
            </div>
          )}

          {/* Loan Product Selection */}
          <div>
            <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
              Select Credit Facility (15% p.a.)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(LOAN_PRODUCTS) as LoanType[]).map((type) => {
                const prod = LOAN_PRODUCTS[type];
                const isSelected = loanType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleLoanTypeChange(type)}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      isSelected
                        ? type === 'restructuring_loan'
                          ? 'border-purple-600 bg-purple-50 text-purple-950 font-bold ring-2 ring-purple-500/20 shadow-xs'
                          : 'border-emerald-600 bg-emerald-50/40 text-emerald-950 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="truncate pr-1">{prod.name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">Max {prod.maxTermMonths}m</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                      15% annual interest
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Specific Overdue Loan Selector when in Restructuring Mode */}
          {isRestructuring && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-purple-700" />
                  <span className="font-bold text-purple-950">
                    Select Overdue Loan to Restructure & Pay Off
                  </span>
                </div>
                {targetOverdueLoan && (
                  <button
                    type="button"
                    onClick={handleAutoFillRecommended}
                    className="text-[11px] bg-purple-600 hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-fill Full Settlement ({formatCurrency(restructuringDetails?.recommendedMinPrincipal || 0)})</span>
                  </button>
                )}
              </div>

              {memberOverdueLoans.length === 0 ? (
                <div className="bg-white p-3 rounded-lg border border-purple-200 text-slate-600 text-xs">
                  No active or overdue loans found on record for {currentMember.fullName}. Member is in good standing.
                </div>
              ) : (
                <div className="space-y-2">
                  {memberOverdueLoans.map((ovLoan) => {
                    const isTarget = ovLoan.id === selectedOverdueLoanId;
                    return (
                      <div
                        key={ovLoan.id}
                        onClick={() => handleSelectOverdueLoan(ovLoan.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition flex flex-wrap items-center justify-between gap-2 ${
                          isTarget
                            ? 'bg-white border-purple-500 ring-2 ring-purple-500/20 shadow-xs'
                            : 'bg-white/60 border-purple-100 hover:border-purple-300'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 font-mono">{ovLoan.loanNumber}</span>
                            <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                              {ovLoan.daysOverdue > 0 ? `${ovLoan.daysOverdue}d Past Due` : 'Active Balance'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Original: {formatCurrency(ovLoan.principalAmount)} • Purpose: {ovLoan.purpose}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block font-sans">Principal to Settle:</span>
                          <span className="font-bold text-rose-700 font-mono text-sm">
                            {formatCurrency(ovLoan.remainingBalance)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Validation Warnings/Errors */}
          {validation.errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-rose-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Eligibility Requirements Not Met:</span>
              </div>
              {validation.errors.map((err, i) => (
                <p key={i} className="text-[11px] text-rose-700 ml-5 list-disc">• {err}</p>
              ))}
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Underwriting Advisory:</span>
              </div>
              {validation.warnings.map((warn, i) => (
                <p key={i} className="text-[11px] text-amber-700 ml-5">• {warn}</p>
              ))}
            </div>
          )}

          {/* Principal Amount & Term */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                New Loan Principal Amount (₱)
              </label>
              <input
                id="input-loan-principal"
                type="number"
                min={5000}
                max={MAX_GLOBAL_LOAN_AMOUNT}
                step={1000}
                value={principalAmount}
                onChange={(e) => setPrincipalAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Maximum Ceiling: ₱200,000.00
              </span>
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Repayment Term (Max {activeProduct.maxTermMonths} mos)
              </label>
              <input
                id="input-loan-term"
                type="number"
                min={1}
                max={activeProduct.maxTermMonths}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                {(termMonths / 12).toFixed(1)} Year(s) duration @ 15% p.a.
              </span>
            </div>
          </div>

          {/* Purpose & Co-Maker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Purpose of Loan
              </label>
              <input
                id="input-loan-purpose"
                type="text"
                placeholder={isRestructuring ? 'Loan Restructuring & Principal Refinance' : 'e.g. Tuition fee, inventory replenishment, medical'}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Co-Maker (Active Member)
              </label>
              <select
                id="select-loan-comaker"
                value={selectedCoMakerId}
                onChange={(e) => setSelectedCoMakerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Optional / None --</option>
                {members
                  .filter((m) => m.id !== selectedMemberId && m.status !== 'past_due')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.fullName} ({m.memberNumber})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Live Amortization & Deductions Summary Card */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-300">Amortization & Net Proceeds</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
                Diminishing Amount Formula (15% p.a.)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
              <div>
                <span className="text-slate-400 block">1st Month Payment:</span>
                <span className="font-bold text-emerald-400 text-sm font-mono block mt-0.5">
                  {formatCurrency(calculation.firstMonthlyPayment)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Diminishes to {formatCurrency(calculation.lastMonthlyPayment)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Equal Mo. Principal:</span>
                <span className="font-bold text-white block mt-0.5 font-mono">
                  {formatCurrency(calculation.monthlyPrincipalPayment)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  + 1.25%/mo on balance
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Total 15% Interest:</span>
                <span className="font-bold text-white block mt-0.5 font-mono">
                  {formatCurrency(calculation.totalInterest)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Total: {formatCurrency(calculation.totalRepayment)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">
                  {isRestructuring ? 'Net Cash to Borrower:' : 'Net Disbursed:'}
                </span>
                <span className={`font-bold block mt-0.5 font-mono text-sm ${
                  isRestructuring && (restructuringDetails?.netCashToBorrower || 0) < 0
                    ? 'text-rose-400'
                    : 'text-emerald-300'
                }`}>
                  {formatCurrency(isRestructuring && restructuringDetails ? restructuringDetails.netCashToBorrower : calculation.netProceeds)}
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Ded: -{formatCurrency(calculation.totalDeductions)}
                </span>
              </div>
            </div>

            {/* Restructuring Settlement Breakdown Line Items */}
            {isRestructuring && targetOverdueLoan && restructuringDetails && (
              <div className="mt-2 pt-2.5 border-t border-slate-800 bg-purple-950/40 p-3 rounded-lg border border-purple-900/60 space-y-2">
                <div className="flex justify-between items-center text-[11px] font-bold text-purple-300">
                  <span className="flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Overdue Loan Settlement Allocation</span>
                  </span>
                  <span className="font-mono text-purple-200">
                    Refinancing #{targetOverdueLoan.loanNumber}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block font-sans">Overdue Principal Settled:</span>
                    <span className="font-bold text-rose-400">-{formatCurrency(targetOverdueLoan.remainingBalance)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block font-sans">Coop Deductions (9%+₱100):</span>
                    <span className="font-bold text-slate-300">-{formatCurrency(calculation.totalDeductions)}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block font-sans">Cash Out / Take-Home:</span>
                    <span className={`font-bold ${restructuringDetails.netCashToBorrower >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatCurrency(restructuringDetails.netCashToBorrower)}
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-300 font-sans leading-relaxed">
                  ✅ <strong>Settlement Action:</strong> Upon approval, Loan #{targetOverdueLoan.loanNumber} will be marked <strong>FULLY PAID</strong>, delinquent flags cleared, and borrower returned to Active status.
                </p>
              </div>
            )}

            {/* Standard Deductions Detailed Line Items */}
            <div className="pt-2.5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-300">
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">Service Charge (3%):</span>
                <span className="font-bold text-white">{formatCurrency(calculation.serviceFee)}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">Application Fee (Fixed):</span>
                <span className="font-bold text-white">{formatCurrency(calculation.applicationFee)}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">Guarantee Fee (1%):</span>
                <span className="font-bold text-white">{formatCurrency(calculation.guaranteeFee)}</span>
              </div>
              <div className="bg-slate-950/50 p-2 rounded border border-slate-800">
                <span className="text-slate-400 block font-sans">CBU Retention (5%):</span>
                <span className="font-bold text-emerald-300">+{formatCurrency(calculation.capitalBuildUp)}</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>AES-256 encrypted local vault persistence</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                id="btn-submit-loan-app"
                type="submit"
                disabled={validation.errors.length > 0}
                className={`px-5 py-2 rounded-lg font-bold transition shadow-xs flex items-center gap-1.5 ${
                  validation.errors.length > 0
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : isRestructuring
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isRestructuring ? <RotateCcw className="w-3.5 h-3.5" /> : null}
                <span>{isRestructuring ? 'Submit Loan Restructuring' : 'Submit Application'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
