---
applyTo: "**"
description: Prefer MCP tools and servers first for repo work, except Plane which must be accessed through the REST API via curl.
---

# MCP-First Workflow (Plane via REST)

Use MCP tools and servers by default when starting or continuing work in this repository.

## Required behavior

- Check for an MCP-backed way to do the task before using generic shell commands or ad hoc approaches.
- Prefer MCPs for project tracking, reasoning, documentation lookup, memory, web retrieval, and structured repository operations.
- Do not use Plane MCP tools. Use Plane REST API via curl with `X-API-Key` header for all ticket, project, and progress updates.
- Use this endpoint pattern for Plane project context and ticket lookup: `https://plane.server.lan/api/v1/workspaces/projects/projects/`.
- For ticket workflows, explicitly perform REST-based state transitions (`In Progress`, `Done`), issue field updates, and blocker linking (`blocked_by` / `blocking`) using issue UUIDs.
- Use sequential thinking for non-trivial debugging, design, or multi-step implementation decisions.
- Use Context7 or other MCP documentation tools before guessing library APIs or current framework behavior.
- Use memory MCP tools to read relevant prior context and to store durable repo facts when they will help future work.

## Fallback rule

- Fall back to non-MCP tools only when no MCP tool can do the job, MCP access is failing, or the MCP result is insufficient.
- When falling back, briefly state why the MCP path was not used.
- Plane is not a fallback exception: Plane operations must stay on REST API and must not use Plane MCP.

## Scope

This is a hard rule for work in this repository unless the user explicitly asks for a different approach.