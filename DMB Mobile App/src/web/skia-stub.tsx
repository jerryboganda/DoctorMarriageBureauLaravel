import React from 'react';

type Props = Record<string, unknown> & { children?: React.ReactNode; style?: React.CSSProperties };

export const Canvas: React.FC<Props> = ({ children, style }) => (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}>
        {children}
    </div>
);

export const Rect: React.FC<Props> = () => null;
export const Circle: React.FC<Props> = () => null;
export const LinearGradient: React.FC<Props> = () => null;
export const BlurMask: React.FC<Props> = () => null;
export const vec = (x: number, y: number) => ({ x, y });
