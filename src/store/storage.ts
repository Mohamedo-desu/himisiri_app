import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "my-app-storage",
});

export const mmkvStorage = {
  setItem: (key: string, value: string) => storage.set(key, value),
  getItem: (key: string) => {
    const value = storage.getString(key);
    return value ?? null;
  },
  removeItem: (key: string) => storage.delete(key),
  clearAll: () => storage.clearAll(),
};

export const saveToLocalStorage = (
  keyValuePairs: { key: string; value: string }[]
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  if (!Array.isArray(keyValuePairs)) {
    console.error("Input must be an array of key-value pairs.");
    return result;
  }
  for (const pair of keyValuePairs) {
    if (!pair.key || pair.value === undefined) {
      result[pair.key] = false;
      continue;
    }
    try {
      storage.set(pair.key, pair.value);
      result[pair.key] = true;
    } catch (error) {
      console.error(`Error saving key '${pair.key}' to local storage:`, error);
      result[pair.key] = false;
    }
  }
  return result;
};

export const getFromLocalStorage = (
  keys: string[]
): Record<string, string | null> => {
  const values: Record<string, string | null> = {};
  if (!Array.isArray(keys)) {
    console.error("Input must be an array of keys.");
    return values;
  }
  for (const key of keys) {
    try {
      values[key] = storage.getString(key) ?? null;
    } catch (error) {
      console.error(`Error retrieving key '${key}' from local storage:`, error);
      values[key] = null;
    }
  }
  return values;
};

export const deleteFromLocalStorage = (
  keys: string[]
): Record<string, boolean> => {
  const result: Record<string, boolean> = {};
  if (!Array.isArray(keys)) {
    console.error("Input must be an array of keys.");
    return result;
  }
  for (const key of keys) {
    try {
      storage.delete(key);
      result[key] = true;
    } catch (error) {
      console.error(`Error deleting key '${key}' from local storage:`, error);
      result[key] = false;
    }
  }
  return result;
};
