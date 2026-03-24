"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Barbeiro } from "@/types";

const BARBEIRO_SESSAO_KEY = "barber_barbeiro_sessao";
const AUTH_EVENT = "barber-auth-change";
const SENHA_PADRAO_BARBEIRO = "barber123";

type BarbeiroSessao = {
  id: string;
  nome: string;
};

export default function BarbeiroLoginPage() {
  const router = useRouter();
  const [barbeiros, setBarbeiros] = useState<Barbeiro[]>([]);
  const [barbeiroId, setBarbeiroId] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [barbeiroLogado, setBarbeiroLogado] = useState<BarbeiroSessao | null>(null);

  useEffect(() => {
    function sincronizarSessao() {
      const valorBruto = window.localStorage.getItem(BARBEIRO_SESSAO_KEY);
      if (!valorBruto) {
        setBarbeiroLogado(null);
        return;
      }

      try {
        setBarbeiroLogado(JSON.parse(valorBruto) as BarbeiroSessao);
      } catch {
        setBarbeiroLogado(null);
      }
    }

    async function carregarBarbeiros() {
      const response = await fetch("/api/barbeiros", { cache: "no-store" });
      const resultado = (await response.json()) as { barbeiros: Barbeiro[] };
      const lista = (resultado.barbeiros ?? []).filter((item) => item.ativo);

      setBarbeiros(lista);
      setBarbeiroId((anterior) => (lista.some((item) => item.id === anterior) ? anterior : (lista[0]?.id ?? "")));
    }

    sincronizarSessao();
    void carregarBarbeiros();

    window.addEventListener(AUTH_EVENT, sincronizarSessao);
    window.addEventListener("storage", sincronizarSessao);

    return () => {
      window.removeEventListener(AUTH_EVENT, sincronizarSessao);
      window.removeEventListener("storage", sincronizarSessao);
    };
  }, []);

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMensagem("");

    const barbeiroSelecionado = barbeiros.find((item) => item.id === barbeiroId);
    if (!barbeiroSelecionado) {
      setMensagem("Selecione um barbeiro ativo para entrar.");
      return;
    }

    if (senha !== SENHA_PADRAO_BARBEIRO) {
      setMensagem("Senha de barbeiro invalida.");
      return;
    }

    const sessao: BarbeiroSessao = {
      id: barbeiroSelecionado.id,
      nome: barbeiroSelecionado.nome,
    };

    window.localStorage.setItem(BARBEIRO_SESSAO_KEY, JSON.stringify(sessao));
    window.dispatchEvent(new Event(AUTH_EVENT));
    setBarbeiroLogado(sessao);
    router.push("/barbeiro");
  }

  function handleLogout() {
    window.localStorage.removeItem(BARBEIRO_SESSAO_KEY);
    window.dispatchEvent(new Event(AUTH_EVENT));
    setBarbeiroLogado(null);
    setMensagem("Sessao de barbeiro encerrada.");
  }

  return (
    <section className="mx-auto w-full max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Login do Barbeiro</h1>
      <p className="mt-2 text-amber-950/80">Acesse sua agenda e veja os clientes do dia.</p>

      <div className="mt-8 rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-6">
        {barbeiroLogado ? (
          <div className="space-y-4">
            <p className="rounded-xl border border-emerald-700/20 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Sessao barbeiro ativa: <strong>{barbeiroLogado.nome}</strong>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/barbeiro"
                className="rounded-lg bg-[var(--brand)] px-4 py-2 font-semibold text-white"
              >
                Ir para agenda
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-red-900/20 bg-red-50 px-4 py-2 font-semibold text-red-800"
              >
                Deslogar barbeiro
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3">
            <label className="space-y-1 block">
              <span className="text-sm font-semibold text-amber-900">Barbeiro</span>
              <select
                className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
                value={barbeiroId}
                onChange={(event) => setBarbeiroId(event.target.value)}
                disabled={barbeiros.length === 0}
              >
                {barbeiros.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </select>
            </label>

            <input
              type="password"
              placeholder="Senha do barbeiro"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="w-full rounded-lg border border-amber-900/20 bg-white px-3 py-2"
              required
            />

            <button
              type="submit"
              disabled={barbeiros.length === 0}
              className="w-full rounded-lg bg-amber-900 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              Entrar como barbeiro
            </button>

            <p className="text-xs text-amber-900/70">Demo senha: {SENHA_PADRAO_BARBEIRO}</p>
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
