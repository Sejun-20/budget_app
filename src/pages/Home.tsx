import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { hasApiKey } from "@/lib/apiKey";

export default function Home() {
  const [keySet, setKeySet] = useState(true);

  useEffect(() => {
    setKeySet(hasApiKey());
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-6 text-center dark:bg-black">
      <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">영수증 가계부</h1>

      {!keySet && (
        <div className="w-full max-w-sm rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          영수증 사진 인식을 사용하려면 Claude API 키를 먼저 설정하세요.
          <div className="mt-2">
            <Link to="/settings" className="font-medium underline">
              설정으로 이동
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          to="/receipts/upload"
          className="rounded bg-black px-5 py-2.5 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          영수증 업로드
        </Link>
        <Link
          to="/transactions/new?type=expense"
          className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-700"
        >
          지출 추가
        </Link>
        <Link
          to="/transactions/new?type=income"
          className="rounded border border-zinc-300 px-5 py-2.5 text-sm font-medium dark:border-zinc-700"
        >
          수입 추가
        </Link>
      </div>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/dashboard" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          대시보드 보기
        </Link>
        <Link to="/transactions" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          전체 내역
        </Link>
        <Link to="/settings" className="text-sm text-zinc-500 underline dark:text-zinc-400">
          설정
        </Link>
      </div>
    </div>
  );
}
