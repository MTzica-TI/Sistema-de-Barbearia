"use client";

import { useState } from "react";
import Link from "next/link";

type AbaAuth = "login" | "cadastro";

type ClienteSessao = {
  nome: string;
  email: string;
  telefone: string;
  fotoUrl?: string;
};

type UsuarioCadastro = ClienteSessao & {
  senha: string;
};

const USUARIOS_KEY = "barber_usuarios";
const SESSAO_KEY = "barber_cliente_sessao";
const AUTH_EVENT = "barber-auth-change";

function normalizarTelefone(valor: string) {
  return (valor ?? "").replace(/\D/g, "");
}

export default function LoginPage() {
  const [abaAtiva, setAbaAtiva] = useState<AbaAuth>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [cadastroNome, setCadastroNome] = useState("");
  const [cadastroEmail, setCadastroEmail] = useState("");
  const [cadastroTelefone, setCadastroTelefone] = useState("");
  const [cadastroSenha, setCadastroSenha] = useState("");
  const [modoRecuperacao, setModoRecuperacao] = useState(false);
  const [recEmail, setRecEmail] = useState("");
  const [recTelefone, setRecTelefone] = useState("");
  const [recNovaSenha, setRecNovaSenha] = useState("");
  const [recConfirmarSenha, setRecConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [clienteLogado, setClienteLogado] = useState<ClienteSessao | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    const valorBruto = window.localStorage.getItem(SESSAO_KEY);
    if (!valorBruto) {
      return null;
    }

    try {
      return JSON.parse(valorBruto) as ClienteSessao;
    } catch {
      return null;
    }
  });

  function carregarUsuarios(): UsuarioCadastro[] {
    if (typeof window === "undefined") {
      return [];
    }

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

  function salvarSessao(cliente: ClienteSessao) {
    window.localStorage.setItem(SESSAO_KEY, JSON.stringify(cliente));
    window.dispatchEvent(new Event(AUTH_EVENT));
    setClienteLogado(cliente);
  }

  function deslogar() {
    window.localStorage.removeItem(SESSAO_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setClienteLogado(null);
    setMensagem("Voce saiu da conta com sucesso.");
  }

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    const usuarios = carregarUsuarios();
    const usuario = usuarios.find(
      (item) =>
        item.email.toLowerCase() === loginEmail.trim().toLowerCase() &&
        item.senha === loginSenha
    );

    if (!usuario) {
      setMensagem("Email ou senha invalidos.");
      return;
    }

    salvarSessao({
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      fotoUrl: usuario.fotoUrl,
    });

    setMensagem("Login realizado. Seus dados foram detectados no agendamento.");
  }

  function handleCadastro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (!cadastroNome || !cadastroEmail || !cadastroTelefone || !cadastroSenha) {
      setMensagem("Preencha todos os campos para cadastrar.");
      return;
    }

    const usuarios = carregarUsuarios();
    const emailExiste = usuarios.some(
      (item) => item.email.toLowerCase() === cadastroEmail.trim().toLowerCase()
    );

    if (emailExiste) {
      setMensagem("Este email ja esta cadastrado.");
      return;
    }

    const telefoneNormalizado = normalizarTelefone(cadastroTelefone.trim());
    const telefoneExiste = usuarios.some(
      (item) => normalizarTelefone(item.telefone) === telefoneNormalizado
    );

    if (telefoneNormalizado && telefoneExiste) {
      setMensagem("Este telefone ja esta cadastrado.");
      return;
    }

    const novoUsuario: UsuarioCadastro = {
      nome: cadastroNome.trim(),
      email: cadastroEmail.trim(),
      telefone: cadastroTelefone.trim(),
      senha: cadastroSenha,
    };

    window.localStorage.setItem(
      USUARIOS_KEY,
      JSON.stringify([...usuarios, novoUsuario])
    );

    salvarSessao({
      nome: novoUsuario.nome,
      email: novoUsuario.email,
      telefone: novoUsuario.telefone,
      fotoUrl: novoUsuario.fotoUrl,
    });

    setMensagem("Cadastro concluido. Seus dados ja foram vinculados ao agendamento.");
    setAbaAtiva("login");
    setLoginEmail(novoUsuario.email);
    setLoginSenha(novoUsuario.senha);
  }

  function limparFormularioRecuperacao() {
    setRecEmail("");
    setRecTelefone("");
    setRecNovaSenha("");
    setRecConfirmarSenha("");
  }

  function handleRecuperarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    const email = recEmail.trim().toLowerCase();
    const telefone = normalizarTelefone(recTelefone.trim());

    if (!email || !telefone || !recNovaSenha || !recConfirmarSenha) {
      setMensagem("Preencha todos os campos para redefinir a senha.");
      return;
    }

    if (recNovaSenha.length < 4) {
      setMensagem("A nova senha deve ter ao menos 4 caracteres.");
      return;
    }

    if (recNovaSenha !== recConfirmarSenha) {
      setMensagem("A confirmacao da senha nao confere.");
      return;
    }

    const usuarios = carregarUsuarios();
    const indiceUsuario = usuarios.findIndex(
      (item) =>
        item.email.trim().toLowerCase() === email &&
        normalizarTelefone(item.telefone) === telefone
    );

    if (indiceUsuario < 0) {
      setMensagem("Nao encontramos uma conta com esse email e telefone.");
      return;
    }

    const usuariosAtualizados = [...usuarios];
    usuariosAtualizados[indiceUsuario] = {
      ...usuariosAtualizados[indiceUsuario],
      senha: recNovaSenha,
    };

    window.localStorage.setItem(USUARIOS_KEY, JSON.stringify(usuariosAtualizados));
    setLoginEmail(usuariosAtualizados[indiceUsuario].email);
    setLoginSenha("");
    limparFormularioRecuperacao();
    setModoRecuperacao(false);
    setAbaAtiva("login");
    setMensagem("Senha redefinida com sucesso. Faca login com a nova senha.");
  }

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Acesso do cliente</h1>
      <p className="mt-2 text-amber-950/80">
        Entre para gerenciar seus agendamentos ou crie sua conta em segundos.
      </p>

      {clienteLogado && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
          <p>
            Sessao ativa: <strong>{clienteLogado.nome}</strong>
            {` (${clienteLogado.email})`}
          </p>
          <button
            type="button"
            onClick={deslogar}
            className="rounded-lg bg-emerald-700 px-3 py-2 font-semibold text-white transition hover:brightness-110"
          >
            Deslogar
          </button>
        </div>
      )}

      <div className="mt-8 rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-6 shadow-lg shadow-amber-950/5">
        <div className="grid grid-cols-2 rounded-2xl bg-amber-900/10 p-1">
          <button
            type="button"
            onClick={() => setAbaAtiva("login")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition sm:text-base ${
              abaAtiva === "login"
                ? "bg-white text-amber-900 shadow"
                : "text-amber-900/80 hover:text-amber-950"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva("cadastro")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition sm:text-base ${
              abaAtiva === "cadastro"
                ? "bg-white text-amber-900 shadow"
                : "text-amber-900/80 hover:text-amber-950"
            }`}
          >
            Cadastro
          </button>
        </div>

        {abaAtiva === "login" ? (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <h2 className="text-3xl text-amber-900">Entrar na conta</h2>
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(event) => setLoginEmail(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="password"
              placeholder="Senha"
              value={loginSenha}
              onChange={(event) => setLoginSenha(event.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white transition hover:brightness-110"
            >
              Entrar
            </button>

            <button
              type="button"
              onClick={() => {
                setMensagem("");
                setModoRecuperacao((anterior) => {
                  if (anterior) {
                    limparFormularioRecuperacao();
                  }
                  return !anterior;
                });
              }}
              className="w-full rounded-lg border border-amber-900/20 bg-white px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-50"
            >
              {modoRecuperacao ? "Fechar recuperacao de senha" : "Esqueci minha senha"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="mt-6 space-y-3">
            <h2 className="text-3xl text-amber-900">Criar nova conta</h2>
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="text"
              placeholder="Nome"
              value={cadastroNome}
              onChange={(event) => setCadastroNome(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="email"
              placeholder="Email"
              value={cadastroEmail}
              onChange={(event) => setCadastroEmail(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="tel"
              placeholder="WhatsApp"
              value={cadastroTelefone}
              onChange={(event) => setCadastroTelefone(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="password"
              placeholder="Senha"
              value={cadastroSenha}
              onChange={(event) => setCadastroSenha(event.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-700 px-4 py-2 font-semibold text-white transition hover:brightness-110"
            >
              Cadastrar
            </button>
          </form>
        )}

        {abaAtiva === "login" && modoRecuperacao && (
          <form
            onSubmit={handleRecuperarSenha}
            className="mt-4 space-y-3 rounded-2xl border border-amber-900/20 bg-amber-50/70 p-4"
          >
            <h3 className="text-xl text-amber-900">Recuperar senha</h3>
            <p className="text-xs text-amber-900/80">
              Confirme email e telefone para criar uma nova senha.
            </p>
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="email"
              placeholder="Email da conta"
              value={recEmail}
              onChange={(event) => setRecEmail(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="tel"
              placeholder="Telefone da conta"
              value={recTelefone}
              onChange={(event) => setRecTelefone(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="password"
              placeholder="Nova senha"
              value={recNovaSenha}
              onChange={(event) => setRecNovaSenha(event.target.value)}
              required
            />
            <input
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              type="password"
              placeholder="Confirmar nova senha"
              value={recConfirmarSenha}
              onChange={(event) => setRecConfirmarSenha(event.target.value)}
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-800 px-4 py-2 font-semibold text-white transition hover:brightness-110"
            >
              Redefinir senha
            </button>
          </form>
        )}

        {mensagem && (
          <div className="mt-4 rounded-xl border border-amber-900/20 bg-amber-100/70 px-4 py-3 text-sm text-amber-950">
            <p>{mensagem}</p>
            {mensagem.includes("agendamento") && (
              <Link
                href="/agendamento"
                className="mt-2 inline-block font-semibold text-amber-900 underline"
              >
                Ir para agendamento
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
