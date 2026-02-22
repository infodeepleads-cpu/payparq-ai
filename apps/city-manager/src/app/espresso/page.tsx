import Taskbar from "../../components/Taskbar";
import TasksPanel from "../../components/TasksPanel";
import EspressoDashboard from "../../components/EspressoDashboard";

export default function Page() {
  return (
    <div className="h-screen bg-white">
      <div className="flex h-[calc(100vh-20px)] flex-col items-center overflow-y-auto w-full overflow-x-hidden">
        {/* Espresso Widget Strip */}
        <EspressoDashboard />
      </div>
    </div>
  );
}
