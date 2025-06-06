"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { useState, type ReactNode } from "react"

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Retry failed queries 1 time
            retry: 1,
            // Keep data fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Show stale data while fetching
            refetchOnWindowFocus: false,
            // Handle offline scenarios gracefully
            networkMode: "always",
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
