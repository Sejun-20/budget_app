import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hasApiKey } from "@/lib/apiKey";
import { getBalanceSummary } from "@/lib/dashboard";
import { formatWon } from "@/lib/money";

function ReceiptIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="1.8">
      <rect x="4.5" y="2" width="13" height="18" rx="1.5" />
      <line x1="7.5" y1="7" x2="14.5" y2="7" />
      <line x1="7.5" y1="11" x2="14.5" y2="11" />
    </svg>
  );
}

function PieIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <circle cx="11" cy="11" r="9" fill="#fff" />
      <path d="M11 2 A9 9 0 0 1 20 11 L11 11 Z" fill="var(--color-primary)" />
    </svg>
  );
}

function MoneyIcon({ sign, badgeColor }: { sign: "+" | "-"; badgeColor: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22">
      <rect x="3" y="5" width="14" height="10" rx="2" fill="none" stroke="#fff" strokeWidth="1.6" />
      <line x1="3" y1="10" x2="17" y2="10" stroke="#fff" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="4.6" fill={badgeColor} stroke="#fff" strokeWidth="1.2" />
      <line x1="13.8" y1="16" x2="18.2" y2="16" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
      {sign === "+" && <line x1="16" y1="13.8" x2="16" y2="18.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />}
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#fff" strokeWidth="1.8">
      <rect x="4" y="3" width="14" height="16" rx="1.5" />
      <line x1="7" y1="7.5" x2="15" y2="7.5" />
      <line x1="7" y1="11.5" x2="13" y2="11.5" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z" />
    </svg>
  );
}

const TILES = [
  { to: "/receipts/upload", label: "영수증", tint: "var(--color-primary-tint)", badge: "var(--color-primary)", icon: <ReceiptIcon /> },
  { to: "/dashboard", label: "대시보드", tint: "var(--color-gold-tint)", badge: "var(--color-gold)", icon: <PieIcon /> },
  {
    to: "/transactions/new?type=expense",
    label: "지출 추가",
    tint: "var(--color-red-tint)",
    badge: "var(--color-red)",
    icon: <MoneyIcon sign="-" badgeColor="var(--color-red-dark)" />,
  },
  { to: "/transactions", label: "전체 내역", tint: "var(--color-primary-tint)", badge: "var(--color-primary)", icon: <ListIcon /> },
  {
    to: "/transactions/new?type=income",
    label: "수입 추가",
    tint: "var(--color-green-tint)",
    badge: "var(--color-green)",
    icon: <MoneyIcon sign="+" badgeColor="var(--color-green-dark)" />,
  },
  { to: "/settings", label: "설정", tint: "var(--color-primary-tint)", badge: "var(--color-primary)", icon: <GearIcon /> },
];

export default function Home() {
  const [keySet, setKeySet] = useState(true);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    setKeySet(hasApiKey());
    getBalanceSummary().then((s) => setBalance(s.balance));
  }, []);

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-page-bg)" }}>
      <header
        className="flex flex-col gap-4 rounded-b-[32px] px-5 pb-[22px] pt-6"
        style={{ background: "var(--color-primary)" }}
      >
        <h1 className="text-2xl leading-none font-bold text-white">가계부</h1>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/75">현재 자산</span>
          <span className="text-[22px] font-bold text-white">{formatWon(balance)}</span>
        </div>
      </header>

      {!keySet && (
        <div
          className="mx-5 mt-4 rounded-2xl p-3 text-sm"
          style={{ background: "var(--color-gold-tint)", color: "var(--color-text-strong)" }}
        >
          영수증 사진 인식을 사용하려면 Claude API 키를 먼저 설정하세요.
          <div className="mt-1">
            <Link to="/settings" className="font-semibold underline">
              설정으로 이동
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col justify-center p-5">
        <div className="grid grid-cols-2 gap-3">
          {TILES.map((t) => (
            <Link
              key={t.label}
              to={t.to}
              className="flex h-[118px] flex-col items-center justify-center gap-[9px] rounded-[20px] px-[14px] active:opacity-80"
              style={{ background: t.tint }}
            >
              <div
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: t.badge }}
              >
                {t.icon}
              </div>
              <span className="text-center text-[12.5px] font-semibold" style={{ color: "var(--color-text)" }}>
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
