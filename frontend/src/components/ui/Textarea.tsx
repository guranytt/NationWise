import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  return (
    <div className="flex flex-col gap-1 w-full font-sans">
      {label && (
        <label htmlFor={id} className="text-sm text-ink mb-1">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`px-3 py-2 bg-paper border border-rule text-ink text-sm focus:outline-none focus:border-ink placeholder-ink/40 transition-colors resize-y ${
          error ? 'border-critical focus:border-critical' : ''
        } ${className}`}
        {...props}
      />
      {error && <span className="text-xs text-critical mt-1">{error}</span>}
    </div>
  );
}
