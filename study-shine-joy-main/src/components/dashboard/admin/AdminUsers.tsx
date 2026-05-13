import { useState, useEffect } from "react";
import { type AdminUser, api } from "@/lib/api";
import { PageHeader, Card, Btn, StatusPill } from "../../shared/UIPrimitives";

export function AdminUsers() {
  const [usersData, setUsersData] = useState<AdminUser[]>([]);

  const fetchUsers = async () => {
    const res = await api.getUsers();
    if (res.success && res.data) {
      setUsersData(Array.isArray(res.data) ? res.data : []);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (userId: number) => {
    const res = await api.approveUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  const handleReject = async (userId: number) => {
    const res = await api.rejectUser(userId.toString());
    if (res.success) await fetchUsers();
  };

  return (
    <>
      <PageHeader title="Users" subtitle="Approve, manage and monitor users." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2">Name</th>
                <th className="py-2">Role</th>
                <th className="py-2">Status</th>
                <th className="py-2">Joined</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {usersData.map((entry) => (
                <tr key={entry.id} className="border-t border-border">
                  <td className="py-3 font-medium">{entry.name}</td>
                  <td className="py-3 text-muted-foreground">{entry.role}</td>
                  <td className="py-3">
                    <StatusPill status={entry.active ? "Active" : "Rejected"} />
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : "-"}
                  </td>
                  <td className="py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Btn
                        variant="soft"
                        className="px-3 py-1 text-xs"
                        onClick={() => handleApprove(entry.id)}
                      >
                        Approve
                      </Btn>
                      <button
                        onClick={() => handleReject(entry.id)}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium hover:bg-secondary"
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
