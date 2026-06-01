const loaded = new Map<string, Promise<void>>();

export function loadScript(src: string, id?: string): Promise<void> {
  const key = id ?? src;
  const existing = loaded.get(key);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Scripts can only load in the browser"));
      return;
    }
    if (id && document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    if (id) script.id = id;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });

  loaded.set(key, promise);
  return promise;
}
