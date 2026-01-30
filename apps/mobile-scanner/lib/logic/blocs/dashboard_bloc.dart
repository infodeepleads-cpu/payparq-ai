import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';

// --- Events ---
abstract class DashboardEvent extends Equatable {
  @override
  List<Object> get props => [];
}

class LoadDashboardStats extends DashboardEvent {}

// --- States ---
abstract class DashboardState extends Equatable {
  @override
  List<Object> get props => [];
}

class DashboardInitial extends DashboardState {}
class DashboardLoading extends DashboardState {}

class DashboardLoaded extends DashboardState {
  final Map<String, dynamic> stats;
  DashboardLoaded(this.stats);

  @override
  List<Object> get props => [stats];
}

class DashboardError extends DashboardState {
  final String message;
  DashboardError(this.message);
  
  @override
  List<Object> get props => [message];
}

// --- BLoC ---
class DashboardBloc extends Bloc<DashboardEvent, DashboardState> {
  DashboardBloc() : super(DashboardInitial()) {
    on<LoadDashboardStats>(_onLoadStats);
  }

  Future<void> _onLoadStats(LoadDashboardStats event, Emitter<DashboardState> emit) async {
    emit(DashboardLoading());
    try {
      // TODO: Replace with real Supabase calls via Repository
      
      emit(DashboardLoaded(const {
        'activeSessions': 142,
        'revenue24h': 1240.50,
        'violations': 8,
        'occupancy': 85,
      }));
    } catch (e) {
      emit(DashboardError('Failed to load dashboard data'));
    }
  }
}
