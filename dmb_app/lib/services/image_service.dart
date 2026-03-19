import 'dart:io';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';
import '../config/constants.dart';

/// Image compression and picking service
/// Matches React frontend image upload behavior with compression before upload
class ImageService {
  static final ImageService _instance = ImageService._();
  factory ImageService() => _instance;
  ImageService._();

  final _picker = ImagePicker();

  /// Pick single image from gallery
  Future<File?> pickFromGallery() async {
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked == null) return null;
    return _compressFile(File(picked.path));
  }

  /// Pick single image from camera
  Future<File?> pickFromCamera() async {
    final picked = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked == null) return null;
    return _compressFile(File(picked.path));
  }

  /// Pick multiple images from gallery
  Future<List<File>> pickMultiple({int maxCount = 10}) async {
    final picked = await _picker.pickMultiImage(
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked.isEmpty) return [];

    final files = picked.take(maxCount).toList();
    final compressed = <File>[];
    for (final f in files) {
      final result = await _compressFile(File(f.path));
      if (result != null) compressed.add(result);
    }
    return compressed;
  }

  /// Compress file before upload
  Future<File?> _compressFile(File file) async {
    try {
      final filePath = file.absolute.path;
      final lastDot = filePath.lastIndexOf('.');
      final targetPath = lastDot != -1
          ? '${filePath.substring(0, lastDot)}_compressed.jpg'
          : '${filePath}_compressed.jpg';

      final result = await FlutterImageCompress.compressAndGetFile(
        filePath,
        targetPath,
        quality: AppConstants.imageQuality,
        minWidth: 200,
        minHeight: 200,
      );

      if (result == null) return file;
      return File(result.path);
    } catch (_) {
      // If compression fails, return original
      return file;
    }
  }

  /// Show image source picker dialog
  Future<File?> showImageSourcePicker(
    dynamic context, {
    bool allowCamera = true,
  }) async {
    // This will be called with a BuildContext
    // For now, default to gallery
    return pickFromGallery();
  }
}
