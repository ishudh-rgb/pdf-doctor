import { ImageResponse } from "next/og";
import { APP_NAME } from "@/config/constants";

export const alt = `${APP_NAME} — Free Online PDF Tools`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)",
          color: "#ffffff",
          fontFamily: "system-ui, sans-serif",
          padding: 64,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: -2,
            marginBottom: 24,
          }}
        >
          {APP_NAME}
        </div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 500,
            opacity: 0.92,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.35,
          }}
        >
          Merge, Split, Compress, Convert &amp; Edit PDFs — Free Online
        </div>
      </div>
    ),
    { ...size }
  );
}
