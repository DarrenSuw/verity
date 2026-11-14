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
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, color: "#646f67" }}>
          <span style={{ width: 14, height: 14, background: "#22c55e", borderRadius: 3 }} />
          <span style={{ color: "#18231c", fontWeight: 600 }}>{organization.name}</span>
          <span style={{ width: 1, height: 22, background: "#cdd7cf" }} />
          <span>Message Check</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 92, lineHeight: 1.04, color: "#18231c", letterSpacing: -4, display: "flex" }}>
            Not sure it&apos;s really us?
          </div>
          <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.4, color: "#4a564e", maxWidth: 880, display: "flex" }}>
            Paste a suspicious message and see the warning signs explained, with the safe way to check.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 56, height: 4, background: "#16863e", borderRadius: 4 }} />
          <span style={{ fontSize: 24, color: "#646f67" }}>Guidance, not a guarantee</span>
        </div>
      </div>
    ),
    size,
  );
}
