"use client";

import { useEffect, useState } from "react";
import type { Servico } from "@/types";

const ADMIN_SESSAO_KEY = "barber_admin_sessao";

type AdminSessao = {
  nome: string;
  email: string;
};

type ModoFormulario = "criar" | "editar" | null;

const formatarPreco = (preco: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [adminLogado, setAdminLogado] = useState<AdminSessao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [modoFormulario, setModoFormulario] = useState<ModoFormulario>(null);
  const [servicoEmEdicao, setServicoEmEdicao] = useState<Servico | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    preco: "",
    duracaoMinutos: "",
  });

  const [mensagem, setMensagem] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    carregarServicos();
    verificarAdminLogado();
  }, []);

  async function carregarServicos() {
    try {
      setCarregando(true);
      const resposta = await fetch("/api/servicos", { cache: "no-store" });
      if (!resposta.ok) throw new Error("Erro ao carregar serviços");
      const dados = await resposta.json();
      setServicos(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      console.error("Erro:", erro);
      setMensagem({
        tipo: "erro",
        texto: "Erro ao carregar serviços",
      });
    } finally {
      setCarregando(false);
    }
  }

  function verificarAdminLogado() {
    if (typeof window === "undefined") return;

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

  function abrirFormularioCriar() {
    setModoFormulario("criar");
    setServicoEmEdicao(null);
    setFormData({ nome: "", preco: "", duracaoMinutos: "" });
  }

  function abrirFormularioEditar(servico: Servico) {
    setModoFormulario("editar");
    setServicoEmEdicao(servico);
    setFormData({
      nome: servico.nome,
      preco: String(servico.preco),
      duracaoMinutos: String(servico.duracaoMinutos),
    });
  }

  function fecharFormulario() {
    setModoFormulario(null);
    setServicoEmEdicao(null);
    setFormData({ nome: "", preco: "", duracaoMinutos: "" });
  }

  async function handleSubmitServico(e: React.FormEvent) {
    e.preventDefault();

    if (!adminLogado) {
      setMensagem({ tipo: "erro", texto: "Você precisa estar logado como admin" });
      return;
    }

    if (!formData.nome || !formData.preco || !formData.duracaoMinutos) {
      setMensagem({ tipo: "erro", texto: "Preencha todos os campos" });
      return;
    }

    setSalvando(true);

    try {
      const url = modoFormulario === "editar" && servicoEmEdicao 
        ? `/api/servicos/${servicoEmEdicao.id}` 
        : "/api/servicos";
      
      const method = modoFormulario === "editar" ? "PUT" : "POST";

      const resposta = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: formData.nome,
          preco: parseFloat(formData.preco),
          duracaoMinutos: parseInt(formData.duracaoMinutos),
        }),
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.error || "Erro ao salvar serviço");
      }

      setMensagem({
        tipo: "sucesso",
        texto: modoFormulario === "editar" 
          ? "Serviço atualizado com sucesso!" 
          : "Serviço adicionado com sucesso!",
      });

      fecharFormulario();
      await carregarServicos();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Erro ao salvar serviço",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function handleRemoverServico(servicoId: string) {
    if (!adminLogado) {
      setMensagem({ tipo: "erro", texto: "Você precisa estar logado como admin" });
      return;
    }

    if (!confirm("Tem certeza que deseja remover este serviço?")) {
      return;
    }

    try {
      const resposta = await fetch(`/api/servicos/${servicoId}`, {
        method: "DELETE",
      });

      if (!resposta.ok) {
        const erro = await resposta.json();
        throw new Error(erro.error || "Erro ao remover serviço");
      }

      setMensagem({
        tipo: "sucesso",
        texto: "Serviço removido com sucesso!",
      });

      await carregarServicos();
    } catch (erro) {
      setMensagem({
        tipo: "erro",
        texto: erro instanceof Error ? erro.message : "Erro ao remover serviço",
      });
    }
  }

  if (carregando) {
    return (
      <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <p className="text-amber-950">Carregando serviços...</p>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Servicos e Precos</h1>
      <p className="mt-2 text-amber-950/80">
        Escolha o servico ideal para seu estilo.
      </p>

      {mensagem && (
        <div
          className={`mt-4 rounded-lg p-4 ${
            mensagem.tipo === "sucesso"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servicos.map((servico) => (
          <article
            key={servico.id}
            className="rounded-2xl border border-amber-900/15 bg-[var(--surface)] p-5 flex flex-col"
          >
            <h2 className="text-3xl text-amber-900">{servico.nome}</h2>
            <p className="mt-2 text-sm text-amber-900/80">
              Duracao media: {servico.duracaoMinutos} min
            </p>
            <p className="mt-4 text-xl font-semibold text-amber-950">
              {formatarPreco(servico.preco)}
            </p>

            {adminLogado && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => abrirFormularioEditar(servico)}
                  className="flex-1 rounded-lg bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleRemoverServico(servico.id)}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Remover
                </button>
              </div>
            )}
          </article>
        ))}
      </div>

      {adminLogado && (
        <div className="mt-12 border-t border-amber-900/15 pt-10">
          <button
            onClick={abrirFormularioCriar}
            className="rounded-lg bg-amber-900 px-6 py-2 font-medium text-white hover:bg-amber-950"
          >
            + Adicionar novo servico
          </button>
        </div>
      )}

      {modoFormulario && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 mx-4">
            <h2 className="text-2xl font-bold text-amber-950 mb-4">
              {modoFormulario === "editar" ? "Editar Servico" : "Novo Servico"}
            </h2>

            <form onSubmit={handleSubmitServico} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-amber-950">
                  Nome do Servico
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                  placeholder="Ex: Corte + Barba Premium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-950">
                  Preco (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.preco}
                  onChange={(e) =>
                    setFormData({ ...formData, preco: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                  placeholder="Ex: 75.50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-amber-950">
                  Duracao (minutos)
                </label>
                <input
                  type="number"
                  min="5"
                  step="5"
                  value={formData.duracaoMinutos}
                  onChange={(e) =>
                    setFormData({ ...formData, duracaoMinutos: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-amber-900/30 bg-white px-3 py-2 text-amber-950"
                  placeholder="Ex: 45"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={fecharFormulario}
                  className="flex-1 rounded-lg border border-amber-900/30 px-4 py-2 font-medium text-amber-950 hover:bg-amber-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvando}
                  className="flex-1 rounded-lg bg-amber-900 px-4 py-2 font-medium text-white hover:bg-amber-950 disabled:opacity-50"
                >
                  {salvando ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
