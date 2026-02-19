import Taskbar from "../../components/Taskbar";
 import ModelsPanel from "../../components/ModelsPanel";
import TasksPanel from "../../components/TasksPanel";
 
 export default function Page() {
   return (
    <div className="h-screen bg-white">
      <div className="hidden md:flex h-[calc(100vh-20px)]">
         <div className="w-[70%] overflow-y-auto p-6">
          <TasksPanel />
           <h1 className="text-2xl font-semibold mb-4">Resources</h1>
           <div className="space-y-4">
             <div className="p-4 border border-gray-200 rounded-md bg-white">
               <div className="text-sm text-gray-700">Docs, links, and reference materials.</div>
             </div>
           </div>
         </div>
         <ModelsPanel />
       </div>
       <div className="md:hidden p-6">
         <div className="text-sm text-gray-600">Desktop only.</div>
       </div>
     </div>
   );
 }
