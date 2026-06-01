import { loadScript } from "@/lib/cloud-upload/load-script";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
      picker?: any;
    };
    gapi?: {
      load: (name: string, config: { callback: () => void }) => void;
    };
  }
}

function getClientId() {
  return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
}

function getApiKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_API_KEY?.trim() ?? "";
}

export function isGoogleDriveConfigured() {
  return Boolean(getClientId() && getApiKey());
}

async function getAccessToken(clientId: string): Promise<string> {
  await loadScript("https://accounts.google.com/gsi/client");
  if (!window.google?.accounts?.oauth2) {
    throw new Error("Google Sign-In failed to load");
  }

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/drive.readonly",
      callback: (response) => {
        if (response.access_token) resolve(response.access_token);
        else reject(new Error(response.error ?? "Google sign-in was cancelled"));
      },
    });
    client.requestAccessToken();
  });
}

async function downloadDriveFile(
  fileId: string,
  name: string,
  token: string
): Promise<File> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    throw new Error("Could not download the file from Google Drive");
  }
  const blob = await res.blob();
  const type = blob.type || "application/pdf";
  return new File([blob], name, { type });
}

async function loadPickerApi(): Promise<void> {
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise<void>((resolve, reject) => {
    if (!window.gapi?.load) {
      reject(new Error("Google API failed to load"));
      return;
    }
    window.gapi.load("picker", { callback: resolve });
  });
}

export async function pickFilesFromGoogleDrive(options?: {
  mimeTypes?: string;
  multiple?: boolean;
}): Promise<File[]> {
  const clientId = getClientId();
  const apiKey = getApiKey();
  if (!clientId || !apiKey) {
    throw new Error(
      "Google Drive is not configured. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID and NEXT_PUBLIC_GOOGLE_API_KEY to .env.local"
    );
  }

  const mimeTypes = options?.mimeTypes ?? "application/pdf";
  const multiple = options?.multiple ?? false;

  await loadPickerApi();
  const token = await getAccessToken(clientId);

  const pickerNs = window.google?.picker;
  if (!pickerNs) {
    throw new Error("Google Picker failed to load");
  }

  return new Promise((resolve, reject) => {
    try {
      const view = new pickerNs.DocsView(pickerNs.ViewId.DOCS)
        .setMimeTypes(mimeTypes)
        .setIncludeFolders(false);

      const picker = new pickerNs.PickerBuilder()
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .addView(view)
        .setCallback(async (data: { action: string; docs?: { id: string; name: string }[] }) => {
          if (data.action === pickerNs.Action.PICKED && data.docs?.length) {
            try {
              const picked = multiple ? data.docs : [data.docs[0]];
              const files = await Promise.all(
                picked.map((doc) => downloadDriveFile(doc.id, doc.name, token))
              );
              resolve(files);
            } catch (err) {
              reject(err);
            }
          } else if (data.action === pickerNs.Action.CANCEL) {
            resolve([]);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      reject(err);
    }
  });
}
