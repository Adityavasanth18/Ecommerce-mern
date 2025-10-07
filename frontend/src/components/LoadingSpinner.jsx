// frontend/src/components/LoadingSpinner.jsx
const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="relative" role="status" aria-live="polite" aria-busy="true">
        <div className="w-20 h-20 border-emerald-200 border-2 rounded-full" />
        <div className="w-20 h-20 border-emerald-500 border-t-2 animate-spin rounded-full absolute left-0 top-0" />
        <span className="sr-only">Loading</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
