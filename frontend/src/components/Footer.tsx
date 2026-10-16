import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-md bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-[10px]">⚡</span>
          <span>Smart Electronic Vehicle Charging Management System — academic demo project. Charging data is simulated.</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="hover:text-slate-800">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-slate-800">Terms &amp; Conditions</Link>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-800"
          >
            © OpenStreetMap contributors
          </a>
        </div>
      </div>
    </footer>
  );
}
