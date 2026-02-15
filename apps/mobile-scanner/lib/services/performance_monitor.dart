import 'dart:async';
import 'package:flutter/foundation.dart';

/// Performance monitoring service for tracking connection usage and performance metrics
class PerformanceMonitor {
  static PerformanceMonitor? _instance;
  static PerformanceMonitor get instance => _instance ??= PerformanceMonitor._();
  
  PerformanceMonitor._();

  final Map<String, PerformanceMetric> _metrics = {};
  final StreamController<PerformanceMetric> _metricStream = StreamController.broadcast();
  Timer? _cleanupTimer;

  /// Record a performance metric
  void recordMetric({
    required String operation,
    required Duration duration,
    required bool success,
    Map<String, dynamic>? metadata,
  }) {
    final metric = PerformanceMetric(
      operation: operation,
      duration: duration,
      success: success,
      timestamp: DateTime.now(),
      metadata: metadata ?? {},
    );

    _metrics['${operation}_${DateTime.now().millisecondsSinceEpoch}'] = metric;
    _metricStream.add(metric);

    debugPrint('PerformanceMonitor: $operation took ${duration.inMilliseconds}ms (${success ? 'success' : 'failed'})');
  }

  /// Get average duration for an operation type
  Duration getAverageDuration(String operation) {
    final relevantMetrics = _metrics.values
        .where((m) => m.operation == operation)
        .toList();

    if (relevantMetrics.isEmpty) return Duration.zero;

    final totalMs = relevantMetrics
        .map((m) => m.duration.inMilliseconds)
        .reduce((a, b) => a + b);

    return Duration(milliseconds: totalMs ~/ relevantMetrics.length);
  }

  /// Get success rate for an operation type
  double getSuccessRate(String operation) {
    final relevantMetrics = _metrics.values
        .where((m) => m.operation == operation)
        .toList();

    if (relevantMetrics.isEmpty) return 0.0;

    final successful = relevantMetrics.where((m) => m.success).length;
    return successful / relevantMetrics.length;
  }

  /// Get performance summary
  Map<String, dynamic> getPerformanceSummary() {
    final operations = _metrics.values.map((m) => m.operation).toSet();
    
    return {
      'totalOperations': _metrics.length,
      'operations': operations.map((op) => {
        'operation': op,
        'averageDuration': getAverageDuration(op).inMilliseconds,
        'successRate': getSuccessRate(op),
        'totalCalls': _metrics.values.where((m) => m.operation == op).length,
      }).toList(),
      'recentMetrics': _metrics.values
          .where((m) => DateTime.now().difference(m.timestamp).inMinutes < 5)
          .length,
    };
  }

  /// Start periodic cleanup of old metrics
  void startCleanupTimer({Duration cleanupInterval = const Duration(minutes: 5)}) {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer.periodic(cleanupInterval, (_) {
      final cutoff = DateTime.now().subtract(const Duration(minutes: 30));
      _metrics.removeWhere((key, metric) => metric.timestamp.isBefore(cutoff));
      
      if (_metrics.length > 1000) {
        // Keep only the most recent 500 metrics
        final sortedKeys = _metrics.keys.toList()
          ..sort((a, b) => b.compareTo(a));
        final keysToRemove = sortedKeys.skip(500).toList();
        for (final key in keysToRemove) {
          _metrics.remove(key);
        }
      }
    });
  }

  /// Stream of performance metrics
  Stream<PerformanceMetric> get metricStream => _metricStream.stream;

  /// Dispose and cleanup
  void dispose() {
    _cleanupTimer?.cancel();
    _metricStream.close();
    _metrics.clear();
  }
}

/// Performance metric data class
class PerformanceMetric {
  final String operation;
  final Duration duration;
  final bool success;
  final DateTime timestamp;
  final Map<String, dynamic> metadata;

  PerformanceMetric({
    required this.operation,
    required this.duration,
    required this.success,
    required this.timestamp,
    required this.metadata,
  });

  @override
  String toString() {
    return 'PerformanceMetric{operation: $operation, duration: ${duration.inMilliseconds}ms, success: $success, timestamp: $timestamp}';
  }
}