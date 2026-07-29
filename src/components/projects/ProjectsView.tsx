import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../../context/AuthContext.tsx';
import { ProjectItem, ProjectTask } from '../../types.ts';
import {
  FolderKanban,
  Plus,
  Github,
  ExternalLink,
  Calendar,
  CheckSquare,
  Square,
  Clock,
  AlertCircle,
  X,
  Trash2,
  Edit3,
  Search,
  Filter,
  Layers,
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  FileText,
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const { apiFetch } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [status, setStatus] = useState<'Planning' | 'In Progress' | 'On Hold' | 'Completed' | 'Cancelled'>('In Progress');
  const [progress, setProgress] = useState<number>(0);
  const [githubRepo, setGithubRepo] = useState('');
  const [deploymentLink, setDeploymentLink] = useState('');
  const [notes, setNotes] = useState('');
  const [tasksList, setTasksList] = useState<ProjectTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/projects');
      if (Array.isArray(res)) {
        setProjects(res);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setName('');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setDeadline('');
    setPriority('Medium');
    setStatus('In Progress');
    setProgress(0);
    setGithubRepo('');
    setDeploymentLink('');
    setNotes('');
    setTasksList([]);
    setNewTaskTitle('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (project: ProjectItem) => {
    setEditingProject(project);
    setName(project.name);
    setDescription(project.description || '');
    setStartDate(project.startDate || '');
    setDeadline(project.deadline || project.dueDate || '');
    setPriority((project.priority as any) || 'Medium');
    setStatus((project.status as any) || 'In Progress');
    setProgress(project.progress || 0);
    setGithubRepo(project.githubRepo || '');
    setDeploymentLink(project.deploymentLink || '');
    setNotes(project.notes || '');

    try {
      const parsed = JSON.parse(project.tasks || '[]');
      setTasksList(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      setTasksList([]);
    }

    setNewTaskTitle('');
    setIsModalOpen(true);
  };

  const handleAddTaskToModal = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: ProjectTask = {
      id: Date.now().toString(),
      title: newTaskTitle.trim(),
      completed: false,
    };
    const updatedTasks = [...tasksList, newTask];
    setTasksList(updatedTasks);
    setNewTaskTitle('');

    // Auto calculate progress %
    const doneCount = updatedTasks.filter((t) => t.completed).length;
    const calcProgress = Math.round((doneCount / updatedTasks.length) * 100);
    setProgress(calcProgress);
  };

  const handleToggleTaskInModal = (taskId: string) => {
    const updatedTasks = tasksList.map((t) =>
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    setTasksList(updatedTasks);

    // Auto calculate progress %
    if (updatedTasks.length > 0) {
      const doneCount = updatedTasks.filter((t) => t.completed).length;
      const calcProgress = Math.round((doneCount / updatedTasks.length) * 100);
      setProgress(calcProgress);
      if (calcProgress === 100) {
        setStatus('Completed');
      } else if (status === 'Completed' && calcProgress < 100) {
        setStatus('In Progress');
      }
    }
  };

  const handleRemoveTaskInModal = (taskId: string) => {
    const updatedTasks = tasksList.filter((t) => t.id !== taskId);
    setTasksList(updatedTasks);

    if (updatedTasks.length > 0) {
      const doneCount = updatedTasks.filter((t) => t.completed).length;
      setProgress(Math.round((doneCount / updatedTasks.length) * 100));
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        startDate,
        deadline,
        priority,
        status,
        progress,
        githubRepo: githubRepo.trim(),
        deploymentLink: deploymentLink.trim(),
        notes: notes.trim(),
        tasks: JSON.stringify(tasksList),
      };

      if (editingProject) {
        await apiFetch(`/api/projects/${editingProject.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/projects', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      setIsModalOpen(false);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle task directly on project card
  const handleToggleCardTask = async (project: ProjectItem, taskId: string) => {
    let tasks: ProjectTask[] = [];
    try {
      tasks = JSON.parse(project.tasks || '[]');
    } catch (e) {
      tasks = [];
    }

    const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const doneCount = updatedTasks.filter((t) => t.completed).length;
    const calcProgress = updatedTasks.length > 0 ? Math.round((doneCount / updatedTasks.length) * 100) : project.progress;

    try {
      await apiFetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          tasks: JSON.stringify(updatedTasks),
          progress: calcProgress,
          ...(calcProgress === 100 ? { status: 'Completed' } : {}),
        }),
      });
      await fetchProjects();
    } catch (err) {
      console.error('Failed to toggle card task:', err);
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await apiFetch(`/api/projects/${id}`, {
        method: 'DELETE',
      });
      await fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatusFilter === 'All' || p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalProjectsCount = projects.length;
  const completedProjectsCount = projects.filter((p) => p.status === 'Completed').length;
  const inProgressProjectsCount = projects.filter((p) => p.status === 'In Progress').length;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass p-6 rounded-2xl border border-slate-800 bg-slate-900/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <FolderKanban className="w-3.5 h-3.5" />
            <span>PostgreSQL Synchronized Projects</span>
          </div>
          <h2 className="text-2xl font-black text-white">Project Tracker</h2>
          <p className="text-xs text-slate-400">
            Track project deliverables, start dates, deadlines, GitHub repos, deployment URLs & automated completion percentages.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* Overview Metric Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Total Projects</p>
            <p className="text-2xl font-black text-white font-mono">{totalProjectsCount}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">In Progress</p>
            <p className="text-2xl font-black text-white font-mono">{inProgressProjectsCount}</p>
          </div>
        </div>

        <div className="glass p-4 rounded-2xl border border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Completed</p>
            <p className="text-2xl font-black text-white font-mono">{completedProjectsCount}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search projects, repos, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono">Status:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses ({projects.length})</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Grid View */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-mono text-xs">Loading projects from PostgreSQL...</div>
      ) : filteredProjects.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <FolderKanban className="w-12 h-12 text-indigo-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-200">No projects found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Click "New Project" to track your code repositories, deployment links, deadlines, and deliverables.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            let tasks: ProjectTask[] = [];
            try {
              tasks = JSON.parse(project.tasks || '[]');
            } catch (e) {
              tasks = [];
            }

            const priorityBadge = {
              High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
              Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Low: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            };

            const statusBadge = {
              Planning: 'bg-slate-800 text-slate-300 border-slate-700',
              'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
              'On Hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
              Cancelled: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            };

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-xl shadow-xl flex flex-col justify-between gap-5 group"
              >
                <div className="space-y-4">
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                            statusBadge[project.status as keyof typeof statusBadge] || statusBadge['In Progress']
                          }`}
                        >
                          {project.status}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                            priorityBadge[project.priority as keyof typeof priorityBadge] || priorityBadge.Medium
                          }`}
                        >
                          {project.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {project.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(project)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                        title="Edit Project"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-xs text-slate-400 line-clamp-2">{project.description}</p>
                  )}

                  {/* Automated Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-indigo-400 font-bold">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Tasks / Deliverables Checklist */}
                  {tasks.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-800/60">
                      <p className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                        Deliverables ({tasks.filter((t) => t.completed).length}/{tasks.length})
                      </p>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {tasks.map((t) => (
                          <div
                            key={t.id}
                            onClick={() => handleToggleCardTask(project, t.id)}
                            className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-white group/task"
                          >
                            {t.completed ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0 group-hover/task:text-indigo-400" />
                            )}
                            <span className={t.completed ? 'line-through text-slate-500' : ''}>
                              {t.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* External Links */}
                  {(project.githubRepo || project.deploymentLink) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                      {project.githubRepo && (
                        <a
                          href={
                            project.githubRepo.startsWith('http')
                              ? project.githubRepo
                              : `https://github.com/${project.githubRepo}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 flex items-center gap-1.5 transition-all font-mono text-[11px]"
                        >
                          <Github className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Repo</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </a>
                      )}

                      {project.deploymentLink && (
                        <a
                          href={
                            project.deploymentLink.startsWith('http')
                              ? project.deploymentLink
                              : `https://${project.deploymentLink}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 flex items-center gap-1.5 transition-all font-mono text-[11px]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Live App</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Dates */}
                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[11px] text-slate-400 font-mono">
                  <span>Start: {project.startDate || 'N/A'}</span>
                  <span className="text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due: {project.deadline || project.dueDate || 'N/A'}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-base font-bold">
                    {editingProject ? 'Edit Project' : 'Create New Project'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LifeOS Web App or AI Analytics Platform"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short summary of project goals and tech stack..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="High">High Priority</option>
                      <option value="Medium">Medium Priority</option>
                      <option value="Low">Low Priority</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="In Progress">In Progress</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Sub-Tasks & Automatic Progress Calculation */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300">
                      Deliverables / Tasks (Auto Calculates Progress)
                    </label>
                    <span className="text-xs font-mono text-indigo-400 font-bold">
                      Calculated Progress: {progress}%
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add deliverable (e.g., Set up PostgreSQL schema)..."
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTaskToModal();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTaskToModal}
                      className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0"
                    >
                      Add
                    </button>
                  </div>

                  {tasksList.length > 0 && (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {tasksList.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div
                            onClick={() => handleToggleTaskInModal(t.id)}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            {t.completed ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500" />
                            )}
                            <span className={t.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {t.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveTaskInModal(t.id)}
                            className="p-1 text-slate-500 hover:text-rose-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {tasksList.length === 0 && (
                    <div className="pt-1">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Manual Progress Override (%):
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(parseInt(e.target.value, 10))}
                        className="w-full accent-indigo-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      GitHub Repository URL
                    </label>
                    <input
                      type="text"
                      placeholder="github.com/username/repo"
                      value={githubRepo}
                      onChange={(e) => setGithubRepo(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Deployment Link
                    </label>
                    <input
                      type="text"
                      placeholder="https://myapp.vercel.app"
                      value={deploymentLink}
                      onChange={(e) => setDeploymentLink(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Notes & Documentation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="API keys, architecture notes, links, or developer credentials..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20"
                  >
                    {isSubmitting ? 'Saving...' : editingProject ? 'Update Project' : 'Create Project'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
