import { v4 as uuidv4 } from "uuid";

const FILE_SIZE_UNITS = ["B", "KB", "MB", "GB"] as const;

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${FILE_SIZE_UNITS[unitIndex]}`;
}

export function generateSecureFilename(originalName: string): string {
  const ext = getFileExtension(originalName);
  const id = uuidv4();
  return ext ? `${id}.${ext}` : id;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1 || lastDot === filename.length - 1) return "";
  return filename.slice(lastDot + 1).toLowerCase();
}

const VALID_FILE_TYPES: Record<string, string[]> = {
  pdf: ["application/pdf"],
  word: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  image: ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"],
  excel: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  powerpoint: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
};

export function isValidFileType(
  file: File,
  allowedCategories: string[]
): boolean {
  const allowedMimeTypes = allowedCategories.flatMap(
    (cat) => VALID_FILE_TYPES[cat] ?? []
  );
  return allowedMimeTypes.includes(file.type);
}

export function validateFileSize(
  file: File,
  maxSizeMB: number
): { valid: boolean; message: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxBytes) {
    return {
      valid: false,
      message: `File size (${formatFileSize(file.size)}) exceeds the maximum allowed size of ${maxSizeMB} MB.`,
    };
  }

  if (file.size === 0) {
    return { valid: false, message: "File is empty." };
  }

  return { valid: true, message: "" };
}

export function getMimeTypeCategory(mimeType: string): string | null {
  for (const [category, types] of Object.entries(VALID_FILE_TYPES)) {
    if (types.includes(mimeType)) return category;
  }
  return null;
}
