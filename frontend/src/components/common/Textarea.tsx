import { forwardRef } from 'react';
import { cn, getInputClasses, textColors } from '../../styles/design-system';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: 'default' | 'minimal' | 'glass';
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      hint,
      variant = 'default',
      required = false,
      disabled = false,
      className,
      containerClassName,
      id,
      name,
      rows = 4,
      ...rest
    },
    ref
  ) => {
    const textareaId = id || name;

    return (
      <div className={cn('mb-4', containerClassName)}>
        {label && (
          <label
            htmlFor={textareaId}
            className={cn('mb-2 block text-xs font-bold uppercase tracking-wide', textColors.label)}
          >
            {label}
            {required && <span className="ml-1 text-danger-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          required={required}
          disabled={disabled}
          className={cn(getInputClasses(variant, !!error), 'min-h-28 resize-y', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error && textareaId ? `${textareaId}-error` : hint && textareaId ? `${textareaId}-hint` : undefined
          }
          {...rest}
        />

        {hint && !error && (
          <p id={textareaId ? `${textareaId}-hint` : undefined} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        )}
        {error && (
          <p
            id={textareaId ? `${textareaId}-error` : undefined}
            className="mt-1.5 flex items-center gap-1 text-sm font-medium text-danger-600"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
