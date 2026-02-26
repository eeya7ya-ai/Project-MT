import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';

class CreateProjectScreen extends StatefulWidget {
  final String? projectId; // null = create, set = edit
  const CreateProjectScreen({super.key, this.projectId});

  @override
  State<CreateProjectScreen> createState() => _CreateProjectScreenState();
}

class _CreateProjectScreenState extends State<CreateProjectScreen> {
  final _formKey = GlobalKey<FormState>();
  final _numberCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();

  String? _clientId;
  String _status = 'draft';
  String _priority = 'medium';
  DateTime? _startDate;
  DateTime? _dueDate;
  List<dynamic> _clients = [];
  bool _loading = false;
  bool _saving = false;

  bool get _isEditing => widget.projectId != null;

  @override
  void initState() {
    super.initState();
    _loadClients();
    if (_isEditing) _loadProject();
  }

  Future<void> _loadClients() async {
    setState(() => _loading = true);
    try {
      final res = await ApiClient.instance.dio.get('/clients');
      setState(() => _clients = res.data as List);
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _loadProject() async {
    final res = await ApiClient.instance.dio.get('/projects/${widget.projectId}');
    final p = res.data;
    _numberCtrl.text = p['project_number'] ?? '';
    _nameCtrl.text = p['name'] ?? '';
    _descCtrl.text = p['description'] ?? '';
    _locationCtrl.text = p['location'] ?? '';
    setState(() {
      _clientId = p['client_id'];
      _status = p['status'] ?? 'draft';
      _priority = p['priority'] ?? 'medium';
      _startDate = p['start_date'] != null ? DateTime.parse(p['start_date']) : null;
      _dueDate = p['due_date'] != null ? DateTime.parse(p['due_date']) : null;
    });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      final data = {
        'project_number': _numberCtrl.text.trim(),
        'name': _nameCtrl.text.trim(),
        'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
        'location': _locationCtrl.text.trim().isEmpty ? null : _locationCtrl.text.trim(),
        'client_id': _clientId,
        'status': _status,
        'priority': _priority,
        'start_date': _startDate?.toIso8601String().substring(0, 10),
        'due_date': _dueDate?.toIso8601String().substring(0, 10),
      };

      if (_isEditing) {
        await ApiClient.instance.dio.patch('/projects/${widget.projectId}', data: data);
      } else {
        await ApiClient.instance.dio.post('/projects', data: data);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEditing ? 'Project updated' : 'Project created')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Project' : 'Create Project')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 700),
                  child: Form(
                    key: _formKey,
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const Text('Project Information', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 20),

                            // Client selector
                            DropdownButtonFormField<String>(
                              value: _clientId,
                              decoration: const InputDecoration(labelText: 'Client *'),
                              items: _clients.map((c) => DropdownMenuItem<String>(
                                value: c['id'] as String,
                                child: Text(c['name'] as String),
                              )).toList(),
                              onChanged: (v) => setState(() => _clientId = v),
                              validator: (v) => v == null ? 'Select a client' : null,
                            ),
                            const SizedBox(height: 12),

                            Row(children: [
                              Expanded(
                                child: TextFormField(
                                  controller: _numberCtrl,
                                  decoration: const InputDecoration(labelText: 'Project Number *'),
                                  validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _priority,
                                  decoration: const InputDecoration(labelText: 'Priority'),
                                  items: ['low', 'medium', 'high', 'critical'].map((p) =>
                                    DropdownMenuItem(value: p, child: Text(p.toUpperCase()))).toList(),
                                  onChanged: (v) => setState(() => _priority = v!),
                                ),
                              ),
                            ]),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _nameCtrl,
                              decoration: const InputDecoration(labelText: 'Project Name *'),
                              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _descCtrl,
                              decoration: const InputDecoration(labelText: 'Description'),
                              maxLines: 3,
                            ),
                            const SizedBox(height: 12),

                            TextFormField(
                              controller: _locationCtrl,
                              decoration: const InputDecoration(labelText: 'Location'),
                            ),
                            const SizedBox(height: 12),

                            Row(children: [
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  value: _status,
                                  decoration: const InputDecoration(labelText: 'Status'),
                                  items: ['draft', 'active', 'in_progress', 'completed', 'cancelled'].map((s) =>
                                    DropdownMenuItem(value: s, child: Text(s.replaceAll('_', ' ').toUpperCase()))).toList(),
                                  onChanged: (v) => setState(() => _status = v!),
                                ),
                              ),
                            ]),
                            const SizedBox(height: 12),

                            Row(children: [
                              Expanded(child: _DateField(
                                label: 'Start Date',
                                value: _startDate,
                                onChanged: (d) => setState(() => _startDate = d),
                              )),
                              const SizedBox(width: 12),
                              Expanded(child: _DateField(
                                label: 'Due Date',
                                value: _dueDate,
                                onChanged: (d) => setState(() => _dueDate = d),
                              )),
                            ]),
                            const SizedBox(height: 28),

                            ElevatedButton(
                              onPressed: _saving ? null : _save,
                              child: _saving
                                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                  : Text(_isEditing ? 'Update Project' : 'Create Project'),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
    );
  }
}

class _DateField extends StatelessWidget {
  final String label;
  final DateTime? value;
  final void Function(DateTime?) onChanged;
  const _DateField({required this.label, this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () async {
        final d = await showDatePicker(
          context: context,
          initialDate: value ?? DateTime.now(),
          firstDate: DateTime(2020),
          lastDate: DateTime(2030),
        );
        onChanged(d);
      },
      child: InputDecorator(
        decoration: InputDecoration(labelText: label, suffixIcon: const Icon(Icons.calendar_today, size: 18)),
        child: Text(
          value != null ? '${value!.year}-${value!.month.toString().padLeft(2,'0')}-${value!.day.toString().padLeft(2,'0')}' : 'Select date',
          style: TextStyle(color: value != null ? null : Colors.grey),
        ),
      ),
    );
  }
}
