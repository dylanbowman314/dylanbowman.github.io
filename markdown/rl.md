---
title: Building an RL Environment to Train Agents for Production Debugging
date: 2026-01-02
author: Dylan Bowman
---

_At [hud](https://www.hud.ai/), we built an RL environment for ops diagnostics – one that lets agents investigate across Sentry, Supabase, Railway, and Kubernetes. We trained a model on 24 real production tasks and saw a 2x improvement. Now we're releasing the environment publicly._

---

## Context
As engineers at a fast-growing startup, a solid 10-20% of our time is taken up by debugging bugs in production. The way bugs are solved in production is pretty mechanistic:
1. See error on Sentry
2. Check Supabase, Railway and Kubernetes Dashboard
3. Find errors that match with the time of the bug
4. Cross reference github and docs in order to make a patch to the relevant repository

After doing this a few dozen times, we pondered why we couldn't just have an agent do it, or at the very least assist. The reason is simply that it doesn't have access to the environment, and without the correct prompt or RFT the agent won't be able to intuitively fix bugs the way we can.

This resulted in us getting rabbit-holed and creating an agent trained on our production data that can debug Sentry errors.
The naive implementation of giving an LLM access to 104 tools didn't work, so we created an architecture that involved multiple environments accessible via subagents.

<img src="images/architecture.png" alt="fig. 1: agent architecture (click to zoom)" style="max-width: 100%">


## The Architecture: Hierarchical Agents
The insight is simple: don't give one agent all the tools. Instead, create an orchestrator environment where the agent's tools are subagents—a Sentry agent, a Supabase agent, a Kubernetes agent. The orchestrator sees just six tools, one per subagent. Behind those six tools are 104 individual MCP tools across all subagents.

Here's the key insight: each subagent is itself an RL environment. The Sentry subagent has its own scenarios, its own tools, its own reward signal. You can train it independently on Sentry-specific tasks. Same for Supabase, same for Kubernetes. Once each subagent is trained, you compose them into the orchestrator environment.

Train the subagents first. Then train the orchestrator.

## The RL Environment
We're releasing this architecture as a public HUD environment called [cross-service-diagnostics](https://www.hud.ai/environments/a959e403-6e07-4969-afa6-5db637aefc75) ([GitHub](https://github.com/hud-evals/hud-ops-diagnostics)). Plug in your production API keys—your Sentry token, your Supabase credentials, whatever services you use—and you have an ops diagnostics agent for your stack. Fork it, modify it, train on it.

But an environment alone isn't enough to train an agent: we need to generate tasks. We started with the Sentry subagent.


## Training the Sentry Subagent: 24 Real Tasks
To train the Sentry subagent, we sourced 24 tasks from our actual Sentry instance—real issues from our production systems across different services, error types, and severity levels. Schema validation failures, rate limiting, auth token expiration, WebSocket disconnects, billing edge cases. The diversity matters for generalization.

<img src="images/sample_rl_tasks.png" alt="fig. 2: 4 sample tasks (click to zoom)" style="max-width: 100%">

Each task has a verification criterion – specific facts the agent must surface (like an issue ID, a team UUID, or a specific error message) and facts it must not confuse with similar issues. Binary verification: did the agent find the exact right needle in a very large haystack?
The answers come from real production data. Task #0010 expects the agent to find that the user was passing toolu_01XArLykPgwrg24DR3WQJ3Mu – a Claude tool call ID – instead of a trace UUID. Task #0016 expects it to find the function print_hello.


## Training the Sentry Subagent
With 24 verifiable tasks and an environment, we can run reinforcement learning. Even a small dataset, if diverse enough, can meaningfully optimize a subagent – though a single environment can scale to 500 tasks or more. On HUD, you go to Models, fork a base model (we used o4-mini), then click Train. Point it at your taskset and environment. The platform handles the rest—running rollouts, collecting trajectories, and sending them to the RL backend for training (see the training docs).

HUD supports two training backends: OpenAI RFT (o4-mini) and Tinker (Qwen3 235B, Deepseek V3.1, Kimi K2, and more). Each training run creates a versioned checkpoint on your model, so you can track results and compare across runs.


## Results
We trained using OpenAI RFT with o4-mini. Training took around 13 hours and ran through 3,000+ traces.
At 15 steps max per scenario, the trained model sentry-o4-mini performs 2x better than base o4-mini (13% vs 6.3%) on our harder Sentry tasks, and beats Gemini 3 Pro and both Claude models—in fewer steps.

<img src="images/taskset_view.png" alt="fig 3. Taskset view on hud.ai for our internal benchmark (click to zoom)" style="max-width: 100%">

This pattern—training on domain-specific tasks to create fast, specialized tools—has improved performance across our other projects too: deep research agents, coding assistants, bug investigation. More case studies coming soon.

## Designing RL Environments That Generalize
This environment teaches us principles that apply beyond ops diagnostics – to any RL environment for tool-using agents:
Pick a domain with verifiable outcomes. Some examples:
1. Finance works because spreadsheet cells are either correct or not.
    - Support works because tickets get resolved or they don't.
    - Debugging works because you can check if the agent found the right issue.
2. Build from real problems. Go through your actual production failures, customer tickets, or historical tasks. Your real production has quirks – weird error messages, confusing duplicate issues, that cron job someone named print_hello. Train on that.
3. Make verification automatic. If a human has to judge every response, you can't scale. Design tasks where correctness is checkable – specific facts, specific outputs, specific states. LLM-as-judge works for fuzzier domains, but binary verification is cleaner when you can get it.
4. Hierarchical beats flat. Give the agent 6 subagents instead of 104 tools. Each subagent is itself an RL environment you can train independently. Train the subagents on domain-specific tasks, then compose them.
5. Use RL, not just evals. Run rollouts, collect successful trajectories, fine-tune, repeat. The environment becomes a flywheel for improvement.


## Try It Yourself
We're releasing this RL environment publicly. You can explore the scenarios, connect your own MCP servers, and run diagnostics against your own production stack.

- [cross-service-diagnostics environment](https://hud.ai/environments/a959e403-6e07-4969-afa6-5db637aefc75) – scenarios, tools, and ways to integrate
- [SDK cookbook](https://docs.hud.ai/cookbooks/ops-diagnostics) – implementation details and code examples
- [Environment guide](https://docs.hud.ai/platform/environments) – how to build your own RL environments

Every trace on the platform captures the full trajectory – actions, observations, tool calls, and reasoning. You can replay exactly how the agent investigated each issue.


## Work with Us
If you're building agents for production workloads, we can help. HUD provides the infrastructure for reproducible evals, trajectory collection, and model training. We've done this for enterprise spreadsheet work (SheetBench), computer-use agents (OSWorld), and RL environments for DevOps, coding, security, finance, legal document review, medical software, hardware verification, and more.
Reach out to founders@hud.ai or book a call.
