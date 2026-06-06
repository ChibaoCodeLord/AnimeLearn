import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { vocabularyApi } from '@/api/vocabulary.api';
import { FolderModal } from './FolderModal';
import { SaveToFolderModal } from './SaveToFolderModal';
import type { FlashcardItem, FolderModalState, FolderTone } from './types';

interface LearningSaveModalProps {
  item: FlashcardItem | null;
  onClose: () => void;
  onSaved?: (item: FlashcardItem) => void;
}

export function LearningSaveModal({ item, onClose, onSaved }: LearningSaveModalProps) {
  const queryClient = useQueryClient();
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [folderModal, setFolderModal] = useState<FolderModalState | null>(null);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState<FolderTone>('matcha');

  const foldersQuery = useQuery({
    queryKey: ['learning-folders'],
    queryFn: () => vocabularyApi.getFolders(),
    enabled: Boolean(item),
  });

  const folders = foldersQuery.data || [];

  useEffect(() => {
    if (!item) {
      setSelectedFolderId('');
      setFolderModal(null);
      return;
    }

    if (!selectedFolderId && folders[0]?._id) {
      setSelectedFolderId(folders[0]._id);
    }
  }, [folders, item, selectedFolderId]);

  const createFolderMutation = useMutation({
    mutationFn: (payload: { name: string; description?: string; color: FolderTone }) =>
      vocabularyApi.createFolder(payload),
    onSuccess: (folder) => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      setSelectedFolderId(folder._id);
      setFolderModal(null);
      toast.success('Đã tạo thư mục');
    },
    onError: (error: Error) => toast.error(error.message || 'Tạo thư mục thất bại'),
  });

  const saveItemMutation = useMutation({
    mutationFn: () => {
      if (!item) throw new Error('Không có thẻ để lưu');
      if (!selectedFolderId) throw new Error('Chọn thư mục trước khi lưu');

      return vocabularyApi.saveLearningItem({
        item_type: item.item_type,
        itemId: item.id,
        word: item.word,
        folderId: selectedFolderId,
        reading: item.reading,
        meaning_vi: item.meaning_vi,
        meaning_en: item.meaning_en,
        part_of_speech: item.part_of_speech,
        jlpt_level: item.jlpt_level,
        popularity_score: item.popularity_score,
        on: item.on,
        kun: item.kun,
        mean: item.mean,
        stroke_count: item.stroke_count,
        freq: item.freq,
        detail: item.detail,
        example_sentence: item.example_sentence,
        example_meaning: item.example_meaning,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['learning-folders'] });
      queryClient.invalidateQueries({ queryKey: ['learning-total'] });
      queryClient.invalidateQueries({ queryKey: ['folder-detail'] });
      toast.success((data as { duplicated?: boolean }).duplicated ? 'Thẻ đã có trong thư mục này' : 'Đã lưu thẻ');
      if (item) onSaved?.(item);
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || 'Lưu thẻ thất bại'),
  });

  const openCreateFolder = () => {
    setFolderName('');
    setFolderDescription('');
    setFolderColor('matcha');
    setFolderModal({ mode: 'create' });
  };

  const handleFolderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = folderName.trim();
    const description = folderDescription.trim();

    if (!name) {
      toast.error('Tên thư mục không được để trống');
      return;
    }

    createFolderMutation.mutate({ name, description, color: folderColor });
  };

  return (
    <>
      <SaveToFolderModal
        item={item}
        folders={folders}
        selectedFolderId={selectedFolderId}
        isSaving={saveItemMutation.isPending}
        isLoadingFolders={foldersQuery.isLoading}
        onFolderChange={setSelectedFolderId}
        onClose={onClose}
        onSave={() => saveItemMutation.mutate()}
        onCreateFolder={openCreateFolder}
      />

      <FolderModal
        state={folderModal}
        name={folderName}
        description={folderDescription}
        color={folderColor}
        isSaving={createFolderMutation.isPending}
        onNameChange={setFolderName}
        onDescriptionChange={setFolderDescription}
        onColorChange={setFolderColor}
        onClose={() => setFolderModal(null)}
        onSubmit={handleFolderSubmit}
      />
    </>
  );
}
