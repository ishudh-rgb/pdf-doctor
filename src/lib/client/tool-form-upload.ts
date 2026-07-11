/** POST multipart tool requests with upload + server-wait progress (no pipeline changes). */

const UPLOAD_WEIGHT = 40;
const PROCESSING_CAP = 92;
const TICK_MS = 450;

function parseErrorFromBlob(blob: Blob): Promise<string> {
  return blob
    .text()
    .then((text) => {
      try {
        const data = JSON.parse(text) as { error?: string };
        return data.error ?? "Processing failed. Please try again.";
      } catch {
        return "Processing failed. Please try again.";
      }
    })
    .catch(() => "Processing failed. Please try again.");
}

export async function postToolFormDataWithProgress(
  url: string,
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<{ blob: Blob; getHeader: (name: string) => string | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let processingTimer: ReturnType<typeof setInterval> | null = null;
    let latestProgress = 0;

    const emit = (next: number) => {
      latestProgress = Math.min(100, Math.max(0, next));
      onProgress(latestProgress);
    };

    const stopProcessingTimer = () => {
      if (processingTimer) {
        clearInterval(processingTimer);
        processingTimer = null;
      }
    };

    const startProcessingTimer = () => {
      stopProcessingTimer();
      processingTimer = setInterval(() => {
        if (latestProgress >= PROCESSING_CAP) return;
        const step = latestProgress < 60 ? 3 : latestProgress < 80 ? 2 : 1;
        emit(Math.min(PROCESSING_CAP, latestProgress + step));
      }, TICK_MS);
    };

    xhr.open("POST", url);
    xhr.responseType = "blob";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const uploadPct = Math.round((event.loaded / event.total) * UPLOAD_WEIGHT);
        emit(Math.min(UPLOAD_WEIGHT, uploadPct));
      }
    };

    xhr.upload.onloadend = () => {
      emit(Math.max(latestProgress, UPLOAD_WEIGHT));
      startProcessingTimer();
    };

    xhr.onload = () => {
      stopProcessingTimer();
      if (xhr.status >= 200 && xhr.status < 300) {
        emit(100);
        resolve({
          blob: xhr.response as Blob,
          getHeader: (name) => xhr.getResponseHeader(name),
        });
        return;
      }

      const failedBlob = xhr.response as Blob;
      void parseErrorFromBlob(failedBlob).then((message) => {
        reject(new Error(message));
      });
    };

    xhr.onerror = () => {
      stopProcessingTimer();
      reject(new Error("Network error. Check your connection and try again."));
    };

    xhr.onabort = () => {
      stopProcessingTimer();
      reject(new Error("Upload cancelled."));
    };

    xhr.send(formData);
  });
}
