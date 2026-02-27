import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../services/sync_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/offline_banner.dart';
import 'package:go_router/go_router.dart';

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  List<Map<String, dynamic>> _schedule = [];
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
        final res = await ApiClient.instance.dio.get('/technician/my-schedule');
        setState(() => _schedule = (res.data as List).cast<Map<String, dynamic>>());
      }
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Schedule')),
      body: Column(
        children: [
          if (!_isOnline) const OfflineBanner(),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _schedule.isEmpty
                    ? const Center(child: Text('No scheduled items', style: TextStyle(color: AppTheme.textSecondary)))
                    : RefreshIndicator(
                        onRefresh: _load,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _schedule.length,
                          itemBuilder: (ctx, i) {
                            final s = _schedule[i];
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                leading: Container(
                                  width: 48,
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text(
                                        s['due_date']?.split('-').last ?? '?',
                                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primary),
                                      ),
                                      Text(
                                        _monthAbbr(s['due_date']),
                                        style: const TextStyle(fontSize: 10, color: AppTheme.primary),
                                      ),
                                    ],
                                  ),
                                ),
                                title: Text(s['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                                subtitle: Text(s['client_name'] ?? ''),
                                trailing: StatusBadge(status: s['status'] ?? 'pending'),
                                onTap: () => context.push('/projects/${s['project_id']}'),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  String _monthAbbr(String? date) {
    if (date == null) return '';
    final months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    try {
      final m = int.parse(date.split('-')[1]);
      return months[m];
    } catch (_) { return ''; }
  }
}
