import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Brain, AlertCircle, Download, MessageSquare, Shield, RefreshCw, Clock } from "lucide-react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const AnalysisWorkspace = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const docRes = await api.get(`/documents/${id}`);
        setDoc(docRes.data.document);
        try {
          const anlRes = await api.get(`/documents/${id}/analysis`);
          setAnalysis(anlRes.data.analysis);
        } catch (e) {
          if (e.response?.status !== 404) throw e;
        }
      } catch { setError("Could not load document."); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  // Elapsed timer during analysis
  useEffect(() => {
    if (!analysing) { setElapsedSeconds(0); return; }
    const t = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [analysing]);

  const runAnalysis = async () => {
    setAnalysing(true);
    setError("");
    try {
      const res = await api.post(`/documents/${id}/analyze`, { language }, { timeout: 120000 });
      setAnalysis(res.data.analysis);
    } catch (e) {
      const msg = e.response?.data?.error || e.message || "Analysis failed.";
      setError(msg);
    } finally { setAnalysing(false); }
  };

  const TABS = ["overview", "sections", "clauses", "obligations", "glossary"];

  if (loading) return <AppLayout><div className="p-12 text-center text-gray-400">Loading...</div></AppLayout>;

  return (
    <AppLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900 truncate">{doc?.originalFilename}</h1>
            <p className="text-gray-500 text-sm mt-1">
              Status: <span className={`font-medium ${doc?.processingStatus === "completed" ? "text-green-600" : "text-yellow-600"}`}>{doc?.processingStatus}</span>
              {doc?.pageCount && <span className="ml-3 text-gray-400">· {doc.pageCount} pages</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <select value={language} onChange={e => setLanguage(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="en">English</option>
              <option value="ta">Tamil</option>
            </select>
            {analysis && <>
              <Link to={`/documents/${id}/risk`} className="flex items-center gap-1.5 border border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <Shield className="h-4 w-4" /> Risks
              </Link>
              <Link to={`/documents/${id}/chat`} className="flex items-center gap-1.5 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <MessageSquare className="h-4 w-4" /> Ask
              </Link>
              <Link to={`/documents/${id}/report`} className="flex items-center gap-1.5 bg-blue-700 text-white hover:bg-blue-800 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                <Download className="h-4 w-4" /> Report
              </Link>
            </>}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4 text-sm">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Analysis failed</p>
                <p>{error}</p>
                {error.includes('API key') && (
                  <p className="mt-2 text-xs">👉 Get a valid key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">aistudio.google.com/app/apikey</a> and update GEMINI_API_KEY in your .env file.</p>
                )}
              </div>
            </div>
            <button onClick={runAnalysis} className="mt-3 text-red-600 hover:underline text-xs font-medium">Retry</button>
          </div>
        )}

        {!analysis ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            {analysing ? (
              <div>
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                  <Brain className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Analysing with Gemini AI...</h2>
                <p className="text-gray-400 text-sm mb-3">Reading document and generating plain-English summary</p>
                <div className="flex items-center justify-center gap-1.5 text-gray-400 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{elapsedSeconds}s elapsed</span>
                  {elapsedSeconds > 20 && <span className="text-xs ml-2">(AI analysis typically takes 15–45 seconds)</span>}
                </div>
                {elapsedSeconds > 55 && (
                  <p className="mt-3 text-xs text-orange-600 bg-orange-50 rounded-lg px-4 py-2 mx-auto max-w-sm">
                    Taking longer than usual — this may indicate an invalid API key. Check your GEMINI_API_KEY in .env.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <Brain className="h-12 w-12 text-blue-200 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-900 mb-2">No analysis yet</h2>
                <p className="text-gray-500 text-sm mb-6">
                  {doc?.processingStatus !== "completed"
                    ? "Waiting for text extraction to complete before analysis can run."
                    : "Run AI analysis to get a plain-English breakdown of this document."}
                </p>
                <button onClick={runAnalysis} disabled={doc?.processingStatus !== "completed"}
                  className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold px-8 py-3 rounded-xl flex items-center gap-2 mx-auto transition-colors">
                  <Brain className="h-4 w-4" /> Run AI analysis
                </button>
                <p className="text-xs text-gray-400 mt-3">Typically takes 15–45 seconds</p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-xs mb-6">{analysis.disclaimer}</div>

            <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 flex-wrap">
              {TABS.map(t => (
                <button key={t} onClick={() => setActiveTab(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === t ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              {activeTab === "overview" && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-3">Overview</h2>
                  <p className="text-gray-700 leading-relaxed mb-6">{analysis.overview}</p>
                  <h2 className="font-semibold text-gray-900 mb-3">Detailed Summary</h2>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">{analysis.detailedSummary}</p>
                </div>
              )}
              {activeTab === "sections" && (
                <div className="space-y-4">
                  {analysis.sectionSummaries?.length ? analysis.sectionSummaries.map((s, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{s.section}</h3>
                      <p className="text-gray-600 text-sm">{s.summary}</p>
                    </div>
                  )) : <p className="text-gray-400 text-sm">No sections found.</p>}
                </div>
              )}
              {activeTab === "clauses" && (
                <div className="space-y-4">
                  {analysis.importantClauses?.length ? analysis.importantClauses.map((c, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4">
                      <h3 className="font-medium text-gray-900 mb-1">{c.title}</h3>
                      {c.excerpt && <p className="text-xs text-gray-500 italic mb-2">&ldquo;{c.excerpt}&rdquo;</p>}
                      <p className="text-gray-600 text-sm">{c.explanation}</p>
                    </div>
                  )) : <p className="text-gray-400 text-sm">No important clauses identified.</p>}
                </div>
              )}
              {activeTab === "obligations" && (
                <div>
                  {analysis.obligations?.length ? (
                    <ul className="space-y-2">
                      {analysis.obligations.map((o, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded shrink-0 mt-0.5">{o.party || "Party"}</span>
                          <span className="text-gray-700">{o.obligation}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-gray-400 text-sm">No obligations identified.</p>}
                  {analysis.deadlines?.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-medium text-gray-900 mb-3">Deadlines</h3>
                      <ul className="space-y-2">
                        {analysis.deadlines.map((d, i) => (
                          <li key={i} className="text-sm text-gray-700"><span className="font-medium">{d.date}</span> — {d.description}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activeTab === "glossary" && (
                <div className="space-y-3">
                  {analysis.glossary?.length ? analysis.glossary.map((g, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <span className="font-semibold text-blue-700 min-w-32 shrink-0">{g.term}</span>
                      <span className="text-gray-600">{g.definition}</span>
                    </div>
                  )) : <p className="text-gray-400 text-sm">No glossary terms found.</p>}
                </div>
              )}
            </div>

            <div className="mt-4 text-center">
              <button onClick={runAnalysis} disabled={analysing}
                className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1.5 mx-auto">
                <RefreshCw className="h-3.5 w-3.5" /> Re-run analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AnalysisWorkspace;
