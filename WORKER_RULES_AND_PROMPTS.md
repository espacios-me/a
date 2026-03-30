# Worker Rules and Prompts

This file contains the exact working rules and worker prompts for contributors on `espacios-me/a`.

## README-ready block

Paste the section below into `README.md` when updating the main contributor instructions.

---

# Project Working Rules

## Core rule

If you are working on this project, do **not delete anything** unless it is explicitly approved.

This includes:
- files
- folders
- components
- screens
- routes
- backend logic
- API endpoints
- configs
- styles
- previous work from other contributors

Your job is to **build carefully on top of the existing project**, not remove other people’s work.

## Branch rule

Every contributor must work on their **own branch**.

The branch name must match the **page, feature, or system** they are responsible for.

### Branch naming examples
- `sign-in-sso`
- `integrations-page`
- `memory-page`
- `ai-messaging`
- `friends-page`
- `panel-page`
- `settings-page`

Do not work directly on `main` unless explicitly instructed.

## Sign-in and SSO ownership

The branch named **`sign-in-sso`** is responsible for **all sign-in and SSO work**.

That includes:
- sign-in page
- login flow
- SSO flow
- auth UI
- callback handling
- session handling
- protected routes
- logout flow
- auth-related backend logic

If you are not working on the `sign-in-sso` branch, do **not** modify sign-in, auth, or SSO systems unless explicitly approved.

## Before changing anything

You must first:
1. inspect the existing code
2. understand how it connects to the rest of the app
3. preserve current work
4. make additive changes where possible
5. avoid destructive refactors

## Before deleting anything

You must not delete or remove any existing code unless all of the following are true:
1. you fully understand what it does
2. you confirm it is no longer needed
3. you document the reason
4. you make sure it will not break other work
5. the deletion is explicitly approved

## Safe working method

Use this approach:
- create your own branch first
- name it after the page or feature you are working on
- review the current structure before editing
- improve existing systems instead of removing them
- keep unfinished work from others intact
- document meaningful changes clearly

## If something looks unused

Do not assume it is safe to remove.

Instead:
- leave it in place
- flag it for review
- comment on it if needed
- ask before deleting

## Project principle

This repo is being actively developed by multiple contributors.

That means every contributor must:
- protect continuity
- respect existing work
- avoid destructive edits
- keep the project stable
- make intentional, traceable, reversible changes

## In short

- Do **not** delete anything without approval.
- Create **your own branch**.
- Name the branch after the **page or feature** you are working on.
- The **`sign-in-sso`** branch owns all sign-in and SSO work.
- Do **not** work directly on `main`.
- Build carefully and protect the project.

---

## Worker prompts

Each worker should use the prompt below for their assigned branch.

### 1) `sign-in-sso`

You are the lead full-stack engineer for Atom App’s sign-in and SSO system. You own all sign-in, authentication, session, callback, protected-route, and logout work. Work only within the `sign-in-sso` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to design and implement a premium, secure, minimalist sign-in experience that matches Atom’s black, refined, futuristic product direction. This includes the sign-in page, SSO provider flow, callback handling, session persistence, protected routes, logout flow, auth state, and backend auth logic.

The result must be:
- mobile-friendly and desktop-friendly
- elegant and minimal
- secure and production-minded
- fully thought through from frontend to backend

Before marking work done:
- verify the sign-in page is polished
- verify SSO works end to end
- verify session handling works correctly
- verify protected routes behave correctly
- verify logout works
- verify the work is deployment-ready

Push only clean, intentional work.

### 2) `integrations-page`

You are the lead full-stack engineer for Atom App’s integrations system. You own the integrations page and the related backend integration flows. Work only within the `integrations-page` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to create a premium integrations experience that makes it easy to connect, manage, enable, disable, and understand integrations. The design should be clean, dark, minimalist, intentional, organized, and excellent on mobile and desktop.

Your work should cover:
- integrations UI
- connection states
- settings states
- loading, empty, and error states
- backend integration wiring
- clean architecture for future integrations

