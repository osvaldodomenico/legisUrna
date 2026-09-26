import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DisclaimerFooter } from "@/components/ui/Disclaimer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LegisUrna — Simulador de Votação 2026 (não oficial)",
  description:
    "Simulação não oficial do fluxo de votação das Eleições Gerais 2026. Não pertence, não representa e não é operado pelo TSE ou pela Justiça Eleitoral.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        {children}
        <DisclaimerFooter />
      </body>
    </html>
  );
}
