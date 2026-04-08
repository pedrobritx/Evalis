import Link from "next/link";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 md:px-10">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-teal-50 via-white to-amber-50 p-8 md:p-14">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">Evalis</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
          Adaptive CEFR Placement with Confidence Bands and Teacher-Controlled Content
        </h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-700">
          Evalis provides per-skill placement for Reading, Listening, Use of English, and Writing using
          adaptive progression and reporting dashboards.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/teacher/dashboard"
            className="rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
          >
            Open Teacher Dashboard
          </Link>
          <Link
            href="/teacher/items"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Manage Item Bank
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Adaptive Modes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Short mode reaches results faster with lower precision. Full mode runs more items for higher
            confidence and more stable placement.
          </p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Writing Evaluation</h2>
          <p className="mt-2 text-sm text-slate-600">
            Writing is optional and can remain pending. Teachers trigger AI evaluation manually with audit
            logs and usage limits enforced.
          </p>
        </article>
      </section>
    </main>
  );
}
