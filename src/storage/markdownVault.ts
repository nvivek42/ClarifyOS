import { generateId } from '../data/seedData';
import {
  AppState,
  FeedbackEntry,
  LongTermGoal,
  LongTermGoalStatus,
  QuadrantId,
  ReassessmentStatus,
  ShortTermExperiment,
  TaskItem,
} from '../types';

// Minimal TypeScript declarations for the File System Access API
export interface FSFileHandle {
  kind: 'file';
  name: string;
  getFile: () => Promise<File>;
  createWritable: () => Promise<{
    write: (data: string) => Promise<void>;
    close: () => Promise<void>;
  }>;
}

export interface FSDirectoryHandle {
  kind: 'directory';
  name: string;
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean }
  ) => Promise<FSDirectoryHandle>;
  getFileHandle: (name: string, options?: { create?: boolean }) => Promise<FSFileHandle>;
  removeEntry: (name: string) => Promise<void>;
  values: () => AsyncIterable<FSFileHandle | FSDirectoryHandle>;
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite';
      id?: string;
    }) => Promise<FSDirectoryHandle>;
  }
}

export function isDirectoryPickerSupported(): boolean {
  return typeof window !== 'undefined' && typeof window.showDirectoryPicker === 'function';
}

function slugify(text: string): string {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'untitled';
}

