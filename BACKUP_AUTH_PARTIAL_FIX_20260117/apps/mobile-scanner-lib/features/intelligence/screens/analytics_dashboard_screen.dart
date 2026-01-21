import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:math' as math;
import '../../../../theme.dart';

class AnalyticsDashboardScreen extends StatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  State<AnalyticsDashboardScreen> createState() => _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends State<AnalyticsDashboardScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.lightBackground,
      appBar: AppBar(
        title: Text('Intelligence / Analytics', 
          style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(Icons.download_outlined, color: Colors.grey),
            tooltip: 'Export Data',
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Key Performance Metrics
            _buildMetricGrid(),
            const SizedBox(height: 32),
            
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
                const SizedBox(width: 24),
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
                const SizedBox(width: 24),
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
      crossAxisSpacing: 20,
      mainAxisSpacing: 20,
      childAspectRatio: 1.8,
      children: [
        _buildMetricCard('Total Revenue', '€14,280.50', '+12.5%', Icons.attach_money, Colors.green),
        _buildMetricCard('Avg Utilization', '78.2%', '+4.1%', Icons.pie_chart_outline, AppTheme.primary),
        _buildMetricCard('Active Sessions', '142', '+18', Icons.local_parking, Colors.blue),
        _buildMetricCard('Peak Hour Influx', '42 veh/h', '-2.4%', Icons.speed, Colors.orange),
      ],
    );
  }

  Widget _buildMetricCard(String title, String value, String trend, IconData icon, Color color) {
    final bool isPositive = trend.startsWith('+');
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE5E7EB)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
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
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                child: Icon(icon, color: color, size: 20),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isPositive ? Colors.green[50] : Colors.red[50],
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(trend, style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: isPositive ? Colors.green[700] : Colors.red[700])),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500], fontWeight: FontWeight.w500)),
          Text(value, style: GoogleFonts.inter(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black)),
        ],
      ),
    );
  }

  Widget _buildChartContainer({required String title, required String subtitle, required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(24),
      height: 380,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.black)),
          Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
          const SizedBox(height: 32),
          Expanded(child: child),
        ],
      ),
    );
  }

  Widget _buildLineChart() {
    return LineChart(
      LineChartData(
        gridData: FlGridData(show: true, drawVerticalLine: false, getDrawingHorizontalLine: (v) => FlLine(color: Colors.grey[100]!, strokeWidth: 1)),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 30, getTitlesWidget: (v, meta) {
            if (v % 4 != 0) return const SizedBox();
            return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text('${v.toInt()}h', style: const TextStyle(color: Colors.grey, fontSize: 10)));
          })),
          leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, reservedSize: 40, getTitlesWidget: (v, meta) {
            return Text(v.toInt().toString(), style: const TextStyle(color: Colors.grey, fontSize: 10));
          })),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: List.generate(24, (i) => FlSpot(i.toDouble(), 20 + math.Random().nextDouble() * 60)),
            isCurved: true,
            color: AppTheme.primary,
            barWidth: 4,
            isStrokeCapRound: true,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                colors: [AppTheme.primary.withOpacity(0.15), AppTheme.primary.withOpacity(0)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBarChart() {
    return BarChart(
      BarChartData(
        barGroups: List.generate(7, (i) => BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: 40 + math.Random().nextDouble() * 50,
              color: AppTheme.primary,
              width: 16,
              borderRadius: BorderRadius.circular(4),
              backDrawRodData: BackgroundBarChartRodData(show: true, toY: 100, color: Colors.grey[100]),
            ),
          ],
        )),
        titlesData: FlTitlesData(
          bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, meta) {
            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
            return Padding(padding: const EdgeInsets.only(top: 8.0), child: Text(days[v.toInt()], style: const TextStyle(color: Colors.grey, fontSize: 10)));
          })),
          leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        borderData: FlBorderData(show: false),
        gridData: const FlGridData(show: false),
      ),
    );
  }

  Widget _buildPieChart() {
    return PieChart(
      PieChartData(
        sectionsSpace: 4,
        centerSpaceRadius: 40,
        sections: [
          PieChartSectionData(value: 45, title: 'Guest', color: AppTheme.primary, radius: 50, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
          PieChartSectionData(value: 35, title: 'Subs', color: Colors.blue[400], radius: 50, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
          PieChartSectionData(value: 20, title: 'Other', color: Colors.grey[300], radius: 50, titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildRadarChart() {
    return RadarChart(
      RadarChartData(
        dataSets: [
          RadarDataSet(
            fillColor: AppTheme.primary.withOpacity(0.2),
            borderColor: AppTheme.primary,
            entryRadius: 2,
            dataEntries: [const RadarEntry(value: 80), const RadarEntry(value: 90), const RadarEntry(value: 70), const RadarEntry(value: 85), const RadarEntry(value: 95)],
          ),
        ],
        radarBackgroundColor: Colors.transparent,
        borderData: FlBorderData(show: false),
        radarBorderData: BorderSide(color: Colors.grey[200]!),
        tickBorderData: BorderSide(color: Colors.grey[200]!),
        gridBorderData: BorderSide(color: Colors.grey[200]!),
        getTitle: (index, angle) {
          const titles = ['Risk', 'Fraud', 'Churn', 'Safety', 'Growth'];
          return RadarChartTitle(text: titles[index], angle: angle);
        },
        titleTextStyle: const TextStyle(color: Colors.grey, fontSize: 10),
      ),
    );
  }
}
