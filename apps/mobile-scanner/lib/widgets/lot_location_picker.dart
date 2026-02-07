import 'dart:convert';
import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';

class LotLocationPicker extends StatefulWidget {
  final Function(LatLng, String) onLocationSelected;
  final LatLng initialLocation;

  const LotLocationPicker({
    super.key,
    required this.onLocationSelected,
    this.initialLocation = const LatLng(45.8150, 15.9819), // Default to Zagreb
  });

  @override
  State<LotLocationPicker> createState() => _LotLocationPickerState();
}

class _LotLocationPickerState extends State<LotLocationPicker> {
  late LatLng _currentCenter;
  final MapController _mapController = MapController();
  final TextEditingController _searchController = TextEditingController();
  List<dynamic> _searchResults = [];
  bool _isSearching = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _currentCenter = widget.initialLocation;
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _searchAddress(String query) async {
    if (query.length < 3) {
      setState(() => _searchResults = []);
      return;
    }

    setState(() => _isSearching = true);

    try {
      final response = await http.get(
        Uri.parse(
            'https://nominatim.openstreetmap.org/search?format=json&q=$query&limit=5'),
        headers: {'User-Agent': 'payparq.ai App'},
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        if (mounted) {
          setState(() {
            _searchResults = json.decode(response.body);
            _isSearching = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Search error: $e');
      if (mounted) setState(() => _isSearching = false);
    }
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 600), () {
      _searchAddress(query);
    });
  }

  Future<void> _getCurrentLocation() async {
    setState(() => _isSearching = true);
    try {
      // For Web, we bypass most Geolocator checks as they often fail with MissingPluginException
      if (kIsWeb) {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: WebSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 10),
          ),
        );
        final newLatLng = LatLng(position.latitude, position.longitude);
        if (mounted) {
          setState(() {
            _currentCenter = newLatLng;
            _mapController.move(newLatLng, 15);
            _isSearching = false;
          });
          widget.onLocationSelected(newLatLng, "Current Location");
        }
        return;
      }

      // Mobile path
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        throw 'Location services are disabled.';
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          throw 'Location permissions are denied';
        }
      }

      if (permission == LocationPermission.deniedForever) {
        throw 'Location permissions are permanently denied.';
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: LocationSettings(
          accuracy: LocationAccuracy.medium,
          timeLimit: const Duration(seconds: 10),
        ),
      );

      final newLatLng = LatLng(position.latitude, position.longitude);

      if (mounted) {
        setState(() {
          _currentCenter = newLatLng;
          _mapController.move(newLatLng, 15);
          _isSearching = false;
        });
        widget.onLocationSelected(newLatLng, "Current Location");
      }
    } catch (e) {
      debugPrint('Location error: $e');
      if (mounted) {
        setState(() => _isSearching = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not get location: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Map Container with Integrated Search
        Container(
          height: 400,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[300]!),
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            children: [
              FlutterMap(
                mapController: _mapController,
                options: MapOptions(
                  initialCenter: _currentCenter,
                  initialZoom: 15,
                  onTap: (tapPosition, point) {
                    setState(() => _currentCenter = point);
                    widget.onLocationSelected(point, _searchController.text);
                  },
                ),
                children: [
                  TileLayer(
                    urlTemplate:
                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    userAgentPackageName: 'com.payparq.ai',
                  ),
                  MarkerLayer(
                    markers: [
                      Marker(
                        point: _currentCenter,
                        width: 40,
                        height: 40,
                        child: const Icon(Icons.location_on,
                            color: Colors.red, size: 40),
                      ),
                    ],
                  ),
                ],
              ),
              // Search Bar Over Map
              Positioned(
                top: 16,
                left: 16,
                right: 16,
                child: Column(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: _onSearchChanged,
                        decoration: InputDecoration(
                          hintText: 'Search address or city...',
                          prefixIcon:
                              const Icon(Icons.search, color: Colors.black54),
                          suffixIcon: _isSearching
                              ? const Padding(
                                  padding: EdgeInsets.all(12.0),
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.black),
                                )
                              : IconButton(
                                  icon: const Icon(Icons.clear,
                                      color: Colors.black54),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchResults = []);
                                  },
                                ),
                          border: InputBorder.none,
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onSubmitted: _searchAddress,
                      ),
                    ),
                    if (_searchResults.isNotEmpty)
                      Container(
                        margin: const EdgeInsets.only(top: 8),
                        constraints: const BoxConstraints(maxHeight: 200),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(8),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.1),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemCount: _searchResults.length,
                          separatorBuilder: (context, index) =>
                              const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final res = _searchResults[index];
                            return ListTile(
                              leading: const Icon(Icons.location_on_outlined,
                                  size: 18),
                              title: Text(
                                res['display_name'],
                                style: GoogleFonts.inter(fontSize: 13),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              onTap: () {
                                final lat = double.parse(res['lat']);
                                final lon = double.parse(res['lon']);
                                final newLatLng = LatLng(lat, lon);
                                setState(() {
                                  _currentCenter = newLatLng;
                                  _mapController.move(newLatLng, 15);
                                  _searchResults = [];
                                  _searchController.text = res['display_name'];
                                });
                                widget.onLocationSelected(
                                    newLatLng, res['display_name']);
                              },
                            );
                          },
                        ),
                      ),
                  ],
                ),
              ),
              // My Location Button
              Positioned(
                bottom: 16,
                right: 16,
                child: FloatingActionButton(
                  onPressed: _getCurrentLocation,
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  elevation: 4,
                  child: const Icon(Icons.my_location),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.info_outline, size: 14, color: Colors.grey),
            const SizedBox(width: 8),
            Text(
              'Tap map to set precise lot center',
              style: GoogleFonts.inter(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontStyle: FontStyle.italic),
            ),
          ],
        ),
      ],
    );
  }
}

class PositionRectangle extends StatelessWidget {
  final Widget child;
  final Alignment alignment;

  const PositionRectangle(
      {super.key, required this.child, required this.alignment});

  @override
  Widget build(BuildContext context) {
    return Align(alignment: alignment, child: child);
  }
}
