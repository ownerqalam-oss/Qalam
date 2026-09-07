"use client";

import { Button } from "./ui/Button";

const headingFont = "font-[family-name:var(--font-heading)]";
const bodyFont = "font-[family-name:var(--font-body)]";

interface PublishModalProps {
  open: boolean;
  type: string;
  onTypeChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;
  isAnonymous: boolean;
  onToggleAnonymous: () => void;
  coverImageUrl: string | null;
  onCoverUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover: () => void;
  uploadingCover: boolean;
  publishing: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function PublishModal({
  open,
  type,
  onTypeChange,
  tags,
  onTagsChange,
  isAnonymous,
  onToggleAnonymous,
  coverImageUrl,
  onCoverUpload,
  onRemoveCover,
  uploadingCover,
  publishing,
  onClose,
  onConfirm,
}: PublishModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-cream-card p-6 shadow-xl"
        style={{ maxHeight: "90vh" }}
        onClick={(event) => event.stopPropagation()}
      >
        <p
          className={`${bodyFont} text-[11px] font-medium uppercase tracking-[0.3em] text-brand-600`}
        >
          Last step
        </p>

        <h2 className={`${headingFont} mt-1 text-2xl font-medium text-brand-900`}>
          Ready to publish?
        </h2>

        <p className={`${bodyFont} mt-2 text-sm leading-6 text-ink-600`}>
          A few details before it goes to review.
        </p>

        {/* TYPE */}
        <div className="mt-6">
          <label className={`${bodyFont} mb-2 block text-sm font-medium text-ink-900`}>
            Type
          </label>

          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className={`${bodyFont} w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-brand-900`}
          >
            <option value="article">Article</option>
            <option value="reflection">Reflection</option>
            <option value="poetry">Poetry</option>
            <option value="story">Short Story</option>
          </select>
        </div>

        {/* TAGS */}
        <div className="mt-5">
          <label className={`${bodyFont} mb-2 block text-sm font-medium text-ink-900`}>
            Tags
          </label>

          <input
            value={tags}
            onChange={(e) => onTagsChange(e.target.value)}
            placeholder="e.g. History, Palestine, Seerah"
            className={`${bodyFont} w-full rounded-lg border border-border bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-900`}
          />
        </div>

        {/* COVER IMAGE */}
        <div className="mt-5">
          <label className={`${bodyFont} mb-2 block text-sm font-medium text-ink-900`}>
            Cover image
          </label>

          <label
            htmlFor="cover-upload"
            className={`relative flex h-32 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-white transition hover:border-brand-900 ${
              uploadingCover ? "pointer-events-none opacity-50" : "cursor-pointer"
            }`}
          >
            {coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className={`${bodyFont} text-sm text-ink-400`}>
                {uploadingCover ? "Uploading..." : "Add a cover image (optional)"}
              </span>
            )}
          </label>

          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={onCoverUpload}
            className="hidden"
            disabled={uploadingCover}
          />

          {coverImageUrl && (
            <button
              type="button"
              onClick={onRemoveCover}
              className={`${bodyFont} mt-2 text-xs text-danger-600 transition hover:underline`}
            >
              Remove cover image
            </button>
          )}
        </div>

        {/* ANONYMOUS */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5">
          <div>
            <p className={`${bodyFont} text-sm font-medium text-ink-900`}>
              Publish anonymously
            </p>

            <p className={`${bodyFont} mt-1 max-w-xs text-xs leading-5 text-ink-400`}>
              Your name won&apos;t be shown publicly. You&apos;ll still see it on your own profile.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleAnonymous}
            aria-label="Toggle anonymous publication"
            aria-pressed={isAnonymous}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isAnonymous ? "bg-brand-900" : "bg-border"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                isAnonymous ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="mt-7 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={publishing} className={bodyFont}>
            Cancel
          </Button>

          <Button onClick={onConfirm} disabled={publishing} className={bodyFont}>
            {publishing ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  );
}
