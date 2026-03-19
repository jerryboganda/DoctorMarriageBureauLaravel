import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:image_picker/image_picker.dart';
import '../config/constants.dart';

/// Image picking service (compression handled by image_picker quality param)
/// flutter_image_compress is disabled for web builds — re-enable for mobile APK/IPA builds
class ImageService {
  static final ImageService _instance = ImageService._();
  factory ImageService() => _instance;
  ImageService._();

  final _picker = ImagePicker();

  /// Pick single image from gallery
  Future<File?> pickFromGallery() async {
    if (kIsWeb) return null; // Not supported on web
    final picked = await _picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked == null) return null;
    return File(picked.path);
  }

  /// Pick single image from camera
  Future<File?> pickFromCamera() async {
    if (kIsWeb) return null; // Not supported on web
    final picked = await _picker.pickImage(
      source: ImageSource.camera,
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked == null) return null;
    return File(picked.path);
  }

  /// Pick multiple images from gallery
  Future<List<File>> pickMultiple({int maxCount = 10}) async {
    if (kIsWeb) return [];
    final picked = await _picker.pickMultiImage(
      maxWidth: AppConstants.imageMaxWidth.toDouble(),
      maxHeight: AppConstants.imageMaxHeight.toDouble(),
      imageQuality: AppConstants.imageQuality,
    );
    if (picked.isEmpty) return [];
    return picked.take(maxCount).map((f) => File(f.path)).toList();
  }
}
