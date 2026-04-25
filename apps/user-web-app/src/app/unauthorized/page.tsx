export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403 - Unauthorized</h1>
        <p className="text-gray-600 mb-6">You don't have access to this page.</p>
        <a
          href="/"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
