-- Lift violation case sequence cap from 999 → 9999 per uploader per location per day.
-- Also upgrades case_number to bigint because the new 10-digit formula
-- (loc*10_000_000 + uploader*10_000 + seq) overflows a 32-bit integer at scale.
-- case_sequence stays as-is (smallint max 32767 — 9999 fits fine).

ALTER TABLE public.violations
  ALTER COLUMN case_number TYPE bigint;

-- Recreate the trigger function with:
--   1. Limit raised to 9999
--   2. Formula updated to accommodate 4-digit sequence (needs bigint)
CREATE OR REPLACE FUNCTION public.assign_violation_case_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    local_case_day date;
    normalized_plate text;
    loc_display text;
    loc_digits text;
    loc_code bigint;
    uploader_code_value bigint;
    seq bigint;
    existing_case_number bigint;
    existing_loc_code smallint;
    existing_uploader_code smallint;
    existing_seq smallint;
    uploader_text text;
BEGIN
    normalized_plate := upper(regexp_replace(coalesce(NEW.plate, ''), '[^A-Za-z0-9]', '', 'g'));
    local_case_day := timezone('Europe/Zagreb', coalesce(NEW.issued_at, now()))::date;
    NEW.plate_normalized := normalized_plate;
    NEW.case_date_local := local_case_day;
    IF NEW.uploaded_by IS NULL THEN
        NEW.uploaded_by := auth.uid();
    END IF;

    -- Dedup: reuse existing case number for the same plate/day/location/type
    IF lower(coalesce(NEW.violation_type, '')) IN ('quick warning', 'quick ticket') THEN
        SELECT v.case_number, v.case_location_code, v.case_uploader_code, v.case_sequence
        INTO existing_case_number, existing_loc_code, existing_uploader_code, existing_seq
        FROM public.violations v
        WHERE v.location_id::text = NEW.location_id::text
          AND v.plate_normalized = normalized_plate
          AND v.case_date_local = local_case_day
          AND lower(coalesce(v.violation_type, '')) IN ('quick warning', 'quick ticket')
          AND v.case_number IS NOT NULL
        ORDER BY v.issued_at DESC NULLS LAST, v.id DESC
        LIMIT 1;

        IF existing_case_number IS NOT NULL THEN
            NEW.case_number := existing_case_number;
            NEW.case_location_code := existing_loc_code;
            NEW.case_uploader_code := existing_uploader_code;
            NEW.case_sequence := existing_seq;
            RETURN NEW;
        END IF;
    END IF;

    SELECT l.display_id::text
    INTO loc_display
    FROM public.locations l
    WHERE l.id::text = NEW.location_id::text
    LIMIT 1;

    loc_digits := regexp_replace(coalesce(loc_display, ''), '\D', '', 'g');
    IF loc_digits <> '' THEN
        loc_code := right(loc_digits, 3)::bigint;
    ELSE
        loc_code := abs(hashtext(coalesce(NEW.location_id::text, '0'))) % 1000;
    END IF;

    uploader_text := coalesce(NEW.uploaded_by::text, 'system');
    uploader_code_value := abs(hashtext(uploader_text)) % 1000;

    INSERT INTO public.violation_case_counters (local_day, location_id, uploader_code, last_sequence)
    VALUES (local_case_day, NEW.location_id::text, uploader_code_value::smallint, 1)
    ON CONFLICT (local_day, location_id, uploader_code)
    DO UPDATE SET last_sequence = public.violation_case_counters.last_sequence + 1
    RETURNING last_sequence INTO seq;

    -- Raised from 999 → 9999
    IF seq > 9999 THEN
        RAISE EXCEPTION 'Daily case sequence limit reached for this uploader and location';
    END IF;

    NEW.case_location_code := loc_code;
    NEW.case_uploader_code := uploader_code_value;
    NEW.case_sequence := seq;
    -- Updated formula: 3-digit loc * 10M + 3-digit uploader * 10K + 4-digit seq
    -- Max value: 999*10_000_000 + 999*10_000 + 9_999 = 9_999_999_999 (fits bigint)
    NEW.case_number := (loc_code * 10000000) + (uploader_code_value * 10000) + seq;
    RETURN NEW;
END;
$$;

-- Trigger definition unchanged — just re-bind to updated function
DROP TRIGGER IF EXISTS trg_assign_violation_case_number ON public.violations;

CREATE TRIGGER trg_assign_violation_case_number
BEFORE INSERT ON public.violations
FOR EACH ROW
EXECUTE FUNCTION public.assign_violation_case_number();
