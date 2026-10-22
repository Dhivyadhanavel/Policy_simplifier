import { Link } from "react-router-dom";
import { Scale, ArrowLeft } from "lucide-react";

const NotFound = () => (
  <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
    <Scale className="h-12 w-12 text-blue-200 mb-4" />
    <h1 className="text-7xl font-bold text-gray-200 mb-4">404</h1>
    <h2 className="text-xl font-semibold text-gray-900 mb-2">Page not found</h2>
    <p className="text-gray-500 text-sm mb-8">The page you are looking for does not exist or has been moved.</p>
    <Link to="/dashboard" className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
      <ArrowLeft className="h-4 w-4" /> Back to dashboard
    </Link>
  </div>
);

export default NotFound;
