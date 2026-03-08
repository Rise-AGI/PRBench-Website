# PRBench Results Viewer

A Next.js application for displaying PRBench Phase 1 evaluation results from the [PRBench-Eval](https://github.com/StephenQSstarThomas/PRBench-Eval) GitHub repository.

## Features

- 📊 Fetch and display evaluation results from GitHub
- 🎨 Modern UI with shadcn/ui components (Radix Nova style)
- 🌓 Dark/Light mode support (press `d` to toggle)
- 📱 Fully responsive design
- ⚡ Built with Next.js 16 and React 19
- 🎭 Smooth animations with Tailwind CSS Motion

## Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Package Manager**: Bun
- **Language**: TypeScript (strict mode)
- **GitHub API**: Octokit SDK

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed
- GitHub Personal Access Token ([create one here](https://github.com/settings/tokens))

### Installation

1. Clone the repository

2. Install dependencies:
```bash
bun install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Add your GitHub token to `.env`:
```env
GITHUB_TOKEN="your_github_token_here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Development

```bash
# Run development server
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Format code
bun run format

# Build for production
bun run build

# Start production server
bun run start
```

Visit [http://localhost:3000](http://localhost:3000) to see the app.

## Project Structure

```
app/
├── api/results/          # API route for fetching GitHub data
├── results/              # Results listing page
│   └── [category]/[task]/ # Task detail page
├── layout.tsx            # Root layout with theme provider
├── page.tsx              # Home page
└── globals.css           # Global styles

components/
├── ui/                   # shadcn/ui components
├── task-card.tsx         # Task card component
├── score-breakdown.tsx   # Score breakdown with accordion
└── markdown-renderer.tsx # Markdown renderer for justifications

lib/
├── github-api.ts         # GitHub API service (Octokit)
├── types.ts              # TypeScript type definitions
└── utils.ts              # Utility functions
```

## Key Features

### Results Display

- **Grid Layout**: View all evaluation results in a responsive grid
- **Category Tabs**: Filter by "Code Only" or "Full Codex"
- **Score Sorting**: Results sorted by overall score
- **Statistics**: View total tasks and average scores per category
- **Robust Data Handling**: Gracefully handles missing or incomplete score data
- **Streaming Display**: Results appear progressively as they load from GitHub API

### Task Details

- **Paper Information**: Title, author, year, DOI with external link
- **Score Breakdown**: Detailed scores with expandable justifications
  - Methodology Understanding
  - Code Correctness
  - Data Accuracy
  - Completeness
- **Metadata**: Execution time, poll count, workspace files
- **Markdown Support**: Justifications rendered with proper formatting
- **Flexible Display**: Adapts to reports with missing score fields

### UI/UX

- **Responsive Design**: Mobile-first, works on all screen sizes
- **Dark Mode**: Press `d` key to toggle (persists across sessions)
- **Loading States**:
  - Skeleton loaders for initial load
  - Real-time progress bar (X/31 reports)
  - Pulse dots animation for ongoing operations
  - Staggered card entrance animations (50ms delay)
- **Hover Effects**: Smooth transitions and animations
- **Error Handling**: Graceful fallback when API fails

## Adding UI Components

This project uses shadcn/ui. To add new components:

```bash
bun x shadcn@latest add <component-name>
```

Examples:
```bash
bun x shadcn@latest add dialog
bun x shadcn@latest add dropdown-menu
bun x shadcn@latest add select
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add KV Storage:
   - Go to Storage tab in your Vercel project
   - Click "Create Database" → "KV"
   - Connect it to your project (environment variables auto-configured)
4. Add environment variable:
   - `GITHUB_TOKEN`: Your GitHub Personal Access Token
5. Deploy

**That's it!** Vercel automatically configures KV storage and handles all URLs.

The application uses:
- **Dynamic rendering** to fetch data at request time
- **Vercel KV (Redis)** for caching results (1 hour TTL)
- **ISR (Incremental Static Regeneration)** with `revalidate: 3600`
- **Stale-while-revalidate** for optimal performance

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub Personal Access Token for API access | Yes |
| `KV_REST_API_URL` | Vercel KV REST API URL (auto-configured on Vercel) | No* |
| `KV_REST_API_TOKEN` | Vercel KV REST API Token (auto-configured on Vercel) | No* |

**Note**:
- No need to set `NEXT_PUBLIC_BASE_URL` - the app automatically uses the correct URL in both development and production.
- *KV variables are automatically provided by Vercel when you add KV storage to your project. No manual configuration needed.

## Architecture

```
User Request
    ↓
Next.js Page (Client Component)
    ↓
Streaming API Route (/api/results/stream)
    ↓
Check Vercel KV Cache (1 hour TTL)
    ↓
Cache Hit? → Stream cached results immediately
    ↓
Cache Miss? → GitHub API Service (Octokit)
    ↓
Batch Fetch eval_report.json files (5 concurrent, with retry)
    ↓
Stream each report as NDJSON + Cache results
    ↓
Client receives and displays progressively
```

**Key Optimizations:**
- **Vercel KV Caching**: Results cached for 1 hour, reducing GitHub API calls from ~31 per request to ~31 per hour
- **Streaming response**: NDJSON format for progressive display (works with both cached and fresh data)
- **Concurrent request limiting**: 5 at a time to avoid connection issues
- **Exponential backoff retry**: 3 attempts per file with increasing delays
- **Smart path filtering**: Excludes workspace subdirectories
- **Graceful data handling**: Optional fields for missing or incomplete data
- **Unique React keys**: Prevents duplicate key warnings across categories
- **Stale-while-revalidate**: Serves stale cache while fetching fresh data in background

## Data Source

The app fetches evaluation reports from:
- Repository: `StephenQSstarThomas/PRBench-Eval`
- Path pattern: `results/{category}/task_{name}/eval_report.json`
- Categories: `code_only` (14 tasks), `full_codex` (17 tasks)

**Important**: Only files at the exact path level `results/{category}/task_{name}/eval_report.json` are fetched. Files in deeper subdirectories (e.g., workspace folders) are excluded.

Each `eval_report.json` contains:
- Paper metadata (title, author, DOI, year)
- Grading scores (methodology, correctness, accuracy, completeness)
- Overall score and summary
- Execution metadata (time, files, poll count)

## Development Guidelines

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines including:
- Package manager usage (always use Bun)
- Frontend requirements (Tailwind CSS, shadcn/ui, responsive design)
- Testing and validation commands
- Code style and conventions

## Troubleshooting

### GitHub API Rate Limit

The app uses Vercel KV caching to minimize GitHub API calls:
- **Without cache**: ~31 API calls per page load
- **With cache**: ~31 API calls per hour (cached for 3600 seconds)
- **Rate limit**: 5000 requests/hour for authenticated users

If you still hit the rate limit:
- The app will show an error message with reset time
- Cache will continue serving stale data
- Wait for the limit to reset or use manual cache invalidation

### Build Errors

Ensure all environment variables are set correctly:
```bash
# Check .env file
cat .env

# Should contain:
GITHUB_TOKEN="your_token_here"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Type Errors

Run type checking to identify issues:
```bash
bun run typecheck
```

## License

MIT License - Copyright (c) 2026 RISE-AGI

See [LICENSE](./LICENSE) for details.


