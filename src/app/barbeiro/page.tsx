"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Agendamento, Barbeiro } from "@/types";
import { horariosPadrao } from "@/lib/mock-data";
import { ConfirmDialog } from "@/components/confirm-dialog";

const BARBEIRO_SESSAO_KEY = "barber_barbeiro_sessao";
const AUTH_EVENT = "barber-auth-change";

type BarbeiroSessao = {
  id: string;
  nome: string;
};

type StatusAcesso = "carregando" | "negado" | "permitido";

export default function BarbeiroPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [barbeiroSessao, setBarbeiroSessao] = useState<BarbeiroSessao | null>(null);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [mensagemAcesso, setMensagemAcesso] = useState("");
  const [mensagemOperacao, setMensagemOperacao] = useState("");
  const [agendamentoParaCancelar, setAgendamentoParaCancelar] = useState<Agendamento | null>(null);
  const [agendamentoEmEdicao, setAgendamentoEmEdicao] = useState<Agendamento | null>(null);
  const [operandoAgendamentoId, setOperandoAgendamentoId] = useState("");
  const [reagendamentoForm, setReagendamentoForm] = useState({
    data: "",
    horario: "",
    barbeiroId: "",
  });

  function horarioJaPassou(data: string, horario: string) {
    const dataHora = new Date(`${data}T${horario}:00`);
    return Number.isNaN(dataHora.getTime()) || dataHora <= new Date();
  }

  async function carregarAgendamentos() {
    const response = await fetch("/api/agendamentos", { cache: "no-store" });
    const resultado = (await response.json()) as { agendamentos: Agendamento[] };
    setAgendamentos(resultado.agendamentos ?? []);
  }

  useEffect(() => {
    function sincronizarSessaoBarbeiro() {
      const valorBruto = window.localStorage.getItem(BARBEIRO_SESSAO_KEY);
      if (!valorBruto) {
        setBarbeiroSessao(null);
        setStatusAcesso("negado");
        return;
      }

      try {
        const sessao = JSON.parse(valorBruto) as BarbeiroSessao;
        if (!sessao?.id) {
          setBarbeiroSessao(null);
          setStatusAcesso("negado");
          return;
        }

        setBarbeiroSessao(sessao);
        setStatusAcesso("permitido");
      } catch {
        setBarbeiroSessao(null);
        setStatusAcesso("negado");
      }
    }

    sincronizarSessaoBarbeiro();
    window.addEventListener(AUTH_EVENT, sincronizarSessaoBarbeiro);
    window.addEventListener("storage", sincronizarSessaoBarbeiro);

    return () => {
      window.removeEventListener(AUTH_EVENT, sincronizarSessaoBarbeiro);
      window.removeEventListener("storage", sincronizarSessaoBarbeiro);
    };
  }, []);

  useEffect(() => {
    if (statusAcesso !== "permitido") {
      return;
    }

    async function carregarBarbeiros() {
      const response = await fetch("/api/barbeiros", { cache: "no-store" });
      const resultado = (await response.json()) as { barbeiros: Barbeiro[] };
      const lista = resultado.barbeiros ?? [];

      setListaBarbeiros(lista);

      const valorBruto = window.localStorage.getItem(BARBEIRO_SESSAO_KEY);
      if (!valorBruto) {
        return;
      }

      try {
        const sessaoAtual = JSON.parse(valorBruto) as BarbeiroSessao;
        const perfilAtivo = lista.find((item) => item.id === sessaoAtual.id && item.ativo);

        if (!perfilAtivo) {
          window.localStorage.removeItem(BARBEIRO_SESSAO_KEY);
          window.dispatchEvent(new Event(AUTH_EVENT));
          setBarbeiroSessao(null);
          setStatusAcesso("negado");
          setMensagemAcesso("Seu perfil foi desativado ou removido pelo administrador.");
          return;
        }

        if (perfilAtivo.nome !== sessaoAtual.nome) {
          const sessaoAtualizada: BarbeiroSessao = {
            id: perfilAtivo.id,
            nome: perfilAtivo.nome,
          };

          window.localStorage.setItem(BARBEIRO_SESSAO_KEY, JSON.stringify(sessaoAtualizada));
          window.dispatchEvent(new Event(AUTH_EVENT));
          setBarbeiroSessao(sessaoAtualizada);
        }
      } catch {
        window.localStorage.removeItem(BARBEIRO_SESSAO_KEY);
        window.dispatchEvent(new Event(AUTH_EVENT));
        setBarbeiroSessao(null);
        setStatusAcesso("negado");
      }
    }

    void carregarBarbeiros();
  }, [statusAcesso]);

  useEffect(() => {
    if (statusAcesso !== "permitido") {
      return;
    }

    const timer = window.setTimeout(() => {
      void carregarAgendamentos();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [statusAcesso]);

  const hoje = new Date().toISOString().slice(0, 10);
  const dataFormatada = new Date(hoje).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const barbeiroSelecionado = useMemo(
    () => listaBarbeiros.find((b) => b.id === barbeiroSessao?.id),
    [barbeiroSessao?.id, listaBarbeiros]
  );

  const agendaPessoal = useMemo(() => {
    if (!barbeiroSessao?.id) {
      return horariosPadrao.map((horario) => ({
        horario,
        agendamento: undefined,
      }));
    }

    const mapa = new Map(
      agendamentos
        .filter(
          (item) =>
            item.barbeiroId === barbeiroSessao.id &&
            item.data === hoje &&
            item.status === "Confirmado"
        )
        .map((item) => [item.horario, item])
    );

    return horariosPadrao.map((horario) => ({
      horario,
      agendamento: mapa.get(horario),
    }));
  }, [agendamentos, barbeiroSessao, hoje]);

  const horariosLivres = useMemo(
    () => agendaPessoal.filter((slot) => !slot.agendamento).length,
    [agendaPessoal]
  );

  const barbeirosAtivos = useMemo(
    () => listaBarbeiros.filter((item) => item.ativo),
    [listaBarbeiros]
  );

  const horariosDisponiveisReagendamento = useMemo(() => {
    if (!agendamentoEmEdicao || !reagendamentoForm.data || !reagendamentoForm.barbeiroId) {
      return [] as string[];
    }

    const ocupados = new Set(
      agendamentos
        .filter(
          (item) =>
            item.id !== agendamentoEmEdicao.id &&
            item.status === "Confirmado" &&
            item.data === reagendamentoForm.data &&
            item.barbeiroId === reagendamentoForm.barbeiroId
        )
        .map((item) => item.horario)
    );

    return horariosPadrao.filter((horario) => {
      if (ocupados.has(horario)) {
        return false;
      }

      return !horarioJaPassou(reagendamentoForm.data, horario);
    });
  }, [agendamentos, agendamentoEmEdicao, reagendamentoForm.barbeiroId, reagendamentoForm.data]);

  function abrirModalReagendamento(agendamento: Agendamento) {
    setMensagemOperacao("");
    setAgendamentoEmEdicao(agendamento);
    setReagendamentoForm({
      data: agendamento.data,
      horario: agendamento.horario,
      barbeiroId: agendamento.barbeiroId,
    });
  }

  async function cancelarAgendamentoSelecionado() {
    if (!agendamentoParaCancelar) {
      return;
    }

    const agendamento = agendamentoParaCancelar;
    setOperandoAgendamentoId(agendamento.id);
    setMensagemOperacao("");

    const response = await fetch(`/api/agendamentos/${agendamento.id}/cancelar`, {
      method: "PATCH",
      headers: {
        "x-barbeiro-id": barbeiroSessao?.id ?? "",
      },
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagemOperacao(erro.error ?? "Nao foi possivel cancelar o agendamento.");
      setOperandoAgendamentoId("");
      return;
    }

    await carregarAgendamentos();
    setOperandoAgendamentoId("");
    setAgendamentoParaCancelar(null);
    setMensagemOperacao("Agendamento cancelado com sucesso.");
  }

  async function salvarReagendamento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!agendamentoEmEdicao) {
      return;
    }

    if (!reagendamentoForm.data || !reagendamentoForm.horario || !reagendamentoForm.barbeiroId) {
      setMensagemOperacao("Preencha data, horario e barbeiro para reagendar.");
      return;
    }

    setOperandoAgendamentoId(agendamentoEmEdicao.id);
    setMensagemOperacao("");

    const response = await fetch(`/api/agendamentos/${agendamentoEmEdicao.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-barbeiro-id": barbeiroSessao?.id ?? "",
      },
      body: JSON.stringify(reagendamentoForm),
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagemOperacao(erro.error ?? "Nao foi possivel reagendar o atendimento.");
      setOperandoAgendamentoId("");
      return;
    }

    await carregarAgendamentos();
    setOperandoAgendamentoId("");
    setAgendamentoEmEdicao(null);
    setMensagemOperacao("Agendamento atualizado com sucesso.");
  }

  if (statusAcesso === "carregando") {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <p className="text-amber-900">Verificando acesso do barbeiro...</p>
      </section>
    );
  }

  if (statusAcesso === "negado") {
    return (
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
        <h1 className="text-4xl text-amber-950">Acesso restrito</h1>
        <p className="mt-3 text-amber-950/80">
          Esta area e exclusiva para barbeiros autenticados.
        </p>
        {mensagemAcesso && (
          <p className="mt-3 rounded-xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mensagemAcesso}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <Link
            href="/barbeiro/login"
            className="inline-block rounded-lg bg-amber-900 px-5 py-2.5 font-semibold text-white"
          >
            Fazer login de barbeiro
          </Link>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="inline-block rounded-lg border border-amber-900/20 bg-white px-5 py-2.5 font-semibold text-amber-900"
          >
            Voltar para home
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-amber-950">Painel do Barbeiro</h1>
        <p className="mt-2 text-amber-950/70">Visualize sua agenda e horários disponíveis</p>
        {mensagemOperacao && (
          <p className="mt-3 rounded-xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mensagemOperacao}
          </p>
        )}
      </div>

      {/* Perfil do barbeiro logado */}
      <div className="mb-8">
        <label className="mb-3 block text-sm font-semibold text-amber-900">Seu Perfil</label>

        {barbeiroSelecionado && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border-2 border-amber-900/15 bg-amber-50/50 p-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full border-2 border-amber-900/20">
              <Image
                src={barbeiroSelecionado.fotoUrl || "/images/barbeiros/default.svg"}
                alt={barbeiroSelecionado.nome}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-lg font-semibold text-amber-950">{barbeiroSelecionado.nome}</p>
              <p className="text-sm text-amber-900/70">{barbeiroSelecionado.especialidade || "Barbeiro"}</p>
            </div>
          </div>
        )}

        {!barbeiroSelecionado && (
          <p className="mt-3 text-sm text-amber-900/60">
            Perfil do barbeiro nao encontrado. Entre em contato com o administrador.
          </p>
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
                  <p className="text-amber-900/75">WhatsApp: {agendamento.clienteTelefone}</p>
                  <p className="text-amber-900/75">{agendamento.servicoNome}</p>
                  <div className="mt-2 inline-block rounded bg-amber-200 px-2 py-1 text-xs font-medium text-amber-900">
                    Confirmado
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirModalReagendamento(agendamento)}
                      disabled={operandoAgendamentoId === agendamento.id}
                      className="rounded-md border border-amber-900/20 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-60"
                    >
                      Editar / Reagendar
                    </button>
                    <button
                      type="button"
                      onClick={() => setAgendamentoParaCancelar(agendamento)}
                      disabled={operandoAgendamentoId === agendamento.id}
                      className="rounded-md border border-red-700/20 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                    >
                      Cancelar agendamento
                    </button>
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

      <ConfirmDialog
        open={Boolean(agendamentoParaCancelar)}
        title="Cancelar agendamento"
        description={
          agendamentoParaCancelar
            ? `Deseja cancelar o atendimento de ${agendamentoParaCancelar.clienteNome} as ${agendamentoParaCancelar.horario}?`
            : ""
        }
        note="Esse horario sera liberado novamente para novos agendamentos."
        confirmLabel="Sim, cancelar"
        busyLabel="Cancelando..."
        busy={Boolean(
          agendamentoParaCancelar && operandoAgendamentoId === agendamentoParaCancelar.id
        )}
        onCancel={() => setAgendamentoParaCancelar(null)}
        onConfirm={cancelarAgendamentoSelecionado}
      />

      {agendamentoEmEdicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-900/10 bg-white p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-950">Editar agendamento</h2>
            <p className="mt-2 text-sm text-amber-900/85">
              Reagende ou realoque o cliente <strong>{agendamentoEmEdicao.clienteNome}</strong>.
            </p>

            <form onSubmit={salvarReagendamento} className="mt-5 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-semibold text-amber-900">Nova data</span>
                <input
                  type="date"
                  value={reagendamentoForm.data}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) =>
                    setReagendamentoForm((anterior) => ({
                      ...anterior,
                      data: event.target.value,
                      horario: "",
                    }))
                  }
                  className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-amber-950"
                  required
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-amber-900">Barbeiro</span>
                <select
                  value={reagendamentoForm.barbeiroId}
                  onChange={(event) =>
                    setReagendamentoForm((anterior) => ({
                      ...anterior,
                      barbeiroId: event.target.value,
                      horario: "",
                    }))
                  }
                  className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-amber-950"
                >
                  {barbeirosAtivos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-semibold text-amber-900">Novo horario</span>
                <select
                  value={reagendamentoForm.horario}
                  onChange={(event) =>
                    setReagendamentoForm((anterior) => ({
                      ...anterior,
                      horario: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2 text-amber-950"
                  required
                >
                  <option value="">Selecione um horario</option>
                  {horariosDisponiveisReagendamento.map((horario) => (
                    <option key={horario} value={horario}>
                      {horario}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAgendamentoEmEdicao(null)}
                  disabled={operandoAgendamentoId === agendamentoEmEdicao.id}
                  className="rounded-lg border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50 disabled:opacity-60"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={operandoAgendamentoId === agendamentoEmEdicao.id}
                  className="rounded-lg bg-amber-900 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-950 disabled:opacity-60"
                >
                  {operandoAgendamentoId === agendamentoEmEdicao.id
                    ? "Salvando..."
                    : "Salvar alteracoes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
