import { Progress } from "@/components/ui/progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import type { Scores } from "@/lib/types"
import { MarkdownRenderer } from "./markdown-renderer"

interface ScoreBreakdownProps {
  scores?: Scores
  overallScore: number
}

const scoreCategories = [
  {
    key: "methodology_understanding" as const,
    label: "Methodology Understanding",
    description: "Understanding of the paper's methodology",
  },
  {
    key: "code_correctness" as const,
    label: "Code Correctness",
    description: "Correctness of the implementation",
  },
  {
    key: "data_accuracy" as const,
    label: "Data Accuracy",
    description: "Accuracy of generated data",
  },
  {
    key: "completeness" as const,
    label: "Completeness",
    description: "Completeness of deliverables",
  },
]

function getScoreBadgeVariant(
  score: number
): "default" | "secondary" | "destructive" | "outline" {
  if (score >= 0.8) return "default"
  if (score >= 0.6) return "secondary"
  if (score >= 0.4) return "outline"
  return "destructive"
}

export function ScoreBreakdown({ scores, overallScore }: ScoreBreakdownProps) {
  // If scores object is missing, show only overall score
  if (!scores) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Overall Score</h3>
            <Badge variant={getScoreBadgeVariant(overallScore)} className="text-base">
              {(overallScore * 100).toFixed(0)}%
            </Badge>
          </div>
          <Progress value={overallScore * 100} className="h-3" />
        </div>
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          Detailed score breakdown not available for this task
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Overall Score</h3>
          <Badge variant={getScoreBadgeVariant(overallScore)} className="text-base">
            {(overallScore * 100).toFixed(0)}%
          </Badge>
        </div>
        <Progress value={overallScore * 100} className="h-3" />
      </div>

      {/* Detailed Scores */}
      <Accordion type="multiple" className="w-full">
        {scoreCategories.map((category) => {
          const scoreDetail = scores[category.key]

          // Skip if score detail is missing
          if (!scoreDetail) {
            return null
          }

          return (
            <AccordionItem key={category.key} value={category.key}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-medium">{category.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {category.description}
                    </span>
                  </div>
                  <Badge
                    variant={getScoreBadgeVariant(scoreDetail.score)}
                    className="ml-2"
                  >
                    {(scoreDetail.score * 100).toFixed(0)}%
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  <Progress value={scoreDetail.score * 100} className="h-2" />
                  <div className="rounded-lg bg-muted p-4">
                    <h4 className="mb-2 text-sm font-semibold">Justification:</h4>
                    <MarkdownRenderer content={scoreDetail.justification} />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
