import { useState, useEffect } from "react";
import { User, Save, AlertCircle, CheckCircle } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const Profile = () => {
  const { user, login, token } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", preferredLanguage: "en" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ name: user.name || "", email: user.email || "", preferredLanguage: user.preferredLanguage || "en" });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess(false);
    try {
      const res = await api.patch("/users/profile", form);
      login(token, res.data.user);
      setSuccess(true);
    } catch (e) {
      setError(e.response?.data?.error || "Could not save profile.");
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <User className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          {success && <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 text-sm mb-4"><CheckCircle className="h-4 w-4" />Profile saved successfully.</div>}
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm mb-4"><AlertCircle className="h-4 w-4" />{error}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred language</label>
              <select value={form.preferredLanguage} onChange={e => setForm(f => ({ ...f, preferredLanguage: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="en">English</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            <div className="pt-1">
              <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
              <p className="text-sm text-gray-700 capitalize bg-gray-50 border border-gray-100 rounded-lg px-4 py-2">{user?.role}</p>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors">
              <Save className="h-4 w-4" />{loading ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
