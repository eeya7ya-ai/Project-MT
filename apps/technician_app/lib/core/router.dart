import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../screens/auth/login_screen.dart';
import '../screens/projects/projects_screen.dart';
import '../screens/projects/project_detail_screen.dart';
import '../screens/modules/module_checklist_screen.dart';
import '../screens/schedule_screen.dart';
import '../screens/profile_screen.dart';
import 'constants.dart';

final _storage = const FlutterSecureStorage();

final techRouter = GoRouter(
  initialLocation: '/projects',
  redirect: (context, state) async {
    final token = await _storage.read(key: AppConstants.accessTokenKey);
    final isLogin = state.matchedLocation == '/login';
    if (token == null && !isLogin) return '/login';
    if (token != null && isLogin) return '/projects';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (context, state, child) => _Shell(child: child),
      routes: [
        GoRoute(
          path: '/projects',
          builder: (_, __) => const ProjectsScreen(),
          routes: [
            GoRoute(
              path: ':id',
              builder: (_, state) => ProjectDetailScreen(projectId: state.pathParameters['id']!),
              routes: [
                GoRoute(
                  path: 'modules/:type',
                  builder: (_, state) => ModuleChecklistScreen(
                    projectId: state.pathParameters['id']!,
                    moduleType: state.pathParameters['type']!,
                  ),
                ),
              ],
            ),
          ],
        ),
        GoRoute(path: '/schedule', builder: (_, __) => const ScheduleScreen()),
        GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      ],
    ),
  ],
);

class _Shell extends StatelessWidget {
  final Widget child;
  const _Shell({required this.child});

  int _index(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    if (loc.startsWith('/schedule')) return 1;
    if (loc.startsWith('/profile')) return 2;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index(context),
        onTap: (i) {
          switch (i) {
            case 0: context.go('/projects'); break;
            case 1: context.go('/schedule'); break;
            case 2: context.go('/profile'); break;
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.folder_open), label: 'Projects'),
          BottomNavigationBarItem(icon: Icon(Icons.calendar_today), label: 'Schedule'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
