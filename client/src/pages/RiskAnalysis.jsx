import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Shield, AlertTriangle, AlertCircle, ArrowLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const levelColor = (level) => {
  if (level === "High") return "bg-red-100 text-red-700 border-red-200";
  if (level === "Medium") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-green-100 text-green-700 border-green-200";
};

const catColor = (cat) => {
  const map = { Financial: "bg-blue-50 text-blue-700", "Legal Obligation": "bg-purple-50 text-purple-700", Termination: "bg-red-50 text-red-700", Liability: "bg-orange-50 text-orange-700", Privacy: "bg-pink-50 text-pink-700" };
  return map[cat] || "bg-gray-50 text-gray-700";
};

const RiskAnalysis = () => {
  const { id } = useParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/documents/${id}/analysis`)
      .then(r => setAnalysis(r.data.analysis))
      .catch(e => setError(e.response?.status === 404 ? "No analysis found. Run analysis first." : "Could not load analysis."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <AppLayout><div className="p-12 text-center text-gray-400">Loading...</div></AppLayout>;

  const risks = analysis?.riskFindings || [];
  const high = risks.filter(r => r.riskLevel === "High").length;
  const medium = risks.filter(r => r.riskLevel === "Medium").length;
  const low = risks.filter(r => r.riskLevel === "Low").length;

  return (
    <AppLayout>
      <div className="p-8">
        <Link to={`/documents/${id}/analysis`} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-sm mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to analysis
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-6 w-6 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Risk Analysis</h1>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm flex gap-2 mb-6"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}</div>}

        {analysis && (
          <>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-xs mb-6">{analysis.disclaimer}</div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[["High", high, "bg-red-50 border-red-200 text-red-700"], ["Medium", medium, "bg-orange-50 border-orange-200 text-orange-700"], ["Low", low, "bg-green-50 border-green-200 text-green-700"]].map(([level, count, cls]) => (
                <div key={level} className={`border rounded-xl p-4 text-center ${cls}`}>
                  <div className="text-3xl font-bold">{count}</div>
                  <div className="text-sm font-medium">{level} risk</div>
                </div>
              ))}
            </div>

            {risks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                <Shield className="h-10 w-10 text-green-200 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No risk findings identified in this document.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {risks.sort((a, b) => ["High", "Medium", "Low"].indexOf(a.riskLevel) - ["High", "Medium", "Low"].indexOf(b.riskLevel)).map((rf, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <h3 className="font-semibold text-gray-900">{rf.clauseTitle || "Clause"}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${levelColor(rf.riskLevel)}`}>{rf.riskLevel}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${catColor(rf.riskCategory)}`}>{rf.riskCategory}</span>
                      </div>
                    </div>
                    {rf.sourceExcerpt && (
                      <blockquote className="border-l-4 border-gray-200 pl-3 text-xs text-gray-500 italic mb-3">{rf.sourceExcerpt}</blockquote>
                    )}
                    <p className="text-sm text-gray-700 mb-2">{rf.plainExplanation}</p>
                    {rf.potentialConcern && <p className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1.5 mb-2"><span className="font-medium">Concern:</span> {rf.potentialConcern}</p>}
                    {rf.suggestedQuestion && (
                      <p className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5"><span className="font-medium">Suggested question:</span> {rf.suggestedQuestion}</p>
                    )}
                    {rf.sectionReference && <p className="text-xs text-gray-400 mt-2">Section: {rf.sectionReference}</p>}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default RiskAnalysis;
