"use client";

import { useEffect, useState } from "react";

import { ItemEditor, type ItemEditorValue } from "@/components/teacher/item-editor";

interface BankItem {
  id: string;
  skill: string;
  subskill: string;
  level: string;
  difficulty: number;
  type: string;
  question: string;
  answer: string;
}

export default function TeacherItemsPage() {
  const [items, setItems] = useState<BankItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadItems() {
    setLoading(true);

    try {
      const response = await fetch("/api/teacher/items");
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error ?? "Failed to fetch items");
      }

      setItems(json.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load items");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  async function createItem(value: ItemEditorValue) {
    const response = await fetch("/api/teacher/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(value),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error ?? "Failed to create item");
    }

    await loadItems();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-8 md:px-10">
      <h1 className="text-2xl font-bold text-slate-900">Item Bank Editor</h1>
      <ItemEditor onSave={createItem} />

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold text-slate-900">Saved Items</h2>

        {loading ? <p className="mt-3 text-sm text-slate-600">Loading...</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded border border-slate-200 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                <span>{item.id}</span>
                <span>{item.skill}</span>
                <span>{item.level}</span>
                <span>{item.subskill}</span>
              </div>
              <p className="mt-2 font-medium text-slate-800">{item.question}</p>
              <p className="mt-1 text-slate-600">Answer: {item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
