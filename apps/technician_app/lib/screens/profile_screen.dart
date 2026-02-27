import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../services/sync_service.dart';
import '../services/offline_db.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  String? _name;
  String? _role;
  bool _isOnline = true;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final name = await ApiClient.instance.userName;
    final role = await ApiClient.instance.userRole;
    final online = await SyncService.instance.isOnline();
    setState(() { _name = name; _role = role; _isOnline = online; });
  }

  Future<void> _sync() async {
    setState(() => _syncing = true);
    try {
      await SyncService.instance.syncProjectsDown();
      final result = await SyncService.instance.syncUpdatesUp();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(result.message), backgroundColor: AppTheme.success),
        );
      }
    } finally {
      setState(() => _syncing = false);
    }
  }

  Future<void> _logout() async {
    try {
      final refresh = await ApiClient.instance.dio.options.headers['refresh_token'];
      await ApiClient.instance.dio.post('/auth/logout', data: {'refresh_token': refresh ?? ''});
    } catch (_) {}
    await ApiClient.instance.clearTokens();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Avatar
          Center(
            child: CircleAvatar(
              radius: 48,
              backgroundColor: AppTheme.primary,
              child: Text(
                (_name ?? 'T')[0].toUpperCase(),
                style: const TextStyle(fontSize: 36, color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Center(child: Text(_name ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold))),
          Center(child: Text(
            (_role ?? '').toUpperCase(),
            style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
          )),
          const SizedBox(height: 24),

          // Status card
          Card(
            child: ListTile(
              leading: Icon(_isOnline ? Icons.wifi : Icons.wifi_off,
                  color: _isOnline ? AppTheme.success : AppTheme.error),
              title: Text(_isOnline ? 'Online' : 'Offline'),
              subtitle: Text(_isOnline ? 'All features available' : 'Using cached data'),
            ),
          ),
          const SizedBox(height: 12),

          // Actions
          Card(
            child: Column(children: [
              ListTile(
                leading: const Icon(Icons.sync, color: AppTheme.primary),
                title: const Text('Sync Data'),
                subtitle: const Text('Upload pending changes & refresh projects'),
                trailing: _syncing
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.chevron_right),
                onTap: _syncing ? null : _sync,
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.logout, color: AppTheme.error),
                title: const Text('Sign Out', style: TextStyle(color: AppTheme.error)),
                onTap: () => showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Sign Out'),
                    content: const Text('Are you sure you want to sign out?'),
                    actions: [
                      TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                      ElevatedButton(
                        style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
                        onPressed: () { Navigator.pop(ctx); _logout(); },
                        child: const Text('Sign Out'),
                      ),
                    ],
                  ),
                ),
              ),
            ]),
          ),
        ],
      ),
    );
  }
}
