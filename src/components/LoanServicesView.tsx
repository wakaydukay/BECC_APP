import { useState } from 'react';
import { 
  Calculator, 
  Banknote, 
  Clock, 
  Percent, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle,
  Calendar,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Download
} from 'lucide-react';
import { LoanApplication, LoanType, Member } from '../types';
import { LOAN_PRODUCTS, MAX_GLOBAL_LOAN_AMOUNT, MAX_GLOBAL_LOAN_TERM_MONTHS, calculateAmortization, formatCurrency } from '../services/loanService';
import { exportLoanSummaryPDF } from '../services/pdfService';

interface LoanServicesViewProps {
  loans: LoanApplication[];
  members: Member[];
  onOpenLoanApply: (defaultType?: LoanType, targetMember?: Member, overdueLoanId?: string) => void;
  onOpenPaymentModal: (loan?: LoanApplication) => void;
  onViewLoanSchedule: (loan: LoanApplication) => void;
}

export function LoanServicesView({
  loans,
  members,
  onOpenLoanApply,
  onOpenPaymentModal,
  onViewLoanSchedule
}: LoanServicesViewProps) {
  // Calculator State
  const [calcLoanType, setCalcLoanType] = useState<LoanType>('salary_loan');
  const [calcPrincipal, setCalcPrincipal] = useState<number>(50000);
  const [calcTermMonths, setCalcTermMonths] = useState<number>(12);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'fully_paid' | 'restructured'>('all');

  const activeProduct = LOAN_PRODUCTS[calcLoanType] || LOAN_PRODUCTS.salary_loan;
  const calculation = calculateAmortization(calcPrincipal, calcTermMonths, activeProduct.interestRatePerAnnum);

  const handleProductChange = (type: LoanType) => {
    setCalcLoanType(type);
    const prod = LOAN_PRODUCTS[type];
    if (prod && calcTermMonths > prod.maxTermMonths) {
      setCalcTermMonths(prod.maxTermMonths);
    }
  };

  const filteredLoans = loans.filter((l) => {
    if (statusFilter === 'active') return l.status === 'active';
    if (statusFilter === 'past_due') return l.status === 'past_due';
    if (statusFilter === 'fully_paid') return l.status === 'fully_paid';
    if (statusFilter === 'restructured') return l.isRestructured || l.loanType === 'restructuring_loan';
    return true;
  });

  const pastDueLoansCount = loans.filter((l) => l.status === 'past_due' || l.daysOverdue > 0).length;

  return (
    <div className="space-y-8">
      {/* Policy Rules Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-700">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold px-2 py-0.5 rounded">
                Official Cooperative Lending Policy
              </span>
              <span className="text-slate-400 text-xs">• 15% Interest Rate per Annum</span>
              <span className="text-purple-300 text-xs">• Loan Restructuring Facility Available</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cooperative Loan Services & Credit Facilities
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Transparent credit programs available to all eligible members in good standing. Maximum loanable ceiling is strictly <strong>₱200,000.00</strong> with repayment terms up to <strong>4 Years (48 Months)</strong> at <strong>15% p.a.</strong> under the diminishing balance formula.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-apply-loan-top"
              onClick={() => onOpenLoanApply('salary_loan')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>Apply for Loan</span>
            </button>
            <button
              id="btn-restructure-loan-top"
              onClick={() => onOpenLoanApply('restructuring_loan')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restructure Overdue Loan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restructuring Alert Banner if Overdue Loans Exist */}
      {pastDueLoansCount > 0 && (
        <div className="bg-purple-50 border border-purple-300 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                Loan Restructuring Relief for Overdue Loans
                <span className="text-[10px] bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded font-bold">
                  {pastDueLoansCount} Overdue Account(s) Detected
                </span>
              </h4>
              <p className="text-xs text-purple-800 mt-0.5">
                Members with overdue loans can apply for a <strong>Restructuring Loan (up to 48 mos @ 15% p.a.)</strong> to pay off the principal balance of their overdue loan and restore active good standing.
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenLoanApply('restructuring_loan')}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Apply for Restructuring</span>
          </button>
        </div>
      )}

      {/* 5 Loan Products Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Salary Loan */}
        <div 
          onClick={() => handleProductChange('salary_loan')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            calcLoanType === 'salary_loan'
              ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              15% p.a.
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">Max 4 Years</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-2">
            1. Salary Loan
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Payable up to 48 months at 15% annual interest. Fixed monthly payroll deductions.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Max Ceiling:</span>
              <span className="font-bold text-slate-900">₱200,000</span>
            </div>
            <div className="flex justify-between">
              <span>Max Term:</span>
              <span className="font-bold text-slate-900">48 Mos (4 Yrs)</span>
            </div>
          </div>
        </div>

        {/* 2. Emergency Loan */}
        <div 
          onClick={() => handleProductChange('emergency_loan')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            calcLoanType === 'emergency_loan'
              ? 'border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
              15% p.a.
            </span>
            <span className="text-[11px] text-rose-600 font-semibold">Max 1 Year</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-2">
            2. Emergency Loan
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Payable in 1 year at 15% interest p.a. for urgent medical, calamity or crisis relief.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Max Ceiling:</span>
              <span className="font-bold text-slate-900">₱200,000</span>
            </div>
            <div className="flex justify-between">
              <span>Max Term:</span>
              <span className="font-bold text-slate-900">12 Mos (1 Yr)</span>
            </div>
          </div>
        </div>

        {/* 3. Special Loan */}
        <div 
          onClick={() => handleProductChange('special_loan')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            calcLoanType === 'special_loan'
              ? 'border-amber-500 bg-amber-50/20 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              15% p.a.
            </span>
            <span className="text-[11px] text-amber-600 font-semibold">Max 1 Year</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-2">
            3. Special Loan
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Payable in 1 year with 15% p.a. for educational tuition, holidays, and periodic expenses.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Max Ceiling:</span>
              <span className="font-bold text-slate-900">₱200,000</span>
            </div>
            <div className="flex justify-between">
              <span>Max Term:</span>
              <span className="font-bold text-slate-900">12 Mos (1 Yr)</span>
            </div>
          </div>
        </div>

        {/* 4. Productivity Loan */}
        <div 
          onClick={() => handleProductChange('productivity_loan')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            calcLoanType === 'productivity_loan'
              ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              15% p.a.
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">Max 4 Years</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mt-2">
            4. Productivity Loan
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Livelihood & business capital payable up to 4 years at 15% p.a. for equipment and tools.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Max Ceiling:</span>
              <span className="font-bold text-slate-900">₱200,000</span>
            </div>
            <div className="flex justify-between">
              <span>Max Term:</span>
              <span className="font-bold text-slate-900">48 Mos (4 Yrs)</span>
            </div>
          </div>
        </div>

        {/* 5. Restructuring Loan (NEW) */}
        <div 
          onClick={() => handleProductChange('restructuring_loan')}
          className={`cursor-pointer border rounded-xl p-4 transition ${
            calcLoanType === 'restructuring_loan'
              ? 'border-purple-600 bg-purple-50 ring-2 ring-purple-500/20'
              : 'border-purple-200 bg-purple-50/40 hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300">
              15% p.a.
            </span>
            <span className="text-[11px] text-purple-700 font-semibold">Max 4 Years</span>
          </div>
          <h3 className="text-sm font-bold text-purple-950 mt-2 flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
            <span>5. Loan Restructuring</span>
          </h3>
          <p className="text-xs text-purple-900 mt-1">
            Refinance overdue loans: apply for a new loan to pay off overdue principal up to 48 months.
          </p>
          <div className="mt-3 pt-3 border-t border-purple-200 text-[11px] text-purple-800 space-y-1">
            <div className="flex justify-between">
              <span>Max Ceiling:</span>
              <span className="font-bold text-purple-950">₱200,000</span>
            </div>
            <div className="flex justify-between">
              <span>Max Term:</span>
              <span className="font-bold text-purple-950">48 Mos (4 Yrs)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Loan Amortization Calculator */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Interactive 15% p.a. Diminishing Amortization Calculator
            </h2>
            <p className="text-xs text-slate-500">
              Calculate exact monthly diminishing payments, total interest, and standard deductions (Service, App, Guarantee, CBU).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Controls Form (Left Column) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Selected Loan Product Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Credit Facility
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(LOAN_PRODUCTS) as LoanType[]).map((type) => (
                  <button
                    key={type}
                    id={`btn-calc-type-${type}`}
                    type="button"
                    onClick={() => handleProductChange(type)}
                    className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-left transition ${
                      calcLoanType === type
                        ? type === 'restructuring_loan'
                          ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                          : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="truncate">{LOAN_PRODUCTS[type].name}</div>
                    <div className="text-[10px] opacity-75 font-normal">Max {LOAN_PRODUCTS[type].maxTermMonths}m</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Principal Amount Slider & Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Loan Principal Amount (Max ₱200,000)
                </label>
                <span className="text-sm font-bold text-emerald-700 font-mono">
                  {formatCurrency(calcPrincipal)}
                </span>
              </div>
              <input
                id="slider-calc-principal"
                type="range"
                min={5000}
                max={MAX_GLOBAL_LOAN_AMOUNT}
                step={5000}
                value={calcPrincipal}
                onChange={(e) => setCalcPrincipal(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>₱5,000</span>
                <span>₱100,000</span>
                <span>₱200,000 (Max Limit)</span>
              </div>
            </div>

            {/* Term Months Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Repayment Term ({calcTermMonths} Months / {(calcTermMonths / 12).toFixed(1)} Yrs)
                </label>
                <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                  Max: {activeProduct.maxTermMonths} Months
                </span>
              </div>
              <input
                id="slider-calc-term"
                type="range"
                min={1}
                max={activeProduct.maxTermMonths}
                step={1}
                value={calcTermMonths}
                onChange={(e) => setCalcTermMonths(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>1 Month</span>
                {activeProduct.maxTermMonths > 12 && <span>24 Mos (2 Yrs)</span>}
                <span>{activeProduct.maxTermMonths} Mos ({activeProduct.maxTermMonths / 12} Yrs)</span>
              </div>
            </div>

            {/* Product Specific Requirements Overview */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>{activeProduct.name} Requirements</span>
                <span className="text-[11px] font-mono text-emerald-700 font-bold">15% Diminishing / yr</span>
              </div>
              <p className="text-[11px] text-slate-600">
                {activeProduct.description}
              </p>
              <ul className="text-[11px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
                {activeProduct.requirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Results Column (Right Column) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Calculation Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block">1st Month Payment:</span>
                <span className="text-xl font-bold font-mono text-emerald-400 block">
                  {formatCurrency(calculation.firstMonthlyPayment)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  (Principal ₱{(calcPrincipal / calcTermMonths).toFixed(0)} + 1.25% Interest)
                </span>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Last Month Payment:</span>
                <span className="text-xl font-bold font-mono text-white block">
                  {formatCurrency(calculation.lastMonthlyPayment)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Diminishing to lowest interest
                </span>
              </div>

              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Net Cash Proceeds:</span>
                <span className="text-xl font-bold font-mono text-emerald-300 block">
                  {formatCurrency(calculation.netProceeds)}
                </span>
                <span className="text-[10px] text-slate-400 block">
                  After ₱{calculation.totalDeductions.toLocaleString()} deductions
                </span>
              </div>
            </div>

            {/* Deductions Breakdown Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex justify-between">
                <span>Standard Deductions Breakdown</span>
                <span>Diminishing Balance Rules</span>
              </div>
              <div className="divide-y divide-slate-100 text-xs">
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Service Charge (3% of applied amount):</span>
                  <span className="font-bold text-slate-900 font-mono">-{formatCurrency(calculation.serviceFee)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Application Fee (Fixed standard):</span>
                  <span className="font-bold text-slate-900 font-mono">-{formatCurrency(calculation.applicationFee)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between">
                  <span className="text-slate-600">Guarantee Fee (1% of applied amount):</span>
                  <span className="font-bold text-slate-900 font-mono">-{formatCurrency(calculation.guaranteeFee)}</span>
                </div>
                <div className="px-4 py-2 flex justify-between bg-emerald-50/30">
                  <span className="text-emerald-900 font-medium">Retention for Capital Build-Up (5% - Member's Equity):</span>
                  <span className="font-bold text-emerald-700 font-mono">+{formatCurrency(calculation.capitalBuildUp)}</span>
                </div>
                <div className="px-4 py-2.5 bg-slate-50 flex justify-between font-bold">
                  <span className="text-slate-800">Total Deductions:</span>
                  <span className="text-slate-900 font-mono">-{formatCurrency(calculation.totalDeductions)}</span>
                </div>
              </div>
            </div>

            {/* Schedule Preview & Apply Action */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-xs text-slate-500">
                Total Interest over {calcTermMonths} mos: <strong className="text-slate-900 font-mono">{formatCurrency(calculation.totalInterest)}</strong>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="btn-export-calc-pdf"
                  onClick={() => {
                    const now = new Date();
                    const simulatedLoan: LoanApplication = {
                      id: `est-${Date.now()}`,
                      loanNumber: `EST-${activeProduct.id.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
                      memberId: 'SAMPLE-MEMBER',
                      memberName: 'Prospective Cooperative Member',
                      loanType: calcLoanType,
                      principalAmount: calcPrincipal,
                      termMonths: calcTermMonths,
                      annualInterestRate: activeProduct.interestRatePerAnnum,
                      monthlyAmortization: calculation.firstMonthlyPayment,
                      totalInterest: calculation.totalInterest,
                      serviceFee: calculation.serviceFee,
                      applicationFee: calculation.applicationFee,
                      guaranteeFee: calculation.guaranteeFee,
                      capitalBuildUp: calculation.capitalBuildUp,
                      totalDeductions: calculation.totalDeductions,
                      netProceeds: calculation.netProceeds,
                      status: 'pending',
                      purpose: activeProduct.purpose,
                      appliedDate: now.toISOString().split('T')[0],
                      maturityDate: new Date(now.setMonth(now.getMonth() + calcTermMonths)).toISOString().split('T')[0],
                      nextDueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                      remainingBalance: calcPrincipal,
                      totalPaid: 0,
                      overdueAmount: 0,
                      daysOverdue: 0,
                      schedule: calculation.schedule,
                      version: 1,
                      updatedAt: new Date().toISOString()
                    };
                    exportLoanSummaryPDF(simulatedLoan);
                  }}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                  title="Export calculated amortization schedule and deductions statement as PDF"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estimate PDF</span>
                </button>
                <button
                  onClick={() => onOpenLoanApply(calcLoanType)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-xs flex items-center gap-2"
                >
                  <span>Proceed to Application</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loans Table & Portfolio Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Active Loan Portfolio & Schedules</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-mono">
                {loans.length} Total Loans
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Review member repayments, diminishing balance tracking, overdue status, and loan restructuring options.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('past_due')}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === 'past_due' ? 'bg-rose-600 text-white shadow-xs font-semibold' : 'text-rose-700'
                }`}
              >
                Past Due {pastDueLoansCount > 0 && `(${pastDueLoansCount})`}
              </button>
              <button
                onClick={() => setStatusFilter('restructured')}
                className={`px-2.5 py-1 rounded transition ${
                  statusFilter === 'restructured' ? 'bg-purple-600 text-white shadow-xs font-semibold' : 'text-purple-700'
                }`}
              >
                Restructured
              </button>
            </div>

            <button
              id="btn-table-record-payment"
              onClick={() => onOpenPaymentModal()}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5"
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Record Repayment</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Loan No. & Borrower</th>
                <th className="py-3 px-4">Product Type</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4 text-right">Next Due / Status</th>
                <th className="py-3 px-4 text-center">Schedule / Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No loans found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const config = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;
                  const isPastDue = loan.status === 'past_due' || loan.daysOverdue > 0;
                  const targetMember = members.find((m) => m.id === loan.memberId);

                  return (
                    <tr
                      key={loan.id}
                      className={`hover:bg-slate-50 transition ${isPastDue ? 'bg-rose-50/30' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{loan.memberName}</span>
                          {loan.isRestructured && (
                            <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.2 rounded font-bold font-mono">
                              RESTRUCTURED
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{loan.loanNumber}</div>
                        {loan.restructuredFromLoanNumber && (
                          <div className="text-[10px] text-purple-700 font-mono">
                            Refinanced: {loan.restructuredFromLoanNumber}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${config.badgeColor}`}>
                          {config.name} (15% p.a.)
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {loan.termMonths} Mos Term
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatCurrency(loan.principalAmount)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Amort: {formatCurrency(loan.monthlyAmortization)}/mo
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono">
                          {formatCurrency(loan.remainingBalance)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          Paid: {formatCurrency(loan.totalPaid)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isPastDue ? (
                          <div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-1.5 py-0.5 rounded">
                              {loan.daysOverdue} Days Past Due
                            </span>
                            <div className="text-[10px] text-rose-600 font-bold mt-0.5">
                              Overdue: {formatCurrency(loan.overdueAmount)}
                            </div>
                          </div>
                        ) : loan.status === 'fully_paid' ? (
                          <div>
                            <span className="text-[10px] text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded font-medium">
                              Fully Paid
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded font-medium">
                              Up-to-Date
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Due: {loan.nextDueDate}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`btn-view-schedule-${loan.id}`}
                            onClick={() => onViewLoanSchedule(loan)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition"
                          >
                            Amortization
                          </button>

                          {/* Restructure button for past due loans */}
                          {isPastDue && loan.remainingBalance > 0 && (
                            <button
                              id={`btn-restructure-loan-${loan.id}`}
                              onClick={() => onOpenLoanApply('restructuring_loan', targetMember, loan.id)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded transition flex items-center gap-1"
                              title="Refinance overdue loan principal into a new restructuring loan"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Restructure</span>
                            </button>
                          )}

                          {loan.remainingBalance > 0 && (
                            <button
                              id={`btn-pay-loan-${loan.id}`}
                              onClick={() => onOpenPaymentModal(loan)}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition"
                            >
                              Pay
                            </button>
                          )}
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
  );
}
