import { ImageResponse } from "next/og";
import { organization } from "@/config/organization";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${organization.name} Message Check`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#74757c" }}>
          <span style={{ color: "#0e0e10", fontWeight: 600 }}>{organization.name}</span>
          <span style={{ width: 1, height: 22, background: "#d8d5cd" }} />
          <span>Message Check</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, lineHeight: 1.04, color: "#0e0e10", letterSpacing: -3, display: "flex" }}>
            Not sure it&apos;s really us?
          </div>
          <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.4, color: "#3f4046", maxWidth: 880, display: "flex" }}>
            Paste a suspicious message and see the warning signs explained, with the safe way to check.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 56, height: 4, background: "#8a6d3b", borderRadius: 4 }} />
          <span style={{ fontSize: 24, color: "#74757c" }}>Guidance, not a guarantee</span>
        </div>
      </div>
    ),
    size,
  );
}
