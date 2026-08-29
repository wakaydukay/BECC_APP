import fs from 'fs';
import path from 'path';
import { 
  Member, 
  LoanApplication, 
  PaymentTransaction, 
  SavingsAccount, 
  SavingsTransaction, 
  QueuedOfflineMutation, 
  ConflictRecord, 
  SyncReport 
} from '../src/types';
import { 
  INITIAL_MEMBERS, 
  generateInitialLoans, 
  INITIAL_TRANSACTIONS, 
  generateInitialSavingsAccounts, 
  generateInitialSavingsTransactions 
} from '../src/data/initialData';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
  entityType?: string;
  entityId?: string;
}

export interface ServerDatabaseState {
  members: Member[];
  loans: LoanApplication[];
  transactions: PaymentTransaction[];
  savingsAccounts: SavingsAccount[];
  savingsTransactions: SavingsTransaction[];
  conflicts: ConflictRecord[];
  syncReports: SyncReport[];
  auditLogs: AuditLog[];
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'server_db.json');

class ServerDatabase {
  private state: ServerDatabaseState;

  constructor() {
    this.state = this.loadFromDisk();
  }

  private getDefaultState(): ServerDatabaseState {
    const initialSavings = generateInitialSavingsAccounts();
    const initialSavingsTx = generateInitialSavingsTransactions();
    return {
      members: JSON.parse(JSON.stringify(INITIAL_MEMBERS)),
      loans: generateInitialLoans(),
      transactions: JSON.parse(JSON.stringify(INITIAL_TRANSACTIONS)),
      savingsAccounts: initialSavings,
      savingsTransactions: initialSavingsTx,
      conflicts: [],
      syncReports: [],
      auditLogs: [
        {
          id: `audit-init-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'SYSTEM_BOOTSTRAP',
          performedBy: 'BECC Core System',
          details: 'Initialized BECC Cooperative Server Database with baseline member records and 15% p.a. loan products.'
        }
      ],
      lastUpdated: new Date().toISOString(),
    };
  }

  private loadFromDisk(): ServerDatabaseState {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.members && parsed.loans) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load server database from disk, creating default:', e);
    }

    const defaultState = this.getDefaultState();
    this.saveToDisk(defaultState);
    return defaultState;
  }

  public saveToDisk(state?: ServerDatabaseState): void {
    try {
      if (state) {
        this.state = state;
      }
      this.state.lastUpdated = new Date().toISOString();
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error persisting server database to disk:', e);
    }
  }

  public getState(): ServerDatabaseState {
    return this.state;
  }

  public addAuditLog(action: string, performedBy: string, details: string, entityType?: string, entityId?: string) {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      action,
      performedBy,
      details,
      entityType,
      entityId
    };
    this.state.auditLogs.unshift(log);
    // Keep max 500 logs
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs = this.state.auditLogs.slice(0, 500);
    }
    this.saveToDisk();
  }

  public resetToDefault(): ServerDatabaseState {
    this.state = this.getDefaultState();
    this.addAuditLog('DATABASE_RESET', 'System Administrator', 'Reset BECC Server Database to seed data.');
    this.saveToDisk();
    return this.state;
  }

  // --- Member Methods ---
  public getMembers(): Member[] {
    return this.state.members;
  }

  public getMemberById(id: string): Member | undefined {
    return this.state.members.find(m => m.id === id);
  }

  public addMember(memberData: Partial<Member>): Member {
    const nextNum = (this.state.members.length + 1).toString().padStart(4, '0');
    const memberNumber = `BECC-2026-${nextNum}`;
    const id = `mem-${Date.now()}`;
    const now = new Date().toISOString();

    const sharesSub = memberData.sharesSubscribed || 500;
    const subAmount = memberData.subscribedAmount || sharesSub * 100;
    const initPaid = memberData.initialPaidUp || subAmount * 0.25;
    const shareCapital = memberData.shareCapital || initPaid;
    const savingsDeposit = memberData.savingsDeposit || 5000;
    const savingsAccNum = `SA-2026-${nextNum}`;

    const newMember: Member = {
      id,
      memberNumber,
      fullName: memberData.fullName || 'Unnamed Member',
      email: memberData.email || '',
      phone: memberData.phone || '',
      tinNumber: memberData.tinNumber || '000-000-000-000',
      dateAccepted: memberData.dateAccepted || now.split('T')[0],
      bodResolutionNo: memberData.bodResolutionNo || `BOD-RES-2026-${nextNum}`,
      sharesSubscribed: sharesSub,
      subscribedAmount: subAmount,
      initialPaidUp: initPaid,
      shareCapital: shareCapital,
      savingsDeposit: savingsDeposit,
      savingsAccountNumber: savingsAccNum,
      address: memberData.address || '',
      dateOfBirth: memberData.dateOfBirth || '1990-01-01',
      age: memberData.age || 36,
      gender: memberData.gender || 'Male',
      civilStatus: memberData.civilStatus || 'Single',
      highestEduAttainment: memberData.highestEduAttainment || 'College',
      occupationOrSourceOfIncome: memberData.occupationOrSourceOfIncome || 'Educator',
      numberOfDependents: memberData.numberOfDependents || 0,
      religionOrAffiliation: memberData.religionOrAffiliation || 'None',
      annualIncome: memberData.annualIncome || 360000,
      joinDate: memberData.joinDate || now.split('T')[0],
      employerOrBusiness: memberData.employerOrBusiness || 'DepEd Batanes',
      monthlySalaryOrIncome: memberData.monthlySalaryOrIncome || 30000,
      memberType: memberData.memberType || 'regular',
      status: memberData.status || 'good_standing',
      isHapMember: memberData.isHapMember ?? true,
      isMapMember: memberData.isMapMember ?? true,
      hapInfo: memberData.hapInfo || {
        isEnrolled: true,
        isPaid: true,
        feeAmount: 1000,
        paidDate: now.split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        receiptNo: `OR-HAP-${Date.now().toString().slice(-4)}`,
        benefitCoverage: '₱10,000 Hospitalization Assistance'
      },
      mapInfo: memberData.mapInfo || {
        isEnrolled: true,
        isPaid: true,
        feeAmount: 1500,
        paidDate: now.split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
        receiptNo: `OR-MAP-${Date.now().toString().slice(-4)}`,
        benefitCoverage: '₱100,000 Mutual Life & Damayan Assistance'
      },
      activeLoanCount: 0,
      totalLoanBalance: 0,
      pastDueAmount: 0,
      creditScoreCategory: 'A (Excellent)',
      emergencyContact: memberData.emergencyContact || {
        name: 'Emergency Contact',
        phone: '+63 900 000 0000',
        relationship: 'Relative'
      },
      version: 1,
      updatedAt: now
    };

    this.state.members.unshift(newMember);

    // Also auto-create corresponding savings account
    const newSavingsAccount: SavingsAccount = {
      id: `sa-${Date.now()}`,
      accountNumber: savingsAccNum,
      memberId: id,
      memberName: newMember.fullName,
      balance: savingsDeposit,
      earningBalance: Math.min(savingsDeposit, 300000),
      nonEarningBalance: Math.max(0, savingsDeposit - 300000),
      annualInterestRate: 0.03,
      interestCap: 300000,
      openedDate: now.split('T')[0],
      lastTransactionDate: now.split('T')[0],
      isDormant: false,
      daysSinceLastTransaction: 0,
      totalInterestEarned: 0,
      status: 'active',
      transactions: [
        {
          id: `stx-init-${Date.now()}`,
          receiptOrRef: `OR-SA-${Date.now().toString().slice(-5)}`,
          savingsAccountId: `sa-${Date.now()}`,
          accountNumber: savingsAccNum,
          memberId: id,
          memberName: newMember.fullName,
          type: 'account_opening',
          amount: savingsDeposit,
          balanceAfter: savingsDeposit,
          date: now.split('T')[0],
          performedBy: 'Account Officer',
          notes: 'Initial opening deposit upon cooperative membership acceptance.',
          isSynced: true
        }
      ],
      version: 1,
      updatedAt: now
    };

    this.state.savingsAccounts.unshift(newSavingsAccount);
    if (newSavingsAccount.transactions) {
      this.state.savingsTransactions.unshift(...newSavingsAccount.transactions);
    }

    this.addAuditLog('MEMBER_REGISTERED', 'Officer', `Registered member ${newMember.fullName} (${newMember.memberNumber})`, 'member', id);
    this.saveToDisk();
    return newMember;
  }

  public updateMember(id: string, updates: Partial<Member>): Member | null {
    const idx = this.state.members.findIndex(m => m.id === id);
    if (idx === -1) return null;

    const current = this.state.members[idx];
    const updated: Member = {
      ...current,
      ...updates,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    this.state.members[idx] = updated;
    this.addAuditLog('MEMBER_UPDATED', 'Officer', `Updated member profile for ${updated.fullName}`, 'member', id);
    this.saveToDisk();
    return updated;
  }

  // --- Loan Methods ---
  public getLoans(): LoanApplication[] {
    return this.state.loans;
  }

  public addLoan(loan: LoanApplication): LoanApplication {
    const newLoan: LoanApplication = {
      ...loan,
      version: 1,
      updatedAt: new Date().toISOString()
    };
    this.state.loans.unshift(newLoan);

    // Update member's loan balances
    const member = this.state.members.find(m => m.id === loan.memberId);
    if (member) {
      member.activeLoanCount = this.state.loans.filter(l => l.memberId === member.id && (l.status === 'active' || l.status === 'past_due')).length;
      member.totalLoanBalance = this.state.loans
        .filter(l => l.memberId === member.id && (l.status === 'active' || l.status === 'past_due'))
        .reduce((sum, l) => sum + l.remainingBalance, 0);
      member.version = (member.version || 1) + 1;
      member.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('LOAN_CREATED', 'Loan Officer', `Submitted ${loan.loanType} for ${loan.memberName} (₱${loan.principalAmount.toLocaleString()})`, 'loan', loan.id);
    this.saveToDisk();
    return newLoan;
  }

  public updateLoan(id: string, updates: Partial<LoanApplication>): LoanApplication | null {
    const idx = this.state.loans.findIndex(l => l.id === id);
    if (idx === -1) return null;

    const current = this.state.loans[idx];
    const updated: LoanApplication = {
      ...current,
      ...updates,
      version: (current.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    this.state.loans[idx] = updated;

    // Recalculate member stats
    const member = this.state.members.find(m => m.id === updated.memberId);
    if (member) {
      const memberLoans = this.state.loans.filter(l => l.memberId === member.id);
      const pastDueLoan = memberLoans.find(l => l.status === 'past_due');
      member.activeLoanCount = memberLoans.filter(l => l.status === 'active' || l.status === 'past_due').length;
      member.totalLoanBalance = memberLoans
        .filter(l => l.status === 'active' || l.status === 'past_due')
        .reduce((sum, l) => sum + l.remainingBalance, 0);
      member.pastDueAmount = pastDueLoan ? pastDueLoan.overdueAmount : 0;
      member.status = pastDueLoan ? 'past_due' : member.status === 'past_due' ? 'good_standing' : member.status;
      member.version = (member.version || 1) + 1;
      member.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('LOAN_UPDATED', 'Loan Officer', `Updated loan ${updated.loanNumber} status to ${updated.status}`, 'loan', id);
    this.saveToDisk();
    return updated;
  }

  public recordLoanPayment(payment: PaymentTransaction): { success: boolean; transaction: PaymentTransaction; loan: LoanApplication } {
    const loanIdx = this.state.loans.findIndex(l => l.id === payment.loanId);
    if (loanIdx === -1) {
      throw new Error(`Loan ${payment.loanId} not found`);
    }

    const loan = this.state.loans[loanIdx];
    const newRemaining = Math.max(0, loan.remainingBalance - payment.principalPaid);
    const newTotalPaid = loan.totalPaid + payment.amount;

    // Update schedule items
    const schedule = loan.schedule.map(item => {
      if (!item.isPaid && payment.principalPaid > 0) {
        return {
          ...item,
          isPaid: true,
          paidAt: payment.paymentDate,
          paymentRef: payment.receiptNumber
        };
      }
      return item;
    });

    const isFullyPaid = newRemaining <= 0;
    const updatedLoan: LoanApplication = {
      ...loan,
      remainingBalance: newRemaining,
      totalPaid: newTotalPaid,
      status: isFullyPaid ? 'fully_paid' : loan.status === 'past_due' && loan.overdueAmount <= payment.amount ? 'active' : loan.status,
      overdueAmount: Math.max(0, loan.overdueAmount - payment.amount),
      daysOverdue: newRemaining <= 0 ? 0 : loan.daysOverdue,
      schedule,
      version: (loan.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    this.state.loans[loanIdx] = updatedLoan;

    const tx: PaymentTransaction = {
      ...payment,
      isSynced: true,
      version: 1,
      updatedAt: new Date().toISOString()
    };
    this.state.transactions.unshift(tx);

    // Update member record
    const member = this.state.members.find(m => m.id === loan.memberId);
    if (member) {
      const memberLoans = this.state.loans.filter(l => l.memberId === member.id);
      const pastDue = memberLoans.find(l => l.status === 'past_due');
      member.activeLoanCount = memberLoans.filter(l => l.status === 'active' || l.status === 'past_due').length;
      member.totalLoanBalance = memberLoans
        .filter(l => l.status === 'active' || l.status === 'past_due')
        .reduce((sum, l) => sum + l.remainingBalance, 0);
      member.pastDueAmount = pastDue ? pastDue.overdueAmount : 0;
      if (!pastDue && member.status === 'past_due') {
        member.status = 'good_standing';
      }
      member.version = (member.version || 1) + 1;
      member.updatedAt = new Date().toISOString();
    }

    this.addAuditLog('PAYMENT_RECORDED', 'Cashier', `Recorded payment ₱${payment.amount.toLocaleString()} on loan ${loan.loanNumber} (Receipt #${payment.receiptNumber})`, 'payment', tx.id);
    this.saveToDisk();
    return { success: true, transaction: tx, loan: updatedLoan };
  }

  // --- Savings Methods ---
  public getSavingsAccounts(): SavingsAccount[] {
    return this.state.savingsAccounts;
  }

  public processSavingsDeposit(accountId: string, amount: number, notes?: string, performedBy: string = 'Account Officer'): { success: boolean; account: SavingsAccount; tx: SavingsTransaction } {
    const accIdx = this.state.savingsAccounts.findIndex(a => a.id === accountId);
    if (accIdx === -1) throw new Error(`Savings account ${accountId} not found`);

    const acc = this.state.savingsAccounts[accIdx];
    const newBalance = acc.balance + amount;
    const earningBalance = Math.min(newBalance, 300000);
    const nonEarningBalance = Math.max(0, newBalance - 300000);
    const now = new Date().toISOString();

    const tx: SavingsTransaction = {
      id: `stx-${Date.now()}`,
      receiptOrRef: `OR-DEP-${Date.now().toString().slice(-6)}`,
      savingsAccountId: acc.id,
      accountNumber: acc.accountNumber,
      memberId: acc.memberId,
      memberName: acc.memberName,
      type: 'deposit',
      amount,
      balanceAfter: newBalance,
      date: now.split('T')[0],
      performedBy,
      notes: notes || 'Cash deposit over-the-counter',
      isSynced: true
    };

    const updatedAccount: SavingsAccount = {
      ...acc,
      balance: newBalance,
      earningBalance,
      nonEarningBalance,
      lastTransactionDate: now.split('T')[0],
      isDormant: false,
      daysSinceLastTransaction: 0,
      status: 'active',
      transactions: [tx, ...(acc.transactions || [])],
      version: (acc.version || 1) + 1,
      updatedAt: now
    };

    this.state.savingsAccounts[accIdx] = updatedAccount;
    this.state.savingsTransactions.unshift(tx);

    // Update member's savingsDeposit
    const member = this.state.members.find(m => m.id === acc.memberId);
    if (member) {
      member.savingsDeposit = newBalance;
      member.version = (member.version || 1) + 1;
      member.updatedAt = now;
    }

    this.addAuditLog('SAVINGS_DEPOSIT', performedBy, `Deposited ₱${amount.toLocaleString()} to account ${acc.accountNumber} (${acc.memberName})`, 'savings', acc.id);
    this.saveToDisk();
    return { success: true, account: updatedAccount, tx };
  }

  public processSavingsWithdrawal(accountId: string, amount: number, notes?: string, performedBy: string = 'Account Officer'): { success: boolean; account: SavingsAccount; tx: SavingsTransaction } {
    const accIdx = this.state.savingsAccounts.findIndex(a => a.id === accountId);
    if (accIdx === -1) throw new Error(`Savings account ${accountId} not found`);

    const acc = this.state.savingsAccounts[accIdx];
    if (acc.balance < amount) {
      throw new Error(`Insufficient savings balance. Available: ₱${acc.balance.toLocaleString()}, Requested: ₱${amount.toLocaleString()}`);
    }

    const newBalance = acc.balance - amount;
    const earningBalance = Math.min(newBalance, 300000);
    const nonEarningBalance = Math.max(0, newBalance - 300000);
    const now = new Date().toISOString();

    const tx: SavingsTransaction = {
      id: `stx-${Date.now()}`,
      receiptOrRef: `OR-WD-${Date.now().toString().slice(-6)}`,
      savingsAccountId: acc.id,
      accountNumber: acc.accountNumber,
      memberId: acc.memberId,
      memberName: acc.memberName,
      type: 'withdrawal',
      amount,
      balanceAfter: newBalance,
      date: now.split('T')[0],
      performedBy,
      notes: notes || 'Over-the-counter savings withdrawal',
      isSynced: true
    };

    const updatedAccount: SavingsAccount = {
      ...acc,
      balance: newBalance,
      earningBalance,
      nonEarningBalance,
      lastTransactionDate: now.split('T')[0],
      isDormant: false,
      daysSinceLastTransaction: 0,
      status: 'active',
      transactions: [tx, ...(acc.transactions || [])],
      version: (acc.version || 1) + 1,
      updatedAt: now
    };

    this.state.savingsAccounts[accIdx] = updatedAccount;
    this.state.savingsTransactions.unshift(tx);

    const member = this.state.members.find(m => m.id === acc.memberId);
    if (member) {
      member.savingsDeposit = newBalance;
      member.version = (member.version || 1) + 1;
      member.updatedAt = now;
    }

    this.addAuditLog('SAVINGS_WITHDRAWAL', performedBy, `Withdrew ₱${amount.toLocaleString()} from account ${acc.accountNumber} (${acc.memberName})`, 'savings', acc.id);
    this.saveToDisk();
    return { success: true, account: updatedAccount, tx };
  }

  // --- Sync & Conflict Engine ---
  public handleSync(queue: QueuedOfflineMutation[]): {
    success: boolean;
    report: SyncReport;
    conflicts: ConflictRecord[];
    state: ServerDatabaseState;
  } {
    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const details: string[] = [];
    const generatedConflicts: ConflictRecord[] = [];
    let itemsUploaded = 0;

    for (const item of queue) {
      if (item.entityType === 'member') {
        const memIdx = this.state.members.findIndex(m => m.id === item.entityId);
        if (memIdx !== -1) {
          const serverMember = this.state.members[memIdx];
          const localPayload = item.payload as Partial<Member>;

          if (serverMember.version > item.clientVersion) {
            // Conflict
            details.push(`Conflict on Member ${serverMember.fullName}. Executed 3-way automatic merge.`);
            const merged: Member = { ...serverMember };

            if (localPayload.phone && localPayload.phone !== serverMember.phone) {
              generatedConflicts.push({
                id: `conf-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                entityType: 'member',
                entityId: serverMember.id,
                field: 'phone',
                localValue: localPayload.phone,
                serverValue: serverMember.phone,
                resolvedValue: localPayload.phone,
                resolutionStrategy: 'field_merge',
                explanation: 'Client updated phone offline. Auto-merged into server record.',
                timestamp: new Date().toISOString(),
                status: 'auto_resolved'
              });
              merged.phone = localPayload.phone;
            }

            if (localPayload.address && localPayload.address !== serverMember.address) {
              generatedConflicts.push({
                id: `conf-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                entityType: 'member',
                entityId: serverMember.id,
                field: 'address',
                localValue: localPayload.address,
                serverValue: serverMember.address,
                resolvedValue: localPayload.address,
                resolutionStrategy: 'field_merge',
                explanation: 'Client updated residential address offline. Auto-merged.',
                timestamp: new Date().toISOString(),
                status: 'auto_resolved'
              });
              merged.address = localPayload.address;
            }

            if (localPayload.shareCapital !== undefined && localPayload.shareCapital !== serverMember.shareCapital) {
              const diff = (localPayload.shareCapital || 0) - (serverMember.shareCapital || 0);
              const finalShare = serverMember.shareCapital + diff;
              generatedConflicts.push({
                id: `conf-srv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                entityType: 'member',
                entityId: serverMember.id,
                field: 'shareCapital',
                localValue: localPayload.shareCapital,
                serverValue: serverMember.shareCapital,
                resolvedValue: finalShare,
                resolutionStrategy: 'additive_balance',
                explanation: `Additive reconciliation for capital share contribution (+₱${diff.toLocaleString()}).`,
                timestamp: new Date().toISOString(),
                status: 'auto_resolved'
              });
              merged.shareCapital = finalShare;
            }

            merged.version = serverMember.version + 1;
            merged.updatedAt = new Date().toISOString();
            this.state.members[memIdx] = merged;
          } else {
            // Direct apply
            this.state.members[memIdx] = {
              ...serverMember,
              ...localPayload,
              version: serverMember.version + 1,
              updatedAt: new Date().toISOString()
            };
            details.push(`Updated member ${this.state.members[memIdx].fullName} on server.`);
          }
          itemsUploaded++;
        }
      } else if (item.entityType === 'loan') {
        if (item.action === 'create') {
          const newLoan = item.payload as LoanApplication;
          const exists = this.state.loans.some(l => l.id === newLoan.id);
          if (!exists) {
            this.state.loans.unshift({
              ...newLoan,
              version: 1,
              updatedAt: new Date().toISOString()
            });
            details.push(`Created loan ${newLoan.loanNumber} from client sync.`);
            itemsUploaded++;
          }
        } else if (item.action === 'update') {
          const loanIdx = this.state.loans.findIndex(l => l.id === item.entityId);
          if (loanIdx !== -1) {
            const serverLoan = this.state.loans[loanIdx];
            const localPayload = item.payload as Partial<LoanApplication>;
            this.state.loans[loanIdx] = {
              ...serverLoan,
              ...localPayload,
              version: serverLoan.version + 1,
              updatedAt: new Date().toISOString()
            };
            details.push(`Updated loan ${serverLoan.loanNumber} from client sync.`);
            itemsUploaded++;
          }
        }
      } else if (item.entityType === 'payment') {
        const tx = item.payload as PaymentTransaction;
        const exists = this.state.transactions.some(t => t.id === tx.id);
        if (!exists) {
          this.state.transactions.unshift({
            ...tx,
            isSynced: true,
            version: 1,
            updatedAt: new Date().toISOString()
          });
          details.push(`Processed payment receipt #${tx.receiptNumber} (₱${tx.amount.toLocaleString()}) via sync.`);
          itemsUploaded++;
        }
      }
    }

    const durationMs = Date.now() - startMs;
    const report: SyncReport = {
      id: `sync-srv-${Date.now()}`,
      startTime,
      endTime: new Date().toISOString(),
      durationMs,
      itemsUploaded,
      itemsDownloaded: this.state.members.length + this.state.loans.length + this.state.transactions.length,
      conflictsDetected: generatedConflicts.length,
      conflictsAutoResolved: generatedConflicts.filter(c => c.status === 'auto_resolved').length,
      status: 'success',
      details: [
        ...details,
        `Server-side sync completed in ${(durationMs / 1000).toFixed(2)}s.`,
        `Ingested ${itemsUploaded} offline actions.`,
        `Auto-resolved ${generatedConflicts.length} conflicts.`
      ]
    };

    this.state.conflicts.unshift(...generatedConflicts);
    this.state.syncReports.unshift(report);
    this.addAuditLog('CLIENT_SYNC_COMPLETED', 'Sync Engine', `Synchronized ${itemsUploaded} offline mutation(s) and auto-resolved ${generatedConflicts.length} conflict(s).`);
    this.saveToDisk();

    return {
      success: true,
      report,
      conflicts: generatedConflicts,
      state: this.state
    };
  }
}

export const serverDb = new ServerDatabase();
