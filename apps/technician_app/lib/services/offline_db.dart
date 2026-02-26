import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../core/constants.dart';

class OfflineDB {
  static OfflineDB? _instance;
  Database? _db;

  OfflineDB._();
  static OfflineDB get instance => _instance ??= OfflineDB._();

  Future<Database> get db async {
    _db ??= await _open();
    return _db!;
  }

  Future<Database> _open() async {
    final dbPath = await getDatabasesPath();
    return openDatabase(
      join(dbPath, AppConstants.dbName),
      version: 1,
      onCreate: _onCreate,
    );
  }

  Future<void> _onCreate(Database db, int version) async {
    // Projects
    await db.execute('''
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        project_number TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        location TEXT,
        status TEXT NOT NULL,
        priority TEXT NOT NULL,
        client_name TEXT,
        start_date TEXT,
        due_date TEXT,
        synced_at TEXT NOT NULL
      )
    ''');

    // Generic items table for all module types
    await db.execute('''
      CREATE TABLE module_items (
        id TEXT PRIMARY KEY,
        project_id TEXT NOT NULL,
        module_type TEXT NOT NULL,
        module_id TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0,
        item_code TEXT,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        technician_notes TEXT,
        extra_json TEXT,
        pending_sync INTEGER NOT NULL DEFAULT 0,
        synced_at TEXT
      )
    ''');

    // Pending status updates queue
    await db.execute('''
      CREATE TABLE pending_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        module_type TEXT NOT NULL,
        status TEXT NOT NULL,
        technician_notes TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('CREATE INDEX idx_mi_project ON module_items(project_id)');
    await db.execute('CREATE INDEX idx_mi_module ON module_items(module_id)');
  }

  // ─── Projects ────────────────────────────────────────────
  Future<void> upsertProject(Map<String, dynamic> p) async {
    final database = await db;
    await database.insert('projects', {
      'id': p['id'],
      'project_number': p['project_number'],
      'name': p['name'],
      'description': p['description'],
      'location': p['location'],
      'status': p['status'],
      'priority': p['priority'],
      'client_name': p['client_name'],
      'start_date': p['start_date'],
      'due_date': p['due_date'],
      'synced_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getProjects() async {
    final database = await db;
    return database.query('projects', orderBy: 'due_date ASC');
  }

  Future<Map<String, dynamic>?> getProject(String id) async {
    final database = await db;
    final rows = await database.query('projects', where: 'id = ?', whereArgs: [id]);
    return rows.isEmpty ? null : rows.first;
  }

  // ─── Module Items ─────────────────────────────────────────
  Future<void> upsertItem(String projectId, String moduleType, String moduleId, Map<String, dynamic> item) async {
    final database = await db;
    final desc = item['description'] ?? item['task_name'] ?? item['file_name'] ?? '';

    // Extra fields (all except known ones)
    final reserved = {'id', 'project_id', 'sort_order', 'item_code', 'description', 'task_name', 'file_name', 'status', 'technician_notes'};
    final extra = Map.fromEntries(item.entries.where((e) => !reserved.contains(e.key)));

    await database.insert('module_items', {
      'id': item['id'],
      'project_id': projectId,
      'module_type': moduleType,
      'module_id': moduleId,
      'sort_order': item['sort_order'] ?? 0,
      'item_code': item['item_code'],
      'description': desc,
      'status': item['status'] ?? 'pending',
      'technician_notes': item['technician_notes'],
      'extra_json': extra.isEmpty ? null : extra.toString(),
      'pending_sync': 0,
      'synced_at': DateTime.now().toIso8601String(),
    }, conflictAlgorithm: ConflictAlgorithm.replace);
  }

  Future<List<Map<String, dynamic>>> getItems(String projectId, String moduleType) async {
    final database = await db;
    return database.query(
      'module_items',
      where: 'project_id = ? AND module_type = ?',
      whereArgs: [projectId, moduleType],
      orderBy: 'sort_order ASC',
    );
  }

  Future<void> updateItemStatus(String itemId, String status, String? notes) async {
    final database = await db;
    await database.update(
      'module_items',
      {'status': status, 'technician_notes': notes, 'pending_sync': 1},
      where: 'id = ?',
      whereArgs: [itemId],
    );
    await database.insert('pending_updates', {
      'item_id': itemId,
      'module_type': '',
      'status': status,
      'technician_notes': notes,
      'created_at': DateTime.now().toIso8601String(),
    });
  }

  Future<List<Map<String, dynamic>>> getPendingUpdates() async {
    final database = await db;
    return database.query('pending_updates');
  }

  Future<void> deletePendingUpdate(int id) async {
    final database = await db;
    await database.delete('pending_updates', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> clearAll() async {
    final database = await db;
    await database.delete('projects');
    await database.delete('module_items');
    await database.delete('pending_updates');
  }
}
