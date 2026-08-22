import { Member, LoanApplication, PaymentTransaction, QueuedOfflineMutation, ConflictRecord, SyncReport, EncryptionVaultState, SavingsAccount, SavingsTransaction } from '../types';
import { cryptoService } from './cryptoService';
import { INITIAL_MEMBERS, generateInitialLoans, INITIAL_TRANSACTIONS, generateInitialSavingsAccounts, generateInitialSavingsTransactions } from '../data/initialData';

const STORAGE_KEYS = {
  VAULT_CIPHER: 'coop_vault_ciphertext',
  VAULT_IV: 'coop_vault_iv',
  VAULT_META: 'coop_vault_meta',
  REMOTE_MOCK_STORE: 'coop_remote_server_mock', // Emulated server database for full sync roundtrips
  SAVED_PASSPHRASE: 'coop_vault_saved_pin'
};

export interface LocalCoopState {
  members: Member[];
  loans: LoanApplication[];
  transactions: PaymentTransaction[];
  savingsAccounts: SavingsAccount[];
  savingsTransactions: SavingsTransaction[];
  offlineQueue: QueuedOfflineMutation[];
  conflicts: ConflictRecord[];
  syncReports: SyncReport[];
  lastSyncTime: string | null;
}

class StorageService {
  private inMemoryState: LocalCoopState | null = null;
  private vaultMeta: EncryptionVaultState = {
    isInitialized: false,
    isUnlocked: true,
    isCustomKeySet: false,
    lastEncryptedAt: new Date().toISOString(),
    payloadCipherSize: 0,
    algorithm: 'AES-GCM (256-bit) + PBKDF2-SHA256'
  };

  /**
   * Initializes the storage engine, loading from encrypted local vault or seeding default dataset.
   */
  public async initialize(customPin?: string): Promise<LocalCoopState> {
    if (customPin) {
      await cryptoService.setPassphrase(customPin);
      this.vaultMeta.isCustomKeySet = true;
    } else {
      const savedPin = localStorage.getItem(STORAGE_KEYS.SAVED_PASSPHRASE);
      if (savedPin) {
        await cryptoService.setPassphrase(savedPin);
        this.vaultMeta.isCustomKeySet = true;
      }
    }

    const cipher = localStorage.getItem(STORAGE_KEYS.VAULT_CIPHER);
    const iv = localStorage.getItem(STORAGE_KEYS.VAULT_IV);

    if (cipher && iv) {
      try {
        const decrypted = await cryptoService.decryptData<LocalCoopState>(cipher, iv);
        // Ensure savings arrays exist in legacy/existing vault data
        if (!decrypted.savingsAccounts || decrypted.savingsAccounts.length === 0) {
          decrypted.savingsAccounts = generateInitialSavingsAccounts();
        }
        if (!decrypted.savingsTransactions) {
          decrypted.savingsTransactions = generateInitialSavingsTransactions();
        }
        this.inMemoryState = decrypted;
        this.vaultMeta.isInitialized = true;
        this.vaultMeta.isUnlocked = true;
        this.vaultMeta.payloadCipherSize = cipher.length;
        this.vaultMeta.lastEncryptedAt = new Date().toISOString();
        return this.inMemoryState;
      } catch (err) {
        console.warn('Encrypted vault locked or decryption failed, falling back or requiring pin:', err);
        this.vaultMeta.isUnlocked = false;
      }
    }

    // Seed default state
    const defaultState: LocalCoopState = {
      members: INITIAL_MEMBERS,
      loans: generateInitialLoans(),
      transactions: INITIAL_TRANSACTIONS,
      savingsAccounts: generateInitialSavingsAccounts(),
      savingsTransactions: generateInitialSavingsTransactions(),
      offlineQueue: [],
      conflicts: [],
      syncReports: [],
      lastSyncTime: new Date(Date.now() - 3600000).toISOString()
    };

    this.inMemoryState = defaultState;
    await this.persistToVault(defaultState);
    this.vaultMeta.isInitialized = true;
    this.vaultMeta.isUnlocked = true;

    // Also initialize server mock store if empty
    if (!localStorage.getItem(STORAGE_KEYS.REMOTE_MOCK_STORE)) {
      this.saveRemoteMockDatabase({
        members: INITIAL_MEMBERS,
        loans: generateInitialLoans(),
        transactions: INITIAL_TRANSACTIONS,
        savingsAccounts: generateInitialSavingsAccounts(),
        savingsTransactions: generateInitialSavingsTransactions(),
      });
    }

    return this.inMemoryState;
  }

