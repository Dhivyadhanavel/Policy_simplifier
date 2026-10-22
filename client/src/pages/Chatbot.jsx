import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { MessageSquare, Send, ArrowLeft, Bot, User, AlertCircle } from "lucide-react";
import AppLayout from "../components/AppLayout";
import api from "../services/api";

const Chatbot = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState("en");
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/documents/${id}/conversation`)
      .then(r => setMessages(r.data.conversation?.messages || []))
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendQuestion = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setError("");
    setMessages(m => [...m, { role: "user", content: q, timestamp: new Date() }]);
    setLoading(true);
    try {
      const res = await api.post(`/documents/${id}/questions`, { question: q, language });
      setMessages(m => [...m, { role: "assistant", content: res.data.answer, sourceReferences: res.data.sourceReferences || [], timestamp: new Date() }]);
    } catch (e) {
      const msg = e.response?.data?.error || "Failed to get an answer.";
      setError(msg);
      setMessages(m => m.slice(0, -1));
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-screen">
        <div className="p-6 border-b border-gray-100 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to={`/documents/${id}/analysis`} className="text-gray-400 hover:text-gray-600"><ArrowLeft className="h-5 w-5" /></Link>
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <h1 className="font-semibold text-gray-900">Ask questions about this document</h1>
          </div>
          <select value={language} onChange={e => setLanguage(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="en">English</option>
            <option value="ta">Tamil</option>
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {histLoading ? <div className="text-center text-gray-400 text-sm py-8">Loading conversation...</div> : (
            <>
              {messages.length === 0 && (
                <div className="text-center py-16">
                  <MessageSquare className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium mb-2">Ask anything about this document</p>
                  <p className="text-gray-400 text-sm">Try: &ldquo;What is the cancellation policy?&rdquo; or &ldquo;Are there automatic renewal clauses?&rdquo;</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1"><Bot className="h-4 w-4 text-blue-600" /></div>}
                  <div className={`max-w-2xl rounded-2xl px-4 py-3 ${msg.role === "user" ? "bg-blue-700 text-white rounded-tr-sm" : "bg-white border border-gray-100 text-gray-800 shadow-sm rounded-tl-sm"}`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    {msg.sourceReferences?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {msg.sourceReferences.map((ref, j) => (
                          <p key={j} className="text-xs text-gray-500 italic">{ref.section && `${ref.section}: `}&ldquo;{ref.excerpt}&rdquo;</p>
                        ))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && <div className="bg-blue-700 rounded-full w-8 h-8 flex items-center justify-center shrink-0 mt-1"><User className="h-4 w-4 text-white" /></div>}
                </div>
              ))}
              {loading && (
                <div className="flex gap-3 justify-start">
                  <div className="bg-blue-100 rounded-full w-8 h-8 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-blue-600" /></div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      {[0,1,2].map(n => <span key={n} className="h-2 w-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: `${n*0.15}s` }} />)}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendQuestion} className="p-4 bg-white border-t border-gray-100 flex gap-3">
          <input
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder="Ask a question about this document..."
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={!question.trim() || loading}
            className="bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 text-white px-4 py-2.5 rounded-xl transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

export default Chatbot;
