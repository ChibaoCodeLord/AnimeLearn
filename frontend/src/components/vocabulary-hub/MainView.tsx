import { Badge } from '@/components/ui/badge';
import { FolderGrid } from './FolderGrid';
import type { HubFolder } from './types';

interface MainViewProps {
  personalFolders: HubFolder[];
  vocabularyFolders: HubFolder[];
  kanjiJlptFolders: HubFolder[];
  kanjiFreqFolders: HubFolder[];
  totalSaved: number;
  folderCount: number;
  onCreateFolder: () => void;
  onOpenFolder: (folder: HubFolder) => void;
  onEditFolder: (folder: HubFolder) => void;
  onDeleteFolder: (folder: HubFolder) => void;
}

export function MainView({
  personalFolders,
  vocabularyFolders,
  kanjiJlptFolders,
  kanjiFreqFolders,
  totalSaved,
  folderCount,
  onCreateFolder,
  onOpenFolder,
  onEditFolder,
  onDeleteFolder,
}: MainViewProps) {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-emerald-700">AnimeLearn</p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            Sổ tay từ vựng
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Chọn một thư mục để xem kho thẻ. Flashcard chỉ mở khi bạn chủ động bấm học.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge className="bg-white px-3 py-1.5 text-slate-700 ring-1 ring-slate-200">{totalSaved} thẻ đã lưu</Badge>
          <Badge className="bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-100">{folderCount} thư mục</Badge>
        </div>
      </header>

      <div className="space-y-10">
        <FolderGrid
          title="Thư mục của tôi"
          description="Các bộ thẻ cá nhân của bạn. Mỗi folder có màu bìa riêng để dễ nhận diện."
          folders={personalFolders}
          showCreate
          onCreate={onCreateFolder}
          onOpen={onOpenFolder}
          onEdit={onEditFolder}
          onDelete={onDeleteFolder}
        />

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">Thư viện hệ thống</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Các thư mục có sẵn từ Dictionary và Kanji. Bạn có thể học thử hoặc lưu thẻ vào thư mục cá nhân.
            </p>
          </div>

          <FolderGrid
            title="Từ vựng phổ biến"
            description="Các nhóm từ vựng theo popularity score."
            folders={vocabularyFolders}
            onOpen={onOpenFolder}
          />

          <FolderGrid
            title="JLPT Kanji"
            description="Kanji hệ thống theo từng cấp độ JLPT."
            folders={kanjiJlptFolders}
            onOpen={onOpenFolder}
          />

          <FolderGrid
            title="Kanji phổ biến"
            description="Kanji được nhóm theo tần suất sử dụng."
            folders={kanjiFreqFolders}
            onOpen={onOpenFolder}
          />
        </section>
      </div>
    </main>
  );
}
