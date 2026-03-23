"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Agendamento } from "@/types";
import type { Barbeiro } from "@/types";
import { servicos } from "@/lib/mock-data";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const AUTH_EVENT = "barber-auth-change";
const USUARIOS_KEY = "barber_usuarios";

type StatusAcesso = "carregando" | "negado" | "permitido";
type FiltroEquipe = "todos" | "ativos" | "inativos";

type ClienteCadastro = {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  fotoUrl?: string;
};

function carregarClientesDoStorage(): ClienteCadastro[] {
  if (typeof window === "undefined") {
    return [];
  }

  const valorBruto = window.localStorage.getItem(USUARIOS_KEY);
  if (!valorBruto) {
    return [];
  }

  try {
    const parsed = JSON.parse(valorBruto) as ClienteCadastro[];
    return Array.isArray(parsed)
      ? [...parsed].sort((a, b) => a.nome.localeCompare(b.nome))
      : [];
  } catch {
    return [];
  }
}

export default function AdminPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [clientes, setClientes] = useState<ClienteCadastro[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [mensagem, setMensagem] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState<FiltroEquipe>("todos");
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
      setClientes(carregarClientesDoStorage());
    }

    if (statusAcesso === "permitido") {
      void carregar();
    }
  }, [statusAcesso]);

  useEffect(() => {
    if (statusAcesso !== "permitido") {
      return;
    }

    function sincronizarClientes() {
      setClientes(carregarClientesDoStorage());
    }

    window.addEventListener(AUTH_EVENT, sincronizarClientes);
    window.addEventListener("storage", sincronizarClientes);

    return () => {
      window.removeEventListener(AUTH_EVENT, sincronizarClientes);
      window.removeEventListener("storage", sincronizarClientes);
    };
  }, [statusAcesso]);

  const agendamentosDaData = useMemo(
    () => agendamentos.filter((item) => item.data === dataSelecionada),
    [agendamentos, dataSelecionada]
  );

  const agendaConfirmadaDaData = useMemo(
    () => agendamentosDaData.filter((item) => item.status === "Confirmado"),
    [agendamentosDaData]
  );

  const mapaPrecoServico = useMemo(
    () => new Map(servicos.map((item) => [item.id, item.preco])),
    []
  );

  const faturamentoHoje = useMemo(
    () =>
      agendaConfirmadaDaData.reduce(
        (total, item) => total + (mapaPrecoServico.get(item.servicoId) ?? 60),
        0
      ),
    [agendaConfirmadaDaData, mapaPrecoServico]
  );

  const clientesComAgendamentoHoje = useMemo(
    () =>
      new Set(
        agendaConfirmadaDaData.map((item) => item.clienteTelefone || item.clienteNome)
      ).size,
    [agendaConfirmadaDaData]
  );

  const equipeFiltrada = useMemo(() => {
    if (filtroEquipe === "ativos") {
      return listaBarbeiros.filter((item) => item.ativo);
    }

    if (filtroEquipe === "inativos") {
      return listaBarbeiros.filter((item) => !item.ativo);
    }

    return listaBarbeiros;
  }, [filtroEquipe, listaBarbeiros]);

  const faturamentoPorBarbeiro = useMemo(() => {
    return listaBarbeiros
      .map((barbeiro) => {
        const agendamentosHoje = agendaConfirmadaDaData.filter(
          (item) => item.barbeiroId === barbeiro.id
        );
        const valor = agendamentosHoje.reduce(
          (total, item) => total + (mapaPrecoServico.get(item.servicoId) ?? 60),
          0
        );

        return {
          id: barbeiro.id,
          nome: barbeiro.nome,
          quantidade: agendamentosHoje.length,
          valor,
        };
      })
      .sort((a, b) => b.valor - a.valor);
  }, [agendaConfirmadaDaData, listaBarbeiros, mapaPrecoServico]);

  const clientesFiltrados = useMemo(() => {
    const termo = buscaCliente.trim().toLowerCase();
    if (!termo) {
      return clientes;
    }

    return clientes.filter(
      (cliente) =>
        cliente.nome.toLowerCase().includes(termo) ||
        cliente.email.toLowerCase().includes(termo) ||
        cliente.telefone.toLowerCase().includes(termo)
    );
  }, [buscaCliente, clientes]);

  const resumoClientes = useMemo(() => {
    return clientesFiltrados.map((cliente) => {
      const total = agendamentos.filter(
        (item) =>
          item.clienteTelefone === cliente.telefone ||
          item.clienteNome.toLowerCase() === cliente.nome.toLowerCase()
      );

      const hojeCliente = total.filter(
        (item) => item.data === dataSelecionada && item.status === "Confirmado"
      );

      return {
        ...cliente,
        totalAgendamentos: total.length,
        agendamentosHoje: hojeCliente.length,
      };
    });
  }, [agendamentos, clientesFiltrados, dataSelecionada]);

  const dataSelecionadaFormatada = useMemo(() => {
    const [ano, mes, dia] = dataSelecionada.split("-");
    if (!ano || !mes || !dia) {
      return dataSelecionada;
    }

    return `${dia}/${mes}/${ano}`;
  }, [dataSelecionada]);

  function escaparCsv(valor: string | number) {
    const texto = String(valor ?? "").replaceAll('"', '""');
    return `"${texto}"`;
  }

  function exportarRelatorioCsv() {
    if (agendamentosDaData.length === 0) {
      setMensagem("Nao ha agendamentos na data selecionada para exportar.");
      return;
    }

    const cabecalho = [
      "Data",
      "Horario",
      "Cliente",
      "Telefone",
      "Plano",
      "Servico",
      "Barbeiro",
      "Status",
      "Pagamento",
      "Valor estimado",
    ];

    const linhas = agendamentosDaData.map((item) => {
      const valor = mapaPrecoServico.get(item.servicoId) ?? 60;
      return [
        item.data,
        item.horario,
        item.clienteNome,
        item.clienteTelefone,
        item.plano,
        item.servicoNome,
        item.barbeiroNome,
        item.status,
        item.pagamentoStatus,
        valor,
      ]
        .map((coluna) => escaparCsv(coluna))
        .join(";");
    });

    const csv = [cabecalho.map((item) => escaparCsv(item)).join(";"), ...linhas].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-admin-${dataSelecionada}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setMensagem(`Relatorio CSV exportado para ${dataSelecionadaFormatada}.`);
  }

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

      <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-4">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">Data de analise</span>
          <input
            className="rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            type="date"
            value={dataSelecionada}
            onChange={(event) => setDataSelecionada(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={exportarRelatorioCsv}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white"
        >
          Exportar CSV da data
        </button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card titulo="Agenda confirmada" valor={String(agendaConfirmadaDaData.length)} />
        <Card titulo="Clientes marcados" valor={String(clientesComAgendamentoHoje)} />
        <Card
          titulo="Barbeiros ativos"
          valor={String(listaBarbeiros.filter((item) => item.ativo).length)}
        />
        <Card
          titulo="Faturamento (estimado)"
          valor={`R$ ${faturamentoHoje}`}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <h2 className="text-3xl text-amber-900">Agenda de {dataSelecionadaFormatada}</h2>
        <div className="mt-4 space-y-2 text-sm">
          {agendaConfirmadaDaData.length === 0 && (
            <p>Nenhum agendamento confirmado na data selecionada.</p>
          )}
          {agendaConfirmadaDaData.map((item) => (
            <p key={item.id}>
              {item.horario} - {item.clienteNome} - {item.servicoNome} ({item.barbeiroNome})
            </p>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl text-amber-900">Barbeiros e disponibilidade</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFiltroEquipe("todos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filtroEquipe === "todos"
                  ? "bg-amber-900 text-white"
                  : "border border-amber-900/20 bg-white text-amber-900"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEquipe("ativos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filtroEquipe === "ativos"
                  ? "bg-amber-900 text-white"
                  : "border border-amber-900/20 bg-white text-amber-900"
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEquipe("inativos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${
                filtroEquipe === "inativos"
                  ? "bg-amber-900 text-white"
                  : "border border-amber-900/20 bg-white text-amber-900"
              }`}
            >
              Inativos
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          {equipeFiltrada.map((item) => (
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

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <h2 className="text-3xl text-amber-900">Faturamento por barbeiro (hoje)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {faturamentoPorBarbeiro.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-amber-900/15 bg-white p-4"
            >
              <p className="text-lg font-semibold text-amber-950">{item.nome}</p>
              <p className="mt-2 text-sm text-amber-900/80">
                Agendamentos hoje: <strong>{item.quantidade}</strong>
              </p>
              <p className="mt-1 text-sm text-amber-900/80">
                Faturamento hoje: <strong>R$ {item.valor}</strong>
              </p>
            </article>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl text-amber-900">Clientes cadastrados</h2>
          <input
            className="w-full max-w-sm rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            placeholder="Buscar por nome, email ou telefone"
            value={buscaCliente}
            onChange={(event) => setBuscaCliente(event.target.value)}
          />
        </div>

        <div className="mt-4 grid gap-3">
          {resumoClientes.length === 0 && (
            <p className="text-sm text-amber-900/80">Nenhum cliente encontrado.</p>
          )}

          {resumoClientes.map((cliente) => (
            <article
              key={cliente.email}
              className="grid gap-3 rounded-xl border border-amber-900/15 bg-white p-3 sm:grid-cols-[72px_1fr]"
            >
              <div className="relative h-16 w-16 overflow-hidden rounded-full border border-amber-900/20 bg-amber-50">
                {cliente.fotoUrl ? (
                  <Image
                    src={cliente.fotoUrl}
                    alt={`Foto de ${cliente.nome}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-amber-900/70">
                    Sem foto
                  </div>
                )}
              </div>

              <div className="grid gap-1 text-sm text-amber-950/90">
                <p className="text-base font-semibold text-amber-950">{cliente.nome}</p>
                <p>Email: {cliente.email}</p>
                <p>Telefone: {cliente.telefone}</p>
                <p>
                  Agendamentos totais: <strong>{cliente.totalAgendamentos}</strong> | Hoje:{" "}
                  <strong>{cliente.agendamentosHoje}</strong>
                </p>
              </div>
            </article>
          ))}
        </div>
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
