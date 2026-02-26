import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';

class ExcelImportScreen extends StatefulWidget {
  final String moduleId;
  final String moduleType;
  const ExcelImportScreen({super.key, required this.moduleId, required this.moduleType});

  @override
  State<ExcelImportScreen> createState() => _ExcelImportScreenState();
}

class _ExcelImportScreenState extends State<ExcelImportScreen> {
  PlatformFile? _file;
  List<String> _headers = [];
  List<Map<String, dynamic>> _sampleRows = [];
  int _totalRows = 0;
  Map<String, String> _columnMap = {}; // excel_header -> field_name
  bool _previewing = false;
  bool _importing = false;
  String? _result;

  final List<String> _knownFields = [
    'item_code', 'description', 'task_name', 'file_name',
    'quantity', 'unit', 'brand', 'model', 'part_number',
    'location_zone', 'floor_level', 'asset_tag', 'task_description',
    'device_name', 'device_ip', 'condition', 'remarks', 'notes',
    '(ignore)',
  ];

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

  Future<void> _pickAndPreview() async {
    final picked = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['xlsx', 'xls'],
      withData: true,
    );
    if (picked == null || picked.files.isEmpty) return;

    setState(() { _file = picked.files.first; _previewing = true; });

    try {
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(_file!.bytes!, filename: _file!.name),
      });
      final res = await ApiClient.instance.dio.post('/import/preview', data: formData);
      final data = res.data;

      setState(() {
        _headers = List<String>.from(data['headers']);
        _sampleRows = List<Map<String, dynamic>>.from(data['sample_rows']);
        _totalRows = data['total_rows'];
        // Auto-map known field aliases
        _columnMap = {for (final h in _headers) h: h};
      });
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Preview failed: $e')));
    } finally {
      setState(() => _previewing = false);
    }
  }

  Future<void> _import() async {
    if (_file == null) return;
    setState(() => _importing = true);
    try {
      final filteredMap = Map.fromEntries(
        _columnMap.entries.where((e) => e.value != '(ignore)' && e.value != e.key),
      );

      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(_file!.bytes!, filename: _file!.name),
        'column_map': filteredMap.isEmpty ? '{}' : filteredMap.toString().replaceAll('{', '{"').replaceAll(': ', '": "').replaceAll(', ', '", "').replaceAll('}', '"}'),
      });

      final res = await ApiClient.instance.dio.post(
        '/import/$_moduleEndpoint/${widget.moduleId}',
        data: formData,
      );
      setState(() => _result = 'Successfully imported ${res.data['imported']} items');
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Import failed: $e')));
    } finally {
      setState(() => _importing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Import from Excel')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Step 1: Pick file
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Step 1: Select Excel File', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    Row(children: [
                      ElevatedButton.icon(
                        icon: const Icon(Icons.upload_file),
                        label: const Text('Choose .xlsx file'),
                        onPressed: _pickAndPreview,
                      ),
                      if (_file != null) ...[
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            '${_file!.name} ($_totalRows rows)',
                            style: const TextStyle(color: AppTheme.textSecondary),
                          ),
                        ),
                      ],
                    ]),
                    if (_previewing) const Padding(
                      padding: EdgeInsets.only(top: 8),
                      child: LinearProgressIndicator(),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),

            // Step 2: Column mapping
            if (_headers.isNotEmpty) ...[
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Step 2: Map Columns', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      const Text('Map each Excel column to a system field', style: TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                      const SizedBox(height: 12),
                      ...(_headers.map((h) => Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: Row(children: [
                          Expanded(
                            flex: 2,
                            child: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppTheme.background,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(h, style: const TextStyle(fontWeight: FontWeight.w500)),
                            ),
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(horizontal: 12),
                            child: Icon(Icons.arrow_forward, color: AppTheme.textSecondary, size: 18),
                          ),
                          Expanded(
                            flex: 3,
                            child: DropdownButtonFormField<String>(
                              value: _columnMap[h] ?? '(ignore)',
                              decoration: const InputDecoration(isDense: true),
                              items: _knownFields.map((f) => DropdownMenuItem(
                                value: f,
                                child: Text(f, style: const TextStyle(fontSize: 13)),
                              )).toList(),
                              onChanged: (v) => setState(() => _columnMap[h] = v!),
                            ),
                          ),
                        ]),
                      ))),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Step 3: Preview data
              if (_sampleRows.isNotEmpty) Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Step 3: Data Preview (first 5 rows)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: DataTable(
                          headingRowColor: WidgetStateProperty.all(AppTheme.background),
                          columns: _headers.map((h) => DataColumn(label: Text(h, style: const TextStyle(fontWeight: FontWeight.bold)))).toList(),
                          rows: _sampleRows.map((row) => DataRow(
                            cells: _headers.map((h) => DataCell(
                              Text(row[h]?.toString() ?? '', style: const TextStyle(fontSize: 12)),
                            )).toList(),
                          )).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
            ],

            // Result
            if (_result != null)
              Card(
                color: AppTheme.success.withOpacity(0.1),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(children: [
                    const Icon(Icons.check_circle, color: AppTheme.success),
                    const SizedBox(width: 8),
                    Text(_result!, style: const TextStyle(color: AppTheme.success, fontWeight: FontWeight.bold)),
                  ]),
                ),
              ),

            const Spacer(),
            if (_file != null && _headers.isNotEmpty && _result == null)
              ElevatedButton.icon(
                icon: _importing ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.cloud_upload),
                label: Text(_importing ? 'Importing...' : 'Import $_totalRows Rows'),
                onPressed: _importing ? null : _import,
              ),
          ],
        ),
      ),
    );
  }
}
