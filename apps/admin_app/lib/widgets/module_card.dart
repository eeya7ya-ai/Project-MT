import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../core/theme.dart';
import '../core/constants.dart';

class ModuleCard extends StatelessWidget {
  final String type;
  final String projectId;
  final String displayName;

  const ModuleCard({super.key, required this.type, required this.projectId, required this.displayName});

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
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: _color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(_icon, color: _color, size: 24),
        ),
        title: Text(displayName, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: const Text('Tap to manage items', style: TextStyle(fontSize: 12)),
        trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
        onTap: () => context.push('/projects/$projectId/modules/$type'),
      ),
    );
  }
}
