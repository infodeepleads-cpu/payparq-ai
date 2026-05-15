import 'package:flutter/material.dart';

class Amenity {
  final String id;
  final String label;
  final IconData icon;

  const Amenity({
    required this.id,
    required this.label,
    required this.icon,
  });
}

class AmenitiesManager {
  static const List<Amenity> amenitiesList = [
    Amenity(id: 'valet', label: 'Valet', icon: Icons.person),
    Amenity(id: 'shuttle', label: 'Shuttle', icon: Icons.directions_bus),
    Amenity(id: 'ev-charging', label: 'EV Charging', icon: Icons.electrical_services),
    Amenity(id: 'wheelchair-accessible', label: 'Wheelchair Access', icon: Icons.accessible),
    Amenity(id: 'rampa', label: 'Rampa', icon: Icons.accessible_forward),
    Amenity(id: 'in-out-allowed', label: 'In/Out Allowed', icon: Icons.repeat),
    Amenity(id: 'tank-refill', label: 'Tank Refill', icon: Icons.local_gas_station),
    Amenity(id: 'garage', label: 'Garaža', icon: Icons.warehouse),
    Amenity(id: 'self-park', label: 'Self Park', icon: Icons.local_parking),
  ];

  static String getLabel(String id) {
    return amenitiesList.firstWhere(
      (a) => a.id == id,
      orElse: () => Amenity(id: id, label: id, icon: Icons.help),
    ).label;
  }

  static IconData getIcon(String id) {
    return amenitiesList.firstWhere(
      (a) => a.id == id,
      orElse: () => Amenity(id: id, label: id, icon: Icons.help),
    ).icon;
  }
}
