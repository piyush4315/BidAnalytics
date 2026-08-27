import { getLots } from "@/lib/queries";
import { PageHeader, Button } from "@/components/ui/PageHeader";
import { LotsTable } from "@/components/tables/LotsTable";
import { toLotRow } from "@/lib/lot-row";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";

export default async function LotsPage() {
  const user = await requireUser();
  const lots = await getLots();
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Masters"
        title="Lots"
        description="Every sold lot with live receivable, deposit and final-payment position. Hidden columns include GST, TCS, GST TDS and MSTC service charge."
        actions={
          <>
            <Button href="/api/export/lots" variant="secondary">
              Export Excel
            </Button>
            {canWrite(user.role) ? <Button href="/lots/new">New lot</Button> : null}
          </>
        }
      />
      <LotsTable rows={lots.map(toLotRow)} />
    </div>
  );
}
