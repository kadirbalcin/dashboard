"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Moon, Sun, Cpu, Activity } from "lucide-react";

axios.defaults.baseURL = "https://monitor.retodi.com"; // backend baseURL
axios.defaults.headers.post["Content-Type"] = "application/json";

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState<any>({
    system: { cpu: 0, ram: 0 },
    processes: {},
    projects: [],
  });
  const [selectedProject, setSelectedProject] = useState<any>(null);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // SSE bağlantısı
  useEffect(() => {
    const es = new EventSource("https://monitor.retodi.com/events");
    es.onmessage = (e) => setStatus(JSON.parse(e.data));
    es.onerror = () => console.log("SSE reconnecting...");
    return () => es.close();
  }, []);

  const sendAction = async (name: string, action: "start" | "stop" | "restart") => {
    try {
      const res = await axios.post(`/${action}`, { name });
      console.log(res.data);
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Manager Panel</h1>

        <nav className="flex flex-col gap-2">
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Dashboard
          </button>
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Projects
          </button>
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Logs
          </button>
        </nav>

        <button
          onClick={() => setDark(!dark)}
          className="mt-auto p-2 flex items-center gap-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          {dark ? <Sun /> : <Moon />}
          {dark ? "Light Mode" : "Dark Mode"}
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 p-10">
        {/* CPU / RAM */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">CPU Usage</h2>
              <Cpu />
            </div>
            <p className="text-4xl font-bold mt-2">{status.system.cpu}%</p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">RAM Usage</h2>
              <Activity />
            </div>
            <p className="text-4xl font-bold mt-2">{status.system.ram}%</p>
          </div>
        </div>

        {/* Projects */}
        <h2 className="text-2xl font-bold mb-4">Projects</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {status.projects.map((proj: any) => {
            const proc = status.processes[proj.name];
            const running = proc?.isRunning;

            return (
              <div
                key={proj.name}
                className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow hover:shadow-xl transition cursor-pointer"
                onClick={() => setSelectedProject(proj)}
              >
                <h3 className="text-xl font-semibold">{proj.name}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{proj.path}</p>

                <div className="mt-3">
                  {running ? (
                    <span className="px-3 py-1 bg-green-200 text-green-700 rounded">
                      Running (PID {proc.pid})
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-200 text-red-700 rounded">
                      Stopped
                    </span>
                  )}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendAction(proj.name, "start");
                    }}
                  >
                    Start
                  </button>

                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendAction(proj.name, "stop");
                    }}
                  >
                    Stop
                  </button>

                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendAction(proj.name, "restart");
                    }}
                  >
                    Restart
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Log Modal */}
        {selectedProject && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[800px] h-[500px] bg-neutral-900 text-green-400 rounded-xl p-6 flex flex-col shadow-2xl border border-neutral-700">
              <h2 className="text-2xl font-bold mb-2">{selectedProject.name} Logs</h2>

              <div className="flex-1 overflow-auto bg-black/40 rounded p-3">
                {(status.processes[selectedProject.name]?.stdout || []).map(
                  (line: any, i: any) => (
                    <pre key={i} className="whitespace-pre-wrap">
                      {line}
                    </pre>
                  )
                )}
              </div>

              <button
                onClick={() => setSelectedProject(null)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
