import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Página não encontrada</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">Verifique a URL ou volte ao início.</p>
      <Link href="/" className="rounded-lg bg-sky-700 px-5 py-2 font-semibold text-white">Voltar ao início</Link>
    </main>
  );
}
