/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileCode,
  FolderOpen,
  CheckCircle2,
  Circle,
  Download,
  Upload,
  BookOpen,
  Code2,
  Check,
  Compass,
  Copy,
  ChevronRight,
  Plus,
  Trash2,
  Layers,
  Sparkles,
  Info
} from "lucide-react";

// Theme Palette Presets
interface ThemePreset {
  name: string;
  bg: string;
  card: string;
  text: string;
  accent: string;
  accentLight: string;
  border: string;
  badge: string;
}

const THEMES: Record<string, ThemePreset> = {
  slate: {
    name: "Slate Modern",
    bg: "bg-[#faf9f6]/95",
    card: "bg-white",
    text: "text-zinc-900",
    accent: "bg-zinc-900 hover:bg-zinc-800 text-white",
    accentLight: "text-zinc-600 bg-zinc-100",
    border: "border-zinc-200/80",
    badge: "bg-zinc-100 text-zinc-800 border-zinc-200"
  },
  warm: {
    name: "Warm Editorial",
    bg: "bg-[#fefaf4]",
    card: "bg-[#fffdfa]",
    text: "text-amber-950",
    accent: "bg-amber-900 hover:bg-amber-800 text-amber-50",
    accentLight: "text-amber-800 bg-amber-100/60",
    border: "border-amber-900/10",
    badge: "bg-amber-50 text-amber-900 border-amber-900/10"
  },
  ocean: {
    name: "Nordic Frost",
    bg: "bg-slate-50",
    card: "bg-white",
    text: "text-sky-950",
    accent: "bg-radial from-sky-600 to-sky-700 hover:opacity-90 text-white",
    accentLight: "text-sky-700 bg-sky-50",
    border: "border-slate-200",
    badge: "bg-sky-50 text-sky-800 border-sky-100"
  }
};

interface FileItem {
  name: string;
  path: string;
  size: string;
  language: string;
  description: string;
  content: string;
}

const SAMPLE_FILES: FileItem[] = [
  {
    name: "src/App.tsx",
    path: "/src/App.tsx",
    size: "1.2 KB",
    language: "typescript",
    description: "The primary entry point where your React visual layout starts.",
    content: `export default function App() {\n  return (\n    <div className="min-h-screen flex items-center justify-center">\n      <h1>Hello World</h1>\n    </div>\n  );\n}`
  },
  {
    name: "package.json",
    path: "/package.json",
    size: "720 B",
    language: "json",
    description: "Declares project configuration, run scripts, and official metadata.",
    content: `{\n  "name": "blank-workspace",\n  "dependencies": {\n    "react": "^19.0.1",\n    "motion": "^12.23.24"\n  }\n}`
  },
  {
    name: "metadata.json",
    path: "/metadata.json",
    size: "164 B",
    language: "json",
    description: "Defines runtime device permissions, application names, and platform capabilities.",
    content: `{\n  "name": "Blank Workspace",\n  "description": "An elegant starting canvas."\n}`
  },
  {
    name: "src/index.css",
    path: "/src/index.css",
    size: "340 B",
    language: "css",
    description: "Configures global responsive design stylesheets using modern Tailwind imports.",
    content: `@import "tailwindcss";\n\n@theme {\n  --font-sans: "Inter", sans-serif;\n}`
  }
];

interface ChecklistTask {
  id: string;
  text: string;
  completed: boolean;
  isCustom?: boolean;
}

