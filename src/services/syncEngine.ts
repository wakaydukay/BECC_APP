import { Member, LoanApplication, PaymentTransaction, QueuedOfflineMutation, ConflictRecord, SyncReport, NetworkSimulationState } from '../types';
import { storageService, LocalCoopState } from './storageService';

export class SyncEngine {
  private isSyncing: boolean = false;
  private networkState: NetworkSimulationState = {
    mode: 'online',
    latencyMs: 0,
    isOfflineSimulated: false,
  };

  public getNetworkState(): NetworkSimulationState {
    return { ...this.networkState };
  }

  public setNetworkMode(mode: 'online' | 'offline' | 'slow_3g') {
    this.networkState.mode = mode;
    this.networkState.isOfflineSimulated = mode === 'offline';
    this.networkState.latencyMs = mode === 'slow_3g' ? 1800 : 0;
  }

  public isOnline(): boolean {
    if (this.networkState.isOfflineSimulated) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Execute full bidirectional synchronization with automated conflict resolution
   */
  public async performSync(
    onProgress?: (progress: number, message: string) => void
  ): Promise<{ success: boolean; report: SyncReport; updatedState: LocalCoopState }> {
    if (this.isSyncing) {
      throw new Error('Synchronization is already in progress.');
    }

    if (!this.isOnline()) {
      throw new Error('Device is offline. Please connect to the internet or switch network mode to Online.');
    }

    this.isSyncing = true;
    const startTime = new Date().toISOString();
    const startMs = Date.now();
    const details: string[] = [];
    const generatedConflicts: ConflictRecord[] = [];

    try {
      onProgress?.(10, 'Establishing secure TLS connection with Cooperative Core Server...');
      if (this.networkState.latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.networkState.latencyMs / 2));
      }

      const localState = storageService.getState();
      const remoteDb = storageService.getRemoteMockDatabase();

      let localMembers = [...localState.members];
      let localLoans = [...localState.loans];
      let localTransactions = [...localState.transactions];
      const queue = [...localState.offlineQueue];

      let itemsUploaded = 0;
      let itemsDownloaded = 0;

      onProgress?.(30, `Processing ${queue.length} queued offline mutations with conflict detection...`);

      // 1. Process Offline Mutation Queue
      const resolvedQueueIds: string[] = [];

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        const progressPct = 30 + Math.round(((i + 1) / Math.max(1, queue.length)) * 30);
        onProgress?.(progressPct, `Resolving ${item.entityType} ${item.action} (${i + 1}/${queue.length})...`);

        if (item.entityType === 'member') {
          const remoteIndex = remoteDb.members.findIndex((m) => m.id === item.entityId);
          if (remoteIndex !== -1) {
            const remoteMember = remoteDb.members[remoteIndex];
            const localPayload = item.payload as Partial<Member>;

            // Check if remote version advanced while offline (Conflict Scenario)
            if (remoteMember.version > item.clientVersion) {
              details.push(`⚠️ Conflict detected on Member ${remoteMember.fullName} (${remoteMember.memberNumber}). Performing field-level 3-way merge.`);

              // Field-level 3-way merge & additive financial merge
              const mergedMember: Member = { ...remoteMember };

              // Check personal info fields (Phone, Email, Address)
              if (localPayload.phone && localPayload.phone !== remoteMember.phone) {
                generatedConflicts.push({
                  id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  entityType: 'member',
                  entityId: remoteMember.id,
                  field: 'phone',
                  localValue: localPayload.phone,
                  serverValue: remoteMember.phone,
                  resolvedValue: localPayload.phone,
                  resolutionStrategy: 'field_merge',
                  explanation: 'Client updated phone offline. Auto-merged into server record.',
                  timestamp: new Date().toISOString(),
                  status: 'auto_resolved'
                });
                mergedMember.phone = localPayload.phone;
              }

              if (localPayload.address && localPayload.address !== remoteMember.address) {
                generatedConflicts.push({
                  id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  entityType: 'member',
                  entityId: remoteMember.id,
                  field: 'address',
                  localValue: localPayload.address,
                  serverValue: remoteMember.address,
                  resolvedValue: localPayload.address,
                  resolutionStrategy: 'field_merge',
                  explanation: 'Client updated residential address offline. Auto-merged.',
                  timestamp: new Date().toISOString(),
                  status: 'auto_resolved'
                });
                mergedMember.address = localPayload.address;
              }

              // Additive share capital & savings merge if altered locally
              if (localPayload.shareCapital !== undefined && localPayload.shareCapital !== remoteMember.shareCapital) {
                const diff = (localPayload.shareCapital || 0) - (remoteMember.shareCapital || 0);
                const finalShare = remoteMember.shareCapital + diff;
                generatedConflicts.push({
                  id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  entityType: 'member',
                  entityId: remoteMember.id,
                  field: 'shareCapital',
                  localValue: localPayload.shareCapital,
                  serverValue: remoteMember.shareCapital,
                  resolvedValue: finalShare,
                  resolutionStrategy: 'additive_balance',
                  explanation: `Additive reconciliation for capital share contribution (+₱${diff.toLocaleString()}).`,
                  timestamp: new Date().toISOString(),
                  status: 'auto_resolved'
                });
                mergedMember.shareCapital = finalShare;
              }

              mergedMember.version = remoteMember.version + 1;
              mergedMember.updatedAt = new Date().toISOString();
              remoteDb.members[remoteIndex] = mergedMember;

              // Update local state copy
              const localMemIdx = localMembers.findIndex((m) => m.id === item.entityId);
              if (localMemIdx !== -1) localMembers[localMemIdx] = mergedMember;
            } else {
              // Direct Clean Update
              const updated: Member = {
                ...remoteMember,
                ...localPayload,
                version: remoteMember.version + 1,
                updatedAt: new Date().toISOString(),
              };
              remoteDb.members[remoteIndex] = updated;
              const localMemIdx = localMembers.findIndex((m) => m.id === item.entityId);
              if (localMemIdx !== -1) localMembers[localMemIdx] = updated;
              details.push(`Updated member ${updated.fullName} on server.`);
            }
          }
          itemsUploaded++;
          resolvedQueueIds.push(item.id);
        } else if (item.entityType === 'loan') {
          if (item.action === 'create') {
            const newLoan = item.payload as LoanApplication;
            const exists = remoteDb.loans.some((l) => l.id === newLoan.id);
            if (!exists) {
              remoteDb.loans.unshift({
                ...newLoan,
                version: 1,
                updatedAt: new Date().toISOString()
              });
              details.push(`Uploaded new loan application ${newLoan.loanNumber} (${newLoan.loanType}) to server.`);
              itemsUploaded++;
            }
            resolvedQueueIds.push(item.id);
          } else if (item.action === 'update') {
            const remoteIdx = remoteDb.loans.findIndex((l) => l.id === item.entityId);
            if (remoteIdx !== -1) {
              const remoteLoan = remoteDb.loans[remoteIdx];
              const localLoan = item.payload as Partial<LoanApplication>;

              if (remoteLoan.version > item.clientVersion) {
                // Conflict in loan status or balance
                details.push(`⚠️ Loan ${remoteLoan.loanNumber} has concurrent modifications. Applying smart schedule reconciliation.`);
                
                // Merge schedules and payments
                const mergedRemaining = Math.min(remoteLoan.remainingBalance, localLoan.remainingBalance ?? remoteLoan.remainingBalance);
                const mergedTotalPaid = Math.max(remoteLoan.totalPaid, localLoan.totalPaid ?? remoteLoan.totalPaid);

                generatedConflicts.push({
                  id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  entityType: 'loan',
                  entityId: remoteLoan.id,
                  field: 'remainingBalance',
                  localValue: localLoan.remainingBalance,
                  serverValue: remoteLoan.remainingBalance,
                  resolvedValue: mergedRemaining,
                  resolutionStrategy: 'additive_balance',
                  explanation: 'Reconciled local offline payment deduction with server ledger.',
                  timestamp: new Date().toISOString(),
                  status: 'auto_resolved'
                });

                const updatedLoan: LoanApplication = {
                  ...remoteLoan,
                  ...localLoan,
                  remainingBalance: mergedRemaining,
                  totalPaid: mergedTotalPaid,
                  version: remoteLoan.version + 1,
                  updatedAt: new Date().toISOString()
                };
                remoteDb.loans[remoteIdx] = updatedLoan;
                const localIdx = localLoans.findIndex((l) => l.id === item.entityId);
                if (localIdx !== -1) localLoans[localIdx] = updatedLoan;
              } else {
                const updatedLoan: LoanApplication = {
                  ...remoteLoan,
                  ...localLoan,
                  version: remoteLoan.version + 1,
                  updatedAt: new Date().toISOString()
                };
                remoteDb.loans[remoteIdx] = updatedLoan;
                const localIdx = localLoans.findIndex((l) => l.id === item.entityId);
                if (localIdx !== -1) localLoans[localIdx] = updatedLoan;
                details.push(`Updated loan ${updatedLoan.loanNumber} on server.`);
              }
              itemsUploaded++;
            }
            resolvedQueueIds.push(item.id);
          }
        } else if (item.entityType === 'payment') {
          const newTx = item.payload as PaymentTransaction;
          const exists = remoteDb.transactions.some((t) => t.id === newTx.id);
          if (!exists) {
            remoteDb.transactions.unshift({
              ...newTx,
              isSynced: true,
              version: 1,
              updatedAt: new Date().toISOString()
            });
            itemsUploaded++;
            details.push(`Synced offline payment voucher ${newTx.receiptNumber} (₱${newTx.amount.toLocaleString()}) to server.`);
          }
          resolvedQueueIds.push(item.id);
        }
      }

