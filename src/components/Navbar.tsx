import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  User, 
  Building2, 
  Lock, 
  CheckCircle2, 
  AlertTriangle,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { Member } from '../types';
import { syncEngine } from '../services/syncEngine';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  activeRole: 'officer' | 'member';
  setActiveRole: (role: 'officer' | 'member') => void;
  selectedMember: Member;
  setSelectedMember: (member: Member) => void;
  allMembers: Member[];
  pendingQueueCount: number;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onOpenVault: () => void;
}

export function Navbar({
  currentTab,
  setCurrentTab,
  activeRole,
  setActiveRole,
  selectedMember,
  setSelectedMember,
  allMembers,
  pendingQueueCount,
  isSyncing,
  onTriggerSync,
  onOpenVault
}: NavbarProps) {
  const [networkMode, setNetworkMode] = useState<'online' | 'offline' | 'slow_3g'>('online');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);

  useEffect(() => {
    syncEngine.setNetworkMode(networkMode);
  }, [networkMode]);

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      {/* Top Banner / Network & Security Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Network Simulator Control */}
          <div className="flex items-center gap-2 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            <span className="text-slate-400 font-medium">Connectivity:</span>
            <button
              id="btn-network-online"
              onClick={() => setNetworkMode('online')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                networkMode === 'online'
                  ? 'bg-emerald-600 text-white font-medium shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-300" />
              <span>Online</span>
            </button>
            <button
              id="btn-network-offline"
              onClick={() => setNetworkMode('offline')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                networkMode === 'offline'
                  ? 'bg-amber-600 text-white font-medium shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-300" />
              <span>Offline Mode</span>
            </button>
            <button
              id="btn-network-slow"
              onClick={() => setNetworkMode('slow_3g')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
                networkMode === 'slow_3g'
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title="Simulate slow internet latency for sync testing"
            >
              <span>Slow 3G</span>
            </button>
          </div>

          {/* Local AES Encryption Badge */}
          <button
            id="btn-vault-security"
            onClick={onOpenVault}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded-md border border-emerald-900/60 transition"
            title="Local Data Encrypted with AES-GCM 256-bit"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200">AES-256 Encrypted Vault</span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded border border-emerald-700">ACTIVE</span>
          </button>
        </div>

        {/* Sync Trigger Action */}
        <div className="flex items-center gap-3">
          {pendingQueueCount > 0 && (
            <span className="flex items-center gap-1 bg-amber-950/80 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[11px]">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              {pendingQueueCount} offline mutation{pendingQueueCount > 1 ? 's' : ''} queued
            </span>
          )}

          <button
            id="btn-sync-trigger"
            onClick={onTriggerSync}
            disabled={isSyncing || networkMode === 'offline'}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium text-xs transition shadow-sm ${
              networkMode === 'offline'
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : isSyncing
                ? 'bg-indigo-700 text-white animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync with Server'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md border border-emerald-400/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                CoopSync Hub
              </h1>
              <span className="text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded">
                Offline-First
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Cooperative Membership & Loan Services (15% p.a. • Max ₱200k)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs sm:text-sm font-medium overflow-x-auto">
          <button
            id="nav-overview"
            onClick={() => setCurrentTab('overview')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
              currentTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Dashboard
          </button>
          <button
            id="nav-members"
            onClick={() => setCurrentTab('members')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
              currentTab === 'members'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Members & Past Due
          </button>
          <button
            id="nav-loans"
            onClick={() => setCurrentTab('loans')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
              currentTab === 'loans'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Loan Services & Calc
          </button>
          <button
            id="nav-savings"
            onClick={() => setCurrentTab('savings')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'savings'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>Savings (3% p.a.)</span>
          </button>
          <button
            id="nav-member-portal"
            onClick={() => setCurrentTab('member_portal')}
            className={`px-3 py-1.5 rounded-md transition whitespace-nowrap ${
              currentTab === 'member_portal'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            Member Portal
          </button>
          <button
            id="nav-sync"
            onClick={() => setCurrentTab('sync')}
            className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 whitespace-nowrap ${
              currentTab === 'sync'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>Sync & Conflicts</span>
            {pendingQueueCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        </nav>

        {/* Member Selector Switcher */}
        <div className="relative">
          <button
            id="btn-member-selector"
            onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700 text-xs transition"
          >
            <div className="w-6 h-6 rounded-full bg-teal-800 text-teal-200 flex items-center justify-center font-bold text-xs">
              {selectedMember.fullName.charAt(0)}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-xs text-white leading-tight truncate max-w-[120px]">
                {selectedMember.fullName}
              </p>
              <p className="text-[10px] text-slate-400">
                {selectedMember.memberNumber}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isMemberDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50">
              <div className="px-3 py-1 border-b border-slate-700/80 mb-1">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Switch Active Member View
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto">
                {allMembers.map((mem) => (
                  <button
                    key={mem.id}
                    id={`select-member-${mem.id}`}
                    onClick={() => {
                      setSelectedMember(mem);
                      setIsMemberDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-700 transition ${
                      selectedMember.id === mem.id ? 'bg-slate-700/80 font-semibold text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-white">{mem.fullName}</p>
                      <p className="text-[10px] text-slate-400">{mem.memberNumber}</p>
                    </div>
                    {mem.status === 'past_due' ? (
                      <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800 px-1 rounded">
                        Past Due
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1 rounded">
                        Active
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
