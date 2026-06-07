import { Button } from '@/components/ui/button';
import { FolderCard, CreateFolderCard } from './FolderCard';
import type { HubFolder } from './types';

interface FolderGridProps {
  title: string;
  description: string;
  folders: HubFolder[];
  activeId?: string;
  showCreate?: boolean;
  onCreate?: () => void;
  onOpen: (folder: HubFolder) => void;
  onEdit?: (folder: HubFolder) => void;
  onDelete?: (folder: HubFolder) => void;
}

export function FolderGrid({
  title,
  description,
  folders,
  activeId,
  showCreate,
  onCreate,
  onOpen,
  onEdit,
  onDelete,
}: FolderGridProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {showCreate && onCreate && <CreateFolderCard onCreate={onCreate} />}
        {folders.map((folder) => {
          const editable = folder.kind === 'user' && folder.folderId && folder.folderId !== 'all';

          return (
            <FolderCard
              key={folder.id}
              folder={folder}
              active={activeId === folder.id}
              onOpen={onOpen}
              actionSlot={
                editable ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="bg-white/90 text-slate-700 shadow-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onEdit?.(folder);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      className="bg-white/90 shadow-sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete?.(folder);
                      }}
                    >
                      Xóa
                    </Button>
                  </>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}
