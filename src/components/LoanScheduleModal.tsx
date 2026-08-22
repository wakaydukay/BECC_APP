import { X, Calendar, CheckCircle2, AlertCircle, Printer, Download, FileText } from 'lucide-react';
import { LoanApplication } from '../types';
import { LOAN_PRODUCTS, formatCurrency } from '../services/loanService';
import { exportLoanSummaryPDF } from '../services/pdfService';

interface LoanScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: LoanApplication | null;
}

export function LoanScheduleModal({ isOpen, onClose, loan }: LoanScheduleModalProps) {
  if (!isOpen || !loan) return null;

  const config = LOAN_PRODUCTS[loan.loanType] || LOAN_PRODUCTS.salary_loan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.2 rounded ${config.badgeColor}`}>
                {config.name} (15% p.a.)
              </span>
              <span className="text-xs text-slate-400 font-mono">{loan.loanNumber}</span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">
              Amortization Schedule — {loan.memberName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loan Summary Info */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Principal Amount:</span>
            <strong className="text-slate-900 font-mono text-sm">{formatCurrency(loan.principalAmount)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Amortization Range:</span>
            <strong className="text-emerald-700 font-mono text-xs block">
              {loan.schedule[0] ? formatCurrency(loan.schedule[0].totalMonthlyPayment) : formatCurrency(loan.monthlyAmortization)}
              <span className="text-slate-500 font-sans font-normal"> down to </span>
              {loan.schedule[loan.schedule.length - 1] ? formatCurrency(loan.schedule[loan.schedule.length - 1].totalMonthlyPayment) : ''}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Remaining Balance:</span>
            <strong className="text-slate-900 font-mono text-sm">{formatCurrency(loan.remainingBalance)}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Formula & Rate:</span>
            <strong className="text-slate-900">Diminishing @ 15% p.a. ({loan.termMonths} Mos)</strong>
          </div>
        </div>

        {/* Schedule Table */}
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0">
                <th className="py-2.5 px-3">Mo.</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-right">Principal</th>
                <th className="py-2.5 px-3 text-right">15% Interest</th>
                <th className="py-2.5 px-3 text-right">Total Payment</th>
                <th className="py-2.5 px-3 text-right">Balance</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loan.schedule.map((item) => (
                <tr
                  key={item.period}
                  className={`hover:bg-slate-50 ${item.isPaid ? 'bg-emerald-50/20 text-slate-600' : 'text-slate-900'}`}
                >
                  <td className="py-2 px-3 font-sans font-bold">{item.period}</td>
                  <td className="py-2 px-3 font-sans text-slate-600">{item.dueDate}</td>
                  <td className="py-2 px-3 text-right">{formatCurrency(item.principalPayment)}</td>
                  <td className="py-2 px-3 text-right text-emerald-700">{formatCurrency(item.interestPayment)}</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatCurrency(item.totalMonthlyPayment)}</td>
                  <td className="py-2 px-3 text-right text-slate-600">{formatCurrency(item.endingBalance)}</td>
                  <td className="py-2 px-3 text-center font-sans">
                    {item.isPaid ? (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        Paid ({item.paymentRef || 'Voucher'})
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Cooperative diminishing interest model (15% per annum).
          </span>
          <div className="flex items-center gap-2">
            <button
              id="btn-export-loan-schedule-pdf"
              onClick={() => exportLoanSummaryPDF(loan)}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
              title="Download official loan disclosure statement and amortization schedule as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF Summary</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
