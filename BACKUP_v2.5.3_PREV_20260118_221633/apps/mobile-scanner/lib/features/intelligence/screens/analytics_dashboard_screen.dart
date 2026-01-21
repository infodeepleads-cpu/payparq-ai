import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:math' as math;
import '../../../../theme.dart';

class AnalyticsDashboardScreen extends StatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  State<AnalyticsDashboardScreen> createState() =>
      _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends State<AnalyticsDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(48),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
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
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.download_outlined, size: 18),
                  label: const Text('Export Data'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    side: const BorderSide(color: AppTheme.border),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(4)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 48),

            // Row 1: Key Performance Metrics
            _buildMetricGrid(),
            const SizedBox(height: 48),

            // Row 2: Main Charts
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 2,
                  child: _buildChartContainer(
                    title: 'Daily Visit Trend',
                    subtitle: 'Hourly vehicle influx monitoring',
                    child: _buildLineChart(),
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  flex: 1,
                  child: _buildChartContainer(
                    title: 'Utilization Rate',
                    subtitle: 'Daily occupancy distribution',
                    child: _buildBarChart(),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 32),

            // Row 3: Revenue Analytics & Risk
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: _buildChartContainer(
                    title: 'Revenue Attribution',
                    subtitle: 'Income source breakdown',
                    child: _buildPieChart(),
                  ),
                ),
                const SizedBox(width: 32),
                Expanded(
                  child: _buildChartContainer(
                    title: 'Neural Risk Assessment',
                    subtitle: 'AI-detected violation probability',
                    child: _buildRadarChart(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      crossAxisSpacing: 24,
      mainAxisSpacing: 24,
      childAspectRatio: 1.6,
      children: [
        _buildMetricCard(
            'Total Revenue', '€14,280.50', '+12.5%', Icons.attach_money),
        _buildMetricCard(
            'Avg Utilization', '78.2%', '+4.1%', Icons.pie_chart_outline),
        _buildMetricCard(
            'Active Sessions', '142', '+18', Icons.local_parking_outlined),
        _buildMetricCard(
            'Peak Influx', '42 veh/h', '-2.4%', Icons.speed_outlined),
      ],
    );
  }

  Widget _buildMetricCard(
      String title, String value, String trend, IconData icon) {
    final bool isPositive = trend.startsWith('+');
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(4)),
                child: Icon(icon, color: Colors.white, size: 18),
              ),
              Text(
                trend,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: isPositive ? Colors.green[600] : Colors.red[600],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title,
                  style: GoogleFonts.inter(
                      fontSize: 12,
                      color: AppTheme.textSecondary,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.5)),
              const SizedBox(height: 4),
              Text(value,
                  style: GoogleFonts.inter(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                      letterSpacing: -0.5)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildChartContainer(
      {required String title,
      required String subtitle,
      required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(32),
      height: 420,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: GoogleFonts.inter(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.black)),
          Text(subtitle,
              style: GoogleFonts.inter(
                  fontSize: 12, color: AppTheme.textSecondary)),
          const SizedBox(height: 48),
          Expanded(child: child),
        ],
      ),
    );
  }

  Widget _buildLineChart() {
    return LineChart(
      LineChartData(
        gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (v) =>
                FlLine(color: AppTheme.surface, strokeWidth: 1)),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 30,
                  getTitlesWidget: (v, meta) {
                    if (v % 4 != 0) return const SizedBox();
                    return Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text('${v.toInt()}h',
                            style: const TextStyle(
                                color: Colors.grey, fontSize: 10)));
                  })),
          leftTitles: AxisTitles(
              sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 40,
                  getTitlesWidget: (v, meta) {
                    return Text(v.toInt().toString(),
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 10));
                  })),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(
                24,
                (i) =>
                    FlSpot(i.toDouble(), 20 + math.Random().nextDouble() * 60)),
            isCurved: true,
            color: Colors.black,
            barWidth: 3,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              color: Colors.black.withOpacity(0.05),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart() {
    return BarChart(
      BarChartData(
        barGroups: List.generate(
            7,
            (i) => BarChartGroupData(
                  x: i,
                  barRods: [
                    BarChartRodData(
                      toY: 40 + math.Random().nextDouble() * 50,
                      color: Colors.black,
                      width: 12,
                      borderRadius: BorderRadius.circular(2),
                      backDrawRodData: BackgroundBarChartRodData(
                          show: true, toY: 100, color: AppTheme.surface),
                    ),
                  ],
                )),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (v, meta) {
                    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                    return Padding(
                        padding: const EdgeInsets.only(top: 8.0),
                        child: Text(days[v.toInt()],
                            style: const TextStyle(
                                color: Colors.grey, fontSize: 10)));
                  })),
          leftTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
      ),
    );
  }

  Widget _buildPieChart() {
    return PieChart(
      PieChartData(
        sectionsSpace: 2,
        centerSpaceRadius: 50,
        sections: [
          PieChartSectionData(
              value: 45,
              title: 'GUEST',
              color: Colors.black,
              radius: 40,
              titleStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white)),
          PieChartSectionData(
              value: 35,
              title: 'SUBS',
              color: Colors.grey[800],
              radius: 40,
              titleStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.white)),
          PieChartSectionData(
              value: 20,
              title: 'MISC',
              color: Colors.grey[300],
              radius: 40,
              titleStyle: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: Colors.black)),
        ],
      ),
    );
  }

  Widget _buildRadarChart() {
    return RadarChart(
      RadarChartData(
        dataSets: [
          RadarDataSet(
            fillColor: Colors.black.withOpacity(0.1),
            borderColor: Colors.black,
            entryRadius: 2,
            dataEntries: [
              const RadarEntry(value: 80),
              const RadarEntry(value: 90),
              const RadarEntry(value: 70),
              const RadarEntry(value: 85),
              const RadarEntry(value: 95)
            ],
          ),
        ],
        radarBackgroundColor: Colors.transparent,
        borderData: FlBorderData(show: false),
        radarBorderData: const BorderSide(color: AppTheme.border),
        tickBorderData: const BorderSide(color: AppTheme.border),
        gridBorderData: const BorderSide(color: AppTheme.border),
        getTitle: (index, angle) {
          const titles = ['Risk', 'Fraud', 'Churn', 'Safety', 'Growth'];
          return RadarChartTitle(text: titles[index], angle: angle);
        },
        titleTextStyle: const TextStyle(color: Colors.grey, fontSize: 10),
      ),
    );
  }
}
