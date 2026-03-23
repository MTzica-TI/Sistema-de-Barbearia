export default function ContatoPage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-5xl text-amber-950">Contato</h1>
      <p className="mt-2 text-amber-950/80">
        Fale com a equipe e venha conhecer nossa unidade.
      </p>

      <div className="mt-8 grid gap-4 rounded-2xl border border-amber-900/20 bg-[var(--surface)] p-6 sm:grid-cols-2">
        <div>
          <h2 className="text-3xl text-amber-900">Endereco</h2>
          <p className="mt-2 text-sm text-amber-950/80">
            Rua das Navalhas, 100 - Centro
            <br />
            Rio de Janeiro - RJ cep: 20000-000
          </p>
        </div>
        <div>
          <h2 className="text-3xl text-amber-900">WhatsApp</h2>
          <p className="mt-2 text-sm text-amber-950/80">(21) 99999-0000</p>
          <a
            href="https://wa.me/5521999990000"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Chamar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
