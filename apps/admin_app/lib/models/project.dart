class Project {
  final String id;
  final String clientId;
  final String projectNumber;
  final String name;
  final String? description;
  final String? location;
  final String status;
  final String priority;
  final String? startDate;
  final String? dueDate;
  final String? clientName;
  final DateTime createdAt;

  const Project({
    required this.id,
    required this.clientId,
    required this.projectNumber,
    required this.name,
    this.description,
    this.location,
    required this.status,
    required this.priority,
    this.startDate,
    this.dueDate,
    this.clientName,
    required this.createdAt,
  });

  factory Project.fromJson(Map<String, dynamic> json) => Project(
        id: json['id'],
        clientId: json['client_id'] ?? '',
        projectNumber: json['project_number'],
        name: json['name'],
        description: json['description'],
        location: json['location'],
        status: json['status'],
        priority: json['priority'],
        startDate: json['start_date'],
        dueDate: json['due_date'],
        clientName: json['client_name'],
        createdAt: DateTime.parse(json['created_at']),
      );
}

class Client {
  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? city;
  final bool isActive;

  const Client({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.city,
    required this.isActive,
  });

  factory Client.fromJson(Map<String, dynamic> json) => Client(
        id: json['id'],
        name: json['name'],
        email: json['email'],
        phone: json['phone'],
        city: json['city'],
        isActive: json['is_active'] ?? true,
      );
}

class UserModel {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String? phone;
  final bool isActive;

  const UserModel({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.phone,
    required this.isActive,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'],
        email: json['email'],
        fullName: json['full_name'],
        role: json['role'],
        phone: json['phone'],
        isActive: json['is_active'] ?? true,
      );
}

class ModuleItem {
  final String id;
  final int sortOrder;
  final String? itemCode;
  final String description;
  final String status;
  final String? techniciaNotes;
  final Map<String, dynamic> extra;

  const ModuleItem({
    required this.id,
    required this.sortOrder,
    this.itemCode,
    required this.description,
    required this.status,
    this.techniciaNotes,
    this.extra = const {},
  });

  factory ModuleItem.fromJson(Map<String, dynamic> json) {
    final reserved = {'id', 'sort_order', 'item_code', 'description', 'status', 'technician_notes'};
    return ModuleItem(
      id: json['id'],
      sortOrder: json['sort_order'] ?? 0,
      itemCode: json['item_code'],
      description: json['description'] ?? json['task_name'] ?? json['file_name'] ?? '',
      status: json['status'] ?? 'pending',
      techniciaNotes: json['technician_notes'],
      extra: Map.fromEntries(json.entries.where((e) => !reserved.contains(e.key))),
    );
  }
}
