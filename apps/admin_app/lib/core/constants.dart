class AppConstants {
  static const String appName = 'Project-MT Admin';
  static const String baseUrl = 'http://localhost:8000/api/v1';

  // Storage keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userRoleKey = 'user_role';
  static const String userIdKey = 'user_id';
  static const String userNameKey = 'user_name';

  // Module types
  static const String moduleSurvey = 'survey';
  static const String moduleMaintenance = 'maintenance';
  static const String moduleInstallation = 'installation';
  static const String moduleProgrammingHandover = 'programming_handover';
  static const String moduleHandover = 'handover';

  static const List<String> moduleTypes = [
    moduleSurvey,
    moduleMaintenance,
    moduleInstallation,
    moduleProgrammingHandover,
    moduleHandover,
  ];

  static const Map<String, String> moduleDisplayNames = {
    moduleSurvey: 'Site Survey',
    moduleMaintenance: 'Maintenance',
    moduleInstallation: 'Installation',
    moduleProgrammingHandover: 'Programming & Handover',
    moduleHandover: 'Handover / Required Files',
  };
}
