import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../theme.dart';
import '../../../../logic/providers/analytics_provider.dart';
import '../../../../logic/providers/locale_provider.dart';

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
    final isCroatian = ref.watch(localeIsCroatianProvider);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 700;
    final isMobileWeb = kIsWeb && isMobile;
    final isTablet = screenWidth >= 700 && screenWidth < 1100;
    final pagePadding = isMobile ? 16.0 : (isTablet ? 24.0 : 48.0);
    final metricColumns = isMobile ? 1 : (isTablet ? 2 : 4);
    final metricSpacing = isMobile ? 12.0 : (isTablet ? 16.0 : 24.0);
    final metricAspectRatio = isMobile ? 2.3 : (isTablet ? 1.9 : 1.6);
    final graphHeight = isMobile ? 420.0 : (isTablet ? 480.0 : 520.0);

    return Scaffold(
      backgroundColor: AppTheme.background,
      body: analyticsAsync.when(
        data: (data) => SingleChildScrollView(
          padding: EdgeInsets.all(pagePadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Text(
                Lang.sel(isCroatian, 'Analytics', 'Analitika'),
                style: GoogleFonts.inter(
                  fontSize: isMobileWeb ? 32 : (isMobile ? 30 : 40),
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                Lang.sel(
                    isCroatian,
                    'Monitor performance, revenue, and system risks.',
                    'Pratite performanse, prihod i sustavne rizike.'),
                style: GoogleFonts.inter(
                  fontSize: isMobile ? 13 : 14,
                  color: AppTheme.textSecondary,
                ),
              ),
              SizedBox(height: isMobile ? 24 : 48),

              // Row 1: 4 Metric Cubicles
              Padding(
                padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 0 : (isTablet ? 20 : 60)),
                child: GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: metricColumns,
                  crossAxisSpacing: metricSpacing,
                  mainAxisSpacing: metricSpacing,
                  childAspectRatio: metricAspectRatio,
                  children: [
                    _buildMetricCard(
                      Lang.sel(isCroatian, 'DAILY REVENUE', 'DNEVNI PRIHOD'),
                      '€${data.dailyRevenue.toStringAsFixed(2)}',
                      Icons.euro,
                      isMobile: isMobile,
                      isTablet: isTablet,
                    ),
                    _buildMetricCard(
                      Lang.sel(isCroatian, 'MONTHLY REV AVG',
                          'MJESEČNI PROSJEČNI PRIHOD'),
                      '€${data.monthlyRevenueAvg.toStringAsFixed(2)}',
                      Icons.calendar_month,
                      isMobile: isMobile,
                      isTablet: isTablet,
                    ),
                    _buildMetricCard(
                      Lang.sel(
                          isCroatian, 'DAILY OCCUPANCY', 'DNEVNA POPUNJENOST'),
                      '${data.dailyOccupancy.toStringAsFixed(1)}%',
                      Icons.pie_chart_outline,
                      isMobile: isMobile,
                      isTablet: isTablet,
                    ),
                    _buildMetricCard(
                      Lang.sel(isCroatian, 'MONTHLY AVG OCCUPANCY',
                          'MJESEČNA PROSJEČNA POPUNJENOST'),
                      '${data.monthlyOccupancyAvg.toStringAsFixed(1)}%',
                      Icons.analytics_outlined,
                      isMobile: isMobile,
                      isTablet: isTablet,
                    ),
                  ],
                ),
              ),
              SizedBox(height: isMobile ? 24 : 48),

              // Row 2: 1/4 Graphs with Arrows
              SizedBox(
                height: graphHeight,
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
                          Lang.sel(
                              isCroatian, 'AVG REVENUE', 'PROSJEČNI PRIHOD'),
                          data.revenueChart,
                          Colors.black,
                          '€',
                          Lang.sel(
                              isCroatian,
                              'Average daily revenue trends over the last 30 days.',
                              'Prosječni dnevni prihodi zadnjih 30 dana.'),
                          isMobile: isMobile,
                          isTablet: isTablet,
                        ),
                        _buildGraphCard(
                          Lang.sel(isCroatian, 'TOTAL NET', 'UKUPNO NETO'),
                          data.netRevenueChart,
                          Colors.black,
                          '€',
                          Lang.sel(
                              isCroatian,
                              'Net earnings after processing fees and operational costs.',
                              'Neto zarada nakon troškova obrade i operativnih troškova.'),
                          isMobile: isMobile,
                          isTablet: isTablet,
                        ),
                        _buildGraphCard(
                          Lang.sel(isCroatian, 'AVG OCCUPANCY',
                              'PROSJEČNA POPUNJENOST'),
                          data.occupancyChart,
                          Colors.black,
                          '%',
                          Lang.sel(
                              isCroatian,
                              'Average parking lot occupancy rate distribution.',
                              'Prosječna popunjenost parkirališta.'),
                          isMobile: isMobile,
                          isTablet: isTablet,
                        ),
                      ],
                    ),
                    // Navigation Arrows
                    Positioned(
                      left: 0,
                      child: _currentPage > 0
                          ? _buildArrowButton(
                              icon: Icons.arrow_back_ios_new,
                              isMobile: isMobile,
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
                      child: _currentPage < 2
                          ? _buildArrowButton(
                              icon: Icons.arrow_forward_ios,
                              isMobile: isMobile,
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
                          3,
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
      {required IconData icon,
      required VoidCallback onPressed,
      bool isMobile = false}) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: isMobile ? 6 : 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.border),
      ),
      child: IconButton(
        icon: Icon(icon, color: Colors.grey.shade700, size: isMobile ? 18 : 20),
        onPressed: onPressed,
        constraints: BoxConstraints(
            minWidth: isMobile ? 36 : 44, minHeight: isMobile ? 36 : 44),
        padding: EdgeInsets.all(isMobile ? 8 : 12),
      ),
    );
  }

  Widget _buildMetricCard(String title, String value, IconData icon,
      {required bool isMobile, required bool isTablet}) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : (isTablet ? 20 : 24)),
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
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: isMobile ? 13 : 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5,
                ),
              ),
              SizedBox(height: isMobile ? 8 : 4),
              Row(
                children: [
                  Icon(icon,
                      size: isMobile ? 16 : 14, color: AppTheme.textSecondary),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      value,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: isMobile ? 20 : (isTablet ? 16 : 14),
                        fontWeight: FontWeight.w500,
                        color: AppTheme.textSecondary,
                      ),
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
      String unit, String description,
      {required bool isMobile, required bool isTablet}) {
    // Calculate rich data points
    final useWebMobileTitleTypography = kIsWeb && isMobile;
    final double currentVal = points.isNotEmpty ? points.last.y : 0;
    final double prevVal = points.length > 1 ? points[points.length - 2].y : 0;
    final double diff = currentVal - prevVal;
    final bool isUp = diff >= 0;

    return Container(
      margin:
          EdgeInsets.symmetric(horizontal: isMobile ? 0 : (isTablet ? 20 : 60)),
      padding: EdgeInsets.all(isMobile ? 16 : (isTablet ? 24 : 32)),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          isMobile
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: useWebMobileTitleTypography ? 13 : 11,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey.shade800,
                        letterSpacing: useWebMobileTitleTypography ? 0.5 : -0.5,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Align(
                      alignment: Alignment.centerRight,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            unit == '€'
                                ? '€${currentVal.toStringAsFixed(2)}'
                                : '${currentVal.toStringAsFixed(1)}%',
                            style: GoogleFonts.inter(
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: Colors.grey.shade800,
                              letterSpacing: -0.5,
                            ),
                          ),
                          Row(
                            mainAxisSize: MainAxisSize.min,
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
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: isUp ? Colors.green : Colors.red,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
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
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: isTablet ? 13 : 14,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          unit == '€'
                              ? '€${currentVal.toStringAsFixed(2)}'
                              : '${currentVal.toStringAsFixed(1)}%',
                          style: GoogleFonts.inter(
                            fontSize: isTablet ? 24 : 28,
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
          SizedBox(height: isMobile ? 20 : (isTablet ? 32 : 48)),
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
                      reservedSize: isMobile ? 34 : 40,
                      getTitlesWidget: (v, meta) {
                        return Text(
                          v.toInt().toString(),
                          style: GoogleFonts.inter(
                            color: Colors.grey[400],
                            fontSize: isMobile ? 9 : 10,
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
                        radius: isMobile ? 3 : 4,
                        color: Colors.grey.shade700,
                        strokeWidth: isMobile ? 1.5 : 2,
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
          SizedBox(height: isMobile ? 12 : 24),
        ],
      ),
    );
  }
}
