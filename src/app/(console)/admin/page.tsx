import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireUser } from "@/lib/require";
import { createUser, toggleUser } from "@/server/actions/settings";
import { roleLabel, ROLES, canManageUsers } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";

export default async function AdminPage() {
  const me = await requireUser();
  if (!canManageUsers(me.role)) {
    return (
      <EmptyState
        title="Administrators only"
        description="User management is restricted to the Administrator role."
      />
    );
  }
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="space-y-5">
      <PageHeader eyebrow="Administration" title="Users & roles" description="Administrator, Manager, Data entry and Viewer. Additional roles can be added in code without rewriting screens." />
      <div className="overflow-auto rounded-sm border border-stone-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-paper-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Role</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Last login</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-stone-100">
                <td className="px-3 py-2 font-medium">{u.name}</td>
                <td className="px-3 py-2">{u.email}</td>
                <td className="px-3 py-2">{roleLabel(u.role)}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={u.isActive ? "ACTIVE" : "INACTIVE"} />
                </td>
                <td className="px-3 py-2 text-stone-500">{formatDateTime(u.lastLoginAt)}</td>
                <td className="px-3 py-2 text-right">
                  {u.id !== me.id ? (
                    <form
                      action={async () => {
                        "use server";
                        await toggleUser(u.id);
                      }}
                    >
                      <button className="text-xs font-semibold text-copper-800">{u.isActive ? "Deactivate" : "Activate"}</button>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createUser} className="grid gap-3 rounded-sm border border-stone-200 bg-white p-4 sm:grid-cols-2">
        <h2 className="sm:col-span-2 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Add user</h2>
        <label className="block">
          <span className="text-xs text-stone-500">Name</span>
          <input name="name" required className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">Email</span>
          <input name="email" type="email" required className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">Password</span>
          <input name="password" type="password" required minLength={8} className="mt-1 h-10 w-full rounded-sm border px-3 text-sm" />
        </label>
        <label className="block">
          <span className="text-xs text-stone-500">Role</span>
          <select name="role" className="mt-1 h-10 w-full rounded-sm border px-2 text-sm">
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabel(r)}
              </option>
            ))}
          </select>
        </label>
        <button className="h-10 rounded-sm bg-ink-900 px-3 text-sm font-semibold text-white">Create user</button>
      </form>
    </div>
  );
}
