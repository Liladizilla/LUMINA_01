import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Login from "./components/Login";
import Home from "./components/Home";
import AICommandCenter from "./components/AICommandCenter";
import ColorNodeEditor from "./components/ColorNodeEditor";
import LUTLibrary from "./components/LUTLibrary";
import SmartCut from "./components/SmartCut";
import EditorLayout from "./components/EditorLayout";
import { supabase } from "./lib/supabase";

function AuthGate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
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
    <BrowserRouter>
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
        </Routes>
      </AuthGate>
    </BrowserRouter>
  );
}

// Wrapper components to provide required props to editors that need them
function ColorNodeEditorWrapper() {
  // Default clip data for the color editor - in a real app this would come from the timeline store
  const defaultClip = {
    id: "default",
    assetId: "default",
    name: "Default Clip",
    type: "video" as const,
    startFrame: 0,
    duration: 144, // 6 seconds at 24fps
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

  return (
    <LUTLibrary
      onApplyLUT={handleApplyLUT}
      currentLUT={null}
    />
  );
}

function SmartCutWrapper() {
  const handleApplyCuts = (cuts: any[]) => {
    console.log("Applying cuts:", cuts);
  };

  return (
    <SmartCut
      onApply={handleApplyCuts}
      fps={24}
    />
  );
}