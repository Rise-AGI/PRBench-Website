export interface Paper {
  title: string
  author: string
  doi: string
  year: number
  paper_file: string
}

export interface ScoreDetail {
  score: number
  justification: string
}

export interface Scores {
  methodology_understanding?: ScoreDetail
  code_correctness?: ScoreDetail
  data_accuracy?: ScoreDetail
  completeness?: ScoreDetail
}

export interface Grading {
  scores?: Scores
  overall_score: number
  summary: string
}

export interface EvalReport {
  task_id: string
  paper: Paper
  grading: Grading
  time_used_seconds: number
  workspace_files: string[]
  poll_count: number
}

export interface CategoryResults {
  category: string
  tasks: EvalReport[]
}

export interface AllResults {
  code_only: EvalReport[]
  full_codex: EvalReport[]
}
