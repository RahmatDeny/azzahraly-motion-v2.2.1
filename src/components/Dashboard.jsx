import { db } from "../firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { toast } from "react-toastify";
import moment from "moment/moment";
import { useState, useEffect } from "react";
import azzahralyLogo from "../assets/KRSTI.png";
import { SERVO_TYPES } from "../servo-types";

// ─── Icons (inline SVG) ──────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const UploadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const DownloadIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
  </svg>
);
const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);
const EyeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
);
const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const BigUploadIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const AlertIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// ─── Select Dropdown component ────────────────────────────────────────────────
function Select({ value, onChange, options, placeholder, small }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: small ? "6px 10px" : "10px 14px",
          border: "1.5px solid #e0d6c8",
          borderRadius: 8,
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontSize: small ? 12 : 14,
          color: selected ? "#333" : "#aaa",
          gap: 6,
        }}
      >
        <span style={{ flex: 1, textAlign: "left" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDownIcon />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e0d6c8", borderRadius: 10,
          zIndex: 100, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%", padding: "10px 14px", textAlign: "left",
                background: opt.value === value ? "#f59e0b" : "#fff",
                color: opt.value === value ? "#fff" : "#333",
                border: "none", cursor: "pointer", fontSize: 14,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.target.style.background = "#fef3c7"; }}
              onMouseLeave={(e) => { if (opt.value !== value) e.target.style.background = "#fff"; }}
            >
              {opt.label}
              {opt.value === value && <CheckIcon />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────
function DeleteConfirmModal({ projectName, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff", borderRadius: 18, padding: "32px 28px 24px",
          width: "100%", maxWidth: 420,
          boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 0,
          animation: "popIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>{`
          @keyframes popIn {
            from { transform: scale(0.88); opacity: 0; }
            to   { transform: scale(1);    opacity: 1; }
          }
        `}</style>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "#fef2f2", border: "2px solid #fecaca",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 18,
        }}>
          <AlertIcon />
        </div>

        {/* Teks */}
        <h3 style={{ fontSize: 20, fontWeight: 700, color: "#111", margin: "0 0 8px", textAlign: "center" }}>
          Hapus Project?
        </h3>
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 6px", textAlign: "center", lineHeight: 1.6 }}>
          Project{" "}
          <span style={{
            fontWeight: 700, color: "#ef4444",
            background: "#fef2f2", padding: "1px 8px", borderRadius: 6,
          }}>
            {projectName}
          </span>{" "}
          akan dihapus permanen.
        </p>

        {/* Tombol */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              border: "1.5px solid #e2e8f0", background: "#fff",
              color: "#64748b", fontSize: 14, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#f8fafc"}
            onMouseLeave={(e) => e.currentTarget.style.background = "#fff"}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: "11px 0", borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff", fontSize: 14, fontWeight: 700,
              cursor: "pointer", fontFamily: "inherit",
              boxShadow: "0 4px 12px rgba(239,68,68,0.35)",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 6px 18px rgba(239,68,68,0.45)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(239,68,68,0.35)";
            }}
          >
            Ya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Create New Project Modal ─────────────────────────────────────────────────
function CreateProjectModal({ onClose, onCreate }) {
  const [projectName, setProjectName] = useState("");
  const [numServos, setNumServos] = useState(15);
  const [globalServoType, setGlobalServoType] = useState("xl320");
  const [servoConfigs, setServoConfigs] = useState(
    Array.from({ length: 5 }, (_, i) => ({ id: i + 1, type: "xl320", customMin: 0, customMax: 1023 }))
  );

  useEffect(() => {
    const n = Math.max(1, Math.min(30, Number(numServos) || 1));
    setServoConfigs((prev) => {
      if (n > prev.length) {
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          id: prev.length + i + 1, type: globalServoType, customMin: 0, customMax: 1023,
        }))];
      }
      return prev.slice(0, n);
    });
  }, [numServos]);

  function applyGlobalType(type) {
    setGlobalServoType(type);
    setServoConfigs((prev) => prev.map((s) => ({ ...s, type })));
  }

  function updateServo(index, field, value) {
    setServoConfigs((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  }

  function handleSubmit() {
    if (!projectName.trim()) return alert("Please enter a project name.");
    onCreate({ projectName, servoConfigs });
    onClose();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: "#1a73e8", margin: 0 }}>Create New Project</h2>
              <p style={{ fontSize: 13, color: "#888", margin: "4px 0 0" }}>
                Set up your new robot motion project with servo configuration
              </p>
            </div>
            <button onClick={onClose} style={styles.closeBtn}><XIcon /></button>
          </div>
        </div>

        <div style={{ overflowY: "auto", maxHeight: "calc(80vh - 140px)", paddingRight: 4 }}>
          <label style={styles.label}>Project Name</label>
          <input style={styles.input} placeholder="e.g., TANJUNG GUMIRANG" value={projectName} onChange={(e) => setProjectName(e.target.value)} />

          <label style={styles.label}>Number of Servos</label>
          <input style={styles.input} type="number" min={1} max={30} value={numServos} onChange={(e) => setNumServos(e.target.value)} />

          <label style={styles.label}>Servo Type (Apply to All)</label>
          <Select value={globalServoType} onChange={applyGlobalType} options={SERVO_TYPES} />

          <label style={{ ...styles.label, marginTop: 18 }}>
            Servo IDs &amp; Types <span style={{ color: "#f59e0b", fontWeight: 400 }}>(must be unique)</span>
          </label>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 12, background: "#fafafa", border: "1.5px solid #e8e0d4", borderRadius: 10, padding: 14,
          }}>
            {servoConfigs.map((servo, index) => (
              <div key={index} style={{ background: "#fff", borderRadius: 8, border: "1.5px solid #e8e0d4", padding: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#1a73e8", fontWeight: 600, whiteSpace: "nowrap" }}>Servo {index + 1}</span>
                  <input
                    style={{ ...styles.input, margin: 0, padding: "5px 8px", fontSize: 13, flex: 1, width: "auto" }}
                    type="number" min={1} value={servo.id}
                    onChange={(e) => updateServo(index, "id", Number(e.target.value))}
                  />
                </div>
                <Select value={servo.type} onChange={(val) => updateServo(index, "type", val)} options={SERVO_TYPES} small />
                {servo.type === "custom" && (
                  <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>Min</span>
                      <input style={{ ...styles.input, margin: 0, padding: "5px 8px", fontSize: 12 }} type="number" value={servo.customMin} onChange={(e) => updateServo(index, "customMin", Number(e.target.value))} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 11, color: "#888" }}>Max</span>
                      <input style={{ ...styles.input, margin: 0, padding: "5px 8px", fontSize: 12 }} type="number" value={servo.customMax} onChange={(e) => updateServo(index, "customMax", Number(e.target.value))} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSubmit} style={styles.primaryBtn}>Create Project</button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Project Modal ─────────────────────────────────────────────────────
function ImportProjectModal({ onClose, onImport }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  function handleDrop(e) {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".json")) setFile(f);
  }

  const handleImportClick = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const text = await file.text();
      JSON.parse(text);
      await onImport(file);
    } catch (err) {
      toast.error("File JSON tidak valid");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#222", margin: 0 }}>Import Project</h2>
          <button onClick={onClose} style={styles.closeBtn}><XIcon /></button>
        </div>
        <p style={{ fontSize: 13, color: "#f59e0b", margin: "0 0 18px" }}>Select a .json file to import an existing project</p>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            border: `2px dashed ${dragging ? "#f59e0b" : "#ccc"}`, borderRadius: 12,
            padding: "40px 24px", textAlign: "center",
            background: dragging ? "#fef3c7" : "#fafafa", transition: "all 0.2s", marginBottom: 20,
          }}
        >
          <BigUploadIcon />
          {file ? (
            <p style={{ marginTop: 12, color: "#333", fontWeight: 600 }}>{file.name}</p>
          ) : (
            <p style={{ marginTop: 12, color: "#888", fontSize: 14 }}>Click to browse or drag and drop a .json file</p>
          )}
          <label style={{ display: "inline-block", marginTop: 12, padding: "8px 20px", border: "1.5px solid #ccc", borderRadius: 8, cursor: "pointer", fontSize: 14, color: "#333", background: "#fff" }}>
            Browse Files
            <input type="file" accept=".json" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleImportClick} disabled={!file || uploading} style={{ ...styles.primaryBtn, opacity: file && !uploading ? 1 : 0.6 }}>
            {uploading ? "Importing..." : <><UploadIcon /> Import Project</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
function ProjectCard({ project, onOpen, onDelete, onDownload }) {
  return (
    <div
      style={{
        background: "#fff", borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)", border: "1px solid #f0e8dc",
        transition: "box-shadow 0.2s, transform 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(245,158,11,0.18)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.07)";
        e.currentTarget.style.transform = "none";
      }}
    >
      <div style={{ height: 6, background: "linear-gradient(90deg, #f59e0b, #d97706)" }} />
      <div style={{ padding: "18px 18px 14px" }}>
        <h3 onClick={onOpen} style={{ fontSize: 18, fontWeight: 600, color: "#222", margin: "0 0 12px", cursor: "pointer" }}>
          {project.name}
        </h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <span style={styles.tag}><EyeIcon /> {project.servoCount} servos</span>
          <span style={styles.tag}><RefreshIcon /> {project.motionCount} motions</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 13, color: "#aaa", display: "flex", alignItems: "center", gap: 5 }}>
            <ClockIcon /> {project.lastModified}
          </span>
          <div style={{ display: "flex", gap: 14 }}>
            <button onClick={onDownload} style={styles.iconBtn} title="Download"><DownloadIcon /></button>
            <button
              onClick={onDelete}
              style={{ ...styles.iconBtn, color: "#ef4444" }}
              title="Hapus project"
              onMouseEnter={(e) => e.currentTarget.style.color = "#b91c1c"}
              onMouseLeave={(e) => e.currentTarget.style.color = "#ef4444"}
            >
              <TrashIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard({ handlerOpenRecentProject, handlerNewProjectCreated }) {
  const [projects, setProjects]         = useState([]);
  const [showCreate, setShowCreate]     = useState(false);
  const [showImport, setShowImport]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const projectsCollection = collection(db, "projects");

  async function loadProjects() {
    try {
      const q = query(projectsCollection, orderBy("lastModified", "desc"));
      const querySnapshot = await getDocs(q);
      const projectList = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const jsonData = data.jsonData || {};
        return {
          id: doc.id,
          name: data.name,
          lastModified: data.lastModified?.toDate() ? moment(data.lastModified.toDate()).locale("id").format("D MMMM YYYY, HH:mm:ss") : "N/A",
          servoCount: jsonData.servos?.length ?? 0,
          motionCount: jsonData.motions?.length ?? 0,
          jsonData: jsonData, // Keep full data for download/open
        }
      });
      setProjects(projectList);
    } catch (error) {
      console.error("Error loading projects: ", error);
      toast.error("Gagal memuat projects: " + error.message);
    }
  }

  useEffect(() => { loadProjects(); }, []);

  const handleCreate = async ({ projectName, servoConfigs }) => {
    if (!projectName?.trim()) { toast.error("Nama project harus diisi!"); return; }

    const cleanName = projectName.trim();
    const projectJsonData = {
      servos: servoConfigs.map(s => ({
        id: Number(s.id), type: s.type,
        servo: SERVO_TYPES.find(t => t.value === s.type)?.label.split(" (")[0] || s.type.toUpperCase(),
        ...(s.type === "custom" && { customMin: Number(s.customMin), customMax: Number(s.customMax) }),
      })),
      motions: [], idGroups: [],
      createdAt: new Date().toISOString(), version: "2.2.1",
    };

    try {
      const docRef = await addDoc(projectsCollection, {
        name: cleanName,
        lastModified: serverTimestamp(),
        jsonData: projectJsonData
      });
      toast.success(`✅ Project "${cleanName}" berhasil dibuat!`, { autoClose: 1500 });
      setShowCreate(false);
      handlerNewProjectCreated(cleanName, projectJsonData);
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat project: " + error.message);
    }
  };

  const handleImport = async (file) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text); // Validate JSON
      const cleanName = file.name.replace('.json', '');

      await addDoc(projectsCollection, {
        name: cleanName,
        lastModified: serverTimestamp(),
        jsonData: data
      });

      toast.success("✅ Project berhasil diimport!");
      setShowImport(false);
      loadProjects(); // Refresh project list
    } catch (err) {
      toast.error("File JSON tidak valid atau gagal impor.");
    }
  };

  // ✅ Tampilkan modal konfirmasi — belum hapus
  function handleDeleteClick(project) {
    setDeleteTarget(project);
  }

  // ✅ Eksekusi hapus setelah user konfirmasi
  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const projectToDelete = deleteTarget;
    setDeleteTarget(null);

    try {
      await deleteDoc(doc(db, "projects", projectToDelete.id));
      toast.success(`🗑️ Project "${projectToDelete.name}" dihapus.`, { autoClose: 2000 });
      loadProjects(); // Refresh project list
    } catch (error) {
      toast.error(error.message);
    }
  }

  function handleDownload(project) {
    try {
      const jsonString = JSON.stringify(project.jsonData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error("Gagal membuat file download: " + error.message);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e0d0ba; border-radius: 4px; }

        @keyframes ripple {
          0% { transform: scale(0); opacity: 0.6; }
          100% { transform: scale(4); opacity: 0; }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 4px 15px rgba(245,158,11,0.4); }
          50% { box-shadow: 0 4px 25px rgba(245,158,11,0.8), 0 0 40px rgba(245,158,11,0.3); }
        }

        .btn-create {
          position: relative; overflow: hidden; padding: 11px 24px;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: white; border: none; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease;
          box-shadow: 0 4px 15px rgba(245,158,11,0.4); letter-spacing: 0.01em;
        }
        .btn-create:hover { transform: translateY(-3px) scale(1.03); animation: pulse-glow 1.5s ease-in-out infinite; }
        .btn-create:active { transform: translateY(1px) scale(0.97); animation: none; }
        .btn-create .ripple-el {
          position: absolute; border-radius: 50%; background: rgba(255,255,255,0.5);
          width: 10px; height: 10px; margin-top: -5px; margin-left: -5px;
          animation: ripple 0.6s linear; pointer-events: none;
        }
        .btn-import {
          position: relative; overflow: hidden; padding: 11px 24px;
          background: #fff; color: #c97d0a; border: 2px solid #f59e0b; border-radius: 12px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 8px; font-family: inherit;
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease; letter-spacing: 0.01em;
        }
        .btn-import::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, #f59e0b, #d97706);
          opacity: 0; transition: opacity 0.25s ease; border-radius: 10px; z-index: 0;
        }
        .btn-import span, .btn-import svg { position: relative; z-index: 1; transition: color 0.25s ease; }
        .btn-import:hover { transform: translateY(-3px) scale(1.03); box-shadow: 0 8px 20px rgba(245,158,11,0.3); color: white; }
        .btn-import:hover::after { opacity: 1; }
        .btn-import:active { transform: translateY(1px) scale(0.97); }
        .btn-import .ripple-el {
          position: absolute; border-radius: 50%; background: rgba(255,255,255,0.45);
          width: 10px; height: 10px; margin-top: -5px; margin-left: -5px;
          animation: ripple 0.6s linear; pointer-events: none; z-index: 2;
        }
      `}</style>

      <div style={{
        height: "100vh", display: "flex", flexDirection: "column",
        background: "#fffdf7", fontFamily: "'Plus Jakarta Sans', sans-serif", overflow: "hidden",
      }}>
        {/* Header */}
        <header style={{ padding: "28px 48px 0", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <img src={azzahralyLogo} alt="KRSTI" style={{ width: 52, height: 52, objectFit: "contain" }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: "#c97d0a", letterSpacing: -0.5 }}>Azzahraly Motion</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#b08040" }}>Humanoid Robot Motion Editor v2.2.1</p>
          </div>
        </header>

        {/* Action buttons */}
        <div style={{ padding: "28px 48px 0", display: "flex", gap: 12, flexShrink: 0 }}>
          <button className="btn-create" onClick={(e) => {
            const btn = e.currentTarget, el = document.createElement("span");
            el.className = "ripple-el";
            const rect = btn.getBoundingClientRect();
            el.style.left = (e.clientX - rect.left) + "px"; el.style.top = (e.clientY - rect.top) + "px";
            btn.appendChild(el); setTimeout(() => el.remove(), 650); setShowCreate(true);
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, position: "relative", zIndex: 1 }}>
              <PlusIcon /> Create New Project
            </span>
          </button>
          <button className="btn-import" onClick={(e) => {
            const btn = e.currentTarget, el = document.createElement("span");
            el.className = "ripple-el";
            const rect = btn.getBoundingClientRect();
            el.style.left = (e.clientX - rect.left) + "px"; el.style.top = (e.clientY - rect.top) + "px";
            btn.appendChild(el); setTimeout(() => el.remove(), 650); setShowImport(true);
          }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><UploadIcon /></span>
            <span>Import Project</span>
          </button>
        </div>

        {/* Recent Projects */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "24px 48px 0", overflow: "hidden" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#333", margin: "0 0 16px", flexShrink: 0 }}>Recent Projects</h2>
          <div style={{ flex: 1, overflowY: "auto", paddingRight: 4, paddingBottom: 24 }}>
            {projects.length === 0 ? (
              <div style={{ color: "#bbb", textAlign: "center", padding: "60px 0", fontSize: 15 }}>
                No projects yet. Create one to get started.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20, alignContent: "start" }}>
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onOpen={() => handlerOpenRecentProject(project.id)}
                    onDelete={() => handleDeleteClick(project)}
                    onDownload={() => handleDownload(project)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <footer style={{ textAlign: "center", padding: "16px", fontSize: 12, color: "#ccc", flexShrink: 0 }}>
          Copyright © 2026 AZZAHRALY TEAM - All rights reserved.
        </footer>
      </div>

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
      {showImport && <ImportProjectModal onClose={() => setShowImport(false)} onImport={handleImport} />}

      {/* ✅ Modal konfirmasi hapus */}
      {deleteTarget && (
        <DeleteConfirmModal
          projectName={deleteTarget.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    backdropFilter: "blur(3px)", zIndex: 50,
    display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
  },
  modal: {
    background: "#fff", borderRadius: 16, padding: 28,
    width: "100%", maxWidth: 560, maxHeight: "90vh",
    boxShadow: "0 24px 60px rgba(0,0,0,0.18)", display: "flex", flexDirection: "column",
  },
  closeBtn: {
    background: "none", border: "none", cursor: "pointer", color: "#999",
    padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
  },
  label: { display: "block", fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 6, marginTop: 14 },
  input: {
    display: "block", width: "100%", padding: "10px 14px",
    border: "1.5px solid #e0d6c8", borderRadius: 8, fontSize: 14, color: "#333",
    outline: "none", marginBottom: 2, fontFamily: "inherit", transition: "border-color 0.2s",
  },
  primaryBtn: {
    padding: "10px 22px", background: "linear-gradient(135deg, #1a73e8, #1558b0)",
    color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
    cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
  },
  cancelBtn: {
    padding: "10px 20px", background: "#fff", color: "#555",
    border: "1.5px solid #ddd", borderRadius: 10, fontSize: 14, fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  },
  tag: {
    display: "inline-flex", alignItems: "center", gap: 5,
    padding: "4px 11px", background: "#fef3c7", color: "#b45309",
    border: "1px solid #fde68a", borderRadius: 20, fontSize: 12, fontWeight: 500,
  },
  iconBtn: {
    background: "none", border: "none", cursor: "pointer", color: "#aaa",
    padding: 4, borderRadius: 6, display: "flex", alignItems: "center", transition: "color 0.15s",
  },
};
