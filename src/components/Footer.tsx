import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white/90 text-slate-600">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
          <div>
            <p className="text-base font-bold text-slate-950">HELIOS</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              의료 기관의 라벨링, 로컬 학습, 연합학습 모니터링을 연결하는
              federated medical AI workspace.
            </p>
          </div>

          <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-3 md:text-right">
            <span className="inline-flex items-center gap-2 md:justify-end">
              <Mail className="h-4 w-4 text-[#0f62fe]" />
              contact@helios.local
            </span>
            <span className="inline-flex items-center gap-2 md:justify-end">
              <Phone className="h-4 w-4 text-[#0f62fe]" />
              02-1234-5678
            </span>
            <span className="inline-flex items-center gap-2 md:justify-end">
              <MapPin className="h-4 w-4 text-[#0f62fe]" />
              가천대학교 AI 공학관
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-2 border-t border-slate-200 pt-4 text-xs text-slate-400 sm:flex-row sm:items-center">
          <p>© 2026 HELIOS. All rights reserved.</p>
          <p>Research interface for federated medical AI workflows.</p>
        </div>
      </div>
    </footer>
  );
}
