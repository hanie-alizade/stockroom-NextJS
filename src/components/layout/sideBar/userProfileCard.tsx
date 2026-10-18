"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckIcon } from "@/components/icons";
import { ROLE_LABEL } from "@/constants";
import { useQueryMeta, useMutationSwitchUser } from "@/lib/client/apiHooks";
import { useCurrentUser } from "@/components/providers/session-provider";

export function UserProfileCard(): React.ReactElement | null {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: meta, isLoading } = useQueryMeta();
  const currentUser = useCurrentUser();

  const switchUserMutation = useMutationSwitchUser();

  const handleSwitchUser = (userId: string): void => {
    if (userId === currentUser.id) {
      return;
    }

    switchUserMutation.mutate(userId, {
      onSuccess: async () => {
        queryClient.clear();
        router.refresh();
      },
      onError: (error) => {
        const apiError = error as unknown as { body: { message: string } };
        toast.error(apiError.body?.message || "An error occurred");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="border-border-default bg-bg-surface flex items-center gap-3 rounded-lg border p-3">
        <Skeleton className="size-8 rounded-full" />
        <div className="flex flex-1 flex-col gap-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-5 w-12" />
      </div>
    );
  }

  const roleLabel = ROLE_LABEL[currentUser.role];

  return (
    <div className="border-border-default bg-bg-surface flex items-center gap-3 rounded-lg border p-3">
      <Avatar className="size-8">
        <AvatarFallback className="bg-accent-subtle text-accent-default text-caption">
          {currentUser.initials}
        </AvatarFallback>
      </Avatar>

      <div className="flex flex-1 flex-col">
        <span className="text-body-strong text-text-primary">{currentUser.name}</span>
        <span className="text-caption text-text-secondary">{roleLabel}</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={switchUserMutation.isPending || !meta}>
          <button
            type="button"
            className="text-accent-default hover:text-accent-hover focus-visible:ring-border-focus text-label transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            Switch
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {meta ? (
            meta.users.map((user) => {
              const isCurrent = user.id === currentUser.id;
              const userRoleLabel = ROLE_LABEL[user.role];

              return (
                <DropdownMenuItem
                  key={user.id}
                  onClick={() => handleSwitchUser(user.id)}
                  disabled={isCurrent || switchUserMutation.isPending}
                >
                  <div className="flex flex-1 flex-col">
                    <span className="text-body">{user.name}</span>
                    <span className="text-caption text-text-secondary">{userRoleLabel}</span>
                  </div>
                  {isCurrent && <CheckIcon className="text-accent-default size-4" />}
                </DropdownMenuItem>
              );
            })
          ) : (
            <DropdownMenuItem disabled>
              <Skeleton className="h-4 w-24" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
