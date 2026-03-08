import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Clock, FileCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScoreBreakdown } from "@/components/score-breakdown"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { FileTree } from "@/components/file-tree"
import { fetchSingleEvalReport } from "@/lib/github-api"
import { getCachedResults } from "@/lib/cache"
import type { EvalReport } from "@/lib/types"

// Revalidate every hour
export const revalidate = 3600

async function fetchSingleReport(
  category: "code_only" | "full_codex",
  task: string
): Promise<EvalReport | null> {
  try {
    // Try to get from cache first
    const cached = await getCachedResults()
    if (cached) {
      const reports = category === "code_only" ? cached.code_only : cached.full_codex
      const report = reports.find((r) => r.task_id === task)
      if (report) {
        return report
      }
    }

    // Cache miss - fetch from GitHub
    return await fetchSingleEvalReport(category, task)
  } catch (error) {
    console.error("Error fetching single report:", error)
    return null
  }
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  const remainingSeconds = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ category: string; task: string }>
}) {
  const { category, task } = await params

  // Validate category
  if (category !== "code_only" && category !== "full_codex") {
    notFound()
  }

  // Fetch only the single report we need
  const report = await fetchSingleReport(category, task)

  if (!report) {
    notFound()
  }

  const { paper, grading, time_used_seconds, workspace_files, poll_count } = report

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link href="/results">
        <Button variant="ghost" className="mb-6 cursor-pointer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-8 lg:col-span-2">
          {/* Paper Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl">{paper.title}</CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {paper.author} • {paper.year}
                  </CardDescription>
                </div>
                <Badge className="text-base">
                  {category === "code_only" ? "Code Only" : "Full Codex"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">DOI:</span>
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-primary hover:underline"
                  >
                    {paper.doi}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Time: {formatTime(time_used_seconds)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  <span>{workspace_files.length} files</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Scores</CardTitle>
              <CardDescription>
                Detailed breakdown of evaluation metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreBreakdown
                scores={grading.scores}
                overallScore={grading.overall_score}
              />
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <MarkdownRenderer content={grading.summary} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-muted-foreground">Task ID</div>
                <div className="font-mono">{report.task_id}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Category</div>
                <div className="capitalize">{category.replace("_", " ")}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Poll Count</div>
                <div>{poll_count}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Paper File</div>
                <div className="font-mono text-xs">{paper.paper_file}</div>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Workspace Files</CardTitle>
              <CardDescription>{workspace_files.length} files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <FileTree files={workspace_files} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
