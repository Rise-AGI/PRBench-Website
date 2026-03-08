import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { EvalReport } from "@/lib/types"

interface TaskCardProps {
  report: EvalReport
  category: "code_only" | "full_codex"
  index?: number
}

function getScoreBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 0.8) return "default"
  if (score >= 0.6) return "secondary"
  if (score >= 0.4) return "outline"
  return "destructive"
}

function getGlowClass(index: number): string {
  const glowClasses = [
    "glow-corner-1",
    "glow-corner-2",
    "glow-corner-3",
    "glow-corner-4",
    "glow-corner-5",
  ]
  return glowClasses[index % glowClasses.length]
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}m`
}

export function TaskCard({ report, category, index = 0 }: TaskCardProps) {
  const { task_id, paper, grading, time_used_seconds } = report
  const overallScore = grading.overall_score

  // Safely access scores with fallback
  const methodologyScore = grading.scores?.methodology_understanding?.score ?? 0
  const correctnessScore = grading.scores?.code_correctness?.score ?? 0
  const accuracyScore = grading.scores?.data_accuracy?.score ?? 0
  const completenessScore = grading.scores?.completeness?.score ?? 0

  const glowClass = getGlowClass(index)

  return (
    <Link href={`/results/${category}/${task_id}`} className="cursor-pointer group block">
      <Card className={`h-full glass-card ${glowClass} transition-all duration-300 hover:shadow-2xl overflow-hidden`}>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
              {paper.title}
            </CardTitle>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="shrink-0">
              {(overallScore * 100).toFixed(0)}%
            </Badge>
          </div>
          <CardDescription className="line-clamp-1">
            {paper.author} • {paper.year}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Score</span>
              <span className="font-medium">
                {(overallScore * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={overallScore * 100} className="h-2" />
          </div>

          {grading.scores && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {grading.scores.methodology_understanding && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Methodology</div>
                  <div className="font-medium">
                    {(methodologyScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              {grading.scores.code_correctness && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Correctness</div>
                  <div className="font-medium">
                    {(correctnessScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              {grading.scores.data_accuracy && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Accuracy</div>
                  <div className="font-medium">
                    {(accuracyScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
              {grading.scores.completeness && (
                <div className="space-y-1">
                  <div className="text-muted-foreground">Completeness</div>
                  <div className="font-medium">
                    {(completenessScore * 100).toFixed(0)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-between text-xs text-muted-foreground">
          <span>Task: {task_id}</span>
          <span>Time: {formatTime(time_used_seconds)}</span>
        </CardFooter>
      </Card>
    </Link>
  )
}
