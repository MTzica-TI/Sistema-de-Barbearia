"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Agendamento } from "@/types";
import type { Barbeiro } from "@/types";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const AUTH_EVENT = "barber-auth-change";

type StatusAcesso = "carregando" | "negado" | "permitido";

export default function AdminPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [salvandoDisponibilidadeId, setSalvandoDisponibilidadeId] = useState("");
  const [salvandoPerfilId, setSalvandoPerfilId] = useState("");

  useEffect(() => {
    function sincronizarAcessoAdmin() {
      const sessaoAdmin = window.localStorage.getItem(ADMIN_SESSAO_KEY);
      setStatusAcesso(sessaoAdmin ? "permitido" : "negado");
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
      const [responseAgenda, responseBarbeiros] = await Promise.all([
        fetch("/api/agendamentos", { cache: "no-store" }),
        fetch("/api/barbeiros", { cache: "no-store" }),
      ]);
      const resultado = (await responseAgenda.json()) as { agendamentos: Agendamento[] };
      const resultadoBarbeiros = (await responseBarbeiros.json()) as {
        barbeiros: Barbeiro[];
      };
      setAgendamentos(resultado.agendamentos ?? []);
      setListaBarbeiros(resultadoBarbeiros.barbeiros ?? []);
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

  async function alternarDisponibilidade(barbeiro: Barbeiro) {
    setMensagem("");
    setSalvandoDisponibilidadeId(barbeiro.id);

    const response = await fetch("/api/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: barbeiro.id, ativo: !barbeiro.ativo }),
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagem(erro.error ?? "Nao foi possivel atualizar o barbeiro.");
      setSalvandoDisponibilidadeId("");
      return;
    }

    const resultado = (await response.json()) as { barbeiro: Barbeiro };
    setListaBarbeiros((anterior) =>
      anterior.map((item) => (item.id === resultado.barbeiro.id ? resultado.barbeiro : item))
    );

    setMensagem(
      resultado.barbeiro.ativo
        ? `Barbeiro ${resultado.barbeiro.nome} ativado para agendamento.`
        : `Barbeiro ${resultado.barbeiro.nome} desativado e bloqueado para agendamentos.`
    );
    setSalvandoDisponibilidadeId("");
  }

  function atualizarCampoBarbeiro(
    id: string,
    campo: "nome" | "especialidade" | "fotoUrl",
    valor: string
  ) {
    setListaBarbeiros((anterior) =>
      anterior.map((item) => (item.id === id ? { ...item, [campo]: valor } : item))
    );
  }

  async function salvarPerfilBarbeiro(barbeiro: Barbeiro) {
    setMensagem("");
    setSalvandoPerfilId(barbeiro.id);

    const response = await fetch("/api/barbeiros", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: barbeiro.id,
        nome: barbeiro.nome,
        especialidade: barbeiro.especialidade,
        fotoUrl: barbeiro.fotoUrl,
      }),
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagem(erro.error ?? "Nao foi possivel salvar o perfil do barbeiro.");
      setSalvandoPerfilId("");
      return;
    }

    const resultado = (await response.json()) as { barbeiro: Barbeiro };
    setListaBarbeiros((anterior) =>
      anterior.map((item) => (item.id === resultado.barbeiro.id ? resultado.barbeiro : item))
    );
    setMensagem(`Perfil de ${resultado.barbeiro.nome} atualizado com sucesso.`);
    setSalvandoPerfilId("");
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
        <Card
          titulo="Barbeiros ativos"
          valor={String(listaBarbeiros.filter((item) => item.ativo).length)}
        />
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
          <h2 className="text-3xl text-amber-900">Barbeiros e disponibilidade</h2>
        </div>

        <div className="mt-4 grid gap-3">
          {listaBarbeiros.map((item) => (
            <article
              key={item.id}
              className="grid gap-3 rounded-xl border border-amber-900/15 bg-white p-3"
            >
              <div className="grid gap-2 sm:grid-cols-3">
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
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold text-amber-900">
                  Status: {item.ativo ? "Ativo" : "Inativo"}
                </p>
                <button
                  type="button"
                  onClick={() => salvarPerfilBarbeiro(item)}
                  disabled={salvandoPerfilId === item.id}
                  className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {salvandoPerfilId === item.id ? "Salvando perfil..." : "Salvar perfil"}
                </button>
                <button
                  type="button"
                  onClick={() => alternarDisponibilidade(item)}
                  disabled={salvandoDisponibilidadeId === item.id}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    item.ativo ? "bg-red-600" : "bg-emerald-700"
                  }`}
                >
                  {salvandoDisponibilidadeId === item.id
                    ? "Salvando disponibilidade..."
                    : item.ativo
                      ? "Desativar"
                      : "Ativar"}
                </button>
              </div>
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
