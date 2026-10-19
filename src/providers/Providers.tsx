"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getErrorInfo } from "@/helpers";

export function Providers({ children }: { children: React.ReactNode }): React.ReactElement {
  const router = useRouter();

  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            const info = getErrorInfo(error);
            if (info.kind === "forbidden") {
              toast.error(info.message);
              router.refresh();
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return;
            const info = getErrorInfo(error);
            toast.error(info.message);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30000,
            refetchOnWindowFocus: false,
            retry: (count, error) => {
              const info = getErrorInfo(error);
              return info.retryable && count < 1;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
