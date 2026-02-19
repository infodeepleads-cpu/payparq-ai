import Taskbar from "../../components/Taskbar";
import TasksPanel from "../../components/TasksPanel";
import EspressoDashboard from "../../components/EspressoDashboard";

export default function Page() {
  return (
    <div className="h-screen bg-white">
      <div className="hidden md:flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full">
        {/* Espresso Widget Strip */}
        <EspressoDashboard />
      </div>
      <div className="md:hidden p-6">
        <div className="text-sm text-gray-600">Desktop only.</div>
      </div>
    </div>
  );
}
