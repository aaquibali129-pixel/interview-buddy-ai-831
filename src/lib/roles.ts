export type RoleId = "sde-intern" | "data-analyst" | "frontend-developer";

export type RolePreset = {
  id: RoleId;
  name: string;
  tagline: string;
  description: string;
  focus: string[];
  focusAreas: string;
  seedQuestion: string;
};

export const ROLE_PRESETS: RolePreset[] = [
  {
    id: "sde-intern",
    name: "SDE Intern",
    tagline: "Software Engineering Internship",
    description:
      "An entry-level software engineering internship focused on core computer science fundamentals, problem solving, and learning agility.",
    focus: ["Data structures", "Problem solving", "OOP basics", "Projects", "Teamwork"],
    focusAreas:
      "Data structures & algorithms fundamentals, basic problem-solving/coding logic (explained verbally, not live-coded), understanding of time/space complexity, a past project or coursework experience, and one behavioral question about learning from failure or working in a team.",
    seedQuestion:
      "Let's begin. Walk me through a project you have built that you are proud of, and explain the technical decisions you made.",
  },
  {
    id: "data-analyst",
    name: "Data Analyst",
    tagline: "Analytics & Insights",
    description:
      "A data analyst role focused on SQL, statistics, data cleaning, visualisation, and translating numbers into business decisions.",
    focus: ["SQL", "Statistics", "Excel / Python", "Dashboards", "Business sense"],
    focusAreas:
      "SQL/data querying fundamentals, statistics or data interpretation reasoning, a past project involving turning data into insights, tool familiarity (Excel/BI tools/Python), and one scenario question about handling messy or ambiguous data / stakeholder requests.",
    seedQuestion:
      "Let's begin. Describe a dataset you have analysed end to end — how did you clean it and what insight did you deliver?",
  },
  {
    id: "frontend-developer",
    name: "Frontend Developer",
    tagline: "Web UI Engineering",
    description:
      "A frontend developer role focused on JavaScript, React, browser fundamentals, accessibility, and performance.",
    focus: ["JavaScript", "React", "CSS layout", "Performance", "Accessibility"],
    focusAreas:
      "Core HTML/CSS/JS fundamentals, a framework question (React or equivalent), a past project showcasing UI/UX decision-making, performance/accessibility awareness, and one scenario question about handling design-vs-technical-constraint tradeoffs.",
    seedQuestion:
      "Let's begin. Tell me about a user interface you built recently and the hardest frontend problem you had to solve on it.",
  },
];

export function getRole(id: string): RolePreset | undefined {
  return ROLE_PRESETS.find((r) => r.id === id);
}

export const QUESTION_COUNT = 5;
export const SECONDS_PER_QUESTION = 120;
