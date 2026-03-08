"use client"

import { useEffect, useState, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskCard } from "@/components/task-card"
import { ResultsLoadingGrid } from "@/components/loading-skeletons"
import { ProgressBar, PulseDots } from "@/components/loading-indicators"
import type { EvalReport } from "@/lib/types"

// Client-side cache for results
let cachedResults: {
  codeOnly: EvalReport[]
  fullCodex: EvalReport[]
} | null = null

function calculateStats(reports: EvalReport[]) {
  if (reports.length === 0) return { total: 0, avgScore: 0 }

  const validReports = reports.filter((r) => r.grading?.overall_score !== undefined)
  const totalScore = validReports.reduce((sum, r) => sum + r.grading.overall_score, 0)

  return {
    total: reports.length,
    avgScore: validReports.length > 0 ? totalScore / validReports.length : 0,
  }
}

interface ReportWithCategory extends EvalReport {
  category: "code_only" | "full_codex"
}

export default function ResultsPage() {
  const [codeOnlyReports, setCodeOnlyReports] = useState<EvalReport[]>([])
  const [fullCodexReports, setFullCodexReports] = useState<EvalReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const hasFetchedRef = useRef(false)
  const totalExpected = 31 // Expected total reports

  useEffect(() => {
    // Check if we have cached results
    if (cachedResults) {
      setCodeOnlyReports(cachedResults.codeOnly)
      setFullCodexReports(cachedResults.fullCodex)
      setLoading(false)
      setInitialLoadComplete(true)
      return
    }

    // Prevent double fetch in development (React StrictMode)
    if (hasFetchedRef.current) return
    hasFetchedRef.current = true

    async function fetchResultsStreaming() {
      try {
        // Use relative URL - works in both dev and production
        const res = await fetch("/api/results/stream", {
          cache: "force-cache", // Use browser cache
        })

        if (!res.ok) {
          throw new Error("Failed to fetch results")
        }

        const reader = res.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let buffer = ""
        const codeOnly: EvalReport[] = []
        const fullCodex: EvalReport[] = []

        while (true) {
          const { done, value } = await reader.read()

          if (done) break

          buffer += decoder.decode(value, { stream: true })

          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data = JSON.parse(line)

                if (data.type === "report") {
                  if (data.category === "code_only") {
                    codeOnly.push(data.report)
                    setCodeOnlyReports([...codeOnly])
                  } else if (data.category === "full_codex") {
                    fullCodex.push(data.report)
                    setFullCodexReports([...fullCodex])
                  }
                } else if (data.type === "complete") {
                  setLoading(false)
                  setInitialLoadComplete(true)
                  // Cache the results
                  cachedResults = { codeOnly, fullCodex }
                }
              } catch (e) {
                console.error("Error parsing JSON:", e)
              }
            }
          }
        }
      } catch (err) {
        console.error("Error fetching results:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch results")
        setLoading(false)
      }
    }

    fetchResultsStreaming()
  }, [])

  const stats = {
    code_only: calculateStats(codeOnlyReports),
    full_codex: calculateStats(fullCodexReports),
  }

  const totalLoaded = codeOnlyReports.length + fullCodexReports.length
  const hasResults = totalLoaded > 0

  // Create combined list with unique keys
  const allReports: ReportWithCategory[] = [
    ...codeOnlyReports.map((r, idx) => ({ ...r, category: "code_only" as const, _idx: idx })),
    ...fullCodexReports.map((r, idx) => ({ ...r, category: "full_codex" as const, _idx: idx })),
  ]

  return (
    <div className="min-h-screen results-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">PRBench Evaluation Results</h1>
          <p className="mt-2 text-muted-foreground">
            Phase 1 evaluation results from the PRBench benchmark
          </p>
        </div>

        {/* Progress Bar - Show when loading and has some results */}
        {loading && hasResults && (
          <div className="mb-6">
            <ProgressBar current={totalLoaded} total={totalExpected} />
          </div>
        )}

        {/* Initial Loading State */}
        {loading && !hasResults && <ResultsLoadingGrid />}

        {/* Error State */}
        {error && !loading && (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive">Error Loading Results</h3>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasResults && (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No results available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Results will be loaded from the GitHub repository
              </p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {hasResults && (
          <div className="space-y-8">
            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="glass-card rounded-lg p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Code Only Results
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.code_only.total}</span>
                  <span className="text-sm text-muted-foreground">tasks</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Avg Score: {(stats.code_only.avgScore * 100).toFixed(1)}%
                </p>
                {loading && (
                  <div className="mt-2">
                    <PulseDots />
                  </div>
                )}
              </div>

              <div className="glass-card rounded-lg p-6 transition-all duration-300 hover:shadow-lg">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Full Codex Results
                </h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{stats.full_codex.total}</span>
                  <span className="text-sm text-muted-foreground">tasks</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Avg Score: {(stats.full_codex.avgScore * 100).toFixed(1)}%
                </p>
                {loading && (
                  <div className="mt-2">
                    <PulseDots />
                  </div>
                )}
              </div>
            </div>

            {/* Results Tabs */}
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="all" className="cursor-pointer">
                  All Results
                </TabsTrigger>
                <TabsTrigger value="code_only" className="cursor-pointer">
                  Code Only
                </TabsTrigger>
                <TabsTrigger value="full_codex" className="cursor-pointer">
                  Full Codex
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {allReports
                    .filter((r) => r.grading?.overall_score !== undefined)
                    .sort((a, b) => b.grading.overall_score - a.grading.overall_score)
                    .map((report, idx) => (
                      <div
                        key={`${report.category}-${report.task_id}-${idx}`}
                        className={
                          initialLoadComplete
                            ? "opacity-100"
                            : "animate-in fade-in duration-300"
                        }
                        style={
                          !initialLoadComplete
                            ? {
                                animationDelay: `${Math.min(idx * 30, 500)}ms`,
                                animationFillMode: "backwards",
                              }
                            : undefined
                        }
                      >
                        <TaskCard report={report} category={report.category} index={idx} />
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="code_only" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {codeOnlyReports
                    .filter((r) => r.grading?.overall_score !== undefined)
                    .sort((a, b) => b.grading.overall_score - a.grading.overall_score)
                    .map((report, idx) => (
                      <div
                        key={`code_only-${report.task_id}-${idx}`}
                        className={
                          initialLoadComplete
                            ? "opacity-100"
                            : "animate-in fade-in duration-300"
                        }
                        style={
                          !initialLoadComplete
                            ? {
                                animationDelay: `${Math.min(idx * 30, 500)}ms`,
                                animationFillMode: "backwards",
                              }
                            : undefined
                        }
                      >
                        <TaskCard report={report} category="code_only" index={idx} />
                      </div>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="full_codex" className="mt-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {fullCodexReports
                    .filter((r) => r.grading?.overall_score !== undefined)
                    .sort((a, b) => b.grading.overall_score - a.grading.overall_score)
                    .map((report, idx) => (
                      <div
                        key={`full_codex-${report.task_id}-${idx}`}
                        className={
                          initialLoadComplete
                            ? "opacity-100"
                            : "animate-in fade-in duration-300"
                        }
                        style={
                          !initialLoadComplete
                            ? {
                                animationDelay: `${Math.min(idx * 30, 500)}ms`,
                                animationFillMode: "backwards",
                              }
                            : undefined
                        }
                      >
                        <TaskCard report={report} category="full_codex" index={idx} />
                      </div>
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  )
}
