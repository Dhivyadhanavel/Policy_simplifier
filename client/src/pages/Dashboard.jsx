import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle, Upload, Search, RefreshCw, Brain, Wifi } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusBadge = (status) => {
  const map = {
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    processing: 'bg-blue-100 text-blue-700',
    failed: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status === 'processing' && <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />}
      {status}
    </span>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverDown, setServerDown] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [reextracting, setReextracting] = useState({});

  const fetchDocs = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setServerDown(false);
      const params = {};
      if (search) params.search = search;
      if (filter) params.mimeType = filter;
      const res = await api.get('/documents', { params, timeout: 8000 });
      setDocs(res.data.documents || []);
      setError('');
    } catch (err) {
      // Network error = server still starting up
      if (!err.response) {
        setServerDown(true);
        setError('');
      } else {
        setError('Dashboard data could not be loaded.');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [search, filter]);

  // Initial load
  useEffect(() => { fetchDocs(); }, []);

  // Auto-retry every 3s if server is down (handles server restart)
  useEffect(() => {
    if (!serverDown) return;
    const retry = setInterval(() => fetchDocs(true), 3000);
    return () => clearInterval(retry);
  }, [serverDown, fetchDocs]);

  // Auto-poll every 4s if any doc is processing
  useEffect(() => {
    const hasProcessing = docs.some(d => d.processingStatus === 'processing' || d.processingStatus === 'pending');
    if (!hasProcessing) return;
    const interval = setInterval(() => fetchDocs(true), 4000);
    return () => clearInterval(interval);
  }, [docs, fetchDocs]);

  const handleReextract = async (docId) => {
    setReextracting(r => ({ ...r, [docId]: true }));
    try {
      await api.post(`/documents/${docId}/reextract`);
      fetchDocs(true);
    } catch (e) {
      console.error('Re-extract failed:', e.response?.data?.error || e.message);
    } finally {
      setReextracting(r => ({ ...r, [docId]: false }));
    }
  };

  const totalDocs = docs.length;
  const completed = docs.filter(d => d.processingStatus === 'completed').length;
  const byType = docs.reduce((acc, d) => { acc[d.documentType] = (acc[d.documentType] || 0) + 1; return acc; }, {});
  const recent = [...docs].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 10);

  // Server restart indicator
  if (serverDown) return (
    <AppLayout>
      <div className="p-8 flex flex-col items-center justify-center min-h-96 text-center">
        <div className="bg-yellow-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Wifi className="h-8 w-8 text-yellow-500 animate-pulse" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Connecting to server...</h2>
        <p className="text-gray-400 text-sm mb-4">The server is starting up. This takes just a few seconds.</p>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          Retrying automatically...
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="text-gray-500 text-sm mt-1">Here is your document activity</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => fetchDocs()} className="border border-gray-200 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm flex items-center gap-1.5 transition-colors">
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
            <Link to="/upload" className="bg-blue-700 hover:bg-blue-800 text-white font-medium px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm transition-colors">
              <Upload className="h-4 w-4" /> Upload document
            </Link>
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-4 mb-6 text-sm">{error}</div>}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total documents', value: totalDocs, icon: <FileText className="h-5 w-5 text-blue-600" />, bg: 'bg-blue-50' },
            { label: 'Analysed', value: completed, icon: <CheckCircle className="h-5 w-5 text-green-600" />, bg: 'bg-green-50' },
            { label: 'Pending/Processing', value: docs.filter(d => ['pending','processing'].includes(d.processingStatus)).length, icon: <Clock className="h-5 w-5 text-yellow-600" />, bg: 'bg-yellow-50' },
            { label: 'Failed', value: docs.filter(d => d.processingStatus === 'failed').length, icon: <AlertCircle className="h-5 w-5 text-red-600" />, bg: 'bg-red-50' },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className={`${bg} w-9 h-9 rounded-lg flex items-center justify-center mb-3`}>{icon}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-sm text-gray-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchDocs()}
              placeholder="Search by filename..." className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filter} onChange={e => { setFilter(e.target.value); setTimeout(() => fetchDocs(), 50); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="">All types</option>
            <option value="application/pdf">PDF</option>
            <option value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">DOCX</option>
          </select>
          <button onClick={() => fetchDocs()} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-800 transition-colors">Search</button>
        </div>

        {/* Document list */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-5 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent documents</h2>
            <Link to="/library" className="text-blue-600 hover:text-blue-700 text-sm">View all</Link>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No documents yet.</p>
              <Link to="/upload" className="text-blue-600 text-sm hover:underline mt-1 inline-block">Upload your first document</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recent.map(doc => (
                <div key={doc._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.originalFilename}</p>
                      <p className="text-xs text-gray-400">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {statusBadge(doc.processingStatus)}
                    {doc.processingStatus === 'completed' && (
                      <Link to={`/documents/${doc._id}/analysis`}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                        <Brain className="h-3 w-3" /> Analyse
                      </Link>
                    )}
                    {(doc.processingStatus === 'failed' || doc.processingStatus === 'processing') && (
                      <button onClick={() => handleReextract(doc._id)} disabled={reextracting[doc._id]}
                        className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-xs font-medium bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-3 w-3 ${reextracting[doc._id] ? 'animate-spin' : ''}`} />
                        {reextracting[doc._id] ? 'Extracting...' : 'Re-extract'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Type breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Documents by type</h2>
            <div className="flex gap-4 flex-wrap">
              {Object.entries(byType).map(([type, count]) => (
                <div key={type} className="bg-blue-50 rounded-lg px-4 py-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{count}</div>
                  <div className="text-xs text-blue-600 capitalize">{type?.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
