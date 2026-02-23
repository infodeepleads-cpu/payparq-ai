"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  pinned?: boolean;
}

export default function NoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id as string;
  
  // Use a ref to track the current ID, initialized with idParam or a new timestamp if "new"
  const noteIdRef = useRef<string>(idParam === "new" ? Date.now().toString() : idParam);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial data
  useEffect(() => {
    if (idParam && idParam !== "new") {
      const savedNotes = localStorage.getItem("cm_notes");
      if (savedNotes) {
        try {
          const notes: Note[] = JSON.parse(savedNotes);
          const note = notes.find(n => n.id === idParam);
          if (note) {
            setTitle(note.title);
            setContent(note.content);
            setPinned(!!note.pinned);
          }
        } catch (e) {
          console.error("Failed to parse notes", e);
        }
      }
    }
    setIsLoaded(true);
  }, [idParam]);

  // Auto-save effect
  useEffect(() => {
    if (!isLoaded) return;
    
    // Don't save empty new notes unless they have some content
    if (idParam === "new" && !title.trim() && !content.trim()) return;

    const saveNote = () => {
      const savedNotes = localStorage.getItem("cm_notes");
      let notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
      
      const now = new Date().toISOString();
      const currentId = noteIdRef.current;
      
      const existingIndex = notes.findIndex(n => n.id === currentId);
      
      if (existingIndex >= 0) {
        notes[existingIndex] = {
          ...notes[existingIndex],
          title,
          content,
          updatedAt: now,
          pinned
        };
      } else {
        const newNote: Note = {
          id: currentId,
          title,
          content,
          updatedAt: now,
          pinned
        };
        notes = [newNote, ...notes];
      }
      
      localStorage.setItem("cm_notes", JSON.stringify(notes));
    };

    const timeoutId = setTimeout(saveNote, 500); // Debounce save by 500ms
    return () => clearTimeout(timeoutId);
  }, [title, content, pinned, isLoaded, idParam]);

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this note?")) {
      const savedNotes = localStorage.getItem("cm_notes");
      if (savedNotes) {
        let notes: Note[] = JSON.parse(savedNotes);
        notes = notes.filter(n => n.id !== noteIdRef.current);
        localStorage.setItem("cm_notes", JSON.stringify(notes));
        router.push("/resources/notes");
      }
    }
  };

  const togglePin = () => {
    setPinned(!pinned);
  };

  return (
    <div className="h-screen bg-white flex flex-col fixed inset-0 z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-white z-10">
        <Link href="/resources/notes" className="text-black -ml-2 appearance-none !border-none !outline-none !shadow-none !ring-0 !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent transition-colors focus:ring-0" style={{ WebkitTapHighlightColor: "transparent" }}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={togglePin}
            className="text-black appearance-none !border-none !outline-none !shadow-none !ring-0 !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent transition-colors focus:ring-0"
            style={{ WebkitTapHighlightColor: "transparent" }}
            title={pinned ? "Unpin note" : "Pin note"}
          >
            <svg className="w-6 h-6" fill={pinned ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>

          <button 
            onClick={handleDelete}
            className="text-black appearance-none !border-none !outline-none !shadow-none !ring-0 !bg-transparent hover:!bg-transparent active:!bg-transparent focus:!bg-transparent transition-colors focus:ring-0"
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col pl-6 pr-8 pb-8 overflow-y-auto bg-white">
        <input
          type="text"
          placeholder="Title"
          className="text-xl font-serif font-bold mb-4 outline-none placeholder-gray-500 w-full bg-transparent border-none focus:ring-0 px-0 tracking-tight text-black"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Start typing..."
          className="flex-1 resize-none outline-none placeholder-gray-500 w-full text-base bg-transparent leading-relaxed border-none focus:ring-0 px-0 text-black font-light"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>
    </div>
  );
}
