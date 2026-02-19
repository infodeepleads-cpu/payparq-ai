"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";

interface ResizableLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function ResizableLayout({ children, rightPanel }: ResizableLayoutProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [middleWidth, setMiddleWidth] = useState(400); // Default width in px
  const containerRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    setIsDragging(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isDragging && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        // Calculate width based on mouse position relative to container start (left sidebar is fixed 60px outside this)
        // This component is rendered inside a flex-1, so its left is after the sidebar.
        // Actually, we can just use the mouse X position minus the container's left.
        const newWidth = mouseMoveEvent.clientX - containerRect.left;
        
        // Min width constraints (e.g., 200px)
        if (newWidth > 200 && newWidth < containerRect.width - 300) {
          setMiddleWidth(newWidth);
        }
      }
    },
    [isDragging]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex flex-1 overflow-hidden relative w-full" ref={containerRef}>
      {/* Middle Pane */}
      <div 
        className="hidden md:block flex-shrink-0 h-full overflow-hidden bg-gray-50/50"
        style={{ width: middleWidth }}
      >
        <div className="h-full w-full overflow-y-auto scrollbar-hide">
          {children}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={`hidden md:block w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-50 flex-shrink-0 ${isDragging ? 'bg-blue-500' : 'bg-gray-200'}`}
        onMouseDown={startResizing}
      />

      {/* Right Pane (MachineIo) */}
      <div className="flex-1 h-full w-full md:min-w-[300px] overflow-hidden bg-white">
        {rightPanel}
      </div>
    </div>
  );
}
