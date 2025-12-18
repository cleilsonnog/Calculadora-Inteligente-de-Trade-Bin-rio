// useLocalStorageState.ts
import { useState, useEffect } from "react";
import localforage from "localforage";

export function useLocalStorageState<T>(
  key: string,
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialState);
  const [loaded, setLoaded] = useState(false);

  // 🔹 Carrega do IndexedDB (PWA-safe)
  useEffect(() => {
    let mounted = true;

    localforage
      .getItem<T>(key)
      .then((stored) => {
        if (!mounted) return;
        if (stored !== null) setValue(stored);
      })
      .catch(console.error)
      .finally(() => setLoaded(true));

    return () => {
      mounted = false;
    };
  }, [key]);

  // 🔹 Salva no IndexedDB
  useEffect(() => {
    if (!loaded) return;
    localforage.setItem(key, value).catch(console.error);
  }, [key, value, loaded]);

  return [value, setValue, loaded];
}
