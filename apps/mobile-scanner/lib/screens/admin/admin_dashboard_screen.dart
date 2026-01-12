import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../theme.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  String _selectedFilter = 'All';
  final TextEditingController _searchController = TextEditingController();

  // Mock Data
  final List<Map<String, dynamic>> _users = [
    {
      'plate': 'ZG-1234-AB',
      'mobile': '+385 91 234 5678',
      'email': 'user1@example.com',
      'name': 'Ivan Horvat',
      'status': 'Active'
    },
    {
      'plate': 'ST-9876-CD',
      'mobile': '+385 98 765 4321',
      'email': 'ana.k@example.com',
      'name': 'Ana Kovac',
      'status': 'Inactive'
    },
    {
      'plate': 'RI-5555-EF',
      'mobile': '+385 95 555 5555',
      'email': 'marko.m@example.com',
      'name': 'Marko Maric',
      'status': 'Active'
    },
    {
      'plate': 'ZG-0000-00',
      'mobile': '+385 99 000 0000',
      'email': 'test@payparq.ai',
      'name': 'Test User',
      'status': 'Active'
    },
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 800;

    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: isDesktop
          ? null // No AppBar on Desktop (handled by layout header)
          : AppBar(
              backgroundColor: AppTheme.primary,
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () {},
              ),
              title: Text(
                'Page Title',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              elevation: 0,
            ),
      body: Column(
        children: [
          // Header Section
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24.0),
            decoration: BoxDecoration(
              color: isDesktop ? AppTheme.lightBackground : AppTheme.primary,
              border: isDesktop
                  ? const Border(
                      bottom: BorderSide(color: Color(0xFFE5E7EB)))
                  : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isDesktop) ...[
                  Text(
                    'Users',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Below is a list of users of your parking lot.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ] else ...[
                  Text(
                    'Users',
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Below is a list of users of your parking lot.',
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
                const SizedBox(height: 24),
                // Search Bar
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search...',
                    hintStyle: TextStyle(
                        color: isDesktop ? Colors.grey : Colors.white70),
                    prefixIcon: Icon(Icons.search,
                        color: isDesktop ? Colors.grey : Colors.white70),
                    filled: true,
                    fillColor: isDesktop
                        ? Colors.white
                        : Colors.white.withOpacity(0.1),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: isDesktop
                          ? const BorderSide(color: Color(0xFFE5E7EB))
                          : BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(30),
                      borderSide: isDesktop
                          ? const BorderSide(color: Color(0xFFE5E7EB))
                          : BorderSide.none,
                    ),
                  ),
                  style: TextStyle(
                      color: isDesktop ? Colors.black : Colors.white),
                ),
                const SizedBox(height: 24),
                // Filter Chips
                Row(
                  children: [
                    _buildFilterChip('All'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Active'),
                    const SizedBox(width: 8),
                    _buildFilterChip('Inactive'),
                  ],
                ),
              ],
            ),
          ),
          // Content
          Expanded(
            child: isDesktop ? _buildDesktopTable() : _buildMobileList(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppTheme.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFilterChip(String label) {
    final isSelected = _selectedFilter == label;
    // On Desktop, background is white, so chips need contrast.
    // On Mobile (in header), background is purple.
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width >= 800;

    Color backgroundColor;
    Color textColor;

    if (isDesktop) {
      backgroundColor = isSelected ? AppTheme.primary : const Color(0xFFF3F4F6);
      textColor = isSelected ? Colors.white : Colors.grey[700]!;
    } else {
      backgroundColor = isSelected ? Colors.white : Colors.white.withOpacity(0.2);
      textColor = isSelected ? AppTheme.primary : Colors.white;
    }

    return GestureDetector(
      onTap: () => setState(() => _selectedFilter = label),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _buildMobileList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: _users.length,
      itemBuilder: (context, index) {
        final user = _users[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E7EB)),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user['plate'],
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Colors.black,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      user['mobile'],
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.grey[500],
                      ),
                    ),
                    const SizedBox(height: 8),
                    _buildStatusBadge(user['status']),
                  ],
                ),
              ),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  minimumSize: const Size(0, 32),
                ),
                child: const Text('View'),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDesktopTable() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE5E7EB)),
        ),
        child: DataTable(
          headingRowColor: MaterialStateProperty.all(const Color(0xFFF9FAFB)),
          columns: const [
            DataColumn(label: Text('Plate / Mobile')),
            DataColumn(label: Text('Email')),
            DataColumn(label: Text('Name')),
            DataColumn(label: Text('Status')),
            DataColumn(label: Text('View')),
          ],
          rows: _users.map((user) {
            return DataRow(cells: [
              DataCell(
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(user['plate'], style: const TextStyle(fontWeight: FontWeight.w600)),
                    Text(user['mobile'], style: TextStyle(color: Colors.grey[500], fontSize: 12)),
                  ],
                ),
              ),
              DataCell(Text(user['email'])),
              DataCell(Text(user['name'])),
              DataCell(_buildStatusBadge(user['status'])),
              DataCell(
                ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    minimumSize: const Size(0, 32),
                  ),
                  child: const Text('View'),
                ),
              ),
            ]);
          }).toList(),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final isActive = status == 'Active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isActive ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isActive ? Colors.green.withOpacity(0.2) : Colors.red.withOpacity(0.2),
        ),
      ),
      child: Text(
        status,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: isActive ? Colors.green[700] : Colors.red[700],
        ),
      ),
    );
  }
}
