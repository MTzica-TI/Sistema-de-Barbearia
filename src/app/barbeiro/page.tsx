"use client";

import { useEffect, useMemo, useState } from "react";
import { Agendamento, Barbeiro } from "@/types";
import { horariosPadrao } from "@/lib/mock-data";

export default function BarbeiroPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [barbeiroId, setBarbeiroId] = useState("");

  useEffect(() => {
    async function carregarBarbeiros() {
      const response = await fetch("/api/barbeiros", { cache: "no-store" });
      const resultado = (await response.json()) as { barbeiros: Barbeiro[] };
      const lista = resultado.barbeiros ?? [];

      setListaBarbeiros(lista);
      setBarbeiroId((anterior) => {
        if (lista.some((item) => item.id === anterior)) {
          return anterior;
        }

        return lista[0]?.id ?? "";
      });
    }

    void carregarBarbeiros();
  }, []);

  useEffect(() => {
    async function carregar() {
      const response = await fetch("/api/agendamentos", { cache: "no-store" });
      const resultado = (await response.json()) as { agendamentos: Agendamento[] };
      setAgendamentos(resultado.agendamentos ?? []);
    }

    void carregar();
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);

  const agendaPessoal = useMemo(() => {
    const mapa = new Map(
      agendamentos
        .filter(
          (item) =>
            item.barbeiroId === barbeiroId &&
            item.data === hoje &&
            item.status === "Confirmado"
        )
        .map((item) => [item.horario, item])
    );

    return horariosPadrao.map((horario) => ({
      horario,
      agendamento: mapa.get(horario),
    }));
  }, [agendamentos, barbeiroId, hoje]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Painel do Barbeiro</h1>
      <p className="mt-2 text-amber-950/80">Agenda pessoal com horarios livres.</p>

      <div className="mt-6 max-w-sm">
        <label className="text-sm font-semibold text-amber-900">Selecionar barbeiro</label>
        <select
          className="mt-1 w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
          value={barbeiroId}
          onChange={(event) => setBarbeiroId(event.target.value)}
          disabled={listaBarbeiros.length === 0}
        >
          {listaBarbeiros.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
        {listaBarbeiros.length === 0 && (
          <p className="mt-2 text-sm text-amber-900/80">Nenhum barbeiro cadastrado.</p>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <h2 className="text-3xl text-amber-900">Agenda de hoje</h2>
        <div className="mt-4 space-y-2 text-sm text-amber-950/90">
          {agendaPessoal.map(({ horario, agendamento }) => (
            <p key={horario}>
              {horario} - {agendamento ? `${agendamento.clienteNome} - ${agendamento.servicoNome}` : "Livre"}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
