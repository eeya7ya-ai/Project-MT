import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import '../../models/project.dart';
import '../../widgets/status_badge.dart';

class ProjectsScreen extends StatefulWidget {
  const ProjectsScreen({super.key});

  @override
  State<ProjectsScreen> createState() => _ProjectsScreenState();
}

class _ProjectsScreenState extends State<ProjectsScreen> {
  List<Project> _projects = [];
  bool _loading = true;
  String? _statusFilter;
  String _search = '';

  @override
  void initState() {
    super.initState();
    _loadProjects();
  }

  Future<void> _loadProjects() async {
    setState(() => _loading = true);
    try {
      final params = <String, dynamic>{};
      if (_statusFilter != null) params['status'] = _statusFilter;
      final res = await ApiClient.instance.dio.get('/projects', queryParameters: params);
      setState(() {
        _projects = (res.data as List).map((j) => Project.fromJson(j)).toList();
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  List<Project> get _filtered {
    if (_search.isEmpty) return _projects;
    final q = _search.toLowerCase();
    return _projects.where((p) =>
      p.name.toLowerCase().contains(q) ||
      p.projectNumber.toLowerCase().contains(q) ||
      (p.clientName?.toLowerCase().contains(q) ?? false)
    ).toList();
  }

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 900;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Projects'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh), onPressed: _loadProjects),
          const SizedBox(width: 8),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: AppTheme.primary),
            icon: const Icon(Icons.add),
            label: const Text('New Project'),
            onPressed: () => context.push('/projects/create').then((_) => _loadProjects()),
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: const InputDecoration(
                      hintText: 'Search by name, number, client...',
                      prefixIcon: Icon(Icons.search),
                      isDense: true,
                    ),
                    onChanged: (v) => setState(() => _search = v),
                  ),
                ),
                const SizedBox(width: 12),
                DropdownButton<String?>(
                  value: _statusFilter,
                  hint: const Text('All Status'),
                  items: const [
                    DropdownMenuItem(value: null, child: Text('All Status')),
                    DropdownMenuItem(value: 'draft', child: Text('Draft')),
                    DropdownMenuItem(value: 'active', child: Text('Active')),
                    DropdownMenuItem(value: 'in_progress', child: Text('In Progress')),
                    DropdownMenuItem(value: 'completed', child: Text('Completed')),
                    DropdownMenuItem(value: 'cancelled', child: Text('Cancelled')),
                  ],
                  onChanged: (v) {
                    setState(() => _statusFilter = v);
                    _loadProjects();
                  },
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _filtered.isEmpty
                    ? const Center(child: Text('No projects found', style: TextStyle(color: AppTheme.textSecondary)))
                    : isWide
                        ? _buildTable()
                        : _buildList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTable() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: DataTable(
          headingRowColor: WidgetStateProperty.all(AppTheme.background),
          columns: const [
            DataColumn(label: Text('Number', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Name', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Client', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Status', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Priority', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Due Date', style: TextStyle(fontWeight: FontWeight.bold))),
            DataColumn(label: Text('Actions', style: TextStyle(fontWeight: FontWeight.bold))),
          ],
          rows: _filtered.map((p) => DataRow(cells: [
            DataCell(Text(p.projectNumber)),
            DataCell(Text(p.name)),
            DataCell(Text(p.clientName ?? '-')),
            DataCell(StatusBadge(status: p.status)),
            DataCell(StatusBadge(status: p.priority, isPriority: true)),
            DataCell(Text(p.dueDate ?? '-')),
            DataCell(Row(children: [
              IconButton(
                icon: const Icon(Icons.visibility, size: 18),
                tooltip: 'View',
                onPressed: () => context.push('/projects/${p.id}').then((_) => _loadProjects()),
              ),
            ])),
          ])).toList(),
        ),
      ),
    );
  }

  Widget _buildList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _filtered.length,
      itemBuilder: (ctx, i) {
        final p = _filtered[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text('${p.projectNumber} — ${p.name}', style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (p.clientName != null) Text(p.clientName!),
                const SizedBox(height: 4),
                Row(children: [
                  StatusBadge(status: p.status),
                  const SizedBox(width: 8),
                  StatusBadge(status: p.priority, isPriority: true),
                ]),
              ],
            ),
            trailing: const Icon(Icons.chevron_right),
            isThreeLine: true,
            onTap: () => context.push('/projects/${p.id}').then((_) => _loadProjects()),
          ),
        );
      },
    );
  }
}
