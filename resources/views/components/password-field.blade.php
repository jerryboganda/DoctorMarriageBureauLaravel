@props([
    'id',
    'name' => null,
    'label' => null,
    'placeholder' => '',
    'value' => null,
    'autocomplete' => null,
    'required' => false,
    'autofocus' => false,
    'disabled' => false,
    'wrapperClass' => 'space-y-2',
    'inputClass' => 'form-control',
    'labelClass' => '',
    'helpText' => null,
    'helpClass' => 'text-xs text-slate-500',
    'errorName' => null,
    'showToggle' => true,
    'buttonClass' => '',
    'iconClass' => 'w-5 h-5',
])

@php
    $fieldName = $name ?? $id;
    $errorKey = $errorName ?? $fieldName;
@endphp

<div class="{{ $wrapperClass }}">
    @if (!empty($label))
        <label for="{{ $id }}" class="{{ $labelClass }}">{{ $label }}</label>
    @endif

    <div class="relative group password-field" data-password-field>
        <input
            id="{{ $id }}"
            name="{{ $fieldName }}"
            value="{{ $value }}"
            placeholder="{{ $placeholder }}"
            type="password"
            @if (!is_null($autocomplete))
                autocomplete="{{ $autocomplete }}"
            @endif
            @if ($required)
                required
            @endif
            @if ($autofocus)
                autofocus
            @endif
            @if ($disabled)
                disabled
            @endif
            {{ $attributes->merge(['class' => $inputClass]) }}
            style="padding-right: 3rem;"
        >

        @if ($showToggle)
            <button
                type="button"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-full p-1 {{ $buttonClass }}"
                data-password-toggle
                aria-label="{{ translate('Show password') }}"
                aria-pressed="false"
            >
                <svg data-password-icon-show class="{{ $iconClass }}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M2.1 12c1.8-4.9 6.4-8 9.9-8s8.1 3.1 9.9 8c-1.8 4.9-6.4 8-9.9 8s-8.1-3.1-9.9-8Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                <svg data-password-icon-hide class="{{ $iconClass }} hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 3l18 18"></path>
                    <path d="M10.58 10.58A3 3 0 0 0 13.42 13.42"></path>
                    <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c3.5 0 8.1 3.1 9.9 8a12.62 12.62 0 0 1-4.02 5.13"></path>
                    <path d="M6.1 6.1C3.82 7.73 2.28 10.01 2.1 12c1.8 4.9 6.4 8 9.9 8 1.08 0 2.26-.2 3.41-.6"></path>
                </svg>
            </button>
        @endif
    </div>

    @if (!empty($helpText))
        <p class="{{ $helpClass }}">{{ $helpText }}</p>
    @endif

    @error($errorKey)
        <span class="text-red-500 text-xs mt-1 block" role="alert">
            <strong>{{ $message }}</strong>
        </span>
    @enderror
</div>

@once
    <script>
        document.addEventListener('click', function (event) {
            const button = event.target.closest('[data-password-toggle]');
            if (!button) return;

            const field = button.closest('[data-password-field]');
            if (!field) return;

            const input = field.querySelector('input');
            if (!input) return;

            const showIcon = button.querySelector('[data-password-icon-show]');
            const hideIcon = button.querySelector('[data-password-icon-hide]');
            const revealing = input.type === 'password';

            input.type = revealing ? 'text' : 'password';
            button.setAttribute('aria-label', revealing ? @json(translate('Hide password')) : @json(translate('Show password')));
            button.setAttribute('aria-pressed', revealing ? 'true' : 'false');

            if (showIcon) {
                showIcon.classList.toggle('hidden', !revealing);
            }

            if (hideIcon) {
                hideIcon.classList.toggle('hidden', revealing);
            }
        });
    </script>
@endonce
