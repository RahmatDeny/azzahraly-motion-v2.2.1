import { Component } from "react";
import Sidebar from "./components/Sidebar";
import Edit from "./components/Edit";
import Dashboard from "./components/Dashboard";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { ToastContainer } from "react-toastify";

class App extends Component {
  state = {
    onOpenProject: false,
    onNewProject: false,
    onEdit: false,
    onDashboard: false,
    onAbout: false,
    editData: {
      id: null,
      name: null,
      data: null,
    },
    editKey: 0, // Naikkan setiap ganti project → paksa Edit unmount/remount
  };

  constructor() {
    super();
    this.handlerNewProject        = this.handlerNewProject.bind(this);
    this.handlerCloseNewProject   = this.handlerCloseNewProject.bind(this);
    this.handleNewProjectData     = this.handleNewProjectData.bind(this);
    this.handlerOpenRecentProject = this.handlerOpenRecentProject.bind(this);
    this.handlerDashboard         = this.handlerDashboard.bind(this);
    this.handlerAbout             = this.handlerAbout.bind(this);
    this.handlerNewProjectCreated = this.handlerNewProjectCreated.bind(this);
  }

  // ─── Dipanggil dari Sidebar saat tombol "New Project" diklik (non-edit mode) ─
  handlerNewProject() {
    this.setState({
      onNewProject: true,
      onEdit: false,
      onDashboard: false,
      onAbout: false,
    });
  }

  // ─── Dipanggil dari NewProject page (form submit lama) ───────────────────────
  handleNewProjectData(name, data) {
    this.setState({
      onNewProject: false,
      onDashboard: false,
      onEdit: true,
      editData: { id: null, name, data },
    });
  }

  handlerOpenProject() {}

  // ─── Dipanggil dari Sidebar: About ───────────────────────────────────────────
  handlerAbout() {
    this.setState({
      onNewProject: false,
      onDashboard: false,
      onEdit: false,
      onAbout: true,
    });
  }

  handlerNewProjectCreated(projectName, projectData, projectId = null) {
    this.setState(prev => ({
      onEdit: true,
      onNewProject: false,
      onDashboard: false,
      onAbout: false,
      editData: {
        id: projectId,
        name: projectName,
        data: projectData,
      },
      editKey: prev.editKey + 1, 
    }));
  }

  // ─── Buka project dari Dashboard (recent project) ────────────────────────────
  async handlerOpenRecentProject(projectId) {
    try {
      const docRef = doc(db, "projects", projectId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const projectData = docSnap.data();
        this.setState(prev => ({
          onEdit: true,
          editData: { id: projectId, name: projectData.name, data: projectData.jsonData },
          editKey: prev.editKey + 1,
        }));
      } else {
        console.error("No such document!");
        // Optionally, handle the case where the project is not found
      }
    } catch (error) {
      console.error("Error getting document:", error);
    }
  }

  handlerDashboard() {
    this.setState({
      onDashboard: true,
      onEdit: false,
      onNewProject: false,
      onAbout: false,
    });
  }

  handlerCloseNewProject() {
    this.setState({ onNewProject: false });
  }

  render() {
    const { onNewProject, onEdit, onAbout } = this.state;

    const isEditMode  = onEdit;
    const isDashboard = !onNewProject && !onEdit && !onAbout;

    return (
      <>
        <ToastContainer />
        <div className="flex flex-row h-screen overflow-hidden">
          {!isDashboard && (
              <div className="font-Inter flex-shrink-0">
              <Sidebar
                handlerNewProject={this.handlerNewProject}
                handlerOpenProject={this.handlerOpenProject}
                handlerDashboard={this.handlerDashboard}
                handlerAbout={this.handlerAbout}
                isEditMode={isEditMode}
                onNewProjectCreated={this.handlerNewProjectCreated}
              />
            </div>
          )}

          <div className={`flex-1 min-w-0 ${isDashboard ? "" : "overflow-hidden"}`}>
            {onNewProject ? (
              <NewProject
                handleCloseButton={this.handlerCloseNewProject}
                handleData={this.handleNewProjectData}
              />
            ) : onEdit ? (
              <Edit
                key={this.state.editKey}
                data={this.state.editData}
                onBack={this.handlerDashboard}
                handlerOpenRecentProject={this.handlerOpenRecentProject}
              />
            ) : onAbout ? (
              <About />
            ) : (
              <Dashboard
                handlerOpenRecentProject={this.handlerOpenRecentProject}
                handlerNewProjectCreated={this.handlerNewProjectCreated}
              />
            )}
          </div>

        </div>
      </>
    );
  }
}

export default App;
