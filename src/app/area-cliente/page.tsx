"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Agendamento } from "@/types";

const SESSAO_KEY = "barber_cliente_sessao";

type StatusAcesso = "carregando" | "negado" | "permitido";

function clienteLogado() {
  const valorBruto = window.localStorage.getItem(SESSAO_KEY);
  if (!valorBruto) {
    return false;
  }

  try {
    const parsed = JSON.parse(valorBruto) as { email?: string };
    return Boolean(parsed?.email);
  } catch {
    return false;
  }
}

export default function AreaClientePage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");

  async function carregar() {
    const response = await fetch("/api/agendamentos", { cache: "no-store" });
    const resultado = (await response.json()) as { agendamentos: Agendamento[] };
    setAgendamentos(resultado.agendamentos ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      if (!clienteLogado()) {
        if (ativo) {
          setStatusAcesso("negado");
          setCarregando(false);
        }
        return;
      }

      const response = await fetch("/api/agendamentos", { cache: "no-store" });
      const resultado = (await response.json()) as { agendamentos: Agendamento[] };

      if (!ativo) {
        return;
      }

      setAgendamentos(resultado.agendamentos ?? []);
      setStatusAcesso("permitido");
      setCarregando(false);
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  async function cancelar(id: string) {
    setCarregando(true);
    await fetch(`/api/agendamentos/${id}/cancelar`, { method: "PATCH" });
    await carregar();
  }

  if (statusAcesso === "carregando") {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-amber-900">Verificando acesso do cliente...</p>
      </section>
    );
  }

  if (statusAcesso === "negado") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl text-amber-950">Acesso restrito</h1>
        <p className="mt-3 text-amber-950/80">
          Esta area e exclusiva para clientes logados.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-amber-900 px-5 py-2.5 font-semibold text-white"
        >
          Ir para login
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Area do Cliente</h1>
      <p className="mt-2 text-amber-950/80">
        Veja ou cancele seus agendamentos confirmados.
      </p>

      {carregando ? (
        <p className="mt-6 text-sm">Carregando...</p>
      ) : (
        <div className="mt-6 space-y-3">
          {agendamentos.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-900/20 bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm text-amber-950/90">
                <p className="font-semibold">{item.clienteNome}</p>
                <p>
                  {item.servicoNome} com {item.barbeiroNome}
                </p>
                <p>
                  {item.data} as {item.horario} | {item.status}
                </p>
              </div>
              {item.status === "Confirmado" && (
                <button
                  onClick={() => cancelar(item.id)}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Cancelar
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
