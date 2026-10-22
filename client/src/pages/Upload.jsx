import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, File, CheckCircle, AlertCircle, X, Loader } from 'lucide-react';
import AppLayout from '../components/AppLayout';
import api from '../services/api';

const MAX_MB = 25;
const MAX_BYTES = MAX_MB * 1024 * 1024;
const ALLOWED = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const Upload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(''); // 'uploading' | 'classifying' | ''
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  const validateFile = (f) => {
    if (!ALLOWED.includes(f.type)) return 'Only PDF and DOCX files are supported';
    if (f.size > MAX_BYTES) return `File size exceeds ${MAX_MB} MB limit`;
    return null;
  };

  const handleFile = (f) => {
    const err = validateFile(f);
    if (err) { setError(err); setFile(null); return; }
    setError('');
    setFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setStage('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Upload + extract + classify all in one call (synchronous on backend)
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
            if (pct === 100) setStage('classifying'); // upload done, now classifying
          }
        },
        timeout: 120000, // 2 min for classification
      });

      setSuccess(res.data.document);
      setProgress(100);
    } catch (err) {
      // Show the exact rejection reason from the server
      const msg = err.response?.data?.error ||
                  err.response?.data?.errors?.[0]?.message ||
                  'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
      setStage('');
    }
  };

  if (success) return (
    <AppLayout>
      <div className="p-8 max-w-xl mx-auto text-center mt-16">
        <div className="bg-green-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Upload successful!</h2>
        <p className="text-gray-500 text-sm mb-1">{success.originalFilename}</p>
        <p className="text-xs text-blue-600 font-medium mb-1 capitalize">{success.documentType?.replace(/_/g, ' ')}</p>
        <p className="text-gray-400 text-xs mb-8">Document verified and ready for analysis.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setFile(null); setSuccess(null); setProgress(0); }}
            className="border border-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            Upload another
          </button>
          <button
            onClick={() => navigate(`/documents/${success._id}/analysis`)}
            className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-800"
          >
            Analyse now
          </button>
          <button
            onClick={() => navigate('/library')}
            className="border border-blue-200 text-blue-700 px-5 py-2 rounded-lg text-sm hover:bg-blue-50"
          >
            Go to library
          </button>
        </div>
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-8 max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload document</h1>
        <p className="text-gray-500 text-sm mb-1">Supported formats: PDF, DOCX — up to {MAX_MB} MB</p>
        <p className="text-xs text-gray-400 mb-8">
          Accepted: Government schemes, insurance policies, legal contracts, agreements, terms and conditions
        </p>

        <div
          onDrop={onDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => !file && !uploading && document.getElementById('file-input').click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            id="file-input"
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
          />
          {file ? (
            <div className="flex items-center gap-3 justify-center">
              <File className="h-8 w-8 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); setFile(null); setError(''); }}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div>
              <UploadIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Drop a file here or click to browse</p>
              <p className="text-gray-400 text-sm mt-1">PDF or DOCX, max {MAX_MB} MB</p>
            </div>
          )}
        </div>

        {/* Rejection / error message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-4 text-sm">
            <div className="flex gap-2 items-start">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Document not accepted</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span className="flex items-center gap-1.5">
                <Loader className="h-3 w-3 animate-spin" />
                {stage === 'classifying'
                  ? 'Verifying document type...'
                  : 'Uploading...'}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            {stage === 'classifying' && (
              <p className="text-xs text-gray-400 mt-2 text-center">
                Checking if this is a valid policy or legal document...
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="mt-6 w-full bg-blue-700 hover:bg-blue-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          {uploading
            ? <><Loader className="h-4 w-4 animate-spin" /> {stage === 'classifying' ? 'Verifying...' : 'Uploading...'}</>
            : <><UploadIcon className="h-4 w-4" /> Upload document</>
          }
        </button>
      </div>
    </AppLayout>
  );
};

export default Upload;
