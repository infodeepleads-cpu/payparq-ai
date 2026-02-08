import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/analytics_provider.dart';

class AnalyticsDashboardScreen extends ConsumerStatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  ConsumerState<AnalyticsDashboardScreen> createState() =>
      _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState
    extends ConsumerState<AnalyticsDashboardScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final analyticsAsync = ref.watch(analyticsProvider);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: analyticsAsync.when(
        data: (data) => SingleChildScrollView(
          padding: const EdgeInsets.all(48),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                'Analytics',
                style: GoogleFonts.inter(
                  fontSize: 40,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Monitor performance, revenue, and system risks.',
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              const SizedBox(height: 48),

              // Row 1: 4 Metric Cubicles
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 60),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 4,
                  crossAxisSpacing: 24,
                  mainAxisSpacing: 24,
                  childAspectRatio: 1.6,
                  children: [
                    _buildMetricCard(
                      'DAILY REVENUE',
                      '€${data.dailyRevenue.toStringAsFixed(2)}',
                      Icons.euro,
                    ),
                    _buildMetricCard(
                      'MONTHLY REV AVG',
                      '€${data.monthlyRevenueAvg.toStringAsFixed(2)}',
                      Icons.calendar_month,
                    ),
                    _buildMetricCard(
                      'DAILY OCCUPANCY',
                      '${data.dailyOccupancy.toStringAsFixed(1)}%',
                      Icons.pie_chart_outline,
                    ),
                    _buildMetricCard(
                      'MONTHLY AVG OCCUPANCY',
                      '${data.monthlyOccupancyAvg.toStringAsFixed(1)}%',
                      Icons.analytics_outlined,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 48),

              // Row 2: 1/4 Graphs with Arrows
              SizedBox(
                height: 520,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    PageView(
                      controller: _pageController,
                      onPageChanged: (int page) {
                        setState(() {
                          _currentPage = page;
                        });
                      },
                      children: [
                        _buildGraphCard(
                          'AVG REVENUE',
                          data.revenueChart,
                          Colors.black,
                          '€',
                          'Average daily revenue trends over the last 30 days.',
                        ),
                        _buildGraphCard(
                          'TOTAL NET',
                          data.netRevenueChart,
                          Colors.black,
                          '€',
                          'Net earnings after processing fees and operational costs.',
                        ),
                        _buildGraphCard(
                          'AVG OCCUPANCY',
                          data.occupancyChart,
                          Colors.black,
                          '%',
                          'Average parking lot occupancy rate distribution.',
                        ),
                        _buildSpreadGraph(
                          'REVENUE SPREAD',
                          data.revenueFines,
                          data.revenueNormal,
                        ),
                      ],
                    ),
                    // Navigation Arrows
                    Positioned(
                      left: 0,
                      child: _currentPage > 0
                          ? _buildArrowButton(
                              icon: Icons.arrow_back_ios_new,
                              onPressed: () {
                                _pageController.previousPage(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                );
                              },
                            )
                          : const SizedBox(),
                    ),
                    Positioned(
                      right: 0,
                      child: _currentPage < 3
                          ? _buildArrowButton(
                              icon: Icons.arrow_forward_ios,
                              onPressed: () {
                                _pageController.nextPage(
                                  duration: const Duration(milliseconds: 300),
                                  curve: Curves.easeInOut,
                                );
                              },
                            )
                          : const SizedBox(),
                    ),
                    // Page Indicator
                    Positioned(
                      bottom: 24,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          4,
                          (index) => Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _currentPage == index
                                  ? Colors.grey.shade700
                                  : Colors.grey.shade700.withValues(alpha: 0.1),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
      ),
    );
  }

  Widget _buildArrowButton(
      {required IconData icon, required VoidCallback onPressed}) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.border),
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.grey.shade700, size: 20),
        onPressed: onPressed,
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, size: 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 8),
                  Text(
                    value,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildGraphCard(String title, List<ChartPoint> points, Color color,
      String unit, String description) {
    // Calculate rich data points
    final double currentVal = points.isNotEmpty ? points.last.y : 0;
    final double prevVal = points.length > 1 ? points[points.length - 2].y : 0;
    final double diff = currentVal - prevVal;
    final bool isUp = diff >= 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 60),
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade800,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: AppTheme.textSecondary,
                    ),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    unit == '€'
                        ? '€${currentVal.toStringAsFixed(2)}'
                        : '${currentVal.toStringAsFixed(1)}%',
                    style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade800,
                      letterSpacing: -0.5,
                    ),
                  ),
                  Row(
                    children: [
                      Icon(
                        isUp ? Icons.trending_up : Icons.trending_down,
                        size: 16,
                        color: isUp ? Colors.green : Colors.red,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        '${isUp ? '+' : ''}${diff.toStringAsFixed(2)}',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: isUp ? Colors.green : Colors.red,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 48),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  getDrawingHorizontalLine: (v) =>
                      const FlLine(color: Color(0xFFF0F0F0), strokeWidth: 1),
                ),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (v, meta) {
                        return const SizedBox();
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      getTitlesWidget: (v, meta) {
                        return Text(
                          v.toInt().toString(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                          ),
                        );
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                lineBarsData: [
                  LineChartBarData(
                    spots: points
                        .asMap()
                        .entries
                        .map((e) => FlSpot(e.key.toDouble(), e.value.y))
                        .toList(),
                    isCurved: true,
                    color: Colors.grey.shade700,
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) =>
                          FlDotCirclePainter(
                        radius: 4,
                        color: Colors.grey.shade700,
                        strokeWidth: 2,
                        strokeColor: Colors.white,
                      ),
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Colors.grey.shade700.withValues(alpha: 0.05),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSpreadGraph(String title, double fines, double normal) {
    final total = fines + normal;
    final finesPct = total > 0 ? (fines / total * 100) : 0;
    final normalPct = total > 0 ? (normal / total * 100) : 0;

    return Container(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(64),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Expanded(
            flex: 1,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Distribution between penalty charges and regular parking.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
                const Spacer(),
                _buildSpreadDetail('REGULAR REVENUE', normal,
                    normalPct.toDouble(), Colors.grey.shade800, Colors.white),
                const SizedBox(height: 16),
                _buildSpreadDetail(
                    'FINES & PENALTIES',
                    fines,
                    finesPct.toDouble(),
                    const Color(0xFFE0E0E0),
                    Colors.grey.shade800),
                const Spacer(),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Center(
              child: PieChart(
                PieChartData(
                  sectionsSpace: 4,
                  centerSpaceRadius: 120,
                  sections: [
                    PieChartSectionData(
                      value: fines,
                      title: '${finesPct.toStringAsFixed(0)}%',
                      color: const Color(0xFFE0E0E0),
                      radius: 140,
                      titleStyle: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                      ),
                    ),
                    PieChartSectionData(
                      value: normal,
                      title: '${normalPct.toStringAsFixed(0)}%',
                      color: Colors.grey.shade700,
                      radius: 140,
                      titleStyle: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpreadDetail(
      String label, double value, double pct, Color color, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(8),
        border:
            color == Colors.white ? Border.all(color: AppTheme.border) : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: textColor.withValues(alpha: 0.7),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '€${value.toStringAsFixed(2)}',
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
          Text(
            '${pct.toStringAsFixed(1)}%',
            style: GoogleFonts.inter(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}
