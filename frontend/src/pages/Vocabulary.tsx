import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { vocabularyApi } from '@/api/vocabulary.api';
import { FolderDetailView } from '@/components/vocabulary-hub/FolderDetailView';
import { FolderModal } from '@/components/vocabulary-hub/FolderModal';
import { MainView } from '@/components/vocabulary-hub/MainView';
import { SaveToFolderModal } from '@/components/vocabulary-hub/SaveToFolderModal';
import {
  kanjiFreqSystemFolders,
  kanjiJlptSystemFolders,
  vocabularySystemFolders,
} from '@/components/vocabulary-hub/systemFolders';
import { dictionaryToFlashcard, kanjiToFlashcard, savedToFlashcard } from '@/components/vocabulary-hub/helpers';
import { getFolderTone } from '@/components/vocabulary-hub/palette';
import type {
  FlashcardItem,
  FolderDetailData,
  FolderModalState,
  FolderTone,
  HubFolder,
} from '@/components/vocabulary-hub/types';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 16;

async function fetchFolderDetail(folder: HubFolder, page: number, limit: number): Promise<FolderDetailData> {
  if (folder.kind === 'user') {
    const response = await vocabularyApi.getVocabulary({
      page,
      limit,
      folderId: folder.folderId === 'all' ? undefined : folder.folderId,
    });

    return {
      items: response.items.map(savedToFlashcard),
      pagination: response.pagination,
    };
  }

  if (folder.kind === 'system-vocab') {
    const response = await vocabularyApi.getPopularDictionary({
      page,
      limit,
      range: folder.range,
    });

    return {
      items: response.items.map(dictionaryToFlashcard),
      pagination: response.pagination,
    };
  }

  if (folder.kind === 'system-kanji-jlpt') {
    const response = await vocabularyApi.getDiscoverKanji({
      page,
      limit,
      mode: 'jlpt',
      level: folder.level,
    });

    return {
      items: response.items.map(kanjiToFlashcard),
      pagination: response.pagination,
    };
  }

  const response = await vocabularyApi.getDiscoverKanji({
    page,
    limit,
    mode: 'freq',
    range: folder.range,
  });

  return {
    items: response.items.map(kanjiToFlashcard),
    pagination: response.pagination,
  };
}

