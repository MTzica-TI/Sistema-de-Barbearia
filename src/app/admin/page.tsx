"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Agendamento, Barbeiro, Plano, Servico } from "@/types";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
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

type AssinaturaClienteResumo = {
  clienteTelefone: string;
  plano: Plano;
  status: "Ativa" | "Cancelada";
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

async function lerJsonSeguro<T>(response: Response, fallback: T): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export default function AdminPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [clientes, setClientes] = useState<ClienteCadastro[]>([]);
  const [assinaturasClientes, setAssinaturasClientes] = useState<AssinaturaClienteResumo[]>([]);
  const [dataSelecionada, setDataSelecionada] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [mensagem, setMensagem] = useState("");
  const [buscaCliente, setBuscaCliente] = useState("");
  const [filtroEquipe, setFiltroEquipe] = useState<FiltroEquipe>("todos");
  const [paginaClientes, setPaginaClientes] = useState(1);
  const [salvandoDisponibilidadeId, setSalvandoDisponibilidadeId] = useState("");
  const [salvandoPerfilId, setSalvandoPerfilId] = useState("");
  const [processandoAssinaturaClienteTelefone, setProcessandoAssinaturaClienteTelefone] =
    useState("");
  const [criandoPerfilBarbeiro, setCriandoPerfilBarbeiro] = useState(false);
  const [excluindoPerfilId, setExcluindoPerfilId] = useState("");
  const [barbeiroParaExcluir, setBarbeiroParaExcluir] = useState<Barbeiro | null>(null);
  const [indicePlanoParaExcluir, setIndicePlanoParaExcluir] = useState<number | null>(null);
  const [novoBarbeiro, setNovoBarbeiro] = useState({
    nome: "",
    especialidade: "",
    fotoUrl: "",
  });
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
    tipo: "Mensal" as Plano,
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
      try {
        const [responseAgenda, responseBarbeiros, responseServicos, responseAssinaturas] =
          await Promise.all([
            fetch("/api/agendamentos", { cache: "no-store" }),
            fetch("/api/barbeiros", { cache: "no-store" }),
            fetch("/api/servicos", { cache: "no-store" }),
            fetch("/api/assinaturas", { cache: "no-store" }),
          ]);

        const resultado = await lerJsonSeguro<{ agendamentos: Agendamento[] }>(
          responseAgenda,
          { agendamentos: [] }
        );
        const resultadoBarbeiros = await lerJsonSeguro<{ barbeiros: Barbeiro[] }>(
          responseBarbeiros,
          { barbeiros: [] }
        );
        const resultadoServicos = await lerJsonSeguro<Servico[]>(responseServicos, []);
        const resultadoAssinaturas = await lerJsonSeguro<{
          assinaturas?: AssinaturaClienteResumo[];
        }>(responseAssinaturas, { assinaturas: [] });

        setAgendamentos(resultado.agendamentos ?? []);
        setListaBarbeiros(resultadoBarbeiros.barbeiros ?? []);
        setServicos(Array.isArray(resultadoServicos) ? resultadoServicos : []);
        setClientes(carregarClientesDoStorage());
        setAssinaturasClientes(resultadoAssinaturas.assinaturas ?? []);
      } catch {
        setMensagem("Falha ao carregar dados do painel.");
      }
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

    async function carregarConfigAssinatura() {
      try {
        const response = await fetch("/api/assinaturas-config", { cache: "no-store" });
        const parsed = (await response.json()) as AssinaturaConfig;

        if (!response.ok || !parsed?.planos || !parsed?.formasPagamento) {
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

    void carregarConfigAssinatura();

    return;
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
    [servicos]
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
    const mapaAssinaturas = new Map(
      assinaturasClientes.map((item) => [item.clienteTelefone, item])
    );

    return clientesFiltrados.map((cliente) => {
      const total = agendamentos.filter(
        (item) =>
          item.clienteTelefone === cliente.telefone ||
          item.clienteNome.toLowerCase() === cliente.nome.toLowerCase()
      );

      const hojeCliente = total.filter(
        (item) => item.data === dataSelecionada && item.status === "Confirmado"
      );
      const assinatura = mapaAssinaturas.get(cliente.telefone);

      return {
        ...cliente,
        totalAgendamentos: total.length,
        agendamentosHoje: hojeCliente.length,
        assinaturaPlano: assinatura?.plano ?? null,
        assinaturaAtiva: assinatura?.status === "Ativa",
      };
    });
  }, [agendamentos, assinaturasClientes, clientesFiltrados, dataSelecionada]);

  const clientespaginados = useMemo(() => {
    const itensPorPagina = 10;
    const inicio = (paginaClientes - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return resumoClientes.slice(inicio, fim);
  }, [resumoClientes, paginaClientes]);

  const totalPaginasClientes = Math.ceil(resumoClientes.length / 10);

  useEffect(() => {
    if (totalPaginasClientes === 0) {
      if (paginaClientes !== 1) {
        setPaginaClientes(1);
      }
      return;
    }

    if (paginaClientes > totalPaginasClientes) {
      setPaginaClientes(totalPaginasClientes);
    }
  }, [paginaClientes, totalPaginasClientes]);

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

  async function alternarPlanoMensalCliente(cliente: {
    nome: string;
    telefone: string;
    assinaturaPlano: Plano | null;
    assinaturaAtiva: boolean;
  }) {
    setMensagem("");
    setProcessandoAssinaturaClienteTelefone(cliente.telefone);

    const acao = cliente.assinaturaAtiva ? "cancelar" : "ativar";
    const response = await fetch("/api/assinaturas", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clienteTelefone: cliente.telefone,
        clienteNome: cliente.nome,
        plano: cliente.assinaturaPlano ?? "Mensal",
        acao,
      }),
    });

    const resultado = (await response.json()) as {
      assinatura?: AssinaturaClienteResumo;
      error?: string;
    };

    if (!response.ok || !resultado.assinatura) {
      setMensagem(resultado.error ?? "Nao foi possivel atualizar o plano do cliente.");
      setProcessandoAssinaturaClienteTelefone("");
      return;
    }

    setAssinaturasClientes((anterior) => {
      const semCliente = anterior.filter(
        (item) => item.clienteTelefone !== resultado.assinatura?.clienteTelefone
      );
      return [resultado.assinatura as AssinaturaClienteResumo, ...semCliente];
    });

    setMensagem(
      resultado.assinatura.status === "Ativa"
        ? `Plano de ${cliente.nome} ativado com sucesso.`
        : `Plano de ${cliente.nome} desativado com sucesso.`
    );
    setProcessandoAssinaturaClienteTelefone("");
  }

  async function criarPerfilBarbeiro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    const payload = {
      nome: novoBarbeiro.nome.trim(),
      especialidade: novoBarbeiro.especialidade.trim(),
      fotoUrl: novoBarbeiro.fotoUrl.trim(),
    };

    if (!payload.nome || !payload.especialidade) {
      setMensagem("Informe nome e especialidade para criar o perfil.");
      return;
    }

    setCriandoPerfilBarbeiro(true);

    const response = await fetch("/api/barbeiros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagem(erro.error ?? "Nao foi possivel criar o perfil do barbeiro.");
      setCriandoPerfilBarbeiro(false);
      return;
    }

    const resultado = (await response.json()) as { barbeiro: Barbeiro };
    setListaBarbeiros((anterior) =>
      [...anterior, resultado.barbeiro].sort((a, b) => a.nome.localeCompare(b.nome))
    );
    setNovoBarbeiro({ nome: "", especialidade: "", fotoUrl: "" });
    setMensagem(`Perfil de ${resultado.barbeiro.nome} criado com sucesso.`);
    setCriandoPerfilBarbeiro(false);
  }

  async function confirmarExclusaoPerfilBarbeiro() {
    if (!barbeiroParaExcluir) {
      return;
    }

    const barbeiro = barbeiroParaExcluir;

    setMensagem("");
    setExcluindoPerfilId(barbeiro.id);

    const response = await fetch(`/api/barbeiros?id=${barbeiro.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagem(erro.error ?? "Nao foi possivel excluir o perfil do barbeiro.");
      setExcluindoPerfilId("");
      return;
    }

    setListaBarbeiros((anterior) => anterior.filter((item) => item.id !== barbeiro.id));
    setMensagem(`Perfil de ${barbeiro.nome} excluido com sucesso.`);
    setExcluindoPerfilId("");
    setBarbeiroParaExcluir(null);
  }

  async function persistirConfiguracaoAssinaturas(
    proximaConfig: AssinaturaConfig,
    mensagemSucesso: string
  ) {
    const response = await fetch("/api/assinaturas-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(proximaConfig),
    });

    const resultado = (await response.json()) as AssinaturaConfig & { error?: string };
    if (!response.ok) {
      throw new Error(resultado.error ?? "Nao foi possivel salvar as assinaturas.");
    }

    setConfigAssinatura(resultado);
    setFormasPagamentoTexto(resultado.formasPagamento.join("\n"));
    setMensagem(mensagemSucesso);
  }

  function abrirFormularioPlanoCriar() {
    setModoFormularioPlano("criar");
    setPlanoEmEdicaoIndex(null);
    setFormPlano({
      tipo: "Mensal",
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
      tipo: plano.tipo,
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
      tipo: "Mensal",
      nome: "",
      preco: "",
      ciclo: "/mes",
      destaque: false,
      beneficiosTexto: "",
    });
  }

  async function salvarFormasPagamento() {
    setSalvandoAssinaturas(true);
    setMensagem("");

    const formasPagamento = formasPagamentoTexto
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const proximaConfig = {
      ...configAssinatura,
      formasPagamento,
    };

    try {
      await persistirConfiguracaoAssinaturas(
        proximaConfig,
        "Formas de pagamento atualizadas com sucesso."
      );
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : "Erro ao salvar assinaturas.";
      setMensagem(mensagemErro);
    } finally {
      setSalvandoAssinaturas(false);
    }
  }

  async function handleSubmitPlano(event: React.FormEvent) {
    event.preventDefault();
    setMensagem("");

    const tipo = formPlano.tipo;
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
      tipo,
      nome,
      preco,
      ciclo,
      destaque: formPlano.destaque,
      beneficios,
    };

    setSalvandoAssinaturas(true);

    try {
      let proximaConfig: AssinaturaConfig;
      if (modoFormularioPlano === "editar" && planoEmEdicaoIndex !== null) {
        proximaConfig = {
          ...configAssinatura,
          planos: configAssinatura.planos.map((plano, indiceAtual) =>
            indiceAtual === planoEmEdicaoIndex ? planoSalvo : plano
          ),
        };
        await persistirConfiguracaoAssinaturas(proximaConfig, "Plano atualizado com sucesso.");
      } else {
        proximaConfig = {
          ...configAssinatura,
          planos: [...configAssinatura.planos, planoSalvo],
        };
        await persistirConfiguracaoAssinaturas(proximaConfig, "Plano criado com sucesso.");
      }

      fecharFormularioPlano();
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : "Erro ao salvar assinaturas.";
      setMensagem(mensagemErro);
    } finally {
      setSalvandoAssinaturas(false);
    }
  }

  async function confirmarRemocaoPlano() {
    if (indicePlanoParaExcluir === null) {
      return;
    }

    const indicePlano = indicePlanoParaExcluir;
    setSalvandoAssinaturas(true);
    setMensagem("");

    const proximaConfig = {
      ...configAssinatura,
      planos: configAssinatura.planos.filter((_, indiceAtual) => indiceAtual !== indicePlano),
    };

    try {
      await persistirConfiguracaoAssinaturas(proximaConfig, "Plano removido com sucesso.");
      setIndicePlanoParaExcluir(null);
    } catch (error) {
      const mensagemErro = error instanceof Error ? error.message : "Erro ao salvar assinaturas.";
      setMensagem(mensagemErro);
    } finally {
      setSalvandoAssinaturas(false);
    }
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
          <div className="inline-flex rounded-xl border border-amber-900/20 bg-amber-50 p-1">
            <button
              type="button"
              onClick={() => setFiltroEquipe("todos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                filtroEquipe === "todos"
                  ? "bg-amber-900 text-white shadow-sm"
                  : "text-amber-900 hover:bg-white"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEquipe("ativos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                filtroEquipe === "ativos"
                  ? "bg-amber-900 text-white shadow-sm"
                  : "text-amber-900 hover:bg-white"
              }`}
            >
              Ativos
            </button>
            <button
              type="button"
              onClick={() => setFiltroEquipe("inativos")}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                filtroEquipe === "inativos"
                  ? "bg-amber-900 text-white shadow-sm"
                  : "text-amber-900 hover:bg-white"
              }`}
            >
              Inativos
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <form
            onSubmit={criarPerfilBarbeiro}
            className="grid gap-2 rounded-2xl border border-dashed border-amber-900/30 bg-amber-50/60 p-4 md:grid-cols-[1fr_1fr_1.2fr_auto]"
          >
            <input
              className="rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm text-amber-950"
              value={novoBarbeiro.nome}
              onChange={(event) =>
                setNovoBarbeiro((anterior) => ({ ...anterior, nome: event.target.value }))
              }
              placeholder="Nome do barbeiro"
            />
            <input
              className="rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm text-amber-950"
              value={novoBarbeiro.especialidade}
              onChange={(event) =>
                setNovoBarbeiro((anterior) => ({
                  ...anterior,
                  especialidade: event.target.value,
                }))
              }
              placeholder="Especialidade"
            />
            <input
              className="rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-sm text-amber-950"
              value={novoBarbeiro.fotoUrl}
              onChange={(event) =>
                setNovoBarbeiro((anterior) => ({ ...anterior, fotoUrl: event.target.value }))
              }
              placeholder="URL da foto (opcional)"
            />
            <button
              type="submit"
              disabled={criandoPerfilBarbeiro}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {criandoPerfilBarbeiro ? "Criando..." : "Criar perfil"}
            </button>
          </form>

          {equipeFiltrada.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-2xl border border-amber-900/15 bg-white p-4 lg:grid-cols-[96px_1fr_auto]"
            >
              <div className="relative h-24 w-24 overflow-hidden rounded-xl border border-amber-900/20 bg-amber-50">
                {item.fotoUrl ? (
                  <Image
                    src={item.fotoUrl}
                    alt={`Foto de ${item.nome}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-amber-900/70">
                    Sem foto
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                  Nome
                  <input
                    className="rounded-lg border border-amber-900/20 px-3 py-2 text-sm font-normal uppercase tracking-normal text-amber-950"
                    value={item.nome}
                    onChange={(event) =>
                      atualizarCampoBarbeiro(item.id, "nome", event.target.value)
                    }
                    placeholder="Nome"
                  />
                </label>
                <label className="grid gap-1 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                  Especialidade
                  <input
                    className="rounded-lg border border-amber-900/20 px-3 py-2 text-sm font-normal normal-case tracking-normal text-amber-950"
                    value={item.especialidade}
                    onChange={(event) =>
                      atualizarCampoBarbeiro(item.id, "especialidade", event.target.value)
                    }
                    placeholder="Especialidade"
                  />
                </label>
                <label className="sm:col-span-2 grid gap-1 text-xs font-semibold uppercase tracking-wide text-amber-900/80">
                  URL da imagem
                  <input
                    className="rounded-lg border border-amber-900/20 px-3 py-2 text-sm font-normal normal-case tracking-normal text-amber-950"
                    value={item.fotoUrl ?? ""}
                    onChange={(event) =>
                      atualizarCampoBarbeiro(item.id, "fotoUrl", event.target.value)
                    }
                    placeholder="https://..."
                  />
                </label>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.ativo
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {item.ativo ? "Perfil ativo" : "Perfil inativo"}
                  </span>
                  <p className="text-xs text-amber-900/80">
                    {item.ativo
                      ? "Disponivel para novos agendamentos"
                      : "Indisponivel para novos agendamentos"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 lg:flex-col lg:items-stretch">
                <button
                  type="button"
                  onClick={() => salvarPerfilBarbeiro(item)}
                  disabled={salvandoPerfilId === item.id}
                  className="whitespace-nowrap rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
                  title="Salvar alterações"
                >
                  {salvandoPerfilId === item.id ? "Salvando..." : "Salvar perfil"}
                </button>
                <button
                  type="button"
                  onClick={() => alternarDisponibilidade(item)}
                  disabled={salvandoDisponibilidadeId === item.id}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:opacity-60 ${
                    item.ativo ? "bg-red-600" : "bg-emerald-700"
                  }`}
                  title={item.ativo ? "Desativar" : "Ativar"}
                >
                  {salvandoDisponibilidadeId === item.id
                    ? "Atualizando..."
                    : item.ativo
                      ? "Desativar perfil"
                      : "Ativar perfil"}
                </button>
                <button
                  type="button"
                  onClick={() => setBarbeiroParaExcluir(item)}
                  disabled={excluindoPerfilId === item.id}
                  className="whitespace-nowrap rounded-lg border border-red-700/20 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800 transition hover:bg-red-100 disabled:opacity-60"
                >
                  {excluindoPerfilId === item.id ? "Excluindo..." : "Excluir perfil"}
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
                Tipo: <strong>{plano.tipo}</strong>
              </p>
              <p className="mt-1 text-sm text-amber-900/90">
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
                  onClick={() => setIndicePlanoParaExcluir(indicePlano)}
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

      <ConfirmDialog
        open={Boolean(barbeiroParaExcluir)}
        title="Confirmar exclusao"
        description={
          barbeiroParaExcluir
            ? `Voce esta prestes a excluir o perfil de ${barbeiroParaExcluir.nome}. Esse perfil deixara de aparecer no login de barbeiro e no agendamento.`
            : ""
        }
        note="Se existir agendamento confirmado futuro, a exclusao sera bloqueada para proteger a agenda."
        confirmLabel="Sim, excluir"
        busyLabel="Excluindo..."
        busy={Boolean(barbeiroParaExcluir && excluindoPerfilId === barbeiroParaExcluir.id)}
        onCancel={() => setBarbeiroParaExcluir(null)}
        onConfirm={confirmarExclusaoPerfilBarbeiro}
      />

      <ConfirmDialog
        open={indicePlanoParaExcluir !== null}
        title="Remover plano"
        description={
          indicePlanoParaExcluir !== null
            ? `Tem certeza que deseja remover o plano ${configAssinatura.planos[indicePlanoParaExcluir]?.nome ?? "selecionado"}?`
            : ""
        }
        note="Essa acao atualiza a configuracao de assinaturas imediatamente."
        confirmLabel="Sim, remover"
        busyLabel="Removendo..."
        busy={salvandoAssinaturas}
        onCancel={() => setIndicePlanoParaExcluir(null)}
        onConfirm={confirmarRemocaoPlano}
      />

      {modoFormularioPlano && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6">
            <h2 className="mb-4 text-2xl font-bold text-amber-950">
              {modoFormularioPlano === "editar" ? "Editar plano" : "Novo plano"}
            </h2>

            <form onSubmit={handleSubmitPlano} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-950">Tipo</label>
                <select
                  value={formPlano.tipo}
                  onChange={(event) =>
                    setFormPlano((anterior) => ({
                      ...anterior,
                      tipo: event.target.value as Plano,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                >
                  <option value="Mensal">Mensal</option>
                  <option value="Premium">Premium</option>
                </select>
              </div>

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
            onChange={(event) => {
              setBuscaCliente(event.target.value);
              setPaginaClientes(1);
            }}
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
                  {cliente.assinaturaPlano && (
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        cliente.assinaturaAtiva
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {cliente.assinaturaAtiva
                        ? `✓ ${cliente.assinaturaPlano} Ativo`
                        : `✗ ${cliente.assinaturaPlano} Inativo`}
                    </span>
                  )}
                </div>
                <p>Email: {cliente.email}</p>
                <p>Telefone: {cliente.telefone}</p>
                <p>
                  Agendamentos totais: <strong>{cliente.totalAgendamentos}</strong> | Hoje:{" "}
                  <strong>{cliente.agendamentosHoje}</strong>
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => alternarPlanoMensalCliente(cliente)}
                    disabled={
                      processandoAssinaturaClienteTelefone === cliente.telefone
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60 ${
                      cliente.assinaturaAtiva
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-emerald-700 hover:bg-emerald-800"
                    }`}
                  >
                    {processandoAssinaturaClienteTelefone === cliente.telefone
                      ? "Atualizando..."
                      : cliente.assinaturaAtiva
                        ? "Desativar plano"
                        : cliente.assinaturaPlano
                          ? `Ativar plano ${cliente.assinaturaPlano}`
                          : "Ativar plano Mensal"}
                  </button>
                </div>
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
