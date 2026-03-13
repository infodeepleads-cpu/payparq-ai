import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Service layer for Supabase operations with connection pooling and error handling
class SupabaseService {
  static SupabaseService? _instance;
  static SupabaseService get instance => _instance ??= SupabaseService._();

  SupabaseService._();
  bool _isInitialized = false;

  /// Connection pool for managing concurrent requests
  final Map<String, Timer> _connectionTimers = {};
  final Map<String, int> _connectionPool = {};
  static const int _maxConcurrentConnections = 30;

  /// Initialize with timeout and error handling
  Future<void> initialize({
    required String url,
    required String anonKey,
    Duration timeout = const Duration(seconds: 8),
  }) async {
    if (_isInitialized) return;
    try {
      debugPrint('SupabaseService: About to initialize');
      debugPrint('SupabaseService: DEBUG url=$url');
      debugPrint('SupabaseService: DEBUG anon key length=${anonKey.length}');
      if (url.isEmpty || anonKey.isEmpty) {
        throw ArgumentError('Supabase URL or Anon Key is empty');
      }
      final prefix = anonKey.isNotEmpty
          ? (anonKey.length > 20 ? anonKey.substring(0, 20) : anonKey)
          : '<empty>';
      debugPrint('SupabaseService: DEBUG anon key prefix=$prefix...');
      final initFuture = Supabase.initialize(
        url: url,
        anonKey: anonKey,
        debug: kDebugMode,
      );

      await initFuture.timeout(timeout, onTimeout: () {
        throw TimeoutException(
            'Supabase initialization timed out after ${timeout.inSeconds} seconds');
      });
      _isInitialized = true;
      debugPrint('SupabaseService: Initialized successfully');
    } catch (e) {
      final message = e.toString().toLowerCase();
      if (message.contains('already initialized')) {
        _isInitialized = true;
        return;
      }
      debugPrint('SupabaseService: Initialization failed: $e');
      try {
        debugPrint('SupabaseService: Retrying initialization once...');
        final retryFuture = Supabase.initialize(
          url: url,
          anonKey: anonKey,
          debug: kDebugMode,
        );
        await retryFuture.timeout(const Duration(seconds: 6), onTimeout: () {
          throw TimeoutException(
              'Supabase retry timed out after 6 seconds');
        });
        _isInitialized = true;
        debugPrint('SupabaseService: Retry succeeded');
      } catch (e2) {
        final retryMessage = e2.toString().toLowerCase();
        if (retryMessage.contains('already initialized')) {
          _isInitialized = true;
          return;
        }
        debugPrint('SupabaseService: Retry failed: $e2');
        rethrow;
      }
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