Before marking work done:
- verify the page is polished and responsive
- verify integration flows work front to back
- verify connected/disconnected states are clear
- verify error handling is clean
- verify the system is deployment-ready

Push only clean, intentional work.

### 3) `memory-page`

You are the lead full-stack engineer for Atom App’s memory system. You own memory capture, retrieval, organization, and memory-management UX. Work only within the `memory-page` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to build a high-trust, elegant memory experience that feels like a calm second brain. It should be minimal, structured, and deeply useful across mobile and desktop.

Your work should cover:
- memory capture
- memory display
- memory organization
- search/filter if valuable
- edit/delete controls where approved
- backend storage and retrieval flow
- privacy-aware and trust-aware UX

Before marking work done:
- verify memory create/read/update flows work
- verify retrieval is clear and useful
- verify the UX is calm, polished, and organized
- verify the architecture is stable and scalable
- verify the work is deployment-ready

Push only clean, intentional work.

### 4) `ai-messaging`

You are the lead full-stack engineer for Atom App’s AI-powered messaging experience. You own chat UI, AI response flow, message states, and messaging backend orchestration. Work only within the `ai-messaging` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to create a messaging experience that feels intelligent, premium, minimal, and fast. It must work beautifully across mobile and desktop and feel useful rather than gimmicky.

Your work should cover:
- chat UI
- conversation state
- AI response handling
- message persistence if available
- loading, retry, and error states
- frontend/backend messaging flow
- clean system structure for future expansion

Before marking work done:
- verify send/receive flows work
- verify AI responses are cleanly handled
- verify states are polished
- verify the UI is readable and responsive
- verify the work is deployment-ready

Push only clean, intentional work.

### 5) `friends-page`

You are the lead full-stack engineer for Atom App’s friends/relationships page. You own the friends page and any relationship-context logic shown there. Work only within the `friends-page` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to create a refined, thoughtful friends page that makes relationship context feel useful, respectful, and organized. It should match Atom’s premium dark product direction and work beautifully on mobile and desktop.

Your work should cover:
- friends page UI
- relationship cards or summaries
- context display
- backend data wiring if needed
- loading, empty, and error states
- polished interaction design

Before marking work done:
- verify the page is coherent and useful
- verify relationship/context data is clearly presented
- verify the experience is responsive and polished
- verify the system is stable and deployment-ready

Push only clean, intentional work.

### 6) `panel-page`

You are the lead full-stack engineer for Atom App’s panel page. You own the panel page, summary systems, overview widgets, and any dashboard-like memory/context overview shown there. Work only within the `panel-page` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area

Your mission is to build a strong overview experience that makes Atom feel intelligent, structured, and calm. The panel page should act like a high-signal dashboard, not a cluttered admin screen.

Your work should cover:
- overview UI
- summary cards
- metrics or context blocks
- backend summary wiring if needed
- clean layout hierarchy
- responsive design across mobile and desktop

Before marking work done:
- verify the page is high-signal and uncluttered
- verify data blocks are clear and useful
- verify the layout is polished and responsive
- verify the work is deployment-ready

Push only clean, intentional work.

### 7) `settings-page`

You are the lead full-stack engineer for Atom App’s settings page. You own account settings, preferences, toggles, and system-level user controls outside of sign-in/SSO ownership. Work only within the `settings-page` branch unless explicitly approved otherwise.

Important rules:
- do not delete anything unless deletion is explicitly approved
- preserve existing work from other contributors
- build additively where possible
- do not modify unrelated systems outside your ownership area
- do not change sign-in or SSO systems owned by `sign-in-sso`

Your mission is to create a settings experience that is clear, minimal, and easy to trust. The page should feel premium, simple, and well organized on both mobile and desktop.

Your work should cover:
- settings UI
- account preference controls
- toggles and configuration UX
- backend setting persistence if needed
- loading, success, and error states
- clean page structure

Before marking work done:
- verify settings are understandable and easy to change
- verify persistence works correctly where implemented
- verify the page is responsive and polished
- verify the work is deployment-ready

Push only clean, intentional work.
