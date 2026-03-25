"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Agendamento, Plano } from "@/types";

const SESSAO_KEY = "barber_cliente_sessao";
const AUTH_EVENT = "barber-auth-change";

type StatusAcesso = "carregando" | "negado" | "permitido";
type FiltroHistorico = "todos" | "confirmado" | "cancelado";

type ClienteSessao = {
  nome: string;
  email: string;
  telefone: string;
  fotoUrl?: string;
};

type AssinaturaClienteApi = {
  clienteTelefone: string;
  plano: Plano;
  status: "Ativa" | "Cancelada";
  proximaCobrancaEm?: string | null;
};

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

function lerSessaoCliente(): ClienteSessao | null {
  const valorBruto = window.localStorage.getItem(SESSAO_KEY);
  if (!valorBruto) {
    return null;
  }

  try {
    return JSON.parse(valorBruto) as ClienteSessao;
  } catch {
    return null;
  }
}

function normalizarTelefone(valor: string) {
  return (valor ?? "").replace(/\D/g, "");
}

async function lerJsonSeguro<T>(response: Response, fallback: T): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export default function AreaClientePage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [agoraMs, setAgoraMs] = useState<number | null>(null);
  const [paginaHistorico, setPaginaHistorico] = useState(1);
  const [filtroHistorico, setFiltroHistorico] = useState<FiltroHistorico>("todos");
  const [emailSessaoOriginal, setEmailSessaoOriginal] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState("");
  const [assinatura, setAssinatura] = useState<AssinaturaClienteApi | null>(null);

  const statusPlano = useMemo(() => {
    if (!assinatura) {
      return "Sem plano";
    }

    return assinatura.status === "Ativa" ? "Ativo" : "Inativo";
  }, [assinatura]);

  const classeStatusPlano = useMemo(() => {
    if (!assinatura) {
      return "bg-zinc-100 text-zinc-700";
    }

    return assinatura.status === "Ativa"
      ? "bg-emerald-100 text-emerald-800"
      : "bg-red-100 text-red-800";
  }, [assinatura]);

  const assinaturaAtivaEmDia = useMemo(() => {
    if (!assinatura || assinatura.status !== "Ativa") {
      return false;
    }

    if (agoraMs === null) {
      return false;
    }

    if (!assinatura.proximaCobrancaEm) {
      return false;
    }

    const proxima = new Date(assinatura.proximaCobrancaEm);
    if (Number.isNaN(proxima.getTime())) {
      return false;
    }

    return proxima.getTime() >= agoraMs;
  }, [agoraMs, assinatura]);

  useEffect(() => {
    const atualizarAgora = () => setAgoraMs(Date.now());
    atualizarAgora();

    const intervalo = window.setInterval(atualizarAgora, 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  const planoReconhecido = useMemo<Plano>(() => {
    if (
      assinaturaAtivaEmDia &&
      assinatura &&
      (assinatura.plano === "Mensal" || assinatura.plano === "Premium")
    ) {
      return assinatura.plano;
    }

    return "Avulso";
  }, [assinatura, assinaturaAtivaEmDia]);

  const historicoCliente = useMemo(() => {
    const telefoneNormalizado = telefone.replace(/\D/g, "");
    const nomeNormalizado = nome.trim().toLowerCase();

    return agendamentos
      .filter((item) => {
        const telefoneItem = item.clienteTelefone.replace(/\D/g, "");
        const nomeItem = item.clienteNome.trim().toLowerCase();

        if (telefoneNormalizado && telefoneItem === telefoneNormalizado) {
          return true;
        }

        if (!telefoneNormalizado && nomeNormalizado && nomeItem === nomeNormalizado) {
          return true;
        }

        return false;
      })
      .sort((a, b) => {
        const chaveA = `${a.data}T${a.horario}`;
        const chaveB = `${b.data}T${b.horario}`;
        return chaveB.localeCompare(chaveA);
      });
  }, [agendamentos, nome, telefone]);

  const historicoFiltrado = useMemo(() => {
    if (filtroHistorico === "todos") {
      return historicoCliente;
    }

    const statusAlvo = filtroHistorico === "confirmado" ? "Confirmado" : "Cancelado";
    return historicoCliente.filter((item) => item.status === statusAlvo);
  }, [filtroHistorico, historicoCliente]);

  const totalPaginasHistorico = Math.ceil(historicoFiltrado.length / 6);
  const paginaHistoricoExibida = useMemo(() => {
    if (totalPaginasHistorico === 0) {
      return 1;
    }

    return Math.min(paginaHistorico, totalPaginasHistorico);
  }, [paginaHistorico, totalPaginasHistorico]);

  const historicoPaginado = useMemo(() => {
    const itensPorPagina = 6;
    const inicio = (paginaHistoricoExibida - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    return historicoFiltrado.slice(inicio, fim);
  }, [historicoFiltrado, paginaHistoricoExibida]);

  async function carregarAssinatura(telefoneCliente: string) {
    const telefoneNormalizado = telefoneCliente.trim();

    if (!telefoneNormalizado) {
      setAssinatura(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/assinaturas?clienteTelefone=${encodeURIComponent(telefoneNormalizado)}`,
        { cache: "no-store" }
      );
      const resultado = (await response.json()) as { assinatura: AssinaturaClienteApi | null };

      if (!response.ok) {
        setAssinatura(null);
        return;
      }

      setAssinatura(resultado.assinatura ?? null);
    } catch {
      setAssinatura(null);
    }
  }

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

      const sessao = lerSessaoCliente();
      if (sessao && ativo) {
        setNome(sessao.nome);
        setEmail(sessao.email);
        setTelefone(sessao.telefone);
        setFotoUrl(sessao.fotoUrl ?? "");
        setEmailSessaoOriginal(sessao.email);
      }

      const response = await fetch("/api/agendamentos", { cache: "no-store" });
      const resultado = (await response.json()) as { agendamentos: Agendamento[] };

      if (!ativo) {
        return;
      }

      setAgendamentos(resultado.agendamentos ?? []);
      setStatusAcesso("permitido");
      await carregarAssinatura(sessao?.telefone ?? "");
      setCarregando(false);
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  async function cancelar(id: string) {
    setCarregando(true);
    await fetch(`/api/agendamentos/${id}/cancelar`, {
      method: "PATCH",
      headers: {
        "x-cliente-telefone": telefone,
      },
    });
    await carregar();
  }

  async function handleFotoPerfil(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) {
      return;
    }

    if (!arquivo.type.startsWith("image/")) {
      setMensagemPerfil("Selecione um arquivo de imagem valido.");
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      setMensagemPerfil("A foto deve ter no maximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result;
      if (typeof resultado === "string") {
        setFotoUrl(resultado);
      }
    };
    reader.readAsDataURL(arquivo);
    setMensagemPerfil("");
  }

  function removerFotoPerfil() {
    setFotoUrl("");
    setMensagemPerfil("Foto removida. Salve o perfil para confirmar.");
  }

  async function salvarPerfil() {
    setMensagemPerfil("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const telefoneLimpo = normalizarTelefone(telefone.trim());

    if (!nomeLimpo || !emailLimpo || !telefoneLimpo) {
      setMensagemPerfil("Preencha nome, email e telefone para salvar.");
      return;
    }

    setSalvandoPerfil(true);

    const response = await fetch("/api/clientes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailOriginal: emailSessaoOriginal,
        nome: nomeLimpo,
        email: emailLimpo,
        telefone: telefoneLimpo,
        fotoUrl: fotoUrl.trim(),
      }),
    });

    const resultado = await lerJsonSeguro<{
      cliente?: ClienteSessao;
      error?: string;
    }>(response, {});

    if (!response.ok || !resultado.cliente) {
      setMensagemPerfil(resultado.error ?? "Nao foi possivel atualizar o perfil.");
      setSalvandoPerfil(false);
      return;
    }

    const novaSessao: ClienteSessao = {
      nome: resultado.cliente.nome,
      email: resultado.cliente.email,
      telefone: resultado.cliente.telefone,
      fotoUrl: resultado.cliente.fotoUrl,
    };

    window.localStorage.setItem(SESSAO_KEY, JSON.stringify(novaSessao));
    window.dispatchEvent(new Event(AUTH_EVENT));

    void carregarAssinatura(novaSessao.telefone);

    setEmailSessaoOriginal(novaSessao.email);
    setNome(novaSessao.nome);
    setEmail(novaSessao.email);
    setTelefone(novaSessao.telefone);
    setFotoUrl(novaSessao.fotoUrl ?? "");
    setMensagemPerfil("Perfil atualizado com sucesso.");
    setSalvandoPerfil(false);
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
        Edite seu perfil e acompanhe seus agendamentos confirmados.
      </p>

      <div className="mt-6 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-3xl text-amber-900">Meu perfil</h2>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
              Plano reconhecido: {planoReconhecido}
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${classeStatusPlano}`}>
              {assinatura
                ? `Plano: ${assinatura.plano} | ${statusPlano}`
                : "Plano: Sem plano"}
            </span>
          </div>
        </div>
        {assinatura?.status === "Ativa" && (
          <p className="mt-3 text-xs text-amber-900/80">
            {assinaturaAtivaEmDia
              ? "Assinatura ativa e em dia para uso dos beneficios do plano mensal."
              : "Assinatura ativa, porem com cobranca pendente. Agendamentos serao tratados como Avulso ate regularizacao."}
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-amber-900/20 bg-white">
              <Image
                src={fotoUrl || "/images/clientes/default.svg"}
                alt="Foto de perfil do cliente"
                fill
                unoptimized
                className="h-full w-full object-cover"
              />
            </div>
            <label className="cursor-pointer rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-xs font-semibold text-amber-900">
              Alterar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFotoPerfil}
              />
            </label>
            <button
              type="button"
              onClick={removerFotoPerfil}
              className="text-xs font-semibold text-red-700"
            >
              Remover foto
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-semibold text-amber-900">Nome</span>
              <input
                className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-amber-900">Email</span>
              <input
                className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-semibold text-amber-900">Telefone</span>
              <input
                className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
                value={telefone}
                onChange={(event) => setTelefone(event.target.value)}
              />
            </label>

            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={salvarPerfil}
                disabled={salvandoPerfil}
                className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white disabled:opacity-60"
              >
                {salvandoPerfil ? "Salvando..." : "Salvar perfil"}
              </button>
              {mensagemPerfil && (
                <p className="mt-2 text-sm text-amber-900">{mensagemPerfil}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {carregando ? (
        <p className="mt-6 text-sm">Carregando...</p>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-3xl text-amber-900">Historico de agendamentos</h2>
            <div className="inline-flex rounded-xl border border-amber-900/20 bg-amber-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setFiltroHistorico("todos");
                  setPaginaHistorico(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filtroHistorico === "todos"
                    ? "bg-amber-900 text-white shadow-sm"
                    : "text-amber-900 hover:bg-white"
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroHistorico("confirmado");
                  setPaginaHistorico(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filtroHistorico === "confirmado"
                    ? "bg-amber-900 text-white shadow-sm"
                    : "text-amber-900 hover:bg-white"
                }`}
              >
                Confirmados
              </button>
              <button
                type="button"
                onClick={() => {
                  setFiltroHistorico("cancelado");
                  setPaginaHistorico(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  filtroHistorico === "cancelado"
                    ? "bg-amber-900 text-white shadow-sm"
                    : "text-amber-900 hover:bg-white"
                }`}
              >
                Cancelados
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {historicoFiltrado.length === 0 && (
              <p className="text-sm text-amber-900/80">Nenhum agendamento encontrado.</p>
            )}

            {historicoPaginado.map((item) => (
              <article
                key={item.id}
                className="flex flex-col gap-3 rounded-xl border border-amber-900/20 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
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

            {totalPaginasHistorico > 1 && historicoFiltrado.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-amber-900/15 pt-4">
                <p className="text-sm text-amber-900/80">
                  Pagina {paginaHistoricoExibida} de {totalPaginasHistorico} ({historicoFiltrado.length} agendamentos)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaginaHistorico((p) => Math.max(1, p - 1))}
                    disabled={paginaHistoricoExibida === 1}
                    className="rounded-lg border border-amber-900/30 px-3 py-1 text-sm font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
                  >
                    ← Anterior
                  </button>
                  <button
                    onClick={() =>
                      setPaginaHistorico((p) => Math.min(totalPaginasHistorico, p + 1))
                    }
                    disabled={paginaHistoricoExibida === totalPaginasHistorico}
                    className="rounded-lg border border-amber-900/30 px-3 py-1 text-sm font-medium text-amber-950 hover:bg-amber-50 disabled:opacity-50"
                  >
                    Proxima →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
