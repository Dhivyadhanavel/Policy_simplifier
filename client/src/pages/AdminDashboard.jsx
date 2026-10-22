import { useState, useEffect } from "react";
import { Users, FileText, CheckCircle, AlertCircle, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/users", { params: { page, limit: 20 } }),
    ])
      .then(([s, u]) => {
        setStats(s.data);
        setUsers(u.data.users || []);
        setTotalPages(u.data.totalPages || 1);
        setError("");
      })
      .catch(() => setError("Could not load admin data."))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <AppLayout><div className="p-12 text-center text-gray-400">Loading admin dashboard...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-6 flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total users", value: stats.totalUsers, icon: <Users className="h-5 w-5 text-blue-600" />, bg: "bg-blue-50" },
                { label: "Total documents", value: stats.totalDocuments, icon: <FileText className="h-5 w-5 text-indigo-600" />, bg: "bg-indigo-50" },
                { label: "Completed analyses", value: stats.completedAnalyses, icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: "bg-green-50" },
                { label: "Failed analyses", value: stats.failedAnalyses, icon: <AlertCircle className="h-5 w-5 text-red-600" />, bg: "bg-red-50" },
              ].map(({ label, value, icon, bg }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                  <div className={`${bg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{value ?? 0}</div>
                  <div className="text-sm text-gray-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {stats.documentTypeDistribution?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="h-4 w-4 text-blue-600" />Document types</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stats.documentTypeDistribution.map(d => ({ name: d.type, count: d.count }))}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {stats.monthlyUsage?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Monthly uploads</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={stats.monthlyUsage.map(m => ({ name: `${m.month}/${m.year}`, count: m.documentCount }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900">Registered users</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Name", "Email", "Role", "Joined"].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-3 text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="p-4 flex justify-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-40">Prev</button>
              <span className="px-3 py-1 text-sm text-gray-600">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default AdminDashboard;
