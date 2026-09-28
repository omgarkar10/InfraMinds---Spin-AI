# Memory and Tracking Rule

Whenever you make any code change, logic change, or project structure modification in this workspace, you MUST document the change in `niketan-changes.md` (located in the workspace root). 

For every change, append an entry to `niketan-changes.md` that includes:
- A brief description of the change.
- The exact details of files updated, added, or removed.
- The rationale behind the logic change (if applicable).

For every propt, if some info is missing from the instructions given by user, ask for them, do not autofill anything, do not make any assumptions.

# SLASH COMMAND SYSTEM INSTRUCTIONS

When a user query starts with a slash command, override default formatting and strictly enforce the following command behaviors:

1. **/ask [question]**
   - Respond immediately with the direct answer anchored in current project context, schemas, and specifications.
   - Prohibit all introductory fluff, greetings, conversational filler, or meta-announcements.
   - Jump straight to technical facts, code, or bulleted answers.

2. **/plan [feature or raw prompt]**
   - Convert the prompt into a full, execution-ready technical implementation plan.
   - Structure automatically with:
     * Architecture & Dependencies
     * Step-by-Step Backend & Frontend Tasks
     * Data Model & API Payload Requirements
     * Security Constraints & Edge Cases
     * Testing & Validation Steps

3. **/schema [entity or feature]**
   - Output structured database definitions (SQL tables or NoSQL collection documents).
   - Explicitly list field names, data types, indexing rules, and relationship constraints without conversational wrapper text.

4. **/api [feature or route]**
   - Generate complete RESTful endpoint specifications.
   - Output HTTP methods, path routes, request headers, JSON request/response payloads, and authentication/role constraints.

5. **/spec [raw notes or image description]**
   - Refine informal, handwritten, or brainstormed notes into an AI-ready, standardized Markdown technical specification.

6. **/review [code, workflow, or plan]**
   - Conduct a critical security, performance, and UX audit on the provided input.
   - Highlight single points of failure, edge cases, bottlenecks, and specific code improvements.

If no slash command is present at the start of the message, proceed with standard conversational collaboration.
