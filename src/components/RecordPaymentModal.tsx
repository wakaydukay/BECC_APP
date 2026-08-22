import { useState, FormEvent } from 'react';
import { 
  X, 
  Receipt, 
  CheckCircle2, 
  Banknote, 
  Printer, 
  ShieldCheck, 
  AlertCircle,
  Download
} from 'lucide-react';
import { LoanApplication, PaymentTransaction } from '../types';
import { formatCurrency } from '../services/loanService';
import { exportPaymentReceiptPDF } from '../services/pdfService';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loans: LoanApplication[];
  defaultLoan?: LoanApplication;
  onSubmitPayment: (transaction: PaymentTransaction, updatedLoan: LoanApplication) => void;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  loans,
  defaultLoan,
  onSubmitPayment
}: RecordPaymentModalProps) {
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'past_due');
  const [selectedLoanId, setSelectedLoanId] = useState<string>(
    defaultLoan ? defaultLoan.id : activeLoans[0]?.id || ''
  );
  
  const currentLoan = activeLoans.find((l) => l.id === selectedLoanId) || activeLoans[0];
  
  const [paymentAmount, setPaymentAmount] = useState<number>(
    currentLoan ? currentLoan.monthlyAmortization : 5000
  );
  const [channel, setChannel] = useState<'cash_teller' | 'bank_transfer' | 'salary_deduction' | 'offline_agent'>('cash_teller');
  const [notes, setNotes] = useState<string>('');
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentTransaction | null>(null);

  if (!isOpen) return null;

  const handleLoanChange = (loanId: string) => {
    setSelectedLoanId(loanId);
    const loan = activeLoans.find((l) => l.id === loanId);
    if (loan) {
      setPaymentAmount(loan.monthlyAmortization);
    }
  };

  const calculateSplit = () => {
    if (!currentLoan) return { principal: 0, interest: 0, penalty: 0 };
    const monthlyRate = currentLoan.annualInterestRate / 12;
    const interest = Math.min(paymentAmount, Math.round(currentLoan.remainingBalance * monthlyRate * 100) / 100);
    const penalty = currentLoan.status === 'past_due' ? Math.min(paymentAmount * 0.05, 500) : 0;
    const principal = Math.max(0, paymentAmount - interest - penalty);
    return { principal, interest, penalty };
  };

  const split = calculateSplit();

  const handleProcessPayment = (e: FormEvent) => {
    e.preventDefault();
    if (!currentLoan || paymentAmount <= 0) return;

    const now = new Date();
    const receiptNumber = `OR-${now.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newTx: PaymentTransaction = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptNumber,
      loanId: currentLoan.id,
      loanNumber: currentLoan.loanNumber,
      memberId: currentLoan.memberId,
      memberName: currentLoan.memberName,
      amount: paymentAmount,
      principalPaid: split.principal,
      interestPaid: split.interest,
      penaltyPaid: split.penalty,
      paymentDate: now.toISOString().split('T')[0],
      channel,
      notes: notes || 'Regular loan amortization payment',
      isSynced: false,
      version: 1,
      updatedAt: now.toISOString()
    };

    // Calculate updated loan
    const newRemainingBalance = Math.max(0, currentLoan.remainingBalance - split.principal);
    const newTotalPaid = currentLoan.totalPaid + paymentAmount;
    const isNowFullyPaid = newRemainingBalance <= 0;

    // Update schedule items
    const updatedSchedule = currentLoan.schedule.map((item) => {
      if (!item.isPaid && item.totalMonthlyPayment <= paymentAmount) {
        return {
          ...item,
          isPaid: true,
          paidAt: now.toISOString().split('T')[0],
          paymentRef: receiptNumber
        };
      }
      return item;
    });

    const updatedLoan: LoanApplication = {
      ...currentLoan,
      remainingBalance: newRemainingBalance,
      totalPaid: newTotalPaid,
      status: isNowFullyPaid ? 'fully_paid' : currentLoan.status === 'past_due' && paymentAmount >= currentLoan.overdueAmount ? 'active' : currentLoan.status,
      overdueAmount: Math.max(0, currentLoan.overdueAmount - paymentAmount),
      daysOverdue: paymentAmount >= currentLoan.overdueAmount ? 0 : currentLoan.daysOverdue,
      schedule: updatedSchedule,
      version: currentLoan.version + 1,
      updatedAt: now.toISOString()
    };

    setGeneratedReceipt(newTx);
    onSubmitPayment(newTx, updatedLoan);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Record Loan Repayment Voucher
              </h2>
              <p className="text-xs text-slate-400">
                Instant balance deduction • Offline receipt generated
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

        {generatedReceipt ? (
          /* Digital Official Receipt View */
          <div className="p-6 space-y-5 text-xs">
            <div className="text-center space-y-1 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900">
                Payment Successfully Recorded!
              </h3>
              <p className="text-[11px] text-emerald-700 font-mono font-bold">
                Official Receipt: {generatedReceipt.receiptNumber}
              </p>
              <p className="text-[10px] text-slate-500">
                Encrypted locally in vault and queued for server sync.
              </p>
            </div>

            {/* Receipt Breakdown Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2 font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Borrower:</span>
                <strong className="text-slate-900 font-sans">{generatedReceipt.memberName}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Loan Ref:</span>
                <strong className="text-slate-900">{generatedReceipt.loanNumber}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Date:</span>
                <span>{generatedReceipt.paymentDate}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Channel:</span>
                <span className="capitalize">{generatedReceipt.channel.replace('_', ' ')}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-sm">
                <span>Total Paid:</span>
                <span className="text-emerald-700">{formatCurrency(generatedReceipt.amount)}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                <span>(Principal: {formatCurrency(generatedReceipt.principalPaid)} | Interest: {formatCurrency(generatedReceipt.interestPaid)})</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="btn-export-payment-receipt-pdf"
                type="button"
                onClick={() => exportPaymentReceiptPDF(generatedReceipt, currentLoan)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition shadow-2xs"
                title="Download official PDF repayment receipt voucher"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export PDF Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Payment Form */
          <form onSubmit={handleProcessPayment} className="p-6 space-y-4 text-xs">
            {/* Select Loan */}
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Select Loan Account
              </label>
              <select
                id="select-payment-loan"
                value={selectedLoanId}
                onChange={(e) => handleLoanChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                {activeLoans.map((loan) => (
                  <option key={loan.id} value={loan.id}>
                    {loan.memberName} — {loan.loanNumber} (Bal: {formatCurrency(loan.remainingBalance)})
                  </option>
                ))}
              </select>
            </div>

            {currentLoan && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Outstanding Balance:</span>
                  <span className="font-bold text-slate-900 font-mono">{formatCurrency(currentLoan.remainingBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Monthly Amortization Due:</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(currentLoan.monthlyAmortization)}</span>
                </div>
                {currentLoan.status === 'past_due' && (
                  <div className="flex justify-between text-rose-700 font-bold pt-1 border-t border-slate-200">
                    <span>Past Due Amount:</span>
                    <span>{formatCurrency(currentLoan.overdueAmount)} ({currentLoan.daysOverdue} days)</span>
                  </div>
                )}
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Amount to Pay (₱)
              </label>
              <input
                id="input-payment-amount"
                type="number"
                min={100}
                max={currentLoan ? currentLoan.remainingBalance + 5000 : 200000}
                step={50}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Payment Channel */}
            <div>
              <label className="block text-slate-700 font-bold uppercase tracking-wider mb-1.5">
                Payment Channel
              </label>
              <select
                id="select-payment-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="cash_teller">Over-the-Counter Cash (Coop Branch Teller)</option>
                <option value="salary_deduction">Payroll / Salary Deduction</option>
                <option value="offline_agent">Offline Collection Field Officer</option>
                <option value="bank_transfer">Bank Remittance / Online Banking</option>
              </select>
            </div>

            {/* Split Breakdown */}
            <div className="bg-slate-900 text-white rounded-xl p-3.5 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>Principal Reduction:</span>
                <span className="font-mono text-white font-bold">{formatCurrency(split.principal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>15% p.a. Accrued Interest:</span>
                <span className="font-mono text-emerald-400 font-bold">{formatCurrency(split.interest)}</span>
              </div>
              {split.penalty > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>Late Penalty Fee:</span>
                  <span className="font-mono font-bold">{formatCurrency(split.penalty)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Offline receipt generation</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  id="btn-process-payment-submit"
                  type="submit"
                  disabled={!currentLoan || paymentAmount <= 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition shadow-xs"
                >
                  Process Repayment
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
