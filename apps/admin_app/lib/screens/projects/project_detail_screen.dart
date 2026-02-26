import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../core/constants.dart';
import '../../models/project.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/module_card.dart';

class ProjectDetailScreen extends StatefulWidget {
  final String projectId;
  const ProjectDetailScreen({super.key, required this.projectId});

  @override
  State<ProjectDetailScreen> createState() => _ProjectDetailScreenState();
}

class _ProjectDetailScreenState extends State<ProjectDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic>? _project;
  List<dynamic> _assignments = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final futures = await Future.wait([
        ApiClient.instance.dio.get('/projects/${widget.projectId}'),
        ApiClient.instance.dio.get('/projects/${widget.projectId}/assignments'),
      ]);
      setState(() {
        _project = futures[0].data;
        _assignments = futures[1].data as List;
      });
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
        bottom: TabBar(
          controller: _tabs,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Modules'),
            Tab(text: 'Team'),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.edit), onPressed: () => _editProject()),
        ],
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _buildOverview(p),
          _buildModules(p),
          _buildTeam(),
        ],
      ),
    );
  }

  Widget _buildOverview(Map<String, dynamic> p) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(
                      child: Text(p['name'], style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    ),
                    StatusBadge(status: p['status']),
                    const SizedBox(width: 8),
                    StatusBadge(status: p['priority'], isPriority: true),
                  ]),
                  if (p['description'] != null) ...[
                    const SizedBox(height: 12),
                    Text(p['description'], style: const TextStyle(color: AppTheme.textSecondary)),
                  ],
                  const Divider(height: 24),
                  _infoRow(Icons.tag, 'Project Number', p['project_number']),
                  _infoRow(Icons.location_on, 'Location', p['location'] ?? 'Not set'),
                  _infoRow(Icons.calendar_today, 'Start Date', p['start_date'] ?? 'Not set'),
                  _infoRow(Icons.event, 'Due Date', p['due_date'] ?? 'Not set'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Icon(icon, size: 16, color: AppTheme.textSecondary),
        const SizedBox(width: 8),
        Text('$label: ', style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
        Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500))),
      ]),
    );
  }

  Widget _buildModules(Map<String, dynamic> p) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: AppConstants.moduleTypes.map((type) => ModuleCard(
          type: type,
          projectId: widget.projectId,
          displayName: AppConstants.moduleDisplayNames[type]!,
        )).toList(),
      ),
    );
  }

  Widget _buildTeam() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Assigned Technicians', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              ElevatedButton.icon(
                icon: const Icon(Icons.person_add, size: 18),
                label: const Text('Assign'),
                onPressed: _assignTechnician,
              ),
            ],
          ),
        ),
        Expanded(
          child: _assignments.isEmpty
              ? const Center(child: Text('No technicians assigned'))
              : ListView.builder(
                  itemCount: _assignments.length,
                  itemBuilder: (ctx, i) {
                    final a = _assignments[i];
                    return ListTile(
                      leading: CircleAvatar(
                        backgroundColor: AppTheme.primary,
                        child: Text((a['user_full_name'] ?? 'T')[0].toUpperCase(),
                            style: const TextStyle(color: Colors.white)),
                      ),
                      title: Text(a['user_full_name'] ?? 'Unknown'),
                      subtitle: Text(a['user_email'] ?? ''),
                      trailing: Chip(
                        label: Text(a['status']),
                        backgroundColor: AppTheme.statusColor(a['status']).withOpacity(0.15),
                        labelStyle: TextStyle(color: AppTheme.statusColor(a['status'])),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  Future<void> _assignTechnician() async {
    try {
      final res = await ApiClient.instance.dio.get('/auth/users');
      final technicians = (res.data as List)
          .map((u) => UserModel.fromJson(u))
          .where((u) => u.role == 'technician' && u.isActive)
          .toList();

      if (!mounted) return;
      final selected = await showDialog<List<String>>(
        context: context,
        builder: (ctx) => _TechnicianPickerDialog(technicians: technicians),
      );

      if (selected != null && selected.isNotEmpty) {
        await ApiClient.instance.dio.post(
          '/projects/${widget.projectId}/assignments',
          data: {'user_ids': selected},
        );
        _load();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _editProject() async {
    context.push('/projects/${widget.projectId}/edit').then((_) => _load());
  }
}

class _TechnicianPickerDialog extends StatefulWidget {
  final List<UserModel> technicians;
  const _TechnicianPickerDialog({required this.technicians});

  @override
  State<_TechnicianPickerDialog> createState() => _TechnicianPickerDialogState();
}

class _TechnicianPickerDialogState extends State<_TechnicianPickerDialog> {
  final Set<String> _selected = {};

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Select Technicians'),
      content: SizedBox(
        width: 400,
        child: ListView.builder(
          shrinkWrap: true,
          itemCount: widget.technicians.length,
          itemBuilder: (ctx, i) {
            final t = widget.technicians[i];
            return CheckboxListTile(
              title: Text(t.fullName),
              subtitle: Text(t.email),
              value: _selected.contains(t.id),
              onChanged: (v) {
                setState(() {
                  if (v == true) _selected.add(t.id);
                  else _selected.remove(t.id);
                });
              },
            );
          },
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _selected.isEmpty ? null : () => Navigator.pop(context, _selected.toList()),
          child: const Text('Assign'),
        ),
      ],
    );
  }
}
