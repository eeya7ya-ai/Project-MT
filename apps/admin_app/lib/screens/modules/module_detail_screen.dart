import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../widgets/status_badge.dart';
import 'excel_import_screen.dart';

class ModuleDetailScreen extends StatefulWidget {
  final String projectId;
  final String moduleType;
  const ModuleDetailScreen({super.key, required this.projectId, required this.moduleType});

  @override
  State<ModuleDetailScreen> createState() => _ModuleDetailScreenState();
}

class _ModuleDetailScreenState extends State<ModuleDetailScreen> {
  Map<String, dynamic>? _module;
  List<dynamic> _items = [];
  bool _loading = true;

  String get _displayName => AppConstants.moduleDisplayNames[widget.moduleType] ?? widget.moduleType;

  String get _moduleEndpoint {
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
      final endpoint = '/projects/${widget.projectId}/$_moduleEndpoint';
      final res = await ApiClient.instance.dio.get(endpoint);
      final data = res.data;

      // Some modules return a list (maintenance, installation, ph), others return one object
      if (data is List) {
        if (data.isEmpty) {
          setState(() { _module = null; _items = []; });
        } else {
          setState(() {
            _module = data[0] as Map<String, dynamic>;
            _items = (_module![_itemsKey] as List?) ?? [];
          });
        }
      } else {
        setState(() {
          _module = data as Map<String, dynamic>;
          _items = (_module![_itemsKey] as List?) ?? [];
        });
      }
    } catch (e) {
      setState(() { _module = null; _items = []; });
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _createModule() async {
    try {
      await ApiClient.instance.dio.post(
        '/projects/${widget.projectId}/$_moduleEndpoint',
        data: {'title': _displayName},
      );
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _addItem() async {
    if (_module == null) return;
    final moduleId = _module!['id'];
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (ctx) => _AddItemDialog(moduleType: widget.moduleType),
    );
    if (result == null) return;

    try {
      final itemEndpoint = widget.moduleType == AppConstants.moduleHandover
          ? '/$_moduleEndpoint/$moduleId/files'
          : '/$_moduleEndpoint/$moduleId/items';
      await ApiClient.instance.dio.post(itemEndpoint, data: result);
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _importExcel() async {
    if (_module == null) return;
    await Navigator.of(context).push(MaterialPageRoute(
      builder: (ctx) => ExcelImportScreen(
        moduleId: _module!['id'],
        moduleType: widget.moduleType,
      ),
    ));
    _load();
  }

  Future<void> _updateItemStatus(String itemId, String status) async {
    try {
      final endpoint = widget.moduleType == AppConstants.moduleHandover
          ? '/$_moduleEndpoint/files/$itemId'
          : '/$_moduleEndpoint/items/$itemId';
      await ApiClient.instance.dio.patch(endpoint, data: {'status': status});
      _load();
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_displayName),
        actions: [
          if (_module != null) ...[
            IconButton(
              icon: const Icon(Icons.upload_file),
              tooltip: 'Import from Excel',
              onPressed: _importExcel,
            ),
            IconButton(
              icon: const Icon(Icons.add),
              tooltip: 'Add Item',
              onPressed: _addItem,
            ),
          ],
          IconButton(icon: const Icon(Icons.refresh), onPressed: _load),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _module == null
              ? _buildEmpty()
              : _buildContent(),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.folder_open, size: 64, color: AppTheme.textSecondary.withOpacity(0.4)),
          const SizedBox(height: 16),
          Text('$_displayName module not created yet',
              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 16)),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.add),
            label: Text('Create $_displayName Module'),
            onPressed: _createModule,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final m = _module!;
    return Column(
      children: [
        // Module header
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(m['title'] ?? _displayName,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('${_items.length} items',
                        style: const TextStyle(color: AppTheme.textSecondary)),
                  ],
                ),
              ),
              StatusBadge(status: m['is_completed'] == true ? 'completed' : 'in_progress'),
            ],
          ),
        ),
        const Divider(height: 1),

        // Items list
        Expanded(
          child: _items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('No items yet', style: TextStyle(color: AppTheme.textSecondary)),
                      const SizedBox(height: 12),
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        ElevatedButton.icon(icon: const Icon(Icons.add), label: const Text('Add Item'), onPressed: _addItem),
                        const SizedBox(width: 12),
                        OutlinedButton.icon(icon: const Icon(Icons.upload_file), label: const Text('Import Excel'), onPressed: _importExcel),
                      ]),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _items.length,
                  itemBuilder: (ctx, i) {
                    final item = _items[i];
                    final desc = item['description'] ?? item['task_name'] ?? item['file_name'] ?? 'Item ${i+1}';
                    final status = item['status'] ?? 'pending';
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          radius: 16,
                          backgroundColor: AppTheme.statusColor(status).withOpacity(0.15),
                          child: Text('${i+1}', style: TextStyle(fontSize: 12, color: AppTheme.statusColor(status))),
                        ),
                        title: Text(desc.toString()),
                        subtitle: item['item_code'] != null ? Text('Code: ${item['item_code']}') : null,
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            StatusBadge(status: status),
                            PopupMenuButton<String>(
                              onSelected: (s) => _updateItemStatus(item['id'], s),
                              itemBuilder: (_) => ['pending', 'in_progress', 'completed', 'failed', 'skipped']
                                  .map((s) => PopupMenuItem(value: s, child: Text(s.replaceAll('_', ' '))))
                                  .toList(),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

class _AddItemDialog extends StatefulWidget {
  final String moduleType;
  const _AddItemDialog({required this.moduleType});

  @override
  State<_AddItemDialog> createState() => _AddItemDialogState();
}

class _AddItemDialogState extends State<_AddItemDialog> {
  final _descCtrl = TextEditingController();
  final _codeCtrl = TextEditingController();
  final _qtyCtrl = TextEditingController();
  final _unitCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final isHandover = widget.moduleType == AppConstants.moduleHandover;
    final isPH = widget.moduleType == AppConstants.moduleProgrammingHandover;

    return AlertDialog(
      title: const Text('Add Item'),
      content: SizedBox(
        width: 400,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextFormField(
              controller: _codeCtrl,
              decoration: const InputDecoration(labelText: 'Item Code (optional)'),
            ),
            const SizedBox(height: 8),
            TextFormField(
              controller: _descCtrl,
              decoration: InputDecoration(
                labelText: isPH ? 'Task Name *' : isHandover ? 'File Name *' : 'Description *',
              ),
              maxLines: 2,
            ),
            if (!isHandover && !isPH) ...[
              const SizedBox(height: 8),
              Row(children: [
                Expanded(child: TextFormField(
                  controller: _qtyCtrl,
                  decoration: const InputDecoration(labelText: 'Quantity'),
                  keyboardType: TextInputType.number,
                )),
                const SizedBox(width: 8),
                Expanded(child: TextFormField(
                  controller: _unitCtrl,
                  decoration: const InputDecoration(labelText: 'Unit'),
                )),
              ]),
            ],
          ],
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _descCtrl.text.isEmpty ? null : () {
            final field = isPH ? 'task_name' : isHandover ? 'file_name' : 'description';
            Navigator.pop(context, {
              field: _descCtrl.text.trim(),
              if (_codeCtrl.text.isNotEmpty) 'item_code': _codeCtrl.text.trim(),
              if (_qtyCtrl.text.isNotEmpty) 'quantity': double.tryParse(_qtyCtrl.text),
              if (_unitCtrl.text.isNotEmpty) 'unit': _unitCtrl.text.trim(),
            });
          },
          child: const Text('Add'),
        ),
      ],
    );
  }
}
