import React, { useState } from 'react';
import { AppState, NotebookNode, StandardNote, MindMap, MindMapNode } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  BookOpen,
  Folder,
  FileText,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Calendar,
  X,
  FolderTree,
  List,
  Network,
  Tag,
  Check,
  ChevronDown,
  Search,
  Sparkles,
  Copy,
  Download,
  BarChart3,
  Layers,
  HelpCircle
} from 'lucide-react';

interface NotebooksPageProps {
  state: AppState;
  onSaveNotebooks: (notebooks: NotebookNode[]) => void;
  onSaveStandardNotes: (standardNotes: StandardNote[]) => void;
  onSaveMindMaps: (mindMaps: MindMap[]) => void;
  language: 'ar' | 'en';
}

export const NotebooksPage: React.FC<NotebooksPageProps> = ({
  state,
  onSaveNotebooks,
  onSaveStandardNotes,
  onSaveMindMaps,
  language,
}) => {
  const isRTL = language === 'ar';

  // Sub-tabs: 'hierarchical' | 'standard' | 'mindmap'
  const [activeSubTab, setActiveSubTab] = useState<'hierarchical' | 'standard' | 'mindmap'>('hierarchical');

  // Search query state for each tab
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ==================== 1. HIERARCHICAL NOTEBOOK STATE ====================
  const notebooks = state.notebooks || [];
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [selectedNoteContent, setSelectedNoteContent] = useState<NotebookNode | null>(null);

  // Modal for Hierarchical Add/Edit
  const [isHierModalOpen, setIsHierModalOpen] = useState<boolean>(false);
  const [editingHierNode, setEditingHierNode] = useState<NotebookNode | null>(null);
  const [hierTitle, setHierTitle] = useState<string>('');
  const [hierDate, setHierDate] = useState<string>('');
  const [hierAmount, setHierAmount] = useState<string>('');
  const [hierDesc, setHierDesc] = useState<string>('');
  const [hierIcon, setHierIcon] = useState<string>('📌');

  // ==================== 2. STANDARD NOTES STATE ====================
  const standardNotes = state.standardNotes || [];
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isStdModalOpen, setIsStdModalOpen] = useState<boolean>(false);
  const [editingStdNote, setEditingStdNote] = useState<StandardNote | null>(null);
  const [stdTitle, setStdTitle] = useState<string>('');
  const [stdContent, setStdContent] = useState<string>('');
  const [stdCategory, setStdCategory] = useState<string>('عام');
  const [stdTagInput, setStdTagInput] = useState<string>('');
  const [stdTags, setStdTags] = useState<string[]>([]);
  const [viewingStdNote, setViewingStdNote] = useState<StandardNote | null>(null);

  // ==================== 3. MIND MAP STATE ====================
  const mindMaps = state.mindMaps || [];
  const [activeMindMapId, setActiveMindMapId] = useState<string>(mindMaps[0]?.id || '');
  const [isMindMapModalOpen, setIsMindMapModalOpen] = useState<boolean>(false);
  const [mindMapTitle, setMindMapTitle] = useState<string>('');
  
  // Modal for adding/editing a branch node in Mind Map
  const [isMmNodeModalOpen, setIsMmNodeModalOpen] = useState<boolean>(false);
  const [mmParentNodeId, setMmParentNodeId] = useState<string>('');
  const [mmNodeTitle, setMmNodeTitle] = useState<string>('');
  const [mmNodeColor, setMmNodeColor] = useState<string>('blue');

  // Confirmation modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Notification toast helper
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ==================== HIERARCHICAL FUNCTIONS ====================
  const findNodeByPath = (nodes: NotebookNode[], path: string[]): NotebookNode | null => {
    if (path.length === 0) return null;
    let currentList = nodes;
    let found: NotebookNode | null = null;
    for (const id of path) {
      found = currentList.find((n) => n.id === id) || null;
      if (!found) return null;
      currentList = found.children || [];
    }
    return found;
  };

  const getCurrentNodes = (): NotebookNode[] => {
    if (currentPath.length === 0) return notebooks;
    const parent = findNodeByPath(notebooks, currentPath);
    return parent?.children || [];
  };

  const currentParentNode = findNodeByPath(notebooks, currentPath);
  const displayedNodes = getCurrentNodes().filter(n => 
    !searchQuery.trim() || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || (n.desc && n.desc.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openAddHierModal = () => {
    setEditingHierNode(null);
    setHierTitle('');
    setHierDate(currentPath.length > 0 ? new Date().toISOString().slice(0, 10) : '');
    setHierAmount('');
    setHierDesc('');
    setHierIcon(currentPath.length === 0 ? '💼' : '📌');
    setSelectedNoteContent(null);
    setIsHierModalOpen(true);
  };

  const openEditHierModal = (node: NotebookNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHierNode(node);
    setHierTitle(node.title);
    setHierDate(node.date || '');
    setHierAmount(node.amount ? node.amount.toString() : '');
    setHierDesc(node.desc || '');
    setHierIcon(node.icon || (currentPath.length === 0 ? '💼' : '📌'));
    setIsHierModalOpen(true);
  };

  const upsertNodeRecursive = (
    nodes: NotebookNode[],
    targetPath: string[],
    editingId: string | null,
    newNode: NotebookNode
  ): NotebookNode[] => {
    if (targetPath.length === 0) {
      if (editingId) {
        return nodes.map((n) => (n.id === editingId ? { ...n, ...newNode, children: n.children } : n));
      } else {
        return [...nodes, newNode];
      }
    }

    const [head, ...tail] = targetPath;
    return nodes.map((n) => {
      if (n.id === head) {
        if (tail.length === 0) {
          const children = n.children || [];
          const updatedChildren = editingId
            ? children.map((c) => (c.id === editingId ? { ...c, ...newNode, children: c.children } : c))
            : [...children, newNode];
          return { ...n, children: updatedChildren };
        } else {
          return {
            ...n,
            children: upsertNodeRecursive(n.children || [], tail, editingId, newNode),
          };
        }
      }
      return n;
    });
  };

  const deleteNodeRecursive = (nodes: NotebookNode[], targetId: string): NotebookNode[] => {
    return nodes
      .filter((n) => n.id !== targetId)
      .map((n) => ({
        ...n,
        children: n.children ? deleteNodeRecursive(n.children, targetId) : [],
      }));
  };

  const handleSaveHierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hierTitle.trim()) return;

    const nodeData: NotebookNode = {
      id: editingHierNode ? editingHierNode.id : 'nb_' + Math.random().toString(36).substring(2, 9),
      title: hierTitle.trim(),
      icon: hierIcon,
      date: hierDate || undefined,
      amount: hierAmount ? parseFloat(hierAmount) : undefined,
      desc: hierDesc.trim() || undefined,
      children: editingHierNode ? editingHierNode.children : [],
    };

    const updated = upsertNodeRecursive(notebooks, currentPath, editingHierNode ? editingHierNode.id : null, nodeData);
    onSaveNotebooks(updated);
    setIsHierModalOpen(false);
    showToast(isRTL ? '✅ تم حفظ العنصر بنجاح' : '✅ Item saved successfully');
  };

  const confirmDeleteHierNode = (nodeId: string, nodeTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'حذف العنصر' : 'Delete Item',
      message: isRTL ? `هل أنت متأكد من حذف "${nodeTitle}" وكل محتوياته؟` : `Are you sure you want to delete "${nodeTitle}"?`,
      onConfirm: () => {
        const updated = deleteNodeRecursive(notebooks, nodeId);
        onSaveNotebooks(updated);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (selectedNoteContent?.id === nodeId) {
          setSelectedNoteContent(null);
        }
        showToast(isRTL ? '🗑️ تم الحذف بنجاح' : '🗑️ Deleted successfully');
      },
    });
  };

  // ==================== STANDARD NOTES FUNCTIONS ====================
  const categoriesList = ['all', ...Array.from(new Set(standardNotes.map(n => n.category || 'عام')))];
  
  const filteredStandardNotes = standardNotes.filter(n => {
    const matchesCat = selectedCategoryFilter === 'all' || (n.category || 'عام') === selectedCategoryFilter;
    const matchesQuery = !searchQuery.trim() || 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.tags && n.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesQuery;
  });

  const openAddStdModal = () => {
    setEditingStdNote(null);
    setStdTitle('');
    setStdContent('');
    setStdCategory('عام');
    setStdTags([]);
    setStdTagInput('');
    setIsStdModalOpen(true);
  };

  const openEditStdModal = (note: StandardNote, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStdNote(note);
    setStdTitle(note.title);
    setStdContent(note.content);
    setStdCategory(note.category || 'عام');
    setStdTags(note.tags || []);
    setStdTagInput('');
    setIsStdModalOpen(true);
  };

  const handleSaveStdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stdTitle.trim()) return;

    const noteObj: StandardNote = {
      id: editingStdNote ? editingStdNote.id : 'sn_' + Math.random().toString(36).substring(2, 9),
      title: stdTitle.trim(),
      content: stdContent.trim(),
      date: editingStdNote ? editingStdNote.date : new Date().toISOString().slice(0, 10),
      category: stdCategory,
      tags: stdTags,
    };

    let updated: StandardNote[];
    if (editingStdNote) {
      updated = standardNotes.map((n) => (n.id === editingStdNote.id ? noteObj : n));
    } else {
      updated = [noteObj, ...standardNotes];
    }
    onSaveStandardNotes(updated);
    setIsStdModalOpen(false);
    showToast(isRTL ? '✅ تم حفظ الملاحظة بنجاح' : '✅ Note saved successfully');
  };

  const confirmDeleteStdNote = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'حذف الملاحظة' : 'Delete Note',
      message: isRTL ? `هل أنت متأكد من حذف الملاحظة "${title}"؟` : `Are you sure you want to delete note "${title}"?`,
      onConfirm: () => {
        onSaveStandardNotes(standardNotes.filter((n) => n.id !== id));
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (viewingStdNote?.id === id) setViewingStdNote(null);
        showToast(isRTL ? '🗑️ تم الحذف بنجاح' : '🗑️ Deleted successfully');
      },
    });
  };

  const handleAddTag = () => {
    if (!stdTagInput.trim()) return;
    if (!stdTags.includes(stdTagInput.trim())) {
      setStdTags([...stdTags, stdTagInput.trim()]);
    }
    setStdTagInput('');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(isRTL ? '📋 تم النسخ إلى الحافظة' : '📋 Copied to clipboard');
  };

  // ==================== MIND MAP FUNCTIONS ====================
  const activeMindMap = mindMaps.find((m) => m.id === activeMindMapId) || mindMaps[0];

  const handleCreateNewMindMap = () => {
    setMindMapTitle('');
    setIsMindMapModalOpen(true);
  };

  const handleSaveNewMindMapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mindMapTitle.trim()) return;
    const newMap: MindMap = {
      id: 'mm_' + Math.random().toString(36).substring(2, 9),
      title: mindMapTitle.trim(),
      date: new Date().toISOString().slice(0, 10),
      root: {
        id: 'root_' + Math.random().toString(36).substring(2, 9),
        title: mindMapTitle.trim(),
        color: 'indigo',
        children: [],
      },
    };
    onSaveMindMaps([...mindMaps, newMap]);
    setActiveMindMapId(newMap.id);
    setIsMindMapModalOpen(false);
    showToast(isRTL ? '🧠 تم إنشاء الخريطة الذهنية بنجاح' : '🧠 Mind map created successfully');
  };

  const openAddMmNodeModal = (parentId: string) => {
    setMmParentNodeId(parentId);
    setMmNodeTitle('');
    setMmNodeColor('blue');
    setIsMmNodeModalOpen(true);
  };

  const addMmNodeRecursive = (node: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newNode],
      };
    }
    return {
      ...node,
      children: (node.children || []).map((child) => addMmNodeRecursive(child, parentId, newNode)),
    };
  };

  const deleteMmNodeRecursive = (node: MindMapNode, targetId: string): MindMapNode => {
    return {
      ...node,
      children: (node.children || [])
        .filter((child) => child.id !== targetId)
        .map((child) => deleteMmNodeRecursive(child, targetId)),
    };
  };

  const handleSaveMmNodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mmNodeTitle.trim() || !activeMindMap) return;

    const newNode: MindMapNode = {
      id: 'mmn_' + Math.random().toString(36).substring(2, 9),
      title: mmNodeTitle.trim(),
      color: mmNodeColor,
      children: [],
    };

    const updatedRoot = addMmNodeRecursive(activeMindMap.root, mmParentNodeId, newNode);
    const updatedMaps = mindMaps.map((m) => (m.id === activeMindMap.id ? { ...m, root: updatedRoot } : m));
    onSaveMindMaps(updatedMaps);
    setIsMmNodeModalOpen(false);
    showToast(isRTL ? '✨ تمت إضافة الفرع بنجاح' : '✨ Branch added successfully');
  };

  const handleDeleteMmNode = (nodeId: string) => {
    if (!activeMindMap) return;
    if (nodeId === activeMindMap.root.id) return;
    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'حذف الفرع' : 'Delete Branch',
      message: isRTL ? 'هل أنت متأكد من حذف هذا الفرع وجميع فروعه الفرعية؟' : 'Are you sure you want to delete this branch and its sub-branches?',
      onConfirm: () => {
        const updatedRoot = deleteMmNodeRecursive(activeMindMap.root, nodeId);
        const updatedMaps = mindMaps.map((m) => (m.id === activeMindMap.id ? { ...m, root: updatedRoot } : m));
        onSaveMindMaps(updatedMaps);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(isRTL ? '🗑️ تم حذف الفرع بنجاح' : '🗑️ Branch deleted successfully');
      },
    });
  };

  const handleDeleteCurrentMindMap = () => {
    if (!activeMindMap) return;
    setConfirmModal({
      isOpen: true,
      title: isRTL ? 'حذف الخريطة الذهنية' : 'Delete Mind Map',
      message: isRTL ? `هل أنت متأكد من حذف الخريطة بالكامل "${activeMindMap.title}"؟` : `Are you sure you want to delete mind map "${activeMindMap.title}"?`,
      onConfirm: () => {
        const updated = mindMaps.filter((m) => m.id !== activeMindMap.id);
        onSaveMindMaps(updated);
        if (updated.length > 0) setActiveMindMapId(updated[0].id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        showToast(isRTL ? '🗑️ تم حذف الخريطة بنجاح' : '🗑️ Mind map deleted');
      },
    });
  };

  // Recursive renderer for Mind Map tree
  const renderMindMapNodeTree = (node: MindMapNode, depth: number = 0) => {
    const colorClasses: Record<string, string> = {
      indigo: 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-900 dark:from-indigo-950/40 dark:to-purple-950/40 dark:border-indigo-800 dark:text-indigo-200',
      blue: 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-900 dark:from-blue-950/40 dark:to-cyan-950/40 dark:border-blue-800 dark:text-blue-200',
      emerald: 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/40 dark:border-emerald-800 dark:text-emerald-200',
      purple: 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-900 dark:from-purple-950/40 dark:to-pink-950/40 dark:border-purple-800 dark:text-purple-200',
      amber: 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-900 dark:from-amber-950/40 dark:to-orange-950/40 dark:border-amber-800 dark:text-amber-200',
      rose: 'bg-gradient-to-r from-rose-50 to-red-50 border-rose-200 text-rose-900 dark:from-rose-950/40 dark:to-red-950/40 dark:border-rose-800 dark:text-rose-200',
    };

    const badgeClass = colorClasses[node.color || 'blue'] || colorClasses['blue'];

    return (
      <div key={node.id} className={`flex flex-col ${depth > 0 ? (isRTL ? 'mr-6 border-r-2 border-indigo-200/60 dark:border-indigo-800/60 pr-4 mt-3' : 'ml-6 border-l-2 border-indigo-200/60 dark:border-indigo-800/60 pl-4 mt-3') : ''}`}>
        <div className={`flex items-center justify-between p-3.5 rounded-2xl border shadow-sm ${badgeClass} transition-all hover:shadow-md`}>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></span>
            <span className="font-bold text-sm tracking-wide">{node.title}</span>
            {node.children && node.children.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/70 dark:bg-black/30 text-indigo-700 dark:text-indigo-300 font-semibold">
                {node.children.length} {isRTL ? 'فروع' : 'branches'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openAddMmNodeModal(node.id)}
              className="px-2.5 py-1 bg-white/80 dark:bg-black/40 hover:bg-white dark:hover:bg-black rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 transition flex items-center gap-1 shadow-sm"
              title={isRTL ? 'إضافة فرع فرعي' : 'Add Sub-branch'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isRTL ? 'فرع' : 'Add'}</span>
            </button>
            {node.id !== activeMindMap?.root.id && (
              <button
                type="button"
                onClick={() => handleDeleteMmNode(node.id)}
                className="p-1.5 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl text-rose-600 dark:text-rose-400 transition"
                title={isRTL ? 'حذف' : 'Delete'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            {node.children.map((child) => renderMindMapNodeTree(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl font-medium text-sm backdrop-blur-md flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header & Sub-Tab Switcher */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 rounded-3xl shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isRTL ? 'منظومة المعرفة المتقدمة' : 'Advanced Knowledge Suite'}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-amber-400" />
            {isRTL ? 'المفكرة الإحترافية الشاملة' : 'Professional Master Notebook'}
          </h1>
          <p className="text-indigo-200 text-sm max-w-xl">
            {isRTL ? 'إدارة مشاريعك، تدوين أفكارك اليومية، وهندسة أفكارك عبر الخرائط الذهنية المتشعبة في منصة واحدة فائقة السرعة.' : 'Manage projects, record daily notes, and engineer ideas via advanced mind maps in one lightning-fast platform.'}
          </p>
        </div>

        {/* 3 Main Sections Switcher */}
        <div className="relative z-10 flex bg-black/20 backdrop-blur-md p-2 rounded-2xl gap-1.5 border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => { setActiveSubTab('hierarchical'); setCurrentPath([]); setSelectedNoteContent(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'hierarchical'
                ? 'bg-white text-indigo-900 shadow-lg scale-105'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            {isRTL ? 'مفكرة منطوية' : 'Hierarchical'}
          </button>

          <button
            type="button"
            onClick={() => { setActiveSubTab('standard'); setViewingStdNote(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'standard'
                ? 'bg-white text-indigo-900 shadow-lg scale-105'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <List className="w-4 h-4" />
            {isRTL ? 'مفكرة عادية' : 'Standard Notes'}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('mindmap')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeSubTab === 'mindmap'
                ? 'bg-white text-indigo-900 shadow-lg scale-105'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            <Network className="w-4 h-4" />
            {isRTL ? 'خرائط ذهنية' : 'Mind Maps'}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HIERARCHICAL NOTEBOOK TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'hierarchical' && (
        <div className="space-y-6">
          {/* Controls Bar: Breadcrumb & Search & Add */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 text-sm overflow-x-auto py-1">
              <button
                type="button"
                onClick={() => { setCurrentPath([]); setSelectedNoteContent(null); }}
                className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
                  currentPath.length === 0
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {isRTL ? 'الرئيسية' : 'Root'}
              </button>

              {currentPath.map((id, index) => {
                const subPath = currentPath.slice(0, index + 1);
                const node = findNodeByPath(notebooks, subPath);
                if (!node) return null;
                const isLast = index === currentPath.length - 1;
                return (
                  <React.Fragment key={id}>
                    <ChevronRight className={`w-4 h-4 text-slate-400 ${isRTL ? 'rotate-180' : ''}`} />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPath(subPath);
                        setSelectedNoteContent(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
                        isLast
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      <span>{node.icon || '📌'}</span>
                      <span className="truncate max-w-[120px]">{node.title}</span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isRTL ? 'بحث في المفكرة...' : 'Search notebooks...'}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="button"
                onClick={openAddHierModal}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-md whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                {currentPath.length === 0
                  ? (isRTL ? 'إضافة مفكرة' : 'Add Notebook')
                  : (isRTL ? 'إضافة عنصر' : 'Add Item')}
              </button>
            </div>
          </div>

          {/* Viewing Selected Note Content */}
          {selectedNoteContent ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-3xl p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl shadow-sm">
                    {selectedNoteContent.icon || '📝'}
                  </span>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{selectedNoteContent.title}</h2>
                    {selectedNoteContent.date && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {selectedNoteContent.date}
                        {selectedNoteContent.amount !== undefined && (
                          <span className="ms-2 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold">
                            💰 {selectedNoteContent.amount.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(selectedNoteContent.desc || selectedNoteContent.title)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition text-sm font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isRTL ? 'نسخ' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openEditHierModal(selectedNoteContent, e)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition text-sm font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedNoteContent(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition text-sm font-semibold"
                  >
                    {isRTL ? 'العودة للقائمة' : 'Back'}
                  </button>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none py-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedNoteContent.desc ? selectedNoteContent.desc : (
                  <p className="text-slate-400 italic">{isRTL ? 'لا يوجد نص أو تفاصيل إضافية في هذه الملاحظة.' : 'No description provided.'}</p>
                )}
              </div>
            </div>
          ) : (
            /* Cards Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedNodes.length === 0 ? (
                <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <Folder className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                  <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">{isRTL ? 'لا توجد عناصر مطابقة' : 'No matching items found'}</p>
                  <p className="text-xs text-slate-400 mt-1">{isRTL ? 'قم بإنشاء عنصر جديد للبدء فوراً' : 'Create a new item to get started'}</p>
                </div>
              ) : (
                displayedNodes.map((node) => {
                  const hasSub = node.children && node.children.length > 0;
                  return (
                    <div
                      key={node.id}
                      onClick={() => {
                        if (hasSub) {
                          setCurrentPath([...currentPath, node.id]);
                          setSearchQuery('');
                        } else {
                          setSelectedNoteContent(node);
                        }
                      }}
                      className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between transform hover:-translate-y-1"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5">
                            <span className="text-3xl p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                              {node.icon || (currentPath.length === 0 ? '💼' : '📌')}
                            </span>
                            <div>
                              <h3 className="font-extrabold text-slate-900 dark:text-white text-base group-hover:text-indigo-600 transition">
                                {node.title}
                              </h3>
                              {node.date && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  {node.date}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              onClick={(e) => openEditHierModal(node, e)}
                              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => confirmDeleteHierNode(node.id, node.title, e)}
                              className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {node.desc && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-4 line-clamp-2 leading-relaxed">
                            {node.desc}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold">
                          {hasSub ? `${node.children?.length} ${isRTL ? 'عنصر فرعي' : 'sub-items'}` : (isRTL ? 'ملاحظة نصية' : 'Note')}
                        </span>
                        {node.amount !== undefined && (
                          <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                            {node.amount.toLocaleString()} {isRTL ? 'ر.س' : 'SAR'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. STANDARD NOTES TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'standard' && (
        <div className="space-y-6">
          {viewingStdNote ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl shadow-sm">
                      {viewingStdNote.category || 'عام'}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      {viewingStdNote.date}
                    </span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{viewingStdNote.title}</h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(viewingStdNote.content)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition text-sm font-semibold"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{isRTL ? 'نسخ' : 'Copy'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => openEditStdModal(viewingStdNote, e)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition text-sm font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span>{isRTL ? 'تعديل' : 'Edit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewingStdNote(null)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 transition text-sm font-semibold"
                  >
                    {isRTL ? 'العودة للقائمة' : 'Back'}
                  </button>
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none py-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed text-base bg-slate-50 dark:bg-slate-950/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                {viewingStdNote.content}
              </div>

              {viewingStdNote.tags && viewingStdNote.tags.length > 0 && (
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Tag className="w-4 h-4 text-indigo-500" />
                  {viewingStdNote.tags.map((t, idx) => (
                    <span key={idx} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold shadow-sm">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category Filter & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition whitespace-nowrap ${
                        selectedCategoryFilter === cat
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat === 'all' ? (isRTL ? 'جميع التصنيفات' : 'All Categories') : cat}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute start-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isRTL ? 'بحث في الملاحظات...' : 'Search notes...'}
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={openAddStdModal}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition shadow-md whitespace-nowrap"
                  >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'ملاحظة جديدة' : 'New Note'}
                  </button>
                </div>
              </div>

              {/* Standard Notes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredStandardNotes.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
                    <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">{isRTL ? 'لا توجد ملاحظات عادية' : 'No standard notes found'}</p>
                    <p className="text-xs text-slate-400 mt-1">{isRTL ? 'أنشئ ملاحظتك الأولى الآن' : 'Create your first note now'}</p>
                  </div>
                ) : (
                  filteredStandardNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => setViewingStdNote(note)}
                      className="group bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between transform hover:-translate-y-1"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-xl shadow-sm">
                            {note.category || 'عام'}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            {note.date}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-lg group-hover:text-indigo-600 transition">
                          {note.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {note.tags?.slice(0, 2).map((t, idx) => (
                            <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => openEditStdModal(note, e)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => confirmDeleteStdNote(note.id, note.title, e)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MIND MAP TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'mindmap' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 overflow-x-auto py-1">
              {mindMaps.map((map) => (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => setActiveMindMapId(map.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
                    activeMindMapId === map.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Network className="w-4 h-4" />
                  {map.title}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCreateNewMindMap}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              {isRTL ? 'خريطة ذهنية جديدة' : 'New Mind Map'}
            </button>
          </div>

          {activeMindMap ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                    <span className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl">🧠</span> 
                    {activeMindMap.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {isRTL ? `تاريخ الإنشاء: ${activeMindMap.date}` : `Created: ${activeMindMap.date}`}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openAddMmNodeModal(activeMindMap.root.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'إضافة فرع رئيسي' : 'Add Main Branch'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteCurrentMindMap}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-100 transition"
                    title={isRTL ? 'حذف الخريطة بالكامل' : 'Delete Mind Map'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Render Tree Canvas */}
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-x-auto min-h-[400px]">
                {renderMindMapNodeTree(activeMindMap.root)}
              </div>
            </div>
          ) : (
            <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <Network className="w-16 h-16 text-slate-300 mx-auto mb-4 animate-pulse" />
              <p className="text-slate-700 dark:text-slate-300 font-bold text-lg">{isRTL ? 'لا توجد خرائط ذهنية' : 'No mind maps found'}</p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Hierarchical Add/Edit Modal */}
      {isHierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingHierNode
                  ? (isRTL ? 'تعديل العنصر' : 'Edit Item')
                  : (currentPath.length === 0 ? (isRTL ? 'إضافة مفكرة رئيسية' : 'Add Main Notebook') : (isRTL ? 'إضافة ملاحظة فرعية' : 'Add Sub-item'))}
              </h3>
              <button
                type="button"
                onClick={() => setIsHierModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'العنوان' : 'Title'}
                </label>
                <input
                  type="text"
                  value={hierTitle}
                  onChange={(e) => setHierTitle(e.target.value)}
                  placeholder={isRTL ? 'أدخل العنوان...' : 'Enter title...'}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isRTL ? 'التاريخ (اختياري)' : 'Date (Optional)'}
                  </label>
                  <input
                    type="date"
                    value={hierDate}
                    onChange={(e) => setHierDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                    {isRTL ? 'المبلغ (اختياري)' : 'Amount (Optional)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={hierAmount}
                    onChange={(e) => setHierAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'الأيقونة أو الرمز التعبيري' : 'Icon or Emoji'}
                </label>
                <input
                  type="text"
                  value={hierIcon}
                  onChange={(e) => setHierIcon(e.target.value)}
                  maxLength={4}
                  className="w-24 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-center text-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'النص التفصيلي أو الملاحظات' : 'Detailed Text / Description'}
                </label>
                <textarea
                  rows={5}
                  value={hierDesc}
                  onChange={(e) => setHierDesc(e.target.value)}
                  placeholder={isRTL ? 'اكتب التفاصيل والمحتوى هنا...' : 'Write notes and details here...'}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHierModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-lg"
                >
                  {isRTL ? 'حفظ العنصر' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standard Note Add/Edit Modal */}
      {isStdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {editingStdNote ? (isRTL ? 'تعديل الملاحظة' : 'Edit Note') : (isRTL ? 'إضافة ملاحظة جديدة' : 'Add New Note')}
              </h3>
              <button
                type="button"
                onClick={() => setIsStdModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStdSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'عنوان الملاحظة' : 'Note Title'}
                </label>
                <input
                  type="text"
                  value={stdTitle}
                  onChange={(e) => setStdTitle(e.target.value)}
                  placeholder={isRTL ? 'أدخل العنوان...' : 'Enter title...'}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'التصنيف' : 'Category'}
                </label>
                <input
                  type="text"
                  value={stdCategory}
                  onChange={(e) => setStdCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'محتوى الملاحظة' : 'Note Content'}
                </label>
                <textarea
                  rows={6}
                  value={stdContent}
                  onChange={(e) => setStdContent(e.target.value)}
                  placeholder={isRTL ? 'اكتب محتوى الملاحظة هنا...' : 'Write note content here...'}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'الوسوم (Tags)' : 'Tags'}
                </label>
                <div className="flex gap-2 mb-2.5">
                  <input
                    type="text"
                    value={stdTagInput}
                    onChange={(e) => setStdTagInput(e.target.value)}
                    placeholder={isRTL ? 'أضف وسماً...' : 'Add tag...'}
                    className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl text-sm font-bold hover:bg-slate-200 transition shadow-sm"
                  >
                    {isRTL ? 'إضافة وسم' : 'Add Tag'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {stdTags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold shadow-sm">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setStdTags(stdTags.filter((_, i) => i !== idx))}
                        className="hover:text-rose-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsStdModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-lg"
                >
                  {isRTL ? 'حفظ الملاحظة' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mind Map Creation Modal */}
      {isMindMapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isRTL ? 'إنشاء خريطة ذهنية جديدة' : 'Create New Mind Map'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMindMapModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMindMapSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'عنوان الخريطة الرئيسية' : 'Main Mind Map Title'}
                </label>
                <input
                  type="text"
                  value={mindMapTitle}
                  onChange={(e) => setMindMapTitle(e.target.value)}
                  placeholder={isRTL ? 'أدخل عنوان الخريطة...' : 'Enter mind map title...'}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMindMapModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-lg"
                >
                  {isRTL ? 'إنشاء الخريطة' : 'Create Map'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mind Map Branch Node Modal */}
      {isMmNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {isRTL ? 'إضافة فرع جديد' : 'Add New Branch'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMmNodeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMmNodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'عنوان الفرع' : 'Branch Title'}
                </label>
                <input
                  type="text"
                  value={mmNodeTitle}
                  onChange={(e) => setMmNodeTitle(e.target.value)}
                  placeholder={isRTL ? 'أدخل عنوان الفرع...' : 'Enter branch title...'}
                  required
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  {isRTL ? 'لون الفرع' : 'Branch Color'}
                </label>
                <select
                  value={mmNodeColor}
                  onChange={(e) => setMmNodeColor(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                >
                  <option value="indigo">{isRTL ? 'نيلي (Indigo)' : 'Indigo'}</option>
                  <option value="blue">{isRTL ? 'أزرق (Blue)' : 'Blue'}</option>
                  <option value="emerald">{isRTL ? 'زمردي (Emerald)' : 'Emerald'}</option>
                  <option value="purple">{isRTL ? 'بنفسجي (Purple)' : 'Purple'}</option>
                  <option value="amber">{isRTL ? 'كهرماني (Amber)' : 'Amber'}</option>
                  <option value="rose">{isRTL ? 'وردي (Rose)' : 'Rose'}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMmNodeModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
                >
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-lg"
                >
                  {isRTL ? 'إضافة الفرع' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        language={language}
      />
    </div>
  );
};
