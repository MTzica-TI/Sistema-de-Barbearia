"use client";

import { useEffect, useMemo, useState } from "react";
import { Agendamento, Barbeiro } from "@/types";
import { barbeiros as barbeirosPadrao, horariosPadrao } from "@/lib/mock-data";

const BARBEIROS_KEY = "barber_barbeiros";
const BARBEIROS_EVENT = "barber-barbeiros-change";

function carregarBarbeirosAtivos(): Barbeiro[] {
  const valorBruto = window.localStorage.getItem(BARBEIROS_KEY);
  if (!valorBruto) {
    return barbeirosPadrao;
  }

  try {
    const parsed = JSON.parse(valorBruto) as Barbeiro[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : barbeirosPadrao;
  } catch {
    return barbeirosPadrao;
  }
}

export default function BarbeiroPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>(barbeirosPadrao);
  const [barbeiroId, setBarbeiroId] = useState(barbeirosPadrao[0]?.id ?? "");

  useEffect(() => {
    function atualizarListaBarbeiros() {
      const lista = carregarBarbeirosAtivos();
      setListaBarbeiros(lista);
      setBarbeiroId((anterior) => {
        if (lista.some((item) => item.id === anterior)) {
          return anterior;
        }

        return lista[0]?.id ?? "";
      });
    }

    atualizarListaBarbeiros();
    window.addEventListener(BARBEIROS_EVENT, atualizarListaBarbeiros);
    window.addEventListener("storage", atualizarListaBarbeiros);

    return () => {
      window.removeEventListener(BARBEIROS_EVENT, atualizarListaBarbeiros);
      window.removeEventListener("storage", atualizarListaBarbeiros);
    };
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
        >
          {listaBarbeiros.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </select>
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
