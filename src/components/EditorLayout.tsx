import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useEffect, useState } from "react";
import {
  LogOut, Home, Sparkles, Palette, Library, Scissors, Save, Undo, Redo,
  Search, ChevronDown, Command, CircleHelp, Settings2, Film, Cloud, Check, Maximize2, Minimize2,
} from "lucide-react";
import { useTimelineStore, undoTimeline, redoTimeline } from "../../packages/core/timeline-engine";

const navigation = [
  { to: "/editor", label: "Studio", icon: Home, end: true, group: "WORKSPACE" },
  { to: "/editor/color", label: "Color grading", icon: Palette, group: "WORKSPACE" },
  { to: "/editor/lut", label: "Look library", icon: Library, group: "WORKSPACE" },
  { to: "/editor/smartcut", label: "Smart Cut", icon: Scissors, group: "AI TOOLS" },
  { to: "/editor/ai", label: "AI command center", icon: Sparkles, group: "AI TOOLS" },
];

export default function EditorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [focusMode, setFocusMode] = useState(false);
  const timelineState = useTimelineStore();
  const tracks = (timelineState as any).tracks;
  const clips = (timelineState as any).clips;
  const mediaPool = (timelineState as any).mediaPool;
  const playheadFrame = (timelineState as any).playheadFrame;
  const fps = (timelineState as any).fps;
  const zoom = (timelineState as any).zoom;
  const pastStates = (timelineState as any).temporal?.pastStates || [];
  const futureStates = (timelineState as any).temporal?.futureStates || [];
  const clipCount = Array.isArray(clips) ? clips.length : 0;
  const mediaCount = Array.isArray(mediaPool) ? mediaPool.length : 0;

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUserEmail(null);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (active) setUserEmail(user?.email || null);
    }).catch(() => {
      if (active) setUserEmail(null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && isSupabaseConfigured) navigate("/login", { replace: true });
      setUserEmail(session?.user?.email || null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const handleSaveProject = async () => {
    const name = window.prompt("Name this project", "Untitled project");
    if (!name?.trim()) return;
    setSaveState("saving");
    const project = {
      schemaVersion: 1,
      app: "LUMINA Studio",
      projectId: crypto.randomUUID(),
      name: name.trim(),
      savedAt: new Date().toISOString(),
      timelineData: { tracks, clips, mediaPool, playheadFrame, fps, zoom },
    };
    try {
      if (isSupabaseConfigured) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const response = await fetch("/api/projects", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(project),
          });
          if (response.ok) {
            setSaveState("saved");
            window.setTimeout(() => setSaveState("idle"), 2400);
            return;
          }
        }
      }
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name.trim().replace(/[^a-z0-9-_]+/gi, "-").replace(/^-|-$/g, "") + ".lumina.json";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2400);
    } catch (error) {
      console.error("Save project failed:", error);
      setSaveState("error");
      window.setTimeout(() => setSaveState("idle"), 3500);
    }
  };

  const page = navigation.find(item => item.to === location.pathname);
  const pageTitle = page?.label || "Studio";

  return (
    <div className={`lumina-shell flex h-screen min-h-[560px] overflow-hidden bg-[#08090c] text-[#f2f0eb] ${focusMode ? "lumina-focus-mode" : ""}`}>
      <aside className="lumina-sidebar flex w-[232px] shrink-0 flex-col border-r border-white/[0.07] bg-[#0c0d11]">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/[0.07] px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#f4b84a]/30 bg-[#f4b84a]/10 text-[#f4b84a]">
            <Film size={19} strokeWidth={1.8} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-bold tracking-[0.19em] text-[#f7f3e9]">LUMINA</div>
            <div className="mt-0.5 text-[9px] font-medium tracking-[0.22em] text-[#8b8b91]">CREATIVE STUDIO</div>
          </div>
          <span className="ml-auto rounded-md border border-white/10 px-1.5 py-1 text-[9px] text-[#a1a1aa]">01</span>
        </div>

        <div className="px-3 pt-5">
          <div className="mb-2 flex items-center justify-between px-3 text-[9px] font-semibold tracking-[0.18em] text-[#73747c]">
            <span>PROJECT</span><ChevronDown size={12} />
          </div>
          <button onClick={() => navigate("/editor")} className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-left transition hover:border-[#f4b84a]/30 hover:bg-white/[0.06]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#17181e] text-[#f4b84a]"><Film size={16}/></div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[11px] font-semibold text-[#e8e6e0]">Untitled sequence</div>
              <div className="mt-1 text-[9px] text-[#777982]">{mediaCount} assets · {clipCount} clips</div>
            </div>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"/>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pt-7">
          <div className="mb-2 px-3 text-[9px] font-semibold tracking-[0.18em] text-[#73747c]">WORKSPACE</div>
          {navigation.filter(item => item.group === "WORKSPACE").map(item => {
            const Icon = item.icon;
            return <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] transition-all ${isActive ? "border border-[#f4b84a]/20 bg-[#f4b84a]/[0.09] font-semibold text-[#f4c66f]" : "border border-transparent text-[#9697a0] hover:bg-white/[0.045] hover:text-[#e9e7e1]"}`
            }><Icon size={16} strokeWidth={1.8}/><span>{item.label}</span>{location.pathname === item.to && <span className="ml-auto h-1 w-1 rounded-full bg-[#f4b84a]"/>}</NavLink>;
          })}
          <div className="mb-2 mt-7 px-3 text-[9px] font-semibold tracking-[0.18em] text-[#73747c]">AI TOOLS</div>
          {navigation.filter(item => item.group === "AI TOOLS").map(item => {
            const Icon = item.icon;
            return <NavLink key={item.to} to={item.to} className={({ isActive }) =>
              `mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[11px] transition-all ${isActive ? "border border-[#f4b84a]/20 bg-[#f4b84a]/[0.09] font-semibold text-[#f4c66f]" : "border border-transparent text-[#9697a0] hover:bg-white/[0.045] hover:text-[#e9e7e1]"}`
            }><Icon size={16} strokeWidth={1.8}/><span>{item.label}</span></NavLink>;
          })}
          <div className="mt-8 rounded-xl border border-white/[0.07] bg-gradient-to-br from-[#17151a] to-[#101116] p-3.5">
            <div className="mb-2 flex items-center gap-2 text-[#f4c66f]"><Sparkles size={14}/><span className="text-[10px] font-semibold">Creative assistant</span></div>
            <p className="text-[10px] leading-5 text-[#85868e]">Turn an idea into your next edit with the AI command center.</p>
            <button onClick={() => navigate("/editor/ai")} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[#f4b84a]/25 bg-[#f4b84a]/[0.08] py-2 text-[10px] font-semibold text-[#f4c66f] transition hover:bg-[#f4b84a]/[0.15]">Open AI tools <span>↗</span></button>
          </div>
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <div className="flex items-center gap-2 rounded-lg px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-[#1a1b21] text-[10px] font-bold text-[#e7c17c]">{(userEmail?.[0] || "G").toUpperCase()}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[10px] font-medium text-[#dedde0]">{userEmail || "Guest workspace"}</div>
              <div className="mt-0.5 text-[9px] text-[#777982]">{userEmail ? "Personal workspace" : "Local preview"}</div>
            </div>
            {isSupabaseConfigured && <button onClick={handleSignOut} title="Sign out" className="rounded-md p-2 text-[#777982] transition hover:bg-white/[0.06] hover:text-white"><LogOut size={14}/></button>}
          </div>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-[62px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-[#0b0c10] px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-[#e8e6e0]">{pageTitle}</div>
              <div className="mt-1 hidden text-[9px] tracking-[0.04em] text-[#73747c] sm:block">Workspace <span className="mx-1.5 text-[#45464e]">/</span> {pageTitle}</div>
            </div>
            <div className="hidden h-7 w-px bg-white/[0.08] md:block"/>
            <div className="hidden items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-3 py-2 text-[10px] text-[#7e8089] lg:flex"><Search size={13}/><span>Search workspace</span><kbd className="ml-5 rounded border border-white/10 px-1.5 py-0.5 text-[9px]">⌘ K</kbd></div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-1.5 text-[9px] text-[#8a8b93] sm:flex"><Cloud size={13}/><span>{saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : saveState === "error" ? "Save failed" : "All changes local"}</span>{saveState === "saved" && <Check size={12} className="text-emerald-400"/>}</div>
            <div className="mx-1 hidden h-6 w-px bg-white/[0.08] sm:block"/>
            <button onClick={() => setFocusMode(value => !value)} title={focusMode ? "Exit focus mode" : "Focus mode"} aria-pressed={focusMode} className={`rounded-lg border p-2 transition ${focusMode ? "border-[#f4b84a]/40 bg-[#f4b84a]/[0.10] text-[#ffc94d]" : "border-white/[0.07] text-[#9b9ca4] hover:bg-white/[0.06] hover:text-white"}`}>{focusMode ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button>
            <button onClick={undoTimeline} disabled={pastStates.length === 0} title="Undo" className="rounded-lg border border-white/[0.07] p-2 text-[#9b9ca4] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"><Undo size={15}/></button>
            <button onClick={redoTimeline} disabled={futureStates.length === 0} title="Redo" className="rounded-lg border border-white/[0.07] p-2 text-[#9b9ca4] transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"><Redo size={15}/></button>
            <button onClick={handleSaveProject} disabled={saveState === "saving"} className="flex items-center gap-2 rounded-lg bg-[#f4b84a] px-3.5 py-2.5 text-[10px] font-bold text-[#17120a] shadow-[0_4px_20px_rgba(244,184,74,0.08)] transition hover:bg-[#ffd078] disabled:opacity-60"><Save size={14}/><span className="hidden sm:inline">{saveState === "saving" ? "Saving" : "Save project"}</span></button>
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-[#08090c]">
          <Outlet />
        </div>
        <footer className="flex h-7 shrink-0 items-center justify-between border-t border-white/[0.06] bg-[#0b0c10] px-4 text-[9px] text-[#686a73]">
          <div className="flex items-center gap-3"><span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80"/> Engine ready</span><span className="hidden sm:inline">24 FPS workflow</span></div>
          <div className="flex items-center gap-3"><span className="hidden sm:inline">LUMINA STUDIO</span><span className="flex items-center gap-1"><Command size={10}/> Professional workspace</span></div>
        </footer>
      </main>
    </div>
  );
}
