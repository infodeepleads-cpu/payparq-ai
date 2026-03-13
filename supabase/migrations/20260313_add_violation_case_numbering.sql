DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'case_number'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN case_number integer;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'plate_normalized'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN plate_normalized text;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'case_date_local'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN case_date_local date;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'uploaded_by'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN uploaded_by uuid;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'case_location_code'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN case_location_code smallint;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'case_uploader_code'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN case_uploader_code smallint;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'violations'
          AND column_name = 'case_sequence'
    ) THEN
        ALTER TABLE public.violations ADD COLUMN case_sequence smallint;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.violation_case_counters (
    local_day date NOT NULL,
    location_id text NOT NULL,
    uploader_code smallint NOT NULL,
    last_sequence integer NOT NULL DEFAULT 0,
    PRIMARY KEY (local_day, location_id, uploader_code)
);

CREATE INDEX IF NOT EXISTS violations_case_number_idx
    ON public.violations (case_number);

CREATE INDEX IF NOT EXISTS violations_quick_group_idx
    ON public.violations (location_id, plate_normalized, case_date_local);

CREATE UNIQUE INDEX IF NOT EXISTS violations_quick_ticket_one_per_day_idx
    ON public.violations (location_id, plate_normalized, case_date_local)
    WHERE lower(coalesce(violation_type, '')) = 'quick ticket';

CREATE OR REPLACE FUNCTION public.assign_violation_case_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    local_case_day date;
    normalized_plate text;
    loc_display text;
    loc_digits text;
    loc_code integer;
    uploader_code_value integer;
    seq integer;
    existing_case_number integer;
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
        loc_code := right(loc_digits, 3)::integer;
    ELSE
        loc_code := abs(hashtext(coalesce(NEW.location_id::text, '0'))) % 1000;
    END IF;

    uploader_text := coalesce(NEW.uploaded_by::text, 'system');
    uploader_code_value := abs(hashtext(uploader_text)) % 1000;

    INSERT INTO public.violation_case_counters (local_day, location_id, uploader_code, last_sequence)
    VALUES (local_case_day, NEW.location_id::text, uploader_code_value, 1)
    ON CONFLICT (local_day, location_id, uploader_code)
    DO UPDATE SET last_sequence = public.violation_case_counters.last_sequence + 1
    RETURNING last_sequence INTO seq;

    IF seq > 999 THEN
        RAISE EXCEPTION 'Daily case sequence limit reached for this uploader and location';
    END IF;

    NEW.case_location_code := loc_code;
    NEW.case_uploader_code := uploader_code_value;
    NEW.case_sequence := seq;
    NEW.case_number := (loc_code * 1000000) + (uploader_code_value * 1000) + seq;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_violation_case_number ON public.violations;

CREATE TRIGGER trg_assign_violation_case_number
BEFORE INSERT ON public.violations
FOR EACH ROW
EXECUTE FUNCTION public.assign_violation_case_number();
