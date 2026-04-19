# The Unknown Collective

An experiment in AI-assisted world-building — building a fictional universe collaboratively with language models, and building the workbench to do it.

**[→ View the live site](https://leadelazer.github.io/unknown-collective/)**

---

## The Question

Can a set of AI agents — given a structural framework, a tone reference, and enough relational context — generate a coherent fictional world? Not just plausible prose, but something with internal consistency: characters who feel like they know each other, a city that behaves like a city, relationships that hold under scrutiny from multiple angles.

This project is an attempt to find out.

---

## What It Is

The Unknown Collective is a fictional universe with a fixed cast of characters. Each figure has a biography, a place in the city's hierarchy, relationships with others, and a symbolic dimension — a role they play in the world's underlying logic. The world is literary rather than fantastical: an unnamed Central European city, centuries of overlap, quiet evidence of things that happened.

The content is generated, curated, and revised through a pipeline of agents working against a structured source. Some of what they produce is kept as-is. Some is revised by hand. Some is fed back to another agent for coherence evaluation. The site is the output of that ongoing process.

---

## The Workbench

Alongside the site, this repo contains a local studio — a writing environment built specifically for this project. It lets me dispatch agent tasks (write a biography, patch a field, evaluate tone consistency across the full roster), review drafts before committing them, and log every agent contribution to a running chronicle.

The studio exists because off-the-shelf tools weren't the right fit. World-building has different requirements from code generation or document summarization: the output needs to be consistent *across* documents over time, not just internally coherent within a single response. That required something purpose-built.

---

## What I've Been Learning

**Coherence is a relational problem.** An agent writing a single character biography can produce something convincing in isolation. The harder question is whether it holds when placed next to fifteen other biographies written by different models at different times. The answer depends almost entirely on how much relational context you give the agent before it writes — and how precisely you define the tone you're trying to maintain.

**Style anchors work better than style descriptions.** Early prompts described the desired prose style in abstract terms. Later ones included concrete examples from the corpus itself. The difference in output quality was significant. This has implications for how to think about prompt engineering for sustained creative work.

**Schema and narrative are in tension, productively.** The content database uses a structured format — frontmatter for metadata, plain paragraphs for prose — that's strict enough to drive the frontend and loose enough not to constrain the writing. Finding that balance was its own design problem, and the schema evolved through the project as the tension surfaced.

**The workbench is part of the work.** Building the studio was not a precondition for the creative work — it happened alongside it, in response to specific problems. The shape of the tool reflects what the project needed, not what seemed useful in advance.

---

## Origins and Tools

The character portraits were generated in 2020 using early Midjourney models — before the project had a name or a structure. Those images were the original creative spark: something about the faces produced by that specific moment in image generation demanded a world around them. The project is in some ways an attempt to catch up to that first impression.

The current workflow lives almost entirely in VS Code, using GitHub Copilot agents that oscillate between GPT and Claude models depending on the task. The site design itself was produced as a concept test with Claude's design tool — one session right after it launched and the design did not change much since then... For ongoing concept work and for improving the texture and detail of the original portraits, ChatGPT remains a constant tool alongside everything else.

The project spans five years of AI tooling, which is long enough to have watched the capabilities shift underneath the same creative problem several times.

---

## Stack

- **Frontend:** React 18, Vite, CSS Modules, GitHub Pages
- **Content database:** Markdown + YAML frontmatter, custom sync pipeline
- **Studio:** Node.js, Express, React
- **Models:** OpenAI (GPT-4.1, GPT-4o-mini), Anthropic (Claude Haiku) for writing, flagship models for coding
- **Images:** Midjourney (2020), ChatGPT image generation (texture refinement)
- **Environment:** VS Code + GitHub Copilot agents

---

*The Unknown Collective — what the city keeps.*
