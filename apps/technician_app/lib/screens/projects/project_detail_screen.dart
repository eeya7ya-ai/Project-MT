import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../services/offline_db.dart';
import '../../services/sync_service.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/offline_banner.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> {
  Map<String, dynamic>? _project;
  bool _loading = true;
  bool _isOnline = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final online = await SyncService.instance.isOnline();
      setState(() => _isOnline = online);

      if (online) {
        final res = await ApiClient.instance.dio.get('/projects/${widget.projectId}');
        setState(() => _project = res.data);
      } else {
        final p = await OfflineDB.instance.getProject(widget.projectId);
        setState(() => _project = p);
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    if (_project == null) return const Scaffold(body: Center(child: Text('Project not found')));

    final p = _project!;
    return Scaffold(
      appBar: AppBar(
        title: Text(p['project_number'] ?? 'Project'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: Column(
        children: [
          if (!_isOnline) const OfflineBanner(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Project info card
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(children: [
                            Expanded(
                              child: Text(p['name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            ),
                            StatusBadge(status: p['status'] ?? 'pending'),
                          ]),
                          if (p['client_name'] != null) ...[
                            const SizedBox(height: 8),
                            Row(children: [
                              const Icon(Icons.business, size: 16, color: AppTheme.textSecondary),
                              const SizedBox(width: 6),
                              Text(p['client_name'], style: const TextStyle(color: AppTheme.textSecondary)),
                            ]),
                          ],
                          if (p['location'] != null) ...[
                            const SizedBox(height: 4),
                            Row(children: [
                              const Icon(Icons.location_on, size: 16, color: AppTheme.textSecondary),
                              const SizedBox(width: 6),
                              Expanded(child: Text(p['location'], style: const TextStyle(color: AppTheme.textSecondary))),
                            ]),
                          ],
                          if (p['due_date'] != null) ...[
                            const SizedBox(height: 4),
                            Row(children: [
                              const Icon(Icons.event, size: 16, color: AppTheme.textSecondary),
                              const SizedBox(width: 6),
                              Text('Due: ${p['due_date']}', style: const TextStyle(color: AppTheme.textSecondary)),
                            ]),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Modules section
                  const Text('Modules', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  ...AppConstants.moduleDisplayNames.entries.map((e) => _ModuleTile(
                    type: e.key,
                    displayName: e.value,
                    projectId: widget.projectId,
                  )),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  final String type;
  final String displayName;
  final String projectId;

  const _ModuleTile({required this.type, required this.displayName, required this.projectId});

  IconData get _icon {
    switch (type) {
      case AppConstants.moduleSurvey: return Icons.search;
      case AppConstants.moduleMaintenance: return Icons.build;
      case AppConstants.moduleInstallation: return Icons.electrical_services;
      case AppConstants.moduleProgrammingHandover: return Icons.computer;
      case AppConstants.moduleHandover: return Icons.assignment_turned_in;
      default: return Icons.folder;
    }
  }

  Color get _color {
    switch (type) {
      case AppConstants.moduleSurvey: return AppTheme.primary;
      case AppConstants.moduleMaintenance: return AppTheme.warning;
      case AppConstants.moduleInstallation: return AppTheme.accent;
      case AppConstants.moduleProgrammingHandover: return Colors.purple;
      case AppConstants.moduleHandover: return AppTheme.success;
      default: return AppTheme.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: _color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(_icon, color: _color, size: 22),
        ),
        title: Text(displayName, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
        trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
        onTap: () => context.push('/projects/$projectId/modules/$type'),
      ),
    );
  }
}
