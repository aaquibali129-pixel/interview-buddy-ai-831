import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, Lightbulb, ThumbsUp, TriangleAlert, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getRole } from "@/lib/roles";
import { loadSession, type StoredSession } from "@/lib/interview-session";

export const Route = createFileRoute("/report/$roleId")({
  loader: ({ params }) => {
    const role = getRole(params.roleId);
    if (!role) throw notFound();
    return { role };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.role.name ?? "Interview";
    return {
      meta: [
        { title: `${name} Interview Report Card — InterviewPilot` },
        {
          name: "description",
          content: `Your ${name} mock interview report: score per answer, two strengths, two weaknesses and a model answer.`,
        },
        { property: "og:title", content: `${name} Interview Report Card — InterviewPilot` },
        {
          property: "og:description",
          content: `Scored feedback from an AI mock interview for the ${name} role.`,
        },
      ],
    };
  },
  component: ReportScreen,
});

function scoreTone(score: number) {
  if (score >= 8) return "text-gold";
  if (score >= 5) return "text-navy-soft";
  return "text-destructive";
}

function cleanQuestion(q: string) {
  return q.replace(/^\s*(?:Q(?:uestion)?\s*\d+\s*[:.)-]\s*)/i, "").trim();
}

function ReportScreen() {
  const { role } = Route.useLoaderData();
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  if (session === undefined) {
    return <main className="min-h-screen bg-background" />;
  }

  if (!session || session.roleId !== role.id) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-sm">
          <h1 className="font-display text-xl font-semibold text-foreground">No report yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Finish a {role.name} mock interview to generate your report card.
          </p>
          <Button asChild className="mt-6">
            <Link to="/interview/$roleId" params={{ roleId: role.id }}>
              Start the interview
            </Link>
          </Button>
        </div>
      </main>
    );
  }

  const { report, pairs } = session;

  return (
    <main className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-navy px-6 py-12 text-primary-foreground">
        <div className="mx-auto flex max-w-3xl flex-wrap items-end justify-between gap-6">
          <div>
            <Link to="/" className="text-xs uppercase tracking-widest opacity-70 hover:opacity-100">
              InterviewPilot
            </Link>
            <h1 className="mt-2 font-display text-3xl font-bold">Report card</h1>
            <p className="mt-1 text-sm opacity-80">{role.name} mock interview</p>
          </div>
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center">
            <p className="text-xs uppercase tracking-widest opacity-70">Overall</p>
            <p className="font-display text-4xl font-bold tabular-nums">
              {report.overall.toFixed(1)}
              <span className="text-lg opacity-60">/10</span>
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">Per-question scores</h2>
          <ol className="mt-4 space-y-4">
            {report.scores.map((s, i) => (
              <li key={i} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-foreground">
                    <span className="mr-2 text-xs uppercase tracking-widest text-muted-foreground">
                      Q{i + 1}
                    </span>
                    {cleanQuestion(s.question)}
                  </p>
                  <span
                    className={`shrink-0 font-display text-2xl font-bold tabular-nums ${scoreTone(s.score)}`}
                  >
                    {s.score}
                    <span className="text-sm text-muted-foreground">/10</span>
                  </span>
                </div>
                {pairs[i] && (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-secondary p-3 text-sm text-secondary-foreground">
                    {pairs[i].answer}
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.comment}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <ThumbsUp className="h-4 w-4 text-navy" aria-hidden /> Strengths
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <TriangleAlert className="h-4 w-4 text-navy" aria-hidden /> Areas to improve
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {report.weaknesses.map((w, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-soft" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-navy-soft/40 bg-secondary p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
            <Lightbulb className="h-4 w-4 text-navy" aria-hidden /> Model answer for your weakest
            response
          </h2>
          <p className="mt-3 text-sm font-medium text-foreground">
            Q{report.modelAnswer.questionIndex + 1}: {cleanQuestion(report.modelAnswer.question)}
          </p>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {report.modelAnswer.answer}
          </p>
        </section>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="gap-2">
            <Link to="/interview/$roleId" params={{ roleId: role.id }}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Retry this interview
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Pick another role</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
