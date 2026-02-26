class AppConstants {
  static const String appName = 'Project-MT Tech';
  static const String baseUrl = 'http://10.0.2.2:8000/api/v1'; // Android emulator localhost

  // Storage keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';
  static const String userIdKey = 'user_id';
  static const String userNameKey = 'user_name';

  // SQLite DB name
  static const String dbName = 'projectmt_offline.db';

  // Module types
  static const String moduleSurvey = 'survey';
  static const String moduleMaintenance = 'maintenance';
  static const String moduleInstallation = 'installation';
  static const String moduleProgrammingHandover = 'programming_handover';
  static const String moduleHandover = 'handover';

  static const Map<String, String> moduleDisplayNames = {
    moduleSurvey: 'Site Survey',
    moduleMaintenance: 'Maintenance',
    moduleInstallation: 'Installation',
    moduleProgrammingHandover: 'Programming & Handover',
    moduleHandover: 'Handover / Files',
  };

  static const Map<String, String> moduleIcons = {
    moduleSurvey: 'search',
    moduleMaintenance: 'build',
    moduleInstallation: 'electrical_services',
    moduleProgrammingHandover: 'computer',
    moduleHandover: 'assignment_turned_in',
  };
}
