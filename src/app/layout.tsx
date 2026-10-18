import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Providers, SessionProvider } from "@/providers";
import { AppShell } from "@/components/layout/appShell";
import { getCurrentUser } from "@/server/session";
import { getMeta } from "@/server/services/meta";
import { createRepository } from "@/server/repositories";
import { queryKeys } from "@/constants";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Stockroom",
  description: "Stock app for Kopi Lane",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  const repo = createRepository();
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.meta.all,
    queryFn: () => getMeta(repo, user),
  });

  const dehydratedState = dehydrate(queryClient, {
    shouldDehydrateQuery: (query) => query.state.status === "success",
  });

  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <HydrationBoundary state={dehydratedState}>
            <SessionProvider user={user}>
              <AppShell>{children}</AppShell>
            </SessionProvider>
          </HydrationBoundary>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
