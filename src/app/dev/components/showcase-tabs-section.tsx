import { Tabs, TabsContent } from "@/components/stockroom/tabs";
import { useState } from "react";

export function TabsShowcase(): React.ReactElement {
  const [tabValue, setTabValue] = useState("tab1");

  return (
    <section>
      <h2 className="text-section text-text-primary mb-lg">Tabs</h2>
      <div className="max-w-md">
        <Tabs
          tabs={[
            { value: "tab1", label: "Overview", count: 12 },
            { value: "tab2", label: "Details" },
            { value: "tab3", label: "History" },
          ]}
          value={tabValue}
          onValueChange={setTabValue}
        >
          <TabsContent value="tab1" className="pt-lg">
            <p className="text-body text-text-secondary">Overview content goes here.</p>
          </TabsContent>
          <TabsContent value="tab2" className="pt-lg">
            <p className="text-body text-text-secondary">Details content goes here.</p>
          </TabsContent>
          <TabsContent value="tab3" className="pt-lg">
            <p className="text-body text-text-secondary">History content goes here.</p>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
