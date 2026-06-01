import { loadScript } from "@/lib/cloud-upload/load-script";

type DropboxFile = {
  name: string;
  link: string;
  bytes: number;
};

declare global {
  interface Window {
    Dropbox?: {
      choose: (options: {
        success: (files: DropboxFile[]) => void;
        cancel?: () => void;
        linkType: "preview" | "direct";
        extensions?: string[];
        multiselect?: boolean;
        folderselect?: boolean;
      }) => void;
    };
  }
}

function getAppKey() {
  return process.env.NEXT_PUBLIC_DROPBOX_APP_KEY?.trim() ?? "";
}

export function isDropboxConfigured() {
  return Boolean(getAppKey());
}

async function loadDropboxChooser(): Promise<void> {
  const appKey = getAppKey();
  if (!appKey) {
    throw new Error(
      "Dropbox is not configured. Add NEXT_PUBLIC_DROPBOX_APP_KEY to .env.local"
    );
  }

  const scriptId = "dropboxjs";
  if (!document.getElementById(scriptId)) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.dropbox.com/static/api/2/dropbox.js";
      script.setAttribute("data-app-key", appKey);
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Dropbox Chooser"));
      document.head.appendChild(script);
    });
  } else {
    await loadScript("https://www.dropbox.com/static/api/2/dropbox.js", scriptId);
  }
}

export async function pickFilesFromDropbox(options?: {
  extensions?: string[];
  multiple?: boolean;
}): Promise<File[]> {
  await loadDropboxChooser();

  if (!window.Dropbox?.choose) {
    throw new Error("Dropbox Chooser failed to load");
  }

  const extensions = options?.extensions ?? [".pdf"];
  const multiple = options?.multiple ?? false;

  return new Promise((resolve, reject) => {
    window.Dropbox!.choose({
      linkType: "direct",
      extensions,
      multiselect: multiple,
      success: async (files) => {
        try {
          const result = await Promise.all(
            files.map(async (entry) => {
              const res = await fetch(entry.link);
              if (!res.ok) {
                throw new Error(`Could not download ${entry.name} from Dropbox`);
              }
              const blob = await res.blob();
              const type = blob.type || "application/pdf";
              return new File([blob], entry.name, { type });
            })
          );
          resolve(result);
        } catch (err) {
          reject(err);
        }
      },
      cancel: () => resolve([]),
    });
  });
}
