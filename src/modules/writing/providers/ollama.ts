import { parseWritingEvaluation, WRITING_EVALUATOR_PROMPT } from "@/modules/writing/provider-adapter";
import type {
  ProviderConfig,
  WritingProviderAdapter,
} from "@/modules/writing/provider-adapter";

function buildUserContent(prompt: string, text: string) {
  return `Prompt: ${prompt}\n\nStudent response:\n${text}`;
}

export const ollamaWritingProvider: WritingProviderAdapter = {
  provider: "ollama",
  async evaluate(prompt: string, text: string, config: ProviderConfig) {
    const endpoint = config.endpoint ?? "http://localhost:11434/api/chat";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model ?? "llama3.1",
        stream: false,
        format: "json",
        messages: [
          { role: "system", content: WRITING_EVALUATOR_PROMPT },
          { role: "user", content: buildUserContent(prompt, text) },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Ollama evaluation failed: ${response.status} ${details}`);
    }

    const json = await response.json();
    const content = json.message?.content;

    if (!content) {
      throw new Error("Ollama response did not include JSON content");
    }

    return parseWritingEvaluation(content);
  },
};
