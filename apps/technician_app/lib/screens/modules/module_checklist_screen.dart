import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../services/offline_db.dart';
import '../../services/sync_service.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/offline_banner.dart';

class ModuleChecklistScreen extends StatefulWidget {
  final String projectId;
  final String moduleType;
  const ModuleChecklistScreen({super.key, required this.projectId, required this.moduleType});

  @override
  State<ModuleChecklistScreen> createState() => _ModuleChecklistScreenState();
}

class _ModuleChecklistScreenState extends State<ModuleChecklistScreen> {
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  bool _isOnline = true;
  String? _moduleId;

  String get _displayName =>
      AppConstants.moduleDisplayNames[widget.moduleType] ?? widget.moduleType;

  String get _apiEndpoint {
    switch (widget.moduleType) {
      case AppConstants.moduleSurvey: return 'survey';
      case AppConstants.moduleMaintenance: return 'maintenance';
      case AppConstants.moduleInstallation: return 'installation';
      case AppConstants.moduleProgrammingHandover: return 'programming-handover';
      case AppConstants.moduleHandover: return 'handover';
      default: return widget.moduleType;
    }
  }

  String get _itemsKey {
    return widget.moduleType == AppConstants.moduleHandover ? 'required_files' : 'items';
  }

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
        await _loadOnline();
      } else {
        await _loadOffline();
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadOnline() async {
    try {
      final res = await ApiClient.instance.dio.get(
        '/projects/${widget.projectId}/$_apiEndpoint',
      );
      final data = res.data;

      Map<String, dynamic>? module;
      if (data is List && data.isNotEmpty) {
        module = data[0] as Map<String, dynamic>;
      } else if (data is Map) {
        module = data as Map<String, dynamic>;
      }

      if (module != null) {
        _moduleId = module['id'] as String;
        final rawItems = (module[_itemsKey] as List?) ?? [];
        final items = rawItems.cast<Map<String, dynamic>>();
        // Cache to SQLite
        for (final item in items) {
          await OfflineDB.instance.upsertItem(
            widget.projectId, widget.moduleType, _moduleId!, item,
          );
        }
        setState(() => _items = items);
      }
    } catch (_) {
      await _loadOffline();
    }
  }

  Future<void> _loadOffline() async {
    final items = await OfflineDB.instance.getItems(widget.projectId, widget.moduleType);
    setState(() => _items = items);
  }

  Future<void> _updateStatus(Map<String, dynamic> item, String newStatus) async {
    final itemId = item['id'] as String;
    final online = await SyncService.instance.isOnline();

    if (online) {
      try {
        final endpoint = widget.moduleType == AppConstants.moduleHandover
            ? '/$_apiEndpoint/files/$itemId'
            : '/$_apiEndpoint/items/$itemId';
        await ApiClient.instance.dio.patch(endpoint, data: {'status': newStatus});
      } catch (_) {
        // Fall through to local update
      }
    }

    // Always update locally
    await OfflineDB.instance.updateItemStatus(itemId, newStatus, item['technician_notes']);
    _load();
  }

  Future<void> _addNote(Map<String, dynamic> item) async {
    final ctrl = TextEditingController(text: item['technician_notes']);
    final result = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Note'),
        content: TextField(
          controller: ctrl,
          decoration: const InputDecoration(hintText: 'Enter technician note...'),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, ctrl.text),
            child: const Text('Save'),
          ),
        ],
      ),
    );

    if (result != null) {
      final itemId = item['id'] as String;
      final online = await SyncService.instance.isOnline();
      if (online) {
        try {
          final endpoint = widget.moduleType == AppConstants.moduleHandover
              ? '/$_apiEndpoint/files/$itemId'
              : '/$_apiEndpoint/items/$itemId';
          await ApiClient.instance.dio.patch(endpoint, data: {'technician_notes': result});
        } catch (_) {}
      }
      await OfflineDB.instance.updateItemStatus(itemId, item['status'] ?? 'pending', result);
      _load();
    }
  }

  Future<void> _uploadPhoto(Map<String, dynamic> item) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 80);
    if (picked == null) return;

    final online = await SyncService.instance.isOnline();
    if (!online) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo will be uploaded when online'), backgroundColor: AppTheme.warning),
        );
      }
      return;
    }

    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(picked.path, filename: 'photo.jpg'),
        'project_id': widget.projectId,
        'category': 'photo',
        'entity_type': '${widget.moduleType}_item',
        'entity_id': item['id'],
      });
      await ApiClient.instance.dio.post('/attachments', data: formData);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Photo uploaded'), backgroundColor: AppTheme.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Upload failed: $e')));
      }
    }
  }

  int get _completedCount => _items.where((i) => i['status'] == 'completed').length;

  @override
  Widget build(BuildContext context) {
    final progress = _items.isEmpty ? 0.0 : _completedCount / _items.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(_displayName),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (!_isOnline) const OfflineBanner(),

                // Progress bar
                if (_items.isNotEmpty) Container(
                  color: Colors.white,
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Progress: $_completedCount / ${_items.length}',
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('${(progress * 100).toInt()}%',
                              style: TextStyle(color: AppTheme.statusColor('completed'), fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 6),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 8,
                          backgroundColor: AppTheme.background,
                          valueColor: const AlwaysStoppedAnimation(AppTheme.success),
                        ),
                      ),
                    ],
                  ),
                ),
                const Divider(height: 1),

                // Items
                Expanded(
                  child: _items.isEmpty
                      ? const Center(child: Text('No items in this module', style: TextStyle(color: AppTheme.textSecondary)))
                      : ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _items.length,
                          itemBuilder: (ctx, i) => _buildItemCard(_items[i], i),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item, int index) {
    final status = item['status'] as String? ?? 'pending';
    final desc = item['description'] as String? ?? 'Item ${index + 1}';
    final code = item['item_code'] as String?;
    final notes = item['technician_notes'] as String?;
    final isCompleted = status == 'completed';

    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Tap circle to toggle completed
                GestureDetector(
                  onTap: () => _updateStatus(item, isCompleted ? 'pending' : 'completed'),
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isCompleted ? AppTheme.success : Colors.transparent,
                      border: Border.all(
                        color: AppTheme.statusColor(status),
                        width: 2,
                      ),
                    ),
                    child: isCompleted
                        ? const Icon(Icons.check, color: Colors.white, size: 18)
                        : Center(
                            child: Text('${index + 1}',
                                style: TextStyle(color: AppTheme.statusColor(status), fontSize: 12, fontWeight: FontWeight.bold)),
                          ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (code != null) Text(code, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                      Text(desc, style: TextStyle(
                        fontWeight: FontWeight.w500,
                        decoration: isCompleted ? TextDecoration.lineThrough : null,
                        color: isCompleted ? AppTheme.textSecondary : AppTheme.textPrimary,
                      )),
                    ],
                  ),
                ),
                StatusBadge(status: status),
              ],
            ),

            if (notes != null && notes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.background,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.note, size: 14, color: AppTheme.textSecondary),
                    const SizedBox(width: 6),
                    Expanded(child: Text(notes, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary))),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 8),
            // Action buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                _ActionChip(icon: Icons.edit_note, label: 'Note', onTap: () => _addNote(item)),
                const SizedBox(width: 8),
                _ActionChip(icon: Icons.camera_alt, label: 'Photo', onTap: () => _uploadPhoto(item)),
                const SizedBox(width: 8),
                _StatusMenu(
                  currentStatus: status,
                  onChanged: (s) => _updateStatus(item, s),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _ActionChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
          borderRadius: BorderRadius.circular(20),
          color: AppTheme.primary.withOpacity(0.05),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: AppTheme.primary),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.primary)),
        ]),
      ),
    );
  }
}

class _StatusMenu extends StatelessWidget {
  final String currentStatus;
  final void Function(String) onChanged;
  const _StatusMenu({required this.currentStatus, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          borderRadius: BorderRadius.circular(20),
        ),
        child: const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.more_horiz, size: 14),
          SizedBox(width: 4),
          Text('Status', style: TextStyle(fontSize: 12)),
        ]),
      ),
      onSelected: onChanged,
      itemBuilder: (_) => [
        for (final s in ['pending', 'in_progress', 'completed', 'failed', 'skipped'])
          PopupMenuItem(
            value: s,
            child: Row(children: [
              Container(width: 10, height: 10, decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppTheme.statusColor(s),
              )),
              const SizedBox(width: 8),
              Text(s.replaceAll('_', ' '), style: TextStyle(
                fontWeight: s == currentStatus ? FontWeight.bold : null,
              )),
            ]),
          ),
      ],
    );
  }
}
