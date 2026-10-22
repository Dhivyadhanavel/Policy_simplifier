import { useParams, Link } from "react-router-dom";
import { Download, ArrowLeft } from "lucide-react";
import AppLayout from "../components/AppLayout";

const Report = () => {
  const { id } = useParams();

  const handleDownload = () => {
    const token = localStorage.getItem("lexiclear_token");
    fetch(`/api/documents/${id}/report`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) return res.json().then((e) => Promise.reject(e.error || "Download failed"));
        return res.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lexiclear-report-${id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((err) => alert(err));
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-md mx-auto text-center mt-16">
        <Download className="h-12 w-12 text-blue-200 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Download Report</h1>
        <p className="text-gray-500 text-sm mb-8">
          Your analysis report will be downloaded as a PDF file.
        </p>
        <button
          onClick={handleDownload}
          className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-xl inline-flex items-center gap-2 text-sm transition-colors"
        >
          <Download className="h-4 w-4" /> Download PDF Report
        </button>
        <div className="mt-4">
          <Link
            to={`/documents/${id}/analysis`}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1.5 justify-center"
          >
            <ArrowLeft className="h-4 w-4" /> Back to analysis
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

export default Report;
