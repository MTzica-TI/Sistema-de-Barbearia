import { servicos } from "@/lib/mock-data";

const formatarPreco = (preco: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(preco);

export default function ServicosPage() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Servicos e Precos</h1>
      <p className="mt-2 text-amber-950/80">
        Escolha o servico ideal para seu estilo.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {servicos.map((servico) => (
          <article
            key={servico.id}
            className="rounded-2xl border border-amber-900/15 bg-[var(--surface)] p-5"
          >
            <h2 className="text-3xl text-amber-900">{servico.nome}</h2>
            <p className="mt-2 text-sm text-amber-900/80">
              Duracao media: {servico.duracaoMinutos} min
            </p>
            <p className="mt-4 text-xl font-semibold text-amber-950">
              {formatarPreco(servico.preco)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
