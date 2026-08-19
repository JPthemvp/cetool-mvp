/**
 * Corppass login button — wordmark matches the official logo at
 * /portal/static/media/corppass.4f9ba5e6f668feb640273f897953bf12.svg
 *
 * The Corppass mark is the lowercase "corppass" wordmark in blue (#2B2BB8 approx)
 * with a distinctive circular ring on the "c" letterform.
 * Button follows the official NDI button spec: white fill, blue border/text.
 */

interface CorppassLogoProps {
  width?: number;
  height?: number;
}

export function CorppassMark({ width = 120, height = 32 }: CorppassLogoProps) {
  return (
    <svg
      viewBox="0 0 200 48"
      width={width}
      height={height}
      aria-label="Corppass"
      role="img"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/*
        Corppass wordmark: "corppass" all lowercase in blue.
        The "c" has a distinctive ring/circle element at its opening.
        Color: approx #2D2DB8 (NDI blue).
      */}

      {/* Ring on the "c" — small circle at upper-right of the C opening */}
      <circle cx="20.5" cy="13" r="5" fill="#2D2DB8" />
      <circle cx="20.5" cy="13" r="2.8" fill="white" />

      {/* "c" letterform — open arc */}
      <path
        d="M28 18 C26 11 20 7 13 9 C6 11 3 18 5 25 C7 32 14 36 21 34 C26 32 29 28 30 24"
        stroke="#2D2DB8"
        strokeWidth="4.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* "orppass" — rendered as SVG text, Poppins-style sans-serif */}
      <text
        x="36"
        y="33"
        fontFamily="'Helvetica Neue', 'Arial', Helvetica, sans-serif"
        fontWeight="700"
        fontSize="26"
        fill="#2D2DB8"
        letterSpacing="-0.5"
      >
        orppass
      </text>
    </svg>
  );
}

interface CorppassButtonProps {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CorppassButton({
  onClick,
  disabled = false,
  busy = false,
  className = "",
  size = "md",
}: CorppassButtonProps) {
  const padding = size === "lg" ? "px-8 py-4" : size === "sm" ? "px-4 py-2.5" : "px-6 py-3";
  const logoW = size === "lg" ? 130 : size === "sm" ? 90 : 110;
  const logoH = size === "lg" ? 36 : size === "sm" ? 26 : 30;
  const textSz = size === "lg" ? 15 : size === "sm" ? 12 : 13;

  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      aria-label="Log in with Corppass"
      className={`inline-flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-[#2D2DB8] bg-white ${padding} transition hover:bg-blue-50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {busy ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#2D2DB8]/25 border-t-[#2D2DB8]" />
          <span className="font-semibold text-[#2D2DB8]" style={{ fontSize: textSz }}>
            Connecting…
          </span>
        </>
      ) : (
        <>
          <span className="text-[10px] font-medium text-[#2D2DB8]/70" style={{ letterSpacing: "0.04em" }}>
            Log in with
          </span>
          <CorppassMark width={logoW} height={logoH} />
        </>
      )}
    </button>
  );
}
