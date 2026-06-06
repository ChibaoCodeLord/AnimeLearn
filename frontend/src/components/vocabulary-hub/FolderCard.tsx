import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getFolderToneClasses } from './palette';
import type { HubFolder } from './types';

interface FolderCardProps {
  folder: HubFolder;
  active?: boolean;
  actionSlot?: ReactNode;
  onOpen: (folder: HubFolder) => void;
}

export function FolderCard({ folder, active, actionSlot, onOpen }: FolderCardProps) {
  const tone = getFolderToneClasses(folder.color);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className={cn(
        'group relative min-h-40 overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
        tone.border,
        active && 'ring-2 ring-slate-300',
      )}
    >
      {actionSlot && (
        <div className="absolute right-3 top-3 z-20 flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          {actionSlot}
        </div>
      )}

      <button type="button" onClick={() => onOpen(folder)} className="relative flex h-full w-full flex-col items-start p-5 text-left">
        <div className={cn('absolute inset-x-0 top-0 h-2', tone.swatch)} />
        <div className={cn('absolute -right-5 -top-5 size-24 rounded-full opacity-25', tone.swatch)} />
        <div className="absolute bottom-3 right-4 text-5xl font-black text-slate-100 transition-transform duration-300 group-hover:scale-105">
          {folder.marker}
        </div>

        <div className="relative z-10 flex min-h-32 w-full flex-col justify-between">
          <div>
            <div className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-semibold', tone.chip)}>
              {folder.subtitle}
            </div>
            <h3 className="mt-4 line-clamp-2 break-words text-lg font-semibold leading-snug text-slate-900">
              {folder.title}
            </h3>
            {folder.description && (
              <p className="mt-2 line-clamp-2 break-words text-sm leading-5 text-slate-500">{folder.description}</p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">AnimeLearn</span>
            {typeof folder.count === 'number' && (
              <span className="rounded-full bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-100">
                {folder.count} thẻ
              </span>
            )}
          </div>
        </div>
      </button>
    </motion.div>
  );
}

interface CreateFolderCardProps {
  onCreate: () => void;
}

export function CreateFolderCard({ onCreate }: CreateFolderCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onCreate}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="group min-h-40 rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-md"
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          <div className="text-4xl font-semibold text-emerald-600 transition-transform duration-300 group-hover:scale-105">+</div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-slate-900">Tạo thư mục mới</h3>
          <p className="mt-2 text-sm leading-5 text-slate-500">Chọn màu bìa và gom thẻ theo chủ đề riêng.</p>
        </div>
        <span className="text-xs font-medium text-emerald-700">New folder</span>
      </div>
    </motion.button>
  );
}
