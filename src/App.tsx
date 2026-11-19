import React, { useEffect, useRef, useState } from 'react';
import { FileText, Lock } from 'lucide-react';
import { AuthLockScreen } from './components/AuthLockScreen';
import { ConfirmModal } from './components/ConfirmModal';
import { ExperimentModal } from './components/ExperimentModal';
import { ExperimentsView } from './components/ExperimentsView';
import { LongTermGoalModal } from './components/LongTermGoalModal';
import { LongTermGoalsView } from './components/LongTermGoalsView';
import { MatrixView } from './components/MatrixView';
import { TaskModal } from './components/TaskModal';
import { VaultModal } from './components/VaultModal';
import { formatTimestamp, generateId } from './data/seedData';
import {
  disableAuth,
  getStoredAuth,
  isSessionUnlocked,
  lockSession,
} from './storage/auth';
import {
  FSDirectoryHandle,
  loadStateFromDirectoryVault,
  parseFullSecondBrainMarkdown,
  serializeFullSecondBrainMarkdown,
  syncStateToDirectoryVault,
} from './storage/markdownVault';
import {
  hasLocalStorageKey,
  loadInitialStateSync,
  loadStateFromIndexedDB,
  persistState,
  requestPersistentStorage,
} from './storage/persistence';
import {
  ActiveTab,
  AppState,
  LongTermGoal,
  QuadrantId,
  ShortTermExperiment,
  TaskItem,
} from './types';

interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
  onConfirm: () => void;
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isSessionUnlocked());
  const [authUsername, setAuthUsername] = useState<string | null>(
    () => getStoredAuth()?.username || null
  );
  const [state, setState] = useState<AppState>(() => loadInitialStateSync());
  const [storageReady, setStorageReady] = useState<boolean>(() => hasLocalStorageKey());
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('matrix');

  // Modals
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [ltModalOpen, setLtModalOpen] = useState(false);
  const [editingLTGoalId, setEditingLTGoalId] = useState<string | null>(null);
  const [expModalOpen, setExpModalOpen] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [vaultModalOpen, setVaultModalOpen] = useState(false);

  // Local Markdown (.md) Vault Folder state
  const vaultDirRef = useRef<FSDirectoryHandle | null>(null);
  const [connectedFolderName, setConnectedFolderName] = useState<string | null>(null);
  const [lastVaultSync, setLastVaultSync] = useState<string | null>(null);
  const [isSyncingVault, setIsSyncingVault] = useState(false);

  const jsonInputRef = useRef<HTMLInputElement>(null);
  const mdInputRef = useRef<HTMLInputElement>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    destructive: false,
    onConfirm: () => {},
  });

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateId('toast');
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  };

  // Recover from IndexedDB if localStorage was empty, and request persistent browser storage
  useEffect(() => {
    let active = true;
    (async () => {
      const persisted = await requestPersistentStorage();
      if (active) setStoragePersisted(persisted);

      if (!hasLocalStorageKey()) {
        const idbState = await loadStateFromIndexedDB();
        if (active && idbState) {
          setState(idbState);
        }
      }
      if (active) setStorageReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  // Auto-persist to localStorage + IndexedDB + connected .md Vault folder
  useEffect(() => {
    if (!storageReady) return;
    let cancelled = false;

    (async () => {
      const ok = await persistState(state);
      if (!ok && !cancelled) {
        notify('Browser storage limit reached. Export a Markdown or JSON backup.', 'error');
      }

      if (vaultDirRef.current && !cancelled) {
        try {
          setIsSyncingVault(true);
          await syncStateToDirectoryVault(vaultDirRef.current, state);
          if (!cancelled) {
            setLastVaultSync(formatTimestamp(new Date()));
          }
        } catch {
          if (!cancelled) {
            notify('Could not write to connected .md folder. Please reconnect.', 'error');
            vaultDirRef.current = null;
            setConnectedFolderName(null);
          }
        } finally {
          if (!cancelled) setIsSyncingVault(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state, storageReady]);

  // Global Escape key handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (confirmState.isOpen) {
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      } else if (vaultModalOpen) {
        setVaultModalOpen(false);
      } else if (editingTask) {
        setEditingTask(null);
      } else if (ltModalOpen) {
        setLtModalOpen(false);
      } else if (expModalOpen) {
        setExpModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmState.isOpen, vaultModalOpen, editingTask, ltModalOpen, expModalOpen]);

  const hasSampleData =
    state.tasks.some((t) => t.isSample) ||
    state.longTermGoals.some((g) => g.isSample) ||
    state.shortTermExperiments.some((e) => e.isSample);

  const activeTasksCount = state.tasks.filter((t) => !t.completed).length;

  // ==================== TASK HANDLERS ====================
  const handleAddTask = (title: string, quadrant: QuadrantId, goalId: string | null) => {
    const newTask: TaskItem = {
      id: generateId('task'),
      title,
      notes: '',
      quadrant,
      completed: false,
      goalId,
      createdAt: Date.now(),
    };
    setState((prev) => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    notify('Task added and saved.');
  };

  const handleToggleComplete = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }));
  };

  const handleMoveQuadrant = (id: string, quadrant: QuadrantId) => {
    const target = state.tasks.find((t) => t.id === id);
    if (!target || target.quadrant === quadrant) return;
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, quadrant } : t)),
    }));
    const labels: Record<QuadrantId, string> = {
      do: 'Do First',
      schedule: 'Schedule',
      delegate: 'Delegate',
      eliminate: 'Eliminate',
    };
    notify(`Moved to ${labels[quadrant]}.`, 'info');
  };

  const handleSaveTaskEdit = (updated: {
    id: string;
    title: string;
    quadrant: QuadrantId;
    goalId: string | null;
    notes: string;
  }) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === updated.id
          ? {
              ...t,
              title: updated.title,
              quadrant: updated.quadrant,
              goalId: updated.goalId,
              notes: updated.notes,
            }
          : t
      ),
    }));
    setEditingTask(null);
    notify('Task updated.');
  };

  const handleDeleteTask = (id: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    setEditingTask(null);
    notify('Task deleted.');
  };

  const handleClearCompleted = () => {
    const count = state.tasks.filter((t) => t.completed).length;
    if (count === 0) return;
    setConfirmState({
      isOpen: true,
      title: 'Clear Completed Tasks?',
      message: `Remove ${count} completed ${count === 1 ? 'task' : 'tasks'} from the Eisenhower Matrix?`,
      confirmLabel: 'Clear Completed',
      destructive: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => !t.completed),
        }));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        notify('Completed tasks cleared.');
      },
    });
  };

  // ==================== LONG-TERM GOAL HANDLERS ====================
  const handleOpenLTGoal = (goal: LongTermGoal | null) => {
    setEditingLTGoalId(goal ? goal.id : null);
    setLtModalOpen(true);
  };

  const handleSaveLTGoal = (
    data: Omit<LongTermGoal, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ): string | null => {
    const now = Date.now();
    if (existingId) {
      setState((prev) => ({
        ...prev,
        longTermGoals: prev.longTermGoals.map((g) =>
          g.id === existingId ? { ...g, ...data, updatedAt: now } : g
        ),
      }));
      return existingId;
    } else {
      const newId = generateId('lt');
      const newGoal: LongTermGoal = {
        id: newId,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      setState((prev) => ({
        ...prev,
        longTermGoals: [newGoal, ...prev.longTermGoals],
      }));
      setEditingLTGoalId(newId);
      return newId;
    }
  };

  const handleDeleteLTGoal = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Long-Term Goal?',
      message:
        'This goal will be permanently removed. Any Matrix tasks linked to it will remain as unlinked tasks.',
      confirmLabel: 'Delete Goal',
      destructive: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          longTermGoals: prev.longTermGoals.filter((g) => g.id !== id),
          tasks: prev.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        }));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setLtModalOpen(false);
        setEditingLTGoalId(null);
        notify('Long-term goal deleted.');
      },
    });
  };

  // ==================== EXPERIMENT HANDLERS ====================
  const handleOpenExperiment = (exp: ShortTermExperiment | null) => {
    setEditingExpId(exp ? exp.id : null);
    setExpModalOpen(true);
  };

  const handleSaveExperiment = (
    data: Omit<ShortTermExperiment, 'id' | 'createdAt' | 'updatedAt'>,
    existingId?: string
  ) => {
    const now = Date.now();
    if (existingId) {
      setState((prev) => ({
        ...prev,
        shortTermExperiments: prev.shortTermExperiments.map((x) =>
          x.id === existingId ? { ...x, ...data, updatedAt: now } : x
        ),
      }));
    } else {
      const newExp: ShortTermExperiment = {
        id: generateId('exp'),
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      setState((prev) => ({
        ...prev,
        shortTermExperiments: [newExp, ...prev.shortTermExperiments],
      }));
    }
    notify('Experiment saved.');
  };

  const handleDeleteExperiment = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: 'Delete Experiment?',
      message:
        'This experiment and its feedback log will be removed. Linked Matrix tasks will become unlinked.',
      confirmLabel: 'Delete Experiment',
      destructive: true,
      onConfirm: () => {
        setState((prev) => ({
          ...prev,
          shortTermExperiments: prev.shortTermExperiments.filter((e) => e.id !== id),
          tasks: prev.tasks.map((t) => (t.goalId === id ? { ...t, goalId: null } : t)),
        }));
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        setExpModalOpen(false);
        setEditingExpId(null);
        notify('Experiment deleted.');
      },
    });
  };

  // ==================== GOAL-TO-MATRIX BRIDGE ====================
  const handleSpawnTaskFromGoal = (goalId: string, title: string, quadrant: QuadrantId) => {
    handleAddTask(title, quadrant, goalId);
  };

  const handleJumpToGoal = (goalId: string) => {
    const lt = state.longTermGoals.find((g) => g.id === goalId);
    if (lt) {
      setActiveTab('long-term');
      handleOpenLTGoal(lt);
      return;
    }
    const exp = state.shortTermExperiments.find((e) => e.id === goalId);
    if (exp) {
      setActiveTab('experiments');
      handleOpenExperiment(exp);
    }
  };

  // ==================== MARKDOWN VAULT & BACKUP HANDLERS ====================
  const handleConnectVaultFolder = async () => {
    if (!window.showDirectoryPicker) {
      notify('Folder picker is unavailable in this browser. Use .md Export/Import.', 'error');
      return;
    }
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        id: 'clarityos-second-brain',
      });
      vaultDirRef.current = dirHandle;
      setConnectedFolderName(dirHandle.name);
      setIsSyncingVault(true);
      await syncStateToDirectoryVault(dirHandle, state);
      setLastVaultSync(formatTimestamp(new Date()));
      notify(`Connected "${dirHandle.name}" and synced .md files.`);
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        notify('Failed to access the selected folder.', 'error');
      }
    } finally {
      setIsSyncingVault(false);
    }
  };

  const handleSyncVaultNow = async () => {
    if (!vaultDirRef.current) return;
    try {
      setIsSyncingVault(true);
      await syncStateToDirectoryVault(vaultDirRef.current, state);
      setLastVaultSync(formatTimestamp(new Date()));
      notify('Synced workspace to .md vault folder.');
    } catch {
      notify('Failed to sync .md vault folder.', 'error');
    } finally {
      setIsSyncingVault(false);
    }
  };

  const handleLoadFromVaultFolder = async () => {
    if (!vaultDirRef.current) return;
    try {
      const loaded = await loadStateFromDirectoryVault(vaultDirRef.current);
      if (
        loaded.tasks.length === 0 &&
        loaded.longTermGoals.length === 0 &&
        loaded.shortTermExperiments.length === 0
      ) {
        notify('No ClarityOS .md files found in this folder yet.', 'info');
        return;
      }
      setConfirmState({
        isOpen: true,
        title: 'Load from Markdown Vault?',
        message: `Replace current browser workspace with ${loaded.tasks.length} tasks, ${loaded.longTermGoals.length} goals, and ${loaded.shortTermExperiments.length} experiments from "${connectedFolderName}"?`,
        confirmLabel: 'Load from .md Vault',
        destructive: false,
        onConfirm: () => {
          setState(loaded);
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
          notify('Loaded workspace from .md vault.');
        },
      });
    } catch {
      notify('Could not read .md files from the connected folder.', 'error');
    }
  };

  const handleDisconnectVaultFolder = () => {
    vaultDirRef.current = null;
    setConnectedFolderName(null);
    setLastVaultSync(null);
    notify('Disconnected local .md vault folder.', 'info');
  };

  const handleExportMarkdown = () => {
    const md = serializeFullSecondBrainMarkdown(state);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarityos-second-brain-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Second Brain exported as Markdown (.md).');
  };

  const handleImportMarkdownFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = parseFullSecondBrainMarkdown(String(ev.target?.result || ''));
        setConfirmState({
          isOpen: true,
          title: 'Import Markdown Second Brain?',
          message: `Replace current workspace with ${parsed.tasks.length} tasks, ${parsed.longTermGoals.length} long-term goals, and ${parsed.shortTermExperiments.length} experiments from Markdown?`,
          confirmLabel: 'Import .md Vault',
          destructive: false,
          onConfirm: () => {
            setState(parsed);
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            setVaultModalOpen(false);
            notify('Second Brain Markdown imported.');
          },
        });
      } catch {
        notify('Could not parse Markdown file. Please choose a valid ClarityOS .md export.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExportJSON = () => {
    const payload = JSON.stringify(state, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clarityos-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    notify('Backup exported as JSON.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || ''));
        if (
          !parsed ||
          !Array.isArray(parsed.tasks) ||
          !Array.isArray(parsed.longTermGoals) ||
          !Array.isArray(parsed.shortTermExperiments)
        ) {
          throw new Error('Invalid ClarityOS backup format.');
        }

        setConfirmState({
          isOpen: true,
          title: 'Import JSON Backup?',
          message: `Replace current workspace with ${parsed.tasks.length} tasks, ${parsed.longTermGoals.length} long-term goals, and ${parsed.shortTermExperiments.length} experiments?`,
          confirmLabel: 'Import & Replace',
          destructive: false,
          onConfirm: () => {
            setState({
              version: 1,
              tasks: parsed.tasks,
              longTermGoals: parsed.longTermGoals,
              shortTermExperiments: parsed.shortTermExperiments,
            });
            setConfirmState((prev) => ({ ...prev, isOpen: false }));
            setVaultModalOpen(false);
            notify('Workspace imported successfully.');
          },
        });
      } catch {
        notify('Invalid JSON backup file. Please select a valid ClarityOS export.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleClearSampleData = () => {
    setConfirmState({
      isOpen: true,
      title: 'Clear Sample Data?',
      message:
        'This removes the pre-populated sample tasks, sample goal, and sample experiment while preserving everything you created.',
      confirmLabel: 'Clear Sample Data',
      destructive: false,
      onConfirm: () => {
        setState((prev) => {
          const removedIds = new Set([
            ...prev.longTermGoals.filter((g) => g.isSample).map((g) => g.id),
            ...prev.shortTermExperiments.filter((e) => e.isSample).map((e) => e.id),
          ]);
          return {
            ...prev,
            tasks: prev.tasks
              .filter((t) => !t.isSample)
              .map((t) => (t.goalId && removedIds.has(t.goalId) ? { ...t, goalId: null } : t)),
            longTermGoals: prev.longTermGoals.filter((g) => !g.isSample),
            shortTermExperiments: prev.shortTermExperiments.filter((e) => !e.isSample),
          };
        });
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
        notify('Sample data cleared. Workspace is ready.');
      },
    });
  };

  const handleLockWorkspace = () => {
    lockSession();
    setIsAuthenticated(false);
    setVaultModalOpen(false);
    notify('Workspace locked.', 'info');
  };

  const handleChangeCredentials = () => {
    setConfirmState({
      isOpen: true,
      title: 'Change Credentials?',
      message:
        'This will lock the workspace and allow you to configure a new username and password.',
      confirmLabel: 'Reset & Change',
      destructive: false,
      onConfirm: () => {
        disableAuth();
        setAuthUsername(null);
        setIsAuthenticated(false);
        setVaultModalOpen(false);
        setConfirmState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const activeLTGoal = editingLTGoalId
    ? state.longTermGoals.find((g) => g.id === editingLTGoalId) || null
    : null;
  const activeExp = editingExpId
    ? state.shortTermExperiments.find((e) => e.id === editingExpId) || null
    : null;

  if (!isAuthenticated) {
    return (
      <AuthLockScreen
        onAuthenticated={(user) => {
          setAuthUsername(user);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-zinc-900">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-zinc-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Single-element brand wordmark */}
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className="font-display text-lg font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 rounded"
          >
            ClarityOS
          </button>

          {/* Zone 2: Primary Navigation (Desktop) */}
          <nav
            aria-label="Workspace Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            <button
              type="button"
              onClick={() => setActiveTab('matrix')}
              className={`min-h-[44px] px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'matrix'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>Matrix</span>
              <span className="font-mono tabular-nums text-xs text-zinc-400">
                {activeTasksCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('long-term')}
              className={`min-h-[44px] px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'long-term'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>Long-Term Goals</span>
              <span className="font-mono tabular-nums text-xs text-zinc-400">
                {state.longTermGoals.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('experiments')}
              className={`min-h-[44px] px-1 border-b-2 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === 'experiments'
                  ? 'border-zinc-900 text-zinc-900 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <span>Experiments</span>
              <span className="font-mono tabular-nums text-xs text-zinc-400">
                {state.shortTermExperiments.length}
              </span>
            </button>
          </nav>

          {/* Zone 3: Second Brain (.md) & Lock Workspace */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setVaultModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{connectedFolderName ? `Vault: ${connectedFolderName}` : 'Second Brain (.md)'}</span>
            </button>
            <button
              type="button"
              onClick={handleLockWorkspace}
              title="Lock Workspace"
              aria-label="Lock Workspace"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors shrink-0 shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <input
          ref={mdInputRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          className="hidden"
          onChange={handleImportMarkdownFile}
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleImportJsonFile}
        />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-4">
        {/* Mobile Workspace Navigation */}
        <nav
          aria-label="Mobile Workspace Navigation"
          className="md:hidden grid grid-cols-3 gap-1 p-1 bg-zinc-200/60 rounded-xl"
        >
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'matrix' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600'
            }`}
          >
            <span>Matrix</span>
            <span className="font-mono tabular-nums text-[11px] text-zinc-400">
              {activeTasksCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('long-term')}
            className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'long-term' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600'
            }`}
          >
            <span>Goals</span>
            <span className="font-mono tabular-nums text-[11px] text-zinc-400">
              {state.longTermGoals.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('experiments')}
            className={`min-h-[44px] px-2 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'experiments' ? 'bg-white text-zinc-900 shadow-xs font-semibold' : 'text-zinc-600'
            }`}
          >
            <span>Experiments</span>
            <span className="font-mono tabular-nums text-[11px] text-zinc-400">
              {state.shortTermExperiments.length}
            </span>
          </button>
        </nav>

        {/* Subtle Sample Data Notice */}
        {hasSampleData && (
          <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-xs text-amber-950">
            <span>
              Pre-populated with sample workspace data so you can explore the workflow immediately.
            </span>
            <button
              type="button"
              onClick={handleClearSampleData}
              className="min-h-[36px] px-3 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 font-semibold transition-colors whitespace-nowrap shrink-0 shadow-2xs"
            >
              Clear Sample Data
            </button>
          </div>
        )}

        {/* Active View */}
        {activeTab === 'matrix' && (
          <MatrixView
            tasks={state.tasks}
            longTermGoals={state.longTermGoals}
            experiments={state.shortTermExperiments}
            onAddTask={handleAddTask}
            onToggleComplete={handleToggleComplete}
            onMoveQuadrant={handleMoveQuadrant}
            onEditTask={setEditingTask}
            onDeleteTask={handleDeleteTask}
            onClearCompleted={handleClearCompleted}
            onJumpToGoal={handleJumpToGoal}
          />
        )}

        {activeTab === 'long-term' && (
          <LongTermGoalsView
            goals={state.longTermGoals}
            tasks={state.tasks}
            onOpenGoal={handleOpenLTGoal}
          />
        )}

        {activeTab === 'experiments' && (
          <ExperimentsView
            experiments={state.shortTermExperiments}
            tasks={state.tasks}
            onOpenExperiment={handleOpenExperiment}
          />
        )}
      </main>

      {/* Modals */}
      <TaskModal
        task={editingTask}
        longTermGoals={state.longTermGoals}
        experiments={state.shortTermExperiments}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTaskEdit}
        onDelete={handleDeleteTask}
      />

      <LongTermGoalModal
        isOpen={ltModalOpen}
        goal={activeLTGoal}
        linkedTaskCount={
          activeLTGoal ? state.tasks.filter((t) => t.goalId === activeLTGoal.id).length : 0
        }
        onClose={() => setLtModalOpen(false)}
        onSave={handleSaveLTGoal}
        onDelete={handleDeleteLTGoal}
        onSpawnTask={handleSpawnTaskFromGoal}
        onNotify={notify}
      />

      <ExperimentModal
        isOpen={expModalOpen}
        experiment={activeExp}
        linkedTaskCount={
          activeExp ? state.tasks.filter((t) => t.goalId === activeExp.id).length : 0
        }
        onClose={() => setExpModalOpen(false)}
        onSave={handleSaveExperiment}
        onDelete={handleDeleteExperiment}
        onSpawnTask={handleSpawnTaskFromGoal}
        onNotify={notify}
      />

      <VaultModal
        isOpen={vaultModalOpen}
        onClose={() => setVaultModalOpen(false)}
        connectedFolderName={connectedFolderName}
        lastVaultSync={lastVaultSync}
        isSyncingVault={isSyncingVault}
        storagePersisted={storagePersisted}
        hasSampleData={hasSampleData}
        username={authUsername}
        onLockWorkspace={handleLockWorkspace}
        onChangeCredentials={handleChangeCredentials}
        onConnectVaultFolder={handleConnectVaultFolder}
        onSyncVaultNow={handleSyncVaultNow}
        onLoadFromVaultFolder={handleLoadFromVaultFolder}
        onDisconnectVaultFolder={handleDisconnectVaultFolder}
        onExportMarkdown={handleExportMarkdown}
        onImportMarkdownClick={() => mdInputRef.current?.click()}
        onExportJson={handleExportJSON}
        onImportJsonClick={() => jsonInputRef.current?.click()}
        onClearSampleData={handleClearSampleData}
      />

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Toast Notifications */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const styles = {
            success: 'bg-slate-900 text-white border-slate-800',
            error: 'bg-rose-600 text-white border-rose-700',
            info: 'bg-indigo-600 text-white border-indigo-700',
          };
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto px-4 py-3 rounded-lg border shadow-lg text-xs font-medium modal-enter ${styles[toast.type]}`}
            >
              {toast.message}
            </div>
          );
        })}
      </div>
    </div>
  );
}
