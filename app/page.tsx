"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

export default function Page() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLastUpdate() {
      try {
        const res = await fetch("/api/last-update")
        if (res.ok) {
          const data = await res.json()
          if (data.timestamp) {
            setLastUpdate(data.timestamp)
          }
        }
      } catch (error) {
        console.error("Error fetching last update:", error)
      }
    }

    fetchLastUpdate()
  }, [])

  const formattedDate = lastUpdate
    ? new Date(lastUpdate).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
      })
    : null

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="flex max-w-2xl flex-col gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold tracking-tight">PRBench</h1>
          <p className="text-xl text-muted-foreground">
            Physics Research Benchmark - Phase 1 Evaluation Results
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Explore comprehensive evaluation results from the PRBench benchmark,
            showcasing AI agent performance on physics paper reproduction tasks.
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/results">
            <Button size="lg" className="w-full cursor-pointer sm:w-auto">
              View Results
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Code Only</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Evaluation results using code-only context
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-semibold">Full Codex</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Evaluation results with full paper context
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1 font-mono text-xs text-muted-foreground">
          {formattedDate && <div>Last update: {formattedDate}</div>}
          <div>
            (Press <kbd>d</kbd> to toggle dark mode)
          </div>
        </div>
      </div>
    </div>
  )
}
