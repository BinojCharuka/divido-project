const SOURCES = {
  full: ["/webp/logo-fulls.webp", "/webp/logo-fulls-dark.webp", "brand-full"],
  text: ["/webp/Logo - text.webp", "/webp/Logo - text-dark.webp", "brand-text-only"],
  icon: ["/webp/Logo-flavicon - 250px.webp", "/webp/logo-icon-dark.webp", "brand-icon-only"],
} as const;

/** The Divido logo; CSS shows the light or dark asset to match the theme. */
export function Brand({ variant = "full", className = "" }: { variant?: keyof typeof SOURCES; className?: string }) {
  const [light, dark, variantClass] = SOURCES[variant];
  return (
    <div className={`brand ${variantClass} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset swapped by theme */}
      <img src={light} alt="Divido" className="brand-logo-img light-only" />
      {/* eslint-disable-next-line @next/next/no-img-element -- small static brand asset swapped by theme */}
      <img src={dark} alt="" aria-hidden="true" className="brand-logo-img dark-only" />
    </div>
  );
}
