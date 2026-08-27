import { requireUser } from "@/lib/require";
import { canWrite } from "@/lib/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { ImportWizard } from "@/components/import/ImportWizard";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";

export default async function ImportPage() {
  const user = await requireUser();
  const jobs = await prisma.importJob.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { createdBy: true } });
  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Data"
        title="Import bid sheet"
        description="Upload an Excel workbook, map columns, validate, then confirm. Existing lot numbers are rejected rather than overwritten."
      />
      {canWrite(user.role) ? (
        <ImportWizard />
      ) : (
        <p className="rounded-sm border border-stone-200 bg-white p-4 text-sm text-stone-600">Your role can view import history but cannot upload files.</p>
      )}
      <section className="rounded-sm border border-stone-200 bg-white">
        <header className="border-b border-stone-100 px-4 py-2 text-[12px] font-semibold uppercase tracking-wide text-stone-500">
          Recent imports
        </header>
        <ul className="divide-y divide-stone-100 text-sm">
          {jobs.map((j) => (
            <li key={j.id} className="px-4 py-2">
              <p className="font-medium">
                {j.filename} · {j.status}
              </p>
              <p className="text-xs text-stone-500">
                {j.sheetName} · {j.createdBy?.name} · {formatDateTime(j.createdAt)}
              </p>
            </li>
          ))}
          {jobs.length === 0 ? <li className="px-4 py-6 text-stone-500">No imports yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
