import React, { useState, useEffect } from "react";
import { SERVO_TYPES_SIDEBAR as SERVO_TYPES } from "../servo-types";
import appLogo from "../assets/logo.png";
import azzahralyLogo from "../assets/KRSTI.png";
import unesaLogo from "../assets/unesa.png";
import dewoLogo from "../assets/dewo.png";
import { FaPlus } from "react-icons/fa";
import { IoFolderOpen } from "react-icons/io5";
import { BsInfoCircleFill } from "react-icons/bs";
import { MdMenuBook } from "react-icons/md";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";



// ─── Dropdown Tipe Servo ──────────────────────────────────────────────────────
function ServoTypeSelect({ value, onChange, small }) {
  const [open, setOpen] = useState(false);
  const sel = SERVO_TYPES.find(o => o.value === value);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div style={{ position: "relative" }} onMouseDown={e => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        style={{
          width: "100%",
          padding: small ? "5px 10px" : "9px 13px",
          border: "1.5px solid #2a3f58",
          borderRadius: 8,
          background: "#0a1628",
          color: sel ? "#e2e8f0" : "#64748b",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: "pointer", fontSize: small ? 12 : 13,
          fontFamily: "'Outfit', sans-serif", gap: 6,
        }}
      >
        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {sel?.label ?? "Pilih tipe"}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          style={{ flexShrink: 0, color: "#64748b", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#0d1e30", border: "1.5px solid #2a3f58", borderRadius: 10,
          zIndex: 9999, boxShadow: "0 12px 32px rgba(0,0,0,0.6)", overflow: "hidden",
        }}>
          {SERVO_TYPES.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              style={{
                width: "100%", padding: "9px 13px", textAlign: "left",
                background: opt.value === value ? "rgba(245,158,11,0.2)" : "transparent",
                color: opt.value === value ? "#fbbf24" : "#94a3b8",
                border: "none", cursor: "pointer", fontSize: 13,
                fontFamily: "'Outfit', sans-serif",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {opt.label}
              {opt.value === value && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL NEW PROJECT
// ══════════════════════════════════════════════════════════════════════════════
function NewProjectModal({ onClose, onCreated }) {
  const [namaProject, setNamaProject] = useState("");
  const [jumlahServo, setJumlahServo]  = useState(15);
  const [tipeGlobal, setTipeGlobal]    = useState("xl320");
  const [servoConfig, setServoConfig]  = useState(
    Array.from({ length: 5 }, (_, i) => ({ id: i + 1, type: "xl320", customMin: 0, customMax: 1023 }))
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const n = Math.max(1, Math.min(30, Number(jumlahServo) || 1));
    setServoConfig(prev => {
      if (n > prev.length)
        return [...prev, ...Array.from({ length: n - prev.length }, (_, i) => ({
          id: prev.length + i + 1, type: tipeGlobal, customMin: 0, customMax: 1023,
        }))];
      return prev.slice(0, n);
    });
  }, [jumlahServo]);

  function terapkanTipeGlobal(tipe) {
    setTipeGlobal(tipe);
    setServoConfig(prev => prev.map(s => ({ ...s, type: tipe })));
  }

  function updateServo(idx, field, val) {
    setServoConfig(prev => prev.map((s, i) => i === idx ? { ...s, [field]: val } : s));
  }

  async function handleBuatProject() {
    if (!namaProject.trim()) { toast("Nama project harus diisi!"); return; }

    const ids = servoConfig.map(s => Number(s.id));
    if (new Set(ids).size !== ids.length) { toast("ID servo harus unik!"); return; }

    setLoading(true);
    const cleanName = namaProject.trim();
    const projectData = {
      servos: servoConfig.map(s => ({
        id: Number(s.id),
        type: s.type,
        servo: SERVO_TYPES.find(t => t.value === s.type)?.label.split(" (")[0] || s.type.toUpperCase(),
        ...(s.type === "custom" && { customMin: Number(s.customMin), customMax: Number(s.customMax) }),
      })),
      motions: [],
      idGroups: [],
      createdAt: new Date().toISOString(),
      version: "2.2.1",
    };

    try {
      const projectsCollection = collection(db, "projects");
      await addDoc(projectsCollection, {
        name: cleanName,
        jsonData: projectData,
        lastModified: serverTimestamp(),
      });
      toast.success(`✅ Project "${cleanName}" berhasil dibuat!`);
      onCreated?.(cleanName, projectData);
      onClose();
    } catch (err) {
      toast.error("Gagal membuat project: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", padding: "10px 14px",
    border: "1.5px solid #1e3650",
    borderRadius: 10, background: "rgba(255,255,255,0.04)",
    color: "#e2e8f0", fontSize: 13, fontFamily: "'Outfit', sans-serif",
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(5,12,24,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d1b2a",
        border: "1.5px solid rgba(245,158,11,0.25)",
        borderRadius: 20,
        width: "100%", maxWidth: 620,
        maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden",
        fontFamily: "'Outfit', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FaPlus size={16} color="white" />
            <div style={{ color: "white", fontWeight: 700, fontSize: 18 }}>Create New Project</div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
            color: "white", width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 24px 8px" }}
          className="slim-scroll-dark">

          <div style={{ display: "flex", gap: 14, marginBottom: 18 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>
                Nama Project
              </label>
              <input
                type="text"
                placeholder="cth. TARI-SAMAN"
                value={namaProject}
                onChange={e => setNamaProject(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                onBlur={e => e.target.style.borderColor = "#1e3650"}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>
                Jumlah Servo
              </label>
              <input
                type="number" min={1} max={30}
                value={jumlahServo}
                onChange={e => setJumlahServo(e.target.value)}
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(245,158,11,0.6)"}
                onBlur={e => e.target.style.borderColor = "#1e3650"}
              />
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 7 }}>
              Tipe Servo (Terapkan ke Semua)
            </label>
            <ServoTypeSelect value={tipeGlobal} onChange={terapkanTipeGlobal} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em", display: "block", marginBottom: 10 }}>
              ID & Tipe Servo{" "}
              <span style={{ color: "#f59e0b", fontWeight: 400, textTransform: "none" }}>(harus unik)</span>
            </label>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: 10,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(56,189,248,0.1)",
              borderRadius: 12, padding: 14,
            }}>
              {servoConfig.map((servo, idx) => (
                <div key={idx} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(56,189,248,0.12)",
                  borderRadius: 10, padding: 10,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#38bdf8", fontWeight: 700, whiteSpace: "nowrap" }}>
                      Servo {idx + 1}
                    </span>
                    <input
                      type="number" min={1}
                      value={servo.id}
                      onChange={e => updateServo(idx, "id", Number(e.target.value))}
                      style={{ ...inputStyle, padding: "5px 8px", fontSize: 13, flex: 1, width: "auto" }}
                    />
                  </div>

                  <ServoTypeSelect
                    value={servo.type}
                    onChange={val => updateServo(idx, "type", val)}
                    small
                  />

                  {servo.type === "custom" && (
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>Min</span>
                        <input type="number" value={servo.customMin}
                          onChange={e => updateServo(idx, "customMin", Number(e.target.value))}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontSize: 10, color: "#64748b" }}>Max</span>
                        <input type="number" value={servo.customMax}
                          onChange={e => updateServo(idx, "customMax", Number(e.target.value))}
                          style={{ ...inputStyle, padding: "5px 8px", fontSize: 12 }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px 20px",
          display: "flex", justifyContent: "flex-end", gap: 10,
          borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 20px", borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent", color: "#64748b",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}>Batal</button>
          <button
            onClick={handleBuatProject}
            disabled={loading}
            style={{
              padding: "9px 24px", borderRadius: 10, border: "none",
              background: loading ? "#374151" : "linear-gradient(135deg, #f59e0b, #d97706)",
              color: "white", fontSize: 13, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Outfit', sans-serif",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <FaPlus size={11} />
            {loading ? "Menyimpan..." : "Create Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL ABOUT APP
// ══════════════════════════════════════════════════════════════════════════════
function AboutAppModal({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 99999,
      background: "rgba(5,12,24,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0d1b2a",
        border: "1.5px solid rgba(16,185,129,0.25)",
        borderRadius: 20, width: "100%", maxWidth: 640,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        overflow: "hidden", fontFamily: "'Outfit', sans-serif",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 24px 14px",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <BsInfoCircleFill size={18} color="white" />
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Tentang Aplikasi</span>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 8,
            color: "white", width: 32, height: 32, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
          }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px 8px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <img src={unesaLogo} alt="Unesa" style={{ height: 76, flexShrink: 0, objectFit: "contain" }} />
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.75, textAlign: "justify", margin: 0 }}>
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>Azzahraly Motion Apps</span> adalah perangkat lunak
              untuk membuat gerakan pada robot tari humanoid. Aplikasi ini memiliki{" "}
              <span style={{ color: "#fbbf24", fontWeight: 700 }}>12 Fitur</span> utama yaitu{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 600 }}>
                Dashboard, New Project, Import Project, New Motion, Add Motion, Delete Motion,
                Save Project, Play Motion, Stop Motion, Connect Robot
              </span>{" "}
              dan <span style={{ color: "#e2e8f0", fontWeight: 600 }}>Download Project.</span>
            </p>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <p style={{ fontSize: 13.5, color: "#94a3b8", lineHeight: 1.75, textAlign: "justify", margin: 0, flex: 1 }}>
              Aplikasi ini adalah karya mahasiswa{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>DEWO ROBOTIK</span>{" "}
              Fakultas Teknik{" "}
              <span style={{ color: "#e2e8f0", fontWeight: 700 }}>Universitas Negeri Surabaya.</span>{" "}
              Aplikasi ini dibuat untuk membantu Tim Azzahraly membuat gerakan tari pada robot tari humanoid.
              Terinspirasi dari aplikasi RoboPlus 1.0 milik Robotis, dan merupakan generasi kedua dari
              aplikasi sebelumnya.
            </p>
            <img src={dewoLogo} alt="Dewo Robotik" style={{ height: 76, flexShrink: 0, objectFit: "contain" }} />
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />

          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <img src={azzahralyLogo} alt="Azzahraly" style={{ height: 76, flexShrink: 0, objectFit: "contain" }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#e2e8f0" }}>Azzahraly Motion Apps</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#22c55e", boxShadow: "0 0 6px #22c55e", display: "inline-block",
                }} />
                <span style={{ fontSize: 13, color: "#64748b" }}>Versi 2.2.1</span>
              </div>
              <span style={{ fontSize: 13, color: "#64748b" }}>
                Copyright © 2026{" "}
                <span style={{ color: "#94a3b8", fontWeight: 600 }}>AZZAHRALY.</span>{" "}
                Hak cipta dilindungi.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "16px 24px 20px",
          display: "flex", justifyContent: "flex-end",
          borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 16,
        }}>
          <button onClick={onClose} style={{
            padding: "9px 24px", borderRadius: 10,
            background: "rgba(239,68,68,0.12)", color: "#f87171",
            fontSize: 13, fontWeight: 600, cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
            border: "1px solid rgba(239,68,68,0.25)",
          }}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR UTAMA
// ══════════════════════════════════════════════════════════════════════════════
export default function Sidebar({
  handlerNewProject,
  handlerOpenProject,
  handlerAbout,
  isEditMode = false,
  onNewProjectCreated,
}) {
  const [collapsed, setCollapsed]           = useState(false);
  const [aktif, setAktif]                   = useState(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showAbout, setShowAbout]           = useState(false);

  let dataImport    = "";
  let importFileName = "";

  function handlerImportProject(event) {
    const file = event.target.files[0];
    importFileName = file.name;
    const reader = new FileReader();
    reader.addEventListener("load", (res) => {
      dataImport = JSON.parse(res.target.result);
      const ok = dataImport.hasOwnProperty("servos")
              && dataImport.hasOwnProperty("motions")
              && dataImport.hasOwnProperty("idGroups");
      const el = document.getElementById("message_import_project");
      if (el) {
        el.hidden = false;
        el.innerHTML = ok
          ? "<span style='color:#4ade80'>✓ File bisa diimport</span>"
          : "<span style='color:#f87171'>✗ File tidak valid</span>";
      }
    });
    reader.readAsText(file);
  }

  function handlerImportButton() {
    if (dataImport === "") { toast("Pilih file terlebih dahulu"); return; }
    const projectsCollection = collection(db, "projects");
    addDoc(projectsCollection, {
      name: importFileName.replace(".json", ""),
      jsonData: dataImport,
      lastModified: serverTimestamp(),
    }).then(() => window.location.reload())
      .catch(err => toast(String(err)));
  }

  const menuItems = [
    {
      id: 1,
      label: "New Project",
      icon: <FaPlus size={15} />,
      action: () => {
        setAktif(1);
        if (isEditMode) {
          setShowNewProject(true);
        } else {
          document.getElementById("modal_new_project")?.showModal();
          handlerNewProject?.();
        }
      },
    },
    {
      id: 2,
      label: "Import Project",
      icon: <IoFolderOpen size={17} />,
      action: () => {
        setAktif(2);
        document.getElementById("modal_import_project")?.showModal();
        handlerOpenProject?.();
      },
    },
    {
      id: 3,
      label: "About App",
      icon: <BsInfoCircleFill size={15} />,
      action: () => {
        setAktif(3);
        if (isEditMode) {
          setShowAbout(true);
        } else {
          document.getElementById("modal_about")?.showModal();
          handlerAbout?.();
        }
      },
    },
    {
      id: 4,
      label: "User Guide",
      icon: <MdMenuBook size={17} />,
      action: () => {
        setAktif(4);
        document.getElementById("modal_user_guide")?.showModal();
      },
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

        .sidebar-root {
          font-family: 'Outfit', sans-serif;
          height: 100vh;
          background: #0d1b2a;
          display: flex;
          flex-direction: column;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
          position: relative;
          border-right: 1px solid rgba(255,255,255,0.06);
          box-shadow: 4px 0 24px rgba(0,0,0,0.35);
        }
        .sidebar-root.expanded { width: 220px; }
        .sidebar-root.collapsed { width: 60px; }

        .sidebar-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0; min-height: 68px;
        }
        .sidebar-logo { height: 30px; width: auto; object-fit: contain; flex-shrink: 0; }
        .sidebar-root.collapsed .sidebar-logo { height: 32px; width: 36px; object-fit: cover; object-position: left center; }
        .sidebar-toggle {
          width: 28px; height: 28px; border-radius: 7px; border: none;
          background: rgba(255,255,255,0.07); color: #64748b; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s, color 0.15s; flex-shrink: 0;
        }
        .sidebar-toggle:hover { background: rgba(255,255,255,0.14); color: #e2e8f0; }
        .sidebar-header-collapsed {
          display: flex; flex-direction: column; align-items: center;
          padding: 14px 8px; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0; min-height: 68px; justify-content: center;
        }
        .sidebar-nav {
          flex: 1; display: flex; flex-direction: column; gap: 4px;
          padding: 16px 8px; overflow-y: auto; overflow-x: hidden;
        }
        .sidebar-nav::-webkit-scrollbar { width: 3px; }
        .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .nav-item {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px; border-radius: 10px; border: none;
          cursor: pointer; background: transparent; color: #8da3b8;
          font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 500;
          white-space: nowrap; overflow: hidden;
          transition: background 0.15s, color 0.15s, transform 0.1s;
          text-align: left; width: 100%; position: relative;
        }
        .nav-item:hover { background: rgba(56,189,248,0.08); color: #e2e8f0; transform: translateX(2px); }
        .nav-item.active {
          background: linear-gradient(135deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12));
          color: #fbbf24; border: 1px solid rgba(245,158,11,0.22);
        }
        .nav-item.active .nav-icon { color: #f59e0b; }
        .nav-icon {
          width: 20px; height: 20px; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; color: #4a6a8a; transition: color 0.15s;
        }
        .nav-item:hover .nav-icon { color: #38bdf8; }
        .nav-label { opacity: 1; transition: opacity 0.2s ease; letter-spacing: 0.01em; }
        .sidebar-root.collapsed .nav-label { opacity: 0; pointer-events: none; position: absolute; }
        .nav-item-wrapper { position: relative; width: 100%; }
        .nav-item-wrapper .tooltip {
          display: none; position: absolute; left: calc(100% + 12px); top: 50%;
          transform: translateY(-50%); background: #1e3a5f; color: #e2e8f0;
          font-size: 12px; font-weight: 600; font-family: 'Outfit', sans-serif;
          padding: 5px 10px; border-radius: 7px; white-space: nowrap;
          border: 1px solid rgba(56,189,248,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.4);
          z-index: 999; pointer-events: none;
        }
        .nav-item-wrapper .tooltip::before {
          content: ''; position: absolute; right: 100%; top: 50%;
          transform: translateY(-50%); border: 5px solid transparent;
          border-right-color: #1e3a5f;
        }
        .sidebar-root.collapsed .nav-item-wrapper:hover .tooltip { display: block; }
        .sidebar-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 6px 10px; flex-shrink: 0; }
        .sidebar-footer {
          padding: 12px 14px 16px; border-top: 1px solid rgba(255,255,255,0.07);
          flex-shrink: 0; display: flex; align-items: center; gap: 8px; overflow: hidden;
        }
        .version-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e; box-shadow: 0 0 6px #22c55e; flex-shrink: 0;
        }
        .version-text {
          font-size: 11px; color: #3d5a73; font-weight: 500;
          white-space: nowrap; opacity: 1; transition: opacity 0.2s ease;
        }
        .sidebar-root.collapsed .version-text { opacity: 0; }
        .ham-line {
          display: block; width: 14px; height: 1.5px; background: currentColor;
          border-radius: 2px; transition: transform 0.2s, opacity 0.2s;
        }
        .slim-scroll-dark::-webkit-scrollbar { width: 4px; }
        .slim-scroll-dark::-webkit-scrollbar-track { background: transparent; }
        .slim-scroll-dark::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
      `}</style>

      <aside className={`sidebar-root ${collapsed ? "collapsed" : "expanded"}`}>

        {/* Header */}
        {!collapsed ? (
          <div className="sidebar-header">
            <img src={appLogo} alt="Azzahraly Motion" className="sidebar-logo" />
            <button className="sidebar-toggle" onClick={() => setCollapsed(true)} title="Collapse sidebar">
              <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                <span className="ham-line" /><span className="ham-line" /><span className="ham-line" />
              </span>
            </button>
          </div>
        ) : (
          <div className="sidebar-header-collapsed">
            <button className="sidebar-toggle" onClick={() => setCollapsed(false)} title="Expand sidebar">
              <span style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
                <span className="ham-line" /><span className="ham-line" /><span className="ham-line" />
              </span>
            </button>
          </div>
        )}

        {/* Nav */}
        <nav className="sidebar-nav">
          {menuItems.map((item, i) => (
            <React.Fragment key={item.id}>
              {i === 2 && <div className="sidebar-divider" />}
              <div className="nav-item-wrapper">
                <button
                  className={`nav-item${aktif === item.id ? " active" : ""}`}
                  onClick={item.action}
                  title={collapsed ? item.label : ""}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
                {collapsed && <span className="tooltip">{item.label}</span>}
              </div>
            </React.Fragment>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <span className="version-dot" />
          <span className="version-text">Versi 2.2.1</span>
        </div>
      </aside>

      {/* ══ Modal New Project (non-Edit mode) ══
          ✅ FIX: onCreated sekarang meneruskan storageRef & projectData ke App.jsx
                  lewat onNewProjectCreated, sehingga langsung masuk ke Edit.
      */}
      <dialog id="modal_new_project" className="modal" onClose={() => setAktif(null)}>
        <div className="modal-box" style={{
          background: "#0d1b2a", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 18, padding: 0, overflow: "hidden", width: "620px", maxWidth: "92vw",
        }}>
          <NewProjectModal
            onClose={() => document.getElementById("modal_new_project")?.close()}
            onCreated={(projectName, projectData) => {
              document.getElementById("modal_new_project")?.close();
              // ✅ Teruskan ke App.jsx → akan langsung buka project di Edit
              onNewProjectCreated?.(projectName, projectData);
            }}
          />
        </div>
      </dialog>

      {/* ══ Modal Import Project ══ */}
      <dialog id="modal_import_project" className="modal" onClose={() => setAktif(null)}>
        <div className="modal-box" style={{
          background: "#0d1b2a", border: "1px solid rgba(56,189,248,0.15)",
          borderRadius: 18, fontFamily: "'Outfit', sans-serif",
          padding: 0, overflow: "hidden", width: "420px", maxWidth: "90vw",
        }}>
          <div style={{ padding: "18px 22px 14px", background: "linear-gradient(135deg, #0ea5e9, #2563eb)", display: "flex", alignItems: "center", gap: 10 }}>
            <IoFolderOpen size={20} color="white" />
            <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Import Project</span>
          </div>
          <div style={{ padding: "22px 22px 8px" }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#4a6a8a", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 10 }}>
              Pilih File JSON
            </label>
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 8, padding: "24px 16px", border: "2px dashed rgba(56,189,248,0.25)",
              borderRadius: 12, cursor: "pointer", background: "rgba(56,189,248,0.04)", transition: "border-color 0.15s, background 0.15s",
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.5)"; e.currentTarget.style.background = "rgba(56,189,248,0.08)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(56,189,248,0.25)"; e.currentTarget.style.background = "rgba(56,189,248,0.04)"; }}
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span style={{ fontSize: 13, color: "#64748b" }}>Klik untuk pilih file .json</span>
              <input type="file" id="input_import_project" accept=".json" style={{ display: "none" }} onChange={handlerImportProject} />
            </label>
            <p id="message_import_project" hidden style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}></p>
          </div>
          <div style={{ padding: "12px 22px 20px", display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <form method="dialog">
              <button style={{ padding: "8px 18px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Batal</button>
            </form>
            <button onClick={handlerImportButton} style={{ padding: "8px 22px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#0ea5e9,#2563eb)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
              <IoFolderOpen size={14} /> Import
            </button>
          </div>
        </div>
      </dialog>

      {/* ══ Modal About (non-Edit mode) ══ */}
      <dialog id="modal_about" className="modal" onClose={() => setAktif(null)}>
        <div className="modal-box" style={{
          background: "#0d1b2a", border: "1px solid rgba(16,185,129,0.2)",
          borderRadius: 18, padding: 0, overflow: "hidden", width: "640px", maxWidth: "92vw",
        }}>
          <AboutAppModal onClose={() => document.getElementById("modal_about")?.close()} />
        </div>
      </dialog>

      {/* ══ Modal User Guide ══ */}
      <dialog id="modal_user_guide" className="modal" onClose={() => setAktif(null)}>
        <div className="modal-box" style={{
          background: "#0d1b2a", border: "1px solid rgba(56,189,248,0.15)",
          borderRadius: 18, fontFamily: "'Outfit', sans-serif",
          padding: 0, overflow: "hidden", width: "90vw", maxWidth: "1100px",
          height: "90vh", display: "flex", flexDirection: "column",
        }}>
          <div style={{ padding: "18px 22px 14px", background: "linear-gradient(135deg, #0ea5e9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <MdMenuBook size={20} color="white" />
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>Panduan Pengguna</span>
            </div>
            <form method="dialog">
              <button style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 8, color: "white", width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>×</button>
            </form>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <iframe
              src="https://firebasestorage.googleapis.com/v0/b/azzahraly-motion.appspot.com/o/guide.pdf?alt=media&token=2d922c94-cefd-4927-8b8a-cf373eb7e742"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none", borderRadius: 10 }}
              title="Panduan Pengguna PDF"
            />
          </div>
          <div style={{ padding: "10px 22px 16px", display: "flex", justifyContent: "flex-end", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <form method="dialog">
              <button style={{ padding: "8px 22px", borderRadius: 9, border: "1px solid rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.15)", color: "#f87171", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit', sans-serif" }}>Tutup</button>
            </form>
          </div>
        </div>
      </dialog>

      {/* ══ Modal New Project — Edit mode (overlay langsung) ══ */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => { setShowNewProject(false); setAktif(null); }}
          onCreated={(projectName, projectData) => {
            setShowNewProject(false);
            setAktif(null);
            // ✅ Teruskan ke App.jsx → langsung load project baru di editor
            onNewProjectCreated?.(projectName, projectData);
          }}
        />
      )}

      {/* ══ Modal About App — Edit mode (overlay langsung) ══ */}
      {showAbout && (
        <AboutAppModal onClose={() => { setShowAbout(false); setAktif(null); }} />
      )}
    </>
  );
}