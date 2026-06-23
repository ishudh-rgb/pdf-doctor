export type BrowserComposeSlot =
  | { kind: "original"; page: number }
  | { kind: "blank" }
  | { kind: "imported"; sessionId: string; page: number };

export type PageRange = { start: number; end: number };
