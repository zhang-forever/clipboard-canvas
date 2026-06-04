import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClipProvider } from "./store";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ClipProvider>
      <App />
    </ClipProvider>
  </StrictMode>
);
