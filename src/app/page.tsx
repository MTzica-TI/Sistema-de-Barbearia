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
            Seu corte impecavel, sem espera e no horario certo.
          </h1>
          <p className="max-w-xl text-base text-amber-950/80 sm:text-lg">
            Agende em menos de 1 minuto, escolha seu barbeiro favorito e
            chegue para ser atendido com tranquilidade.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/agendamento"
              className="rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Agendar agora
            </Link>
            <Link
              href="/assinaturas"
              className="rounded-xl border border-amber-900/25 px-5 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
            >
              Ver assinaturas
            </Link>
          </div>
          <div className="grid gap-3 pt-3 sm:grid-cols-3">
            <div className="rounded-xl border border-amber-900/15 bg-amber-50/80 px-4 py-3">
              <p className="text-2xl font-semibold text-amber-950">+1.200</p>
              <p className="text-xs font-medium text-amber-900/85">clientes atendidos</p>
            </div>
            <div className="rounded-xl border border-amber-900/15 bg-amber-50/80 px-4 py-3">
              <p className="text-2xl font-semibold text-amber-950">4.9/5</p>
              <p className="text-xs font-medium text-amber-900/85">nota media nas avaliacoes</p>
            </div>
            <div className="rounded-xl border border-amber-900/15 bg-amber-50/80 px-4 py-3">
              <p className="text-2xl font-semibold text-amber-950">98%</p>
              <p className="text-xs font-medium text-amber-900/85">retorno em ate 30 dias</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-[linear-gradient(150deg,#1f130c,#3f2415_45%,#5e3318)] p-6 text-amber-50">
          <h2 className="text-3xl">Avaliacoes de clientes</h2>
          <p className="mt-2 text-sm text-amber-100/85">
            Quem agenda, volta. Veja o que os clientes falam do atendimento.
          </p>

          <div className="mt-5 space-y-3">
            {[
              [
                "5/5",
                "Agendei em menos de 1 minuto e fui atendido no horario.",
                "Rafael, cliente desde 2024",
              ],
              [
                "4.9/5",
                "Equipe atenciosa e processo muito pratico pelo celular.",
                "Leandro, cliente mensal",
              ],
              [
                "5/5",
                "Consigo remarcar rapido quando preciso. Plataforma excelente.",
                "Marcos, cliente recorrente",
              ],
            ].map(([nota, comentario, autor]) => (
              <article
                key={autor}
                className="rounded-xl border border-amber-100/20 bg-white/10 p-4"
              >
                <p className="text-sm font-semibold text-amber-200">{nota}</p>
                <p className="mt-1 text-sm text-amber-50/95">"{comentario}"</p>
                <p className="mt-2 text-xs text-amber-100/80">{autor}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-amber-900/70">
              POR QUE ESCOLHER A GENTE
            </p>
            <h2 className="text-3xl text-amber-950 sm:text-4xl">
              Experiencia completa para voce sair no estilo
            </h2>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["01", "Pontualidade de verdade", "Seu horario reservado para voce, sem fila e sem atraso."],
            ["02", "Barbeiros especialistas", "Profissionais experientes em degradê, tesoura e acabamento."],
            ["03", "Conforto do inicio ao fim", "Ambiente climatizado, atendimento atencioso e cafe por conta da casa."],
            ["04", "Facilidade no pagamento", "Pix, cartao e dinheiro com confirmacao rapida no agendamento."],
          ].map(([index, title, text]) => (
            <article
              key={title}
              className="group rounded-2xl border border-amber-900/15 bg-[var(--surface)] p-5 transition hover:-translate-y-1 hover:border-amber-800/30 hover:shadow-[0_14px_30px_rgba(90,45,12,0.12)]"
            >
              <p className="inline-flex rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                {index}
              </p>
              <h3 className="mt-3 text-2xl text-amber-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/80">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
