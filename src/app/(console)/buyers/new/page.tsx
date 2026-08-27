import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { createBuyer } from "@/server/actions/masters";
import { redirect } from "next/navigation";

export default async function NewBuyerPage() {
  const user = await requireUser();
  if (!canWrite(user.role)) {
    return <EmptyState title="Read-only role" description="Your account cannot create buyers." />;
  }
  async function action(formData: FormData) {
    "use server";
    const id = await createBuyer(formData);
    redirect(`/buyers/${id}`);
  }
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader eyebrow="Buyers" title="New buyer" />
      <form action={action} className="grid gap-4 rounded-sm border border-stone-200 bg-white p-5 sm:grid-cols-2">
        <F name="name" label="Buyer name" required />
        <F name="contactPerson" label="Contact person" />
        <F name="mobile" label="Mobile" />
        <F name="email" label="Email" type="email" />
        <F name="gstNumber" label="GST number" />
        <F name="pan" label="PAN" />
        <F name="address" label="Address" className="sm:col-span-2" />
        <F name="city" label="City" />
        <F name="state" label="State" />
        <F name="pincode" label="PIN" />
        <F name="bankName" label="Bank name" />
        <F name="bankAccount" label="Account number" />
        <F name="ifsc" label="IFSC" />
        <div className="sm:col-span-2">
          <button className="rounded-sm bg-ink-900 px-4 py-2 text-sm font-semibold text-white">Create buyer</button>
        </div>
      </form>
    </div>
  );
}

function F(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className={className}>
      <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</span>
      <input {...rest} className="mt-1 h-10 w-full rounded-sm border border-stone-300 px-3 text-sm" />
    </label>
  );
}
