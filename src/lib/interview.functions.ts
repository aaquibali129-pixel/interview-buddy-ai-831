import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

const TurnInput = z.object({
  roleName: z.string().min(1),
  roleDescription: z.string().min(1),
  history: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .max(5),
});

const ReportInput = z.object({
  roleName: z.string().min(1),
  pairs: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
});

const reportSchema = z.object({
  scores: z.array(
    z.object({
      question: z.string(),
      score: z.number().min(0).max(10),
      comment: z.string(),
    }),
  ),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  modelAnswer: z.object({
    questionIndex: z.number().int().min(0),
    question: z.string(),
    answer: z.string(),
  }),
  overall: z.number().min(0).max(10),
});

function systemPrompt(roleName: string, roleDescription: string) {
  return `You are an experienced, professional technical interviewer conducting a mock interview for the role of ${roleName}. Context: ${roleDescription}

Rules:
1. Ask exactly 5 questions in total, one at a time. Never ask more than one question per message.
2. Wait for the candidate's answer before asking the next question.
3. Questions must progress in difficulty and stay relevant to the role.
4. Keep a professional but encouraging tone. Briefly acknowledge the previous answer in one short sentence, then ask the next question.
5. Never reveal scores or feedback during the interview.
6. Reply with plain text only — no markdown, no numbering, no preamble labels.`;
}

export const nextQuestion = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TurnInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider, INTERVIEW_MODEL } = await import(
      "./ai-gateway.server"
    );
    const gateway = createLovableAiGatewayProvider(key);

    const transcript = data.history
      .map((h, i) => `Q${i + 1}: ${h.question}\nCandidate: ${h.answer}`)
      .join("\n\n");
    const n = data.history.length + 1;

    const result = await generateText({
      model: gateway(INTERVIEW_MODEL),
      system: systemPrompt(data.roleName, data.roleDescription),
      prompt: `Interview so far:\n${transcript}\n\nAsk question ${n} of 5 now.`,
      maxRetries: 1,
    });
    return { question: result.text.trim() };
  });

export const buildReport = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ReportInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const { createLovableAiGatewayProvider, INTERVIEW_MODEL } = await import(
      "./ai-gateway.server"
    );
    const gateway = createLovableAiGatewayProvider(key);

    const transcript = data.pairs
      .map((p, i) => `Q${i + 1}: ${p.question}\nAnswer ${i + 1}: ${p.answer}`)
      .join("\n\n");

    const result = await generateText({
      model: gateway(INTERVIEW_MODEL),
      system: `You are a professional but encouraging interviewer for the role of ${data.roleName}. Evaluate the candidate fairly and constructively. Reply with raw JSON only — no markdown, no code fences, no commentary.`,
      prompt: `Here is the completed mock interview transcript:\n\n${transcript}\n\nProduce an evaluation as JSON matching exactly this shape:
{
  "scores": [{ "question": string, "score": number 0-10, "comment": string }],  // one entry per answer, same order, echo the question text, 1-2 sentence comment
  "strengths": [string, string],   // exactly 2
  "weaknesses": [string, string],  // exactly 2
  "modelAnswer": { "questionIndex": number, "question": string, "answer": string }, // a strong model answer for the WEAKEST response, zero-based index
  "overall": number 0-10
}
There are ${data.pairs.length} answers.`,
      maxRetries: 2,
    });

    const raw = result.text
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const parsed = reportSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      strengths: parsed.strengths.slice(0, 2),
      weaknesses: parsed.weaknesses.slice(0, 2),
    };
  });
