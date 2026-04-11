import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:payparq_scanner/utils/list_search_filter.dart';
import 'package:payparq_scanner/utils/date_sort_helpers.dart';
import 'package:payparq_scanner/services/app_error.dart';
import 'package:payparq_scanner/services/error_mapper.dart';
import 'package:payparq_scanner/logic/utils/location_resolver.dart';
import 'package:payparq_scanner/logic/providers/auth_providers.dart';

void main() {
  test('ListSearchFilter matches across fields', () {
    final items = [
      {'plate': 'ABC123', 'type': 'ticket'},
      {'plate': 'XYZ999', 'type': 'warning'},
    ];
    final result = ListSearchFilter.filter(
      items: items,
      query: 'xyz',
      fields: (item) => [item['plate']?.toString(), item['type']?.toString()],
    );
    expect(result.length, 1);
    expect(result.first['plate'], 'XYZ999');
  });

  test('ListSearchFilter returns all items for empty query', () {
    final items = [
      {'plate': 'ABC123'},
      {'plate': 'XYZ999'},
    ];
    final result = ListSearchFilter.filter(
      items: items,
      query: '',
      fields: (item) => [item['plate']?.toString()],
    );
    expect(result.length, 2);
  });

  test('DateSortHelpers.parse returns fallback', () {
    final fallback = DateTime(2000, 1, 1);
    final result = DateSortHelpers.parse('invalid', fallback: fallback);
    expect(result, fallback);
  });

  test('DateSortHelpers.ensureCachedDate caches value', () {
    final item = <String, dynamic>{'created_at': '2024-01-01T00:00:00Z'};
    final first =
        DateSortHelpers.ensureCachedDate(item, 'created_at', 'cached');
    final second =
        DateSortHelpers.ensureCachedDate(item, 'created_at', 'cached');
    expect(identical(first, second), true);
  });

  test('DateSortHelpers.sortByCachedDate sorts descending', () {
    final items = [
      {'cached': DateTime(2024, 1, 1)},
      {'cached': DateTime(2023, 1, 1)},
    ];
    DateSortHelpers.sortByCachedDate(items, 'cached');
    expect(items.first['cached'], DateTime(2024, 1, 1));
  });

  test('ErrorMapper maps AppError', () {
    final error = AppError('Something went wrong');
    expect(ErrorMapper.message(error), 'Something went wrong');
  });

  test('ErrorMapper maps invalid format', () {
    final error = Exception('Invalid format');
    expect(ErrorMapper.message(error), 'The email address format is invalid.');
  });

  test('ErrorMapper maps timeout exception', () {
    final error = TimeoutException('Request timed out');
    expect(ErrorMapper.message(error), 'Request timed out');
  });

  test('LocationResolver returns validated active selection', () async {
    final resolverProvider = FutureProvider<LocationResolution>(
        (ref) => LocationResolver.resolveFromRef(ref));
    final container = ProviderContainer(overrides: [
      activeLocationSelectionProvider.overrideWith(
        (ref) async => LocationSelection(
          uuid: 'uuid-1',
          displayId: 'LOC1',
          source: 'test',
          isValidated: true,
        ),
      ),
    ]);
    final result = await container.read(resolverProvider.future);
    expect(result.displayId, 'LOC1');
    expect(result.uuid, 'uuid-1');
    expect(result.fallbackId, null);
    container.dispose();
  });

  test('LocationResolver drops unresolved active selection data', () async {
    final resolverProvider = FutureProvider<LocationResolution>(
        (ref) => LocationResolver.resolveFromRef(ref));
    final container = ProviderContainer(overrides: [
      activeLocationSelectionProvider.overrideWith(
        (ref) async => LocationSelection(
          uuid: 'uuid-1',
          displayId: 'LOC1',
          source: 'test',
          isValidated: false,
        ),
      ),
    ]);
    final result = await container.read(resolverProvider.future);
    expect(result.displayId, 'LOC1');
    expect(result.uuid, null);
    expect(result.fallbackId, null);
    container.dispose();
  });
}
