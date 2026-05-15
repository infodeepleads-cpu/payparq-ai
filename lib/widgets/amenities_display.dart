import 'package:flutter/material.dart';
import '../models/amenities.dart';

class AmenitiesDisplay extends StatelessWidget {
  final List<String> selected;
  final Function(String)? onToggle;
  final bool editable;
  final String size;

  const AmenitiesDisplay({
    Key? key,
    required this.selected,
    this.onToggle,
    this.editable = false,
    this.size = 'md',
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final iconSize = size == 'sm' ? 12.0 : 16.0;
    final padding = size == 'sm' ? 4.0 : 8.0;
    final textSize = size == 'sm' ? 10.0 : 12.0;

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: AmenitiesManager.amenitiesList.map((amenity) {
        final isSelected = selected.contains(amenity.id);
        return GestureDetector(
          onTap: editable ? () => onToggle?.call(amenity.id) : null,
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: padding + 4, vertical: padding),
            decoration: BoxDecoration(
              color: isSelected ? Colors.black : Colors.transparent,
              border: Border.all(
                color: isSelected ? Colors.black : Colors.grey[300]!,
                width: 1,
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  amenity.icon,
                  size: iconSize,
                  color: isSelected ? Colors.white : Colors.black,
                ),
                SizedBox(width: 4),
                Text(
                  amenity.label,
                  style: TextStyle(
                    fontSize: textSize,
                    fontWeight: FontWeight.w500,
                    color: isSelected ? Colors.white : Colors.black,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }
}
