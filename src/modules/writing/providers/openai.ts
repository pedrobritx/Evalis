import { parseWritingEvaluation, WRITING_EVALUATOR_PROMPT } from "@/modules/writing/provider-adapter";
import type {
  ProviderConfig,
  WritingProviderAdapter,
} from "@/modules/writing/provider-adapter";

function buildUserContent(prompt: string, text: string) {
  return `Prompt: ${prompt}\n\nStudent response:\n${text}`;
}

export const openAiWritingProvider: WritingProviderAdapter = {
  provider: "openai",
  async evaluate(prompt: string, text: string, config: ProviderConfig) {
    const apiKey = config.apiKey;

    if (!apiKey) {
      throw new Error("OpenAI API key is required for writing evaluation");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.model ?? "gpt-4o-mini",
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: WRITING_EVALUATOR_PROMPT },
          { role: "user", content: buildUserContent(prompt, text) },
        ],
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`OpenAI evaluation failed: ${response.status} ${details}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("OpenAI response did not include JSON content");
    }

    return parseWritingEvaluation(content);
  },
};
