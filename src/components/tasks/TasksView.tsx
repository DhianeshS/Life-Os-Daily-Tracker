import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Subtask } from '../../types.ts';
import {
  Plus,
  CheckCircle2,
  Trash2,
  Calendar,
  Tag,
  Filter,
  X,
  ListTodo,
  AlertCircle,
  Clock,
  Edit2,
} from 'lucide-react';

interface TasksViewProps {
  tasks: Task[];
  onCreateTask: (data: Partial<Task>) => Promise<void>;
  onUpdateTask: (id: number, data: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  isModalOpen,
  onCloseModal,
  onOpenModal,
}) => {
  // Filters
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');

  // Modal / Form state
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = ['All', 'Work', 'Personal', 'Health', 'Learning', 'Finance'];
  const priorities = ['All', 'High', 'Medium', 'Low'];

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'pending' && t.isCompleted) return false;
    if (filterStatus === 'completed' && !t.isCompleted) return false;
    if (filterCategory !== 'All' && t.category !== filterCategory) return false;
    if (filterPriority !== 'All' && t.priority !== filterPriority) return false;
    return true;
  });

  const handleOpenNewTask = () => {
    setEditingTaskId(null);
    setTitle('');
    setDescription('');
    setCategory('Work');
    setPriority('Medium');
    setDueDate(new Date().toISOString().split('T')[0]);
    setSubtasks([]);
    onOpenModal();
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    try {
      setSubtasks(JSON.parse(task.subtasks || '[]'));
    } catch {
      setSubtasks([]);
    }
    onOpenModal();
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false },
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(
      subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== subtaskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate: dueDate || null,
        subtasks: JSON.stringify(subtasks),
      };

      if (editingTaskId) {
        await onUpdateTask(editingTaskId, payload);
      } else {
        await onCreateTask(payload);
      }
      onCloseModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters & Actions Bar */}
      <div className="glass p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3">
        {/* Left Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {(['all', 'pending', 'completed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                filterStatus === s
                  ? 'bg-indigo-600 text-white font-bold shadow-sm'
                  : 'bg-slate-200/50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {s}
            </button>
          ))}

          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono ml-2">Category:</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 font-mono ml-2">Priority:</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-200 text-xs font-mono focus:outline-none focus:border-indigo-500"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Right New Task Button */}
        <button
          onClick={handleOpenNewTask}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Task Cards Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
          <ListTodo className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">No tasks found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your filters or create a new task to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTasks.map((task) => {
            let taskSubtasks: Subtask[] = [];
            try {
              taskSubtasks = JSON.parse(task.subtasks || '[]');
            } catch {
              taskSubtasks = [];
            }

            const completedSubCount = taskSubtasks.filter((s) => s.completed).length;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className={`p-5 rounded-2xl border transition-all shadow-md relative group ${
                  task.isCompleted
                    ? 'border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/10'
                    : 'border-white/20 dark:border-white/10 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => onUpdateTask(task.id, { isCompleted: !task.isCompleted })}
                      className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        task.isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      {task.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <div>
                      <h3
                        className={`text-sm font-bold transition-all ${
                          task.isCompleted
                            ? 'line-through text-slate-400 dark:text-slate-500'
                            : 'text-slate-800 dark:text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditTask(task)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
                      title="Edit Task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                      title="Delete Task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subtasks Progress Bar */}
                {taskSubtasks.length > 0 && (
                  <div className="my-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-1.5">
                      <span>Subtasks Progress</span>
                      <span>
                        {completedSubCount} / {taskSubtasks.length}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all"
                        style={{
                          width: `${(completedSubCount / taskSubtasks.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Tags & Dates */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 font-bold rounded-md ${
                        task.priority === 'High'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : task.priority === 'Medium'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                      {task.category}
                    </span>
                  </div>

                  {task.dueDate && (
                    <div className="flex items-center gap-1 text-slate-400 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{task.dueDate}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New/Edit Task Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-white/20 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-2xl p-6 text-slate-800 dark:text-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h3>
                <button
                  onClick={onCloseModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete Q3 Strategy Presentation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Add details, notes, or links..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none"
                    >
                      {categories.filter((c) => c !== 'All').map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Subtasks Section */}
                <div>
                  <label className="block text-xs font-semibold mb-1">Subtasks Checklist</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Add subtask item..."
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50"
                    />
                    <button
                      type="button"
                      onClick={handleAddSubtask}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600"
                    >
                      Add
                    </button>
                  </div>

                  {subtasks.length > 0 && (
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {subtasks.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs"
                        >
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={st.completed}
                              onChange={() => handleToggleSubtask(st.id)}
                              className="rounded border-slate-300 text-blue-600"
                            />
                            <span className={st.completed ? 'line-through text-slate-400' : ''}>
                              {st.title}
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtask(st.id)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm shadow-md transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingTaskId ? 'Update Task' : 'Create Task'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
