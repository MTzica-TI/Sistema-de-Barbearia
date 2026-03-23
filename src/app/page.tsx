import Link from "next/link";

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-10 sm:px-6 lg:pt-16">
      <div className="grid gap-6 rounded-3xl border border-amber-900/20 bg-[var(--surface)] p-8 shadow-[0_20px_50px_rgba(80,40,10,0.12)] lg:grid-cols-2 lg:p-10">
        <div className="space-y-5">
          <p className="inline-block rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold tracking-wide text-amber-900">
            BARBEARIA SISTEMA
          </p>
          <h1 className="text-5xl leading-none text-amber-950 sm:text-6xl">
            Seu estilo, no horario certo.
          </h1>
          <p className="max-w-xl text-base text-amber-950/80 sm:text-lg">
            Plataforma completa para agendamentos, pagamentos recorrentes e
            gestao da sua barbearia. Cliente marca em minutos e equipe acompanha
            tudo em tempo real.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/agendamento"
              className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Agendar agora
            </Link>
            <Link
              href="/servicos"
              className="rounded-xl border border-amber-900/25 px-5 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Ver servicos e precos
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-[linear-gradient(150deg,#1f130c,#3f2415_45%,#5e3318)] p-6 text-amber-50">
          <h2 className="text-3xl">Como funciona</h2>
          <ol className="mt-4 space-y-3 text-sm sm:text-base">
            <li>1. Cliente escolhe plano, barbeiro e servico.</li>
            <li>2. Seleciona data e horario disponivel no calendario.</li>
            <li>3. Confirma pagamento e recebe WhatsApp automatico.</li>
            <li>4. Horario fica bloqueado para evitar conflito.</li>
          </ol>
          <p className="mt-6 text-sm text-amber-100/85">
            Integracoes prontas para Stripe, Mercado Pago, PagSeguro e
            AbacatePay.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Agenda inteligente", "Bloqueio automatico de horario"],
          ["Painel administrativo", "Agenda, equipe e faturamento"],
          ["Login de clientes", "Historico e cancelamento online"],
          ["Fidelidade", "Cupons, assinatura e recorrencia"],
        ].map(([title, text]) => (
          <article
            key={title}
            className="rounded-2xl border border-amber-900/15 bg-[var(--surface)] p-5"
          >
            <h3 className="text-2xl text-amber-900">{title}</h3>
            <p className="mt-2 text-sm text-amber-950/80">{text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
