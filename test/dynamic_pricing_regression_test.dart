import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Dynamic pricing save payload uses only valid floor column names',
      () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('base_floor_monthly_price'),
      isFalse,
      reason:
          'base_floor_monthly_price is an invalid column name and must never be referenced.',
    );
  });

  test('Stripe checkout link generation includes cache buster', () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('timestamp: timestamp') ||
          content.contains("DateTime.now().millisecondsSinceEpoch.toString()"),
      isTrue,
      reason:
          'Stripe link generation must pass a timestamp cache-buster to avoid stale sessions/URLs.',
    );
  });

  test('Daily generated checkout carries exact hourly switch URL payload',
      () async {
    final appConfigFile = File('lib/config/app_config.dart');
    final appConfigContent = await appConfigFile.readAsString();
    final pricingScreenFile = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final pricingScreenContent = await pricingScreenFile.readAsString();

    expect(
      appConfigContent.contains("queryParams['hourly_switch_url']") &&
          pricingScreenContent
              .contains("final hourlySwitchUrl = type == 'daily'") &&
          pricingScreenContent
              .contains("final hourlySwitchUrl = mode == 'daily'") &&
          pricingScreenContent.contains("type: 'hourly'") &&
          pricingScreenContent.contains('hourlySwitchUrl: hourlySwitchUrl,') &&
          pricingScreenContent.contains('timestamp: timestamp,'),
      isTrue,
      reason:
          'Both daily Stripe-link and reservation-link generation must pass the exact app-generated hourly checkout URL so CTA behavior matches Generate Hourly Link.',
    );
  });

  test('Park&Taxi checkout uses daily type path and dedicated query flag',
      () async {
    final appConfigFile = File('lib/config/app_config.dart');
    final appConfigContent = await appConfigFile.readAsString();
    final pricingScreenFile = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final pricingScreenContent = await pricingScreenFile.readAsString();

    expect(
      appConfigContent.contains("if (parkTaxiMode) 'park_taxi': '1'") &&
          pricingScreenContent
              .contains("final bool isParkTaxi = type == 'park_taxi';") &&
          pricingScreenContent
              .contains("final checkoutType = isParkTaxi ? 'daily' : type;") &&
          pricingScreenContent.contains("parkTaxiMode: isParkTaxi,"),
      isTrue,
      reason:
          'Park&Taxi links must keep daily checkout semantics while carrying a dedicated park_taxi flag.',
    );
  });

  test('Dynamic pricing update avoids singular coercion on update response',
      () async {
    final file = File(
      'lib/features/intelligence/repositories/dynamic_pricing_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('_firstUpdatedRow') &&
          !content.contains('.maybeSingle()'),
      isTrue,
      reason:
          'Pricing updates must not use maybeSingle on update responses to avoid PostgREST PGRST116 406 errors.',
    );
  });

  test('Dynamic pricing save updates selected location state locally',
      () async {
    final file = File(
      'lib/features/intelligence/screens/dynamic_pricing_screen.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('data.addAll(pricePayload);') &&
          content.contains('data.addAll(flagsPayload);') &&
          content.contains('_locations[index] = data;') &&
          content.contains('_selectedLocation = data;'),
      isTrue,
      reason:
          'Saving pricing must immediately update the selected location and in-memory list so the screen reflects the latest values without waiting for a refetch.',
    );
  });

  test('Instructions location fetch avoids misspelled mode column', () async {
    final file = File('lib/screens/instructions_screen.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
        'verification_metadata, enforcement_pricing_mode, enforcmetn_pricing_mode',
      ),
      isFalse,
      reason:
          'Instructions DB fetch must not request misspelled columns that may not exist, or mode refresh can silently fail.',
    );
  });

  test('Checkout pricing applies floor and ceiling for QR default pricing',
      () async {
    final file = File('supabase/functions/create-checkout/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('rate_per_hour_floor,rate_per_hour_ceiling') &&
          content.contains('base_price_daily_floor,base_price_daily_ceiling') &&
          content.contains('if (floor > 0 && euro < floor) euro = floor;') &&
          content
              .contains('if (ceiling > 0 && euro > ceiling) euro = ceiling;'),
      isTrue,
      reason:
          'QR fallback pricing in create-checkout must respect min (floor) and max (ceiling) so it matches Stripe link pricing behavior.',
    );
  });

  test(
      'Checkout keeps reciprocal daily/hourly CTA in submit text and launcher page',
      () async {
    final file = File('supabase/functions/create-checkout/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('hourlySwitchUrl.searchParams.set("type", "hourly");') &&
          content.contains('hourlySwitchUrlParam') &&
          content.contains('resolvedHourlySwitchUrl') &&
          content.contains('new URL(hourlySwitchUrlParam)') &&
          content
              .contains('dailySwitchUrl.searchParams.set("type", "daily");') &&
          content.contains('dailySwitchUrlParam') &&
          content.contains('resolvedDailySwitchUrl') &&
          content.contains('new URL(dailySwitchUrlParam)') &&
          content.contains('const requestUrl = new URL(req.url);') &&
          content.contains('requestUrl.protocol = "https:";') &&
          content.contains(
              'const switchLocationIdentifier = displayId || locationId;') &&
          content.contains(
              'new URL("/functions/v1/create-checkout", requestUrl.origin);') &&
          content.contains('checkoutText.needHourly') &&
          content.contains('checkoutText.openHourlyCheckout') &&
          content.contains('checkoutText.needDaily') &&
          content.contains('checkoutText.openDailyCheckout') &&
          content.contains('parseOptionalBooleanValue(body["launcher"])') &&
          content.contains(
              r'const hourlySwitchLinkMarkdown = `[${checkoutText.openHourlyCheckout}](${resolvedHourlySwitchUrl})`;') &&
          content.contains(
              r'const dailySwitchLinkMarkdown = `[${checkoutText.openDailyCheckout}](${resolvedDailySwitchUrl})`;') &&
          content.contains(
              'const nonReservationDescription = type === "hourly"') &&
          content.contains('checkoutText.dailyFooterInstruction') &&
          content.contains('checkoutText.hourlyFooterInstruction') &&
          content.contains(
              'const reservationDescriptionWithSwitch = reservationDescription;') &&
          content.contains('const launcherSwitchLabel = type === "daily"') &&
          content.contains('const launcherDescription = isReservationFlow') &&
          content
              .contains('if (req.method === "GET" && launcherRequested) {') &&
          content.contains(
              r'<a class="switch-link" href="${escapeHtml(launcherSwitchUrl)}">') &&
          content.contains('phone_number_collection: {') &&
          content.contains('submit: {') &&
          content.contains('hourlyDailyCtaMessage') &&
          content.contains('type === "hourly"'),
      isTrue,
      reason:
          'Daily and hourly flows must keep the reciprocal CTA in submit text and expose the opposite-mode link on the launcher page instead of leaking raw URLs into the Stripe description.',
    );
  });

  test('Checkout function supports localized Stripe text for key locales',
      () async {
    final file = File('supabase/functions/create-checkout/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('resolveCheckoutLocale') &&
          content.contains('checkoutTextByLocale') &&
          content.contains('supportedCheckoutLocales') &&
          content.contains('locale: checkoutLocale') &&
          content.contains('dailyFooterInstruction') &&
          content.contains('hourlyFooterInstruction') &&
          content.contains(
              'Za dnevnu kartu pritisnite na link u podnožju stranice.') &&
          content.contains(
              'Za satni obračun pritisnite na link u podnožju stranice.') &&
          content.contains('hr: {') &&
          content.contains('de: {') &&
          content.contains('ru: {') &&
          content.contains('pl: {') &&
          content.contains('es: {') &&
          content.contains('terms_of_service_acceptance'),
      isTrue,
      reason:
          'create-checkout must support locale resolution and translated checkout text for hr/de/ru/pl/es with Stripe locale forwarding.',
    );
  });

  test('Generated checkout URLs use clamped dynamic pricing values', () async {
    final file =
        File('lib/features/intelligence/screens/dynamic_pricing_screen.dart');
    final content = await file.readAsString();

    expect(
      content.contains("price: _priceForType('hourly'),") &&
          content.contains("price: _priceForType('daily'),") &&
          content.contains('final totalPrice = unitPrice * quantity;') &&
          content.contains('price: totalPrice,') &&
          content.contains("final floorKey = switch (type) {") &&
          content.contains("final ceilingKey = switch (type) {") &&
          content.contains("'rate_per_hour_floor'") &&
          content.contains("'base_price_daily_floor'") &&
          content.contains("'rate_per_hour_ceiling'") &&
          content.contains("'base_price_daily_ceiling'"),
      isTrue,
      reason:
          'Generated checkout URLs must use the price helper that applies floor and ceiling clamps so linked payment flows match the configured pricing rules.',
    );
  });

  test('Scoped location selection avoids falling back to global stale keys',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
            "prefs.getString(_selectedLocationDisplayKeyFor(userId)) ??",
          ) ||
          content.contains(
            "prefs.getString(_selectedLocationUuidKeyFor(userId)) ??",
          ) ||
          content.contains(
            "prefs?.getString(_selectedLocationDisplayKeyFor(user.id)) ??",
          ) ||
          content.contains(
            "prefs?.getString(_selectedLocationUuidKeyFor(user.id)) ??",
          ),
      isFalse,
      reason:
          'Logged-in users must resolve lot selection from user-scoped keys only so stale global SharedPreferences values cannot leak across accounts or roles.',
    );
  });

  test('Selected location starts empty until live rows validate it', () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
            'final selectedLocationIdProvider = StateProvider<String?>((ref) => null);',
          ) &&
          !content.contains('_is_warm_initial') &&
          !content.contains('emit(initialList);'),
      isTrue,
      reason:
          'Lot selection must not prefill from stale warm cache before live accessible rows are loaded.',
    );
  });

  test('Live current lot selection wins over stale saved selection', () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
            'final currentSelectedDisplayId = ref.watch(selectedLocationIdProvider);',
          ) &&
          content.contains('final bool currentSelectedValid =') &&
          content.contains('if (currentSelectedValid) {') &&
          content.contains(
            'if (savedId != currentSelectedId || savedUuid != currentUuid) {',
          ),
      isTrue,
      reason:
          'Manual lot switches must keep the currently selected live lot instead of reverting to an older saved preference.',
    );
  });

  test('Upload form re-resolves and clears stale location display', () async {
    final file = File('lib/features/enforcement/screens/upload_case_form.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              'final selection = await ref.read(activeLocationSelectionProvider.future);') &&
          content.contains(
              'if (!selection.isValidated || selectedLocId == null) {') &&
          content.contains(
              "selection.isValidated ? selection.displayId ?? '' : '';") &&
          content.contains(
              "next.value?.isValidated == true ? next.value?.displayId ?? '' : '';"),
      isTrue,
      reason:
          'Upload must show the validated active location and reject stale unresolved selections so old lot IDs do not survive into a submission.',
    );
  });

  test('Daily enforcement mode uses 24x hourly fine before daily value',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();
    final dailyBlockStart = content.indexOf('if (mode == \'daily\') {');
    final hourlyDailyCalcIndex =
        content.indexOf('if (stripeHourly > 0) return stripeHourly * 24;');
    final dailyUnitFallbackIndex =
        content.indexOf('if (stripeDaily > 0) return stripeDaily;');

    expect(
      content.contains('if (mode == \'daily\')') &&
          hourlyDailyCalcIndex > dailyBlockStart &&
          dailyUnitFallbackIndex > hourlyDailyCalcIndex,
      isTrue,
      reason:
          'Case fines in daily pricing mode must calculate a full day from hourly rate (24h) before any daily fallback.',
    );
  });

  test('Enforcement fine mode resolves from column typo and metadata fallback',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('row[\'enforcmetn_pricing_mode\']') &&
          content.contains('metadata?[\'enforcement_pricing_mode\']') &&
          content.contains('metadata?[\'enforcmetn_pricing_mode\']') &&
          content.contains('enforcement_pricing_mode, enforcmetn_pricing_mode'),
      isTrue,
      reason:
          'Quick Ticket mode must still resolve as daily even if DB has legacy typo column or metadata-only mode, otherwise fines fall back to 1-hour value.',
    );
  });

  test('Hourly enforcement mode uses daily ticket amount before hourly value',
      () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();
    final hourlyBranchPattern = RegExp(
      r'\}\s+else\s+\{\s+if \(stripeDaily > 0\) return stripeDaily;\s+if \(stripeHourly > 0\) return stripeHourly \* 24;',
      multiLine: true,
    );

    expect(
      hourlyBranchPattern.hasMatch(content),
      isTrue,
      reason:
          'When enforcement mode is hourly, ticket amount must use current daily ticket amount first, not raw 1-hour rate.',
    );
  });

  test('Enforcement ticket pricing uses Stripe-style clamp inputs', () async {
    final file = File(
      'lib/features/enforcement/repositories/enforcement_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('base_price_daily_ceiling') &&
          content.contains('rate_per_hour_ceiling') &&
          content.contains('_resolveStripeUnitPrice('),
      isTrue,
      reason:
          'Cases pricing must use the same clamp inputs and calculation shape as Stripe link pricing source of truth.',
    );
  });

  test('Quick ticket duplicate constraint is recognized and mapped', () async {
    final file = File(
      'lib/features/enforcement/providers/enforcement_controller.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('_isQuickTicketDuplicateError') &&
          content.contains('23505') &&
          content.contains('violations_quick_ticket_one_per_day_idx') &&
          content.contains('violations__quickticket_one_per_day_idx') &&
          content.contains('plate_normalized') &&
          content.contains('case_date_local'),
      isTrue,
      reason:
          'Quick ticket duplicate DB violations must be detected explicitly so users get a predictable message instead of raw Postgres errors.',
    );
  });

  test('Quick action duplicate emits stable user-facing message', () async {
    final file = File(
      'lib/features/enforcement/providers/enforcement_controller.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains(
        'Quick ticket already exists today for this plate at this location.',
      ),
      isTrue,
      reason:
          'Duplicate quick-ticket attempts should return a stable message in APK instead of exposing SQL constraint details.',
    );
  });

  test('Error mapper normalizes quick-ticket duplicate postgres payload',
      () async {
    final file = File('lib/services/error_mapper.dart');
    final content = await file.readAsString();

    expect(
      content.contains('_isQuickTicketDuplicateError') &&
          content.contains('_isQuickTicketDuplicatePostgrest') &&
          content.contains('violations_quick_ticket_one_per_day_idx') &&
          content.contains(
              'Quick ticket already exists today for this plate at this location.'),
      isTrue,
      reason:
          'ErrorMapper must normalize 23505 quick-ticket duplicate errors globally so raw Postgres text never reaches the snackbar.',
    );
  });

  test('RLS migration allows manager and officer location access for permits',
      () async {
    final file = File(
      'supabase/migrations/20260319_fix_manager_officer_permit_rls.sql',
    );
    final content = await file.readAsString();

    expect(
      content.contains("IF role_norm IN ('manager', 'officer') THEN") &&
          content.contains("auth.jwt() ->> 'role'") &&
          content.contains('FROM public.profiles p') &&
          content.contains(
              'CREATE POLICY parking_permits_insert_authenticated_location_scope') &&
          content.contains(
              'WITH CHECK (public.can_access_location(location_id::text));') &&
          content.contains(
              'CREATE POLICY parking_permits_select_authenticated_location_scope'),
      isTrue,
      reason:
          'Manager/officer permit create and read must be scoped by can_access_location to avoid 42501 and empty manager data.',
    );
  });

  test('RLS migration scopes session visibility with same location access rule',
      () async {
    final file = File(
      'supabase/migrations/20260319_fix_manager_officer_permit_rls.sql',
    );
    final content = await file.readAsString();

    expect(
      content.contains(
              'CREATE POLICY parking_sessions_select_authenticated_location_scope') &&
          content.contains(
              'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parking_permits TO authenticated;') &&
          content.contains(
              'USING (public.can_access_location(location_id::text));'),
      isTrue,
      reason:
          'Manager home checkout visibility must use the same location scope as permits.',
    );
  });

  test('Manager/officer dashboard stream falls back to RLS scoped items',
      () async {
    final file =
        File('lib/features/management/repositories/parking_repository.dart');
    final content = await file.readAsString();

    expect(
      content.contains('shouldFallbackToRlsScopedItems') &&
          content.contains(
              '(isManager || isOfficer) && filtered.isEmpty && items.isNotEmpty'),
      isTrue,
      reason:
          'Manager and officer should still see RLS-authorized sessions/permits even when client-side location cache is stale.',
    );
  });

  test('Location selection persists display id and uuid together', () async {
    final authFile = File('lib/logic/providers/auth_providers.dart');
    final scaffoldFile = File('lib/main_scaffold.dart');
    final controllerFile =
        File('lib/features/management/providers/locations_controller.dart');
    final authContent = await authFile.readAsString();
    final scaffoldContent = await scaffoldFile.readAsString();
    final controllerContent = await controllerFile.readAsString();

    expect(
      authContent
              .contains('Future<void> persistSelectedLocationPreference({') &&
          authContent.contains('_selectedLocationDisplayKeyFor(userId)') &&
          authContent.contains('_selectedLocationUuidKeyFor(userId)') &&
          scaffoldContent
              .contains('await _persistSelectedLocation(id, uuid: uuid);') &&
          controllerContent
              .contains('await persistSelectedLocationPreference('),
      isTrue,
      reason:
          'Location selection must persist both display_id and uuid everywhere so stale preference pairs cannot hide data after reload.',
    );
  });

  test('Sessions and cases resolve display ids to uuids before filtering',
      () async {
    final file =
        File('lib/features/management/repositories/parking_repository.dart');
    final content = await file.readAsString();

    expect(
      content.contains('final sessionsStreamProvider =') &&
          content.contains(
              'repo.getSessionsStream(locationId: resolvedScopedUuid)') &&
          content.contains(
              'repo.getViolationsStream(locationId: resolvedActiveUuid)') &&
          content.contains('_uuidForDisplayId(locs, scopedDisplayId)') &&
          content.contains('_uuidForDisplayId(locs, activeDisplayId)'),
      isTrue,
      reason:
          'Sessions and cases must resolve selected display ids to live location uuids instead of dropping into stale cached-only results.',
    );
  });

  test('Web reset clears stored location selection state', () async {
    final file = File('web/index.html');
    final content = await file.readAsString();

    expect(
      content.contains('var clearStoredLocationSelection = function () {') &&
          content
              .contains("key.indexOf('selected_location_display_id') !== -1") &&
          content.contains("key.indexOf('selected_location_uuid') !== -1") &&
          content.contains('clearStoredLocationSelection();'),
      isTrue,
      reason:
          'sw_reset must clear persisted location selection on web so stale browser state cannot survive a hard refresh.',
    );
  });

  test(
      'Pricing fetch includes admin profile location fallback and id/display matching',
      () async {
    final file = File(
      'lib/features/intelligence/repositories/dynamic_pricing_repository.dart',
    );
    final content = await file.readAsString();

    expect(
      content.contains('final normalizedRole = _normalizeRole(role);') &&
          content.contains(
              'if (locationId != null && locationId.isNotEmpty) locationId,') &&
          content.contains("clauses.add('id.eq.\$value');") &&
          content.contains("clauses.add('display_id.eq.\$value');"),
      isTrue,
      reason:
          'Pricing page must include profile.location_id fallback for admins and query both uuid/display_id so assigned admins can still load pricing data.',
    );
  });

  test('Officer sidebar keeps permits and pricing hidden', () async {
    final file = File('lib/main_scaffold.dart');
    final content = await file.readAsString();

    expect(
      content.contains("return [0, 1, 2, 8, 9].contains(index);"),
      isTrue,
      reason:
          'Officer role should see home data but should not have direct permits/pricing tab access.',
    );
  });

  test('Scaffold resets location selector when auth session changes', () async {
    final file = File('lib/main_scaffold.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              'ProviderSubscription<dynamic>? _authStateSubscription;') &&
          content.contains('String? _activeAuthSessionKey;') &&
          content
              .contains('String _sessionKeyForSession(Session? session) {') &&
          content.contains('ref.invalidate(availableLocationsProvider);') &&
          content
              .contains('await ref.read(availableLocationsProvider.future);') &&
          content.contains('ref.listenManual(authStateProvider, (_, next) {') &&
          content.contains(
              '_handleAuthSessionChanged(next.value, force: true);') &&
          content.contains('_activeAuthSessionKey == nextSessionKey') &&
          content.contains('_resetAuthScopedState(') &&
          content.contains("nextSessionKey: 'signed_out_local'") &&
          content.contains(
              "'header-location-\${_activeAuthUserId ?? 'anon'}-\${_activeAuthSessionKey ?? 'sessionless'}-\$currentValue-\${uniqueLocs.length}'") &&
          !content.contains('ref.invalidate(authStateProvider);'),
      isTrue,
      reason:
          'After logout/login, the scaffold must reset by session identity, refresh live locations before rehydrating selection, and must not manually invalidate the auth stream before sign-out so same-user re-login rebuilds the lot selector reliably.',
    );
  });

  test('Create-officer allows lot-owner admin fallback for manager creation',
      () async {
    final file = File('supabase/functions/create-officer/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('function roleFromMetadata(') &&
          content.contains('function ownsAllRequestedLocations(') &&
          content.contains('targetRole === "manager"') &&
          content.contains(
              'canCreateTargetRole = await ownsAllRequestedLocations(') &&
          content.contains(
              'normalizeRole(callerProfile?.role ?? roleFromMetadata(callerUserData.user))'),
      isTrue,
      reason:
          'Manager creation must work for admins with owned existing lots even when profile role is stale, while preserving backend permission checks.',
    );
  });

  test(
      'Create-officer persists profile location display metadata for admin login',
      () async {
    final file = File('supabase/functions/create-officer/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains(
              'if (locationId) profilePayload.location_id = locationId;') &&
          content.contains(
              'profilePayload.location_display_id = primaryLocation.display_id;') &&
          content
              .contains('profilePayload.location_name = primaryLocation.name;'),
      isTrue,
      reason:
          'Admin and manager login hydration must keep profile location_id, display_id, and name aligned with auth metadata so the lot selector does not go empty or widen unexpectedly after refresh.',
    );
  });

  test(
      'Active selection restores from user-scoped SharedPreferences after live fetch',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains('final selectedLocationIdProvider') &&
          content.contains(
              'final currentSelectedDisplayId = ref.watch(selectedLocationIdProvider);') &&
          content.contains('_selectedLocationDisplayKeyFor(') &&
          !content.contains("prefs.getString('selected_location_display_id')"),
      isTrue,
      reason:
          'After live accessible rows load, active selection must restore from user-scoped preferences without relying on stale global cache or metadata prefill.',
    );
  });

  test('Active location selection is validated from live accessible rows',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains('final activeLocationSelectionProvider =') &&
          content.contains(
              'final locations = await ref.watch(availableLocationsProvider.future);') &&
          content.contains(
              '_findLocationByDisplayId(locations, currentSelectedDisplayId)') &&
          content
              .contains('_findLocationByUuid(locations, metadataLocationId)') &&
          content.contains('await _clearPersistedLocationSelection(userId);'),
      isTrue,
      reason:
          'Location selection must validate persisted and metadata candidates against the live accessible location list before the app treats them as upload-safe.',
    );
  });

  test('Restricted location stream does not inject stale selected lot rows',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              "queryId: 'loc_profile_display_\${fallbackDisplayId}_att\$attempt'") &&
          !content.contains(
              "queryId: 'loc_selected_\${selectedDisplayId}_att\$attempt'"),
      isTrue,
      reason:
          'Restricted roles must hydrate accessible locations from owned, assigned, and profile-backed locations only, not from arbitrary stale selected display ids.',
    );
  });

  test(
      'Restricted role location fetch prefers location id over display fallback',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains("if (role == 'super_admin') {") &&
          content.contains(
              'final fallbackLocId = ref.read(userLocationIdProvider) ??') &&
          content.contains('final fallbackDisplayId =') &&
          content
              .contains('(fallbackLocId == null || fallbackLocId.isEmpty)') &&
          content.contains(
              "queryId: 'loc_profile_display_\${fallbackDisplayId}_att\$attempt'"),
      isTrue,
      reason:
          'Restricted roles should only fall back to display_id when no location_id is available, preventing admins from picking up an extra stale lot after refresh while preserving super admin full visibility.',
    );
  });

  test('Location fetch resolves role before choosing access scope', () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains('String? _resolvedRole(String? rawRole) {') &&
          content.contains(
              "queryId: 'profile_role_location_\${user.id}_att\$attempt'") &&
          content
              .contains(".select('role, location_id, location_display_id')") &&
          content.contains(
              "final role = _resolvedRole(profileRow?['role']?.toString()) ??") &&
          content.contains('if (role == null) {'),
      isTrue,
      reason:
          'Location fetching must resolve the user role from profile or metadata before branching into super-admin or restricted access paths, otherwise same-user re-login can transiently collapse into an empty lot selector.',
    );
  });

  test('Auth-driven providers rebuild when auth state changes', () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              'final userProfileProvider = StreamProvider<Map<String, dynamic>?>((ref) {') &&
          content.contains('ref.watch(authStateProvider);') &&
          content.contains('final availableLocationsProvider =') &&
          content
              .contains('StreamProvider<List<Map<String, dynamic>>>((ref) {'),
      isTrue,
      reason:
          'User profile and available locations must rebuild on auth transitions so a signed-out empty stream cannot get stuck across subsequent logins.',
    );
  });

  test(
      'Available locations bootstrap from user-scoped cache before live refetch',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              "final cachedJson = prefs.getString('cached_available_locations_\${user.id}');") &&
          content.contains('if (cachedList.isNotEmpty) {') &&
          content.contains('emit(cachedList);') &&
          !content.contains("if (initialRole == 'super_admin') {"),
      isTrue,
      reason:
          'User-scoped cached locations should bootstrap every returning account, not only super admins, so logout/login and account switching do not briefly collapse the selector to an empty state.',
    );
  });

  test(
      'Available locations suppress transient empty refetches after auth transitions',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains('var hasEmittedNonEmpty = false;') &&
          content.contains('if (value.isNotEmpty) {') &&
          content.contains('hasEmittedNonEmpty = true;') &&
          content.contains('if (uniqueLocations.isEmpty) {') &&
          content
              .contains('attempt < 4 && (!hasEmitted || hasEmittedNonEmpty)') &&
          content.contains(
              'suppressing transient empty result and keeping cached locations.'),
      isTrue,
      reason:
          'Auth transitions must retry suspicious empty location fetches and preserve previously known user-scoped lots instead of replacing them with a false No Lots state.',
    );
  });

  test('User profile warm start does not coerce missing role to officer',
      () async {
    final file = File('lib/logic/providers/auth_providers.dart');
    final content = await file.readAsString();

    expect(
      content.contains(
              "final metadataRole = _resolvedRole(metadata?['role']?.toString());") &&
          content.contains("'role': metadataRole,") &&
          content.contains('final mergedRole =') &&
          !content.contains(
              "'role': _normalizeRole(metadata['role']?.toString()),"),
      isTrue,
      reason:
          'Warm-start profile hydration must preserve an unresolved role as unresolved instead of coercing it to officer, so role-scoped location loading stays correct for super admin, admin, manager, and officer logins.',
    );
  });

  test('Upload and mobile selector require validated active locations',
      () async {
    final uploadFile =
        File('lib/features/enforcement/screens/upload_case_form.dart');
    final scaffoldFile = File('lib/main_scaffold.dart');
    final uploadContent = await uploadFile.readAsString();
    final scaffoldContent = await scaffoldFile.readAsString();

    expect(
      uploadContent.contains(
              'final selection = await ref.read(activeLocationSelectionProvider.future);') &&
          uploadContent.contains(
              'if (!selection.isValidated || selectedLocId == null) {') &&
          scaffoldContent.contains('No validated lots available yet.') &&
          !scaffoldContent.contains('.state = fallbackId;'),
      isTrue,
      reason:
          'Manual upload and selector UX must only proceed with validated live locations and must not promote fallback ids into active upload selection.',
    );
  });

  test('Admin role can access assigned locations in can_access_location RLS',
      () async {
    final file = File(
        'supabase/migrations/20260411_fix_admin_assigned_location_rls.sql');
    final content = await file.readAsString();

    expect(
      content.contains(
              'CREATE OR REPLACE FUNCTION public.can_access_location') &&
          content.contains("role_norm IN ('admin', 'manager', 'officer')") &&
          content.contains('FROM public.officer_assignments oa') &&
          content.contains('FROM public.profiles p'),
      isTrue,
      reason:
          'Assigned admins must be able to read sessions/permits scoped to their locations, not only owner_id locations.',
    );
  });

  test('Stripe connect account creation allows requested country override',
      () async {
    final file = File('supabase/functions/create-connect-account/index.ts');
    final content = await file.readAsString();

    expect(
      content.contains('const desiredCountry =') &&
          content.contains('STRIPE_CONNECT_COUNTRY') &&
          content.contains('STRIPE_CONNECT_BLOCKED_COUNTRIES') &&
          content.contains('function resolveTargetConnectCountry(') &&
          content.contains('const fallbackCountry =') &&
          content.contains('if (blockedConnectCountries.has(normalized))') &&
          content.contains('if (accountCountry !== targetCountry)') &&
          content.contains(
              'const replacement = await createExpressAccount(userId, targetCountry);'),
      isTrue,
      reason:
          'Stripe Connect onboarding should honor requested country, fallback to configured default only when needed, and replace stale accounts created under another country.',
    );
  });

  test('Finance repository retries Stripe functions after JWT refresh',
      () async {
    final file =
        File('lib/features/intelligence/repositories/finance_repository.dart');
    final content = await file.readAsString();

    expect(
      content.contains('_invokeWithSessionRecovery(') &&
          content.contains('_refreshSessionIfPossible()') &&
          content.contains('maxRetries = 3') &&
          content.contains(
              'for (var attempt = 1; attempt <= maxRetries; attempt++)') &&
          content.contains("text.contains('invalid jwt')") &&
          content.contains('if (!_isJwtAuthResponse(response))'),
      isTrue,
      reason:
          'Stripe function calls should retry on JWT auth errors with session refresh and avoid single-shot failures.',
    );
  });

  test('Initial scaffold load avoids delayed broken-state transition',
      () async {
    final file = File('lib/main_scaffold.dart');
    final content = await file.readAsString();

    expect(
      content.contains('bool _initialScreenReady = true;') &&
          content.contains('Future.microtask(_prepareInitialScreen);') &&
          !content.contains(
              "return const _BrandLoadingScreen(key: ValueKey('mobile-preload'));") &&
          !content.contains('Future.delayed(const Duration(milliseconds: 500)'),
      isTrue,
      reason:
          'Startup should not block on deferred module preload before showing scaffold.',
    );
  });

  test('App auth gate keeps black splash until auth state is resolved',
      () async {
    final file = File('lib/main.dart');
    final content = await file.readAsString();

    expect(
      !content.contains('_SleekLoadingBar') &&
          !content.contains('_sessionTransitionHold') &&
          !content.contains('_authStabilizationHold') &&
          content.contains('!kIsWeb &&'),
      isTrue,
      reason:
          'Login transition should remain deterministic: black splash only until auth resolves, without time-bar animations or extra hold-induced lag.',
    );
  });

  test('Master scaffold keeps stable view while profile stream refreshes',
      () async {
    final file = File('lib/main_scaffold.dart');
    final content = await file.readAsString();

    expect(
      content.contains('Map<String, dynamic>? _lastResolvedProfile;') &&
          content.contains(
              'final resolvedProfile = profile ?? _lastResolvedProfile;') &&
          !content.contains(
              'Future<void> _hydrateLocationSelection() async {\n    for (int attempt = 0; attempt < 4; attempt++) {\n      if (!mounted) return;\n      ref.invalidate(userProfileProvider);'),
      isTrue,
      reason:
          'Dashboard should not blink between loading and content when profile stream refreshes.',
    );
  });

  test('Master scaffold skips post-auth profile preload screen', () async {
    final file = File('lib/main_scaffold.dart');
    final content = await file.readAsString();

    expect(
      content.contains('_fallbackProfileFromAuth()') &&
          content.contains(
              'profile ?? _lastResolvedProfile ?? _fallbackProfileFromAuth()') &&
          !content.contains("ValueKey('mobile-profile-loading')"),
      isTrue,
      reason:
          'After auth, dashboard should render immediately without waiting on a full-screen profile preload gate.',
    );
  });

  test('Finance screen treats existing Stripe account as connected state',
      () async {
    final file = File('lib/features/intelligence/screens/finance_screen.dart');
    final content = await file.readAsString();

    expect(
      content.contains('final String accountId =') &&
          content.contains(
              'final bool hasStripeAccount = accountId.isNotEmpty;') &&
          content.contains('hasStripeAccount || onboardingComplete') &&
          content.contains('hasStripeAccount && !onboardingComplete') &&
          content.contains('COMPLETE ONBOARDING') &&
          content.contains('onboardingComplete') &&
          content.contains('_handleOpenDashboard') &&
          content.contains('_handleStripeConnect') &&
          !content.contains(
              ': (isConnected\n                        ? _handleOpenDashboard') &&
          content.contains('AppLifecycleState.resumed') &&
          content.contains('ref.invalidate(userProfileProvider);') &&
          content.contains(
              'if (state == AppLifecycleState.resumed && _refreshProfileOnResume)') &&
          content.contains('_refreshProfileOnResume = true;'),
      isTrue,
      reason:
          'Finance UI should treat an existing Stripe account as connected, but still route incomplete accounts back into onboarding instead of opening a dashboard login link that can fail with a function 500.',
    );
  });

  test('Location upload defers stream invalidation until final save', () async {
    final controllerFile =
        File('lib/features/management/providers/locations_controller.dart');
    final screenFile =
        File('lib/features/management/screens/locations_screen.dart');
    final controllerContent = await controllerFile.readAsString();
    final screenContent = await screenFile.readAsString();

    expect(
      controllerContent.contains('bool invalidateStream = true,') &&
          controllerContent.contains('if (invalidateStream) {') &&
          screenContent.contains('invalidateStream: false,') &&
          screenContent.contains('ref.invalidate(locationsStreamProvider);'),
      isTrue,
      reason:
          'Location edit + photo upload should avoid repeated stream rebuilds mid-upload and refresh once after save.',
    );
  });

  test('Verification upload uses sequential guarded uploads', () async {
    final file =
        File('lib/features/management/providers/verification_controller.dart');
    final content = await file.readAsString();

    expect(
      content.contains('.uploadVerificationFile(') &&
          content.contains('.timeout(const Duration(seconds: 90))') &&
          content.contains(
              'Upload timed out. Please retry with a stronger connection or smaller photos.') &&
          !content.contains('Future.wait(uploadFutures)'),
      isTrue,
      reason:
          'Verification upload should avoid parallel timeout spikes and provide clearer actionable failures.',
    );
  });

  test('Locations photo picker removes hard cap and limits preview rendering',
      () async {
    final file = File('lib/features/management/screens/locations_screen.dart');
    final content = await file.readAsString();

    expect(
      !content.contains('Maximum 12 location photos allowed.') &&
          !content.contains('availableSlots = 12 - currentTotal') &&
          content.contains('const int maxPreviewPhotos = 24;') &&
          content.contains('itemCount: editablePhotoUrls.length > 24') &&
          content.contains('itemCount: newlySelectedPhotos.length > 24'),
      isTrue,
      reason:
          'Locations should allow unrestricted selection while capping preview render count to keep UI smooth.',
    );
  });
}
