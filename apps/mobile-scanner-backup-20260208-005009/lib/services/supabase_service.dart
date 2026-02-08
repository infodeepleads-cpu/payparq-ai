import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service layer for Supabase operations with connection pooling and error handling
class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance => _instance ??= SupabaseService._();

  SupabaseService._();

  /// Connection pool for managing concurrent requests
  final Map<String, Timer> _connectionTimers = {};
  final Map<String, int> _connectionPool = {};
  static const int _maxConcurrentConnections = 10;

  /// Initialize with timeout and error handling
  Future<void> initialize({
    required String url,
    required String anonKey,
    Duration timeout = const Duration(seconds: 5),
  }) async {
    try {
      final initFuture = Supabase.initialize(
        url: url,
        anonKey: anonKey,
      );

      await initFuture.timeout(timeout, onTimeout: () {
        throw TimeoutException(
            'Supabase initialization timed out after ${timeout.inSeconds} seconds');
      });
      debugPrint('SupabaseService: Initialized successfully');
    } catch (e) {
      debugPrint('SupabaseService: Initialization failed: $e');
      rethrow;
    }
  }

  /// Execute query with connection pooling and rate limiting
  Future<T> executeQuery<T>({
    required String queryId,
    required Future<T> Function() query,
    Duration timeout = const Duration(seconds: 10),
  }) async {
    // Check connection pool limit
    if (_connectionPool.length >= _maxConcurrentConnections) {
      throw Exception(
          'Connection pool limit reached ($_maxConcurrentConnections)');
    }

    // Track connection
    _connectionPool[queryId] = (_connectionPool[queryId] ?? 0) + 1;

    try {
      final result = await query().timeout(timeout);

      // Clean up connection tracking
      _cleanupConnection(queryId);

      return result;
    } catch (e) {
      _cleanupConnection(queryId);
      debugPrint('SupabaseService: Query $queryId failed: $e');
      rethrow;
    }
  }

  /// Stream with debouncing for real-time updates
  Stream<T> executeStream<T>({
    required String streamId,
    required Stream<T> Function() stream,
    Duration debounceDelay = const Duration(milliseconds: 300),
  }) {
    Timer? debounceTimer;
    final controller = StreamController<T>();

    final subscription = stream().listen(
      (data) {
        // Cancel previous timer
        debounceTimer?.cancel();

        // Set new timer for debouncing
        debounceTimer = Timer(debounceDelay, () {
          if (!controller.isClosed) {
            controller.add(data);
          }
        });
      },
      onError: (error) {
        debugPrint('SupabaseService: Stream $streamId error: $error');
        if (!controller.isClosed) {
          controller.addError(error);
        }
      },
      onDone: () {
        debounceTimer?.cancel();
        if (!controller.isClosed) {
          controller.close();
        }
      },
    );

    controller.onCancel = () {
      debounceTimer?.cancel();
      subscription.cancel();
    };

    return controller.stream;
  }

  /// Clean up connection tracking
  void _cleanupConnection(String queryId) {
    _connectionTimers[queryId]?.cancel();
    _connectionTimers.remove(queryId);

    final count = _connectionPool[queryId] ?? 0;
    if (count <= 1) {
      _connectionPool.remove(queryId);
    } else {
      _connectionPool[queryId] = count - 1;
    }
  }

  /// Get current connection pool status
  Map<String, dynamic> getConnectionStatus() {
    return {
      'activeConnections': _connectionPool.length,
      'connectionCounts': Map<String, int>.from(_connectionPool),
      'maxConnections': _maxConcurrentConnections,
    };
  }

  /// Dispose and cleanup all resources
  void dispose() {
    for (final timer in _connectionTimers.values) {
      timer.cancel();
    }
    _connectionTimers.clear();
    _connectionPool.clear();
  }
}
