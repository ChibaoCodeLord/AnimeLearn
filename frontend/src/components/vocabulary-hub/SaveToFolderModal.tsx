import { Button } from '@/components/ui/button';
import { Loader2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getFolderTone, getFolderToneClasses } from './palette';
import type { FlashcardItem, FolderItem } from './types';

interface SaveToFolderModalProps {
  item: FlashcardItem | null;
  folders: FolderItem[];
  selectedFolderId: string;
  isSaving: boolean;
  isLoadingFolders?: boolean;
  onFolderChange: (folderId: string) => void;
  onClose: () => void;
  onSave: () => void;
  onCreateFolder: () => void;
}

export function SaveToFolderModal({
  item,
  folders,
  selectedFolderId,
  isSaving,
  isLoadingFolders,
  onFolderChange,
  onClose,
  onSave,
  onCreateFolder,
}: SaveToFolderModalProps) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/40 px-4 overflow-y-auto overscroll-contain"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-emerald-700">Lưu thẻ</p>
            <h3 className="mt-1 break-words text-2xl font-semibold text-slate-900">{item.word}</h3>
            <p className="mt-1 text-sm text-slate-500">Chọn một thư mục cá nhân.</p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>

        {isLoadingFolders ? (
          <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-sm font-semibold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
            Đang tải thư mục...
          </div>
        ) : (
          <div className="mt-5">
            {/* Danh sách thư mục */}
            {folders.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {folders.map((folder) => {
                  const tone = getFolderToneClasses(
                    getFolderTone(folder.color),
                  );

                  const active =
                    selectedFolderId === folder._id;

                  return (
                    <button
                      key={folder._id}
                      type="button"
                      onClick={() =>
                        onFolderChange(folder._id)
                      }
                      className={cn(
                        `
                          relative overflow-hidden rounded-2xl border
                          bg-white p-4 text-left shadow-sm
                          transition-all duration-200
                          hover:-translate-y-0.5 hover:shadow-md
                        `,
                        tone.border,
                        active &&
                          'ring-2 ring-slate-900 ring-offset-2',
                      )}
                    >
                      <div
                        className={cn(
                          'absolute inset-x-0 top-0 h-2',
                          tone.swatch,
                        )}
                      />

                      <div className="min-w-0 pt-2">
                        <div
                          className={cn(
                            'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold',
                            tone.chip,
                          )}
                        >
                          {folder.itemCount || 0} thẻ
                        </div>

                        <div className="mt-3 truncate text-lg font-semibold text-slate-900">
                          {folder.name}
                        </div>

                        {folder.description && (
                          <div className="mt-1 line-clamp-2 wrap-break-word text-sm text-slate-500">
                            {folder.description}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <p className="text-sm font-medium text-slate-500">
                  Bạn chưa có thư mục cá nhân.
                </p>
              </div>
            )}

            {/* Luôn hiển thị nút tạo thư mục */}
            <button
              type="button"
              onClick={onCreateFolder}
              className="
                group mt-4 flex w-full items-center justify-center gap-2
                rounded-xl border border-dashed border-slate-300
                bg-white px-4 py-3
                text-sm font-semibold text-slate-600
                transition-colors
                hover:border-emerald-400
                hover:bg-emerald-50
                hover:text-emerald-700
              "
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
              Tạo thư mục mới
            </button>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button disabled={!selectedFolderId || isSaving} className="bg-slate-900 text-white hover:bg-slate-800" onClick={onSave}>
            Lưu vào sổ tay
          </Button>
        </div>
      </div>
    </div>
  );
}
