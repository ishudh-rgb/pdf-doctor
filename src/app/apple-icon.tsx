import { ImageResponse } from "next/og";
import { APP_NAME } from "@/config/constants";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2563eb",
          color: "#fff",
          fontSize: 96,
          fontWeight: 800,
          borderRadius: 32,
        }}
      >
        {APP_NAME.charAt(0)}
      </div>
    ),
    { ...size }
  );
}
