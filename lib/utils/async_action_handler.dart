import 'package:flutter/material.dart';

class AsyncActionHandler {
  static Future<T?> run<T>({
    required BuildContext context,
    required Future<T> Function() action,
    String? successMessage,
    String? errorMessage,
    String Function(Object error)? errorBuilder,
    Color? successColor,
    Color? errorColor,
    VoidCallback? onSuccess,
    void Function(Object error)? onError,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      final result = await action();
      if (successMessage != null && successMessage.isNotEmpty) {
        messenger.showSnackBar(
          SnackBar(
            content: Text(successMessage),
            backgroundColor: successColor,
          ),
        );
      }
      onSuccess?.call();
      return result;
    } catch (e) {
      final message = errorBuilder != null
          ? errorBuilder(e)
          : (errorMessage ?? 'Error: $e');
      messenger.showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: errorColor ?? Colors.red,
        ),
      );
      onError?.call(e);
      return null;
    }
  }
}