  /**
   * Persist current state to encrypted local storage
   */
  public async persistToVault(state: LocalCoopState): Promise<void> {
    this.inMemoryState = state;
    try {
      const { cipherText, iv } = await cryptoService.encryptData(state);
      localStorage.setItem(STORAGE_KEYS.VAULT_CIPHER, cipherText);
      localStorage.setItem(STORAGE_KEYS.VAULT_IV, iv);

      this.vaultMeta.payloadCipherSize = cipherText.length;
      this.vaultMeta.lastEncryptedAt = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.VAULT_META, JSON.stringify(this.vaultMeta));
    } catch (e) {
      console.error('Failed to persist encrypted vault:', e);
    }
  }

  public getState(): LocalCoopState {
    if (!this.inMemoryState) {
      return {
        members: INITIAL_MEMBERS,
        loans: generateInitialLoans(),
        transactions: INITIAL_TRANSACTIONS,
        savingsAccounts: generateInitialSavingsAccounts(),
        savingsTransactions: generateInitialSavingsTransactions(),
        offlineQueue: [],
        conflicts: [],
        syncReports: [],
        lastSyncTime: null
      };
    }
    return this.inMemoryState;
  }

  public getVaultMeta(): EncryptionVaultState {
    return { ...this.vaultMeta };
  }

  public async setVaultCustomPin(pin: string): Promise<boolean> {
    try {
      await cryptoService.setPassphrase(pin);
      if (pin) {
        localStorage.setItem(STORAGE_KEYS.SAVED_PASSPHRASE, pin);
        this.vaultMeta.isCustomKeySet = true;
      } else {
        localStorage.removeItem(STORAGE_KEYS.SAVED_PASSPHRASE);
        this.vaultMeta.isCustomKeySet = false;
      }
      if (this.inMemoryState) {
        await this.persistToVault(this.inMemoryState);
      }
      return true;
    } catch (e) {
      console.error('Failed to change vault PIN:', e);
      return false;
    }
  }

  /**
   * Helper to retrieve the mock remote server database
   */
  public getRemoteMockDatabase(): { 
    members: Member[]; 
    loans: LoanApplication[]; 
    transactions: PaymentTransaction[];
    savingsAccounts?: SavingsAccount[];
    savingsTransactions?: SavingsTransaction[];
  } {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REMOTE_MOCK_STORE);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load remote mock store:', e);
    }
    return {
      members: INITIAL_MEMBERS,
      loans: generateInitialLoans(),
      transactions: INITIAL_TRANSACTIONS,
      savingsAccounts: generateInitialSavingsAccounts(),
      savingsTransactions: generateInitialSavingsTransactions()
    };
  }

  public saveRemoteMockDatabase(data: { 
    members: Member[]; 
    loans: LoanApplication[]; 
    transactions: PaymentTransaction[];
    savingsAccounts?: SavingsAccount[];
    savingsTransactions?: SavingsTransaction[];
  }) {
    try {
      localStorage.setItem(STORAGE_KEYS.REMOTE_MOCK_STORE, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save remote mock store:', e);
    }
  }

  /**
   * Reset to initial dataset
   */
  public async resetData(): Promise<LocalCoopState> {
    const defaultState: LocalCoopState = {
      members: INITIAL_MEMBERS,
      loans: generateInitialLoans(),
      transactions: INITIAL_TRANSACTIONS,
      savingsAccounts: generateInitialSavingsAccounts(),
      savingsTransactions: generateInitialSavingsTransactions(),
      offlineQueue: [],
      conflicts: [],
      syncReports: [],
      lastSyncTime: new Date().toISOString()
    };
    await this.persistToVault(defaultState);
    this.saveRemoteMockDatabase({
      members: INITIAL_MEMBERS,
      loans: generateInitialLoans(),
      transactions: INITIAL_TRANSACTIONS,
      savingsAccounts: generateInitialSavingsAccounts(),
      savingsTransactions: generateInitialSavingsTransactions(),
    });
    return defaultState;
  }
}

export const storageService = new StorageService();
