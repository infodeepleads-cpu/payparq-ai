class ListSearchFilter {
  static List<T> filter<T>({
    required List<T> items,
    required String query,
    required Iterable<String?> Function(T item) fields,
  }) {
    final q = query.trim().toLowerCase();
    if (q.isEmpty) {
      return items;
    }
    return items.where((item) {
      for (final field in fields(item)) {
        final value = (field ?? '').toLowerCase();
        if (value.contains(q)) {
          return true;
        }
      }
      return false;
    }).toList();
  }
}
