import { ImageResponse } from "next/og";
import { APP_NAME } from "@/config/constants";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          fontSize: 18,
          fontWeight: 800,
          borderRadius: 6,
        }}
      >
        {APP_NAME.charAt(0)}
      </div>
    ),
    { ...size }
  );
}
