// Per-browser UI settings (theme, framework map). Storage can be missing or throw (private mode, blocked site data):
// then the setting holds for this page view only.
export const localStorageOf = (document: Document): Storage | undefined => {
  try {
    return document.defaultView?.localStorage;
  } catch {
    return undefined;
  }
};

export const readSetting = (
  storage: Storage | undefined,
  key: string,
): string | undefined => {
  try {
    return storage?.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
};

export const writeSetting = (
  storage: Storage | undefined,
  key: string,
  value: string | undefined,
): void => {
  try {
    if (value === undefined) storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    // storage unavailable: see the note at the top
  }
};
