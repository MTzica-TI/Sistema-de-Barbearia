"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const AUTH_EVENT = "barber-auth-change";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_SENHA = "admin123";

type AdminSessao = {
  nome: string;
  email: string;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [adminLogado, setAdminLogado] = useState<AdminSessao | null>(null);

  useEffect(() => {
    function sincronizarSessaoAdmin() {
      const valorBruto = window.localStorage.getItem(ADMIN_SESSAO_KEY);
      if (!valorBruto) {
        setAdminLogado(null);
        return;
      }

      try {
        setAdminLogado(JSON.parse(valorBruto) as AdminSessao);
      } catch {
        setAdminLogado(null);
      }
    }

    sincronizarSessaoAdmin();
    window.addEventListener(AUTH_EVENT, sincronizarSessaoAdmin);
    window.addEventListener("storage", sincronizarSessaoAdmin);

    return () => {
      window.removeEventListener(AUTH_EVENT, sincronizarSessaoAdmin);
      window.removeEventListener("storage", sincronizarSessaoAdmin);
    };
  }, []);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    if (email.trim().toLowerCase() !== ADMIN_EMAIL || senha !== ADMIN_SENHA) {
      setMensagem("Credenciais de administrador invalidas.");
      return;
    }

    const sessaoAdmin: AdminSessao = {
      nome: "Administrador",
      email: ADMIN_EMAIL,
    };

    window.localStorage.setItem(ADMIN_SESSAO_KEY, JSON.stringify(sessaoAdmin));
    window.dispatchEvent(new Event(AUTH_EVENT));
    setAdminLogado(sessaoAdmin);
    router.push("/admin");
  }

  function handleLogoutAdmin() {
    window.localStorage.removeItem(ADMIN_SESSAO_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setAdminLogado(null);
    setMensagem("Sessao de administrador encerrada.");
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Login do Administrador</h1>
      <p className="mt-2 text-amber-950/80">
        Area exclusiva para gerenciamento da barbearia.
      </p>

      <div className="mt-8 rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-6">
        {adminLogado ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Sessao admin ativa: <strong>{adminLogado.email}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white"
              >
                Ir para dashboard
              </Link>
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="rounded-lg border border-red-900/20 bg-red-50 px-4 py-2 font-semibold text-red-800"
              >
                Deslogar admin
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="email"
              placeholder="Email admin"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Senha"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              required
            />
            <button
              type="submit"
              className="w-full rounded-lg bg-amber-900 px-4 py-2 font-semibold text-white"
            >
              Entrar como admin
            </button>
            <p className="text-xs text-amber-900/70">
              Demo: {ADMIN_EMAIL} / {ADMIN_SENHA}
            </p>
          </form>
        )}

        {mensagem && (
          <p className="mt-4 rounded-xl border border-amber-900/20 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {mensagem}
          </p>
        )}
      </div>
    </section>
  );
}
