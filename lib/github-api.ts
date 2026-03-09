import { Octokit } from "@octokit/rest"
import type { EvalReport } from "./types"

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
})

const REPO_OWNER = "StephenQSstarThomas"
const REPO_NAME = "PRBench-Eval"
const RESULTS_PATH = "results"

interface GitHubTreeItem {
  path: string
  type: string
  sha: string
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetch directory tree from GitHub
 */
export async function fetchDirectoryTree(
  path: string = RESULTS_PATH
): Promise<GitHubTreeItem[]> {
  try {
    const { data } = await octokit.rest.git.getTree({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      tree_sha: "main",
      recursive: "true",
    })

    return data.tree
      .filter((item) => item.path?.startsWith(path))
      .map((item) => ({
        path: item.path || "",
        type: item.type || "",
        sha: item.sha || "",
      }))
  } catch (error) {
    console.error("Error fetching directory tree:", error)
    throw new Error("Failed to fetch directory tree from GitHub")
  }
}

/**
 * Fetch a single eval_report.json file with retry
 */
export async function fetchEvalReport(
  filePath: string,
  retries: number = 3
): Promise<EvalReport | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: filePath,
        ref: "main",
      })

      if ("content" in data && data.content) {
        const content = Buffer.from(data.content, "base64").toString("utf-8")
        return JSON.parse(content) as EvalReport
      }

      return null
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`Error fetching eval report ${filePath} after ${retries} attempts:`, error)
        return null
      }
      // Wait before retry with exponential backoff
      await sleep(1000 * Math.pow(2, attempt))
    }
  }
  return null
}

/**
 * Fetch a single eval report by category and task ID
 */
export async function fetchSingleEvalReport(
  category: "code_only" | "full_codex",
  taskId: string
): Promise<EvalReport | null> {
  // Task ID already includes "task_" prefix, don't add it again
  const filePath = `${RESULTS_PATH}/${category}/${taskId}/eval_report.json`
  return fetchEvalReport(filePath)
}

/**
 * Fetch all eval_report.json files from the results directory
 * with optional callback for streaming
 */
export async function fetchAllEvalReports(
  onReport?: (report: EvalReport, category: "code_only" | "full_codex") => void
): Promise<{
  code_only: EvalReport[]
  full_codex: EvalReport[]
}> {
  try {
    const tree = await fetchDirectoryTree()

    // Find all eval_report.json files
    // IMPORTANT: Only get files at exact path: results/{category}/task_{name}/eval_report.json
    const evalReportPaths = tree
      .filter((item) => {
        if (item.type !== "blob" || !item.path.endsWith("eval_report.json")) {
          return false
        }

        // Must be in code_only or full_codex
        if (!item.path.includes("code_only/") && !item.path.includes("full_codex/")) {
          return false
        }

        // Should match EXACT pattern: results/{category}/task_{name}/eval_report.json
        // Split path and check structure
        const pathParts = item.path.split("/")

        // Must be exactly 4 parts: results, category, task_name, eval_report.json
        if (pathParts.length !== 4) {
          return false
        }

        // Verify structure
        if (pathParts[0] !== "results") {
          return false
        }

        if (pathParts[1] !== "code_only" && pathParts[1] !== "full_codex") {
          return false
        }

        if (!pathParts[2].startsWith("task_")) {
          return false
        }

        if (pathParts[3] !== "eval_report.json") {
          return false
        }

        return true
      })
      .map((item) => ({ path: item.path, category: item.path.split("/")[1] as "code_only" | "full_codex" }))

    console.log(`Found ${evalReportPaths.length} valid eval_report.json files`)

    const code_only: EvalReport[] = []
    const full_codex: EvalReport[] = []

    // Fetch reports with concurrency control (5 at a time)
    // Process in batches and call callback immediately
    for (let i = 0; i < evalReportPaths.length; i += 5) {
      const batch = evalReportPaths.slice(i, i + 5)

      const batchResults = await Promise.all(
        batch.map(async ({ path, category }) => {
          const report = await fetchEvalReport(path)
          return { report, path, category }
        })
      )

      // Process results immediately
      for (const { report, category } of batchResults) {
        if (report) {
          if (category === "code_only") {
            code_only.push(report)
          } else {
            full_codex.push(report)
          }

          // Call callback immediately if provided
          if (onReport) {
            onReport(report, category)
          }
        }
      }

      // Add delay between batches
      if (i + 5 < evalReportPaths.length) {
        await sleep(1000)
      }
    }

    console.log(`Successfully fetched ${code_only.length + full_codex.length} reports`)
    console.log(`Code Only: ${code_only.length}, Full Codex: ${full_codex.length}`)

    return { code_only, full_codex }
  } catch (error) {
    console.error("Error fetching all eval reports:", error)
    throw new Error("Failed to fetch eval reports")
  }
}

/**
 * Get GitHub API rate limit status
 */
export async function getRateLimit() {
  try {
    const { data } = await octokit.rest.rateLimit.get()
    return data.rate
  } catch (error) {
    console.error("Error fetching rate limit:", error)
    return null
  }
}

/**
 * Get the latest commit timestamp from the results directory
 */
export async function getLatestCommitDate(): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: RESULTS_PATH,
      per_page: 1,
    })

    if (data.length > 0 && data[0].commit.author?.date) {
      return data[0].commit.author.date
    }

    return null
  } catch (error) {
    console.error("Error fetching latest commit:", error)
    return null
  }
}
