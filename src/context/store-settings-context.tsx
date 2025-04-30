
"use client";

import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// --- LocalStorage Key ---
const LS_STORE_SETTINGS_KEY = "menuMasterStoreSettings";

// --- Store Settings Type ---
interface StoreSettings {
  address: string;
  cep: string;
  number: string;
  // Add other settings like phone number, opening hours, etc. later if needed
}

// --- Context Type ---
interface StoreSettingsContextType {
  storeSettings: StoreSettings | null;
  updateStoreSettings: (newSettings: Partial<StoreSettings>) => boolean; // Allow partial updates
}

// --- Helper Functions for LocalStorage ---
const getFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
};

const setInLocalStorage = <T,>(key: string, value: T): void => {
  if (typeof window === "undefined") {
    console.warn(`Tried setting localStorage key “${key}” outside browser environment.`);
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting localStorage key “${key}”:`, error);
  }
};

// --- Create Context ---
const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

// --- Provider Component ---
export const StoreSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();

  // Load initial settings from localStorage on mount
  useEffect(() => {
    const loadedSettings = getFromLocalStorage<StoreSettings | null>(LS_STORE_SETTINGS_KEY, {
      address: "", // Default empty values
      cep: "",
      number: "",
    });
    setStoreSettings(loadedSettings);
    setIsInitialized(true);
  }, []);

  // Persist settings to localStorage when they change
  useEffect(() => {
    if (isInitialized) {
      setInLocalStorage<StoreSettings | null>(LS_STORE_SETTINGS_KEY, storeSettings);
    }
  }, [storeSettings, isInitialized]);

  // Function to update settings
  const updateStoreSettings = useCallback((newSettings: Partial<StoreSettings>): boolean => {
    let success = false;
    let toastInfo: { title: string, description: string, variant?: "destructive" } | null = null;

    setStoreSettings(prevSettings => {
      const updatedSettings = { ...(prevSettings ?? {}), ...newSettings } as StoreSettings;

      // Basic validation can be added here if needed
      // For example, check if required fields are present after merge

      success = true;
      toastInfo = { title: "Sucesso", description: "Endereço da loja atualizado." };
      return updatedSettings;
    });

    // Dispatch toast outside the updater
    if (toastInfo) setTimeout(() => toast(toastInfo as any), 0);
    return success;
  }, [toast]);

  const value = {
    storeSettings,
    updateStoreSettings,
  };

  // Render children only after state is initialized
  return (
    <StoreSettingsContext.Provider value={value}>
      {isInitialized ? children : null /* Or a loading indicator */}
    </StoreSettingsContext.Provider>
  );
};

// --- Custom Hook ---
export const useStoreSettings = () => {
  const context = useContext(StoreSettingsContext);
  if (context === undefined) {
    throw new Error("useStoreSettings must be used within a StoreSettingsProvider");
  }
  return context;
};
