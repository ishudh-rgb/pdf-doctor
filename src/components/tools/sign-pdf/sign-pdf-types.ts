export type SignTool = "select" | "signature" | "date" | "text" | "check";

export interface SavedSignature {
  id: string;
  label: string;
  dataUrl: string;
  kind: "signature" | "initials";
}

export interface PlacedAnnotation {
  id: string;
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  type: "image" | "text" | "date" | "check";
  dataUrl?: string;
  text?: string;
  fontSize?: number;
  imageIndex?: number;
}

export interface SignAnnotationPayload {
  type: "image" | "text" | "date" | "check";
  page: number;
  xNorm: number;
  yNorm: number;
  widthNorm: number;
  heightNorm: number;
  text?: string;
  fontSize?: number;
  imageIndex?: number;
}
