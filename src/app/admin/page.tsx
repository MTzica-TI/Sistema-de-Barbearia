"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Agendamento } from "@/types";
import type { Barbeiro, Servico } from "@/types";
import {
  ASSINATURA_CONFIG_KEY,
  ASSINATURA_EVENT,
  DEFAULT_ASSINATURA_CONFIG,
  type AssinaturaConfig,
} from "@/lib/assinaturas-config";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const AUTH_EVENT = "barber-auth-change";
const USUARIOS_KEY = "barber_usuarios";

type StatusAcesso = "carregando" | "negado" | "permitido";
type FiltroEquipe = "todos" | "ativos" | "inativos";
type ModoFormularioPlano = "criar" | "editar" | null;

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
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<ClienteCadastro[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [mensagem, setMensagem] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState<FiltroEquipe>("todos");
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [salvandoDisponibilidadeId, setSalvandoDisponibilidadeId] = useState("");
  const [salvandoPerfilId, setSalvandoPerfilId] = useState("");
  const [configAssinatura, setConfigAssinatura] = useState<AssinaturaConfig>(
    DEFAULT_ASSINATURA_CONFIG
  );
  const [salvandoAssinaturas, setSalvandoAssinaturas] = useState(false);
  const [modoFormularioPlano, setModoFormularioPlano] =
    useState<ModoFormularioPlano>(null);
  const [planoEmEdicaoIndex, setPlanoEmEdicaoIndex] = useState<number | null>(null);
  const [formasPagamentoTexto, setFormasPagamentoTexto] = useState(
    DEFAULT_ASSINATURA_CONFIG.formasPagamento.join("\n")
  );
  const [formPlano, setFormPlano] = useState({
    nome: "",
    preco: "",
    ciclo: "/mes",
    destaque: false,
    beneficiosTexto: "",
  });

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
      const [responseAgenda, responseBarbeiros, responseServicos] = await Promise.all([
        fetch("/api/agendamentos", { cache: "no-store" }),
        fetch("/api/barbeiros", { cache: "no-store" }),
        fetch("/api/servicos", { cache: "no-store" }),
      ]);
      const resultado = (await responseAgenda.json()) as { agendamentos: Agendamento[] };
      const resultadoBarbeiros = (await responseBarbeiros.json()) as {
        barbeiros: Barbeiro[];
      };
      const resultadoServicos = (await responseServicos.json()) as Servico[];
      setAgendamentos(resultado.agendamentos ?? []);
      setListaBarbeiros(resultadoBarbeiros.barbeiros ?? []);
      setServicos(resultadoServicos ?? []);
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

  useEffect(() => {
    if (statusAcesso !== "permitido") {
      return;
    }

    function carregarConfigAssinatura() {
      const valorBruto = window.localStorage.getItem(ASSINATURA_CONFIG_KEY);
      if (!valorBruto) {
        setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
        setFormasPagamentoTexto(DEFAULT_ASSINATURA_CONFIG.formasPagamento.join("\n"));
        return;
      }

      try {
        const parsed = JSON.parse(valorBruto) as AssinaturaConfig;
        if (!parsed?.planos || !parsed?.formasPagamento) {
          setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
          setFormasPagamentoTexto(DEFAULT_ASSINATURA_CONFIG.formasPagamento.join("\n"));
          return;
        }

        setConfigAssinatura(parsed);
        setFormasPagamentoTexto(parsed.formasPagamento.join("\n"));
      } catch {
        setConfigAssinatura(DEFAULT_ASSINATURA_CONFIG);
        setFormasPagamentoTexto(DEFAULT_ASSINATURA_CONFIG.formasPagamento.join("\n"));
      }
    }

    carregarConfigAssinatura();
    window.addEventListener(ASSINATURA_EVENT, carregarConfigAssinatura);
    window.addEventListener("storage", carregarConfigAssinatura);

    return () => {
      window.removeEventListener(ASSINATURA_EVENT, carregarConfigAssinatura);
      window.removeEventListener("storage", carregarConfigAssinatura);
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

      // Verificar status do plano mensal
      const agendamentosMensal = total.filter((item) => item.plano === "Mensal");
      const ehMensal = agendamentosMensal.length > 0;
      
      // Supondo que cada mês é cobrado no início (você pode ajustar essa lógica)
      const planoAtivo = ehMensal && agendamentosMensal.length > 0;

      return {
        ...cliente,
        totalAgendamentos: total.length,
        agendamentosHoje: hojeCliente.length,
        temPlanoMensal: ehMensal,
        planoMensalAtivo: planoAtivo,
      };
    });
  }, [agendamentos, clientesFiltrados, dataSelecionada]);

  const clientespaginados = useMemo(() => {
    const itensPorPagina = 10;
    const inicio = (paginaClientes - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return resumoClientes.slice(inicio, fim);
  }, [resumoClientes, paginaClientes]);

  const totalPaginasClientes = Math.ceil(resumoClientes.length / 10);

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

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function exportarRelatorioCsv() {
    if (agendamentosDaData.length === 0) {
      setMensagem("Nao ha agendamentos na data selecionada para exportar.");
      return;
    }

    const agendamentosOrdenados = [...agendamentosDaData].sort((a, b) => {
      const porHorario = a.horario.localeCompare(b.horario);
      if (porHorario !== 0) {
        return porHorario;
      }

      return a.clienteNome.localeCompare(b.clienteNome);
    });

    const totalCancelados = agendamentosDaData.filter(
      (item) => item.status === "Cancelado"
    ).length;

    const cabecalho = [
      "Data",
      "Horario",
      "Status",
      "Cliente",
      "Telefone",
      "Plano",
      "Servico",
      "Barbeiro",
      "Pagamento",
      "Valor estimado",
    ];

    const linhasDetalhamento = agendamentosOrdenados.map((item) => {
      const valor = mapaPrecoServico.get(item.servicoId) ?? 60;
      return [
        item.data,
        item.horario,
        item.status,
        item.clienteNome,
        item.clienteTelefone,
        item.plano,
        item.servicoNome,
        item.barbeiroNome,
        item.pagamentoStatus,
        formatarMoeda(valor),
      ];
    });

    const linhasFaturamentoPorBarbeiro = faturamentoPorBarbeiro.map((item) => [
      item.nome,
      item.quantidade,
      formatarMoeda(item.valor),
    ]);

    const tabelaCsv: Array<Array<string | number>> = [
      ["RELATORIO ADMINISTRATIVO - BARBER SISTEMA"],
      ["Data de referencia", dataSelecionadaFormatada],
      ["Gerado em", new Date().toLocaleString("pt-BR")],
      [],
      ["RESUMO"],
      ["Total de agendamentos", agendamentosDaData.length],
      ["Agendamentos confirmados", agendaConfirmadaDaData.length],
      ["Agendamentos cancelados", totalCancelados],
      ["Clientes marcados", clientesComAgendamentoHoje],
      ["Faturamento estimado", formatarMoeda(faturamentoHoje)],
      [],
      ["FATURAMENTO POR BARBEIRO"],
      ["Barbeiro", "Agendamentos confirmados", "Faturamento estimado"],
      ...linhasFaturamentoPorBarbeiro,
      [],
      ["DETALHAMENTO DOS AGENDAMENTOS"],
      cabecalho,
      ...linhasDetalhamento,
    ];

    const csv = tabelaCsv
      .map((linha) =>
        linha.length === 0 ? "" : linha.map((coluna) => escaparCsv(coluna)).join(";")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-admin-organizado-${dataSelecionada}.csv`;
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

  function persistirConfiguracaoAssinaturas(proximaConfig: AssinaturaConfig, mensagemSucesso: string) {
    window.localStorage.setItem(ASSINATURA_CONFIG_KEY, JSON.stringify(proximaConfig));
    window.dispatchEvent(new Event(ASSINATURA_EVENT));
    setConfigAssinatura(proximaConfig);
    setMensagem(mensagemSucesso);
  }

  function abrirFormularioPlanoCriar() {
    setModoFormularioPlano("criar");
    setPlanoEmEdicaoIndex(null);
    setFormPlano({
      nome: "",
      preco: "",
      ciclo: "/mes",
      destaque: false,
      beneficiosTexto: "",
    });
  }

  function abrirFormularioPlanoEditar(indicePlano: number) {
    const plano = configAssinatura.planos[indicePlano];
    if (!plano) {
      return;
    }

    setModoFormularioPlano("editar");
    setPlanoEmEdicaoIndex(indicePlano);
    setFormPlano({
      nome: plano.nome,
      preco: plano.preco,
      ciclo: plano.ciclo,
      destaque: plano.destaque,
      beneficiosTexto: plano.beneficios.join("\n"),
    });
  }

  function fecharFormularioPlano() {
    setModoFormularioPlano(null);
    setPlanoEmEdicaoIndex(null);
    setFormPlano({
      nome: "",
      preco: "",
      ciclo: "/mes",
      destaque: false,
      beneficiosTexto: "",
    });
  }

  function salvarFormasPagamento() {
    const formasPagamento = formasPagamentoTexto
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const proximaConfig = {
      ...configAssinatura,
      formasPagamento,
    };

    persistirConfiguracaoAssinaturas(proximaConfig, "Formas de pagamento atualizadas com sucesso.");
  }

  function handleSubmitPlano(event: React.FormEvent) {
    event.preventDefault();
    setMensagem("");

    const nome = formPlano.nome.trim();
    const preco = formPlano.preco.trim();
    const ciclo = formPlano.ciclo.trim() || "/mes";
    const beneficios = formPlano.beneficiosTexto
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    if (!nome || !preco || beneficios.length === 0) {
      setMensagem("Preencha nome, preco e ao menos um beneficio do plano.");
      return;
    }

    const planoSalvo = {
      nome,
      preco,
      ciclo,
      destaque: formPlano.destaque,
      beneficios,
    };

    setSalvandoAssinaturas(true);

    let proximaConfig: AssinaturaConfig;
    if (modoFormularioPlano === "editar" && planoEmEdicaoIndex !== null) {
      proximaConfig = {
        ...configAssinatura,
        planos: configAssinatura.planos.map((plano, indiceAtual) =>
          indiceAtual === planoEmEdicaoIndex ? planoSalvo : plano
        ),
      };
      persistirConfiguracaoAssinaturas(proximaConfig, "Plano atualizado com sucesso.");
    } else {
      proximaConfig = {
        ...configAssinatura,
        planos: [...configAssinatura.planos, planoSalvo],
      };
      persistirConfiguracaoAssinaturas(proximaConfig, "Plano criado com sucesso.");
    }

    setSalvandoAssinaturas(false);
    fecharFormularioPlano();
  }

  function removerPlano(indicePlano: number) {
    if (!confirm("Tem certeza que deseja remover este plano?")) {
      return;
    }

    const proximaConfig = {
      ...configAssinatura,
      planos: configAssinatura.planos.filter((_, indiceAtual) => indiceAtual !== indicePlano),
    };

    persistirConfiguracaoAssinaturas(proximaConfig, "Plano removido com sucesso.");
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

        <div className="mt-4 grid gap-2">
          {equipeFiltrada.map((item) => (
            <article
              key={item.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-amber-900/10 bg-white p-2"
            >
              {/* Nome e Status */}
              <div className="flex min-w-[200px] flex-col gap-1">
                <input
                  className="rounded-md border border-amber-900/20 px-2 py-1 text-sm"
                  value={item.nome}
                  onChange={(event) =>
                    atualizarCampoBarbeiro(item.id, "nome", event.target.value)
                  }
                  placeholder="Nome"
                />
                <p className="text-xs font-semibold text-amber-900">
                  {item.ativo ? "✓ Ativo" : "✗ Inativo"}
                </p>
              </div>

              {/* Especialidade */}
              <input
                className="flex-1 rounded-md border border-amber-900/20 px-2 py-1 text-sm"
                value={item.especialidade}
                onChange={(event) =>
                  atualizarCampoBarbeiro(item.id, "especialidade", event.target.value)
                }
                placeholder="Especialidade"
              />

              {/* Botões */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => salvarPerfilBarbeiro(item)}
                  disabled={salvandoPerfilId === item.id}
                  className="whitespace-nowrap rounded-md bg-[var(--brand)] px-2 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  title="Salvar alterações"
                >
                  {salvandoPerfilId === item.id ? "..." : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => alternarDisponibilidade(item)}
                  disabled={salvandoDisponibilidadeId === item.id}
                  className={`whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold text-white disabled:opacity-60 ${
                    item.ativo ? "bg-red-600" : "bg-emerald-700"
                  }`}
                  title={item.ativo ? "Desativar" : "Ativar"}
                >
                  {salvandoDisponibilidadeId === item.id
                    ? "..."
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
          <h2 className="text-3xl text-amber-900">Personalizar assinaturas</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={abrirFormularioPlanoCriar}
              className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950"
            >
              + Adicionar plano
            </button>
            <Link
              href="/assinaturas"
              className="rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
            >
              Ver pagina de assinaturas
            </Link>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {configAssinatura.planos.map((plano, indicePlano) => (
            <article
              key={`${plano.nome}-${indicePlano}`}
              className="rounded-xl border border-amber-900/15 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl text-amber-900">{plano.nome}</h3>
                {plano.destaque && (
                  <span className="rounded-full bg-amber-900 px-2 py-1 text-[11px] font-semibold text-amber-50">
                    Destaque
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-amber-900/90">
                {plano.preco} {plano.ciclo}
              </p>

              <ul className="mt-3 space-y-1 text-sm text-amber-950/90">
                {plano.beneficios.map((beneficio) => (
                  <li key={beneficio} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 rounded-full bg-amber-700" />
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => abrirFormularioPlanoEditar(indicePlano)}
                  className="flex-1 rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => removerPlano(indicePlano)}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Remover
                </button>
              </div>
            </article>
          ))}
        </div>

        {configAssinatura.planos.length === 0 && (
          <p className="mt-4 text-sm text-amber-900/80">Nenhum plano cadastrado.</p>
        )}

        <label className="mt-4 block space-y-1">
          <span className="text-sm font-semibold text-amber-900">Formas de pagamento (1 por linha)</span>
          <textarea
            className="min-h-24 w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm"
            value={formasPagamentoTexto}
            onChange={(event) => setFormasPagamentoTexto(event.target.value)}
          />
        </label>

        <button
          type="button"
          onClick={salvarFormasPagamento}
          disabled={salvandoAssinaturas}
          className="mt-4 rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {salvandoAssinaturas ? "Salvando..." : "Salvar formas de pagamento"}
        </button>
      </div>

      {modoFormularioPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold text-amber-950">
              {modoFormularioPlano === "editar" ? "Editar plano" : "Novo plano"}
            </h2>

            <form onSubmit={handleSubmitPlano} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-950">Nome do plano</label>
                <input
                  type="text"
                  value={formPlano.nome}
                  onChange={(event) =>
                    setFormPlano((anterior) => ({ ...anterior, nome: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                  placeholder="Ex: Plano Mensal Gold"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-amber-950">Preco</label>
                  <input
                    type="text"
                    value={formPlano.preco}
                    onChange={(event) =>
                      setFormPlano((anterior) => ({ ...anterior, preco: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                    placeholder="Ex: R$ 189,90"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-amber-950">Ciclo</label>
                  <input
                    type="text"
                    value={formPlano.ciclo}
                    onChange={(event) =>
                      setFormPlano((anterior) => ({ ...anterior, ciclo: event.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                    placeholder="Ex: /mes"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-amber-900">
                <input
                  type="checkbox"
                  checked={formPlano.destaque}
                  onChange={(event) =>
                    setFormPlano((anterior) => ({ ...anterior, destaque: event.target.checked }))
                  }
                />
                Marcar como plano em destaque
              </label>

              <div>
                <label className="block text-sm font-medium text-amber-950">
                  Beneficios (1 por linha)
                </label>
                <textarea
                  value={formPlano.beneficiosTexto}
                  onChange={(event) =>
                    setFormPlano((anterior) => ({
                      ...anterior,
                      beneficiosTexto: event.target.value,
                    }))
                  }
                  className="mt-1 min-h-28 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                  placeholder="Ex: 4 cortes por mes"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={fecharFormularioPlano}
                  className="flex-1 rounded-lg border border-amber-900/30 px-4 py-2 font-medium text-amber-950 hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoAssinaturas}
                  className="flex-1 rounded-lg bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-950 disabled:opacity-50"
                >
                  {salvandoAssinaturas ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

          {clientespaginados.map((cliente) => (
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
                <div className="flex items-center gap-2">
                  <p className="text-base font-semibold text-amber-950">{cliente.nome}</p>
                  {cliente.temPlanoMensal && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        cliente.planoMensalAtivo
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cliente.planoMensalAtivo ? "✓ Plano Ativo" : "✗ Plano Inativo"}
                    </span>
                  )}
                </div>
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

        {totalPaginasClientes > 1 && resumoClientes.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-amber-900/15 pt-4">
            <p className="text-sm text-amber-900/80">
              Página {paginaClientes} de {totalPaginasClientes} ({resumoClientes.length} clientes)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPaginaClientes((p) => Math.max(1, p - 1))}
                disabled={paginaClientes === 1}
                className="rounded-lg border border-amber-900/30 px-3 py-1 text-sm font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
              >
                ← Anterior
              </button>
              <button
                onClick={() => setPaginaClientes((p) => Math.min(totalPaginasClientes, p + 1))}
                disabled={paginaClientes === totalPaginasClientes}
                className="rounded-lg border border-amber-900/30 px-3 py-1 text-sm font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
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
