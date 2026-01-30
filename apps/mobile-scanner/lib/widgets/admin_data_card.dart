import 'package:flutter/material.dart';
import '../theme.dart';

class AdminDataCard extends StatelessWidget {
  final Widget leading;
  final Widget mainContent;
  final Widget? trailing;

  const AdminDataCard({
    super.key,
    required this.leading,
    required this.mainContent,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          leading,
          const SizedBox(width: 24),
          Expanded(child: mainContent),
          if (trailing != null) ...[
            const SizedBox(width: 24),
            trailing!,
          ],
        ],
      ),
    );
  }
}

