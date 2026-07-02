import { Route, Routes } from "react-router-dom";

import { HomePage } from "@/pages/home";

export function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<HomePage />} path="*" />
    </Routes>
  );
}
