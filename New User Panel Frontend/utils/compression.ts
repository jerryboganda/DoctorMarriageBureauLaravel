import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File) => {
    const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: 'image/webp'
    };

    try {
        console.log(`Original file size: ${file.size / 1024 / 1024} MB`);
        const compressedFile = await imageCompression(file, options);
        console.log(`Compressed file size: ${compressedFile.size / 1024 / 1024} MB`);

        // Ensure the file name is preserved but with webp extension if applicable
        const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
        return new File([compressedFile], fileName, { type: 'image/webp' });
    } catch (error) {
        console.error('Image compression failed:', error);
        return file; // Fallback to original file
    }
};
