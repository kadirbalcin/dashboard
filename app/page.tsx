"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Moon, Sun, Cpu, Activity, Edit } from "lucide-react";

axios.defaults.baseURL = "https://monitor.retodi.com";
axios.defaults.headers.post["Content-Type"] = "application/json";

interface Project {
  name: string;
  path: string;
  command: string;
}

export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [status, setStatus] = useState<any>({
    system: { cpu: 0, ram: 0 },
    processes: {},
    projects: [],
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    path: "",
    command: "",
  });

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

  const sendAction = async (
    name: string,
    action: "start" | "stop" | "restart"
  ) => {
    try {
      const res = await axios.post(`/${action}`, { name });
      console.log(res.data);
    } catch (err) {
      console.error("İşlem hatası:", err);
    }
  };

  const addProject = async () => {
    if (!newProject.name || !newProject.path || !newProject.command)
      return alert("Tüm alanları doldurun!");
    try {
      const res = await axios.post("/addProject", newProject);
      console.log(res.data);
      setNewProject({ name: "", path: "", command: "" });
    } catch (err) {
      console.error("Proje ekleme hatası:", err);
    }
  };

  const updateProject = async () => {
    if (!editProject) return;
    try {
      // Backend’de güncelleme endpoint yok, basitçe önce stop, sonra yeniden add
      await axios.post("/stop", { name: editProject.name });
      await axios.post("/addProject", editProject);
      setEditProject(null);
    } catch (err) {
      console.error("Proje güncelleme hatası:", err);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-neutral-800 border-r border-neutral-200 dark:border-neutral-700 p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold">Monitor Paneli</h1>

        <nav className="flex flex-col gap-2">
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Panel
          </button>
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Projeler
          </button>
          <button className="p-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700">
            Loglar
          </button>
        </nav>

        <button
          onClick={() => setDark(!dark)}
          className="mt-auto p-2 flex items-center gap-2 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700"
        >
          {dark ? <Sun /> : <Moon />}
          {dark ? "Açık Mod" : "Koyu Mod"}
        </button>
      </aside>

      {/* Content */}
      <div className="flex-1 p-10">
        {/* CPU / RAM */}
        <div className="grid grid-cols-2 gap-6 mb-10">
          <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">CPU Kullanımı</h2>
              <Cpu />
            </div>
            <p className="text-4xl font-bold mt-2">
              {status.system?.cpu ?? 0}%
            </p>
          </div>

          <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">RAM Kullanımı</h2>
              <Activity />
            </div>
            <p className="text-4xl font-bold mt-2">
              {status.system?.ram ?? 0}%
            </p>
          </div>
        </div>

        {/* Yeni Proje Ekle */}
        <div className="mb-8 p-6 bg-white dark:bg-neutral-800 rounded-xl shadow flex flex-col gap-3">
          <h2 className="text-xl font-bold mb-2">Yeni Proje Ekle</h2>
          <input
            type="text"
            placeholder="Proje Adı"
            value={newProject.name}
            onChange={(e) =>
              setNewProject({ ...newProject, name: e.target.value })
            }
            className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
          />
          <input
            type="text"
            placeholder="Proje Yolu"
            value={newProject.path}
            onChange={(e) =>
              setNewProject({ ...newProject, path: e.target.value })
            }
            className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
          />
          <input
            type="text"
            placeholder="Başlatma Komutu"
            value={newProject.command}
            onChange={(e) =>
              setNewProject({ ...newProject, command: e.target.value })
            }
            className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
          />
          <button
            onClick={addProject}
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Ekle
          </button>
        </div>

        {/* Projeler */}
        <h2 className="text-2xl font-bold mb-4">Projeler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {status.projects.map((proj: Project) => {
            const proc = status.processes[proj.name];
            const running = proc?.isRunning;

            return (
              <div
                key={proj.name}
                className="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow hover:shadow-xl transition cursor-pointer"
                onClick={() => setSelectedProject(proj)}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{proj.name}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(proj);
                    }}
                    className="p-1 bg-yellow-400 dark:bg-yellow-600 rounded hover:bg-yellow-500"
                  >
                    <Edit size={16} />
                  </button>
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {proj.path}
                </p>

                <div className="mt-3">
                  {running ? (
                    <span className="px-3 py-1 bg-green-200 text-green-700 rounded">
                      Çalışıyor (PID {proc.pid})
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-red-200 text-red-700 rounded">
                      Durdu
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
                    Başlat
                  </button>
                  <button
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendAction(proj.name, "stop");
                    }}
                  >
                    Durdur
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendAction(proj.name, "restart");
                    }}
                  >
                    Yeniden Başlat
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
              <h2 className="text-2xl font-bold mb-2">
                {selectedProject.name} Logları
              </h2>

              <div className="flex-1 overflow-auto bg-black/40 rounded p-3">
                {(status.processes[selectedProject.name]?.stdout || []).map(
                  (line, i) => (
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
                Kapat
              </button>
            </div>
          </div>
        )}

        {/* Düzenleme Modal */}
        {editProject && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <div className="w-[600px] p-6 bg-white dark:bg-neutral-800 rounded-xl flex flex-col gap-3 shadow-xl">
              <h2 className="text-xl font-bold">
                Projeyi Düzenle: {editProject.name}
              </h2>
              <input
                type="text"
                value={editProject.name}
                onChange={(e) =>
                  setEditProject({ ...editProject, name: e.target.value })
                }
                className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
              />
              <input
                type="text"
                value={editProject.path}
                onChange={(e) =>
                  setEditProject({ ...editProject, path: e.target.value })
                }
                className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
              />
              <input
                type="text"
                value={editProject.command}
                onChange={(e) =>
                  setEditProject({ ...editProject, command: e.target.value })
                }
                className="p-2 rounded border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                  onClick={() => setEditProject(null)}
                >
                  İptal
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={updateProject}
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
