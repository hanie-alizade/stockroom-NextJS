import { Brand } from "./brand";
import { Navigation } from "./navigation";
import { StoreSelector } from "./storeSelector";
import { UserProfileCard } from "./userProfileCard";

export function Sidebar(): React.ReactElement {
  return (
    <aside className="border-border-default bg-bg-surface flex h-screen w-[248px] flex-col border-r px-[12px] py-[20px]">
      <Brand />
      <StoreSelector />
      <Navigation />
      <div className="mt-auto">
        <UserProfileCard />
      </div>
    </aside>
  );
}
