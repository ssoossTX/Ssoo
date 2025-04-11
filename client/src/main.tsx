import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Check for preferred color scheme and set it as the initial theme
const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDarkMode) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
