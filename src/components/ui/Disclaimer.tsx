export const DISCLAIMER_TEXT =
  "SIMULAÇÃO NÃO OFICIAL — Este site não pertence, não representa e não é operado pelo TSE ou pela Justiça Eleitoral.";

export function DisclaimerBanner({ className = "" }: { className?: string }) {
  return (
    <p className={className} role="note">
      {DISCLAIMER_TEXT}
    </p>
  );
}

export function DisclaimerFooter() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-4 py-4 text-center text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      {DISCLAIMER_TEXT}
    </footer>
  );
}
