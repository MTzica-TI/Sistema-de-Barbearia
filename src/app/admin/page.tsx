"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Agendamento } from "@/types";
import { barbeiros } from "@/lib/mock-data";
import type { Barbeiro } from "@/types";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const BARBEIROS_KEY = "barber_barbeiros";
const BARBEIROS_EVENT = "barber-barbeiros-change";
const AUTH_EVENT = "barber-auth-change";

type StatusAcesso = "carregando" | "negado" | "permitido";

function carregarBarbeirosSalvos(): Barbeiro[] {
  if (typeof window === "undefined") {
    return barbeiros;
  }

  const valorBruto = window.localStorage.getItem(BARBEIROS_KEY);
  if (!valorBruto) {
    return barbeiros;
  }

  try {
    const parsed = JSON.parse(valorBruto) as Barbeiro[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : barbeiros;
  } catch {
    return barbeiros;
  }
}

export default function AdminPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>(barbeiros);
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    function sincronizarAcessoAdmin() {
      const sessaoAdmin = window.localStorage.getItem(ADMIN_SESSAO_KEY);
      setStatusAcesso(sessaoAdmin ? "permitido" : "negado");
      setListaBarbeiros(carregarBarbeirosSalvos());
    }

    sincronizarAcessoAdmin();
    window.addEventListener(AUTH_EVENT, sincronizarAcessoAdmin);
    window.addEventListener("storage", sincronizarAcessoAdmin);

    return () => {
      window.removeEventListener(AUTH_EVENT, sincronizarAcessoAdmin);
      window.removeEventListener("storage", sincronizarAcessoAdmin);
    };
  }, []);

  useEffect(() => {
    async function carregar() {
      const response = await fetch("/api/agendamentos", { cache: "no-store" });
      const resultado = (await response.json()) as { agendamentos: Agendamento[] };
      setAgendamentos(resultado.agendamentos ?? []);
    }

    if (statusAcesso === "permitido") {
      void carregar();
    }
  }, [statusAcesso]);

  const hoje = new Date().toISOString().slice(0, 10);
  const agendaHoje = agendamentos.filter(
    (item) => item.data === hoje && item.status === "Confirmado"
  );

  const faturamentoHoje = useMemo(
    () => agendaHoje.length * 60,
    [agendaHoje.length]
  );

  function atualizarCampoBarbeiro(
    id: string,
    campo: "nome" | "especialidade" | "fotoUrl",
    valor: string
  ) {
    setListaBarbeiros((anterior) =>
      anterior.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  function salvarBarbeiros() {
    window.localStorage.setItem(BARBEIROS_KEY, JSON.stringify(listaBarbeiros));
    window.dispatchEvent(new Event(BARBEIROS_EVENT));
    setMensagem("Informacoes dos barbeiros atualizadas no site.");
  }

  function restaurarPadrao() {
    window.localStorage.removeItem(BARBEIROS_KEY);
    window.dispatchEvent(new Event(BARBEIROS_EVENT));
    setListaBarbeiros(barbeiros);
    setMensagem("Lista de barbeiros restaurada para o padrao.");
  }

  if (statusAcesso === "carregando") {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-amber-900">Verificando acesso de administrador...</p>
      </section>
    );
  }

  if (statusAcesso === "negado") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl text-amber-950">Acesso restrito</h1>
        <p className="mt-3 text-amber-950/80">
          Esta pagina e exclusiva para administradores.
        </p>
        <Link
          href="/admin/login"
          className="mt-5 inline-block rounded-lg bg-amber-900 px-5 py-2.5 font-semibold text-white"
        >
          Fazer login de administrador
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Dashboard Admin</h1>
      <p className="mt-2 text-amber-950/80">
        Agenda do dia, equipe e visao geral do negocio.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card titulo="Agenda de hoje" valor={String(agendaHoje.length)} />
        <Card titulo="Clientes marcados" valor={String(agendaHoje.length)} />
        <Card titulo="Barbeiros" valor={String(listaBarbeiros.length)} />
        <Card titulo="Faturamento (estimado)" valor={`R$ ${faturamentoHoje}`} />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <h2 className="text-3xl text-amber-900">Agenda do dia</h2>
        <div className="mt-4 space-y-2 text-sm">
          {agendaHoje.length === 0 && <p>Nenhum agendamento confirmado hoje.</p>}
          {agendaHoje.map((item) => (
            <p key={item.id}>
              {item.horario} - {item.clienteNome} - {item.servicoNome} ({item.barbeiroNome})
            </p>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl text-amber-900">Editar barbeiros</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={restaurarPadrao}
              className="rounded-lg border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900"
            >
              Restaurar padrao
            </button>
            <button
              type="button"
              onClick={salvarBarbeiros}
              className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Salvar alteracoes
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {listaBarbeiros.map((item) => (
            <article
              key={item.id}
              className="grid gap-2 rounded-xl border border-amber-900/15 bg-white p-3 sm:grid-cols-3"
            >
              <input
                className="rounded-lg border border-amber-900/20 px-3 py-2"
                value={item.nome}
                onChange={(event) =>
                  atualizarCampoBarbeiro(item.id, "nome", event.target.value)
                }
                placeholder="Nome"
              />
              <input
                className="rounded-lg border border-amber-900/20 px-3 py-2"
                value={item.especialidade}
                onChange={(event) =>
                  atualizarCampoBarbeiro(item.id, "especialidade", event.target.value)
                }
                placeholder="Especialidade"
              />
              <input
                className="rounded-lg border border-amber-900/20 px-3 py-2"
                value={item.fotoUrl}
                onChange={(event) =>
                  atualizarCampoBarbeiro(item.id, "fotoUrl", event.target.value)
                }
                placeholder="URL da foto"
              />
            </article>
          ))}
        </div>

        {mensagem && <p className="mt-3 text-sm text-amber-900">{mensagem}</p>}
      </div>
    </section>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <article className="rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-4">
      <p className="text-sm text-amber-900/75">{titulo}</p>
      <p className="mt-2 text-3xl text-amber-950">{valor}</p>
    </article>
  );
}
