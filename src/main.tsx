import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

console.log("========== APP START ==========");
console.log("React main.tsx executing");
console.log("localStorage:", JSON.stringify(localStorage));
console.log("sessionStorage:", JSON.stringify(sessionStorage));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

console.log("React mounted");
