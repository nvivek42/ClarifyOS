import {
  CheckCircle2,
  Download,
  FileText,
  FolderOpen,
  FolderSync,
  Globe,
  HardDrive,
  KeyRound,
  Lock,
  RefreshCw,
  Sparkles,
  Unplug,
  Upload,
  X,
} from 'lucide-react';
import { isDirectoryPickerSupported } from '../storage/markdownVault';

interface VaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  connectedFolderName: string | null;
  lastVaultSync: string | null;
  isSyncingVault: boolean;
  storagePersisted: boolean | null;
  hasSampleData: boolean;
  username: string | null;
  onLockWorkspace: () => void;
  onChangeCredentials: () => void;
  onConnectVaultFolder: () => void;
  onSyncVaultNow: () => void;
  onLoadFromVaultFolder: () => void;
  onDisconnectVaultFolder: () => void;
  onExportMarkdown: () => void;
  onImportMarkdownClick: () => void;
  onExportJson: () => void;
  onImportJsonClick: () => void;
  onClearSampleData: () => void;
}

export function VaultModal({
  isOpen,
  onClose,
  connectedFolderName,
  lastVaultSync,
  isSyncingVault,
  storagePersisted,
  hasSampleData,
  username,
  onLockWorkspace,
  onChangeCredentials,
  onConnectVaultFolder,
  onSyncVaultNow,
  onLoadFromVaultFolder,
  onDisconnectVaultFolder,
  onExportMarkdown,
  onImportMarkdownClick,
  onExportJson,
  onImportJsonClick,
  onClearSampleData,
}: VaultModalProps) {
  if (!isOpen) return null;

  const pickerSupported = isDirectoryPickerSupported();

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-enter bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 id="vault-modal-title" className="text-base font-semibold text-slate-900 truncate">
                Second Brain Vault &amp; Persistence
              </h3>
              <p className="text-xs text-slate-500 truncate">
                Markdown (.md) file storage, automatic browser persistence, and GitHub Pages hosting.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close vault modal"
            className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Browser Auto-Persistence Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-600" />
                <span>Automatic Browser Persistence</span>
              </h4>
              <span className="text-xs font-mono tabular-nums text-emerald-700 inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{storagePersisted ? 'Persistent Storage Locked' : 'IndexedDB + localStorage Active'}</span>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every task, goal, and experiment change is saved immediately to both IndexedDB and localStorage so your data survives page reloads and browser restarts on your domain.
            </p>
          </div>

          {/* 2. Local Markdown (.md) Vault Folder Sync */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FolderSync className="w-4 h-4 text-indigo-600" />
                <span>Local Markdown (.md) Vault Sync</span>
              </h4>
              {connectedFolderName ? (
                <span className="text-xs font-mono tabular-nums text-indigo-700 font-medium">
                  Connected: {connectedFolderName}
                  {lastVaultSync ? ` · Synced ${lastVaultSync}` : ''}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Not connected</span>
              )}
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Connect a local folder (such as an Obsidian vault or a cloned GitHub second-brain repository). ClarityOS writes clean <code className="font-mono text-slate-800">matrix/eisenhower-matrix.md</code>, <code className="font-mono text-slate-800">goals/*.md</code>, and <code className="font-mono text-slate-800">experiments/*.md</code> files automatically on every edit.
            </p>

            {!pickerSupported ? (
              <p className="text-xs text-amber-700">
                Direct folder sync requires a Chromium desktop browser (Chrome, Edge, or Brave) over HTTPS. On this browser, use Export / Import Markdown (.md) below.
              </p>
            ) : connectedFolderName ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={onSyncVaultNow}
                  disabled={isSyncingVault}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVault ? 'animate-spin' : ''}`} />
                  <span>{isSyncingVault ? 'Syncing...' : 'Sync .md Files Now'}</span>
                </button>
                <button
                  type="button"
                  onClick={onLoadFromVaultFolder}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Load from Folder</span>
                </button>
                <button
                  type="button"
                  onClick={onDisconnectVaultFolder}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Unplug className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            ) : (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={onConnectVaultFolder}
                  className="min-h-[44px] px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Connect Local .md Vault Folder</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. Portable Markdown & JSON Backups */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Portable Second Brain (.md) &amp; JSON Backups
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Export your entire workspace as a single structured Markdown file (<code className="font-mono text-slate-800">clarityos-second-brain.md</code>) or JSON snapshot, and import it back on any browser or device.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={onExportMarkdown}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-indigo-600" />
                <span>Export Second Brain (.md)</span>
              </button>
              <button
                type="button"
                onClick={onImportMarkdownClick}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Import Second Brain (.md)</span>
              </button>
              <button
                type="button"
                onClick={onExportJson}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Export Data (JSON)</span>
              </button>
              <button
                type="button"
                onClick={onImportJsonClick}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Import Data (JSON)</span>
              </button>
            </div>

            {hasSampleData && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClearSampleData}
                  className="min-h-[44px] px-4 py-2 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Clear Sample Data</span>
                </button>
              </div>
            )}
          </div>

          {/* 4. Passcode & Security */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600" />
                <span>Passcode &amp; Access Protection</span>
              </h4>
              {username && (
                <span className="text-xs font-medium text-slate-500">
                  Signed in as: <strong className="text-slate-800 font-semibold">{username}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Your personal tasks, strategic goals, and Second Brain notes are protected by a client-side SHA-256 master passcode so anyone accessing this URL must authenticate.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={onLockWorkspace}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Workspace Now</span>
              </button>
              <button
                type="button"
                onClick={onChangeCredentials}
                className="min-h-[44px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Change Passcode</span>
              </button>
            </div>
          </div>

          {/* 5. GitHub Pages + Cloudflare Custom Domain Checklist */}
          <div className="pt-5 border-t border-slate-200 space-y-2.5">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-600" />
              <span>GitHub Pages + Cloudflare Custom Domain Ready</span>
            </h4>
            <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>
                Push this repository to GitHub (the included <code className="font-mono text-slate-800">.github/workflows/deploy.yml</code> automatically builds and publishes <code className="font-mono text-slate-800">dist/</code>).
              </li>
              <li>
                In GitHub <strong className="font-medium text-slate-800">Settings → Pages</strong>, set Source to <strong className="font-medium text-slate-800">GitHub Actions</strong> and enter your custom domain.
              </li>
              <li>
                In Cloudflare DNS, point your subdomain (<code className="font-mono text-slate-800">CNAME → &lt;username&gt;.github.io</code>) or apex domain (<code className="font-mono text-slate-800">A</code> records to GitHub Pages IPs) with SSL/TLS set to <strong className="font-medium text-slate-800">Full (strict)</strong>.
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition-colors whitespace-nowrap"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
