import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TaskCardSkeleton() {
  return (
    <Card className="h-full animate-pulse">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-12 rounded-full" />
        </div>
        <Skeleton className="mt-2 h-4 w-1/2" />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </CardFooter>
    </Card>
  )
}

export function StatsCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <Skeleton className="h-4 w-32" />
      <div className="mt-2 flex items-baseline gap-2">
        <Skeleton className="h-9 w-12" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="mt-1 h-4 w-40" />
    </div>
  )
}

export function ResultsLoadingGrid() {
  return (
    <div className="space-y-8">
      {/* Statistics Skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>

      {/* Cards Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}
