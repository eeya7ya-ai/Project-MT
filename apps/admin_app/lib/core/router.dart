import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../screens/auth/login_screen.dart';
import '../screens/projects/projects_screen.dart';
import '../screens/projects/project_detail_screen.dart';
import '../screens/projects/create_project_screen.dart';
import '../screens/modules/module_detail_screen.dart';
import '../screens/modules/excel_import_screen.dart';
import 'constants.dart';

final _storage = FlutterSecureStorage();

Future<String?> _getToken() => _storage.read(key: AppConstants.accessTokenKey);

final appRouter = GoRouter(
  initialLocation: '/projects',
  redirect: (context, state) async {
    final token = await _getToken();
    final isLogin = state.matchedLocation == '/login';
    if (token == null && !isLogin) return '/login';
    if (token != null && isLogin) return '/projects';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    GoRoute(
      path: '/projects',
      builder: (_, __) => const ProjectsScreen(),
      routes: [
        GoRoute(path: 'create', builder: (_, __) => const CreateProjectScreen()),
        GoRoute(
          path: ':id',
          builder: (_, state) => ProjectDetailScreen(projectId: state.pathParameters['id']!),
          routes: [
            GoRoute(
              path: 'edit',
              builder: (_, state) => CreateProjectScreen(projectId: state.pathParameters['id']!),
            ),
            GoRoute(
              path: 'modules/:type',
              builder: (_, state) => ModuleDetailScreen(
                projectId: state.pathParameters['id']!,
                moduleType: state.pathParameters['type']!,
              ),
              routes: [
                GoRoute(
                  path: 'import',
                  builder: (_, state) => ExcelImportScreen(
                    moduleId: state.uri.queryParameters['moduleId'] ?? '',
                    moduleType: state.pathParameters['type']!,
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  ],
);
