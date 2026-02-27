import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../services/offline_db.dart';
import '../../services/sync_service.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/offline_banner.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Map<String, dynamic>> _projects = [];
  bool _loading = true;
  bool _isOnline = true;
  bool _syncing = false;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
    _loadProjects();
  }

  Future<void> _checkConnectivity() async {
    final online = await SyncService.instance.isOnline();
    setState(() => _isOnline = online);
  }

  Future<void> _loadProjects() async {
    setState(() => _loading = true);
    try {
      final online = await SyncService.instance.isOnline();
      setState(() => _isOnline = online);

      if (online) {
        final res = await ApiClient.instance.dio.get('/technician/my-projects');
        final projects = (res.data as List).cast<Map<String, dynamic>>();
        // Cache to SQLite
        for (final p in projects) {
          await OfflineDB.instance.upsertProject(p);
        }
        setState(() => _projects = projects);
      } else {
        // Offline: load from SQLite cache
        final cached = await OfflineDB.instance.getProjects();
        setState(() => _projects = cached);
      }
    } catch (e) {
      // Fallback to cache on error
      final cached = await OfflineDB.instance.getProjects();
      setState(() { _projects = cached; _isOnline = false; });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _sync() async {
    setState(() => _syncing = true);
    try {
      await SyncService.instance.syncProjectsDown();
      final result = await SyncService.instance.syncUpdatesUp();
      await _loadProjects();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(result.message),
          backgroundColor: result.offline ? AppTheme.warning : AppTheme.success,
        ));
      }
    } finally {
      setState(() => _syncing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Projects'),
        actions: [
          _syncing
              ? const Padding(
                  padding: EdgeInsets.all(16),
                  child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)),
                )
              : IconButton(icon: const Icon(Icons.sync), onPressed: _sync, tooltip: 'Sync'),
        ],
      ),
      body: Column(
        children: [
          if (!_isOnline) const OfflineBanner(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _projects.isEmpty
                    ? _buildEmpty()
                    : RefreshIndicator(
                        onRefresh: _loadProjects,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _projects.length,
                          itemBuilder: (ctx, i) => _buildProjectCard(_projects[i]),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.folder_off, size: 64, color: AppTheme.textSecondary.withOpacity(0.4)),
          const SizedBox(height: 16),
          const Text('No projects assigned', style: TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
          if (!_isOnline) const Padding(
            padding: EdgeInsets.only(top: 8),
            child: Text('You\'re offline. Connect to sync projects.', style: TextStyle(color: AppTheme.warning, fontSize: 13)),
          ),
        ],
      ),
    );
  }

  Widget _buildProjectCard(Map<String, dynamic> p) {
    final status = p['status'] as String;
    final priority = p['priority'] as String;
    final due = p['due_date'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => context.push('/projects/${p['id']}'),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      p['project_number'] ?? '',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                    ),
                  ),
                  StatusBadge(status: priority, isPriority: true),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                p['name'] ?? '',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              if (p['client_name'] != null) ...[
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.business, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 4),
                  Text(p['client_name'], style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                ]),
              ],
              if (p['location'] != null) ...[
                const SizedBox(height: 2),
                Row(children: [
                  const Icon(Icons.location_on, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 4),
                  Expanded(child: Text(p['location'], style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13))),
                ]),
              ],
              const SizedBox(height: 10),
              Row(
                children: [
                  StatusBadge(status: status),
                  const Spacer(),
                  if (due != null) Row(children: [
                    const Icon(Icons.event, size: 14, color: AppTheme.textSecondary),
                    const SizedBox(width: 4),
                    Text(due, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                  ]),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
