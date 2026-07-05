export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12 h-dvh">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
    </div>
  );
}
