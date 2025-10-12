import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { UserProvider } from "./context/UserContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";

// Add some logging to help debug issues
console.log("Starting Thryvin' AI coaching application...");

// Create a protected root that ensures all context providers are available
const rootElement = document.getElementById("root");
console.log("Root element found:", !!rootElement);

if (rootElement) {
  createRoot(rootElement).render(
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <App />
      </UserProvider>
    </QueryClientProvider>
  );
  console.log("Application rendered successfully");
} else {
  console.error("Root element not found, application cannot render");
}
