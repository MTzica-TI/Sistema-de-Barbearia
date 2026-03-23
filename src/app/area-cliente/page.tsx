"use client";

import { useEffect, useState } from "react";
import { Agendamento } from "@/types";

export default function AreaClientePage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    const response = await fetch("/api/agendamentos", { cache: "no-store" });
    const resultado = (await response.json()) as { agendamentos: Agendamento[] };
    setAgendamentos(resultado.agendamentos ?? []);
    setCarregando(false);
  }

  useEffect(() => {
    let ativo = true;

    async function carregarInicial() {
      const response = await fetch("/api/agendamentos", { cache: "no-store" });
      const resultado = (await response.json()) as { agendamentos: Agendamento[] };

      if (!ativo) {
        return;
      }

      setAgendamentos(resultado.agendamentos ?? []);
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
