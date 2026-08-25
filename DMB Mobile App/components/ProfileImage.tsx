import React, { useEffect, useState } from 'react';
import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';
import { getProfileFallbackImageUrl, getProfileImageUrl } from '../utils/api';

interface ProfileImageProps {
    path?: string | null;
    gender?: number | string | null;
    className?: string;
    style?: StyleProp<ImageStyle>;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    placeholder?: string;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
    path,
    gender,
    className,
    style,
    contentFit = 'cover',
    placeholder,
}) => {
    const fallbackUrl = getProfileFallbackImageUrl(gender);
    const requestedUrl = getProfileImageUrl(path) || fallbackUrl;
    const [sourceUrl, setSourceUrl] = useState(requestedUrl);

    useEffect(() => {
        setSourceUrl(requestedUrl);
    }, [requestedUrl]);

    return (
        <Image
            source={{ uri: sourceUrl }}
            className={className}
            style={style}
            contentFit={contentFit}
            placeholder={placeholder}
            onError={() => {
                setSourceUrl((currentUrl) =>
                    currentUrl === fallbackUrl ? currentUrl : fallbackUrl,
                );
            }}
        />
    );
};

export default ProfileImage;
