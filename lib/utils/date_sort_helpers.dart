class DateSortHelpers {
  static DateTime parse(String? raw, {DateTime? fallback}) {
    return DateTime.tryParse(raw ?? '') ??
        fallback ??
        DateTime.fromMillisecondsSinceEpoch(0);
  }

  static DateTime ensureCachedDate(
    Map<String, dynamic> item,
    String sourceKey,
    String cacheKey, {
    DateTime? fallback,
  }) {
    final cached = item[cacheKey];
    if (cached is DateTime) {
      return cached;
    }
    final parsed = parse(item[sourceKey]?.toString(), fallback: fallback);
    item[cacheKey] = parsed;
    return parsed;
  }

  static void sortByCachedDate(
    List<Map<String, dynamic>> items,
    String cacheKey, {
    bool descending = true,
  }) {
    items.sort((a, b) {
      final dateA = a[cacheKey] as DateTime? ??
          DateTime.fromMillisecondsSinceEpoch(0);
      final dateB = b[cacheKey] as DateTime? ??
          DateTime.fromMillisecondsSinceEpoch(0);
      return descending ? dateB.compareTo(dateA) : dateA.compareTo(dateB);
    });
  }
}
