import { qrMatrix } from '../utils/qr';

/** Modules of white margin the QR spec requires around the symbol so scanners lock on. */
const QUIET_ZONE = 4;

interface QrCodeProps {
  /** Text to encode — typically a payment URL. */
  value: string;
  /** Rendered edge length in CSS pixels. */
  size?: number;
  /** Accessible label; also what screen readers announce. */
  label?: string;
  className?: string;
}

/**
 * Renders a QR code as inline SVG.
 *
 * SVG rather than styled divs on purpose: browsers drop CSS background colours
 * when printing by default, but an SVG `fill` is foreground content and survives.
 * Returns null when there is nothing encodable, so callers can render the plain
 * text link on its own.
 */
export function QrCode({ value, size = 96, label = 'QR code', className }: QrCodeProps) {
  const matrix = qrMatrix(value);
  if (!matrix) return null;

  const count = matrix.length;
  const extent = count + QUIET_ZONE * 2;

  // Merge each row's consecutive dark modules into one rect — same picture, a
  // fraction of the DOM nodes.
  const bars: { x: number; y: number; w: number }[] = [];
  matrix.forEach((row, r) => {
    let runStart = -1;
    for (let c = 0; c <= count; c++) {
      const dark = c < count && row[c];
      if (dark && runStart === -1) runStart = c;
      if (!dark && runStart !== -1) {
        bars.push({ x: runStart + QUIET_ZONE, y: r + QUIET_ZONE, w: c - runStart });
        runStart = -1;
      }
    }
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${extent} ${extent}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label={label}
      className={className}
    >
      <rect width={extent} height={extent} fill="#ffffff" />
      {bars.map(bar => (
        <rect
          key={`${bar.y}-${bar.x}`}
          x={bar.x}
          y={bar.y}
          width={bar.w}
          height={1}
          fill="#000000"
        />
      ))}
    </svg>
  );
}
