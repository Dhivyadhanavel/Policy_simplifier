// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Library from './pages/Library';
import AnalysisWorkspace from './pages/AnalysisWorkspace';
import RiskAnalysis from './pages/RiskAnalysis';
import Chatbot from './pages/Chatbot';
import Comparison from './pages/Comparison';
import Report from './pages/Report';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected — user */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
          <Route path="/library" element={<PrivateRoute><Library /></PrivateRoute>} />
          <Route path="/documents/:id/analysis" element={<PrivateRoute><AnalysisWorkspace /></PrivateRoute>} />
          <Route path="/documents/:id/risk" element={<PrivateRoute><RiskAnalysis /></PrivateRoute>} />
          <Route path="/documents/:id/chat" element={<PrivateRoute><Chatbot /></PrivateRoute>} />
          <Route path="/documents/:id/report" element={<PrivateRoute><Report /></PrivateRoute>} />
          <Route path="/compare" element={<PrivateRoute><Comparison /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Protected — admin */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
