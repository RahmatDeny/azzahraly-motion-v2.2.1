import { SERVO_TYPES } from "../servo-types";
import { db } from "../firebase";
import {
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { Component } from "react";
import { toast } from "react-toastify";
import {
  FaSave, FaPlus, FaMinus, FaCode,
  FaUndo, FaRedo, FaPowerOff, FaCopy,
  FaArrowUp, FaArrowDown,
} from "react-icons/fa";
import { MdOutlineUsb, MdOutlineUsbOff, MdEdit, MdDelete } from "react-icons/md";
import { FaCirclePlay, FaCircleStop, FaArrowRightLong, FaArrowLeftLong, FaFolderOpen } from "react-icons/fa6";
import { IoAdd, IoRefresh } from "react-icons/io5";
import { HiOutlineDotsVertical } from "react-icons/hi";
import Serial from "../Serial";
import moment from "moment/moment";

// ─── SVG Icons for OpenProjectModal ─────────────────────────────────────────
const RobotIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <path d="M12 11V7"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M7 15h.01M17 15h.01M8 19h8"/>
  </svg>
);
const ServoIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
  </svg>
);
const MotionIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const CheckCircleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// ─── Open Project Modal ──────────────────────────────────────────────────────
class OpenProjectModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      projects: [],
      loading: true,
      selectedProject: null,
    };
  }

  componentDidMount() {
    this.loadProjects();
    this.handleKeyDown = (e) => { if (e.key === 'Escape') this.props.onClose(); };
    window.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  loadProjects() {
    const projectsCollection = collection(db, "projects");
    const q = query(projectsCollection, orderBy("lastModified", "desc"));
    
    getDocs(q).then(querySnapshot => {
      const projects = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const jsonData = data.jsonData || {};
        return {
          id: docSnap.id,
          name: data.name,
          lastModified: data.lastModified?.toDate() ? moment(data.lastModified.toDate()).locale("id").format("D MMMM YYYY, HH:mm") : "N/A",
          servoCount: jsonData.servos?.length ?? 0,
          motionCount: jsonData.motions?.length ?? 0,
        };
      });
      this.setState({ projects, loading: false });
    }).catch(() => this.setState({ loading: false }));
  }

  render() {
    const { projects, loading, selectedProject } = this.state;
    const { onClose, onOpen } = this.props;

    return (
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(10,20,40,0.72)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div style={{
          background: '#0f172a',
          border: '1.5px solid rgba(99,179,237,0.18)',
          borderRadius: 20,
          padding: '0',
          width: 560,
          maxWidth: '95vw',
          maxHeight: '80vh',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,179,237,0.08)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px 16px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FaFolderOpen style={{ color: 'white', fontSize: 20 }} />
              <div style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>Open Project</div>
            </div>
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
              color: 'white', width: 32, height: 32, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>×</button>
          </div>

          <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.8" style={{ animation: 'spin 1.2s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                </div>
                Memuat project...
              </div>
            ) : projects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: 14 }}>
                Belum ada project tersimpan
              </div>
            ) : (
              projects.map((project, index) => {
                const isSelected = selectedProject?.name === project.name;
                return (
                  <div
                    key={index}
                    onClick={() => this.setState({ selectedProject: project })}
                    onDoubleClick={() => { this.setState({ selectedProject: project }, () => onOpen(project.id)); }}
                    style={{
                      padding: '13px 16px', borderRadius: 12, marginBottom: 8, cursor: 'pointer',
                      background: isSelected ? 'linear-gradient(135deg, rgba(14,165,233,0.22), rgba(37,99,235,0.22))' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${isSelected ? 'rgba(99,179,237,0.55)' : 'rgba(255,255,255,0.07)'}`,
                      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 14,
                    }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                      background: isSelected ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: isSelected ? 'white' : '#64748b',
                    }}>
                      <RobotIcon />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontWeight: 700, fontSize: 14,
                        color: isSelected ? '#7dd3fc' : '#e2e8f0',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>{project.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ServoIcon /> {project.servoCount} servo
                        </span>
                        <span style={{ fontSize: 11, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <MotionIcon /> {project.motionCount} motion
                        </span>
                        <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CalendarIcon /> {project.lastModified}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{
                        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#0ea5e9,#2563eb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                      }}><CheckCircleIcon /></div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div style={{
            padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <span style={{ fontSize: 12, color: '#475569' }}>
              {projects.length} project · Double-click buka
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onClose} style={{
                padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>Batal</button>
              <button
                onClick={() => selectedProject && onOpen(selectedProject.id)}
                disabled={!selectedProject}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: selectedProject ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : 'rgba(255,255,255,0.08)',
                  color: selectedProject ? 'white' : '#475569',
                  fontSize: 13, fontWeight: 700, cursor: selectedProject ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <FaFolderOpen style={{ fontSize: 12 }} /> Open
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

// ─── Step Action Dropdown (for small screens) ────────────────────────────────
class StepActionDropdown extends Component {
  constructor(props) {
    super(props);
    this.state = { open: false };
    this.ref = null;
  }

  componentDidMount() {
    this._handler = (e) => {
      if (this.ref && !this.ref.contains(e.target)) this.setState({ open: false });
    };
    document.addEventListener('mousedown', this._handler);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this._handler);
  }

  render() {
    const { onAdd, onCopy, onMoveUp, onMoveDown, onDelete, disableUp, disableDown } = this.props;
    const { open } = this.state;

    return (
      <div ref={r => this.ref = r} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => this.setState({ open: !open })}
          style={{
            width: 26, height: 26, borderRadius: 6, border: 'none',
            background: open ? '#dbeafe' : '#f1f5f9', color: '#475569',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13,
          }}
        >
          <HiOutlineDotsVertical />
        </button>

        {open && (
          <div style={{
            position: 'absolute', right: 0, top: '110%', zIndex: 9999,
            background: 'white', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            border: '1px solid #e2e8f0', overflow: 'hidden', minWidth: 140,
          }}>
            {[
              { label: 'Add After', icon: <IoAdd size={12}/>, color: '#16a34a', bg: '#f0fdf4', onClick: onAdd },
              { label: 'Duplicate', icon: <FaCopy size={10}/>, color: '#2563eb', bg: '#eff6ff', onClick: onCopy },
              { label: 'Move Up', icon: <FaArrowUp size={9}/>, color: '#64748b', bg: '#f8fafc', onClick: onMoveUp, disabled: disableUp },
              { label: 'Move Down', icon: <FaArrowDown size={9}/>, color: '#64748b', bg: '#f8fafc', onClick: onMoveDown, disabled: disableDown },
              { label: 'Delete', icon: <MdDelete size={12}/>, color: '#dc2626', bg: '#fef2f2', onClick: onDelete },
            ].map((item, i) => (
              <button
                key={i}
                disabled={item.disabled}
                onClick={() => { if (!item.disabled) { item.onClick(); this.setState({ open: false }); } }}
                style={{
                  width: '100%', padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: item.disabled ? '#f8fafc' : 'white',
                  color: item.disabled ? '#cbd5e1' : item.color,
                  border: 'none', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 600, textAlign: 'left',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = item.bg; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
}

// ─── Main Edit Component ──────────────────────────────────────────────────────
export default class Edit extends Component {
  serial = new Serial();
  stopMotion = false;
  activeTab = "";
  history = [];
  historyIndex = -1;
  playTimer = null;

  constructor(props) {
    super(props);
    this.state = {
      data: props.data.data,
      activeMotion: null,
      activeStep: null,
      activeIdGroup: null,
      poseRobot: Array(),
      connected: false,
      isPlaying: false,
      msPerStep: 23,
      servoOn: true,
      showNewMotionModal: false,
      showOpenProjectModal: false,
      // Responsive state
      containerWidth: window.innerWidth,
    };
    this.autoSave = this.debounce(() => this.save(), 1000);
    this.saveNewMotion = this.saveNewMotion.bind(this);
    this.saveEditMotion = this.saveEditMotion.bind(this);
    this.handlerDeleteMotion = this.handlerDeleteMotion.bind(this);
    this.handlerChangeNextMotion = this.handlerChangeNextMotion.bind(this);
    this.saveIdGroup = this.saveIdGroup.bind(this);
    this.deleteIdGroup = this.deleteIdGroup.bind(this);
    this.save = this.save.bind(this);
    this.handlerNewStep = this.handlerNewStep.bind(this);
    this.handlerDeleteStep = this.handlerDeleteStep.bind(this);
    this.handlerChangeTime = this.handlerChangeTime.bind(this);
    this.handlerChangePause = this.handlerChangePause.bind(this);
    this.handlerChangeStepVal = this.handlerChangeStepVal.bind(this);
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.selectServo = this.selectServo.bind(this);
    this.off = this.off.bind(this);
    this.on = this.on.bind(this);
    this.sleep = this.sleep.bind(this);
    this.sendCommand = this.sendCommand.bind(this);
    this.sendPose = this.sendPose.bind(this);
    this.getPose = this.getPose.bind(this);
    this.play = this.play.bind(this);
    this.generate = this.generate.bind(this);
    this.importMotion = this.importMotion.bind(this);
    this.handlerImportMotion = this.handlerImportMotion.bind(this);
    this.buttonImportMotion = this.buttonImportMotion.bind(this);
    this.undo = this.undo.bind(this);
    this.redo = this.redo.bind(this);
    this.openNewMotionModal = this.openNewMotionModal.bind(this);
    this.openProjectFromRef = this.openProjectFromRef.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.addToHistory(this.state.data);

    window.addEventListener("keydown", (event) => {
      if (event.ctrlKey && (event.key === "S" || event.key === "s")) {
        event.preventDefault(); this.save("💾 Project Saved!");
      } else if (event.ctrlKey && (event.key === "Z" || event.key === "z")) {
        event.preventDefault(); this.undo();
      } else if (event.ctrlKey && (event.key === "Y" || event.key === "y")) {
        event.preventDefault(); this.redo();
      } else if (event.ctrlKey && (event.key === "C" || event.key === "c")) {
        event.preventDefault();
        if (this.activeTab === "motion") {
          navigator.clipboard.writeText(JSON.stringify(this.state.data.motions[this.state.activeMotion]));
        } else if (this.activeTab === "step") {
          navigator.clipboard.writeText(JSON.stringify(this.state.data.motions[this.state.activeMotion].steps[this.state.activeStep]));
        }
      } else if (event.ctrlKey && (event.key === "V" || event.key === "v")) {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea") return;
        navigator.clipboard.readText().then((res) => {
          try {
            const d = JSON.parse(res);
            const data = this.cloneData();
            if (this.activeTab === "motion") {
              data.motions.push(d);
            } else if (this.activeTab === "step") {
              data.motions[this.state.activeMotion].steps.push(d);
            }
            this.setState({ data });
            this.addToHistory(data);
          } catch (e) { toast(String(e)); }
        });
      } else if (event.key === " " || event.code === "Space") {
        const tag = document.activeElement?.tagName?.toLowerCase();
        if (tag === "input" || tag === "textarea" || tag === "button" || tag === "select") return;
        if (!this.state.connected) { toast("Connect to robot first"); return; }
        if (this.state.activeIdGroup === null) { toast("Select servo group first"); return; }
        event.preventDefault();
        if (this.state.servoOn) { this.off(); toast("Servo OFF"); }
        else { this.on(); toast("Servo ON"); }
      }
    });
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    // Watch container resizing for split-screen
    this._ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.setState({ containerWidth: entry.contentRect.width });
      }
    });
    if (this._containerRef) this._ro.observe(this._containerRef);
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    if (this._ro) this._ro.disconnect();
  }

  debounce(func, delay) {
    let timeout;
    return function(...args) {
      const context = this;
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(context, args), delay);
    };
  }

  handleResize() {
    this.setState({ containerWidth: this._containerRef?.offsetWidth ?? window.innerWidth });
  }

  addToHistory(data) {
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(data)));
    this.historyIndex++;
    if (this.history.length > 50) { this.history.shift(); this.historyIndex--; }
  }

  cloneData() {
    return JSON.parse(JSON.stringify(this.state.data));
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.setState({ data: JSON.parse(JSON.stringify(this.history[this.historyIndex])) });
      toast("Undo");
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.setState({ data: JSON.parse(JSON.stringify(this.history[this.historyIndex])) });
      toast("Redo");
    }
  }

  openProjectFromRef(projectId) {
    // Defer to the App component to handle opening the project
    if (this.props.handlerOpenRecentProject) {
      this.props.handlerOpenRecentProject(projectId);
    } else {
      console.error("handlerOpenRecentProject prop not passed to Edit component");
    }
  }

  openNewMotionModal() {
    this.setState({ showNewMotionModal: true });
    setTimeout(() => {
      const el = document.getElementById("input_new_motion_modal");
      if (el) { el.value = ""; el.focus(); }
    }, 50);
  }

  saveNewMotion() {
    const name = document.getElementById("input_new_motion_modal");
    if (!name || !name.value.trim()) { toast("Motion name is required"); return; }
    const data = this.cloneData();
    data.motions.push({ name: name.value.trim(), steps: [], next: 0 });
    this.setState({ data, showNewMotionModal: false });
    this.addToHistory(data);
    this.save("Motion Added");
  }

  saveEditMotion() {
    const name = document.getElementById("input_edit_motion");
    const data = this.cloneData();
    data.motions[this.state.activeMotion].name = name.value;
    this.setState({ data });
    this.addToHistory(data);
    this.save("Edit Motion Name Success");
  }

  saveIdGroup() {
    const list_servo = document.getElementsByName("checkbox_motion_group");
    const name = document.getElementById("input_name_motion_group");
    let checked = [];
    if (!name.value) { toast("Name is required"); return; }
    list_servo.forEach((e) => { if (e.checked) checked.push(e.value); });
    const data = this.cloneData();
    data.idGroups.push({ name: name.value, ids: checked });
    name.value = "";
    list_servo.forEach((e) => { e.checked = false; });
    this.setState({ data });
    this.addToHistory(data);
    this.save("Servo Group Added");
  }

  selectIdGroup(index) {
    if (!this.state.poseRobot.length) { toast("Connect to robot first"); return; }
    if (this.state.activeIdGroup === index) {
      const poseRobot = this.state.poseRobot.map((servo) => ({ ...servo, selected: false }));
      this.setState({ activeIdGroup: null, poseRobot });
      return;
    }
    const selectedIds = this.state.data.idGroups[index].ids;
    const poseRobot = this.state.poseRobot.map((servo) => {
      const selected = selectedIds.some((id) => servo.id == id);
      return { ...servo, selected };
    });
    this.setState({ activeIdGroup: index, poseRobot });
  }

  deleteIdGroup() {
    if (this.state.activeIdGroup == null) { toast("Select group first"); return; }
    const data = this.cloneData();
    data.idGroups.splice(this.state.activeIdGroup, 1);
    this.setState({ activeIdGroup: null, data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerMotionClick(index) {
    this.activeTab = "motion";
    this.setState({ activeMotion: index, activeStep: null });
  }

  handlerDeleteMotion() {
    if (this.state.activeMotion == null) { toast("Select motion first"); return; }
    const data = this.cloneData();
    data.motions.splice(this.state.activeMotion, 1);
    this.setState({ activeStep: null, activeMotion: null, data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerChangeNextMotion(val, index) {
    const data = this.cloneData();
    data.motions[index].next = val;
    this.setState({ data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerNewStep(afterIndex = null) {
    if (this.state.activeMotion == null) { toast("Select motion first"); return; }
    const tempValue = [];
    this.state.data.servos.forEach((servo) => {
        const servoType = SERVO_TYPES.find(t => t.value === servo.type);
        tempValue.push(servoType?.defaultValue ?? 0);
    });
    const newStep = { time: 1000, pause: 0, value: tempValue };
    const data = this.cloneData();
    if (afterIndex !== null) {
      data.motions[this.state.activeMotion].steps.splice(afterIndex + 1, 0, newStep);
    } else {
      data.motions[this.state.activeMotion].steps.push(newStep);
    }
    this.setState({ data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerCopyStep(index) {
    const data = this.cloneData();
    const steps = data.motions[this.state.activeMotion].steps;
    const copy = JSON.parse(JSON.stringify(steps[index]));
    steps.splice(index + 1, 0, copy);
    this.setState({ data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerMoveStep(index, direction) {
    const data = this.cloneData();
    const steps = data.motions[this.state.activeMotion].steps;
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= steps.length) return;
    const temp = steps[index]; steps[index] = steps[newIndex]; steps[newIndex] = temp;
    this.setState({ data, activeStep: newIndex });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerStepClick(index) {
    this.activeTab = "step";
    this.setState({ activeStep: index });
  }

  handlerDeleteStep(index = null) {
    const idx = index !== null ? index : this.state.activeStep;
    if (idx == null) { toast("Select step first"); return; }
    const data = this.cloneData();
    data.motions[this.state.activeMotion].steps.splice(idx, 1);
    this.setState({ activeStep: null, data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerChangeTime(value, index) {
    const data = this.cloneData();
    data.motions[this.state.activeMotion].steps[index].time = value;
    this.setState({ data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerChangePause(value, index) {
    const data = this.cloneData();
    data.motions[this.state.activeMotion].steps[index].pause = value;
    this.setState({ data });
    this.addToHistory(data);
    this.autoSave();
  }

  handlerChangeStepVal(value, index) {
    const data = this.cloneData();
    data.motions[this.state.activeMotion].steps[this.state.activeStep].value[index] = value;
    this.setState({ data });
    this.addToHistory(data);
  }

  async save(toastMessage = null) {
    const projectId = this.props.data.id;
    if (!projectId) {
      // Also check for the old way of getting name, for projects opened before the change
      const name = this._currentStorageName || this.props.data.name;
      if (name) {
        toast.warn("Project opened in a legacy way. Please re-open from dashboard to save.");
      } else {
        toast.error("Project ID not found. Cannot save.");
      }
      return;
    }

    const docRef = doc(db, "projects", projectId);
    try {
      await updateDoc(docRef, {
        jsonData: this.state.data,
        lastModified: serverTimestamp(),
      });
      if (toastMessage) {
        toast(toastMessage);
      }
    } catch (error) {
      console.error("Error saving data: ", error);
      toast.error("Failed to save data: " + error.message);
    }
  }

  connect = () => {
    let start = false; let message = "";
    if (!this.serial.supported()) { console.error("Serial not supported"); return; }
    this.serial.onSuccess = () => { this.serial.send("aaaa*c#"); };
    this.serial.onFail = () => { this.stopMotion = false; this.setState({ connected: false, poseRobot: [], isPlaying: false }); };
    this.serial.onReceive = (value) => {
      if (value.startsWith("*")) start = true;
      if (start) message += value;
      if (value.endsWith("#")) {
        start = false; message = message.substring(1, message.length - 1);
        if (message === "OK") {
          if (this.state.data.motions[this.state.activeMotion].next != 0) {
            const next = this.state.data.motions[this.state.activeMotion].next;
            this.setState({ activeMotion: next });
            if (this.stopMotion) this.play();
          }
        } else {
          try {
            const d = JSON.parse(message);
            if (d.type === "c") {
              const poseRobot = d.servos.map((s) => ({ ...s, selected: false, offByButton: false }));
              this.setState({ connected: true, poseRobot });
            } else if (d.type === "r") {
              const poseRobot = this.state.poseRobot.map((servo) => {
                if (!servo.selected) return servo;
                const found = d.servos.find((e) => e.id == servo.id);
                if (!found) return servo;
                return { ...servo, state: found.state, value: found.value };
              });
              this.setState({ poseRobot });
            }
          } catch (e) { console.log(e); }
        }
        message = "";
      }
    };
    this.serial.requestPort().then((res) => { if (res !== "") toast(res); });
  };

  disconnect() {
    this.stopMotion = false;
    if (this.playTimer) { clearTimeout(this.playTimer); this.playTimer = null; }
    this.setState({ connected: false, poseRobot: [], isPlaying: false });
    this.serial.close();
  }

  selectServo(index) {
    const poseRobot = this.state.poseRobot.map((servo, i) => (
      i === index ? { ...servo, selected: !servo.selected } : servo
    ));
    this.setState({ poseRobot });
  }

  off() {
    let send = "F";
    this.state.poseRobot.forEach((s) => { if (s.selected) send += s.id + ","; });
    this.sendCommand(send);
    const poseRobot = this.state.poseRobot.map((servo) => (
      servo.selected ? { ...servo, state: false, offByButton: true } : servo
    ));
    this.setState({ servoOn: false, poseRobot });
  }

  on() {
    this.sendCommand("r");
    const poseRobot = this.state.poseRobot.map((servo) => ({ ...servo, state: true, offByButton: false }));
    this.setState({ servoOn: true, poseRobot });
  }

  sendPose() {
    let send = "p";
    const activeValues = this.state.data.motions[this.state.activeMotion].steps[this.state.activeStep].value;
    activeValues.forEach((val) => {
      send += val + ",";
    });
    const poseRobot = this.state.poseRobot.map((servo, index) => ({
      ...servo,
      value: activeValues[index],
      state: true,
      offByButton: false,
    }));
    this.setState({ poseRobot });
    this.addToHistory(this.state.data);
    this.sendCommand(send);
  }

  getPose() {
    if (this.state.activeMotion == null) { toast("Select motion first"); return; }
    if (this.state.activeStep == null) { toast("Select step first"); return; }
    const data = this.cloneData();
    data.motions[this.state.activeMotion].steps[this.state.activeStep].value =
      data.motions[this.state.activeMotion].steps[this.state.activeStep].value.map((_, index) => (
        this.state.poseRobot[index]?.value
      ));
    this.setState({ data });
    this.addToHistory(data);
  }

  async play() {
    if (this.state.activeMotion == null) { toast("Select motion first"); return; }
    this.stopMotion = true;
    if (this.playTimer) { clearTimeout(this.playTimer); this.playTimer = null; }
    let ms = parseInt(this.state.msPerStep);
    if (isNaN(ms)) ms = 23; if (ms < 5) ms = 5; if (ms > 60) ms = 60;
    await this.sendCommand(`D,${ms}`);
    await this.sleep(100);
    let send = "Y";
    this.state.data.motions[this.state.activeMotion].steps.forEach((step) => {
      step.value.forEach((val) => { send += val + ","; });
      send += step.time + "," + step.pause + ",:";
    });
    await this.sendCommand(send);
    const totalMs = this.state.data.motions[this.state.activeMotion].steps
      .reduce((acc, step) => acc + Number(step.time || 0) + Number(step.pause || 0), 0);
    this.playTimer = setTimeout(() => {
      this.stopMotion = false;
      this.setState({ isPlaying: false });
      this.playTimer = null;
    }, totalMs + 300);
  }

  sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

  async sendCommand(command) {
    const frame = `aaaa*${command}#\n`;
    await this.serial.send(frame);
  }

  generate() {
    if (this.state.activeMotion == null) { toast("Select motion first"); return; }
    const dm = this.state.data.motions[this.state.activeMotion];
    let total_time = 0;
    dm.steps.forEach((s) => { total_time += Number(s.time) + Number(s.pause); });
    let fn = dm.name.replaceAll(" ", "");
    let result = `// ${fn}"\n // RECOMMENDED_MS_PER_SUBSTEP: ${this.state.msPerStep}\n// TOTAL TIME : ${total_time}\nvoid ${fn} () {\n\tdigitalWrite(BL, HIGH);\n\tint time = ${total_time};\n\tint before = millis();\n\n`;
    dm.steps.forEach((step, i) => {
      result += `\t// STEP ${i}\n\tsetBase(`;
      step.value.forEach((val, j) => { result += `${val}${j === step.value.length - 1 ? "" : ","}`; });
      result += ");\n";
      result += `\tMotionPagePlay(base, ${step.time}, ${step.pause}, 0, 0);\n`;
      if (i === 0) result += "\tdigitalWrite(BL, LOW);\n";
    });
    result += "\n\twhile(millis() - before < time);\n}";
    navigator.clipboard.writeText(result).then(() => toast("Motion copied!"));
  }

  importMotion(data) {
    data = data.replaceAll("\t", "");
    const data_split = data.split(" ");
    const data_enter = data.split("\n");
    let result = { name: data_split[1], steps: [], next: 0 };
    data_enter.forEach((val) => {
      if (val.search("setBase") !== -1) {
        const sv = val.substring(8, val.length - 2).split(",").map(Number);
        result.steps.push({ value: sv, time: 0, pause: 0 });
      }
      if (val.search("MotionPagePlay") !== -1) {
        const ts = val.substring(15, val.length - 2).split(",");
        result.steps[result.steps.length - 1].time = Number(ts[1]);
        result.steps[result.steps.length - 1].pause = Number(ts[2]);
      }
    });
    return result;
  }

  handlerImportMotion(event) {
    const result = this.importMotion(event.target.value);
    let html = `<div style="font-size:13px"><div style="font-weight:600;margin-bottom:4px">Name: ${result.name}</div>`;
    result.steps.forEach((step, i) => {
      html += `<div>Step ${i}: [${step.value.join(", ")}] time:${step.time} pause:${step.pause}</div>`;
    });
    html += "</div>";
    document.getElementById("import_motion_temporary").innerHTML = html;
  }

  buttonImportMotion() {
    const data = document.getElementById("textarea_import_motion").value;
    const result = this.importMotion(data);
    const nextData = this.cloneData();
    nextData.motions.push(result);
    this.setState({ data: nextData });
    this.addToHistory(nextData);
    this.autoSave();
  }

  render() {
    const { data, activeMotion, activeStep, activeIdGroup, poseRobot, connected, isPlaying, msPerStep, servoOn, showOpenProjectModal, containerWidth } = this.state;
    const activeMotionData = activeMotion !== null ? data.motions[activeMotion] : null;
    const activeStepData = activeMotion !== null && activeStep !== null ? data.motions[activeMotion]?.steps[activeStep] : null;

    // ─── Responsive breakpoints ───
    const isSmall = containerWidth < 1100;
    const isTiny  = containerWidth < 800;

    const scale = isSmall ? (isTiny ? 0.75 : 0.85) : 1;
    const s = (val) => Math.round(val * scale);

    const card = {
      background: '#ffffff', borderRadius: s(16),
      boxShadow: '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    };
    const cardHeader = {
      background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
      padding: `${s(11)}px ${s(14)}px`,
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', flexShrink: 0, minHeight: s(46),
    };
    const cardHeaderBtn = {
      background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: s(7),
      color: 'white', width: s(28), height: s(28), display: 'flex',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: s(13),
    };
    const colHeader = {
      display: 'flex', gap: s(4), padding: `${s(7)}px ${s(12)}px ${s(5)}px`,
      borderBottom: '1px solid #f1f5f9', fontSize: s(11), fontWeight: 700,
      color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em',
      flexShrink: 0, textAlign: 'center',
    };
    const rowItem = (isActive) => ({
      display: 'flex', alignItems: 'center', gap: s(7),
      padding: isActive ? `${s(7)}px ${s(12)}px ${s(7)}px ${s(9)}px` : `${s(7)}px ${s(12)}px`,
      borderBottom: '1px solid #f8fafc',
      borderLeft: isActive ? '4px solid #2563eb' : '3px solid transparent',
      background: isActive ? '#dbeafe' : 'white',
      boxShadow: isActive ? 'inset 0 0 0 1px #bfdbfe' : 'none',
      transition: 'background 0.1s, box-shadow 0.1s',
    });
    const numBadge = (isActive) => ({
      width: s(28), height: s(28), borderRadius: '50%', flexShrink: 0,
      background: isActive ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : '#f1f5f9',
      color: isActive ? 'white' : '#64748b',
      fontSize: s(13), fontWeight: 700, display: 'flex',
      alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    });
    const fieldInput = {
      flex: 1, minWidth: 0, padding: `${s(5)}px ${s(7)}px`,
      background: '#f8fafc', border: '1.5px solid #e2e8f0',
      borderRadius: s(7), fontSize: s(14), color: '#334155', outline: 'none',
      textAlign: 'center',
    };
    const actionBtn = (color, disabled = false) => {
      const colors = {
        green: { bg: disabled ? '#f1f5f9' : '#dcfce7', fg: disabled ? '#cbd5e1' : '#16a34a' },
        blue:  { bg: disabled ? '#f1f5f9' : '#dbeafe', fg: disabled ? '#cbd5e1' : '#2563eb' },
        red:   { bg: disabled ? '#f1f5f9' : '#fee2e2', fg: disabled ? '#cbd5e1' : '#dc2626' },
        gray:  { bg: disabled ? '#f8fafc' : '#f1f5f9', fg: disabled ? '#e2e8f0' : '#64748b' },
      };
      return {
        width: s(28), height: s(28), borderRadius: s(7), border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: s(11), background: colors[color].bg, color: colors[color].fg,
        flexShrink: 0,
      };
    };
    const footerBar = {
      padding: `${s(8)}px ${s(12)}px`, borderTop: '1px solid #f1f5f9',
      display: 'flex', gap: s(5), flexShrink: 0,
    };
    const emptyState = {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: '#94a3b8', fontSize: s(14), padding: s(16), textAlign: 'center',
    };
    const transferBtn = (disabled) => ({
      width: s(46), height: s(46), borderRadius: s(13), border: 'none',
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: s(18), boxShadow: disabled ? 'none' : '0 2px 10px rgba(59,130,246,0.3)',
      background: disabled ? '#e2e8f0' : 'linear-gradient(135deg,#06b6d4,#3b82f6)',
      color: disabled ? '#94a3b8' : 'white', transition: 'transform 0.15s',
    });
    const navBtnBase = {
      display: 'inline-flex', alignItems: 'center', gap: s(6),
      padding: `${s(7)}px ${s(12)}px`, borderRadius: s(9), border: 'none',
      cursor: 'pointer', fontSize: s(13), fontWeight: 600,
    };
    const col1Width = s(235);
    const col2Width = isSmall ? s(290) : 410;
    const transferColWidth = s(56);

    return (
      <>
        <style>{`
          * { box-sizing: border-box; }
          .slim-scroll::-webkit-scrollbar { width: 3px; height: 3px; }
          .slim-scroll::-webkit-scrollbar-track { background: #f8fafc; }
          .slim-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
          .slim-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 #f8fafc; }
          .row-hover:hover { background: #f8fafc !important; }
          .row-hover.id-group-active:hover { background: linear-gradient(135deg,#0ea5e9,#2563eb) !important; color: white !important; }
          .hdr-btn:hover { background: rgba(255,255,255,0.35) !important; }
          .transfer-btn-hover:hover:not(:disabled) { transform: scale(1.07); }
          .nav-btn { display:inline-flex; align-items:center; gap:5px; border-radius:8px; border:none; cursor:pointer; font-weight:600; }
          .motion-name-text { flex:1; color:#334155; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; padding: 2px 3px; }
          .motion-row-active .motion-name-text { color: #1d4ed8; font-weight:600; }
          .sub-toolbar-btn { display:inline-flex; align-items:center; gap:4px; border-radius:7px; border:none; cursor:pointer; font-weight:600; }
          .open-proj-btn:hover { background: rgba(255,255,255,0.18) !important; color: #e2e8f0 !important; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>

        <div
          ref={r => this._containerRef = r}
          style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#eef2f7', fontFamily: 'system-ui,-apple-system,sans-serif', overflow: 'hidden' }}
        >

          {/* ══════════════════════ NAVBAR ══════════════════════ */}
          <div style={{
            background: 'linear-gradient(135deg,#0f172a,#1e293b)',
            padding: `${s(8)}px ${s(12)}px`,
            display: 'flex', alignItems: 'center', gap: s(6), flexWrap: 'wrap',
            boxShadow: '0 2px 16px rgba(0,0,0,0.25)', flexShrink: 0,
          }}>
            {/* Back */}
            <button
              onClick={() => this.props.onBack?.()}
              style={{
                ...navBtnBase,
                background: 'rgba(255,255,255,0.08)', color: '#94a3b8',
                transition: 'background 0.15s, color 0.15s', marginRight: s(2),
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.16)'; e.currentTarget.style.color = '#e2e8f0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#94a3b8'; }}
            >
              ← {!isTiny && 'Dashboard'}
            </button>

            {/* Filename */}
            <span style={{ color: '#7dd3fc', fontWeight: 700, fontSize: s(15), marginRight: s(4), maxWidth: isTiny ? 110 : 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {this._currentStorageName || this.props.data.name}
            </span>

            {/* Undo/Redo */}
            <button onClick={this.undo} disabled={this.historyIndex <= 0} title="Undo"
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: s(8), color: this.historyIndex <= 0 ? '#475569' : '#e2e8f0', padding: `${s(7)}px ${s(10)}px`, cursor: this.historyIndex <= 0 ? 'not-allowed' : 'pointer', fontSize: s(13) }}>
              <FaUndo />
            </button>
            <button onClick={this.redo} disabled={this.historyIndex >= this.history.length - 1} title="Redo"
              style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: s(8), color: this.historyIndex >= this.history.length - 1 ? '#475569' : '#e2e8f0', padding: `${s(7)}px ${s(10)}px`, cursor: this.historyIndex >= this.history.length - 1 ? 'not-allowed' : 'pointer', fontSize: s(13) }}>
              <FaRedo />
            </button>

            {/* Open Project */}
            <button
              className="open-proj-btn"
              onClick={() => this.setState({ showOpenProjectModal: true })}
              style={{
                ...navBtnBase,
                border: '1px solid rgba(99,179,237,0.3)',
                background: 'rgba(14,165,233,0.12)', color: '#7dd3fc',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <FaFolderOpen style={{ fontSize: s(13) }} />
              {!isTiny && 'Open'}
            </button>

            <div style={{ flex: 1 }} />

            {/* Play + W Time */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.08)', borderRadius: s(11), padding: `${s(4)}px ${s(8)}px`, gap: s(8) }}>
              <button
                onClick={() => {
                  if (isPlaying) {
                    this.stopMotion = false;
                    if (this.playTimer) { clearTimeout(this.playTimer); this.playTimer = null; }
                    this.setState({ isPlaying: false });
                  }
                  else { this.stopMotion = true; this.setState({ isPlaying: true }, () => this.play()); }
                }}
                disabled={!isPlaying && (activeMotion === null || !connected)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: s(6),
                  padding: `${s(7)}px ${s(14)}px`, borderRadius: s(9), border: 'none',
                  fontSize: s(14), fontWeight: 700, cursor: (!isPlaying && (activeMotion === null || !connected)) ? 'not-allowed' : 'pointer',
                  background: isPlaying ? '#ef4444' : (!isPlaying && (activeMotion === null || !connected) ? '#1e3a5f' : '#22c55e'),
                  color: (!isPlaying && (activeMotion === null || !connected)) ? '#4b6a8a' : 'white',
                }}>
                {isPlaying ? <><FaCircleStop style={{ fontSize: s(14) }} /> Stop</> : <><FaCirclePlay style={{ fontSize: s(14) }} /> Play</>}
              </button>
              <div style={{ width: 1, height: s(26), background: 'rgba(255,255,255,0.15)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <span style={{ color: '#94a3b8', fontSize: s(10), fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>W Time</span>
                <input type="number" min={5} max={60} value={msPerStep}
                  onChange={(e) => { let v = parseInt(e.target.value); if (isNaN(v)) v = 23; if (v < 5) v = 5; if (v > 60) v = 60; this.setState({ msPerStep: v }); }}
                  style={{ width: s(44), textAlign: 'center', background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: s(6), padding: `${s(3)}px ${s(4)}px`, fontSize: s(14), color: 'white', fontWeight: 700 }} />
              </div>
            </div>

            {/* Save */}
            <button className="nav-btn" style={{ ...navBtnBase, background: '#10b981', color: 'white' }} onClick={() => this.save("💾 Project Saved!")}>
              <FaSave style={{ fontSize: s(12) }} /> {!isTiny && 'Save'}
            </button>

            {/* Connect/Disconnect */}
            {connected ? (
              <button className="nav-btn" style={{ ...navBtnBase, background: '#ef4444', color: 'white' }} onClick={this.disconnect}>
                <MdOutlineUsbOff style={{ fontSize: s(15) }} /> {!isTiny && 'Disconnect'}
              </button>
            ) : (
              <button className="nav-btn" style={{ ...navBtnBase, background: '#3b82f6', color: 'white', position: 'relative' }} onClick={this.connect}>
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                  <MdOutlineUsb style={{ fontSize: s(15) }} />
                  <span style={{
                    position: 'absolute', top: '50%', left: '50%',
                    width: '140%', height: '2px',
                    background: 'rgba(255,255,255,0.85)',
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    borderRadius: 2, pointerEvents: 'none',
                  }} />
                </span>
                {!isTiny && 'Connect'}
              </button>
            )}
          </div>

          {/* ══════════════════════ SUB-TOOLBAR ══════════════════════ */}
          <div style={{
            background: '#1e293b', padding: `${s(5)}px ${s(12)}px`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: s(6), flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: s(6) }}>
              <button className="sub-toolbar-btn"
                style={{ background: '#f59e0b', color: 'white', padding: `${s(6)}px ${s(13)}px`, fontSize: s(13) }}
                onClick={() => document.getElementById("modal_import_motion").showModal()}>
                <FaPlus style={{ fontSize: s(10) }} /> Import
              </button>
              <button className="sub-toolbar-btn"
                onClick={this.generate}
                disabled={activeMotion === null}
                style={{ background: activeMotion === null ? 'rgba(255,255,255,0.06)' : '#8b5cf6', color: activeMotion === null ? '#4b6a8a' : 'white', cursor: activeMotion === null ? 'not-allowed' : 'pointer', padding: `${s(6)}px ${s(13)}px`, fontSize: s(13) }}>
                <FaCode style={{ fontSize: s(10) }} /> Generate
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: s(8) }}>
              {servoOn ? (
                <button onClick={this.off} disabled={!connected}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: s(6),
                    padding: `${s(6)}px ${s(16)}px`, borderRadius: s(9), border: 'none',
                    fontSize: s(13), fontWeight: 700,
                    background: connected ? '#ef4444' : 'rgba(255,255,255,0.06)',
                    color: connected ? 'white' : '#4b6a8a',
                    cursor: connected ? 'pointer' : 'not-allowed',
                  }}>
                  <FaPowerOff style={{ fontSize: s(12) }} /> OFF
                </button>
              ) : (
                <button onClick={this.on} disabled={!connected}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: s(6),
                    padding: `${s(6)}px ${s(16)}px`, borderRadius: s(9), border: 'none',
                    fontSize: s(13), fontWeight: 700,
                    background: connected ? '#22c55e' : 'rgba(255,255,255,0.06)',
                    color: connected ? 'white' : '#4b6a8a',
                    cursor: connected ? 'pointer' : 'not-allowed',
                  }}>
                  <FaPowerOff style={{ fontSize: s(12) }} /> ON
                </button>
              )}
              {!isTiny && (
                <span style={{ fontSize: s(13), fontWeight: 500, color: !connected ? '#64748b' : servoOn ? '#fca5a5' : '#86efac' }}>
                  {!connected ? 'Not connected' : servoOn ? 'Aktif' : 'Mati'}
                </span>
              )}
            </div>
          </div>

          {/* ══════════════════════ MAIN LAYOUT ══════════════════════ */}
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: s(8), padding: s(8), overflow: 'hidden' }}>

            {/* ── COL 1: MOTION UNIT + SERVO ID GROUP ── */}
            <div style={{ width: col1Width, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: s(8), minHeight: 0 }}>

              {/* Motion Unit Card */}
              <div style={{ ...card, flex: 1, minHeight: 0 }}>
                <div style={cardHeader}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: s(15) }}>Motion Unit</span>
                  <div style={{ display: 'flex', gap: s(4) }}>
                    <button className="hdr-btn"
                      style={{ ...cardHeaderBtn, opacity: activeMotion !== null ? 1 : 0.45 }}
                      onClick={() => {
                        if (activeMotion === null) { toast("Select motion first"); return; }
                        document.getElementById("input_edit_motion").value = data.motions[activeMotion]?.name || "";
                        document.getElementById("modal_edit_motion").showModal();
                      }}>
                      <MdEdit />
                    </button>
                    <button className="hdr-btn" style={cardHeaderBtn} onClick={() => this.openNewMotionModal()}>
                      <FaPlus />
                    </button>
                  </div>
                </div>
                <div style={colHeader}>
                  <span style={{ width: s(30), textAlign: 'center' }}>No</span>
                  <span style={{ flex: 1, textAlign: 'center' }}>Name</span>
                  <span style={{ width: s(40), textAlign: 'center' }}>Next</span>
                </div>
                <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                  {data.motions?.map((motion, index) => (
                    <div
                      key={index}
                      className={`row-hover${activeMotion === index ? ' motion-row-active' : ''}`}
                      style={rowItem(activeMotion === index)}
                      onClick={() => this.handlerMotionClick(index)}
                    >
                      <div style={numBadge(activeMotion === index)}>{index}</div>
                      <span className="motion-name-text" style={{ fontSize: s(14) }}>{motion.name}</span>
                      <input
                        type="number"
                        value={motion.next}
                        style={{ ...fieldInput, flex: 'none', width: s(40), textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => this.handlerChangeNextMotion(parseInt(e.target.value), index)}
                      />
                    </div>
                  ))}
                </div>
                <div style={footerBar}>
                  <button style={actionBtn('green')} onClick={() => this.openNewMotionModal()}><FaPlus /></button>
                  <button style={actionBtn('red', activeMotion === null)} onClick={this.handlerDeleteMotion} disabled={activeMotion === null}><FaMinus /></button>
                </div>
              </div>

              {/* Servo ID Group Card */}
              <div style={{ ...card, height: s(210), flexShrink: 0 }}>
                <div style={cardHeader}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: s(15) }}>
                    {isSmall ? 'ID Group' : 'Servo ID Group'}
                  </span>
                  <button className="hdr-btn" style={cardHeaderBtn}
                    onClick={() => document.getElementById("modal_new_motion_group").showModal()}>
                    <FaPlus />
                  </button>
                </div>
                <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto', padding: `${s(6)}px ${s(10)}px` }}>
                  {data.idGroups?.length > 0 ? data.idGroups.map((group, index) => (
                    <div key={index} onClick={() => this.selectIdGroup(index)} className={`row-hover${activeIdGroup === index ? ' id-group-active' : ''}`}
                      style={{
                        padding: `${s(7)}px ${s(10)}px`, borderRadius: s(9), marginBottom: s(4),
                        cursor: 'pointer', fontSize: s(14), fontWeight: 500, transition: 'all 0.15s',
                        background: activeIdGroup === index ? 'linear-gradient(135deg,#0ea5e9,#2563eb)' : '#f8fafc',
                        color: activeIdGroup === index ? 'white' : '#334155',
                        border: `1.5px solid ${activeIdGroup === index ? 'transparent' : '#e2e8f0'}`,
                      }}>
                      {group.name}
                    </div>
                  )) : (
                    <div style={{ color: '#94a3b8', fontSize: s(13), textAlign: 'center', padding: `${s(14)}px 0` }}>No servo groups</div>
                  )}
                </div>
                <div style={footerBar}>
                  <button style={actionBtn('green')} onClick={() => document.getElementById("modal_new_motion_group").showModal()}><FaPlus /></button>
                  <button style={actionBtn('red', activeIdGroup === null)} onClick={this.deleteIdGroup} disabled={activeIdGroup === null}><FaMinus /></button>
                </div>
              </div>
            </div>

            {/* ── COL 2: MOTION STEP ── */}
            <div style={{ ...card, width: col2Width, flexShrink: 0 }}>
              <div style={cardHeader}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: s(15) }}>Motion Step</span>
                <button className="hdr-btn" style={cardHeaderBtn} onClick={() => this.handlerNewStep()}><FaPlus /></button>
              </div>
              {activeMotion !== null ? (
                <>
                  <div style={colHeader}>
                    <span style={{ width: s(16) }}></span>
                    <span style={{ width: s(30), textAlign: 'center' }}>No</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Time</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Pause</span>
                    {/* Actions column header: show or hide based on space */}
                    {!isSmall && <span style={{ width: 128, textAlign: 'center' }}>Actions</span>}
                    {isSmall && <span style={{ width: s(30), textAlign: 'center' }}></span>}
                  </div>
                  <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                    {activeMotionData?.steps?.map((step, index) => (
                      <div key={index} className="row-hover" style={rowItem(activeStep === index)}>
                        <HiOutlineDotsVertical style={{ color: '#cbd5e1', fontSize: s(14), cursor: 'grab', flexShrink: 0 }} />
                        <div style={numBadge(activeStep === index)} onClick={() => this.handlerStepClick(index)}>{index + 1}</div>
                        <input type="number" value={step.time} style={fieldInput}
                          onClick={() => this.handlerStepClick(index)}
                          onChange={(e) => this.handlerChangeTime(parseInt(e.target.value), index)} />
                        <input type="number" value={step.pause} style={fieldInput}
                          onClick={() => this.handlerStepClick(index)}
                          onChange={(e) => this.handlerChangePause(parseInt(e.target.value), index)} />

                        {/* Full actions for large screens */}
                        {!isSmall && (
                          <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
                            <button style={actionBtn('green')} onClick={() => this.handlerNewStep(index)} title="Add after"><IoAdd style={{ fontSize: 12 }} /></button>
                            <button style={actionBtn('blue')} onClick={() => this.handlerCopyStep(index)} title="Duplicate"><FaCopy style={{ fontSize: 10 }} /></button>
                            <button style={actionBtn('gray', index === 0)} onClick={() => this.handlerMoveStep(index, -1)} disabled={index === 0} title="Move up"><FaArrowUp style={{ fontSize: 9 }} /></button>
                            <button style={actionBtn('gray', index === activeMotionData.steps.length - 1)} onClick={() => this.handlerMoveStep(index, 1)} disabled={index === activeMotionData.steps.length - 1} title="Move down"><FaArrowDown style={{ fontSize: 9 }} /></button>
                            <button style={actionBtn('red')} onClick={() => this.handlerDeleteStep(index)} title="Delete"><MdDelete style={{ fontSize: 12 }} /></button>
                          </div>
                        )}

                        {/* Dropdown for small screens */}
                        {isSmall && (
                          <StepActionDropdown
                            onAdd={() => this.handlerNewStep(index)}
                            onCopy={() => this.handlerCopyStep(index)}
                            onMoveUp={() => this.handlerMoveStep(index, -1)}
                            onMoveDown={() => this.handlerMoveStep(index, 1)}
                            onDelete={() => this.handlerDeleteStep(index)}
                            disableUp={index === 0}
                            disableDown={index === activeMotionData.steps.length - 1}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: `${s(6)}px ${s(12)}px ${s(8)}px`, background: '#fafbfc', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <span style={{ fontSize: s(12), color: '#94a3b8' }}>Click to select · {isSmall ? '⋮ for actions' : 'Add, duplicate, reorder'}</span>
                  </div>
                </>
              ) : (
                <div style={emptyState}>
                  <div style={{ fontWeight: 600, color: '#64748b' }}>Select a motion</div>
                  <div style={{ fontSize: s(12), marginTop: 4 }}>Choose from Motion Unit</div>
                </div>
              )}
            </div>

            {/* ── COL 3: POSE OF STEP ── */}
            <div style={{ ...card, flex: 1, minWidth: 0 }}>
              <div style={cardHeader}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: s(15) }}>Pose of Step</span>
                <div style={{ display: 'flex', gap: s(5) }}>
                  <button className="hdr-btn" style={cardHeaderBtn} title="Copy values"
                    onClick={() => { if (activeStepData) { navigator.clipboard.writeText(JSON.stringify(activeStepData.value)); toast("Values copied!"); } }}>
                    <FaCopy style={{ fontSize: s(11) }} />
                  </button>
                  <button className="hdr-btn" style={cardHeaderBtn} title="Reset to default"
                    onClick={() => {
                      if (activeStepData && data.servos) {
                        activeStepData.value = activeStepData.value.map((_, i) => {
                          const servoType = SERVO_TYPES.find(t => t.value === data.servos[i]?.type);
                          return servoType?.defaultValue ?? 0;
                        });
                        this.setState({ data });
                        this.addToHistory(data);
                      }
                    }}>
                    <IoRefresh style={{ fontSize: s(13) }} />
                  </button>
                </div>
              </div>
              {activeStepData ? (
                <>
                  <div style={colHeader}>
                    <span style={{ width: s(30) }}>No</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Value</span>
                  </div>
                  <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                    {activeStepData.value?.map((value, index) => (
                      <div key={index} className="row-hover" style={rowItem(false)}>
                        <span style={{ width: s(30), fontSize: s(14), fontWeight: 800, color: '#475569', flexShrink: 0, textAlign: 'center' }}>{index + 1}</span>
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                          <input
                            type="number"
                            value={value}
                            style={{ ...fieldInput, flex: 'none', width: s(80), textAlign: 'center', fontWeight: 700, fontSize: s(14) }}
                            onChange={(e) => this.handlerChangeStepVal(parseInt(e.target.value), index)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={emptyState}>
                  <div style={{ fontWeight: 600, color: '#64748b' }}>Select a step</div>
                  <div style={{ fontSize: s(13), marginTop: 4 }}>Choose from Motion Step</div>
                </div>
              )}
            </div>

            {/* ── TRANSFER BUTTONS ── */}
            <div style={{ width: transferColWidth, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: s(12) }}>
              <button className="transfer-btn-hover" onClick={this.sendPose}
                disabled={!connected || activeStep === null || activeMotion === null}
                style={transferBtn(!connected || activeStep === null || activeMotion === null)}
                title="Send pose to robot">
                <FaArrowRightLong />
              </button>
              <button className="transfer-btn-hover" onClick={this.getPose}
                disabled={!connected || activeStep === null || activeMotion === null}
                style={transferBtn(!connected || activeStep === null || activeMotion === null)}
                title="Get pose from robot">
                <FaArrowLeftLong />
              </button>
            </div>

            {/* ── COL 4: POSE OF ROBOT ── */}
            <div style={{ ...card, flex: 1, minWidth: 0 }}>
              <div style={cardHeader}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: s(15) }}>Pose of Robot</span>
                <div style={{ width: s(11), height: s(11), borderRadius: '50%', background: connected ? '#4ade80' : '#f87171', boxShadow: connected ? '0 0 8px #4ade80' : '0 0 8px #f87171', flexShrink: 0 }} />
              </div>
              {connected && poseRobot.length > 0 ? (
                <>
                  <div style={colHeader}>
                    <span style={{ width: s(30) }}>No</span>
                    <span style={{ flex: 1, textAlign: 'center' }}>Value</span>
                  </div>
                  <div className="slim-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                    {poseRobot.map((servo, index) => {
                      const isServoOff = servo.offByButton === true;
                      return (
                        <div key={index} className="row-hover" onClick={() => this.selectServo(index)}
                          style={{ ...rowItem(servo.selected), cursor: 'pointer' }}>
                          <span style={{ width: s(30), fontSize: s(14), fontWeight: 800, color: '#475569', flexShrink: 0, textAlign: 'center' }}>{servo.id}</span>
                          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <span style={{ background: isServoOff ? '#fee2e2' : servo.selected ? '#bfdbfe' : '#dbeafe', color: isServoOff ? '#dc2626' : servo.selected ? '#1d4ed8' : '#2563eb', fontSize: s(14), fontWeight: 800, padding: `${s(4)}px ${s(12)}px`, borderRadius: s(8), minWidth: s(48), textAlign: 'center' }}>
                              {isServoOff ? 'OFF' : servo.value}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ padding: `${s(5)}px ${s(12)}px ${s(7)}px`, background: '#fafbfc', borderTop: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <span style={{ fontSize: s(12), color: '#94a3b8' }}>ℹ Real-time (read-only)</span>
                  </div>
                </>
              ) : (
                <div style={emptyState}>
                  <div style={{ fontWeight: 600, color: '#64748b' }}>Not connected</div>
                  <div style={{ fontSize: s(13), marginTop: 4 }}>Connect to view</div>
                </div>
              )}
            </div>

          </div>{/* end main layout */}
        </div>

        {/* ══════════════════════ MODALS ══════════════════════ */}
        <dialog id="modal_edit_motion" className="modal">
          <div className="modal-box" style={{ borderRadius: 16 }}>
            <h3 className="font-bold text-lg mb-4">Edit Motion Name</h3>
            <input type="text" id="input_edit_motion" className="input input-bordered w-full"
              placeholder="Motion name"
              defaultValue={activeMotion !== null ? data.motions[activeMotion]?.name : ""} />
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost mr-2">Cancel</button>
                <button className="btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white', border: 'none' }} onClick={this.saveEditMotion}>Save</button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="modal_new_motion_group" className="modal">
          <div className="modal-box" style={{ borderRadius: 16 }}>
            <h3 className="font-bold text-lg mb-4">New Servo ID Group</h3>
            <input type="text" id="input_name_motion_group" className="input input-bordered w-full mb-4" placeholder="Group name" />
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
              {data.servos?.map((servo, index) => (
                <label key={index} className="flex items-center space-x-2">
                  <input type="checkbox" name="checkbox_motion_group" value={servo.id} className="checkbox checkbox-sm" />
                  <span className="text-sm">{servo.id}</span>
                </label>
              ))}
            </div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost mr-2">Cancel</button>
                <button className="btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white', border: 'none' }} onClick={this.saveIdGroup}>Save</button>
              </form>
            </div>
          </div>
        </dialog>

        <dialog id="modal_import_motion" className="modal">
          <div className="modal-box max-w-2xl" style={{ borderRadius: 16 }}>
            <h3 className="font-bold text-lg mb-4">Import Motion</h3>
            <textarea id="textarea_import_motion" className="textarea textarea-bordered w-full h-48"
              placeholder="Paste motion code here..." onChange={this.handlerImportMotion}></textarea>
            <div id="import_motion_temporary" className="mt-4 p-2 bg-gray-100 rounded max-h-32 overflow-y-auto text-sm"></div>
            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost mr-2">Cancel</button>
                <button className="btn" style={{ background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white', border: 'none' }} onClick={this.buttonImportMotion}>Import</button>
              </form>
            </div>
          </div>
        </dialog>

        {/* ══ NEW MOTION MODAL ══ */}
        {this.state.showNewMotionModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
            onClick={(e) => { if (e.target === e.currentTarget) this.setState({ showNewMotionModal: false }); }}>
            <div style={{
              background: 'white', borderRadius: 18, padding: '28px 28px 22px',
              width: 360, maxWidth: '90vw',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#0f172a' }}>New Motion</div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                  Motion Name
                </label>
                <input
                  id="input_new_motion_modal"
                  type="text"
                  placeholder="e.g. LANGKAH 1"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter') this.saveNewMotion(); if (e.key === 'Escape') this.setState({ showNewMotionModal: false }); }}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '2px solid #e2e8f0', borderRadius: 10,
                    fontSize: 14, color: '#1e293b', outline: 'none', transition: 'border-color 0.15s',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                <button onClick={() => this.setState({ showNewMotionModal: false })}
                  style={{ padding: '8px 18px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={this.saveNewMotion}
                  style={{ padding: '8px 22px', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg,#0ea5e9,#2563eb)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ OPEN PROJECT MODAL ══ */}
        {showOpenProjectModal && (
          <OpenProjectModal
            onClose={() => this.setState({ showOpenProjectModal: false })}
            onOpen={(storageRef) => this.openProjectFromRef(storageRef)}
          />
        )}
      </>
    );
  }
}
