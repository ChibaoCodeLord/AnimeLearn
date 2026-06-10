import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Archive,
  Bot,
  CheckCircle2,
  Eye,
  FilePlus2,
  FileText,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  examApi,
  type ExamLevel,
  type ExamOption,
  type ExamPaper,
  type ExamQuestion,
  type ExamQuestionGroup,
  type ExamSectionType,
  type ExamStatus,
} from '@/api/exam.api';
import { cn } from '@/lib/utils';

const SECTION_OPTIONS: Array<{ value: ExamSectionType; label: string }> = [
  { value: 'vocabulary_grammar', label: 'Tu vung & Ngu phap' },
  { value: 'reading', label: 'Doc hieu' },
  { value: 'listening', label: 'Nghe hieu' },
];

const STATUS_LABELS: Record<ExamStatus, string> = {
  draft: 'Ban nhap',
  published: 'Da xuat ban',
  archived: 'Luu tru',
};

const STATUS_CLASS: Record<ExamStatus, string> = {
  draft: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-200',
  published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200',
  archived: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

const QUESTION_TYPES = [
  'kanji_reading',
  'vocabulary',
  'grammar',
  'reading',
  'listening',
  'sentence_reorder',
  'blank',
  'other',
];

function countSectionQuestions(exam: ExamPaper, sectionType: ExamSectionType) {
  const section = exam.sections.find(item => item.type === sectionType);
  return section?.groups.reduce((total, group) => total + group.questions.length, 0) || 0;
}

function defaultExamTitle(level: ExamLevel, year: number, month: number) {
  return `De thi ${level} thang ${String(month).padStart(2, '0')}/${year}`;
}

function updateArrayItem<T>(items: T[], index: number, updater: (item: T) => T) {
  return items.map((item, itemIndex) => (itemIndex === index ? updater(item) : item));
}

function createEmptyQuestion(order: number, sectionType: ExamSectionType): ExamQuestion {
  return {
    order,
    type: sectionType === 'reading' ? 'reading' : sectionType === 'listening' ? 'listening' : 'grammar',
    questionText: '',
    stemText: '',
    options: ['A', 'B', 'C', 'D'].map(label => ({ label, text: '', imageUrl: '' })),
    correctOptionIndex: null,
    answerSource: 'unknown',
    answerConfidence: null,
    explanation: '',
    aiNotes: '',
    points: 1,
  };
}

function createEmptyGroup(order: number, sectionType: ExamSectionType): ExamQuestionGroup {
  return {
    order,
    mondaiNumber: order,
    title: `Mondai ${order}`,
    instruction: '',
    passageText: '',
    attachmentImageUrl: '',
    audioUrl: '',
    audioStartSeconds: null,
    audioEndSeconds: null,
    questions: [createEmptyQuestion(1, sectionType)],
  };
}

function cloneQuestionGroups(groups: ExamQuestionGroup[]) {
  return groups.map(group => ({
    ...group,
    questions: (group.questions || []).map(question => ({
      ...question,
      options: (question.options || []).map(option => ({ ...option })),
    })),
  }));
}

export function ExamAdminPanel() {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [createForm, setCreateForm] = useState({
    level: 'N3' as ExamLevel,
    year: currentYear,
    month: 12,
    title: defaultExamTitle('N3', currentYear, 12),
    subtitle: 'Ky thi JLPT',
  });
  const [editForm, setEditForm] = useState({
    level: 'N3' as ExamLevel,
    year: currentYear,
    month: 12,
    title: '',
    subtitle: '',
    source: 'JLPT',
  });
  const [selectedExamId, setSelectedExamId] = useState('');
  const [sectionType, setSectionType] = useState<ExamSectionType>('vocabulary_grammar');
  const [saveMode, setSaveMode] = useState<'replace' | 'append'>('replace');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [audioImportFile, setAudioImportFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [previewGroups, setPreviewGroups] = useState<ExamQuestionGroup[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [isPreviewDirty, setIsPreviewDirty] = useState(false);

  const examsQuery = useQuery({
    queryKey: ['admin-exams'],
    queryFn: () => examApi.adminList({ status: 'all', limit: 50, sort: 'newest' }),
  });

  const exams = examsQuery.data?.exams ?? [];
  const selectedExam = useMemo(
    () => exams.find(exam => exam.id === selectedExamId),
    [exams, selectedExamId],
  );
  const selectedGroup = previewGroups[selectedGroupIndex] || null;

  useEffect(() => {
    if (!selectedExamId && exams.length) setSelectedExamId(exams[0].id);
  }, [exams, selectedExamId]);

  useEffect(() => {
    if (!selectedExam) return;
    setEditForm({
      level: selectedExam.level,
      year: selectedExam.year,
      month: selectedExam.month,
      title: selectedExam.title,
      subtitle: selectedExam.subtitle || '',
      source: selectedExam.source || 'JLPT',
    });
  }, [
    selectedExam?.id,
    selectedExam?.level,
    selectedExam?.year,
    selectedExam?.month,
    selectedExam?.title,
    selectedExam?.subtitle,
    selectedExam?.source,
  ]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isPreviewDirty || !previewGroups.length) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPreviewDirty, previewGroups.length]);

  const confirmDiscardPreview = () => {
    if (!isPreviewDirty || !previewGroups.length) return true;
    return window.confirm('Preview ky nang hien tai chua duoc luu. Ban co muon bo preview nay khong?');
  };

  const clearPreview = () => {
    setPreviewGroups([]);
    setSelectedGroupIndex(0);
    setIsPreviewDirty(false);
  };

  const handleSectionTypeChange = (nextSectionType: ExamSectionType) => {
    if (nextSectionType === sectionType) return;
    if (!confirmDiscardPreview()) return;
    setSectionType(nextSectionType);
    if (nextSectionType !== 'listening') setAudioImportFile(null);
    clearPreview();
  };

  const createExamMutation = useMutation({
    mutationFn: () => examApi.adminCreate(createForm),
    onSuccess: exam => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedExamId(exam.id);
      toast.success('Da tao de thi nhap');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ExamStatus }) =>
      examApi.adminStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success('Da cap nhat trang thai de thi');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateExamMutation = useMutation({
    mutationFn: () => {
      if (!selectedExamId) throw new Error('Chua chon de thi');
      if (!editForm.title.trim()) throw new Error('Tieu de de thi khong duoc de trong');

      return examApi.adminUpdate(selectedExamId, {
        title: editForm.title.trim(),
        subtitle: editForm.subtitle.trim(),
        level: editForm.level,
        year: Number(editForm.year),
        month: Number(editForm.month),
        source: editForm.source.trim() || 'JLPT',
      });
    },
    onSuccess: exam => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-detail'] });
      setSelectedExamId(exam.id);
      toast.success('Da cap nhat de thi');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteExamMutation = useMutation({
    mutationFn: (id: string) => examApi.adminDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setSelectedExamId('');
      toast.success('Da xoa de thi');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importPreviewMutation = useMutation({
    mutationFn: (formData: FormData) => examApi.importPreview(formData),
    onSuccess: response => {
      const groups = response.groups?.length ? response.groups : response.group ? [response.group] : [];
      setPreviewGroups(groups);
      setSelectedGroupIndex(0);
      setIsPreviewDirty(true);
      const questionCount = groups.reduce((total, group) => total + group.questions.length, 0);
      toast.success(`AI da doc ${groups.length} Mondai, ${questionCount} cau`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveSectionMutation = useMutation({
    mutationFn: () => {
      if (!selectedExamId) throw new Error('Chua chon de thi');
      if (!previewGroups.length) throw new Error('Chua co preview de luu');
      return examApi.saveSection(selectedExamId, {
        sectionType,
        groups: previewGroups,
        mode: saveMode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-exams'] });
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      queryClient.invalidateQueries({ queryKey: ['exam-detail'] });
      setIsPreviewDirty(false);
      toast.success(saveMode === 'replace' ? 'Da thay the ky nang trong de' : 'Da them ky nang vao de');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadMediaMutation = useMutation({
    mutationFn: (formData: FormData) => examApi.uploadMedia(formData),
    onSuccess: response => {
      if (!selectedGroup) return;
      updateSelectedGroup(group => {
        if (response.resourceType === 'video' || response.resourceType === 'raw' || mediaFile?.type.startsWith('audio/')) {
          return { ...group, audioUrl: response.url };
        }
        return { ...group, attachmentImageUrl: response.url };
      });
      setIsPreviewDirty(true);
      setMediaFile(null);
      toast.success('Da upload media cho Mondai dang chon');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const handleCreateChange = (field: keyof typeof createForm, value: string | number) => {
    setCreateForm(current => {
      const next = { ...current };
      if (field === 'level') next.level = value as ExamLevel;
      if (field === 'year') next.year = Number(value);
      if (field === 'month') next.month = Number(value);
      if (field === 'title') next.title = String(value);
      if (field === 'subtitle') next.subtitle = String(value);
      if (field === 'level' || field === 'year' || field === 'month') {
        next.title = defaultExamTitle(next.level, next.year, next.month);
      }
      return next;
    });
  };

  const handleEditChange = (field: keyof typeof editForm, value: string | number) => {
    setEditForm(current => {
      const next = { ...current };
      if (field === 'level') next.level = value as ExamLevel;
      if (field === 'year') next.year = Number(value);
      if (field === 'month') next.month = Number(value);
      if (field === 'title') next.title = String(value);
      if (field === 'subtitle') next.subtitle = String(value);
      if (field === 'source') next.source = String(value);
      return next;
    });
  };

  const handleLoadExistingSection = () => {
    if (!selectedExam) {
      toast.error('Chua chon de thi');
      return;
    }
    if (!confirmDiscardPreview()) return;

    const section = selectedExam.sections.find(item => item.type === sectionType);
    const groups = cloneQuestionGroups(section?.groups || []);

    setPreviewGroups(groups);
    setSelectedGroupIndex(0);
    setSaveMode('replace');
    setIsPreviewDirty(false);

    if (!groups.length) {
      toast.info('Ky nang nay chua co Mondai de sua');
      return;
    }
    toast.success(`Da tai ${groups.length} Mondai hien co de sua`);
  };

  const handleImportPreview = () => {
    if (!importFile) {
      toast.error('Vui long chon file anh hoac PDF cua ca ky nang');
      return;
    }
    if (sectionType === 'listening' && !audioImportFile) {
      toast.error('Vui long chon them file audio cho phan nghe');
      return;
    }
    if (!confirmDiscardPreview()) return;

    const formData = new FormData();
    formData.append('file', importFile);
    if (sectionType === 'listening' && audioImportFile) {
      formData.append('audioFile', audioImportFile);
    }
    formData.append('sectionType', sectionType);
    formData.append('sectionTitle', SECTION_OPTIONS.find(option => option.value === sectionType)?.label || '');
    formData.append('mondaiNumber', '1');
    importPreviewMutation.mutate(formData);
  };

  const handleMediaUpload = () => {
    if (!mediaFile) {
      toast.error('Vui long chon media');
      return;
    }
    const formData = new FormData();
    formData.append('file', mediaFile);
    uploadMediaMutation.mutate(formData);
  };

  function updateSelectedGroup(updater: (group: ExamQuestionGroup) => ExamQuestionGroup) {
    setPreviewGroups(current => updateArrayItem(current, selectedGroupIndex, updater));
    setIsPreviewDirty(true);
  }

  const setGroupField = (field: keyof ExamQuestionGroup, value: string | number | null) => {
    updateSelectedGroup(group => ({ ...group, [field]: value }));
  };

  const setQuestionField = (questionIndex: number, field: keyof ExamQuestion, value: string | number | null) => {
    updateSelectedGroup(group => ({
      ...group,
      questions: updateArrayItem(group.questions, questionIndex, question => ({
        ...question,
        [field]: value,
      })),
    }));
  };

  const setOptionField = (questionIndex: number, optionIndex: number, field: keyof ExamOption, value: string) => {
    updateSelectedGroup(group => ({
      ...group,
      questions: updateArrayItem(group.questions, questionIndex, question => ({
        ...question,
        options: updateArrayItem(question.options, optionIndex, option => ({
          ...option,
          [field]: value,
        })),
      })),
    }));
  };

  const setCorrectAnswer = (questionIndex: number, optionIndex: number | null) => {
    updateSelectedGroup(group => ({
      ...group,
      questions: updateArrayItem(group.questions, questionIndex, question => ({
        ...question,
        correctOptionIndex: optionIndex,
        answerSource: optionIndex === null ? 'unknown' : 'admin',
      })),
    }));
  };

  const addGroup = () => {
    setPreviewGroups(current => [...current, createEmptyGroup(current.length + 1, sectionType)]);
    setSelectedGroupIndex(previewGroups.length);
    setIsPreviewDirty(true);
  };

  const addQuestion = () => {
    if (!selectedGroup) {
      setPreviewGroups([createEmptyGroup(1, sectionType)]);
      setSelectedGroupIndex(0);
      setIsPreviewDirty(true);
      return;
    }
    updateSelectedGroup(group => ({
      ...group,
      questions: [...group.questions, createEmptyQuestion(group.questions.length + 1, sectionType)],
    }));
  };

  return (
    <div className="space-y-5 p-4 dark:bg-slate-950">
      <section className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <FilePlus2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-950 dark:text-white">Tao de nhap</h3>
          </div>

          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              <select
                value={createForm.level}
                onChange={event => handleCreateChange('level', event.target.value as ExamLevel)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {['N1', 'N2', 'N3', 'N4', 'N5'].map(level => <option key={level} value={level}>{level}</option>)}
              </select>
              <input
                type="number"
                value={createForm.year}
                onChange={event => handleCreateChange('year', Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <select
                value={createForm.month}
                onChange={event => handleCreateChange('month', Number(event.target.value))}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {[7, 12].map(month => <option key={month} value={month}>Thang {month}</option>)}
              </select>
            </div>
            <input
              value={createForm.title}
              onChange={event => setCreateForm(current => ({ ...current, title: event.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Tieu de de thi"
            />
            <input
              value={createForm.subtitle}
              onChange={event => setCreateForm(current => ({ ...current, subtitle: event.target.value }))}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              placeholder="Phu de"
            />
            <Button
              onClick={() => createExamMutation.mutate()}
              disabled={createExamMutation.isPending || !createForm.title}
              className="h-10 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {createExamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
              Tao de
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Save className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-950 dark:text-white">Chinh sua de dang chon</h3>
          </div>

          {!selectedExam ? (
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Chon mot de trong danh sach de sua.
            </p>
          ) : (
            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={editForm.level}
                  onChange={event => handleEditChange('level', event.target.value as ExamLevel)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {['N1', 'N2', 'N3', 'N4', 'N5'].map(level => <option key={level} value={level}>{level}</option>)}
                </select>
                <input
                  type="number"
                  value={editForm.year}
                  onChange={event => handleEditChange('year', Number(event.target.value))}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <select
                  value={editForm.month}
                  onChange={event => handleEditChange('month', Number(event.target.value))}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                >
                  {[7, 12].map(month => <option key={month} value={month}>Thang {month}</option>)}
                </select>
              </div>
              <input
                value={editForm.title}
                onChange={event => handleEditChange('title', event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Tieu de de thi"
              />
              <input
                value={editForm.subtitle}
                onChange={event => handleEditChange('subtitle', event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Phu de"
              />
              <input
                value={editForm.source}
                onChange={event => handleEditChange('source', event.target.value)}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Nguon de"
              />
              <Button
                onClick={() => updateExamMutation.mutate()}
                disabled={!selectedExam || !editForm.title.trim() || updateExamMutation.isPending}
                className="h-10 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
              >
                {updateExamMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Luu thong tin de
              </Button>
              {selectedExam.status === 'published' && (
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  De da xuat ban se duoc cap nhat truc tiep.
                </p>
              )}
            </div>
          )}
        </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              <h3 className="text-base font-black text-slate-950 dark:text-white">Danh sach de</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-exams'] })}
              disabled={examsQuery.isFetching}
              className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <RefreshCw className={cn('h-4 w-4', examsQuery.isFetching && 'animate-spin')} />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">De thi</th>
                  <th className="px-4 py-3">Trang thai</th>
                  <th className="px-4 py-3">Cau hoi</th>
                  <th className="px-4 py-3 text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                      Chua co de thi nao.
                    </td>
                  </tr>
                ) : exams.map(exam => (
                  <tr key={exam.id} className="border-b border-slate-100 hover:bg-slate-50/80 dark:border-slate-800 dark:hover:bg-slate-950/70">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => {
                          if (exam.id === selectedExamId) return;
                          if (!confirmDiscardPreview()) return;
                          clearPreview();
                          setSelectedExamId(exam.id);
                        }}
                        className={cn(
                          'text-left font-bold text-slate-900 dark:text-slate-100',
                          selectedExamId === exam.id && 'text-emerald-700 dark:text-emerald-300',
                        )}
                      >
                        {exam.title}
                      </button>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {exam.level} - {String(exam.month).padStart(2, '0')}/{exam.year}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn('border-0', STATUS_CLASS[exam.status])}>
                        {STATUS_LABELS[exam.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      TV-NP {countSectionQuestions(exam, 'vocabulary_grammar')} / Doc {countSectionQuestions(exam, 'reading')} / Nghe {countSectionQuestions(exam, 'listening')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {exam.status !== 'published' && (
                          <button
                            type="button"
                            title="Xuat ban"
                            onClick={() => updateStatusMutation.mutate({ id: exam.id, status: 'published' })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        {exam.status === 'published' && (
                          <button
                            type="button"
                            title="Dua ve nhap"
                            onClick={() => updateStatusMutation.mutate({ id: exam.id, status: 'draft' })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-300"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                        <Link
                          to={`/ExamLibrary/${exam.slug || exam.id}`}
                          title="Xem de"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          title="Xoa de"
                          onClick={() => {
                            if (window.confirm(`Xoa ${exam.title}?`)) deleteExamMutation.mutate(exam.id);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center gap-2">
            <Bot className="h-5 w-5 text-emerald-600" />
            <h3 className="text-base font-black text-slate-950 dark:text-white">Import ca ky nang</h3>
          </div>

          <div className="grid gap-3">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Chon de</label>
            <select
              value={selectedExamId}
              onChange={event => {
                if (!confirmDiscardPreview()) return;
                clearPreview();
                setSelectedExamId(event.target.value);
              }}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Chon de thi</option>
              {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.title}</option>)}
            </select>

            <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ky nang</label>
            <select
              value={sectionType}
              onChange={event => handleSectionTypeChange(event.target.value as ExamSectionType)}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {SECTION_OPTIONS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>

            <select
              value={saveMode}
              onChange={event => setSaveMode(event.target.value as 'replace' | 'append')}
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="replace">Thay the toan bo ky nang nay</option>
              <option value="append">Them vao cuoi ky nang nay</option>
            </select>

            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {sectionType === 'listening' ? 'File tai lieu nghe' : 'File tai lieu ky nang'}
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={event => setImportFile(event.target.files?.[0] || null)}
                className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>

            {sectionType === 'listening' && (
              <div className="grid gap-2">
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  File audio nghe
                </label>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={event => setAudioImportFile(event.target.files?.[0] || null)}
                  className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            )}

            <Button
              onClick={handleImportPreview}
              disabled={importPreviewMutation.isPending}
              className="h-10 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {importPreviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              AI quet ca ky nang
            </Button>

            <Button
              variant="outline"
              onClick={handleLoadExistingSection}
              disabled={!selectedExamId}
              className="h-10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <RefreshCw className="h-4 w-4" />
              Tai ky nang dang co de sua
            </Button>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Media cho Mondai dang chon
              </p>
              <input
                type="file"
                accept="image/*,audio/*,application/pdf"
                onChange={event => setMediaFile(event.target.files?.[0] || null)}
                className="block w-full text-xs text-slate-600 dark:text-slate-300"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleMediaUpload}
                disabled={uploadMediaMutation.isPending || !selectedGroup}
                className="mt-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {uploadMediaMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload media
              </Button>
            </div>

            <Button
              onClick={() => saveSectionMutation.mutate()}
              disabled={!selectedExamId || !previewGroups.length || saveSectionMutation.isPending}
              className="h-10 bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950"
            >
              {saveSectionMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Luu ca ky nang
            </Button>
            {isPreviewDirty && previewGroups.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200">
                Preview hien tai chua duoc luu. Bam "Luu ca ky nang" truoc khi doi ky nang hoac import file moi.
              </div>
            )}
          </div>

          {selectedExam && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              Dang chon: {selectedExam.title}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-950 dark:text-white">Preview & Edit ca ky nang</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
                AI tu tach Mondai. Chon tung Mondai de sua OCR, dap an va giai thich.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addGroup} className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <FilePlus2 className="h-4 w-4" />
                Them Mondai
              </Button>
              <Button variant="outline" size="sm" onClick={addQuestion} className="dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
                <FilePlus2 className="h-4 w-4" />
                Them cau
              </Button>
            </div>
          </div>

          {!previewGroups.length ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
              <Bot className="mb-3 h-12 w-12 text-slate-300 dark:text-slate-700" />
              <p className="font-bold">Chua co du lieu preview</p>
              <p className="mt-1 text-sm">
                {sectionType === 'listening'
                  ? 'Upload tai lieu va audio cua phan nghe de AI tach Mondai.'
                  : 'Upload anh/PDF cua ca ky nang de AI doc va tach Mondai.'}
              </p>
            </div>
          ) : (
            <div className="grid h-[calc(100vh-220px)] min-h-[560px] min-w-0 gap-0 overflow-hidden lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="min-h-0 space-y-2 overflow-y-auto border-r border-slate-100 p-3 dark:border-slate-800">
                {previewGroups.map((group, index) => (
                  <button
                    key={`${group.mondaiNumber}-${index}`}
                    type="button"
                    onClick={() => setSelectedGroupIndex(index)}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                      selectedGroupIndex === index
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200',
                    )}
                  >
                    <p className="font-black">{group.title || `Mondai ${index + 1}`}</p>
                    <p className="mt-1 text-xs font-semibold opacity-70">{group.questions.length} cau</p>
                  </button>
                ))}
              </div>

              {selectedGroup && (
                <div className="min-h-0 min-w-0 space-y-4 overflow-y-auto p-4">
                  <div className="grid gap-3 lg:grid-cols-[120px_1fr]">
                    <input
                      type="number"
                      min={1}
                      value={selectedGroup.mondaiNumber}
                      onChange={event => setGroupField('mondaiNumber', Number(event.target.value) || 1)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    />
                    <input
                      value={selectedGroup.title}
                      onChange={event => setGroupField('title', event.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="Tieu de Mondai"
                    />
                  </div>
                  <textarea
                    value={selectedGroup.instruction || ''}
                    onChange={event => setGroupField('instruction', event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Huong dan"
                  />
                  <textarea
                    value={selectedGroup.passageText || ''}
                    onChange={event => setGroupField('passageText', event.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Passage/bang bieu cho doc hieu"
                  />
                  <div className={cn('grid gap-3', sectionType === 'listening' ? 'md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_120px_120px]' : 'md:grid-cols-2')}>
                    <input
                      value={selectedGroup.attachmentImageUrl || ''}
                      onChange={event => setGroupField('attachmentImageUrl', event.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="attachmentImageUrl"
                    />
                    <input
                      value={selectedGroup.audioUrl || ''}
                      onChange={event => setGroupField('audioUrl', event.target.value)}
                      className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                      placeholder="audioUrl"
                    />
                    {sectionType === 'listening' && (
                      <>
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={selectedGroup.audioStartSeconds ?? ''}
                          onChange={event => setGroupField(
                            'audioStartSeconds',
                            event.target.value === '' ? null : Math.max(0, Number(event.target.value) || 0),
                          )}
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="Start giay"
                        />
                        <input
                          type="number"
                          min={0}
                          step={0.1}
                          value={selectedGroup.audioEndSeconds ?? ''}
                          onChange={event => setGroupField(
                            'audioEndSeconds',
                            event.target.value === '' ? null : Math.max(0, Number(event.target.value) || 0),
                          )}
                          className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                          placeholder="End giay"
                        />
                      </>
                    )}
                  </div>

                  {selectedGroup.questions.map((question, questionIndex) => (
                    <div key={`${question.order}-${questionIndex}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="border-0 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950">
                            Cau {questionIndex + 1}
                          </Badge>
                          {question.answerSource && question.answerSource !== 'unknown' && (
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
                              {question.answerSource === 'ai_inferred' ? 'AI chon' : question.answerSource === 'source_marked' ? 'Theo file' : 'Admin chon'}
                            </Badge>
                          )}
                          {question.answerConfidence !== null && question.answerConfidence !== undefined && (
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              {Math.round(question.answerConfidence * 100)}% confidence
                            </span>
                          )}
                        </div>
                        <select
                          value={question.type || 'other'}
                          onChange={event => setQuestionField(questionIndex, 'type', event.target.value)}
                          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        >
                          {QUESTION_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                      </div>
                      <textarea
                        value={question.questionText}
                        onChange={event => setQuestionField(questionIndex, 'questionText', event.target.value)}
                        rows={2}
                        className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="Noi dung cau hoi"
                      />
                      <textarea
                        value={question.stemText || ''}
                        onChange={event => setQuestionField(questionIndex, 'stemText', event.target.value)}
                        rows={2}
                        className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="Cau goc/stem"
                      />
                      <textarea
                        value={question.explanation || ''}
                        onChange={event => setQuestionField(questionIndex, 'explanation', event.target.value)}
                        rows={3}
                        className="mb-3 w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold dark:border-emerald-900/70 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="Giai thich dap an bang tieng Viet"
                      />
                      <textarea
                        value={question.aiNotes || ''}
                        onChange={event => setQuestionField(questionIndex, 'aiNotes', event.target.value)}
                        rows={2}
                        className="mb-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                        placeholder="Ghi chu OCR/AI"
                      />

                      <div className="grid gap-2">
                        {question.options.map((option, optionIndex) => (
                          <div key={`${questionIndex}-${optionIndex}`} className="grid gap-2 md:grid-cols-[42px_1fr_72px] md:items-center">
                            <input
                              value={option.label}
                              onChange={event => setOptionField(questionIndex, optionIndex, 'label', event.target.value)}
                              className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-center text-sm font-black dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                            />
                            <input
                              value={option.text}
                              onChange={event => setOptionField(questionIndex, optionIndex, 'text', event.target.value)}
                              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                              placeholder={`Dap an ${option.label}`}
                            />
                            <label className="flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              <input
                                type="radio"
                                name={`correct-${selectedGroupIndex}-${questionIndex}`}
                                checked={question.correctOptionIndex === optionIndex}
                                onChange={() => setCorrectAnswer(questionIndex, optionIndex)}
                              />
                              Dung
                            </label>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setCorrectAnswer(questionIndex, null)}
                          className="w-fit rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          Chua co dap an dung
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
