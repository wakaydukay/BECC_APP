import { useState } from 'react';
import { 
  Search, 
  Filter, 
  UserCheck, 
  AlertCircle, 
  CreditCard, 
  Eye, 
  Plus, 
  Phone, 
  Mail, 
  Building,
  CheckCircle,
  Clock,
  Shield,
  Heart,
  Activity,
  HeartHandshake,
  Download,
  Info,
  RotateCcw
} from 'lucide-react';
import { Member, LoanApplication, LoanType } from '../types';
import { formatCurrency } from '../services/loanService';

interface MembersDirectoryProps {
  members: Member[];
  loans: LoanApplication[];
  onSelectMember: (member: Member) => void;
  onOpenMemberDetail: (member: Member) => void;
  onOpenLoanApplyForMember: (member: Member, defaultType?: LoanType, overdueLoanId?: string) => void;
  onOpenPaymentForMember: (member: Member) => void;
}

export function MembersDirectory({
  members,
  loans,
  onSelectMember,
  onOpenMemberDetail,
  onOpenLoanApplyForMember,
  onOpenPaymentForMember
}: MembersDirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'hap' | 'map' | 'dual_aid'>('all');

  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.employerOrBusiness.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'active') return m.status === 'active' || m.status === 'good_standing';
    if (statusFilter === 'past_due') return m.status === 'past_due';
    if (statusFilter === 'hap') return m.isHapMember || (m.hapInfo && m.hapInfo.isPaid);
    if (statusFilter === 'map') return m.isMapMember || (m.mapInfo && m.mapInfo.isPaid);
    if (statusFilter === 'dual_aid') return (m.isHapMember || m.hapInfo?.isPaid) && (m.isMapMember || m.mapInfo?.isPaid);
    return true;
  });

  const activeCount = members.filter((m) => m.status === 'active' || m.status === 'good_standing').length;
  const pastDueCount = members.filter((m) => m.status === 'past_due').length;
  const hapCount = members.filter((m) => m.isHapMember || (m.hapInfo && m.hapInfo.isPaid)).length;
  const mapCount = members.filter((m) => m.isMapMember || (m.mapInfo && m.mapInfo.isPaid)).length;
  const dualAidCount = members.filter((m) => (m.isHapMember || m.hapInfo?.isPaid) && (m.isMapMember || m.mapInfo?.isPaid)).length;

  return (
    <div className="space-y-6">
      {/* Header & Quick Filter Pills */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Cooperative Members Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage active memberships, track HAP (Health Aid) & MAP (Mutual Aid) program fee statuses, and loan standings.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-medium">
          <button
            id="filter-members-all"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-md transition ${
              statusFilter === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({members.length})
          </button>
          <button
            id="filter-members-active"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active ({activeCount})</span>
          </button>
          <button
            id="filter-members-pastdue"
            onClick={() => setStatusFilter('past_due')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              statusFilter === 'past_due'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Past Due ({pastDueCount})</span>
          </button>
          <button
            id="filter-members-hap"
            onClick={() => setStatusFilter('hap')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              statusFilter === 'hap'
                ? 'bg-teal-700 text-white shadow-xs font-semibold'
                : 'text-teal-800 hover:bg-teal-50'
            }`}
            title="Members who have paid their Health Aid Program fee"
          >
            <Heart className="w-3.5 h-3.5" />
            <span>HAP Members ({hapCount})</span>
          </button>
          <button
            id="filter-members-map"
            onClick={() => setStatusFilter('map')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              statusFilter === 'map'
                ? 'bg-indigo-700 text-white shadow-xs font-semibold'
                : 'text-indigo-800 hover:bg-indigo-50'
            }`}
            title="Members who have paid their Mutual Aid Program fee"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>MAP Members ({mapCount})</span>
          </button>
          <button
            id="filter-members-dual"
            onClick={() => setStatusFilter('dual_aid')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
              statusFilter === 'dual_aid'
                ? 'bg-purple-700 text-white shadow-xs font-semibold'
                : 'text-purple-800 hover:bg-purple-50'
            }`}
            title="Members with both HAP and MAP aid programs paid"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>Dual HAP+MAP ({dualAidCount})</span>
          </button>
        </div>
      </div>

      {/* Program Legend Information Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-500" />
            Aid Program Indicators:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-teal-100 text-teal-900 border border-teal-300 px-2 py-0.5 rounded-full">
              <Heart className="w-3 h-3 text-teal-600 fill-teal-600" />
              HAP Member
            </span>
            <span className="text-slate-500 text-[11px]">= Health Aid Program fee paid (₱1,200/yr • ₱50k Hospitalization Aid)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-[11px] bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3 text-indigo-600 fill-indigo-100" />
              MAP Member
            </span>
            <span className="text-slate-500 text-[11px]">= Mutual Aid Program fee paid (₱1,500/yr • ₱100k Life & Damayan Aid)</span>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Coverage auto-activated upon official fee payment
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-member-search"
            type="text"
            placeholder="Search members by full name, ID (e.g. COOP-2021-0104), employer, phone, or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="text-xs text-slate-500 hover:text-slate-800 underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Member Info</th>
                <th className="py-3 px-4">Status & Standing</th>
                <th className="py-3 px-4">Aid Program Indicators</th>
                <th className="py-3 px-4 text-right">Share Capital</th>
                <th className="py-3 px-4 text-right">Active Loans</th>
                <th className="py-3 px-4 text-right">Past Due</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 text-xs">
                    No cooperative members found matching the search and program filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const memberLoans = loans.filter((l) => l.memberId === member.id);
                  const isPastDue = member.status === 'past_due' || member.pastDueAmount > 0;
                  const isHap = member.isHapMember || (member.hapInfo && member.hapInfo.isPaid);
                  const isMap = member.isMapMember || (member.mapInfo && member.mapInfo.isPaid);

                  return (
                    <tr
                      key={member.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isPastDue ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Member Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {member.fullName.charAt(0)}
                          </div>
                          <div>
                            <div 
                              className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                              onClick={() => onOpenMemberDetail(member)}
                            >
                              {member.fullName}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-slate-700">{member.memberNumber}</span>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{member.employerOrBusiness}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Rating */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {member.status === 'past_due' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              Past Due Account
                            </span>
                          ) : member.status === 'good_standing' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle className="w-3 h-3" />
                              Good Standing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-full">
                              Active Member
                            </span>
                          )}
                          <div className="text-[10px] text-slate-500">
                            Score: {member.creditScoreCategory}
                          </div>
                        </div>
                      </td>

                      {/* HAP & MAP Program Member Indicators */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1.5">
                          {/* HAP Indicator */}
                          {isHap ? (
                            <div 
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-900 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded-md shadow-2xs w-fit"
                              title={`Health Aid Program: Active Member\nPaid: ${member.hapInfo?.paidDate || 'Current'}\nReceipt: ${member.hapInfo?.receiptNo || 'OR-HAP-OK'}\nCoverage: ${member.hapInfo?.benefitCoverage || '₱50,000 Hospitalization'}`}
                            >
                              <Heart className="w-3 h-3 text-teal-600 fill-teal-600" />
                              <span>HAP Member</span>
                              <span className="text-[9px] bg-teal-200 text-teal-800 px-1 rounded font-mono">PAID</span>
                            </div>
                          ) : (
                            <div 
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md w-fit cursor-pointer hover:border-slate-300"
                              onClick={() => onOpenMemberDetail(member)}
                              title="Health Aid Program fee unpaid (₱1,200/yr). Click to view or record payment."
                            >
                              <Heart className="w-3 h-3 text-slate-300" />
                              <span className="text-slate-500">HAP Unpaid</span>
                            </div>
                          )}

                          {/* MAP Indicator */}
                          {isMap ? (
                            <div 
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-900 bg-indigo-50 border border-indigo-300 px-2 py-0.5 rounded-md shadow-2xs w-fit"
                              title={`Mutual Aid Program: Active Member\nPaid: ${member.mapInfo?.paidDate || 'Current'}\nReceipt: ${member.mapInfo?.receiptNo || 'OR-MAP-OK'}\nCoverage: ${member.mapInfo?.benefitCoverage || '₱100,000 Life & Damayan'}`}
                            >
                              <Shield className="w-3 h-3 text-indigo-600 fill-indigo-200" />
                              <span>MAP Member</span>
                              <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1 rounded font-mono">PAID</span>
                            </div>
                          ) : (
                            <div 
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md w-fit cursor-pointer hover:border-slate-300"
                              onClick={() => onOpenMemberDetail(member)}
                              title="Mutual Aid Program fee unpaid (₱1,500/yr). Click to view or record payment."
                            >
                              <Shield className="w-3 h-3 text-slate-300" />
                              <span className="text-slate-500">MAP Unpaid</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Share Capital */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(member.shareCapital)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Savings: {formatCurrency(member.savingsDeposit)}
                        </div>
                      </td>

                      {/* Active Loan Balance */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          {formatCurrency(member.totalLoanBalance)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {memberLoans.length} active loan{memberLoans.length !== 1 ? 's' : ''}
                        </div>
                      </td>

                      {/* Past Due Amount */}
                      <td className="py-3.5 px-4 text-right">
                        {member.pastDueAmount > 0 ? (
                          <div>
                            <span className="font-bold text-rose-700 text-xs">
                              {formatCurrency(member.pastDueAmount)}
                            </span>
                            <div className="text-[10px] text-rose-600 font-semibold">
                              Overdue
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {member.pastDueAmount > 0 && (
                            <button
                              id={`btn-restructure-member-${member.id}`}
                              onClick={() => {
                                const overdueLoan = memberLoans.find(l => l.status === 'past_due' || l.daysOverdue > 0);
                                onOpenLoanApplyForMember(member, 'restructuring_loan', overdueLoan?.id);
                              }}
                              className="p-1.5 text-purple-700 hover:bg-purple-100 rounded-md transition"
                              title="Restructure Overdue Loan Principal"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            id={`btn-view-member-${member.id}`}
                            onClick={() => onOpenMemberDetail(member)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                            title="View Member Profile, HAP/MAP Status & Amortization Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`btn-apply-loan-member-${member.id}`}
                            onClick={() => onOpenLoanApplyForMember(member)}
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-md transition"
                            title="Apply Loan for Member (15% p.a.)"
                          >
                            <CreditCard className="w-4 h-4" />
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
  );
}
