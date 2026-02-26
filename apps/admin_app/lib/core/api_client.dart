import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'constants.dart';

class ApiClient {
  static ApiClient? _instance;
  late final Dio dio;
  final _storage = const FlutterSecureStorage();

  ApiClient._() {
    dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: AppConstants.accessTokenKey);
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _tryRefresh();
          if (refreshed) {
            final token = await _storage.read(key: AppConstants.accessTokenKey);
            error.requestOptions.headers['Authorization'] = 'Bearer $token';
            final response = await dio.fetch(error.requestOptions);
            handler.resolve(response);
            return;
          }
        }
        handler.next(error);
      },
    ));
  }

  static ApiClient get instance => _instance ??= ApiClient._();

  Future<bool> _tryRefresh() async {
    try {
      final refresh = await _storage.read(key: AppConstants.refreshTokenKey);
      if (refresh == null) return false;
      final res = await Dio().post(
        '${AppConstants.baseUrl}/auth/refresh',
        data: {'refresh_token': refresh},
      );
      await _storage.write(key: AppConstants.accessTokenKey, value: res.data['access_token']);
      await _storage.write(key: AppConstants.refreshTokenKey, value: res.data['refresh_token']);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> saveTokens(Map<String, dynamic> data) async {
    await _storage.write(key: AppConstants.accessTokenKey, value: data['access_token']);
    await _storage.write(key: AppConstants.refreshTokenKey, value: data['refresh_token']);
    await _storage.write(key: AppConstants.userRoleKey, value: data['role']);
    await _storage.write(key: AppConstants.userIdKey, value: data['user_id']);
    await _storage.write(key: AppConstants.userNameKey, value: data['full_name']);
  }

  Future<void> clearTokens() async {
    await _storage.deleteAll();
  }

  Future<String?> get userRole => _storage.read(key: AppConstants.userRoleKey);
  Future<String?> get userName => _storage.read(key: AppConstants.userNameKey);
  Future<String?> get userId => _storage.read(key: AppConstants.userIdKey);
}
