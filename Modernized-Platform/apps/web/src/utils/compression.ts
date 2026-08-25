export const compressImage = async (file: File): Promise<File> => {
    // Return immediately for already small files
    const targetMaxSizeMB = 0.5;
    const targetMaxSizeBytes = targetMaxSizeMB * 1024 * 1024;
    if (file.size <= targetMaxSizeBytes) {
        return file;
    }

    if (typeof window === 'undefined') {
        return file;
    }

    try {
        // Dynamic import if browser-image-compression is available
        const imageCompression = (await import('browser-image-compression')).default;
        const options = {
            maxSizeMB: targetMaxSizeMB,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
        };
        const compressedFile = await imageCompression(file, options);
        return new File([compressedFile], file.name, { type: compressedFile.type || file.type });
    } catch (error) {
        // Fallback: Return original file if compression library isn't available
        return file;
    }
};
