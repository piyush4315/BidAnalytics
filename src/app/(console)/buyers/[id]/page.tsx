import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getLots } from "@/lib/queries";
import { PageHeader } from "@/components/ui/PageHeader";
import { KpiCard } from "@/components/ui/KpiCard";
import { LotsTable } from "@/components/tables/LotsTable";
import { toLotRow } from "@/lib/lot-row";
import { updateBuyer } from "@/server/actions/masters";
import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { StatusBadge } from "@/components/ui/StatusBadge";

export default async function BuyerDetail({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const buyer = await prisma.buyer.findFirst({ where: { id: params.id, deletedAt: null } });
  if (!buyer) notFound();
  const lots = (await getLots()).filter((l) => l.buyerId === buyer.id);
  const mv = lots.reduce((s, l) => s + l.materialValue, 0);
  const rec = lots.reduce((s, l) => s + l.totalReceivable, 0);
  const recd = lots.reduce((s, l) => s + l.rollup.totalReceived, 0);

  async function save(formData: FormData) {
    "use server";
    await updateBuyer(params.id, formData);
  }

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Buyer" title={buyer.name} />
      <StatusBadge status={buyer.isActive ? "ACTIVE" : "INACTIVE"} />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Lots purchased" value={String(lots.length)} />
        <KpiCard label="Material value" money={mv} />
        <KpiCard label="Receivable" money={rec} />
        <KpiCard label="Received" money={recd} tone="good" />
        <KpiCard label="Outstanding" money={rec - recd} tone={rec - recd > 1 ? "bad" : "good"} />
      </section>
      <LotsTable rows={lots.map(toLotRow)} />
      {canWrite(user.role) ? (
        <form action={save} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-3">
          <F name="contactPerson" label="Contact person" defaultValue={buyer.contactPerson || ""} />
          <F name="mobile" label="Mobile" defaultValue={buyer.mobile || ""} />
          <F name="email" label="Email" defaultValue={buyer.email || ""} />
          <F name="gstNumber" label="GST number" defaultValue={buyer.gstNumber || ""} />
          <F name="pan" label="PAN" defaultValue={buyer.pan || ""} />
          <F name="address" label="Address" defaultValue={buyer.address || ""} />
          <F name="city" label="City" defaultValue={buyer.city || ""} />
          <F name="state" label="State" defaultValue={buyer.state || ""} />
          <F name="pincode" label="PIN" defaultValue={buyer.pincode || ""} />
          <F name="bankName" label="Bank" defaultValue={buyer.bankName || ""} />
          <F name="bankAccount" label="Account" defaultValue={buyer.bankAccount || ""} />
          <F name="ifsc" label="IFSC" defaultValue={buyer.ifsc || ""} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isActive" value="true" defaultChecked={buyer.isActive} /> Active
          </label>
          <div>
            <button className="rounded-sm bg-ink-900 px-3 py-2 text-sm font-semibold text-white">Save profile</button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

function F(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs text-stone-500">{label}</span>
      <input {...rest} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
    </label>
  );
}
