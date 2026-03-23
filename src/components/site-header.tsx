"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CLIENTE_SESSAO_KEY = "barber_cliente_sessao";
const ADMIN_SESSAO_KEY = "barber_admin_sessao";
const AUTH_EVENT = "barber-auth-change";

type ClienteSessao = {
  nome: string;
  email: string;
  telefone: string;
};

type AdminSessao = {
  nome: string;
  email: string;
};

function lerSessaoCliente(): ClienteSessao | null {
  if (typeof window === "undefined") {
    return null;
  }

  const valorBruto = window.localStorage.getItem(CLIENTE_SESSAO_KEY);
  if (!valorBruto) {
    return null;
  }

  try {
    return JSON.parse(valorBruto) as ClienteSessao;
  } catch {
    return null;
  }
}

function lerSessaoAdmin(): AdminSessao | null {
  if (typeof window === "undefined") {
    return null;
  }

  const valorBruto = window.localStorage.getItem(ADMIN_SESSAO_KEY);
  if (!valorBruto) {
    return null;
  }

  try {
    return JSON.parse(valorBruto) as AdminSessao;
  } catch {
    return null;
  }
}

const links = [
  { href: "/", label: "Home" },
  { href: "/servicos", label: "Servicos" },
  { href: "/agendamento", label: "Agendamento" },
  { href: "/area-cliente", label: "Area do cliente" },
  { href: "/admin", label: "Admin" },
  { href: "/barbeiro", label: "Barbeiro" },
  { href: "/contato", label: "Contato" },
  { href: "/login", label: "Login/Cadastro" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [clienteLogado, setClienteLogado] = useState<ClienteSessao | null>(null);
  const [adminLogado, setAdminLogado] = useState<AdminSessao | null>(null);

  useEffect(() => {
    function atualizarSessao() {
      setClienteLogado(lerSessaoCliente());
      setAdminLogado(lerSessaoAdmin());
    }

    atualizarSessao();
    window.addEventListener(AUTH_EVENT, atualizarSessao);
    window.addEventListener("storage", atualizarSessao);

    return () => {
      window.removeEventListener(AUTH_EVENT, atualizarSessao);
      window.removeEventListener("storage", atualizarSessao);
    };
  }, []);

  function handleLogout() {
    if (adminLogado) {
      window.localStorage.removeItem(ADMIN_SESSAO_KEY);
    }

    if (clienteLogado) {
      window.localStorage.removeItem(CLIENTE_SESSAO_KEY);
    }

    window.dispatchEvent(new Event(AUTH_EVENT));
    setClienteLogado(null);
    setAdminLogado(null);
    router.push(adminLogado ? "/admin/login" : "/login");
  }

  const linksVisiveis = links.filter(
    (link) => {
      if (link.href === "/admin") {
        return Boolean(adminLogado);
      }

      if (link.href === "/login") {
        return !clienteLogado && !adminLogado;
      }

      return true;
    }
  );

  return (
    <header className="sticky top-0 z-50 border-b border-amber-200/70 bg-[rgba(255,248,238,0.85)] text-amber-950 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="mx-auto flex w-fit items-center gap-2 rounded-full border border-amber-700/20 bg-white/85 px-4 py-2 text-amber-900 shadow-sm"
        >
          <Image
            src="/images/branding/logo_barber.png"
            alt="Logo da barbearia"
            width={40}
            height={40}
            className="h-9 w-9 rounded-full object-contain mix-blend-multiply sm:h-10 sm:w-10"
          />
          <span className="font-title text-3xl leading-none tracking-[0.02em] sm:text-4xl">
            BARBER SISTEMA
          </span>
        </Link>

        <nav className="-mx-1 mt-4 flex max-w-full items-center gap-2 overflow-x-auto px-1 text-sm sm:justify-center sm:gap-3">
          {linksVisiveis.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 font-medium transition ${
                pathname === link.href
                  ? "border-amber-700/40 bg-amber-900 text-amber-50 shadow"
                  : "border-amber-800/15 bg-white/70 text-amber-900 hover:border-amber-700/30 hover:bg-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {(clienteLogado || adminLogado) && (
            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap rounded-full border border-red-900/20 bg-red-50 px-3 py-1.5 font-medium text-red-800 transition hover:border-red-700/40 hover:bg-red-100"
            >
              {adminLogado
                ? `Sair admin (${adminLogado.nome.split(" ")[0]})`
                : `Sair (${clienteLogado?.nome.split(" ")[0] ?? "Conta"})`}
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
