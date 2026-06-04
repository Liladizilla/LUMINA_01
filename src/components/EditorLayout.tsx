import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import { LogOut, Home, Sparkles, Palette, Library, Scissors, Save, FolderOpen, Undo, Redo } from "lucide-react";
import { useTimelineStore, undoTimeline, redoTimeline } from "../../packages/core/timeline-engine";

export default function EditorLayout() {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Timeline store for project save/load
  const timelineState = useTimelineStore();
  const tracks = (timelineState as any).tracks;
  const clips = (timelineState as any).clips;
  const mediaPool = (timelineState as any).mediaPool;
  const playheadFrame = (timelineState as any).playheadFrame;
  const fps = (timelineState as any).fps;
  const zoom = (timelineState as any).zoom;
  const pastStates = (timelineState as any).temporal?.pastStates || [];
  const futureStates = (timelineState as any).temporal?.futureStates || [];

  useEffect(() => {
    // Get user email
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/login", { replace: true });
      }
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  const handleSaveProject = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const projectId = prompt("Enter project name:") || "Untitled";
    
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: Math.random().toString(36).substr(2, 9),
          timelineData: { tracks, clips, mediaPool, playheadFrame, fps, zoom },
          name: projectId,
        }),
      });
      
      if (response.ok) {
        alert("Project saved!");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-[#070608] text-[#F5F3E7]">
      {/* Sidebar */}
      <nav className="w-16 bg-[#0A0A0F] border-r border-[#2A2430] flex flex-col items-center py-4 gap-2">
        <div className="mb-4">
          <div className="w-10 h-10 rounded-lg bg-[#F5A623]/20 flex items-center justify-center mb-2">
            <Home size={20} className="text-[#F5A623]" />
          </div>
          <div className="text-[7px] text-[#7A6E80] text-center truncate w-12">
            {userEmail?.split('@')[0] || 'User'}
          </div>
        </div>

        <NavLink
          to="/editor"
          end
          className={({ isActive }) =>
            `p-3 rounded-lg transition-colors ${isActive ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"}`
          }
          title="Editor"
        >
          <Home size={20} />
        </NavLink>
        <NavLink
          to="/editor/color"
          className={({ isActive }) =>
            `p-3 rounded-lg transition-colors ${isActive ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"}`
          }
          title="Color Editor"
        >
          <Palette size={20} />
        </NavLink>
        <NavLink
          to="/editor/lut"
          className={({ isActive }) =>
            `p-3 rounded-lg transition-colors ${isActive ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"}`
          }
          title="LUT Library"
        >
          <Library size={20} />
        </NavLink>
        <NavLink
          to="/editor/smartcut"
          className={({ isActive }) =>
            `p-3 rounded-lg transition-colors ${isActive ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"}`
          }
          title="SmartCut"
        >
          <Scissors size={20} />
        </NavLink>
        <NavLink
          to="/editor/ai"
          className={({ isActive }) =>
            `p-3 rounded-lg transition-colors ${isActive ? "bg-[#F5A623] text-black" : "text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F0E8D8]"}`
          }
          title="AI Command Center"
        >
          <Sparkles size={20} />
        </NavLink>

        <div className="flex-1" />

        <button
          onClick={undoTimeline}
          disabled={pastStates.length === 0}
          className="p-3 rounded-lg text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F5A623] transition-colors disabled:opacity-30"
          title="Undo (Ctrl+Z)"
        >
          <Undo size={20} />
        </button>
        
        <button
          onClick={redoTimeline}
          disabled={futureStates.length === 0}
          className="p-3 rounded-lg text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F5A623] transition-colors disabled:opacity-30"
          title="Redo (Ctrl+Y)"
        >
          <Redo size={20} />
        </button>

        <button
          onClick={handleSaveProject}
          className="p-3 rounded-lg text-[#7A6E80] hover:bg-[#1A161C] hover:text-[#F5A623] transition-colors"
          title="Save Project"
        >
          <Save size={20} />
        </button>
        
        <button
          onClick={handleSignOut}
          className="p-3 rounded-lg text-[#7A6E80] hover:bg-[#1A161C] hover:text-red-400 transition-colors"
          title="Sign Out"
        >
          <LogOut size={20} />
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}