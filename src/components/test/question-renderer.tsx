"use client";

interface QuestionItem {
  id: string;
  skill: "reading" | "listening" | "usee" | "writing";
  question: string;
  options?: string[];
  type: string;
  subskill: string;
  difficulty: number;
}

interface QuestionRendererProps {
  item: QuestionItem;
  answer: string;
  onChange: (value: string) => void;
}

export function QuestionRenderer({ item, answer, onChange }: QuestionRendererProps) {
  if (item.skill === "writing") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Write between 50 and 120 words.</p>
        <textarea
          value={answer}
          onChange={(event) => onChange(event.target.value)}
          rows={8}
          className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="Type your response..."
        />
      </div>
    );
  }

  if (item.options && item.options.length > 0) {
    return (
      <div className="space-y-2">
        {item.options.map((option) => (
          <label
            key={option}
            className="flex cursor-pointer items-center gap-3 rounded-md border border-slate-200 p-3 text-sm hover:border-teal-400"
          >
            <input
              type="radio"
              name="answer"
              value={option}
              checked={answer === option}
              onChange={(event) => onChange(event.target.value)}
              className="h-4 w-4 accent-teal-600"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <input
      value={answer}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-md border border-slate-300 p-3 text-sm focus:border-teal-500 focus:outline-none"
      placeholder="Type your answer"
    />
  );
}
