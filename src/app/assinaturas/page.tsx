"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ASSINATURA_CONFIG_KEY,
  ASSINATURA_EVENT,
  DEFAULT_ASSINATURA_CONFIG,
  type AssinaturaConfig,
} from "@/lib/assinaturas-config";

export default function AssinaturasPage() {
  const [configAssinatura, setConfigAssinatura] = useState<AssinaturaConfig>(
    DEFAULT_ASSINATURA_CONFIG
  );

  useEffect(() => {
    function carregarConfigAssinatura() {
      const valorBruto = window.localStorage.getItem(ASSINATURA_CONFIG_KEY);
      if (!valorBruto) {
        setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
        return;
      }

      try {
        const parsed = JSON.parse(valorBruto) as AssinaturaConfig;
        if (!parsed?.planos || !parsed?.formasPagamento) {
          setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
          return;
        }

        setConfigAssinatura(parsed);
      } catch {
        setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
      }
    }

    carregarConfigAssinatura();
    window.addEventListener(ASSINATURA_EVENT, carregarConfigAssinatura);
    window.addEventListener("storage", carregarConfigAssinatura);

    return () => {
      window.removeEventListener(ASSINATURA_EVENT, carregarConfigAssinatura);
      window.removeEventListener("storage", carregarConfigAssinatura);
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-amber-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-[var(--brand)]/15 blur-3xl" />

        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-900/80">
          Assinaturas e Pagamentos
        </p>
        <h1 className="mt-2 text-5xl text-amber-950">Planos Mensais</h1>
        <p className="mt-3 max-w-3xl text-amber-950/80">
          Escolha um plano para manter sua rotina em dia com previsibilidade de agenda,
          melhor custo mensal e atendimento continuo.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {configAssinatura.planos.map((plano) => (
          <article
            key={plano.nome}
            className={`rounded-2xl border p-5 ${
              plano.destaque
                ? "border-amber-700/40 bg-gradient-to-br from-amber-100/70 to-amber-50 shadow"
                : "border-amber-900/20 bg-[var(--surface)]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-3xl text-amber-900">{plano.nome}</h2>
              {plano.destaque && (
                <span className="rounded-full bg-amber-900 px-2.5 py-1 text-xs font-semibold text-amber-50">
                  Mais escolhido
                </span>
              )}
            </div>

            <p className="mt-3 text-4xl font-bold text-amber-950">
              {plano.preco}
              <span className="ml-1 text-base font-medium text-amber-900/80">{plano.ciclo}</span>
            </p>

            <ul className="mt-4 space-y-2 text-sm text-amber-950/90">
              {plano.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-700" />
                  <span>{beneficio}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/agendamento"
              className="mt-5 inline-block rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
            >
              Assinar este plano
            </Link>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
          <h3 className="text-3xl text-amber-900">Formas de pagamento</h3>
          <ul className="mt-3 space-y-2 text-sm text-amber-950/90">
            {configAssinatura.formasPagamento.map((forma) => (
              <li key={forma} className="flex items-start gap-2">
                <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-700" />
                <span>{forma}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-amber-900/75">
            A renovacao acontece automaticamente a cada 30 dias. O cliente pode solicitar
            cancelamento ate 24h antes da proxima cobranca.
          </p>
        </article>

        <article className="rounded-2xl border border-amber-900/20 bg-white p-5">
          <h3 className="text-3xl text-amber-900">Status do plano no perfil</h3>
          <p className="mt-3 text-sm text-amber-950/90">
            Na sua Area do Cliente, voce visualiza o status do plano mensal como:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              Ativo
            </span>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
              Inativo
            </span>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              Sem plano
            </span>
          </div>
          <Link
            href="/area-cliente"
            className="mt-5 inline-block rounded-lg border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
          >
            Ver meu status
          </Link>
        </article>
      </div>
    </section>
  );
}
