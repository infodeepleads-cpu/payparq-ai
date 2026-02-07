import 'package:flutter_riverpod/legacy.dart';

final localeIsCroatianProvider =
    StateProvider.autoDispose<bool>((ref) => false);

final showAdvancedTabsProvider = StateProvider<bool>((ref) => false);
