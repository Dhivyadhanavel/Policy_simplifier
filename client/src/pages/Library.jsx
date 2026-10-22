import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Search, Trash2, Brain, Eye, AlertCircle } from "lucide-react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const statusBadge = (status) => {
  const map = { completed: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", processing: "bg-blue-100 text-blue-700", failed: "bg-red-100 text-red-700" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] || "bg-gray-100 text-gray-600"}`}>{status}</span>;
};

const Library = () => {
  const navigate = useNavigate();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mimeFilter, setMimeFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (mimeFilter) params.mimeType = mimeFilter;
      const res = await api.get("/documents", { params });
      setDocs(res.data.documents || []);
      setError("");
    } catch {
      setError("Could not load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/documents/${deleteId}`);
      setDocs(d => d.filter(x => x._id !== deleteId));
      setDeleteId(null);
    } catch {
      setError("Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
          <Link to="/upload" className="bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-800">Upload new</Link>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm flex gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && fetchDocs()}
              placeholder="Search documents..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={mimeFilter} onChange={e => { setMimeFilter(e.target.value); setTimeout(fetchDocs, 50); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">All types</option>
            <option value="application/pdf">PDF</option>
            <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</option>
          </select>
          <button onClick={fetchDocs} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800">Search</button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading...</div>
          ) : docs.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No documents found.</p>
              <Link to="/upload" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Upload a document</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">File</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">Type</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">Status</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-3 py-3">Uploaded</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {docs.map(doc => (
                  <tr key={doc._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900 truncate max-w-xs">{doc.originalFilename}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-gray-500 uppercase text-xs">{doc.mimeType?.includes("pdf") ? "PDF" : "DOCX"}</td>
                    <td className="px-3 py-3">{statusBadge(doc.processingStatus)}</td>
                    <td className="px-3 py-3 text-gray-400">{new Date(doc.uploadDate).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => navigate(`/documents/${doc._id}/analysis`)} className="text-gray-400 hover:text-blue-600 transition-colors" title="View analysis"><Eye className="h-4 w-4" /></button>
                        {doc.processingStatus === "completed" && (
                          <button onClick={() => navigate(`/documents/${doc._id}/analysis`)} className="text-gray-400 hover:text-green-600 transition-colors" title="Analyse"><Brain className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => setDeleteId(doc._id)} className="text-gray-400 hover:text-red-600 transition-colors" title="Delete"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete confirm modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
              <h3 className="font-bold text-gray-900 mb-2">Delete document?</h3>
              <p className="text-gray-500 text-sm mb-6">This will permanently delete the document and all its analysis, conversation history, and reports. This cannot be undone.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteId(null)} className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Library;
