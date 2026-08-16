import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, BarChart3, Layout, Timer, ClipboardCheck, Bot } from "lucide-react";

import { ROLE_PRESETS, QUESTION_COUNT, type RoleId } from "@/lib/roles";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InterviewPilot — Pick a Role, Start a Mock Interview" },
      {
        name: "description",
        content:
          "Choose SDE Intern, Data Analyst or Frontend Developer and run a timed 5-question AI mock interview with a scored report card.",
      },
      { property: "og:title", content: "InterviewPilot — AI Mock Interviews" },
      {
        property: "og:description",
        content:
          "Timed 5-question AI mock interviews for SDE Intern, Data Analyst and Frontend Developer roles.",
      },
    ],
  }),
  component: RolePicker,
});

const ICONS: Record<RoleId, typeof Code2> = {
  "sde-intern": Code2,
  "data-analyst": BarChart3,
  "frontend-developer": Layout,
};

function RolePicker() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-navy px-6 py-20 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-widest">
            <Bot className="h-3.5 w-3.5" aria-hidden />
            InterviewPilot
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl">
            Practice the interview
            <br />
            before it counts.
          </h1>
          <p className="mt-4 max-w-xl text-base opacity-80">
            Pick a role and face {QUESTION_COUNT} timed questions from an AI interviewer. Finish
            with a report card: score per answer, strengths, weaknesses and a model answer.
          </p>
          <div className="mt-8 flex flex-wrap gap-6 text-sm opacity-80">
            <span className="inline-flex items-center gap-2">
              <Timer className="h-4 w-4" aria-hidden /> Timer on every question
            </span>
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" aria-hidden /> Scored report card
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-display text-xl font-semibold text-foreground">Choose your role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Questions, difficulty and scoring adapt to the role you pick.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {ROLE_PRESETS.map((role) => {
            const Icon = ICONS[role.id];
            return (
              <Link
                key={role.id}
                to="/interview/$roleId"
                params={{ roleId: role.id }}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-navy-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-foreground">
                  {role.name}
                </h3>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {role.tagline}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {role.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {role.focus.map((f) => (
                    <li
                      key={f}
                      className="rounded-full bg-secondary px-2.5 py-1 text-xs text-secondary-foreground"
                    >
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-navy">
                  Start interview
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
