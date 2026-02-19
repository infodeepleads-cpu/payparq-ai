"use client";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
      <div className="mb-4">
        <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
      <p className="text-sm mt-1">Choose a chat from the sidebar or start a new one.</p>
    </div>
  );
}
