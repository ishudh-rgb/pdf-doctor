/**
 * ConvertAPI PDF→DOCX — commercial-grade layout (closest to Smallpdf).
 * Requires CONVERTAPI_SECRET in environment.
 * @see https://www.convertapi.com/pdf-to-docx
 */

const CONVERTAPI_URL = "https://v2.convertapi.com/convert/pdf/to/docx";

export function isConvertApiAvailable(): boolean {
  return Boolean(process.env.CONVERTAPI_SECRET?.trim());
}

export async function pdfToWordConvertApi(
  fileBuffer: Buffer,
  fileName = "document.pdf"
): Promise<Buffer> {
  const secret = process.env.CONVERTAPI_SECRET?.trim();
  if (!secret) {
    throw new Error("CONVERTAPI_SECRET is not configured");
  }

  const body = {
    Parameters: [
      {
        Name: "File",
        FileValue: {
          Name: fileName,
          Data: fileBuffer.toString("base64"),
        },
      },
      {
        Name: "StoreFile",
        Value: false,
      },
    ],
  };

  const response = await fetch(CONVERTAPI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`ConvertAPI error ${response.status}: ${text.slice(0, 200)}`);
  }

  const json = (await response.json()) as {
    Files?: Array<{ FileData?: string; FileName?: string }>;
  };

  const fileData = json.Files?.[0]?.FileData;
  if (!fileData) {
    throw new Error("ConvertAPI returned no file data");
  }

  return Buffer.from(fileData, "base64");
}
