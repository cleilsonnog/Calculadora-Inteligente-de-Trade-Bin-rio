import { useState, useEffect } from "react";

/**
 * Um hook customizado que se comporta como `useState`, mas persiste o estado no `localStorage` do navegador.
 * @param key A chave única para armazenar o valor no localStorage.
 * @param initialState O valor inicial a ser usado se não houver nada no localStorage.
 * @returns Um array contendo o valor do estado e a função para atualizá-lo, assim como o `useState`.
 */
export function useLocalStorageState<T>(
  key: string,
  initialState: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      return storedValue ? (JSON.parse(storedValue) as T) : initialState;
    } catch (error) {
      console.error(
        `Erro ao ler do localStorage para a chave "${key}":`,
        error
      );
      return initialState;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}
