import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import AICommandCenter from "./components/AICommandCenter";
import ColorNodeEditor from "./components/ColorNodeEditor";
import LUTLibrary from "./components/LUTLibrary";
import SmartCut from "./components/SmartCut";
import EditorLayout from "./components/EditorLayout";
import { supabase, isSupabaseConfigured } from "./lib/supabase";

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("LUMINA failed to render:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: "100vh", background: "#08090c", color: "#f2f0eb", padding: "48px 24px", fontFamily: "system-ui, sans-serif" }}>
          <section style={{ maxWidth: 720, margin: "8vh auto", border: "1px solid #393039", borderRadius: 16, padding: 28, background: "#101116" }}>
            <p style={{ color: "#f4b84a", fontSize: 12, letterSpacing: 3, fontWeight: 700 }}>LUMINA STUDIO · RECOVERY</p>
            <h1 style={{ fontSize: 28, margin: "12px 0" }}>The editor hit a rendering error.</h1>
            <p style={{ color: "#b4b4bd", lineHeight: 1.6 }}>The page is no longer silently blank. This diagnostic message can help identify the component that failed.</p>
            <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", marginTop: 20, padding: 16, borderRadius: 10, background: "#08090c", color: "#ffd18a", fontSize: 13 }}>{this.state.error.message || String(this.state.error)}</pre>
            <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: "10px 16px", borderRadius: 8, background: "#f4b84a", color: "#17120a", fontWeight: 700, cursor: "pointer" }}>Reload editor</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    }).catch(() => setIsLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    if (!isLoading) {
      if (isAuthenticated) {
        navigate("/editor", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070608] text-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#F5A623] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Loading Lumina Studio...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppErrorBoundary>
        <AuthGate>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<EditorLayout />}>
              <Route index element={<Navigate to="/editor" replace />} />
              <Route path="editor" element={<Home />} />
              <Route path="editor/color" element={<ColorNodeEditorWrapper />} />
              <Route path="editor/lut" element={<LUTLibraryWrapper />} />
              <Route path="editor/smartcut" element={<SmartCutWrapper />} />
              <Route path="editor/ai" element={<AICommandCenter />} />
            </Route>
            <Route path="*" element={<Navigate to="/editor" replace />} />
          </Routes>
        </AuthGate>
      </AppErrorBoundary>
    </BrowserRouter>
  );
}

function ColorNodeEditorWrapper() {
  const defaultClip = {
    id: "default",
    assetId: "default",
    name: "Default Clip",
    type: "video" as const,
    startFrame: 0,
    duration: 144,
    trackId: "video-1",
    effects: [],
    colorNodes: [
      { id: "input", type: "input" as const, params: {}, position: { x: 50, y: 150 } },
      { id: "output", type: "output" as const, params: {}, position: { x: 550, y: 150 } },
    ],
    colorConnections: [],
  };

  return (
    <ColorNodeEditor
      clip={defaultClip}
      onUpdateNodes={() => {}}
      onUpdateConnections={() => {}}
    />
  );
}

function LUTLibraryWrapper() {
  const handleApplyLUT = (lutData: any) => {
    console.log("Applying LUT:", lutData);
  };

  return <LUTLibrary onApplyLUT={handleApplyLUT} currentLUT={null} />;
}

function SmartCutWrapper() {
  const handleApplyCuts = (cuts: any[]) => {
    console.log("Applying cuts:", cuts);
  };

  return <SmartCut onApply={handleApplyCuts} fps={24} />;
}
