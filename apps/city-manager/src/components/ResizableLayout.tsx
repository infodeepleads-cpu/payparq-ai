"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";

interface ResizableLayoutProps {
  children: React.ReactNode;
  rightPanel: React.ReactNode;
}

export default function ResizableLayout({ children, rightPanel }: ResizableLayoutProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [middleWidth, setMiddleWidth] = useState(400); // Default width in px
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isRoot = pathname === "/" || pathname === "" || pathname === null;

  useEffect(() => {
    console.log("ResizableLayout debug:", { pathname, isRoot });
  }, [pathname, isRoot]);

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
    <div className="flex flex-1 overflow-hidden relative" ref={containerRef}>
      {/* Middle Pane - Hidden on mobile if on root (chat view), otherwise full width */}
      <div 
        className={`${isRoot ? 'hidden md:block' : 'block w-full md:w-auto'} flex-shrink-0 h-full overflow-hidden bg-gray-50/50`}
        style={{ width: undefined }} // Let CSS control width on mobile (w-full), on desktop use JS width
      >
        <div 
          className="h-full w-full overflow-y-auto overflow-x-hidden scrollbar-hide"
          style={{ width: isRoot ? undefined : '100%' }} // Ensure full width on mobile
        >
          {/* Apply width only on desktop to allow resizing */}
          <div className="md:block min-h-full w-full md:w-[var(--middle-width)]" style={{ '--middle-width': `${middleWidth}px` } as React.CSSProperties}>
            <div className="max-w-3xl w-full mx-auto px-0 md:px-0 overflow-x-hidden">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Resize Handle - Only visible on desktop */}
      <div
        className={`hidden md:block w-1 cursor-col-resize hover:bg-blue-400 transition-colors z-40 flex-shrink-0 ${isDragging ? 'bg-blue-500' : 'bg-gray-200'}`}
        onMouseDown={startResizing}
      />

      {/* Right Pane (MachineIo) - Visible on mobile only if on root, always visible on desktop */}
      <div className={`${!isRoot ? 'hidden md:block' : 'block'} flex-1 h-full md:min-w-[300px] overflow-hidden bg-white`}>
        {rightPanel}
      </div>
    </div>
  );
}