function yamlEscape(val: string): string {
  return `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
}

function parseFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    meta[key] = val;
  }
  return { meta, body: match[2] };
}

function extractSections(body: string, headingPrefix = '## '): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = body.split(/\r?\n/);
  let currentKey: string | null = null;
  let buffer: string[] = [];

  for (const line of lines) {
    if (line.startsWith(headingPrefix)) {
      if (currentKey !== null) {
        sections[currentKey] = buffer.join('\n').trim();
      }
      currentKey = line.slice(headingPrefix.length).trim();
      buffer = [];
    } else if (currentKey !== null) {
      buffer.push(line);
    }
  }
  if (currentKey !== null) {
    sections[currentKey] = buffer.join('\n').trim();
  }
  return sections;
}

// ==================== SERIALIZERS ====================

export function serializeLongTermGoalMarkdown(goal: LongTermGoal): string {
  return [
    '---',
    `type: long-term-goal`,
    `id: ${yamlEscape(goal.id)}`,
    `title: ${yamlEscape(goal.title)}`,
    `status: ${goal.status}`,
    `createdAt: ${goal.createdAt}`,
    `updatedAt: ${goal.updatedAt}`,
    goal.isSample ? `isSample: true` : null,
    '---',
    '',
    `# ${goal.title}`,
    '',
    '## 1. What',
    goal.what || '',
    '',
    '## 2. Why',
    goal.why || '',
    '',
    '## 3. When',
    goal.when || '',
    '',
    '## 4. How',
    goal.how || '',
    '',
    '## 5. Where',
    goal.where || '',
    '',
    '## 6. Who',
    goal.who || '',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

export function serializeExperimentMarkdown(exp: ShortTermExperiment): string {
  const logLines =
    exp.feedbackLog.length > 0
      ? exp.feedbackLog.map(
          (entry) => `- **${entry.timestamp}** <!-- logId:${entry.id} -->: ${entry.note}`
        )
      : ['_No observations recorded yet._'];

  return [
    '---',
    `type: experiment`,
    `id: ${yamlEscape(exp.id)}`,
    `title: ${yamlEscape(exp.title)}`,
    `timeframe: ${yamlEscape(exp.timeframe)}`,
    `reassessment: ${exp.reassessment}`,
    `createdAt: ${exp.createdAt}`,
    `updatedAt: ${exp.updatedAt}`,
    exp.isSample ? `isSample: true` : null,
    '---',
    '',
    `# ${exp.title}`,
    '',
    '## Hypothesis',
    exp.hypothesis || '',
    '',
    '## Action Steps',
    exp.actionSteps || '',
    '',
    '## Chronological Feedback Log',
    ...logLines,
    '',
    '## Next Iteration',
    exp.nextIteration || '',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

const QUADRANT_HEADINGS: Array<{ id: QuadrantId; heading: string }> = [
  { id: 'do', heading: '1. Do First (Urgent & Important)' },
  { id: 'schedule', heading: '2. Schedule (Not Urgent & Important)' },
  { id: 'delegate', heading: '3. Delegate (Urgent & Not Important)' },
  { id: 'eliminate', heading: '4. Eliminate (Not Urgent & Not Important)' },
];

export function serializeMatrixMarkdown(state: AppState): string {
  const findGoalTitle = (goalId: string | null) => {
    if (!goalId) return null;
    const lt = state.longTermGoals.find((g) => g.id === goalId);
    if (lt) return lt.title;
    const exp = state.shortTermExperiments.find((e) => e.id === goalId);
    if (exp) return exp.title;
    return null;
  };

  const lines: string[] = [
    '---',
    'type: eisenhower-matrix',
    `updatedAt: ${Date.now()}`,
    '---',
    '',
    '# Eisenhower Matrix',
    '',
  ];

  for (const { id, heading } of QUADRANT_HEADINGS) {
    lines.push(`## ${heading}`);
    const qTasks = state.tasks.filter((t) => t.quadrant === id);
    if (qTasks.length === 0) {
      lines.push('_No tasks in this quadrant._');
    } else {
      for (const task of qTasks) {
        const check = task.completed ? 'x' : ' ';
        const goalTitle = findGoalTitle(task.goalId);
        const goalTag = task.goalId && goalTitle ? ` [[${goalTitle}]]` : '';
        const metaObj = {
          id: task.id,
          goalId: task.goalId,
          createdAt: task.createdAt,
          ...(task.isSample ? { isSample: true } : {}),
        };
        lines.push(
          `- [${check}] ${task.title}${goalTag} <!-- clarity:${JSON.stringify(metaObj)} -->`
        );
        if (task.notes) {
          for (const noteLine of task.notes.split(/\r?\n/)) {
            lines.push(`  > ${noteLine}`);
          }
        }
      }
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function serializeIndexMarkdown(state: AppState): string {
  const activeCount = state.tasks.filter((t) => !t.completed).length;
  const completedCount = state.tasks.filter((t) => t.completed).length;

  const lines: string[] = [
    '# ClarityOS Second Brain Vault',
    '',
    `> Synced ${new Date().toLocaleString()} · ${activeCount} active tasks · ${completedCount} completed · ${state.longTermGoals.length} long-term goals · ${state.shortTermExperiments.length} experiments`,
    '',
    '## Structure',
    '- `matrix/eisenhower-matrix.md` — Daily tactical execution across all 4 quadrants',
    '- `goals/*.md` — Long-Term Goals structured with the Six Honest Serving Men framework',
    '- `experiments/*.md` — Short-Term Experiments with chronological feedback logs',
    '',
    '## Long-Term Goals',
    ...(state.longTermGoals.length > 0
      ? state.longTermGoals.map(
          (g) => `- **${g.title}** (${g.status}) — \`goals/${slugify(g.title)}-${g.id.slice(-5)}.md\``
        )
      : ['- _None defined yet_']),
    '',
    '## Short-Term Experiments',
    ...(state.shortTermExperiments.length > 0
      ? state.shortTermExperiments.map(
          (e) =>
            `- **${e.title}** (${e.reassessment}) — \`experiments/${slugify(e.title)}-${e.id.slice(-5)}.md\``
        )
      : ['- _None active yet_']),
    '',
  ];

  return lines.join('\n');
}

export function serializeFullSecondBrainMarkdown(state: AppState): string {
  const parts: string[] = [
    '<!-- CLARITYOS_SECOND_BRAIN_BUNDLE_V1 -->',
    serializeMatrixMarkdown(state).trim(),
  ];

  for (const goal of state.longTermGoals) {
    parts.push('<!-- CLARITYOS_DOC_SEPARATOR -->');
    parts.push(serializeLongTermGoalMarkdown(goal).trim());
  }

  for (const exp of state.shortTermExperiments) {
    parts.push('<!-- CLARITYOS_DOC_SEPARATOR -->');
    parts.push(serializeExperimentMarkdown(exp).trim());
  }

  return parts.join('\n\n') + '\n';
}

// ==================== PARSERS ====================

export function parseLongTermGoalMarkdown(md: string): LongTermGoal | null {
  const { meta, body } = parseFrontmatter(md);
  if (meta.type && meta.type !== 'long-term-goal') return null;

  const sections = extractSections(body, '## ');
  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = meta.title || (h1Match ? h1Match[1].trim() : 'Untitled Goal');
  const status = (['draft', 'locked', 'achieved'].includes(meta.status)
    ? meta.status
    : 'draft') as LongTermGoalStatus;

  return {
    id: meta.id || generateId('lt'),
    title,
    status,
    what: sections['1. What'] ?? sections['What'] ?? '',
    why: sections['2. Why'] ?? sections['Why'] ?? '',
    when: sections['3. When'] ?? sections['When'] ?? '',
    how: sections['4. How'] ?? sections['How'] ?? '',
    where: sections['5. Where'] ?? sections['Where'] ?? '',
    who: sections['6. Who'] ?? sections['Who'] ?? '',
    createdAt: Number(meta.createdAt) || Date.now(),
    updatedAt: Number(meta.updatedAt) || Date.now(),
    ...(meta.isSample === 'true' ? { isSample: true } : {}),
  };
}

export function parseExperimentMarkdown(md: string): ShortTermExperiment | null {
  const { meta, body } = parseFrontmatter(md);
  if (meta.type && meta.type !== 'experiment') return null;

  const sections = extractSections(body, '## ');
  const h1Match = body.match(/^#\s+(.+)$/m);
  const title = meta.title || (h1Match ? h1Match[1].trim() : 'Untitled Experiment');
  const reassessment = (['persevere', 'pivot', 'scale', 'drop'].includes(meta.reassessment)
    ? meta.reassessment
    : 'persevere') as ReassessmentStatus;

  const rawLogSection = sections['Chronological Feedback Log'] || '';
  const feedbackLog: FeedbackEntry[] = [];
  for (const line of rawLogSection.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('- ')) continue;
    const match = trimmed.match(
      /^-\s+\*\*(.+?)\*\*(?:\s+<!--\s*logId:([^\s]+)\s*-->)?:\s*(.*)$/
    );
    if (match) {
      feedbackLog.push({
        id: match[2] || generateId('log'),
        timestamp: match[1].trim(),
        note: match[3].trim(),
      });
    }
  }

  return {
    id: meta.id || generateId('exp'),
    title,
    timeframe: meta.timeframe || '1-Week Sprint',
    hypothesis: sections['Hypothesis'] || '',
    actionSteps: sections['Action Steps'] || '',
    feedbackLog,
    reassessment,
    nextIteration: sections['Next Iteration'] || '',
    createdAt: Number(meta.createdAt) || Date.now(),
    updatedAt: Number(meta.updatedAt) || Date.now(),
    ...(meta.isSample === 'true' ? { isSample: true } : {}),
  };
}

export function parseMatrixMarkdown(md: string): TaskItem[] {
  const { body } = parseFrontmatter(md);
  const sections = extractSections(body, '## ');
  const tasks: TaskItem[] = [];

  for (const { id: quadrantId, heading } of QUADRANT_HEADINGS) {
    const block =
      sections[heading] ||
      Object.entries(sections).find(([k]) => k.toLowerCase().startsWith(heading.slice(0, 5).toLowerCase()))?.[1] ||
      '';
    if (!block) continue;

    const lines = block.split(/\r?\n/);
    let currentTask: TaskItem | null = null;

    for (const line of lines) {
      const taskMatch = line.match(/^- \[([ xX])\]\s+(.*)$/);
      if (taskMatch) {
        if (currentTask) tasks.push(currentTask);

        const completed = taskMatch[1].toLowerCase() === 'x';
        let rest = taskMatch[2];
        let meta: { id?: string; goalId?: string | null; createdAt?: number; isSample?: boolean } = {};

        const metaMatch = rest.match(/\s*<!--\s*clarity:(\{.*?\})\s*-->\s*$/);
        if (metaMatch) {
          try {
            meta = JSON.parse(metaMatch[1]);
          } catch {
            // ignore malformed comment
          }
          rest = rest.slice(0, metaMatch.index).trim();
        }

        // Remove trailing [[Goal Title]] wiki-link when reconstructing title
        rest = rest.replace(/\s+\[\[.*?\]\]\s*$/, '').trim();

        currentTask = {
          id: meta.id || generateId('task'),
          title: rest || 'Untitled Task',
          notes: '',
          quadrant: quadrantId,
          completed,
          goalId: meta.goalId ?? null,
          createdAt: meta.createdAt || Date.now(),
          ...(meta.isSample ? { isSample: true } : {}),
        };
      } else if (currentTask && line.trim().startsWith('>')) {
        const notePiece = line.trim().replace(/^>\s?/, '');
        currentTask.notes = currentTask.notes ? `${currentTask.notes}\n${notePiece}` : notePiece;
      }
    }
    if (currentTask) tasks.push(currentTask);
  }

  return tasks;
}

export function parseFullSecondBrainMarkdown(bundleMd: string): AppState {
  const chunks = bundleMd
    .replace('<!-- CLARITYOS_SECOND_BRAIN_BUNDLE_V1 -->', '')
    .split('<!-- CLARITYOS_DOC_SEPARATOR -->')
    .map((c) => c.trim())
    .filter(Boolean);

  let tasks: TaskItem[] = [];
  const longTermGoals: LongTermGoal[] = [];
  const shortTermExperiments: ShortTermExperiment[] = [];

  for (const chunk of chunks) {
    const { meta } = parseFrontmatter(chunk);
    if (meta.type === 'eisenhower-matrix' || chunk.includes('# Eisenhower Matrix')) {
      tasks = parseMatrixMarkdown(chunk);
    } else if (meta.type === 'long-term-goal') {
      const g = parseLongTermGoalMarkdown(chunk);
      if (g) longTermGoals.push(g);
    } else if (meta.type === 'experiment') {
      const exp = parseExperimentMarkdown(chunk);
      if (exp) shortTermExperiments.push(exp);
    }
  }

  if (tasks.length === 0 && longTermGoals.length === 0 && shortTermExperiments.length === 0) {
    throw new Error('No valid ClarityOS Markdown sections found.');
  }

  return {
    version: 1,
    tasks,
    longTermGoals,
    shortTermExperiments,
  };
}

// ==================== LOCAL FOLDER VAULT SYNC (FILE SYSTEM ACCESS API) ====================

async function writeTextFile(
  dir: FSDirectoryHandle,
  filename: string,
  content: string
): Promise<void> {
  const fileHandle = await dir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

async function clearDirectoryMarkdownFiles(dir: FSDirectoryHandle): Promise<void> {
  const toRemove: string[] = [];
  for await (const entry of dir.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      toRemove.push(entry.name);
    }
  }
  for (const name of toRemove) {
    await dir.removeEntry(name);
  }
}

export async function syncStateToDirectoryVault(
  rootDir: FSDirectoryHandle,
  state: AppState
): Promise<void> {
  const matrixDir = await rootDir.getDirectoryHandle('matrix', { create: true });
  const goalsDir = await rootDir.getDirectoryHandle('goals', { create: true });
  const experimentsDir = await rootDir.getDirectoryHandle('experiments', { create: true });

  await writeTextFile(rootDir, 'README.md', serializeIndexMarkdown(state));
  await writeTextFile(matrixDir, 'eisenhower-matrix.md', serializeMatrixMarkdown(state));

  // Rewrite goals & experiments cleanly so deleted/renamed items don't leave stale .md files
  await clearDirectoryMarkdownFiles(goalsDir);
  for (const goal of state.longTermGoals) {
    const filename = `${slugify(goal.title)}-${goal.id.slice(-5)}.md`;
    await writeTextFile(goalsDir, filename, serializeLongTermGoalMarkdown(goal));
  }

  await clearDirectoryMarkdownFiles(experimentsDir);
  for (const exp of state.shortTermExperiments) {
    const filename = `${slugify(exp.title)}-${exp.id.slice(-5)}.md`;
    await writeTextFile(experimentsDir, filename, serializeExperimentMarkdown(exp));
  }
}

export async function loadStateFromDirectoryVault(
  rootDir: FSDirectoryHandle
): Promise<AppState> {
  let tasks: TaskItem[] = [];
  const longTermGoals: LongTermGoal[] = [];
  const shortTermExperiments: ShortTermExperiment[] = [];

  try {
    const matrixDir = await rootDir.getDirectoryHandle('matrix');
    const matrixFile = await matrixDir.getFileHandle('eisenhower-matrix.md');
    const file = await matrixFile.getFile();
    tasks = parseMatrixMarkdown(await file.text());
  } catch {
    // No matrix file yet
  }

  try {
    const goalsDir = await rootDir.getDirectoryHandle('goals');
    for await (const entry of goalsDir.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const file = await entry.getFile();
        const parsed = parseLongTermGoalMarkdown(await file.text());
        if (parsed) longTermGoals.push(parsed);
      }
    }
  } catch {
    // No goals folder yet
  }

  try {
    const expDir = await rootDir.getDirectoryHandle('experiments');
    for await (const entry of expDir.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.md')) {
        const file = await entry.getFile();
        const parsed = parseExperimentMarkdown(await file.text());
        if (parsed) shortTermExperiments.push(parsed);
      }
    }
  } catch {
    // No experiments folder yet
  }

  return {
    version: 1,
    tasks,
    longTermGoals,
    shortTermExperiments,
  };
}
