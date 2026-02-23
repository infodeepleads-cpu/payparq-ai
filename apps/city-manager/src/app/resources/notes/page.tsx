"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned?: boolean;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const savedNotes = localStorage.getItem("cm_notes");
    if (savedNotes) {
      try {
        const parsedNotes: Note[] = JSON.parse(savedNotes);
        // Sort notes: Pinned first, then by updatedAt descending
        const sortedNotes = parsedNotes.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });
        setNotes(sortedNotes);
      } catch (e) {
        console.error("Failed to parse notes", e);
      }
    }
  }, []);

  return (
    <div className="h-screen bg-white overflow-y-auto overflow-x-hidden relative flex flex-col">
      <div className="w-full mx-auto px-4 pt-4 pb-32 flex-1">
        <div className="flex items-center justify-between mb-6 pb-2 sticky top-0 bg-white z-10 relative h-12">
          <Link href="/resources" className="absolute left-0 text-gray-500 -ml-2 hover:text-gray-900 transition-colors flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="w-full text-center flex items-center justify-center h-full">
            <span className="text-sm font-bold tracking-tight text-black uppercase relative -top-[4px]">Notes</span>
          </div>
           <div className="w-6"></div>
        </div>

        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            <p className="text-sm">No notes yet. Create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {notes.map((note) => (
              <Link
                key={note.id}
                href={`/resources/notes/${note.id}`}
                className="block h-full no-underline hover:no-underline focus:no-underline visited:no-underline outline-none focus:outline-none decoration-transparent"
                style={{ textDecoration: "none", WebkitTapHighlightColor: "transparent" }}
              >
                <div className={`border rounded-lg py-3 pl-2 pr-4 h-40 overflow-hidden hover:shadow-md transition-shadow flex flex-col bg-white relative group ${note.pinned ? 'border-black' : 'border-gray-200'}`}>
                  {note.pinned && (
                    <div className="absolute top-2 right-2 text-black">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </div>
                  )}
                  <h3 className="font-bold text-sm mb-1 truncate text-gray-900 pr-6">{note.title || "Untitled"}</h3>
                  <p className="text-xs text-gray-600 line-clamp-6 whitespace-pre-wrap flex-1">{note.content}</p>
                  <div className="text-[10px] text-gray-400 mt-2 text-right">
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link 
        href="/resources/notes/new"
        aria-label="Create new note"
        className="fixed bottom-24 right-6 bg-black text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition-colors z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </Link>
    </div>
  );
}
