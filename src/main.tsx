import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClipProvider } from "./store";
import ErrorBoundary from "./ErrorBoundary";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClipProvider>
        <App />
      </ClipProvider>
    </ErrorBoundary>
  </StrictMode>
);
