import React from 'react';

export default function codegenNativeComponent(name: string) {
    const GeneratedComponent = React.forwardRef<
        HTMLElement,
        Record<string, unknown> & { children?: React.ReactNode }
    >(({ children, ...props }, ref) =>
        React.createElement(
            'div',
            {
                ...(props as React.HTMLAttributes<HTMLDivElement>),
                ref,
                'data-native-component': name,
            },
            children as React.ReactNode,
        ),
    );
    GeneratedComponent.displayName = name;
    return GeneratedComponent;
}