export default function App() {
  const [currentThemeKey, setCurrentThemeKey] = useState<string>("slate");
  const selectedTheme = THEMES[currentThemeKey] || THEMES.slate;

  // Selected file for interactive visual model
  const [selectedFile, setSelectedFile] = useState<FileItem>(SAMPLE_FILES[0]);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Stateful action checklist
  const [tasks, setTasks] = useState<ChecklistTask[]>([
    { id: "1", text: "Download the present workspace package as a ZIP archive", completed: false },
    { id: "2", text: "Incorporate specialized components inside src/components", completed: false },
    { id: "3", text: "Inject custom secrets inside the Secrets Panel", completed: false },
    { id: "4", text: "Upload your revised ZIP package and preview changes", completed: false }
  ]);
  const [newTaskText, setNewTaskText] = useState<string>("");

  // Sync tasks storage with client memory safely
  useEffect(() => {
    const saved = localStorage.getItem("workspace_checklist");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        // Safe fallback
      }
    }
  }, []);

  const saveTasks = (newTasks: ChecklistTask[]) => {
    setTasks(newTasks);
    localStorage.setItem("workspace_checklist", JSON.stringify(newTasks));
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);
  };

  const removeTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    const item: ChecklistTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      isCustom: true
    };
    saveTasks([...tasks, item]);
    setNewTaskText("");
  };

  const handleCopyPath = (path: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-500 pb-16 ${selectedTheme.bg} ${selectedTheme.text}`}>
      
      {/* Upper Delicate Decorative Margin */}
      <div className="w-full h-1 bg-gradient-to-r from-zinc-200 via-neutral-400 to-zinc-200" />

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-12 md:pt-16">
        
        {/* Workspace Title & Description Area */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-8 border-b border-zinc-200/70">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 border border-zinc-200/50 rounded-full text-xs font-mono font-medium text-zinc-600 shadow-xs mb-4">
              <Sparkles className="w-3 H-3 text-amber-500 animate-pulse" />
              <span>Workspace Initiated successfully</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-semibold tracking-tight leading-none mb-4">
              Workspace Starter Canvas
            </h1>
            <p className="text-sm md:text-base leading-relaxed opacity-75 max-w-xl font-sans">
              This sandbox environment is ready. Modify components via the left sidebar code editor, or download the ZIP code asset to construct offline and re-upload when ready.
            </p>
          </div>

          {/* Color Aesthetics Selection */}
          <div className="flex flex-col gap-2 items-start md:items-end">
            <span className="text-xs font-mono opacity-65 flex items-center gap-1.5 leading-none">
              Accent Color Palette
            </span>
            <div className="flex bg-white/70 backdrop-blur-xs border border-zinc-200/65 rounded-lg p-1 gap-1 shadow-xs">
              {Object.keys(THEMES).map((key) => (
                <button
                  key={key}
                  id={`theme-btn-${key}`}
                  onClick={() => setCurrentThemeKey(key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    currentThemeKey === key
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "hover:bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {THEMES[key].name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Balanced Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Core Guideline Cards & Action Roadmap Checklist */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Guide Quick Access Card */}
            <div className={`p-6 rounded-2xl border ${selectedTheme.card} ${selectedTheme.border} shadow-sm transition-all duration-300`}>
              <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4 opacity-80" />
                <span>How to upload and refresh</span>
              </h2>
              <div className="space-y-4 text-xs leading-relaxed font-sans opacity-85">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-mono font-medium text-[10px] text-zinc-600">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Download Current Archive</h3>
                    <p className="opacity-80">Use the settings menu on the top-right of your workspace to export the template as a ZIP structure.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-mono font-medium text-[10px] text-zinc-600">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Make Local Enhancements</h3>
                    <p className="opacity-80">Write custom routines, hook custom layouts, and install external libraries locally using standard NPM command lines.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-mono font-medium text-[10px] text-zinc-600">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Sync Back Workspace</h3>
                    <p className="opacity-80">Deploy the ZIP back using the file sidebar upload utility in the editor. The compiler automatically refreshes the preview.</p>
                  </div>
                </div>
              </div>

              {/* Guide Note Box */}
              <div className="mt-5 p-3 rounded-xl bg-orange-50/50 border border-orange-200/40 text-[114px] text-amber-900/90 leading-normal flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-700/80 mt-0.5 flex-shrink-0" />
                <span className="text-[11px] opacity-90 leading-tight">
                  Our compiler binds directly with the environment router. Do not alter port declarations or main engine scripts!
                </span>
              </div>
            </div>

            {/* Todo Roadmap Checklist */}
            <div className={`p-6 rounded-2xl border ${selectedTheme.card} ${selectedTheme.border} shadow-sm transition-all duration-300 flex-1`}>
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 opacity-80" />
                    <span>Action Checklist</span>
                  </h2>
                  <p className="text-xs opacity-65 mt-0.5">Track your project initialization milestones</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600">
                  {tasks.filter((t) => t.completed).length}/{tasks.length} Done
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2 mb-4 max-h-[220px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-black/[0.01] hover:bg-black/[0.03] border border-transparent hover:border-zinc-200/50 transition-all"
                    >
                      <button
                        id={`task-toggle-${task.id}`}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-start gap-3 text-left cursor-pointer flex-1"
                      >
                        <div className="mt-0.5 text-indigo-600 flex-shrink-0">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 fill-emerald-50" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                        <span className={`text-xs select-none transition-all ${
                          task.completed ? "line-through opacity-45" : "opacity-90"
                        }`}>
                          {task.text}
                        </span>
                      </button>

                      {task.isCustom && (
                        <button
                          id={`task-delete-${task.id}`}
                          onClick={() => removeTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-sm hover:bg-zinc-200/50 text-zinc-400 hover:text-rose-600 transition-all ml-1.5"
                          title="Remove custom milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {tasks.length === 0 && (
                  <div className="text-center py-6 text-xs opacity-50">
                    No active tasks. Add your custom milestone below.
                  </div>
                )}
              </div>

              {/* Add Custom Task Form */}
              <form onSubmit={addTask} className="flex gap-2">
                <input
                  id="new-task-input"
                  type="text"
                  placeholder="Insert custom milestone..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-zinc-200 rounded-xl text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-400 transition-all placeholder:opacity-50"
                />
                <button
                  id="add-task-submit"
                  type="submit"
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${selectedTheme.accent}`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT SIDE: Interactive Web File System Visualizer */}
          <div className="lg:col-span-7 flex flex-col">
            <div className={`p-6 rounded-2xl border ${selectedTheme.card} ${selectedTheme.border} shadow-sm transition-all duration-300 flex-1 flex flex-col`}>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-200/50">
                <div>
                  <h2 className="text-lg font-display font-semibold flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 opacity-80" />
                    <span>App Source Explorer</span>
                  </h2>
                  <p className="text-xs opacity-65 mt-0.5">Explore active template files mapping</p>
                </div>
                
                <span className="text-[11px] font-mono opacity-80 self-start sm:self-auto bg-stone-100 hover:bg-stone-200/80 px-2.5 py-1 rounded-md border border-stone-200/60">
                  Ready with React 19 + Tailwind v4
                </span>
              </div>

              {/* File Selector Tabs row */}
              <div className="flex flex-wrap gap-1 bg-stone-50 border border-stone-200/60 p-1 rounded-xl mb-4 overflow-x-auto">
                {SAMPLE_FILES.map((file) => (
                  <button
                    key={file.path}
                    id={`file-tab-${file.name.replace(/\//g, "-")}`}
                    onClick={() => setSelectedFile(file)}
                    className={`px-3 py-2 rounded-lg text-xs font-mono font-medium flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                      selectedFile.path === file.path
                        ? "bg-white text-zinc-900 border border-zinc-200/50 shadow-xs"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-white/40"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{file.name}</span>
                  </button>
                ))}
              </div>

              {/* Active Selected File Panel */}
              <div className="flex-1 flex flex-col bg-stone-900 text-stone-100 rounded-xl p-4 md:p-5 font-mono text-xs overflow-hidden">
                
                {/* Panel Header bar */}
                <div className="flex items-center justify-between border-b border-stone-800 pb-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 block" />
                    </div>
                    <span className="text-stone-400 text-xs text-[11px] select-all cursor-text py-0.5 px-2 bg-stone-800 rounded-md">
                      {selectedFile.path}
                    </span>
                  </div>

                  <button
                    id="copy-path-btn"
                    onClick={() => handleCopyPath(selectedFile.path)}
                    className="p-1.5 hover:bg-stone-800 text-stone-400 hover:text-stone-200 rounded-lg transition-all flex items-center gap-1.5 text-[10px]"
                    title="Copy path"
                  >
                    {copiedPath === selectedFile.path ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                {/* File Information Description Block */}
                <div className="bg-stone-800/40 p-3 rounded-lg border border-stone-800 mb-4 text-[11px] leading-relaxed text-stone-300">
                  <span className="font-semibold text-stone-100 block mb-1">File Insights:</span>
                  {selectedFile.description}
                  <span className="text-stone-500 block mt-2">Resource allocation: {selectedFile.size}</span>
                </div>

                {/* Simulated Interactive Preview Window */}
                <div className="flex-1 bg-stone-950/70 border border-stone-900 p-4 rounded-lg overflow-x-auto select-text relative">
                  <pre className="text-zinc-300 leading-relaxed text-[11px]">
                    <code>{selectedFile.content}</code>
                  </pre>
                  
                  {/* Subtle code badge overlay */}
                  <div className="absolute right-3 bottom-3 text-[10px] font-mono text-zinc-600 bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-sm pointer-events-none uppercase">
                    {selectedFile.language}
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
