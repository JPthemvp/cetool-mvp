/**
 * Corppass login button following the official SG government NDI button spec.
 *
 * Logo anatomy (from corppass.gov.sg):
 *   • Red octagonal badge (#C8102E) with a white "C" letterform inside
 *   • Wordmark: "Corp" in bold red, "pass" in regular dark grey
 *
 * Button spec:
 *   • White background, #C8102E 2px border, rounded
 *   • Badge + wordmark left-aligned inside the button
 */

interface CorppassLogoProps {
  width?: number;
  height?: number;
}

export function CorppassMark({ width = 100, height = 30 }: CorppassLogoProps) {
  return (
    <svg
      viewBox="0 0 160 48"
      width={width}
      height={height}
      aria-label="Corppass"
      role="img"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Octagonal badge — Singapore gov Corppass identity mark */}
      <path
        d="M14 2 L34 2 L46 14 L46 34 L34 46 L14 46 L2 34 L2 14 Z"
        fill="#C8102E"
      />
      {/* White "C" letterform */}
      <path
        d="M35 16 C32 12 26 10 21 12.5 C15 15 12 21 14 27 C16 33 22 37 28 36 C32 35 35 32 37 28"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Corp — bold red */}
      <text
        x="56"
        y="33"
        fontFamily="'Helvetica Neue', Arial, Helvetica, sans-serif"
        fontWeight="800"
        fontSize="22"
        fill="#C8102E"
        letterSpacing="-0.4"
      >
        Corp
      </text>
      {/* pass — regular dark */}
      <text
        x="107"
        y="33"
        fontFamily="'Helvetica Neue', Arial, Helvetica, sans-serif"
        fontWeight="400"
        fontSize="22"
        fill="#1a1a1a"
        letterSpacing="-0.4"
      >
        pass
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
  const logoW = size === "lg" ? 110 : size === "sm" ? 80 : 95;
  const logoH = size === "lg" ? 33 : size === "sm" ? 24 : 28;

  return (
    <button
      onClick={onClick}
      disabled={disabled || busy}
      className={`inline-flex items-center justify-center gap-3 rounded-lg border-2 border-[#C8102E] bg-white ${padding} transition hover:bg-red-50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {busy ? (
        <>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#C8102E]/25 border-t-[#C8102E]" />
          <span className="font-semibold text-[#C8102E]" style={{ fontSize: size === "lg" ? 17 : size === "sm" ? 13 : 15 }}>
            Connecting to Corppass…
          </span>
        </>
      ) : (
        <CorppassMark width={logoW} height={logoH} />
      )}
    </button>
  );
}
