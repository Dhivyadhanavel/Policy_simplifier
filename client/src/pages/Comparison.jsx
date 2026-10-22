import { useState, useEffect } from "react";
import { GitCompare, AlertCircle, Plus, Minus, Edit } from "lucide-react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const Comparison = () => {
  const [docs, setDocs] = useState([]);
  const [docA, setDocA] = useState("");
  const [docB, setDocB] = useState("");
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/documents").then(r => setDocs(r.data.documents?.filter(d => d.processingStatus === "completed") || [])).catch(() => {});
  }, []);

  const runComparison = async () => {
    if (!docA || !docB) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await api.post("/documents/compare", { documentIdA: docA, documentIdB: docB, language });
      setResult(res.data.comparison);
    } catch (e) {
      setError(e.response?.data?.error || "Comparison failed.");
    } finally { setLoading(false); }
  };

  const cr = result?.comparisonResults;

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center gap-3 mb-8">
          <GitCompare className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Document Version Comparison</h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document A (original)</label>
              <select value={docA} onChange={e => setDocA(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select document...</option>
                {docs.map(d => <option key={d._id} value={d._id}>{d.originalFilename}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document B (revised)</label>
              <select value={docB} onChange={e => setDocB(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select document...</option>
                {docs.filter(d => d._id !== docA).map(d => <option key={d._id} value={d._id}>{d.originalFilename}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
            <button onClick={runComparison} disabled={!docA || !docB || loading}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
              {loading ? "Comparing..." : "Compare documents"}
            </button>
          </div>
        </div>

        {error && <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm mb-6"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

        {result && (
          <div className="space-y-4">
            {cr?.aiExplanation && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <h3 className="font-semibold text-blue-900 mb-2">AI Summary of Changes</h3>
                <p className="text-blue-800 text-sm">{cr.aiExplanation}</p>
                {cr.disclaimer && <p className="text-blue-600 text-xs mt-3 italic">{cr.disclaimer}</p>}
              </div>
            )}

            {cr?.addedClauses?.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3"><Plus className="h-4 w-4 text-green-700" /><h3 className="font-semibold text-green-900">Added ({cr.addedClauses.length})</h3></div>
                {cr.addedClauses.map((c, i) => <p key={i} className="text-green-800 text-sm bg-green-100 rounded px-3 py-2 mb-1 font-mono text-xs">{c}</p>)}
              </div>
            )}

            {cr?.removedClauses?.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3"><Minus className="h-4 w-4 text-red-700" /><h3 className="font-semibold text-red-900">Removed ({cr.removedClauses.length})</h3></div>
                {cr.removedClauses.map((c, i) => <p key={i} className="text-red-800 text-sm bg-red-100 rounded px-3 py-2 mb-1 font-mono text-xs">{c}</p>)}
              </div>
            )}

            {cr?.modifiedClauses?.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3"><Edit className="h-4 w-4 text-yellow-700" /><h3 className="font-semibold text-yellow-900">Modified ({cr.modifiedClauses.length})</h3></div>
                {cr.modifiedClauses.map((c, i) => (
                  <div key={i} className="mb-3">
                    <p className="text-red-700 text-xs bg-red-50 rounded px-3 py-2 mb-1 font-mono line-through">{c.before}</p>
                    <p className="text-green-700 text-xs bg-green-50 rounded px-3 py-2 font-mono">{c.after}</p>
                  </div>
                ))}
              </div>
            )}

            {!cr?.addedClauses?.length && !cr?.removedClauses?.length && !cr?.modifiedClauses?.length && (
              <div className="text-center py-8 text-gray-400 text-sm">No textual differences detected between these documents.</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Comparison;
