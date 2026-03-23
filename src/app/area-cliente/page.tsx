"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Agendamento } from "@/types";

const SESSAO_KEY = "barber_cliente_sessao";
const USUARIOS_KEY = "barber_usuarios";
const AUTH_EVENT = "barber-auth-change";

type StatusAcesso = "carregando" | "negado" | "permitido";

type ClienteSessao = {
  nome: string;
  email: string;
  telefone: string;
  fotoUrl?: string;
};

type UsuarioCadastro = ClienteSessao & {
  senha: string;
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

function carregarUsuarios(): UsuarioCadastro[] {
  const valorBruto = window.localStorage.getItem(USUARIOS_KEY);
  if (!valorBruto) {
    return [];
  }

  try {
    return JSON.parse(valorBruto) as UsuarioCadastro[];
  } catch {
    return [];
  }
}

export default function AreaClientePage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [statusAcesso, setStatusAcesso] = useState<StatusAcesso>("carregando");
  const [emailSessaoOriginal, setEmailSessaoOriginal] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [mensagemPerfil, setMensagemPerfil] = useState("");

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
      setCarregando(false);
    }

    void carregarInicial();

    return () => {
      ativo = false;
    };
  }, []);

  async function cancelar(id: string) {
    setCarregando(true);
    await fetch(`/api/agendamentos/${id}/cancelar`, { method: "PATCH" });
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

  function salvarPerfil() {
    setMensagemPerfil("");

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const telefoneLimpo = telefone.trim();

    if (!nomeLimpo || !emailLimpo || !telefoneLimpo) {
      setMensagemPerfil("Preencha nome, email e telefone para salvar.");
      return;
    }

    setSalvandoPerfil(true);

    const usuarios = carregarUsuarios();
    const emailJaExiste = usuarios.some(
      (item) =>
        item.email.toLowerCase() === emailLimpo &&
        item.email.toLowerCase() !== emailSessaoOriginal.toLowerCase()
    );

    if (emailJaExiste) {
      setMensagemPerfil("Ja existe outra conta com esse email.");
      setSalvandoPerfil(false);
      return;
    }

    const usuariosAtualizados = usuarios.map((item) => {
      if (item.email.toLowerCase() !== emailSessaoOriginal.toLowerCase()) {
        return item;
      }

      return {
        ...item,
        nome: nomeLimpo,
        email: emailLimpo,
        telefone: telefoneLimpo,
        fotoUrl: fotoUrl || undefined,
      };
    });

    window.localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosAtualizados));

    const novaSessao: ClienteSessao = {
      nome: nomeLimpo,
      email: emailLimpo,
      telefone: telefoneLimpo,
      fotoUrl: fotoUrl || undefined,
    };

    window.localStorage.setItem(SESSAO_KEY, JSON.stringify(novaSessao));
    window.dispatchEvent(new Event(AUTH_EVENT));

    setEmailSessaoOriginal(emailLimpo);
    setNome(nomeLimpo);
    setEmail(emailLimpo);
    setTelefone(telefoneLimpo);
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
        <h2 className="text-3xl text-amber-900">Meu perfil</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-[140px_1fr]">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-amber-900/20 bg-white">
              {fotoUrl ? (
                <Image
                  src={fotoUrl}
                  alt="Foto de perfil do cliente"
                  fill
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-amber-900/70">
                  Sem foto
                </div>
              )}
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
        <div className="mt-6 space-y-3">
          {agendamentos.map((item) => (
            <article
              key={item.id}
              className="flex flex-col gap-3 rounded-xl border border-amber-900/20 bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between"
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
        </div>
      )}
    </section>
  );
}
