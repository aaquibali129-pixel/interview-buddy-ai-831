import { createFileRoute, notFound, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Timer, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getRole, QUESTION_COUNT, SECONDS_PER_QUESTION } from "@/lib/roles";
import { buildReport, nextQuestion } from "@/lib/interview.functions";
import { saveSession, type QAPair } from "@/lib/interview-session";

export const Route = createFileRoute("/interview/$roleId")({
  loader: ({ params }) => {
    const role = getRole(params.roleId);
    if (!role) throw notFound();
    return { role };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.role.name ?? "Interview";
    return {
      meta: [
        { title: `${name} Mock Interview — InterviewPilot` },
        {
          name: "description",
          content: `Answer ${QUESTION_COUNT} timed ${name} interview questions from an AI interviewer and get instant scored feedback.`,
        },
        { property: "og:title", content: `${name} Mock Interview — InterviewPilot` },
        {
          property: "og:description",
          content: `A timed ${QUESTION_COUNT}-question AI mock interview for the ${name} role.`,
        },
      ],
    };
  },
  component: InterviewScreen,
});

type Turn = { role: "ai" | "user"; text: string };

function InterviewScreen() {
  const { role } = Route.useLoaderData();
  const navigate = useNavigate();
  const askNext = useServerFn(nextQuestion);
  const makeReport = useServerFn(buildReport);

  const [turns, setTurns] = useState<Turn[]>([{ role: "ai", text: role.seedQuestion }]);
  const [pairs, setPairs] = useState<QAPair[]>([]);
  const [current, setCurrent] = useState(role.seedQuestion);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const index = pairs.length; // 0-based index of the question being answered
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, busy]);

  useEffect(() => {
    if (busy || finishing) return;
    setSeconds(0);
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [index, busy, finishing]);

  const remaining = Math.max(0, SECONDS_PER_QUESTION - seconds);
  const overtime = seconds > SECONDS_PER_QUESTION;
  const clock = overtime ? seconds - SECONDS_PER_QUESTION : remaining;
  const mm = String(Math.floor(clock / 60)).padStart(2, "0");
  const ss = String(clock % 60).padStart(2, "0");

  async function submit() {
    const answer = draft.trim();
    if (!answer || busy || finishing) return;
    setError(null);
    setDraft("");
    const spent = seconds;
    const updated = [...pairs, { question: current, answer, seconds: spent }];
    setPairs(updated);
    setTurns((t) => [...t, { role: "user", text: answer }]);

    try {
      if (updated.length >= QUESTION_COUNT) {
        setFinishing(true);
        const report = await makeReport({
          data: {
            roleName: role.name,
            pairs: updated.map((p) => ({ question: p.question, answer: p.answer })),
          },
        });
        saveSession({
          roleId: role.id,
          pairs: updated,
          report,
          completedAt: new Date().toISOString(),
        });
        navigate({ to: "/report/$roleId", params: { roleId: role.id } });
        return;
      }

      setBusy(true);
      const { question } = await askNext({
        data: {
          roleName: role.name,
          roleDescription: role.description,
          history: updated.map((p) => ({ question: p.question, answer: p.answer })),
        },
      });
      setCurrent(question);
      setTurns((t) => [...t, { role: "ai", text: question }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(
        msg.includes("429")
          ? "The interviewer is rate limited right now. Please retry in a moment."
          : msg.includes("402")
            ? "AI credits are exhausted for this workspace. Add credits to continue."
            : "Couldn't reach the interviewer. Please try submitting again.",
      );
      setPairs(pairs);
      setDraft(answer);
      setTurns((t) => t.slice(0, -1));
      setFinishing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="bg-gradient-navy px-6 py-5 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div>
            <Link to="/" className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100">
              InterviewPilot
            </Link>
            <h1 className="font-display text-lg font-semibold">{role.name} interview</h1>
          </div>
          <div className="text-right">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-display text-sm font-semibold tabular-nums ${
                overtime ? "bg-destructive/90" : "bg-white/15"
              }`}
            >
              <Timer className="h-4 w-4" aria-hidden />
              {overtime ? "+" : ""}
              {mm}:{ss}
            </div>
            <p className="mt-1 text-xs opacity-70">
              Question {Math.min(index + 1, QUESTION_COUNT)} of {QUESTION_COUNT}
            </p>
          </div>
        </div>
        <div className="mx-auto mt-4 flex max-w-3xl gap-1.5">
          {Array.from({ length: QUESTION_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < index ? "bg-gold" : i === index ? "bg-white/70" : "bg-white/20"}`}
            />
          ))}
        </div>
      </header>

      <section className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-6 py-8">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex gap-3 ${t.role === "user" ? "flex-row-reverse text-right" : ""}`}
          >
            <span
              className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                t.role === "ai"
                  ? "bg-navy text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              {t.role === "ai" ? (
                <Bot className="h-4 w-4" aria-hidden />
              ) : (
                <User className="h-4 w-4" aria-hidden />
              )}
            </span>
            <p
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-card ${
                t.role === "ai"
                  ? "rounded-tl-sm border border-border bg-card text-card-foreground"
                  : "rounded-tr-sm bg-navy text-primary-foreground"
              }`}
            >
              {t.text}
            </p>
          </div>
        ))}

        {(busy || finishing) && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            {finishing ? "Scoring your interview…" : "The interviewer is thinking…"}
          </p>
        )}
        {error && <p className="text-sm font-medium text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </section>

      <footer className="sticky bottom-0 border-t border-border bg-card px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-end gap-3">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
            }}
            placeholder="Type your answer… (Ctrl + Enter to send)"
            rows={3}
            disabled={busy || finishing}
            className="resize-none"
            aria-label="Your answer"
          />
          <Button
            onClick={submit}
            disabled={!draft.trim() || busy || finishing}
            className="h-11 gap-2"
          >
            <Send className="h-4 w-4" aria-hidden />
            {index + 1 === QUESTION_COUNT ? "Finish" : "Send"}
          </Button>
        </div>
      </footer>
    </main>
  );
}
