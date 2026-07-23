import { Link } from "react-router-dom";

export const APP_NAME = (import.meta.env.VITE_APP_TITLE as string | undefined) ?? "Tala Text To Speech";

type LogoProps = {
    size?: number;
    className?: string;
};

export const LogoMark = ({ size = 28, className }: LogoProps): JSX.Element => (
    <span
        className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 via-pink-500 to-indigo-500 shadow-lg shadow-fuchsia-500/20 ${className ?? ""}`}
        style={{ width: size, height: size }}
        aria-hidden
    >
        <svg
            viewBox="0 0 24 24"
            width={size * 0.6}
            height={size * 0.6}
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
        >
            <path d="M4 12h2" />
            <path d="M8 9v6" />
            <path d="M12 6v12" />
            <path d="M16 9v6" />
            <path d="M20 12h-2" />
        </svg>
    </span>
);

type WordmarkProps = {
    to?: string;
    tone?: "light" | "dark";
};

export const Wordmark = ({ to = "/", tone = "light" }: WordmarkProps): JSX.Element => {
    const color = tone === "light" ? "text-white" : "text-slate-900";
    return (
        <Link
            to={to}
            className={`group inline-flex items-center gap-2.5 font-semibold tracking-tight text-lg ${color}`}
        >
            <LogoMark size={30} className="transition-transform group-hover:scale-105" />
            <span>{APP_NAME}</span>
        </Link>
    );
};
