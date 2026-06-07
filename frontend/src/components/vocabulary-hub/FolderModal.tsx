import type { FormEvent } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  FOLDER_TONES,
  getFolderToneClasses,
} from './palette';
import type {
  FolderModalState,
  FolderTone,
} from './types';

interface FolderModalProps {
  state: FolderModalState | null;
  name: string;
  description: string;
  color: FolderTone;
  isSaving: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onColorChange: (value: FolderTone) => void;
  onClose: () => void;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
  ) => void;
}

export function FolderModal({
  state,
  name,
  description,
  color,
  isSaving,
  onNameChange,
  onDescriptionChange,
  onColorChange,
  onClose,
  onSubmit,
}: FolderModalProps) {
  if (!state) return null;

  return (
    <div
      className="fixed overflow-y-auto overscroll-contain inset-0 z-100 flex items-center justify-center bg-slate-950/45 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        className="w-full max-w-lg rounded-lg border border-white/70 bg-white p-5 shadow-2xl overscroll-contain"
        onSubmit={onSubmit}
      >
        <div className="flex items-start justify-between gap-4 ">
          <div>
            <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-700">
              Folder Studio
            </div>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              {state.mode === 'create'
                ? 'Tạo thư mục mới'
                : 'Sửa thư mục'}
            </h3>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          <Input
            value={name}
            onChange={(event) =>
              onNameChange(event.target.value)
            }
            placeholder="Tên thư mục"
            className="h-11 text-base"
          />

          <Input
            value={description}
            onChange={(event) =>
              onDescriptionChange(
                event.target.value,
              )
            }
            placeholder="Mô tả ngắn"
            className="h-11 text-base"
          />
        </div>

        <div className="mt-5">
          <div className="mb-2 text-sm font-bold text-slate-700">
            Màu bìa
          </div>

          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {FOLDER_TONES.map((tone) => {
              const classes =
                getFolderToneClasses(tone.id);

              const active =
                color === tone.id;

              return (
                <button
                  key={tone.id}
                  type="button"
                  onClick={() =>
                    onColorChange(tone.id)
                  }
                  className={cn(
                    'rounded-lg border p-2 text-left transition-all duration-300 hover:-translate-y-0.5',
                    active
                      ? 'border-slate-900 shadow-md'
                      : 'border-slate-200',
                  )}
                >
                  <span
                    className={cn(
                      'block h-10 rounded-md',
                      classes.swatch,
                    )}
                  />

                  <span className="mt-2 block text-xs font-bold text-slate-600">
                    {tone.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Hủy
          </Button>

          <Button
            type="submit"
            disabled={isSaving}
            className={
              getFolderToneClasses(color).button
            }
          >
            {state.mode === 'create'
              ? 'Tạo thư mục'
              : 'Lưu thay đổi'}
          </Button>
        </div>
      </form>
    </div>
  );
}