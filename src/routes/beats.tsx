import { Outlet, createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/beats")({
  component: BeatsLayout,
});

function BeatsLayout() {
  return (
    <SiteLayout>
      <Outlet />
    </SiteLayout>
  );
}
