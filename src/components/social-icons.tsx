import type { SVGProps } from "react";

export function YouTubeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M21.58 7.19a2.76 2.76 0 0 0-1.94-1.95C17.92 4.78 12 4.78 12 4.78s-5.92 0-7.64.46a2.76 2.76 0 0 0-1.94 1.95A28.7 28.7 0 0 0 2 12a28.7 28.7 0 0 0 .42 4.81 2.76 2.76 0 0 0 1.94 1.95c1.72.46 7.64.46 7.64.46s5.92 0 7.64-.46a2.76 2.76 0 0 0 1.94-1.95A28.7 28.7 0 0 0 22 12a28.7 28.7 0 0 0-.42-4.81ZM10 15.12V8.88L15.4 12 10 15.12Z" />
    </svg>
  );
}

export function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      {...props}
    >
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="17.2" cy="6.8" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M15.12 22v-8.44h2.83l.42-3.28h-3.25V8.19c0-.95.26-1.6 1.63-1.6h1.74V3.67c-.3-.04-1.33-.13-2.53-.13-2.5 0-4.21 1.53-4.21 4.33v2.41H8.98v3.28h2.77V22h3.37z" />
    </svg>
  );
}
