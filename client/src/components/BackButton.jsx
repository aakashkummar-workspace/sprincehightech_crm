import { useNavigate } from 'react-router-dom';

// Shared "go back" control using browser history — used by detail pages
// that build their own custom header instead of PageHeader (which has the
// same back button built in for list pages).
export default function BackButton({ className = '' }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(-1)}
      aria-label="Go back"
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/60 hover:text-gray-800 ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 9.5H16a1 1 0 110 2H8.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    </button>
  );
}
