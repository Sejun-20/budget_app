import { Link } from "react-router-dom";

export default function HomeLink() {
  return (
    <Link
      to="/"
      aria-label="홈으로"
      className="inline-flex items-center justify-center rounded p-1.5"
      style={{ color: "var(--color-primary)" }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 10v9a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-9" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    </Link>
  );
}
