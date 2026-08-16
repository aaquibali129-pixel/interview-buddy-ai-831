# InterviewPilot

InterviewPilot is an AI-powered mock interview app that helps candidates practice for real-world job interviews. Choose a role, answer five timed questions one at a time, and receive a structured feedback report with scores, strengths, weaknesses, and a model answer.

## Live Demo

Try the live app here: [https://interview-buddy-ai-831.lovable.app](https://interview-buddy-ai-831.lovable.app)

## Key Features

- **Role-based mock interviews** — Select from three popular entry-level tech roles.
- **One question at a time** — The AI interviewer asks exactly 5 questions and waits for your answer before moving on.
- **Timed responses** — Each question has a countdown timer to simulate real interview pressure.
- **Conversational chat UI** — Type answers naturally in a clean, professional chat interface.
- **Instant feedback report** — After the final answer, get per-question scores, 2 strengths, 2 weaknesses, and a model answer for your weakest response.
- **Professional design** — Navy and white color palette with clean, modern typography.

## Roles Supported

| Role | Focus Areas |
|------|-------------|
| **SDE Intern** | Data structures, problem solving, OOP basics, projects, teamwork |
| **Data Analyst** | SQL, statistics, Excel/Python, dashboards, business sense |
| **Frontend Developer** | JavaScript, React, CSS layout, performance, accessibility |

## Technology Stack

- **Framework:** [TanStack Start](https://tanstack.com/start)
- **Language:** TypeScript
- **UI Library:** React
- **Styling:** Tailwind CSS
- **AI:** Lovable AI Gateway with `google/gemini-2.5-flash`
- **AI SDK:** Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`)

## How the Application Works

1. **Pick a role** on the home screen from the three role cards.
2. **Start the interview** — the AI welcomes you and asks Question 1.
3. **Answer each question** in the chat. The AI waits for your response before asking the next question.
4. **Watch the timer** — each question has a countdown to keep you on track.
5. **Complete all 5 questions** to automatically generate your report card.
6. **Review your report** — see scores for each answer, your strengths, areas to improve, and a model answer for your weakest response.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Built with

- TanStack Start
- TypeScript
- React
- Tailwind CSS