export default function Vocabulary() {
  const queryClient = useQueryClient();
  const [activeFolder, setActiveFolder] = useState<HubFolder | null>(null);
  const [detailPage, setDetailPage] = useState(DEFAULT_PAGE);
  const [detailLimit, setDetailLimit] = useState(DEFAULT_LIMIT);
  const [folderModal, setFolderModal] = useState<FolderModalState | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState<FolderTone>('matcha');
  const [saveTarget, setSaveTarget] = useState<FlashcardItem | null>(null);
  const [saveFolderId, setSaveFolderId] = useState('');

  const foldersQuery = useQuery({
    queryKey: ['learning-folders'],
    queryFn: () => vocabularyApi.getFolders(),
  });

  const totalQuery = useQuery({
    queryKey: ['learning-total'],
    queryFn: () => vocabularyApi.getVocabulary({ page: 1, limit: 1 }),
  });

  const detailQuery = useQuery({
    queryKey: ['folder-detail', activeFolder?.id, detailPage, detailLimit],
    queryFn: () => fetchFolderDetail(activeFolder as HubFolder, detailPage, detailLimit),
    enabled: Boolean(activeFolder),
  });

  const folders = foldersQuery.data || [];
  const totalSaved = totalQuery.data?.pagination.total || 0;

  const personalFolders = useMemo<HubFolder[]>(() => {
    const allFolder: HubFolder = {
      id: 'my-all',
      kind: 'user',
      title: 'Tất cả thẻ đã lưu',
      subtitle: 'Sổ tay cá nhân',
      marker: 'All',
      color: 'slate',
      count: totalSaved,
      folderId: 'all',
      description: 'Toàn bộ từ vựng và kanji bạn đã lưu.',
    };

    return [
      allFolder,
      ...folders.map((folder) => ({
        id: `my-${folder._id}`,
        kind: 'user' as const,
        title: folder.name,
        subtitle: 'Thư mục cá nhân',
        marker: '本',
        color: getFolderTone(folder.color),
        count: folder.itemCount || 0,
        folderId: folder._id,
        description: folder.description || 'Bộ thẻ cá nhân',
      })),
    ];
  }, [folders, totalSaved]);

  const createFolderMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; color: FolderTone }) => vocabularyApi.createFolder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      setFolderModal(null);
      toast.success('Đã tạo thư mục');
    },
    onError: (error: Error) => toast.error(error.message || 'Tạo thư mục thất bại'),
  });

  const updateFolderMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { name: string; description?: string; color: FolderTone } }) =>
      vocabularyApi.updateFolder(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
      setFolderModal(null);
      toast.success('Đã cập nhật thư mục');
    },
    onError: (error: Error) => toast.error(error.message || 'Cập nhật thư mục thất bại'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      queryClient.invalidateQueries({ queryKey: ['learning-total'] });
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
      setActiveFolder(null);
      toast.success('Đã xóa thư mục');
    },
    onError: (error: Error) => toast.error(error.message || 'Xóa thư mục thất bại'),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => vocabularyApi.deleteWord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      queryClient.invalidateQueries({ queryKey: ['learning-total'] });
      toast.success('Đã xóa thẻ');
    },
    onError: (error: Error) => toast.error(error.message || 'Xóa thẻ thất bại'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => vocabularyApi.updateWord(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
    },
    onError: (error: Error) => toast.error(error.message || 'Cập nhật ôn tập thất bại'),
  });

  const saveItemMutation = useMutation({
    mutationFn: () => {
      if (!saveTarget || !saveFolderId) throw new Error('Chọn thư mục trước khi lưu');

      return vocabularyApi.saveLearningItem({
        item_type: saveTarget.item_type,
        itemId: saveTarget.id,
        word: saveTarget.word,
        folderId: saveFolderId,
        reading: saveTarget.reading,
        meaning_vi: saveTarget.meaning_vi,
        meaning_en: saveTarget.meaning_en,
        part_of_speech: saveTarget.part_of_speech,
        jlpt_level: saveTarget.jlpt_level,
        popularity_score: saveTarget.popularity_score,
        on: saveTarget.on,
        kun: saveTarget.kun,
        mean: saveTarget.mean,
        stroke_count: saveTarget.stroke_count,
        freq: saveTarget.freq,
        detail: saveTarget.detail,
        example_sentence: saveTarget.example_sentence,
        example_meaning: saveTarget.example_meaning,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      queryClient.invalidateQueries({ queryKey: ['learning-total'] });
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
      setSaveTarget(null);
      toast.success((data as { duplicated?: boolean }).duplicated ? 'Thẻ đã có trong thư mục này' : 'Đã lưu thẻ');
    },
    onError: (error: Error) => toast.error(error.message || 'Lưu thẻ thất bại'),
  });

  const openFolder = (folder: HubFolder) => {
    setActiveFolder(folder);
    setDetailPage(DEFAULT_PAGE);
    setDetailLimit(DEFAULT_LIMIT);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCreateFolder = () => {
    setFolderName('');
    setFolderDescription('');
    setFolderColor('matcha');
    setFolderModal({ mode: 'create' });
  };

  const openEditFolder = (folder: HubFolder) => {
    const source = folders.find((item) => item._id === folder.folderId);
    if (!source) return;

    setFolderName(source.name);
    setFolderDescription(source.description || '');
    setFolderColor(getFolderTone(source.color));
    setFolderModal({ mode: 'edit', folder: source });
  };

  const handleDeleteFolder = (folder: HubFolder) => {
    if (!folder.folderId || folder.folderId === 'all') return;
    if (!window.confirm(`Xóa thư mục "${folder.title}"? Các thẻ bên trong thư mục này sẽ bị xóa.`)) return;
    deleteFolderMutation.mutate(folder.folderId);
  };

  const handleFolderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = folderName.trim();
    const description = folderDescription.trim();

    if (!name) {
      toast.error('Tên thư mục không được để trống');
      return;
    }

    if (folderModal?.mode === 'edit' && folderModal.folder) {
      updateFolderMutation.mutate({
        id: folderModal.folder._id,
        payload: { name, description, color: folderColor },
      });
      return;
    }

    createFolderMutation.mutate({ name, description, color: folderColor });
  };

  const openSaveModal = (item: FlashcardItem) => {
    if (false && !folders.length) {
      setSaveTarget(null);
      openCreateFolder();
      toast.info('Tạo một thư mục trước khi lưu thẻ.');
      return;
    }

    setSaveTarget(item);
    setSaveFolderId(folders[0]?._id || '');
  };

  const readOnlyDetail = activeFolder?.kind !== 'user';

  return (
    <div className="min-h-screen bg-slate-50">
      {!activeFolder ? (
        <MainView
          personalFolders={personalFolders}
          vocabularyFolders={vocabularySystemFolders}
          kanjiJlptFolders={kanjiJlptSystemFolders}
          kanjiFreqFolders={kanjiFreqSystemFolders}
          totalSaved={totalSaved}
          folderCount={folders.length}
          onCreateFolder={openCreateFolder}
          onOpenFolder={openFolder}
          onEditFolder={openEditFolder}
          onDeleteFolder={handleDeleteFolder}
        />
      ) : (
        <FolderDetailView
          folder={activeFolder}
          data={detailQuery.data}
          isLoading={detailQuery.isLoading}
          readOnly={readOnlyDetail}
          onBack={() => setActiveFolder(null)}
          onPageChange={setDetailPage}
          onLimitChange={(limit) => {
            setDetailLimit(limit);
            setDetailPage(DEFAULT_PAGE);
          }}
          onSave={openSaveModal}
          onReview={(item, data) => updateItemMutation.mutate({ id: item.id, data })}
          onDelete={(id) => deleteItemMutation.mutate(id)}
        />
      )}

      <FolderModal
        state={folderModal}
        name={folderName}
        description={folderDescription}
        color={folderColor}
        isSaving={createFolderMutation.isPending || updateFolderMutation.isPending}
        onNameChange={setFolderName}
        onDescriptionChange={setFolderDescription}
        onColorChange={setFolderColor}
        onClose={() => setFolderModal(null)}
        onSubmit={handleFolderSubmit}
      />

      <SaveToFolderModal
        item={saveTarget}
        folders={folders}
        selectedFolderId={saveFolderId}
        isSaving={saveItemMutation.isPending}
        onFolderChange={setSaveFolderId}
        onClose={() => setSaveTarget(null)}
        onSave={() => saveItemMutation.mutate()}
        onCreateFolder={openCreateFolder}
      />
    </div>
  );
}
