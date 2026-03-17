import React, { useState } from "react";
import Home from "./components/Home";

export default function App() {
  const [showHome] = useState(true);
  return <>{showHome ? <Home /> : <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>}</>;
}

