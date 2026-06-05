import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = {
    label?: React.ReactNode;
    helperText?: React.ReactNode;
    errorText?: React.ReactNode;
    value: string;
    onChange: React.ChangeEventHandler<HTMLInputElement>;
    placeholder?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    required?: boolean;
    autoComplete?: string;
    name?: string;
    id?: string;
    leftIcon?: React.ReactNode;
    containerClassName?: string;
    labelClassName?: string;
    wrapperClassName?: string;
    inputClassName?: string;
    toggleClassName?: string;
    showToggle?: boolean;
    onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
    maxLength?: number;
    'aria-label'?: string;
};

const PasswordField: React.FC<PasswordFieldProps> = ({
    label,
    helperText,
    errorText,
    value,
    onChange,
    placeholder,
    autoFocus,
    disabled,
    required,
    autoComplete = 'current-password',
    name,
    id,
    leftIcon,
    containerClassName = 'space-y-2',
    labelClassName = 'text-xs font-bold text-slate-700 uppercase mb-1 block',
    wrapperClassName = '',
    inputClassName = '',
    toggleClassName = '',
    showToggle = true,
    onKeyDown,
    onBlur,
    inputMode,
    maxLength,
    'aria-label': ariaLabel,
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [visible, setVisible] = useState(false);

    return (
        <div className={containerClassName}>
            {label && (
                <label htmlFor={inputId} className={labelClassName}>
                    {label}
                </label>
            )}

            <div className={`relative ${wrapperClassName}`.trim()}>
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        {leftIcon}
                    </div>
                )}

                <input
                    id={inputId}
                    name={name}
                    type={visible ? 'text' : 'password'}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    className={[
                        'w-full outline-none transition-all',
                        leftIcon ? 'pl-10' : 'pl-4',
                        showToggle ? 'pr-12' : 'pr-4',
                        'disabled:opacity-60 disabled:cursor-not-allowed',
                        inputClassName,
                    ]
                        .filter(Boolean)
                        .join(' ')}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onBlur={onBlur}
                    inputMode={inputMode}
                    maxLength={maxLength}
                    required={required}
                    disabled={disabled}
                    aria-label={ariaLabel}
                />

                {showToggle && (
                    <button
                        type="button"
                        onClick={() => setVisible((prev) => !prev)}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors ${toggleClassName}`.trim()}
                        aria-label={visible ? 'Hide password' : 'Show password'}
                        title={visible ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                    >
                        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                )}
            </div>

            {errorText ? (
                <div className="flex gap-2 items-start text-red-500 text-xs font-bold">
                    <span>{errorText}</span>
                </div>
            ) : helperText ? (
                <div className="text-[10px] text-slate-400 mt-1">{helperText}</div>
            ) : null}
        </div>
    );
};

export default PasswordField;
