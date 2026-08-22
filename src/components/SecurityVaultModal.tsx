import { useState, FormEvent } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Key, 
  Download, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  FileCode, 
  Check, 
  AlertTriangle 
} from 'lucide-react';
import { EncryptionVaultState } from '../types';
import { storageService } from '../services/storageService';

interface SecurityVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultMeta: EncryptionVaultState;
  onVaultUpdated: () => void;
}

export function SecurityVaultModal({
  isOpen,
  onClose,
  vaultMeta,
  onVaultUpdated
}: SecurityVaultModalProps) {
  const [newPin, setNewPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [showCiphertext, setShowCiphertext] = useState(false);
  const [copiedCipher, setCopiedCipher] = useState(false);

  if (!isOpen) return null;

  const rawCipher = typeof window !== 'undefined' ? localStorage.getItem('coop_vault_ciphertext') || '' : '';
  const rawIv = typeof window !== 'undefined' ? localStorage.getItem('coop_vault_iv') || '' : '';

  const handleUpdatePin = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPin.trim()) return;
    const success = await storageService.setVaultCustomPin(newPin);
    if (success) {
      setPinSuccess(true);
      setNewPin('');
      onVaultUpdated();
      setTimeout(() => setPinSuccess(false), 4000);
    }
  };

  const handleExportEncryptedBackup = () => {
    const payload = {
      app: 'Cooperative Offline Membership & Loan Services',
      timestamp: new Date().toISOString(),
      algorithm: 'AES-GCM-256',
      ciphertext: rawCipher,
      iv: rawIv,
      meta: vaultMeta
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coop-encrypted-vault-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyCipher = () => {
    navigator.clipboard.writeText(rawCipher);
    setCopiedCipher(true);
    setTimeout(() => setCopiedCipher(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Local Data Encryption Vault
              </h2>
              <p className="text-xs text-slate-400">
                Web Crypto API • AES-GCM (256-bit) • PBKDF2-SHA256
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

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Security Status Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <strong className="text-xs font-bold text-emerald-950">
                  Client-Side Hardware-Accelerated Storage Encryption
                </strong>
              </div>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              All cooperative members, loan balances, repayment receipts, and pending mutations are automatically encrypted in browser memory and local storage before saving. Even if local storage is extracted, member financial data is unreadable without the PBKDF2 derived AES-256 key.
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Cipher Size</span>
              <strong className="text-slate-900 font-mono text-sm block mt-0.5">
                {(rawCipher.length / 1024).toFixed(1)} KB
              </strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Cipher Algorithm</span>
              <strong className="text-slate-900 font-mono text-xs block mt-0.5">
                AES-GCM (256-bit)
              </strong>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-slate-400 block text-[10px] uppercase">Key Derivation</span>
              <strong className="text-slate-900 font-mono text-xs block mt-0.5">
                PBKDF2 100k It.
              </strong>
            </div>
          </div>

          {/* Set / Change Security PIN */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slate-700" />
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Vault Passphrase / Security PIN
              </h3>
            </div>
            <p className="text-[11px] text-slate-600">
              Customize the encryption key used to derive the 256-bit AES master key.
            </p>

            <form onSubmit={handleUpdatePin} className="flex gap-2">
              <input
                id="input-vault-pin"
                type="password"
                placeholder="Enter new master vault PIN / passphrase..."
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <button
                id="btn-update-vault-pin"
                type="submit"
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition"
              >
                Set PIN
              </button>
            </form>

            {pinSuccess && (
              <p className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Vault successfully re-encrypted with new custom master key!</span>
              </p>
            )}
          </div>

          {/* Raw Ciphertext Inspector (Demonstrating Real Encryption) */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-800 text-xs">
                Encrypted Storage Payload (Base64 Ciphertext)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCiphertext(!showCiphertext)}
                  className="text-slate-600 hover:text-slate-900 text-[11px] font-semibold flex items-center gap-1"
                >
                  {showCiphertext ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showCiphertext ? 'Hide' : 'Inspect Cipher'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyCipher}
                  className="text-emerald-700 hover:text-emerald-900 text-[11px] font-semibold"
                >
                  {copiedCipher ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            {showCiphertext ? (
              <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[10px] break-all max-h-28 overflow-y-auto border border-slate-800">
                {rawCipher}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 font-mono">
                [AES-GCM Ciphertext {rawCipher.substring(0, 32)}... • 96-bit IV: {rawIv}]
              </p>
            )}
          </div>

          {/* Actions & Export */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleExportEncryptedBackup}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Encrypted Vault Backup</span>
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
