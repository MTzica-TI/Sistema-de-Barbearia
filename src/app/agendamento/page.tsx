"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { horariosPadrao } from "@/lib/mock-data";
import { Agendamento, Barbeiro, Plano, Servico } from "@/types";

const planos: Plano[] = ["Avulso", "Mensal", "Premium"];
const SESSAO_KEY = "barber_cliente_sessao";
const AUTH_EVENT = "barber-auth-change";

type ClienteSessao = {
  nome: string;
  email: string;
  telefone: string;
};

type StatusAcesso = "carregando" | "negado" | "permitido";

function lerClienteDaSessao() {
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

function horarioJaPassou(data: string, horario: string) {
  const dataHora = new Date(`${data}T${horario}:00`);
  return dataHora <= new Date();
}

export default function AgendamentoPage() {
  const [clienteNome, setClienteNome] = useState("Seu nome aqui");
  const [clienteTelefone, setClienteTelefone] = useState("Seu Numero");
  const [clienteEmail, setClienteEmail] = useState("");
  const [clienteDetectado, setClienteDetectado] = useState(false);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [listaBarbeiros, setListaBarbeiros] = useState<Barbeiro[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [plano, setPlano] = useState<Plano>("Avulso");
  const [barbeiroId, setBarbeiroId] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);

  const barbeiroSelecionado = useMemo(
    () => listaBarbeiros.find((item) => item.id === barbeiroId),
    [barbeiroId, listaBarbeiros]
  );

  const servicoSelecionado = useMemo(
    () => servicos.find((item) => item.id === servicoId),
    [servicoId, servicos]
  );

  useEffect(() => {
    async function carregarDados() {
      try {
        const [resBarbeiros, resServicos] = await Promise.all([
          fetch("/api/barbeiros?ativos=1", { cache: "no-store" }),
          fetch("/api/servicos", { cache: "no-store" }),
        ]);

        const resultadoBarbeiros = (await resBarbeiros.json()) as { barbeiros: Barbeiro[] };
        const resultadoServicos = (await resServicos.json()) as Servico[];

        const lista = resultadoBarbeiros.barbeiros ?? [];
        const listaServicos = Array.isArray(resultadoServicos) ? resultadoServicos : [];

        setListaBarbeiros(lista);
        setServicos(listaServicos);

        setBarbeiroId((anterior) => {
          if (lista.some((item) => item.id === anterior)) {
            return anterior;
          }
          return lista[0]?.id ?? "";
        });

        setServicoId((anterior) => {
          if (listaServicos.some((item) => item.id === anterior)) {
            return anterior;
          }
          return listaServicos[0]?.id ?? "";
        });
      } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
      }
    }

    function atualizarSessaoCliente() {
      const sessaoAtual = lerClienteDaSessao();
      if (!sessaoAtual) {
        setClienteNome("Seu nome aqui");
        setClienteTelefone("Seu Numero");
        setClienteEmail("");
        setClienteDetectado(false);
        setStatusAcesso("negado");
        return;
      }

      setClienteNome(sessaoAtual.nome);
      setClienteTelefone(sessaoAtual.telefone);
      setClienteEmail(sessaoAtual.email);
      setClienteDetectado(true);
      setStatusAcesso("permitido");
    }

    atualizarSessaoCliente();
    void carregarDados();

    window.addEventListener(AUTH_EVENT, atualizarSessaoCliente);
    window.addEventListener("storage", atualizarSessaoCliente);

    return () => {
      window.removeEventListener(AUTH_EVENT, atualizarSessaoCliente);
      window.removeEventListener("storage", atualizarSessaoCliente);
    };
  }, []);

  useEffect(() => {
    async function carregarHorariosOcupados() {
      if (!data || !barbeiroId) {
        setHorariosOcupados([]);
        return;
      }

      const response = await fetch(
        `/api/agendamentos?data=${data}&barbeiroId=${barbeiroId}`
      );
      const resultado = (await response.json()) as { horariosOcupados: string[] };
      setHorariosOcupados(resultado.horariosOcupados ?? []);
      setHorario("");
    }

    void carregarHorariosOcupados();
  }, [data, barbeiroId]);

  const horariosDisponiveis = horariosPadrao.filter(
    (item) => !horariosOcupados.includes(item) && (!data || !horarioJaPassou(data, item))
  );

  async function confirmarAgendamento(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (!servicoSelecionado || !barbeiroSelecionado || !data || !horario) {
      setMensagem("Preencha todos os campos para confirmar.");
      return;
    }

    if (horarioJaPassou(data, horario)) {
      setMensagem("Esse horario ja passou. Escolha outro horario disponivel.");
      return;
    }

    setEnviando(true);

    const payload: Agendamento = {
      id: crypto.randomUUID(),
      clienteNome,
      clienteTelefone,
      plano,
      servicoId: servicoSelecionado.id,
      servicoNome: servicoSelecionado.nome,
      barbeiroId: barbeiroSelecionado.id,
      barbeiroNome: barbeiroSelecionado.nome,
      data,
      horario,
      status: "Confirmado",
      pagamentoStatus: "Confirmado",
    };

    const response = await fetch("/api/agendamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const erro = (await response.json()) as { error?: string };
      setMensagem(erro.error ?? "Nao foi possivel criar o agendamento.");
      setEnviando(false);
      return;
    }

    setMensagem("Agendamento confirmado e horario bloqueado com sucesso.");
    setEnviando(false);

    const refresh = await fetch(
      `/api/agendamentos?data=${data}&barbeiroId=${barbeiroId}`
    );
    const resultado = (await refresh.json()) as { horariosOcupados: string[] };
    setHorariosOcupados(resultado.horariosOcupados ?? []);
    setHorario("");
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
          Para agendar, voce precisa fazer login como cliente.
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
      <h1 className="text-5xl text-amber-950">Agendamento</h1>
      <p className="mt-2 text-amber-950/80">
        Escolha plano, barbeiro, servico, data e horario disponivel.
      </p>

      <div className="mt-4 rounded-2xl border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
        Cliente identificado pelo login: <strong>{clienteNome}</strong>
        {clienteEmail ? ` (${clienteEmail})` : ""}.
      </div>

      <form
        onSubmit={confirmarAgendamento}
        className="mt-8 grid gap-4 rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">Cliente</span>
          <input
            className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            value={clienteNome}
            onChange={(event) => setClienteNome(event.target.value)}
            readOnly={clienteDetectado}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">WhatsApp</span>
          <input
            className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            value={clienteTelefone}
            onChange={(event) => setClienteTelefone(event.target.value)}
            readOnly={clienteDetectado}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">Plano</span>
          <select
            className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            value={plano}
            onChange={(event) => setPlano(event.target.value as Plano)}
          >
            {planos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-semibold text-amber-900">Barbeiro</span>
          {listaBarbeiros.length === 0 && (
            <p className="text-sm text-red-700">
              Nenhum barbeiro ativo no momento. Aguarde a administracao liberar um profissional.
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {listaBarbeiros.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setBarbeiroId(item.id)}
                className={`rounded-2xl border p-3 text-center transition ${
                  barbeiroId === item.id
                    ? "border-amber-900 bg-amber-100 shadow"
                    : "border-amber-900/20 bg-white hover:border-amber-700/40 hover:bg-amber-50"
                }`}
              >
                <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full ring-2 ring-amber-200">
                  <Image
                    src={item.fotoUrl}
                    alt={`Foto do barbeiro ${item.nome}`}
                    width={120}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-950">{item.nome}</p>
                  <p className="mt-0.5 text-[11px] text-amber-900/80">{item.especialidade}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">Servico</span>
          <select
            className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            value={servicoId}
            onChange={(event) => setServicoId(event.target.value)}
          >
            {servicos.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm font-semibold text-amber-900">Data</span>
          <input
            className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
          />
        </label>

        <label className="space-y-1 sm:col-span-2 lg:col-span-3">
          <span className="text-sm font-semibold text-amber-900">
            Horarios disponiveis
          </span>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8">
            {horariosDisponiveis.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setHorario(item)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  horario === item
                    ? "border-amber-900 bg-amber-700 text-white"
                    : "border-amber-900/20 bg-white text-amber-900 hover:bg-amber-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </label>

        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            disabled={enviando || listaBarbeiros.length === 0}
            className="rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-white disabled:opacity-50"
          >
            {enviando ? "Confirmando..." : "Confirmar agendamento"}
          </button>
          {mensagem && <p className="mt-3 text-sm text-amber-900">{mensagem}</p>}
        </div>
      </form>
    </section>
  );
}
