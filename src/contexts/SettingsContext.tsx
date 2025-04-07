
import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  model: string;
  setModel: (model: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState("gpt-3.5-turbo");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a professional business email writer who specializes in Japanese business correspondence."
  );

  return (
    <SettingsContext.Provider
      value={{
        model,
        setModel,
        systemPrompt,
        setSystemPrompt,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
