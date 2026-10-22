import { Link } from 'react-router-dom';
import { Scale, FileText, Shield, MessageSquare, ArrowRight, Upload, Brain, Download } from 'lucide-react';

const Landing = () => (
  <div className="min-h-screen bg-white">
    {/* Nav */}
    <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Scale className="h-7 w-7 text-blue-700" />
        <span className="text-xl font-bold text-gray-900">LexiClear</span>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Sign in</Link>
        <Link to="/register" className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">Get started</Link>
      </div>
    </nav>

    {/* Hero */}
    <div className="max-w-5xl mx-auto px-6 py-20 text-center">
      <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
        <Brain className="h-4 w-4" /> Powered by Google Gemini AI
      </div>
      <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
        Understand any legal document<br />in plain English
      </h1>
      <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
        Upload PDF or DOCX contracts, policies, and agreements. LexiClear breaks them down into clear summaries, flags risks, and answers your questions — in English or Tamil.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link to="/register" className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg flex items-center gap-2 transition-colors">
          Start for free <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium px-6 py-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          Sign in
        </Link>
      </div>
    </div>

    {/* How it works */}
    <div className="bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Upload className="h-7 w-7 text-blue-700" />, step: '1', title: 'Upload your document', desc: 'Drag and drop a PDF or DOCX file. Supports contracts, leases, terms of service, and any legal agreement.' },
            { icon: <Brain className="h-7 w-7 text-blue-700" />, step: '2', title: 'AI analysis', desc: 'Gemini reads the full document, identifies clauses, flags risks, and builds a plain-English summary.' },
            { icon: <Download className="h-7 w-7 text-blue-700" />, step: '3', title: 'Review and download', desc: 'Browse the analysis, ask follow-up questions, and download a PDF report to keep or share.' },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-50 rounded-xl p-2">{icon}</div>
                <span className="text-3xl font-bold text-gray-100">{step}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Features */}
    <div className="max-w-5xl mx-auto py-20 px-6">
      <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What LexiClear gives you</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {[
          { icon: <FileText className="h-5 w-5" />, title: 'Plain-English summaries', desc: 'Every section explained in simple language — no legal degree required.' },
          { icon: <Shield className="h-5 w-5" />, title: 'Risk analysis', desc: 'Flags clauses that may deserve extra attention, with risk levels and suggested questions.' },
          { icon: <MessageSquare className="h-5 w-5" />, title: 'Ask questions', desc: 'Chat directly about the document. Get answers grounded in the actual text.' },
          { icon: <Scale className="h-5 w-5" />, title: 'Tamil support', desc: 'Switch between English and Tamil for summaries, clause explanations, and answers.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4 p-5 border border-gray-100 rounded-xl hover:border-blue-100 hover:bg-blue-50/30 transition-colors">
            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg shrink-0">{icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-gray-500 text-sm">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="py-20 px-6 text-center" style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}>
      <h2 className="text-3xl font-bold text-white mb-4">Ready to understand your documents?</h2>
      <p className="text-blue-200 mb-8">Free to start. No credit card required.</p>
      <Link to="/register" className="bg-white text-blue-700 hover:bg-blue-50 font-semibold px-8 py-3 rounded-lg inline-flex items-center gap-2 transition-colors">
        Create free account <ArrowRight className="h-4 w-4" />
      </Link>
    </div>

    {/* Footer */}
    <footer className="py-8 px-6 border-t border-gray-100 text-center text-sm text-gray-400">
      <p>LexiClear is an AI tool for informational purposes only and does not provide legal advice.</p>
    </footer>
  </div>
);

export default Landing;
