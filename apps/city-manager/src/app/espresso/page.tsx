import Taskbar from "../../components/Taskbar";
import ModelsPanel from "../../components/ModelsPanel";
import TasksPanel from "../../components/TasksPanel";
import EspressoDashboard from "../../components/EspressoDashboard";

export default function Page() {
  return (
    <div className="h-screen bg-white">
      <Taskbar />
      <div className="hidden md:flex h-[calc(100vh-20px)]">
        <div className="w-[70%] overflow-y-auto p-6">
          <TasksPanel />
          <EspressoDashboard />
        </div>
        <ModelsPanel />
      </div>
      <div className="md:hidden p-6">
        <div className="text-sm text-gray-600">Desktop only.</div>
      </div>
    </div>
  );
}
