import { useState } from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  GitMerge, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  Clock, 
  Database, 
  ShieldCheck, 
  Zap, 
  FileCode, 
  ArrowRight,
  Info,
  Sliders
} from 'lucide-react';
import { QueuedOfflineMutation, ConflictRecord, SyncReport } from '../types';
import { syncEngine } from '../services/syncEngine';

interface SyncConflictCenterProps {
  queue: QueuedOfflineMutation[];
  conflicts: ConflictRecord[];
  reports: SyncReport[];
  lastSyncTime: string | null;
  isSyncing: boolean;
  onTriggerSync: () => void;
  onRefreshData: () => void;
}

export function SyncConflictCenter({
  queue,
  conflicts,
  reports,
  lastSyncTime,
  isSyncing,
  onTriggerSync,
  onRefreshData
}: SyncConflictCenterProps) {
  const [networkMode, setNetworkMode] = useState<'online' | 'offline' | 'slow_3g'>(
    syncEngine.getNetworkState().mode
  );
  const [syncProgress, setSyncProgress] = useState<{ pct: number; message: string }>({
    pct: 0,
    message: ''
  });
  const [injectionNotice, setInjectionNotice] = useState<string | null>(null);

  const handleNetworkChange = (mode: 'online' | 'offline' | 'slow_3g') => {
    setNetworkMode(mode);
    syncEngine.setNetworkMode(mode);
  };

  const handleRunSync = async () => {
    try {
      await syncEngine.performSync((pct, msg) => {
        setSyncProgress({ pct, msg });
      });
      onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Sync failed.');
    }
  };

  const handleInjectTestConflict = () => {
    const res = syncEngine.injectServerConflict();
    setInjectionNotice(res.message);
    setTimeout(() => setInjectionNotice(null), 8000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Connectivity Control */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                <GitMerge className="w-3 h-3" />
                Multi-Version Concurrency (MVCC)
              </span>
              <span className="text-xs text-slate-500">
                • 3-Way Merge & Additive Financial Reconciliation
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              Offline Synchronization & Automated Conflict Engine
            </h2>
            <p className="text-xs text-slate-600 max-w-2xl">
              Cooperative members and loan officers can record repayments and applications completely offline. When an internet connection is established, the engine synchronizes changes and automatically resolves data conflicts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="btn-inject-conflict"
              onClick={handleInjectTestConflict}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-300 transition flex items-center gap-1.5"
              title="Inject concurrent server updates to test automated conflict resolution"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate Server Conflict</span>
            </button>

            <button
              id="btn-run-sync-center"
              onClick={handleRunSync}
              disabled={isSyncing || networkMode === 'offline'}
              className={`text-xs font-bold px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-2 ${
                networkMode === 'offline'
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : isSyncing
                  ? 'bg-indigo-600 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Synchronizing...' : 'Execute Full Sync Now'}</span>
            </button>
          </div>
        </div>

        {/* Injected conflict banner */}
        {injectionNotice && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Conflict Injected on Server Database:</strong> {injectionNotice}
            </div>
          </div>
        )}

        {/* Network Mode Simulation Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Network Simulation:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => handleNetworkChange('online')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  networkMode === 'online' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Online (Normal)
              </button>
              <button
                onClick={() => handleNetworkChange('offline')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  networkMode === 'offline' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Offline (No Internet)
              </button>
              <button
                onClick={() => handleNetworkChange('slow_3g')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  networkMode === 'slow_3g' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slow 3G (1800ms)
              </button>
            </div>
          </div>

          <div className="text-slate-500 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Last Sync: {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : 'Never'}</span>
          </div>
        </div>

        {/* Live Progress Bar during Sync */}
        {isSyncing && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-indigo-900">
              <span>{syncProgress.message || 'Syncing cooperative databases...'}</span>
              <span>{syncProgress.pct}%</span>
            </div>
            <div className="w-full bg-indigo-200 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${syncProgress.pct}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Two Column: Pending Offline Queue & Automated Conflict Resolution Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Offline Mutation Queue (Left 5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-700" />
              <h3 className="text-sm font-bold text-slate-900">
                Pending Offline Queue ({queue.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-500">
              Encrypted locally
            </span>
          </div>

          {queue.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-1">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-slate-800">All local changes are synchronized</p>
              <p className="text-slate-400">Offline actions (loan applications, payments) will queue here.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 capitalize">
                      {item.action} {item.entityType}
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      PENDING SYNC
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    ID: {item.entityId} • Ver: v{item.clientVersion}
                  </div>
                  <div className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-slate-100 font-mono truncate">
                    {JSON.stringify(item.payload)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Automated Conflict Resolution Audit Log (Right 7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Automated Conflict Resolution Log ({conflicts.length})
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
              Zero Data Loss
            </span>
          </div>

          {conflicts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto opacity-70" />
              <p className="font-semibold text-slate-700">No conflicts recorded yet</p>
              <p className="text-slate-400 max-w-sm mx-auto">
                When concurrent edits occur on multiple offline devices, the automated 3-way resolver logs its mathematical resolutions here.
              </p>
              <button
                onClick={handleInjectTestConflict}
                className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline"
              >
                Try simulating a conflict
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {conflicts.map((conf) => (
                <div
                  key={conf.id}
                  className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/30 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 capitalize">
                      {conf.entityType}: {conf.field}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                      AUTO-RESOLVED ({conf.resolutionStrategy.replace('_', ' ')})
                    </span>
                  </div>

                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {conf.explanation}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-white p-2 rounded border border-slate-200 text-[10px]">
                    <div>
                      <span className="text-slate-400 block">Local Offline:</span>
                      <strong className="text-slate-800 truncate block">{String(conf.localValue)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Server Concurrent:</span>
                      <strong className="text-slate-800 truncate block">{String(conf.serverValue)}</strong>
                    </div>
                    <div>
                      <span className="text-emerald-700 block font-bold">Resolved Value:</span>
                      <strong className="text-emerald-800 truncate block">{String(conf.resolvedValue)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sync Reports & Audit History */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Historical Synchronization Reports
        </h3>
        {reports.length === 0 ? (
          <p className="text-xs text-slate-500 py-3 text-center">
            No sync operations executed during this session.
          </p>
        ) : (
          <div className="space-y-2">
            {reports.slice(0, 5).map((rep) => (
              <div
                key={rep.id}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Sync Completed ({new Date(rep.endTime).toLocaleTimeString()})</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Duration: {(rep.durationMs / 1000).toFixed(2)}s • Uploaded: {rep.itemsUploaded} • Downloaded: {rep.itemsDownloaded} • Conflicts Resolved: {rep.conflictsAutoResolved}
                  </div>
                </div>

                <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Status: Success
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
