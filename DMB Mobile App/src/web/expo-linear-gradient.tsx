import React from 'react';

type LinearGradientProps = React.HTMLAttributes<HTMLDivElement> & {
    colors: string[];
    locations?: number[];
    start?: { x: number; y: number };
    end?: { x: number; y: number };
    style?: React.CSSProperties | React.CSSProperties[];
};

const flattenStyle = (style: LinearGradientProps['style']): React.CSSProperties | undefined => {
    if (Array.isArray(style)) {
        return Object.assign({}, ...style);
    }
    return style;
};

export const LinearGradient: React.FC<LinearGradientProps> = ({
    colors,
    locations,
    start,
    end,
    style,
    children,
    ...props
}) => {
    const angle =
        start && end ? Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI) : 180;
    const stops = colors.map((color, index) => {
        const location = locations?.[index];
        return location == null ? color : `${color} ${Math.round(location * 100)}%`;
    });

    return (
        <div
            {...props}
            style={{
                ...flattenStyle(style),
                backgroundImage: `linear-gradient(${angle}deg, ${stops.join(', ')})`,
            }}
        >
            {children}
        </div>
    );
};
