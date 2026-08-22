/**
 * Cooperative Offline Membership & Loan Services App
 * Offline-first architecture with AES-GCM 256-bit local encryption and automated conflict resolution.
 */

import { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { MembersDirectory } from './components/MembersDirectory';
import { LoanServicesView } from './components/LoanServicesView';
import { MemberPortalView } from './components/MemberPortalView';
import { SavingsManagementView } from './components/SavingsManagementView';
import { SyncConflictCenter } from './components/SyncConflictCenter';
import { LoanApplicationModal } from './components/LoanApplicationModal';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { LoanScheduleModal } from './components/LoanScheduleModal';
import { MemberDetailModal } from './components/MemberDetailModal';
import { SecurityVaultModal } from './components/SecurityVaultModal';

import { 
  Member, 
  LoanApplication, 
  PaymentTransaction, 
  SavingsAccount,
  SavingsTransaction,
  QueuedOfflineMutation, 
  ConflictRecord, 
  SyncReport, 
  EncryptionVaultState, 
  LoanType 
} from './types';
import { storageService, LocalCoopState } from './services/storageService';
import { syncEngine } from './services/syncEngine';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [activeRole, setActiveRole] = useState<'officer' | 'member'>('officer');
  
  // Core Cooperative Data State
  const [members, setMembers] = useState<Member[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [savingsAccounts, setSavingsAccounts] = useState<SavingsAccount[]>([]);
  const [savingsTransactions, setSavingsTransactions] = useState<SavingsTransaction[]>([]);
  const [offlineQueue, setOfflineQueue] = useState<QueuedOfflineMutation[]>([]);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);
  const [syncReports, setSyncReports] = useState<SyncReport[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [vaultMeta, setVaultMeta] = useState<EncryptionVaultState>(storageService.getVaultMeta());

  // Modals
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoanApplyOpen, setIsLoanApplyOpen] = useState(false);
  const [applyLoanType, setApplyLoanType] = useState<LoanType>('salary_loan');
  const [applyTargetMember, setApplyTargetMember] = useState<Member | undefined>(undefined);
  const [applyOverdueLoanId, setApplyOverdueLoanId] = useState<string | undefined>(undefined);
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetLoan, setPaymentTargetLoan] = useState<LoanApplication | undefined>(undefined);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedScheduleLoan, setSelectedScheduleLoan] = useState<LoanApplication | null>(null);

  const [isMemberDetailOpen, setIsMemberDetailOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Load and decrypt local data on startup
  const refreshFromStorage = useCallback(() => {
    const state = storageService.getState();
    setMembers(state.members || []);
    setLoans(state.loans || []);
    setTransactions(state.transactions || []);
    setSavingsAccounts(state.savingsAccounts || []);
    setSavingsTransactions(state.savingsTransactions || []);
    setOfflineQueue(state.offlineQueue || []);
    setConflicts(state.conflicts || []);
    setSyncReports(state.syncReports || []);
    setLastSyncTime(state.lastSyncTime);
    setVaultMeta(storageService.getVaultMeta());

    if (state.members && state.members.length > 0) {
      setSelectedMember((prev) => {
        if (!prev) return state.members[0];
        const refreshed = state.members.find((m) => m.id === prev.id);
        return refreshed || state.members[0];
      });
    }
  }, []);

  useEffect(() => {
    async function init() {
      try {
        await storageService.initialize();
        refreshFromStorage();
      } catch (e) {
        console.error('Initialization failed:', e);
      } finally {
        setIsInitializing(false);
      }
    }
    init();

    const handleOnline = () => {
      showToast('Internet connection restored. Ready to synchronize data.', 'info');
    };
    const handleOffline = () => {
      showToast('You are now working offline. All actions will be encrypted locally.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [refreshFromStorage]);

  // Handler: Apply for new loan (Offline-capable)
  const handleCreateLoan = async (newLoan: LoanApplication) => {
    const updatedLoans = [newLoan, ...loans];
    
    // Update member's active loan balance
    const updatedMembers = members.map((m) => {
      if (m.id === newLoan.memberId) {
        return {
          ...m,
          activeLoanCount: m.activeLoanCount + 1,
          totalLoanBalance: m.totalLoanBalance + newLoan.remainingBalance,
          version: m.version + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });

    const mutation: QueuedOfflineMutation = {
      id: `mut-loan-${Date.now()}`,
      entityType: 'loan',
      action: 'create',
      entityId: newLoan.id,
      payload: newLoan,
      timestamp: Date.now(),
      clientVersion: 1,
      status: 'pending',
      retryCount: 0
    };

    const updatedQueue = [mutation, ...offlineQueue];

    const newState: LocalCoopState = {
      ...storageService.getState(),
      loans: updatedLoans,
      members: updatedMembers,
      offlineQueue: updatedQueue
    };

    await storageService.persistToVault(newState);
    refreshFromStorage();
    showToast(`Loan application ${newLoan.loanNumber} created and encrypted locally. Queued for sync!`);
  };

  // Handler: Record Repayment (Offline-capable)
  const handleRecordPayment = async (transaction: PaymentTransaction, updatedLoan: LoanApplication) => {
    const updatedLoans = loans.map((l) => (l.id === updatedLoan.id ? updatedLoan : l));
    const updatedTxs = [transaction, ...transactions];

    // Recalculate member's balance and past due status
    const updatedMembers = members.map((m) => {
      if (m.id === updatedLoan.memberId) {
        const remainingPastDue = Math.max(0, m.pastDueAmount - transaction.amount);
        const memberActiveLoans = updatedLoans.filter((l) => l.memberId === m.id && (l.status === 'active' || l.status === 'past_due'));
        const totalBal = memberActiveLoans.reduce((sum, l) => sum + l.remainingBalance, 0);

        return {
          ...m,
          pastDueAmount: remainingPastDue,
          totalLoanBalance: totalBal,
          status: remainingPastDue === 0 ? 'active' : m.status,
          version: m.version + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });

    const payMutation: QueuedOfflineMutation = {
      id: `mut-pay-${Date.now()}`,
      entityType: 'payment',
      action: 'create',
      entityId: transaction.id,
      payload: transaction,
      timestamp: Date.now(),
      clientVersion: 1,
      status: 'pending',
      retryCount: 0
    };

    const loanMutation: QueuedOfflineMutation = {
      id: `mut-lupd-${Date.now()}`,
      entityType: 'loan',
      action: 'update',
      entityId: updatedLoan.id,
      payload: updatedLoan,
      timestamp: Date.now(),
      clientVersion: updatedLoan.version,
      status: 'pending',
      retryCount: 0
    };

    const updatedQueue = [payMutation, loanMutation, ...offlineQueue];

    const newState: LocalCoopState = {
      ...storageService.getState(),
      loans: updatedLoans,
      transactions: updatedTxs,
      members: updatedMembers,
      offlineQueue: updatedQueue
    };

    await storageService.persistToVault(newState);
    refreshFromStorage();
    showToast(`Payment of ₱${transaction.amount.toLocaleString()} recorded! Official Receipt ${transaction.receiptNumber} generated.`);
  };

  // Handler: Update Member Profile or Share Capital
  const handleUpdateMember = async (updatedMember: Member) => {
    const updatedMembers = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));

    const mutation: QueuedOfflineMutation = {
      id: `mut-mem-${Date.now()}`,
      entityType: 'member',
      action: 'update',
      entityId: updatedMember.id,
      payload: updatedMember,
      timestamp: Date.now(),
      clientVersion: updatedMember.version,
      status: 'pending',
      retryCount: 0
    };

    const newState: LocalCoopState = {
      ...storageService.getState(),
      members: updatedMembers,
      offlineQueue: [mutation, ...offlineQueue]
    };

    await storageService.persistToVault(newState);
    refreshFromStorage();
    if (selectedMember?.id === updatedMember.id) {
      setSelectedMember(updatedMember);
    }
    showToast(`Member profile for ${updatedMember.fullName} updated and encrypted.`);
  };

  // Handler: Direct Aid Program Payment (HAP or MAP)
  const handlePayAidProgram = async (member: Member, programType: 'hap' | 'map') => {
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const validUntil = nextYear.toISOString().split('T')[0];
    const receiptNo = `OR-${programType.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const updatedMember: Member = {
      ...member,
      version: member.version + 1,
      updatedAt: new Date().toISOString(),
      isHapMember: programType === 'hap' ? true : member.isHapMember,
      isMapMember: programType === 'map' ? true : member.isMapMember,
      hapInfo: programType === 'hap' ? {
        isEnrolled: true,
        isPaid: true,
        feeAmount: 1200,
        paidDate: today,
        validUntil: validUntil,
        receiptNo: receiptNo,
        benefitCoverage: '₱50,000 Hospitalization Assistance'
      } : member.hapInfo,
      mapInfo: programType === 'map' ? {
        isEnrolled: true,
        isPaid: true,
        feeAmount: 1500,
        paidDate: today,
        validUntil: validUntil,
        receiptNo: receiptNo,
        benefitCoverage: '₱100,000 Life & Damayan Assistance'
      } : member.mapInfo
    };

    await handleUpdateMember(updatedMember);
    showToast(
      `Official Receipt ${receiptNo} recorded: ${programType.toUpperCase()} Annual Aid membership activated for ${member.fullName}!`,
      'success'
    );
  };

  // Handler: Update Member Savings Account & Record Savings Transaction (Offline-capable)
  const handleUpdateSavingsAccount = async (updatedAccount: SavingsAccount, newTransaction?: SavingsTransaction) => {
    let updatedAccounts = savingsAccounts.map((s) => s.id === updatedAccount.id ? updatedAccount : s);
    if (!savingsAccounts.some(s => s.id === updatedAccount.id)) {
      updatedAccounts = [updatedAccount, ...savingsAccounts];
    }

    const updatedSavingsTxs = newTransaction ? [newTransaction, ...savingsTransactions] : savingsTransactions;

    // Sync member's savings balance & account number
    const updatedMembers = members.map(m => {
      if (m.id === updatedAccount.memberId) {
        return {
          ...m,
          savingsAccountNumber: updatedAccount.accountNumber,
          savingsDeposit: updatedAccount.balance,
          savingsAccount: updatedAccount,
          version: m.version + 1,
          updatedAt: new Date().toISOString()
        };
      }
      return m;
    });

    const mutations: QueuedOfflineMutation[] = [
      {
        id: `mut-sav-${Date.now()}`,
        entityType: 'savings',
        action: 'update',
        entityId: updatedAccount.id,
        payload: updatedAccount,
        timestamp: Date.now(),
        clientVersion: updatedAccount.version || 1,
        status: 'pending',
        retryCount: 0
      }
    ];

    if (newTransaction) {
      mutations.push({
        id: `mut-savtx-${Date.now()}`,
        entityType: 'savings_tx',
        action: 'create',
        entityId: newTransaction.id,
        payload: newTransaction,
        timestamp: Date.now(),
        clientVersion: 1,
        status: 'pending',
        retryCount: 0
      });
    }

    const newState: LocalCoopState = {
      ...storageService.getState(),
      savingsAccounts: updatedAccounts,
      savingsTransactions: updatedSavingsTxs,
      members: updatedMembers,
      offlineQueue: [...mutations, ...offlineQueue]
    };

    await storageService.persistToVault(newState);
    refreshFromStorage();
    showToast(`Savings Account ${updatedAccount.accountNumber} updated! Encrypted locally.`);
  };

  // Handler: Execute Server Synchronization
  const handleTriggerSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncEngine.performSync();
      refreshFromStorage();
      if (result.report.conflictsDetected > 0) {
        showToast(
          `Sync completed! Resolved ${result.report.conflictsDetected} conflict(s) automatically with zero data loss.`,
          'info'
        );
      } else {
        showToast(
          `Sync successful! Uploaded ${result.report.itemsUploaded} item(s) and downloaded ${result.report.itemsDownloaded} record(s).`
        );
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed. Please check internet connection.', 'warning');
    } finally {
      setIsSyncing(false);
    }
  };

  if (isInitializing || !selectedMember) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4 p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold">Unlocking Encrypted Local Vault...</h2>
          <p className="text-xs text-slate-400">
            Initializing AES-GCM 256-bit secure cooperative datastore
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 max-w-md animate-fade-in shadow-xl rounded-xl overflow-hidden">
          <div
            className={`p-4 text-xs font-semibold flex items-center justify-between gap-3 text-white ${
              toastMessage.type === 'success'
                ? 'bg-emerald-700'
                : toastMessage.type === 'warning'
                ? 'bg-amber-600'
                : 'bg-indigo-700'
            }`}
          >
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/80 hover:text-white p-0.5 rounded"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        selectedMember={selectedMember}
        setSelectedMember={setSelectedMember}
        allMembers={members}
        pendingQueueCount={offlineQueue.length}
        isSyncing={isSyncing}
        onTriggerSync={handleTriggerSync}
        onOpenVault={() => setIsVaultModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <DashboardOverview
            members={members}
            loans={loans}
            transactions={transactions}
            pendingQueueCount={offlineQueue.length}
            lastSyncTime={lastSyncTime}
            onNavigateTab={setCurrentTab}
            onOpenLoanApply={() => {
              setApplyTargetMember(selectedMember);
              setApplyLoanType('salary_loan');
              setIsLoanApplyOpen(true);
            }}
            onOpenPaymentModal={() => {
              setPaymentTargetLoan(undefined);
              setIsPaymentModalOpen(true);
            }}
            onOpenVault={() => setIsVaultModalOpen(true)}
          />
        )}

        {currentTab === 'members' && (
          <MembersDirectory
            members={members}
            loans={loans}
            onSelectMember={(mem) => {
              setSelectedMember(mem);
              setCurrentTab('member_portal');
            }}
            onOpenMemberDetail={(mem) => {
              setDetailMember(mem);
              setIsMemberDetailOpen(true);
            }}
            onOpenLoanApplyForMember={(mem) => {
              setApplyTargetMember(mem);
              setApplyLoanType('salary_loan');
              setIsLoanApplyOpen(true);
            }}
            onOpenPaymentForMember={(mem) => {
              const memLoan = loans.find((l) => l.memberId === mem.id && (l.status === 'active' || l.status === 'past_due'));
              setPaymentTargetLoan(memLoan);
              setIsPaymentModalOpen(true);
            }}
          />
        )}

        {currentTab === 'loans' && (
          <LoanServicesView
            loans={loans}
            members={members}
            onOpenLoanApply={(type, overdueId) => {
              setApplyTargetMember(selectedMember);
              setApplyLoanType(type || 'salary_loan');
              setApplyOverdueLoanId(overdueId);
              setIsLoanApplyOpen(true);
            }}
            onOpenPaymentModal={(loan) => {
              setPaymentTargetLoan(loan);
              setIsPaymentModalOpen(true);
            }}
            onViewLoanSchedule={(loan) => {
              setSelectedScheduleLoan(loan);
              setIsScheduleModalOpen(true);
            }}
          />
        )}

        {currentTab === 'savings' && (
          <SavingsManagementView
            savingsAccounts={savingsAccounts}
            savingsTransactions={savingsTransactions}
            members={members}
            onUpdateAccount={handleUpdateSavingsAccount}
            onSelectMember={(mem) => {
              setSelectedMember(mem);
              setCurrentTab('member_portal');
            }}
          />
        )}

        {currentTab === 'member_portal' && (
          <MemberPortalView
            member={selectedMember}
            loans={loans}
            transactions={transactions}
            savingsAccounts={savingsAccounts}
            savingsTransactions={savingsTransactions}
            onOpenLoanApply={(defaultType, overdueId) => {
              setApplyTargetMember(selectedMember);
              setApplyLoanType(defaultType || 'salary_loan');
              setApplyOverdueLoanId(overdueId);
              setIsLoanApplyOpen(true);
            }}
            onOpenPaymentModal={(loan) => {
              setPaymentTargetLoan(loan);
              setIsPaymentModalOpen(true);
            }}
            onViewLoanSchedule={(loan) => {
              setSelectedScheduleLoan(loan);
              setIsScheduleModalOpen(true);
            }}
            onPayAidProgram={handlePayAidProgram}
          />
        )}

        {currentTab === 'sync' && (
          <SyncConflictCenter
            queue={offlineQueue}
            conflicts={conflicts}
            reports={syncReports}
            lastSyncTime={lastSyncTime}
            isSyncing={isSyncing}
            onTriggerSync={handleTriggerSync}
            onRefreshData={refreshFromStorage}
          />
        )}
      </main>

      {/* Modals */}
      <LoanApplicationModal
        isOpen={isLoanApplyOpen}
        onClose={() => {
          setIsLoanApplyOpen(false);
          setApplyOverdueLoanId(undefined);
        }}
        members={members}
        loans={loans}
        defaultMember={applyTargetMember}
        defaultLoanType={applyLoanType}
        defaultOverdueLoanId={applyOverdueLoanId}
        onSubmitApplication={handleCreateLoan}
      />

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        loans={loans}
        defaultLoan={paymentTargetLoan}
        onSubmitPayment={handleRecordPayment}
      />

      <LoanScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        loan={selectedScheduleLoan}
      />

      <MemberDetailModal
        isOpen={isMemberDetailOpen}
        onClose={() => setIsMemberDetailOpen(false)}
        member={detailMember}
        loans={loans}
        transactions={transactions}
        savingsAccounts={savingsAccounts}
        savingsTransactions={savingsTransactions}
        onUpdateMember={handleUpdateMember}
        onUpdateSavingsAccount={handleUpdateSavingsAccount}
        onOpenLoanApplyForMember={(mem, type, overdueId) => {
          setApplyTargetMember(mem);
          setApplyLoanType(type || 'salary_loan');
          setApplyOverdueLoanId(overdueId);
          setIsLoanApplyOpen(true);
        }}
        onOpenPaymentForMember={(mem) => {
          const memLoan = loans.find((l) => l.memberId === mem.id);
          setPaymentTargetLoan(memLoan);
          setIsPaymentModalOpen(true);
        }}
      />

      <SecurityVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => setIsVaultModalOpen(false)}
        vaultMeta={vaultMeta}
        onVaultUpdated={refreshFromStorage}
      />
    </div>
  );
}
