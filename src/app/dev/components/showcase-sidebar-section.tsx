import { AppSidebar } from "@/components/stockroom/app-sidebar";
import { Badge } from "@/components/ui/badge";

export function SidebarShowcase(): React.ReactElement {
  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">App Sidebar</h2>
      <div className="max-w-2xl">
        <div className="border-border-default overflow-hidden rounded-lg border">
          <AppSidebar
            stores={[
              { value: "store1", label: "Store 1" },
              { value: "store2", label: "Store 2" },
            ]}
            selectedStore="all"
            onStoreChange={() => {}}
            navItems={[
              { label: "Products", value: "products", active: true },
              { label: "Import", value: "import" },
              {
                label: "Suppliers",
                value: "suppliers",
                badge: (
                  <Badge variant="outline" className="text-caption">
                    Soon
                  </Badge>
                ),
              },
              {
                label: "Reports",
                value: "reports",
                badge: (
                  <Badge variant="outline" className="text-caption">
                    Soon
                  </Badge>
                ),
              },
            ]}
            onNavigate={() => {}}
            user={{
              initials: "JD",
              name: "John Doe",
              role: "Manager",
            }}
            onSwitchUser={() => {}}
            showImport={true}
          />
        </div>
      </div>
    </section>
  );
}
