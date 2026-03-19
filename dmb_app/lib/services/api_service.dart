import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/api_config.dart';

/// Mirrors utils/api.ts — Axios-style Dio instance with Bearer token
/// and language header interceptors, plus auto-logout on deactivated/blocked.
class ApiService {
  late final Dio dio;
  final FlutterSecureStorage _storage;

  // Callback to signal auth reset (set by AuthProvider)
  void Function()? onAuthReset;

  ApiService({FlutterSecureStorage? storage})
      : _storage = storage ?? const FlutterSecureStorage() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ));

    // Request interceptor: attach Bearer token + App-Language
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        final lang = await _storage.read(key: 'lang') ?? 'en';
        options.headers['App-Language'] = lang;
        handler.next(options);
      },
      onError: (error, handler) async {
        final data = error.response?.data;
        if (data is Map<String, dynamic>) {
          final code = data['code'];
          final status = data['status'];
          if (code == 'ACCOUNT_DEACTIVATED' ||
              code == 'ACCOUNT_BLOCKED' ||
              status == 'deactivated' ||
              status == 'blocked') {
            await _storage.delete(key: 'auth_token');
            onAuthReset?.call();
          }
        }
        handler.next(error);
      },
    ));
  }

  // ── Convenience methods ──

  Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) {
    return dio.get(path, queryParameters: queryParameters);
  }

  Future<Response> post(String path, {dynamic data}) {
    return dio.post(path, data: data);
  }

  Future<Response> put(String path, {dynamic data}) {
    return dio.put(path, data: data);
  }

  Future<Response> delete(String path, {dynamic data}) {
    return dio.delete(path, data: data);
  }

  /// Upload file with multipart form data
  Future<Response> uploadFile(
    String path,
    File file,
    String fieldName, {
    Map<String, dynamic>? extraFields,
  }) async {
    final formData = FormData.fromMap({
      fieldName: await MultipartFile.fromFile(
        file.path,
        filename: file.path.split('/').last,
      ),
      ...?extraFields,
    });
    return dio.post(
      path,
      data: formData,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
    );
  }

  // ── Token management ──

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<String?> getToken() async {
    return _storage.read(key: 'auth_token');
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
  }

  Future<void> setLanguage(String lang) async {
    await _storage.write(key: 'lang', value: lang);
  }

  Future<String> getLanguage() async {
    return await _storage.read(key: 'lang') ?? 'en';
  }
}
