import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File) => {
    // Skip compression for already-small files to avoid UX delay.
    const targetMaxSizeMB = 0.5;
    const targetMaxSizeBytes = targetMaxSizeMB * 1024 * 1024;
    if (file.size <= targetMaxSizeBytes) {
        return file;
    }

    const options = {
        maxSizeMB: targetMaxSizeMB, // 500KB
        maxWidthOrHeight: 1200,
        useWebWorker: true
    };

    try {
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);

        // Preserve original extension/type so backend validation stays compatible.
        return new File([compressedFile], file.name, { type: compressedFile.type || file.type });
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original file
    }
};
