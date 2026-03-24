"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
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
  const dataFormatada = new Date(hoje).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const barbeiroSelecionado = useMemo(
    () => listaBarbeiros.find((b) => b.id === barbeiroId),
    [listaBarbeiros, barbeiroId]
  );

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

  const horariosLivres = useMemo(
    () => agendaPessoal.filter((slot) => !slot.agendamento).length,
    [agendaPessoal]
  );

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-amber-950">Painel do Barbeiro</h1>
        <p className="mt-2 text-amber-950/70">Visualize sua agenda e horários disponíveis</p>
      </div>

      {/* Seletor de Barbeiro com Card */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-amber-900">Seu Perfil</label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border-2 border-amber-900/20 bg-white px-4 py-3 pr-10 text-amber-950 transition-all hover:border-amber-900/40 focus:border-amber-900/60 focus:outline-none"
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
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-amber-900/40"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>

        {barbeiroSelecionado && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border-2 border-amber-900/15 bg-amber-50/50 p-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-amber-900/20">
              {barbeiroSelecionado.fotoUrl ? (
                <Image
                  src={barbeiroSelecionado.fotoUrl}
                  alt={barbeiroSelecionado.nome}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-amber-200 text-sm font-semibold text-amber-900">
                  {barbeiroSelecionado.nome.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-950">{barbeiroSelecionado.nome}</p>
              <p className="text-sm text-amber-900/70">{barbeiroSelecionado.especialidade || "Barbeiro"}</p>
            </div>
          </div>
        )}

        {listaBarbeiros.length === 0 && (
          <p className="mt-3 text-sm text-amber-900/60">Nenhum barbeiro cadastrado no sistema.</p>
        )}
      </div>

      {/* Agenda de Hoje */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-amber-950">Agenda de Hoje</h2>
          <p className="mt-1 text-sm text-amber-900/70 capitalize">{dataFormatada}</p>
          <div className="mt-3 flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-400"></div>
              <span className="text-amber-900">{horariosLivres} horários livres</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-amber-300"></div>
              <span className="text-amber-900">{agendaPessoal.length - horariosLivres} agendados</span>
            </div>
          </div>
        </div>

        {/* Grade de Horários */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {agendaPessoal.map(({ horario, agendamento }) => (
            <div
              key={horario}
              className={`rounded-lg border-2 p-4 transition-all ${
                agendamento
                  ? "border-amber-300 bg-gradient-to-br from-amber-50 to-amber-100/50"
                  : "border-green-200 bg-gradient-to-br from-green-50 to-green-100/30 hover:border-green-300"
              }`}
            >
              {/* Horário */}
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl font-bold text-amber-950">{horario}</span>
                <span
                  className={`ml-auto inline-block h-2 w-2 rounded-full ${
                    agendamento ? "bg-amber-400" : "bg-green-400"
                  }`}
                ></span>
              </div>

              {/* Status e Detalhes */}
              {agendamento ? (
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-amber-950">{agendamento.clienteNome}</p>
                  <p className="text-amber-900/75">{agendamento.servicoNome}</p>
                  <div className="mt-2 inline-block rounded bg-amber-200 px-2 py-1 text-xs font-medium text-amber-900">
                    Confirmado
                  </div>
                </div>
              ) : (
                <div className="text-sm text-green-600 font-medium">Disponível</div>
              )}
            </div>
          ))}
        </div>

        {agendaPessoal.length === 0 && (
          <div className="rounded-lg border-2 border-amber-900/15 bg-amber-50/50 p-8 text-center">
            <p className="text-amber-900">Nenhum horário configurado para hoje.</p>
          </div>
        )}
      </div>
    </section>
  );
}
