# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PRBench is a Next.js 16 application using React 19, TypeScript, and shadcn/ui components with Tailwind CSS v4. The project uses Turbopack for development and follows the App Router architecture.

**Purpose**: Display PRBench Phase 1 evaluation results from GitHub repository (StephenQSstarThomas/PRBench-Eval).

**Key Features**:
- Fetch and display eval_report.json files from GitHub
- Show paper information, scores, and detailed justifications
- Support for two categories: code_only and full_codex
- Responsive design with dark/light mode support

## Package Manager

**CRITICAL: Always use `bun` as the package manager for this project.**

Do not use `npm`, `yarn`, or `pnpm`. All commands should use `bun`.

## Development Commands

```bash
# Development server with Turbopack
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Linting
bun run lint

# Type checking
bun run typecheck

# Format code
bun run format

# Install dependencies
bun install

# Add a package
bun add <package-name>

# Add a dev dependency
bun add -d <package-name>
```

## Frontend Requirements

**All frontend code must meet these requirements:**

1. **Tailwind CSS** - Use Tailwind utility classes for all styling
2. **Tailwind CSS Motion** - Use motion utilities for animations and transitions
3. **shadcn/ui** - Use shadcn/ui components for all UI elements
4. **Light/Dark Mode** - All components must support both themes seamlessly
5. **Responsive Design** - All layouts must be mobile-first and responsive across all breakpoints

## UI Component System

**CRITICAL: Always use shadcn/ui components via the CLI**

This project uses shadcn/ui (Radix Nova style) as the primary component library. When adding new UI components:

```bash
# Install components using shadcn CLI
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add button
npx shadcn@latest add dialog
npx shadcn@latest add card
```

**Component configuration:**
- Style: `radix-nova`
- Base color: `neutral`
- Icon library: `lucide-react`
- Components are placed in `components/ui/`
- Import path: `@/components/ui/<component-name>`

**Do not:**
- Manually create UI components that shadcn/ui provides
- Install UI libraries like Material-UI, Ant Design, or Chakra UI
- Write custom implementations of common components (buttons, dialogs, cards, etc.)
- Use inline styles or CSS modules
- Create animations without using Tailwind CSS Motion utilities

## Architecture

### Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:

- `@/*` - Root directory
- `@/components` - Components directory
- `@/components/ui` - shadcn/ui components
- `@/lib` - Utility functions
- `@/hooks` - Custom React hooks
- `@/app` - Next.js App Router pages

### Key Files

- `app/layout.tsx` - Root layout with theme provider and font configuration (Geist & Geist Mono)
- `app/globals.css` - Global styles and Tailwind CSS configuration
- `app/api/results/route.ts` - API endpoint for fetching GitHub data
- `app/results/page.tsx` - Results listing page with tabs and filters
- `app/results/[category]/[task]/page.tsx` - Task detail page
- `components/theme-provider.tsx` - Theme management with keyboard shortcut (press `d` to toggle dark/light mode)
- `components/task-card.tsx` - Task card component for results grid
- `components/score-breakdown.tsx` - Detailed score breakdown with accordion
- `components/markdown-renderer.tsx` - Markdown renderer for justifications
- `lib/github-api.ts` - GitHub API service layer (Octokit)
- `lib/types.ts` - TypeScript type definitions for eval reports
- `lib/utils.ts` - Utility functions including `cn()` for className merging
- `components.json` - shadcn/ui configuration

### Styling

- Uses Tailwind CSS v4 with PostCSS
- CSS variables for theming (defined in `app/globals.css`)
- `cn()` utility from `lib/utils.ts` for conditional className merging
- Dark mode support via `next-themes` with system preference detection

### Theme System

The app includes a built-in theme toggle:
- Press `d` key to toggle between light/dark modes
- Theme persists across sessions
- Respects system preferences by default
- Theme provider wraps the entire app in `app/layout.tsx`

## Code Style

- TypeScript strict mode enabled
- ESLint with Next.js recommended rules
- Prettier for code formatting with Tailwind CSS plugin
- Use `"use client"` directive only when necessary (client components)
- Prefer Server Components by default (Next.js App Router)
- **Do not create unnecessary documentation files** (README.md, QUICKSTART.md, SUMMARY.md, etc.) unless explicitly requested

## Testing and Validation

**IMPORTANT: Never start the development server (`bun run dev`) during development.**

Instead, use these commands to validate code:

```bash
# Type checking
bun run typecheck

# Linting
bun run lint

# Production build test
bun run build
```

Only recommend running the dev server manually to the user for testing.

## Project Structure

```
app/
├── api/
│   └── results/         # GitHub API endpoint
├── results/             # Results pages
│   ├── page.tsx        # Results listing with tabs
│   └── [category]/[task]/
│       └── page.tsx    # Task detail page
├── layout.tsx          # Root layout
├── page.tsx            # Home page
└── globals.css         # Global styles

components/
├── ui/                 # shadcn/ui components (auto-generated)
│   ├── button.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── progress.tsx
│   ├── accordion.tsx
│   ├── tabs.tsx
│   └── skeleton.tsx
├── theme-provider.tsx  # Theme management
├── task-card.tsx       # Task card component
├── score-breakdown.tsx # Score breakdown component
└── markdown-renderer.tsx # Markdown renderer

lib/
├── github-api.ts       # GitHub API service
├── types.ts            # TypeScript types
└── utils.ts            # Utility functions

hooks/                  # Custom React hooks (empty for now)
public/                 # Static assets
```

## GitHub API Integration

The app fetches data from `StephenQSstarThomas/PRBench-Eval` repository:
- Path: `results/code_only/*/eval_report.json`
- Path: `results/full_codex/*/eval_report.json`

**Important**:
- Uses Octokit SDK with GitHub Personal Access Token
- Rate limit: 5000 requests/hour (authenticated)
- Dynamic rendering to avoid build-time API calls
- Error handling for network failures
