import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Home from "./components/Home";
import { supabase } from "./lib/supabase";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return <>{session ? <Home /> : <Login />}</>;
}