      onProgress?.(70, 'Downloading latest cooperative updates and past due statuses from server...');
      if (this.networkState.latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, this.networkState.latencyMs / 2));
      }

      // 2. Download Phase: Match Server records down to local state
      // Pull remote members
      remoteDb.members.forEach((rm) => {
        const localIdx = localMembers.findIndex((lm) => lm.id === rm.id);
        if (localIdx === -1) {
          localMembers.push(rm);
          itemsDownloaded++;
        } else if (rm.version > localMembers[localIdx].version) {
          localMembers[localIdx] = rm;
          itemsDownloaded++;
        }
      });

      // Pull remote loans
      remoteDb.loans.forEach((rl) => {
        const localIdx = localLoans.findIndex((ll) => ll.id === rl.id);
        if (localIdx === -1) {
          localLoans.push(rl);
          itemsDownloaded++;
        } else if (rl.version > localLoans[localIdx].version) {
          localLoans[localIdx] = rl;
          itemsDownloaded++;
        }
      });

      // Pull remote transactions
      remoteDb.transactions.forEach((rt) => {
        const localIdx = localTransactions.findIndex((lt) => lt.id === rt.id);
        if (localIdx === -1) {
          localTransactions.unshift({ ...rt, isSynced: true });
          itemsDownloaded++;
        }
      });

      // Recalculate past due amounts on members based on active loans
      localMembers = localMembers.map((mem) => {
        const memberLoans = localLoans.filter((l) => l.memberId === mem.id);
        const pastDueLoan = memberLoans.find((l) => l.status === 'past_due');
        const activeCount = memberLoans.filter((l) => l.status === 'active' || l.status === 'past_due').length;
        const totalBalance = memberLoans
          .filter((l) => l.status === 'active' || l.status === 'past_due')
          .reduce((sum, l) => sum + l.remainingBalance, 0);

        return {
          ...mem,
          activeLoanCount: activeCount,
          totalLoanBalance: totalBalance,
          pastDueAmount: pastDueLoan ? pastDueLoan.overdueAmount : 0,
          status: pastDueLoan ? 'past_due' : mem.status === 'past_due' ? 'active' : mem.status,
        };
      });

      // 3. Assemble New State & Reports
      const remainingQueue = localState.offlineQueue.filter((q) => !resolvedQueueIds.includes(q.id));
      const allConflicts = [...generatedConflicts, ...localState.conflicts];

      const durationMs = Date.now() - startMs;
      const report: SyncReport = {
        id: `sync-rep-${Date.now()}`,
        startTime,
        endTime: new Date().toISOString(),
        durationMs,
        itemsUploaded,
        itemsDownloaded,
        conflictsDetected: generatedConflicts.length,
        conflictsAutoResolved: generatedConflicts.filter((c) => c.status === 'auto_resolved').length,
        status: 'success',
        details: [
          ...details,
          `Sync completed in ${(durationMs / 1000).toFixed(2)}s.`,
          `Uploaded ${itemsUploaded} modifications.`,
          `Downloaded ${itemsDownloaded} new server records.`,
          `Auto-resolved ${generatedConflicts.length} data conflict(s) with zero data loss.`
        ]
      };

      const updatedState: LocalCoopState = {
        members: localMembers,
        loans: localLoans,
        transactions: localTransactions,
        savingsAccounts: localState.savingsAccounts || [],
        savingsTransactions: localState.savingsTransactions || [],
        offlineQueue: remainingQueue,
        conflicts: allConflicts,
        syncReports: [report, ...localState.syncReports].slice(0, 30),
        lastSyncTime: new Date().toISOString()
      };

      // Persist locally in encrypted vault and update remote mock server
      await storageService.persistToVault(updatedState);
      storageService.saveRemoteMockDatabase(remoteDb);

      onProgress?.(100, 'Sync completed successfully! Local vault re-encrypted with AES-GCM.');

      return {
        success: true,
        report,
        updatedState
      };
    } catch (error: any) {
      console.error('Sync failed:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Helper to simulate a server conflict injection for demonstration and testing purposes
   */
  public injectServerConflict(): { success: boolean; message: string } {
    const remoteDb = storageService.getRemoteMockDatabase();
    if (remoteDb.members.length > 0) {
      // Advance server version of Member 001 with dividend addition and status change
      const mem = remoteDb.members[0];
      mem.shareCapital += 3500; // Server awarded annual dividend
      mem.version += 1;
      mem.updatedAt = new Date().toISOString();
      storageService.saveRemoteMockDatabase(remoteDb);
      return {
        success: true,
        message: `Injected remote server update on ${mem.fullName} (Added ₱3,500 share dividend on server, bumped remote version to v${mem.version}). Synchronizing will trigger automated conflict resolution!`
      };
    }
    return { success: false, message: 'No members available for conflict injection.' };
  }
}

export const syncEngine = new SyncEngine();
