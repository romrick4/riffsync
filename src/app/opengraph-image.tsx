import { ImageResponse } from "next/og";

export const alt = "RiffSync — One place for your band.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
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
          backgroundColor: "#1a1a1a",
          position: "relative",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(248,113,113,0.25) 0%, rgba(251,113,133,0.15) 40%, transparent 70%)",
            filter: "blur(60px)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* Logo mark */}
        <svg
          width="72"
          height="72"
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="og-grad"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="50%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="url(#og-grad)"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M18 34V16l14-2v14"
            stroke="url(#og-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="15" cy="34" r="3.5" fill="url(#og-grad)" />
          <circle cx="29" cy="28" r="3.5" fill="url(#og-grad)" />
        </svg>

        {/* Brand name */}
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 56,
            fontWeight: 700,
            background: "linear-gradient(to right, #f87171, #fb7185, #fdba74)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          RiffSync
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 24,
            color: "rgba(255,255,255,0.6)",
          }}
        >
          One place for your band.
        </div>
      </div>
    ),
    { ...size },
  );
}
