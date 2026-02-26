import 'package:connectivity_plus/connectivity_plus.dart';
import '../core/api_client.dart';
import 'offline_db.dart';

class SyncService {
  static SyncService? _instance;
  SyncService._();
  static SyncService get instance => _instance ??= SyncService._();

  Future<bool> isOnline() async {
    final result = await Connectivity().checkConnectivity();
    return !result.contains(ConnectivityResult.none);
  }

  /// Download all assigned projects and their module data to local SQLite.
  Future<void> syncProjectsDown() async {
    if (!await isOnline()) return;

    final res = await ApiClient.instance.dio.get('/technician/my-projects');
    final projects = (res.data as List).cast<Map<String, dynamic>>();

    for (final p in projects) {
      await OfflineDB.instance.upsertProject(p);
      await _syncProjectModules(p['id']);
    }
  }

  Future<void> _syncProjectModules(String projectId) async {
    try {
      final res = await ApiClient.instance.dio.get('/technician/sync/$projectId');
      final data = res.data;
      final modules = data['modules'] as Map<String, dynamic>;

      for (final moduleType in modules.keys) {
        final moduleData = modules[moduleType];

        if (moduleData is Map<String, dynamic>) {
          // Single module (survey, handover)
          final moduleId = moduleData['id'] as String;
          final items = (moduleData['items'] ?? moduleData['required_files'] ?? []) as List;
          for (final item in items) {
            await OfflineDB.instance.upsertItem(projectId, moduleType, moduleId, item as Map<String, dynamic>);
          }
        } else if (moduleData is List) {
          // Multiple modules (maintenance, installation, programming_handover)
          for (final m in moduleData) {
            final moduleId = m['id'] as String;
            final items = (m['items'] ?? []) as List;
            for (final item in items) {
              await OfflineDB.instance.upsertItem(projectId, moduleType, moduleId, item as Map<String, dynamic>);
            }
          }
        }
      }
    } catch (e) {
      // If sync fails for one project, continue with others
    }
  }

  /// Push all locally queued status updates to the server.
  Future<SyncResult> syncUpdatesUp() async {
    if (!await isOnline()) {
      return SyncResult(pushed: 0, failed: 0, offline: true);
    }

    final pending = await OfflineDB.instance.getPendingUpdates();
    int pushed = 0, failed = 0;

    for (final update in pending) {
      try {
        final itemId = update['item_id'] as String;
        final status = update['status'] as String;
        final notes = update['technician_notes'] as String?;
        final id = update['id'] as int;

        // Try all module item endpoints (we don't store module type in pending_updates)
        // In a real app, store module_type and route correctly.
        // For now, we attempt a generic PATCH based on stored module_type.
        final moduleType = update['module_type'] as String;
        final endpoint = _itemEndpoint(moduleType, itemId);

        await ApiClient.instance.dio.patch(endpoint, data: {
          'status': status,
          if (notes != null) 'technician_notes': notes,
        });

        await OfflineDB.instance.deletePendingUpdate(id);
        pushed++;
      } catch (_) {
        failed++;
      }
    }

    return SyncResult(pushed: pushed, failed: failed, offline: false);
  }

  String _itemEndpoint(String moduleType, String itemId) {
    switch (moduleType) {
      case 'survey': return '/survey/items/$itemId';
      case 'maintenance': return '/maintenance/items/$itemId';
      case 'installation': return '/installation/items/$itemId';
      case 'programming_handover': return '/programming-handover/items/$itemId';
      case 'handover': return '/handover/files/$itemId';
      default: return '/survey/items/$itemId';
    }
  }
}

class SyncResult {
  final int pushed;
  final int failed;
  final bool offline;
  const SyncResult({required this.pushed, required this.failed, required this.offline});

  String get message {
    if (offline) return 'Offline — changes saved locally';
    if (pushed == 0 && failed == 0) return 'Nothing to sync';
    return 'Synced $pushed update${pushed != 1 ? "s" : ""}${failed > 0 ? " ($failed failed)" : ""}';
  }
}
