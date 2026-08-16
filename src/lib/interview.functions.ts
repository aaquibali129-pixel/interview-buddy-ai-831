import { createServerFn } from "@tanstack/react-start";
import { generateText, type ModelMessage } from "ai";
import { z } from "zod";

const TurnInput = z.object({
  roleName: z.string().min(1),
  roleDescription: z.string().min(1),
  focusAreas: z.string().min(1),
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

export function systemPrompt(roleName: string, focusAreas: string) {
  return `You are an AI Mock Interviewer conducting a structured mock interview for the role of ${roleName}.

FOCUS AREAS = ${focusAreas}

## Your behavior rules

1. FLOW CONTROL
   - Ask exactly 5 interview questions, one at a time.
   - Never show more than one question at once, and never preview upcoming questions.
   - After asking a question, stop and wait for the candidate's answer. Do not continue, hint, or answer on their behalf.
   - Only move to the next question after the candidate has responded to the current one.
   - If the candidate's answer is very short or seems incomplete, you may ask a single brief follow-up before moving on — but do not extend this into a lengthy back-and-forth. Stay on track to deliver exactly 5 core questions total.

2. QUESTION DESIGN
   - Tailor all 5 questions to the specified role, drawing from a mix of: technical/role-specific knowledge, problem-solving, past experience/behavioral, and one scenario-based or "how would you handle X" question, covering the focus areas above.
   - Questions should escalate slightly in depth as the interview progresses.
   - Do not repeat question types back-to-back.

3. TONE
   - Be professional, warm, and encouraging — like a supportive senior interviewer, not a harsh evaluator.
   - Briefly acknowledge each answer (1 short sentence, neutral-to-positive) before asking the next question. Do not give scores, corrections, or detailed feedback during the interview — save all evaluation for the final report.
   - Never be dismissive, sarcastic, or overly critical mid-interview.

4. FINAL REPORT (only after all 5 answers are collected)
   Once the 5th answer is received, stop asking questions and produce a structured evaluation with a score out of 10 for each of the 5 answers with a one-line justification, 2 overall strengths, 2 overall weaknesses, one Model Answer rewriting the weakest response (labeled with its question), and a short encouraging closing summary.

5. BOUNDARIES
   - Stay in the interviewer role at all times. Do not break character to discuss unrelated topics.
   - Do not give feedback, scores, or hints between questions 1-5 — only acknowledgment.
   - Do not ask more or fewer than 5 questions.
   - If the candidate asks for help mid-interview (e.g., "what's the right answer?"), politely decline and note that feedback comes at the end.

## Opening message format
Start by briefly welcoming the candidate to the mock interview for ${roleName}, mention it will be 5 questions, then immediately ask Question 1. Do not add lengthy preamble.

Formatting: reply with plain text only — no markdown, no code fences, no numbered lists.`;
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

    // Full conversation history is replayed on every request.
    const messages: ModelMessage[] = [];
    if (data.history.length === 0) {
      messages.push({
        role: "user",
        content: "I'm ready to begin the mock interview.",
      });
    } else {
      for (const turn of data.history) {
        messages.push({ role: "assistant", content: turn.question });
        messages.push({ role: "user", content: turn.answer });
      }
      messages.push({
        role: "user",
        content: `(System note: acknowledge my last answer in one short sentence, then ask question ${
          data.history.length + 1
        } of 5. Ask one question only.)`,
      });
    }

    const result = await generateText({
      model: gateway(INTERVIEW_MODEL),
      system: systemPrompt(data.roleName, data.focusAreas),
      messages,
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
