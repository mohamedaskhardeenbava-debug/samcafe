import { createContext, useContext, useEffect, useState } from "react";
import socket from "../socket";
import api from "../api";

// ─── Context ──────────────────────────────────────────────────────────────────
const ThemeContext = createContext();

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ThemeProvider = ({ children }) => {
  // "light" | "dark" — user's own toggle preference
  const [theme, setTheme] = useState(
    localStorage.getItem("theme") || "light"
  );

  // Full token maps pushed from admin panel
  const [lightTokens, setLightTokens] = useState({});
  const [darkTokens, setDarkTokens] = useState({});

  // ── Apply a token map to :root CSS variables ──────────────────────────────
  const applyTokens = (tokenMap) => {
    if (!tokenMap || typeof tokenMap !== "object") return;
    const root = document.documentElement;
    Object.entries(tokenMap).forEach(([key, val]) => {
      root.style.setProperty(key, val);
    });
  };

  // ── Load saved theme from server on mount ─────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/theme");
        const saved = Array.isArray(res.data) ? res.data[0] : res.data;
        if (!saved) return;

        if (saved.light) setLightTokens(saved.light);
        if (saved.dark) setDarkTokens(saved.dark);

        // Apply immediately for the current theme mode
        const currentMode = localStorage.getItem("theme") || "light";
        applyTokens(currentMode === "dark" ? saved.dark : saved.light);
      } catch {
        // No theme saved yet — CSS defaults apply
      }
    };

    load();
  }, []);

  // ── Re-apply tokens whenever theme mode switches ──────────────────────────
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
    applyTokens(theme === "dark" ? darkTokens : lightTokens);
  }, [theme, lightTokens, darkTokens]);

  // ── Listen for admin panel theme broadcasts ───────────────────────────────
  useEffect(() => {
    const handleThemeUpdate = (payload) => {
      if (!payload) return;

      setLightTokens(payload.light || {});
      setDarkTokens(payload.dark || {});

      const currentMode = localStorage.getItem("theme") || "light";

      applyTokens(
        currentMode === "dark"
          ? payload.dark || {}
          : payload.light || {}
      );
    };

    socket.on("theme-update", handleThemeUpdate);

    return () => socket.off("theme-update", handleThemeUpdate);
  }, []);

  // ── Toggle light / dark ───────────────────────────────────────────────────
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);