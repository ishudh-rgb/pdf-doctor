/** Crop canvas to non-transparent pixel bounds so signatures aren't lost in whitespace. */
export function trimCanvasToContent(canvas: HTMLCanvasElement, padding = 8): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) return canvas;

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const trimmed = document.createElement("canvas");
  trimmed.width = cropW + padding * 2;
  trimmed.height = cropH + padding * 2;

  const trimmedCtx = trimmed.getContext("2d");
  if (!trimmedCtx) return canvas;

  trimmedCtx.drawImage(canvas, minX, minY, cropW, cropH, padding, padding, cropW, cropH);
  return trimmed;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  const trimmed = trimCanvasToContent(canvas);
  return new Promise((resolve) => trimmed.toBlob((blob) => resolve(blob), "image/png"));
}

export function canvasToPngDataUrl(canvas: HTMLCanvasElement): string {
  return trimCanvasToContent(canvas).toDataURL("image/png");
}
