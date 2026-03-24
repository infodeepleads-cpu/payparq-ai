'use client';

import Link from "next/link";
import NextImage from "next/image";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

type LocationRow = {
  id: string;
  name: string | null;
  display_id: string | null;
  verification_metadata: Record<string, unknown> | null;
  enforcement_pricing_mode: string | null;
  enforcmetn_pricing_mode?: string | null;
  rate_per_hour: number | null;
  base_price_hourly: number | null;
  base_price_daily: number | null;
  base_price_monthly: number | null;
  rate_per_hour_floor: number | null;
  rate_per_hour_ceiling: number | null;
  base_price_daily_floor: number | null;
  base_price_daily_ceiling: number | null;
  base_price_monthly_floor: number | null;
  base_price_monthly_ceiling: number | null;
};

type ViolationRow = {
  location_id: string | null;
  fine_amount: number | null;
  issued_at: string | null;
  created_at: string | null;
};

type ResourceLocation = {
  id: string;
  name: string;
  displayId: string;
  pricingMode: "hourly" | "daily";
  signPrice: number | null;
  allowPromotionCodes: boolean;
  promotionCodeLabel: string;
  latestFineAmount: number | null;
  locationTemplateUrl: string;
  payableSignTemplateUrl: string;
  checkoutQrUrl: string;
  casesQrUrl: string;
  metadata: Record<string, unknown>;
};

type RoleState = "loading" | "admin" | "manager" | "not_admin";
const englishTermsText =
  "ENG: By entering, you agree to the terms. Price from €0.10 to €10.00/h, mandatory authorization. Operator: Indirektno, OIB: 83928715622, Support: payparq@outlook.com.";
const croatianTermsText =
  "HR: Ulaskom pristajete na uvjete. Cijena od 0.1€ do 10€/h, obvezna autorizacija. Operater: Indirektno, OIB: 83928715622, Podrška: payparq@outlook.com.";
const bilingualTermsText = `${croatianTermsText} ${englishTermsText}`;
type SignWidget = {
  id: string;
  templateUrl: string;
  fileName: string;
  extraText: string;
  guestParkingMinutes: string;
  selectedLocationId: string;
  uploading: boolean;
  downloading: boolean;
  userName?: string;
  userIdNumber?: string;
  userRole?: string;
};
const SIGN_WIDGETS_STORAGE_KEY = "resources-sign-widgets-v1";
const RESOURCES_WIDGET_STATE_BUCKET = "location-verification";
const RESOURCES_WIDGET_STATE_PATH_PREFIX = "resources/widget-state";
type PersistedSignWidget = Pick<
  SignWidget,
  | "id"
  | "templateUrl"
  | "fileName"
  | "extraText"
  | "guestParkingMinutes"
  | "selectedLocationId"
  | "userName"
  | "userIdNumber"
  | "userRole"
>;

function createDefaultWidgets() {
  const now = Date.now();
  return [
    {
      id: `widget-${now}`,
      templateUrl: "",
      fileName: "Safe Parking Eng",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-2`,
      templateUrl: "",
      fileName: "Safe Parking Eng Terms",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-3`,
      templateUrl: "",
      fileName: "Safe Parking 3",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-4`,
      templateUrl: "",
      fileName: "Safe Parking 4",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-5`,
      templateUrl: "",
      fileName: "Safe Parking Guest Parking",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-6`,
      templateUrl: "",
      fileName: "Safe Parking Parking za Goste",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-7`,
      templateUrl: "",
      fileName: "Safe Parking Parking from 0.1 €/h",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-8`,
      templateUrl: "",
      fileName: "Safe Parking Airport Arrow Right",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-9`,
      templateUrl: "",
      fileName: "Safe Parking Airport Arrow Left",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
        id: `widget-${now}-10`,
        templateUrl: "",
        fileName: "Safe Parking High Res Sign",
        extraText: "",
        guestParkingMinutes: "90",
        selectedLocationId: "",
        uploading: false,
        downloading: false,
        userName: "",
        userIdNumber: "",
        userRole: "",
      },
    {
      id: `widget-${now}-11`,
      templateUrl: "",
      fileName: "Safe Parking Safe Arrow Left",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-12`,
      templateUrl: "",
      fileName: "Safe Parking Guest Footer No Title",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-13`,
      templateUrl: "",
      fileName: "Safe Parking 13",
      extraText: "",
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${now}-14`,
      templateUrl: "",
      fileName: "Safe Parking Guest Footer No Title 50x100",
      extraText: bilingualTermsText,
      guestParkingMinutes: "90",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
  ] satisfies SignWidget[];
}

function parsePersistedWidgets(raw: string) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return null;
  }
  return parsed.map((item, index) => {
    const id =
      typeof item?.id === "string" && item.id.trim()
        ? item.id
        : `widget-${Date.now()}-${index + 1}`;
    return {
      id,
      templateUrl: typeof item?.templateUrl === "string" ? item.templateUrl : "",
      fileName: typeof item?.fileName === "string" ? item.fileName : `Safe Parking ${index + 1}`,
      extraText: typeof item?.extraText === "string" ? item.extraText : "",
      guestParkingMinutes:
        typeof item?.guestParkingMinutes === "string" ? item.guestParkingMinutes : "90",
      selectedLocationId: typeof item?.selectedLocationId === "string" ? item.selectedLocationId : "",
      userName: typeof item?.userName === "string" ? item.userName : undefined,
      userIdNumber: typeof item?.userIdNumber === "string" ? item.userIdNumber : undefined,
      userRole: typeof item?.userRole === "string" ? item.userRole : undefined,
      uploading: false,
      downloading: false,
    } satisfies SignWidget;
  });
}

function mergeWithDefaultWidgets(parsedWidgets: SignWidget[]) {
  const defaults = createDefaultWidgets();
  const withDefaults = defaults.map((defaultWidget, index) => {
    const storedWidget = parsedWidgets[index];
    if (!storedWidget) {
      return defaultWidget;
    }
    return {
      ...defaultWidget,
      ...storedWidget,
      guestParkingMinutes: storedWidget.guestParkingMinutes || defaultWidget.guestParkingMinutes,
      userName: storedWidget.userName ?? defaultWidget.userName,
      userIdNumber: storedWidget.userIdNumber ?? defaultWidget.userIdNumber,
      userRole: storedWidget.userRole ?? defaultWidget.userRole,
      uploading: false,
      downloading: false,
    } satisfies SignWidget;
  });
  const extraWidgets = parsedWidgets.slice(defaults.length);
  return [...withDefaults, ...extraWidgets];
}

function serializeWidgetsForPersistence(widgets: SignWidget[]) {
  return widgets.map(
    ({
      id,
      templateUrl,
      fileName,
      extraText,
      guestParkingMinutes,
      selectedLocationId,
      userName,
      userIdNumber,
      userRole,
    }) =>
      ({
        id,
        templateUrl,
        fileName,
        extraText,
        guestParkingMinutes,
        selectedLocationId,
        userName,
        userIdNumber,
        userRole,
      }) satisfies PersistedSignWidget
  );
}

function createInitialWidgets() {
  const defaults = createDefaultWidgets();
  if (typeof window === "undefined") {
    return defaults;
  }
  try {
    const raw = window.localStorage.getItem(SIGN_WIDGETS_STORAGE_KEY);
    if (!raw) {
      return defaults;
    }
    const parsedWidgets = parsePersistedWidgets(raw);
    if (!parsedWidgets || parsedWidgets.length === 0) {
      return defaults;
    }
    return mergeWithDefaultWidgets(parsedWidgets);
  } catch {
    return defaults;
  }
}

function normalizeRole(value: string | null | undefined) {
  const normalized = (value ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");

  if (normalized === "superadmin" || normalized.startsWith("super_admin")) {
    return "super_admin";
  }
  if (normalized.startsWith("admin")) {
    return "admin";
  }
  if (normalized.startsWith("manager")) {
    return "manager";
  }
  if (normalized.startsWith("officer")) {
    return "officer";
  }
  return "officer";
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function resolvePricingMode(source: LocationRow) {
  const metadata =
    source.verification_metadata &&
    typeof source.verification_metadata === "object"
      ? source.verification_metadata
      : null;

  const modeRaw =
    source.enforcement_pricing_mode ??
    source.enforcmetn_pricing_mode ??
    (metadata?.["enforcement_pricing_mode"] as string | undefined) ??
    (metadata?.["enforcmetn_pricing_mode"] as string | undefined) ??
    "hourly";

  return modeRaw.toString().toLowerCase() === "daily" ? "daily" : "hourly";
}

function resolveSignPrice(source: LocationRow, type: "hourly" | "daily") {
  let price =
    type === "daily"
      ? toNumber(source.base_price_daily)
      : toNumber(source.rate_per_hour) > 0
      ? toNumber(source.rate_per_hour)
      : toNumber(source.base_price_hourly);

  const floor =
    type === "daily"
      ? toNumber(source.base_price_daily_floor)
      : toNumber(source.rate_per_hour_floor);
  const ceiling =
    type === "daily"
      ? toNumber(source.base_price_daily_ceiling)
      : toNumber(source.rate_per_hour_ceiling);

  if (floor > 0 && price < floor) {
    price = floor;
  }
  if (ceiling > 0 && price > ceiling) {
    price = ceiling;
  }

  return price > 0 ? price : null;
}

function buildCheckoutQrUrl(params: {
  locationId: string;
  displayId: string;
  type: "hourly" | "daily";
  price: number | null;
  allowPromotionCodes?: boolean;
  promotionCodeLabel?: string;
}) {
  const functionsBase =
    (process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL ?? "").trim().replace(/\/+$/, "") ||
    `${(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://iafjygownkhedereaoxw.supabase.co")
      .trim()
      .replace(/\/+$/, "")}/functions/v1`;
  const query = new URLSearchParams({
    location_id: params.locationId,
    display_id: params.displayId,
    type: params.type,
    t: Date.now().toString(),
  });
  if (params.price !== null) {
    const normalized = params.price < 0 ? 0 : params.price;
    query.set("price", normalized.toFixed(2));
    query.set("amount", normalized.toFixed(2));
    query.set("amount_cents", Math.round(normalized * 100).toString());
  }
  const allowPromotionCodes = params.allowPromotionCodes !== false;
  if (allowPromotionCodes) {
    query.set("allow_promotion_codes", "1");
    const trimmedLabel = (params.promotionCodeLabel ?? "").trim();
    query.set("promotion_code_label", trimmedLabel || "FREE100");
  }
  return `${functionsBase}/create-checkout?${query.toString()}`;
}

function buildCasesQrUrl(displayId: string) {
  const url = new URL("https://www.payparq.com/cases");
  if (displayId) {
    url.searchParams.set("location", displayId);
  }
  return url.toString();
}

function resolveMetadataString(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[]
) {
  for (const key of keys) {
    const raw = metadata?.[key];
    if (typeof raw === "string" && raw.trim()) {
      return raw.trim();
    }
  }
  return "";
}

function resolveMetadataBoolean(
  metadata: Record<string, unknown> | null | undefined,
  keys: string[],
  fallback: boolean
) {
  for (const key of keys) {
    const raw = metadata?.[key];
    if (typeof raw === "boolean") {
      return raw;
    }
    if (typeof raw === "number") {
      return raw !== 0;
    }
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      if (["1", "true", "yes", "on", "enabled"].includes(normalized)) {
        return true;
      }
      if (["0", "false", "no", "off", "disabled"].includes(normalized)) {
        return false;
      }
    }
  }
  return fallback;
}

export default function ResourcesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [roleState, setRoleState] = useState<RoleState>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<ResourceLocation[]>([]);
  const [widgets, setWidgets] = useState<SignWidget[]>(() => createInitialWidgets());
  const [hasLoadedRemoteWidgets, setHasLoadedRemoteWidgets] = useState(false);
  const lastRemoteWidgetsJsonRef = useRef("");
  const remoteSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) {
      setError("Supabase is not configured for this environment.");
      setRoleState("not_admin");
      setLoading(false);
      return;
    }
    const client = supabase;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const { data: authData, error: authError } = await client.auth.getUser();
        if (cancelled) return;
        if (authError || !authData.user) {
          setUser(null);
          setRoleState("not_admin");
          setLoading(false);
          return;
        }

        const currentUser = authData.user;
        setUser(currentUser);

        const { data: profileRow } = await client
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();

        const resolvedRole = normalizeRole(
          (profileRow as { role?: string } | null)?.role ??
            (currentUser.user_metadata?.role as string | undefined) ??
            (currentUser.app_metadata?.role as string | undefined)
        );

        const canManageResources =
          resolvedRole === "admin" ||
          resolvedRole === "super_admin" ||
          resolvedRole === "manager";
        setRoleState(
          resolvedRole === "manager"
            ? "manager"
            : canManageResources
            ? "admin"
            : "not_admin"
        );
        if (!canManageResources) {
          setLoading(false);
          return;
        }

        const widgetStatePath = `${RESOURCES_WIDGET_STATE_PATH_PREFIX}/${currentUser.id}.json`;
        try {
          const { data: remoteWidgetFile, error: remoteWidgetError } = await client.storage
            .from(RESOURCES_WIDGET_STATE_BUCKET)
            .download(widgetStatePath);
          if (!cancelled && !remoteWidgetError && remoteWidgetFile) {
            const rawRemoteWidgets = await remoteWidgetFile.text();
            const parsedRemoteWidgets = parsePersistedWidgets(rawRemoteWidgets);
            if (parsedRemoteWidgets && parsedRemoteWidgets.length > 0) {
              const mergedWidgets = mergeWithDefaultWidgets(parsedRemoteWidgets);
              const serializedWidgets = JSON.stringify(
                serializeWidgetsForPersistence(mergedWidgets)
              );
              lastRemoteWidgetsJsonRef.current = serializedWidgets;
              setWidgets(mergedWidgets);
              if (typeof window !== "undefined") {
                window.localStorage.setItem(SIGN_WIDGETS_STORAGE_KEY, serializedWidgets);
              }
            }
          }
        } finally {
          if (!cancelled) {
            setHasLoadedRemoteWidgets(true);
          }
        }

        const { data: locationRows, error: locationsError } = await client
          .from("locations")
          .select("*")
          .order("name", { ascending: true })
          .limit(250);

        if (cancelled) return;
        if (locationsError) {
          setError(locationsError.message);
          setLocations([]);
          setLoading(false);
          return;
        }

        const { data: violationRows } = await client
          .from("violations")
          .select("location_id,fine_amount,issued_at,created_at")
          .not("fine_amount", "is", null)
          .order("issued_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false, nullsFirst: false })
          .limit(2000);

        const latestFineByLocation = new Map<string, number>();
        for (const row of (violationRows ?? []) as ViolationRow[]) {
          const locationId = row.location_id ?? "";
          const fine = row.fine_amount;
          if (!locationId || typeof fine !== "number") {
            continue;
          }
          if (!latestFineByLocation.has(locationId)) {
            latestFineByLocation.set(locationId, fine);
          }
        }

        const built = ((locationRows ?? []) as LocationRow[]).map((row) => {
          const pricingMode = resolvePricingMode(row);
          const signPrice = resolveSignPrice(row, pricingMode);
          const displayId = row.display_id || row.id;
          const metadata =
            row.verification_metadata &&
            typeof row.verification_metadata === "object"
              ? row.verification_metadata
              : {};
          const allowPromotionCodes = resolveMetadataBoolean(
            metadata,
            [
              "allow_promotion_codes",
              "allowPromotionCodes",
              "hourly_coupon_field_enabled",
              "coupon_enabled",
            ],
            true
          );
          const promotionCodeLabel =
            resolveMetadataString(metadata, [
              "promotion_code_label",
              "promotionCodeLabel",
              "coupon_name",
              "coupon_label",
            ]) || "FREE100";
          return {
            id: row.id,
            name: row.name || `Lot ${displayId}`,
            displayId,
            pricingMode,
            signPrice,
            allowPromotionCodes,
            promotionCodeLabel,
            latestFineAmount: latestFineByLocation.get(row.id) ?? null,
            locationTemplateUrl: resolveMetadataString(metadata, [
              "location_template_url",
              "resource_template_url",
            ]),
            payableSignTemplateUrl: resolveMetadataString(metadata, [
              "payable_sign_template_url",
              "private_notice_template_url",
            ]),
            checkoutQrUrl: buildCheckoutQrUrl({
              locationId: row.id,
              displayId,
              type: pricingMode,
              price: signPrice,
              allowPromotionCodes,
              promotionCodeLabel,
            }),
            casesQrUrl: buildCasesQrUrl(displayId),
            metadata,
          } satisfies ResourceLocation;
        });

        setLocations(built);
      } catch (unknownError) {
        setError(
          unknownError instanceof Error
            ? unknownError.message
            : "Unable to load resources."
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRoleState("not_admin");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const canAccess = roleState === "admin" || roleState === "manager";
  const userEmail = user?.email ?? "Unknown user";

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.name.localeCompare(b.name)),
    [locations]
  );
  const defaultTemplateUrl = useMemo(() => {
    for (const location of sortedLocations) {
      if (location.payableSignTemplateUrl) {
        return location.payableSignTemplateUrl;
      }
      if (location.locationTemplateUrl) {
        return location.locationTemplateUrl;
      }
    }
    return "";
  }, [sortedLocations]);
  const firstWidgetTemplateUrl = widgets[0]?.templateUrl ?? "";
  const firstWidgetLocationId = widgets[0]?.selectedLocationId ?? "";
  const firstWidgetFileName = widgets[0]?.fileName ?? "";
  const secondWidget = widgets[1] ?? null;
  const secondWidgetLocation = secondWidget
    ? sortedLocations.find((item) => item.id === secondWidget.selectedLocationId) ?? null
    : null;
  const secondWidgetEffectiveTemplateUrl =
    secondWidget?.templateUrl ||
    secondWidgetLocation?.payableSignTemplateUrl ||
    secondWidgetLocation?.locationTemplateUrl ||
    "";
  const eighthWidget = widgets[7] ?? null;
  const eighthWidgetLocation = eighthWidget
    ? sortedLocations.find((item) => item.id === eighthWidget.selectedLocationId) ?? null
    : null;
  const eighthWidgetEffectiveTemplateUrl =
    eighthWidget?.templateUrl ||
    eighthWidgetLocation?.payableSignTemplateUrl ||
    eighthWidgetLocation?.locationTemplateUrl ||
    "";

  useEffect(() => {
    if (sortedLocations.length === 0) {
      return;
    }
    const firstLocationId = sortedLocations[0].id;
    setWidgets((current) =>
      current.map((widget) =>
        widget.selectedLocationId
          ? widget
          : {
              ...widget,
              selectedLocationId: firstLocationId,
            }
      )
    );
  }, [sortedLocations]);
  useEffect(() => {
    if (!defaultTemplateUrl) {
      return;
    }
    setWidgets((current) =>
      current.map((widget, index) =>
        index === 0 && !widget.templateUrl
          ? {
              ...widget,
              templateUrl: defaultTemplateUrl,
            }
          : widget
      )
    );
  }, [defaultTemplateUrl]);
  useEffect(() => {
    setWidgets((current) => {
      if (current.length < 2) {
        return current;
      }
      const firstWidget = current[0];
      const secondWidget = current[1];
      const nextSecondTemplateUrl = firstWidget.templateUrl || secondWidget.templateUrl;
      const nextSecondLocationId = firstWidget.selectedLocationId || secondWidget.selectedLocationId;
      const nextSecondFileName = firstWidget.fileName || secondWidget.fileName;
      if (
        secondWidget.templateUrl === nextSecondTemplateUrl &&
        secondWidget.selectedLocationId === nextSecondLocationId &&
        secondWidget.fileName === nextSecondFileName
      ) {
        return current;
      }
      const next = [...current];
      next[1] = {
        ...secondWidget,
        templateUrl: nextSecondTemplateUrl,
        selectedLocationId: nextSecondLocationId,
        fileName: nextSecondFileName,
      };
      return next;
    });
  }, [firstWidgetFileName, firstWidgetLocationId, firstWidgetTemplateUrl]);
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const storedWidgets = serializeWidgetsForPersistence(widgets);
    const serializedWidgets = JSON.stringify(storedWidgets);
    window.localStorage.setItem(SIGN_WIDGETS_STORAGE_KEY, serializedWidgets);

    if (!supabase || !isSupabaseConfigured || !user?.id || !canAccess || !hasLoadedRemoteWidgets) {
      return;
    }
    if (lastRemoteWidgetsJsonRef.current === serializedWidgets) {
      return;
    }
    if (remoteSyncTimeoutRef.current) {
      clearTimeout(remoteSyncTimeoutRef.current);
    }
    const supabaseClient = supabase;
    const widgetStatePath = `${RESOURCES_WIDGET_STATE_PATH_PREFIX}/${user.id}.json`;
    remoteSyncTimeoutRef.current = setTimeout(() => {
      void supabaseClient.storage
        .from(RESOURCES_WIDGET_STATE_BUCKET)
        .upload(widgetStatePath, new Blob([serializedWidgets], { type: "application/json" }), {
          upsert: true,
          contentType: "application/json",
        })
        .then(({ error: uploadError }) => {
          if (!uploadError) {
            lastRemoteWidgetsJsonRef.current = serializedWidgets;
          }
        });
    }, 500);

    return () => {
      if (remoteSyncTimeoutRef.current) {
        clearTimeout(remoteSyncTimeoutRef.current);
        remoteSyncTimeoutRef.current = null;
      }
    };
  }, [widgets, user?.id, canAccess, hasLoadedRemoteWidgets]);

  function createWidget() {
    setWidgets((current) => [
      ...current,
      {
        id: `widget-${Date.now()}-${Math.round(Math.random() * 100000)}`,
        templateUrl: "",
        fileName: `Safe Parking ${current.length + 1}`,
        extraText: "",
        guestParkingMinutes: "90",
        selectedLocationId: sortedLocations[0]?.id ?? "",
        uploading: false,
        downloading: false,
      },
    ]);
  }

  async function uploadTemplateToStorage(
    file: File | Blob,
    storagePath: string
  ): Promise<string> {
    if (!supabase) {
      throw new Error("Supabase client unavailable.");
    }
    const { error: uploadError } = await supabase.storage
      .from("location-verification")
      .upload(storagePath, file, {
        upsert: true,
        contentType: (file as File).type || "application/octet-stream",
      });
    if (uploadError) {
      throw new Error(uploadError.message);
    }
    const { data } = supabase.storage.from("location-verification").getPublicUrl(storagePath);
    if (!data.publicUrl) {
      throw new Error("Unable to resolve uploaded file URL.");
    }
    return data.publicUrl;
  }

  async function compressImage(file: File, maxDimension = 3072, quality = 0.8): Promise<Blob> {
    const bitmap = await createImageBitmap(file);
    let { width, height } = bitmap;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = (height / width) * maxDimension;
        width = maxDimension;
      } else {
        width = (width / height) * maxDimension;
        height = maxDimension;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("Canvas context unavailable.");
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) reject(new Error("Compression failed."));
          else resolve(blob);
        },
        "image/jpeg",
        quality
      );
    });
  }

  async function handleWidgetTemplateUpload(widgetId: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !supabase) {
      return;
    }
    setWidgets((current) =>
      current.map((widget) => (widget.id === widgetId ? { ...widget, uploading: true } : widget))
    );
    setError("");
    try {
      const safeName = file.name.replaceAll(/\s+/g, "_");
      let fileToUpload: File | Blob = file;

      // If file is very large or it's Widget 10, try to compress it to fit
      // Widget 12 and 14 stay at original dimensions for exact-size downloads
      const shouldCompressLargeFile =
        file.size > 2 * 1024 * 1024 && !widgetId.endsWith("-12") && !widgetId.endsWith("-14");
      if (shouldCompressLargeFile || widgetId.includes("-10")) {
        try {
          fileToUpload = await compressImage(file);
        } catch (compressionError) {
          console.warn("Image compression failed, trying original file:", compressionError);
        }
      }

      const uploadedUrl = await uploadTemplateToStorage(
        fileToUpload,
        `resources/payable-sign/${widgetId}-${Date.now()}-${safeName}`
      );
      setWidgets((current) => {
        const firstWidgetId = current[0]?.id ?? "";
        const secondWidgetId = current[1]?.id ?? "";
        return current.map((widget) => {
          if (widget.id === widgetId) {
            return { ...widget, templateUrl: uploadedUrl };
          }
          if (widgetId === firstWidgetId && widget.id === secondWidgetId && !widget.templateUrl) {
            return { ...widget, templateUrl: uploadedUrl };
          }
          return widget;
        });
      });
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : "Unable to upload sign template."
      );
    } finally {
      setWidgets((current) =>
        current.map((widget) => (widget.id === widgetId ? { ...widget, uploading: false } : widget))
      );
    }
  }
  function handleRemoveWidgetTemplate(widgetId: string) {
    setWidgets((current) =>
      current.map((widget) =>
        widget.id === widgetId ? { ...widget, templateUrl: "" } : widget
      )
    );
    setError("");
  }

  function loadImage(url: string) {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Unable to load image: ${url}`));
      img.src = url;
    });
  }

  function splitSignTitle(name: string) {
    const normalized = name.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return ["Payparq"];
    }
    const words = normalized.split(" ");
    if (words.length === 1) {
      const single = words[0];
      if (single.length <= 12) {
        return [single];
      }
      const midpoint = Math.ceil(single.length / 2);
      return [single.slice(0, midpoint), single.slice(midpoint)];
    }
    if (words.length === 2) {
      return [words[0], words[1]];
    }
    let bestIndex = 1;
    let bestDelta = Number.POSITIVE_INFINITY;
    for (let i = 1; i < words.length; i += 1) {
      const left = words.slice(0, i).join(" ").length;
      const right = words.slice(i).join(" ").length;
      const delta = Math.abs(left - right);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestIndex = i;
      }
    }
    return [words.slice(0, bestIndex).join(" "), words.slice(bestIndex).join(" ")];
  }

  async function handleDownloadSign(
    widget: SignWidget,
    resource: ResourceLocation | null,
    widgetIndex: number
  ) {
    const resourceForSign = resource;
    const isWidgetFive = widgetIndex === 4;
    const isWidgetSix = widgetIndex === 5;
    const isWidgetSeven = widgetIndex === 6;
    const isWidgetNine = widgetIndex === 8;
    const isWidgetEleven = widgetIndex === 10;
    const isWidgetTwelve = widgetIndex === 11;
    const isWidgetFourteen = widgetIndex === 13;
    const isWidgetTwelveLike = isWidgetTwelve || isWidgetFourteen;
    const isGuestParkingWidget = isWidgetFive || isWidgetSix || isWidgetSeven;
    const requiresLocationData = widgetIndex < 2 || isGuestParkingWidget || isWidgetTwelveLike;
    if (requiresLocationData && !resource) {
      setError("Select a location before downloading sign.");
      return;
    }
    const isWidgetThreeOrFour = widgetIndex === 2 || widgetIndex === 3;
    const templateUrl =
      isGuestParkingWidget
        ? secondWidgetEffectiveTemplateUrl
        : isWidgetNine || isWidgetEleven
        ? eighthWidgetEffectiveTemplateUrl
        : isWidgetThreeOrFour
        ? widget.templateUrl
        : widget.templateUrl ||
          resourceForSign?.payableSignTemplateUrl ||
          resourceForSign?.locationTemplateUrl;
    if (!templateUrl) {
      setError("Upload a payable sign template before downloading sign.");
      return;
    }
    setWidgets((current) =>
      current.map((item) => (item.id === widget.id ? { ...item, downloading: true } : item))
    );
    setError("");
    try {
      const normalizedBaseName = widget.fileName
        .trim()
        .replaceAll(/[\\/:*?"<>|]/g, "")
        .replaceAll(/\s+/g, " ");
      const fallbackBaseName = `parking_sign_${resource?.displayId ?? `widget_${widgetIndex + 1}`}`;
      const finalBaseName = normalizedBaseName || fallbackBaseName;
      const downloadBlob = (blob: Blob, extension: string) => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = `${finalBaseName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(objectUrl);
      };
      const downloadCanvas = async (canvas: HTMLCanvasElement) => {
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((fileBlob) => {
            if (!fileBlob) {
              reject(new Error("Unable to export sign image."));
              return;
            }
            resolve(fileBlob);
          }, "image/png");
        });
        downloadBlob(blob, "png");
      };
      const drawPayparqSticker = (
        context: CanvasRenderingContext2D,
        centerX: number,
        centerY: number,
        diameter: number
      ) => {
        const outerRadius = diameter / 2;
        const innerRadius = Math.max(1, outerRadius - diameter * 0.13);
        context.beginPath();
        context.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        context.fillStyle = "#f8fafc";
        context.fill();
        context.beginPath();
        context.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        context.fillStyle = "#020617";
        context.fill();
        context.fillStyle = "#ffffff";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = `600 ${Math.max(6, diameter * 0.325)}px Montserrat, Inter, Arial, sans-serif`;
        context.fillText("P", centerX, centerY);
      };
      const drawStyledQr = (
        context: CanvasRenderingContext2D,
        qrImage: HTMLImageElement,
        includeTopSticker: boolean,
        moduleCountHint?: number,
        exactQrMode?: boolean,
        hideCenterBadge?: boolean,
        exactQrSize?: number,
        qrCenterYOffset = 0,
        exactQrTrimBottomPx = 0,
        exactQrWidthDeltaPx = 0,
        exactQrTopGrowPx = 0
      ) => {
        const qrBoxSize = 180;
        const qrSize = exactQrMode ? exactQrSize ?? 115 : 104;
        const qrCenterX = width / 2;
        const qrCenterY = 363 + qrCenterYOffset;
        const qrX = qrCenterX - qrBoxSize / 2;
        const qrY = qrCenterY - qrBoxSize / 2;
        const qrDrawX = qrX + (qrBoxSize - qrSize) / 2;
        const qrDrawY = qrY + (qrBoxSize - qrSize) / 2;
        if (exactQrMode) {
          const qrRenderWidth = Math.max(1, qrSize + exactQrWidthDeltaPx);
          const qrRenderHeight = Math.max(1, qrSize - exactQrTrimBottomPx);
          const qrRenderX = qrDrawX - exactQrWidthDeltaPx / 2;
          const qrRenderY = qrDrawY - exactQrTopGrowPx;
          const qrRenderHeightWithTopGrow = Math.max(1, qrRenderHeight + exactQrTopGrowPx);
          context.drawImage(
            qrImage,
            qrRenderX,
            qrRenderY,
            qrRenderWidth,
            qrRenderHeightWithTopGrow
          );
          if (hideCenterBadge) {
            return;
          }
          const qrBadgeCenterY = qrRenderY + qrRenderHeightWithTopGrow / 2;
          context.beginPath();
          context.arc(qrCenterX, qrBadgeCenterY, 14, 0, Math.PI * 2);
          context.fillStyle = "#ffffff";
          context.fill();
          drawPayparqSticker(context, qrCenterX, qrBadgeCenterY, 22);
          return;
        }
        const qrSampleSize = 300;
        const qrCanvas = document.createElement("canvas");
        qrCanvas.width = qrSampleSize;
        qrCanvas.height = qrSampleSize;
        const qrContext = qrCanvas.getContext("2d");
        if (!qrContext) {
          throw new Error("Unable to render QR canvas.");
        }
        qrContext.drawImage(qrImage, 0, 0, qrSampleSize, qrSampleSize);
        const qrData = qrContext.getImageData(0, 0, qrSampleSize, qrSampleSize).data;
        const isDark = (x: number, y: number) => {
          const safeX = Math.max(0, Math.min(qrSampleSize - 1, x));
          const safeY = Math.max(0, Math.min(qrSampleSize - 1, y));
          const index = (safeY * qrSampleSize + safeX) * 4;
          const r = qrData[index];
          const g = qrData[index + 1];
          const b = qrData[index + 2];
          return (r + g + b) / 3 < 128;
        };
        let finderRun = 0;
        while (finderRun < qrSampleSize && isDark(finderRun, 0)) {
          finderRun += 1;
        }
        const modulePixels = Math.max(1, Math.round(finderRun / 7) || 1);
        const inferredModuleCount = Math.round(qrSampleSize / modulePixels);
        const moduleCount = moduleCountHint && moduleCountHint >= 21 ? moduleCountHint : Math.min(33, Math.max(21, inferredModuleCount));
        const moduleDraw = qrSize / moduleCount;
        const qrMarkColor = "#000000";
        const finderMarkColor = qrMarkColor;
        const dotDiameter = Math.max(1, moduleDraw * 0.35);
        const dotRadius = dotDiameter / 2;
        context.fillStyle = qrMarkColor;
        for (let row = 0; row < moduleCount; row += 1) {
          for (let column = 0; column < moduleCount; column += 1) {
            const sampleX = Math.floor(((column + 0.5) * qrSampleSize) / moduleCount);
            const sampleY = Math.floor(((row + 0.5) * qrSampleSize) / moduleCount);
            if (!isDark(sampleX, sampleY)) {
              continue;
            }
            const centerX = qrDrawX + column * moduleDraw + moduleDraw / 2;
            const centerY = qrDrawY + row * moduleDraw + moduleDraw / 2;
            context.beginPath();
            context.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
            context.fill();
          }
        }
        const drawRoundedRect = (
          x: number,
          y: number,
          size: number,
          radius: number,
          fillColor?: string,
          strokeColor?: string,
          strokeWidth = 0
        ) => {
          context.beginPath();
          context.moveTo(x + radius, y);
          context.lineTo(x + size - radius, y);
          context.quadraticCurveTo(x + size, y, x + size, y + radius);
          context.lineTo(x + size, y + size - radius);
          context.quadraticCurveTo(x + size, y + size, x + size - radius, y + size);
          context.lineTo(x + radius, y + size);
          context.quadraticCurveTo(x, y + size, x, y + size - radius);
          context.lineTo(x, y + radius);
          context.quadraticCurveTo(x, y, x + radius, y);
          context.closePath();
          if (fillColor) {
            context.fillStyle = fillColor;
            context.fill();
          }
          if (strokeColor && strokeWidth > 0) {
            context.lineWidth = strokeWidth;
            context.strokeStyle = strokeColor;
            context.stroke();
          }
        };
        const finderScale = 1;
        const finderOuter = moduleDraw * 7 * finderScale;
        const finderInner = moduleDraw * 3 * finderScale;
        const finderRadiusOuter = Math.max(1, moduleDraw * 1.3 * finderScale);
        const finderRadiusInner = Math.max(1, moduleDraw * 0.7 * finderScale);
        const finderMask = finderOuter + moduleDraw * 1.2;
        const finderMaskRadius = finderRadiusOuter + moduleDraw * 0.6;
        const finderMaskInset = (finderMask - finderOuter) / 2;
        const drawFinderReplacement = (x: number, y: number) => {
          drawRoundedRect(
            x - finderMaskInset,
            y - finderMaskInset,
            finderMask,
            finderMaskRadius,
            "#ffffff"
          );
          drawRoundedRect(
            x,
            y,
            finderOuter,
            finderRadiusOuter,
            "#ffffff",
            finderMarkColor,
            Math.max(1, moduleDraw * 1.2)
          );
          drawRoundedRect(
            x + (finderOuter - finderInner) / 2,
            y + (finderOuter - finderInner) / 2,
            finderInner,
            finderRadiusInner,
            finderMarkColor
          );
        };
        drawFinderReplacement(qrDrawX, qrDrawY);
        drawFinderReplacement(qrDrawX + qrSize - finderOuter, qrDrawY);
        drawFinderReplacement(qrDrawX, qrDrawY + qrSize - finderOuter);
        const logoBgSize = 24;
        context.fillStyle = "#ffffff";
        context.fillRect(
          qrCenterX - logoBgSize / 2,
          qrCenterY - logoBgSize / 2,
          logoBgSize,
          logoBgSize
        );
        context.fillStyle = "#000000";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.font = "900 16.2px Montserrat, Inter, Arial, sans-serif";
        context.fillText("P", qrCenterX, qrCenterY);
        if (includeTopSticker) {
          const stickerDiameter = 12;
          const stickerCenterX = qrCenterX;
          const stickerCenterY = qrCenterY - logoBgSize / 2 - stickerDiameter / 2 - 2;
          drawPayparqSticker(context, stickerCenterX, stickerCenterY, stickerDiameter);
        }
      };
      const width = 400;
      const height = 600;
      const outputScale = 2;
      const buildQrDataUrl = async (value: string, width: number) => {
        const QRCodeModule = await import("qrcode");
        const qrModel = QRCodeModule.create(value, {
          errorCorrectionLevel: "H",
        });
        const dataUrl = await QRCodeModule.toDataURL(value, {
          errorCorrectionLevel: "H",
          margin: 0,
          width,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        return { dataUrl, moduleCount: qrModel.modules.size };
      };
      const detectTemplateQrBounds = async (image: HTMLImageElement) => {
        try {
          if (!("BarcodeDetector" in window)) {
            return null;
          }
          type BarcodeDetection = { boundingBox?: DOMRectReadOnly };
          type BarcodeDetectorLike = {
            detect: (source: ImageBitmapSource) => Promise<BarcodeDetection[]>;
          };
          type BarcodeDetectorConstructor = new (options: {
            formats: string[];
          }) => BarcodeDetectorLike;
          const Detector = (
            window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
          ).BarcodeDetector;
          if (!Detector) {
            return null;
          }
          const detector = new Detector({ formats: ["qr_code"] });
          const detectionCanvas = document.createElement("canvas");
          detectionCanvas.width = image.width;
          detectionCanvas.height = image.height;
          const detectionContext = detectionCanvas.getContext("2d");
          if (!detectionContext) {
            return null;
          }
          detectionContext.drawImage(image, 0, 0, image.width, image.height);
          const bitmap = await createImageBitmap(detectionCanvas);
          const detections = await detector.detect(bitmap);
          if (typeof bitmap.close === "function") {
            bitmap.close();
          }
          if (!detections?.length || !detections[0]?.boundingBox) {
            return null;
          }
          const { x, y, width, height } = detections[0].boundingBox;
          if (width <= 0 || height <= 0) {
            return null;
          }
          return { x, y, width, height };
        } catch {
          return null;
        }
      };
      if (widgetIndex >= 2 && !isGuestParkingWidget && !isWidgetTwelveLike) {
        const templateImage = await loadImage(templateUrl);
        const canvas = document.createElement("canvas");
        canvas.width = templateImage.width * outputScale;
        canvas.height = templateImage.height * outputScale;
        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("Unable to render sign canvas.");
        }
        context.scale(outputScale, outputScale);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = "high";
        context.drawImage(templateImage, 0, 0, templateImage.width, templateImage.height);
        let qrObjectUrl = "";
        let qrImage: HTMLImageElement;
        const shouldMatchWidget3Styling = widgetIndex === 2 || widgetIndex === 3;
        const qrDataValue = widgetIndex === 9 ? "https://www.payparq.com/support" : "https://www.payparq.com/payments";
        if (shouldMatchWidget3Styling) {
          const { default: QRCodeStyling } = await import("qr-code-styling");
          const qrStyling = new QRCodeStyling({
            width: 900,
            height: 900,
            type: "canvas",
            data: qrDataValue,
            margin: 0,
            dotsOptions: {
              type: "dots",
              color: "#000000",
            },
            cornersSquareOptions: {
              type: "extra-rounded",
              color: "#000000",
            },
            cornersDotOptions: {
              type: "dot",
              color: "#000000",
            },
            backgroundOptions: {
              color: "#ffffff",
            },
            qrOptions: {
              errorCorrectionLevel: "Q",
            },
          });
          const rawData = await qrStyling.getRawData("png");
          if (!(rawData instanceof Blob)) {
            throw new Error("Unable to generate styled QR image.");
          }
          qrObjectUrl = URL.createObjectURL(rawData);
          qrImage = await loadImage(qrObjectUrl);
        } else {
          qrImage = await loadImage(
            `https://api.qrserver.com/v1/create-qr-code/?size=900x900&qzone=0&color=000000&data=${encodeURIComponent(qrDataValue)}`
          );
        }
        const fallbackX = (148 / width) * templateImage.width;
        const fallbackY = (311 / height) * templateImage.height;
        const fallbackWidth = (104 / width) * templateImage.width;
        const fallbackHeight = (104 / height) * templateImage.height;
        const detectedQrBounds = await detectTemplateQrBounds(templateImage);
        const hasUsableDetection = Boolean(
          detectedQrBounds &&
            Math.abs((detectedQrBounds.x + detectedQrBounds.width / 2) - (fallbackX + fallbackWidth / 2)) <=
              templateImage.width * 0.12 &&
            Math.abs((detectedQrBounds.y + detectedQrBounds.height / 2) - (fallbackY + fallbackHeight / 2)) <=
              templateImage.height * 0.12 &&
            detectedQrBounds.width >= fallbackWidth * 0.7 &&
            detectedQrBounds.width <= fallbackWidth * 1.5 &&
            detectedQrBounds.height >= fallbackHeight * 0.7 &&
            detectedQrBounds.height <= fallbackHeight * 1.5
        );
        const qrTargetX = hasUsableDetection ? (detectedQrBounds as { x: number }).x : fallbackX;
        const qrTargetY = hasUsableDetection ? (detectedQrBounds as { y: number }).y : fallbackY;
        const qrTargetWidth = hasUsableDetection
          ? (detectedQrBounds as { width: number }).width
          : fallbackWidth;
        const qrTargetHeight = hasUsableDetection
          ? (detectedQrBounds as { height: number }).height
          : fallbackHeight;
        const pxPerCm = fallbackWidth / 4;
        const moveUpPx = pxPerCm * 9.9;
        const growLeftPx = pxPerCm * 0.3;
        const growRightPx = pxPerCm * 0.1;
        const growExtraWidthPx = pxPerCm * 1.5;
        const widget3ExtraWidthPx = shouldMatchWidget3Styling ? pxPerCm * 0.1 : 0;
        const trimTopPx = pxPerCm * 0.15;
        const moveDownPx = pxPerCm * 0.15;
        const adjustedWidth =
          qrTargetWidth + growLeftPx + growRightPx + growExtraWidthPx + widget3ExtraWidthPx;
        const adjustedHeight = qrTargetHeight - trimTopPx;
        const adjustedX =
          qrTargetX - growLeftPx - (growExtraWidthPx + widget3ExtraWidthPx) / 2;
        const adjustedY = qrTargetY - moveUpPx + trimTopPx + moveDownPx;
        const clampedWidth = Math.max(1, Math.min(adjustedWidth, templateImage.width));
        const clampedHeight = Math.max(1, Math.min(adjustedHeight, templateImage.height));
        const clampedX = Math.max(0, Math.min(adjustedX, templateImage.width - clampedWidth));
        const clampedY = Math.max(0, Math.min(adjustedY, templateImage.height - clampedHeight));
        if (widgetIndex !== 7 && widgetIndex !== 8 && widgetIndex !== 9 && widgetIndex !== 10) {
          context.drawImage(qrImage, clampedX, clampedY, clampedWidth, clampedHeight);
        } else if (widgetIndex === 9) {
          // For Widget 10, place the QR code 1.4cm down and 2.7cm to the right from original spot
          // Cumulative shifts from previous 2.6cm right, 1.7cm down:
          // +0.1R (New: 2.7R)
          // -0.3D (New: 1.4D)
          const pxPerCm = fallbackWidth / 4;
          const qrX = qrTargetX + 2.7 * pxPerCm;
          const qrY = qrTargetY + 1.4 * pxPerCm;
          const qrWidth = qrTargetWidth * 0.9;
          const qrHeight = qrTargetHeight * 0.9;
          context.drawImage(qrImage, qrX, qrY, qrWidth, qrHeight);
        }
        if (shouldMatchWidget3Styling) {
          const stickerDiameter = pxPerCm * 1.52145;
          const stickerCenterX = stickerDiameter / 2 + pxPerCm * 0.55;
          const baseStickerCenterY = Math.min(
            templateImage.height - stickerDiameter / 2 - pxPerCm * 0.5,
            templateImage.height * 0.88
          );
          const stickerCenterY = Math.max(stickerDiameter / 2, baseStickerCenterY - pxPerCm * 3.2);
          drawPayparqSticker(context, stickerCenterX, stickerCenterY, stickerDiameter);
        }
        if (widgetIndex === 7 || widgetIndex === 8 || widgetIndex === 10) {
          const footerCutHeight = Math.max(1, Math.round((56 / height) * templateImage.height));
          const croppedSourceHeight = Math.max(1, templateImage.height - footerCutHeight);
          context.clearRect(0, 0, templateImage.width, templateImage.height);
          context.drawImage(
            templateImage,
            0,
            0,
            templateImage.width,
            croppedSourceHeight,
            0,
            0,
            templateImage.width,
            templateImage.height
          );
          if (widgetIndex === 8 || widgetIndex === 10) {
            const mirroredCanvas = document.createElement("canvas");
            mirroredCanvas.width = templateImage.width;
            mirroredCanvas.height = templateImage.height;
            const mirroredContext = mirroredCanvas.getContext("2d");
            if (!mirroredContext) {
              throw new Error("Unable to render mirrored template.");
            }
            mirroredContext.translate(templateImage.width, 0);
            mirroredContext.scale(-1, 1);
            mirroredContext.drawImage(
              templateImage,
              0,
              0,
              templateImage.width,
              croppedSourceHeight,
              0,
              0,
              templateImage.width,
              templateImage.height
            );
            context.drawImage(mirroredCanvas, 0, 0, templateImage.width, templateImage.height);
            const airportLabelX = Math.round(templateImage.width * 0.15);
            const airportLabelY = Math.round(templateImage.height * 0.2);
            const airportLabelWidth = Math.max(1, Math.round(templateImage.width * 0.7));
            const airportLabelMaxHeight = Math.max(1, Math.round(templateImage.height * 0.2));
            const airportLabelHeight = Math.max(
              1,
              Math.min(airportLabelMaxHeight, croppedSourceHeight - airportLabelY)
            );
            const airportLabelRenderHeight = Math.max(
              1,
              Math.min(
                airportLabelHeight + Math.max(1, Math.round(templateImage.height * 0.012)),
                croppedSourceHeight - airportLabelY
              )
            );
            context.drawImage(
              templateImage,
              airportLabelX,
              airportLabelY,
              airportLabelWidth,
              airportLabelRenderHeight,
              airportLabelX,
              airportLabelY,
              airportLabelWidth,
              airportLabelRenderHeight
            );
            const seamCleanupY = airportLabelY + airportLabelRenderHeight - 1;
            const seamCleanupHeight = Math.max(1, Math.round(templateImage.height * 0.006));
            context.fillStyle = "#ffffff";
            if (widgetIndex === 8) {
              context.fillRect(airportLabelX, seamCleanupY, airportLabelWidth, seamCleanupHeight);
            }
            const parkingPCleanupX = airportLabelX + Math.round(airportLabelWidth * 0.01);
            const parkingPCleanupY = airportLabelY + airportLabelRenderHeight - 3;
            const parkingPCleanupWidth = Math.max(1, Math.round(airportLabelWidth * 0.25));
            const parkingPCleanupHeight = Math.max(1, Math.round(templateImage.height * 0.012));
            if (widgetIndex === 8) {
              context.fillRect(
                parkingPCleanupX,
                parkingPCleanupY,
                parkingPCleanupWidth,
                parkingPCleanupHeight
              );
            }
            if (widgetIndex === 10) {
              const safeShiftLeftPx = Math.round(pxPerCm * 2.2);
              const airportRowBaseX = airportLabelX + Math.round(airportLabelWidth * 0.43);
              const airportRowX = Math.max(airportLabelX, airportRowBaseX - safeShiftLeftPx);
              const airportRowY = airportLabelY + Math.round(airportLabelRenderHeight * 0.01);
              const maxAirportRowWidth = airportLabelX + airportLabelWidth - airportRowX;
              const airportRowWidth = Math.max(
                1,
                Math.min(Math.round(airportLabelWidth * 0.58), maxAirportRowWidth)
              );
              const airportRowHeight = Math.max(1, Math.round(airportLabelRenderHeight * 0.5));
              context.fillStyle = "#ffffff";
              context.fillRect(airportRowX, airportRowY, airportRowWidth, airportRowHeight);
              const overflowCleanupX = Math.max(airportLabelX, airportRowX + airportRowWidth - Math.round(templateImage.width * 0.05));
              const overflowCleanupWidth = Math.max(
                1,
                Math.min(Math.round(airportLabelWidth * 0.24), airportLabelX + airportLabelWidth - overflowCleanupX)
              );
              const overflowCleanupY = Math.max(airportLabelY, airportRowY - Math.round(templateImage.height * 0.006));
              const overflowCleanupHeight = Math.max(
                1,
                Math.min(
                  airportLabelRenderHeight,
                  airportRowHeight + Math.round(templateImage.height * 0.004)
                )
              );
              context.fillRect(
                overflowCleanupX,
                overflowCleanupY,
                overflowCleanupWidth,
                overflowCleanupHeight
              );
              const leftOverflowCleanupX = Math.max(
                0,
                airportRowX - Math.round(templateImage.width * 0.05)
              );
              const leftOverflowCleanupWidth = Math.max(
                1,
                Math.min(
                  Math.round(airportLabelWidth * 0.28),
                  templateImage.width - leftOverflowCleanupX
                )
              );
              context.fillRect(
                leftOverflowCleanupX,
                overflowCleanupY,
                leftOverflowCleanupWidth,
                overflowCleanupHeight
              );
              const airportALeftCleanupX = Math.max(
                airportLabelX,
                airportRowX - Math.round(templateImage.width * 0.03)
              );
              const airportALeftCleanupY = Math.max(
                airportLabelY,
                airportRowY - Math.round(templateImage.height * 0.004)
              );
              const airportALeftCleanupWidth = Math.max(
                1,
                Math.round(airportLabelWidth * 0.12)
              );
              const airportALeftCleanupHeight = Math.max(
                1,
                Math.round(airportRowHeight * 0.92)
              );
              context.fillRect(
                airportALeftCleanupX,
                airportALeftCleanupY,
                airportALeftCleanupWidth,
                airportALeftCleanupHeight
              );
              const parkingBottomCleanupX = Math.max(0, parkingPCleanupX - Math.round(pxPerCm * 0.2));
              const parkingBottomCleanupY = parkingPCleanupY + parkingPCleanupHeight;
              const parkingBottomCleanupWidth = Math.max(1, Math.round(airportLabelWidth * 0.16));
              const parkingBottomCleanupHeight = Math.max(
                1,
                Math.round(templateImage.height * 0.004)
              );
              context.fillRect(
                parkingBottomCleanupX,
                parkingBottomCleanupY,
                parkingBottomCleanupWidth,
                parkingBottomCleanupHeight
              );
              const parkingBottomFarCleanupY = Math.min(
                templateImage.height - 1,
                parkingBottomCleanupY + Math.round(pxPerCm * 1.45)
              );
              const parkingBottomFarCleanupHeight = Math.max(
                1,
                Math.round(pxPerCm * 0.55)
              );
              context.fillRect(
                parkingBottomCleanupX,
                parkingBottomFarCleanupY,
                parkingBottomCleanupWidth,
                Math.min(parkingBottomFarCleanupHeight, templateImage.height - parkingBottomFarCleanupY)
              );
              context.fillStyle = "#111111";
              context.textAlign = "left";
              context.textBaseline = "middle";
              const airportFontSize = Math.max(18, Math.round(templateImage.height * 0.066));
              context.font = `700 ${airportFontSize}px Montserrat, Inter, Arial, sans-serif`;
              const safeTextX = airportRowX + Math.round(templateImage.width * 0.008);
              const safeTextY = airportRowY + airportRowHeight / 2;
              context.fillStyle = "#ffffff";
              const safeLeftArtifactCleanupX = Math.max(0, safeTextX - Math.round(pxPerCm * 1.2));
              const safeLeftArtifactCleanupY = Math.max(
                airportLabelY,
                airportRowY - Math.round(templateImage.height * 0.004)
              );
              const safeLeftArtifactCleanupWidth = Math.max(1, Math.round(pxPerCm * 0.9));
              const safeLeftArtifactCleanupHeight = Math.max(1, Math.round(airportRowHeight * 0.95));
              context.fillRect(
                safeLeftArtifactCleanupX,
                safeLeftArtifactCleanupY,
                safeLeftArtifactCleanupWidth,
                safeLeftArtifactCleanupHeight
              );
              context.fillStyle = "#111111";
              context.fillText("Safe", safeTextX, safeTextY);
            }
          }
          context.fillStyle = "#111111";
          context.textAlign = "center";
          context.textBaseline = "middle";
          context.font = `900 ${Math.max(18, Math.round(templateImage.height * 0.04))}px Montserrat, Inter, Arial, sans-serif`;
          const priceLabelY = Math.min(
            templateImage.height - 24,
            templateImage.height * 0.12 + pxPerCm * 2
          );
          context.fillText("0.1€/h - 1.4€/h", templateImage.width / 2, priceLabelY);
        }
        if (qrObjectUrl) {
          URL.revokeObjectURL(qrObjectUrl);
        }

        if (widgetIndex === 9) {
          context.save();
          const standardQrX = 148;
          const standardQrY = 311;
          const standardQrSize = 104;
          let scaleX = templateImage.width / width;
          let scaleY = templateImage.height / height;
          let offsetX = 0;
          let offsetY = 0;
          if (detectedQrBounds) {
            const qrScaleX = detectedQrBounds.width / standardQrSize;
            const qrScaleY = detectedQrBounds.height / standardQrSize;
            if (Number.isFinite(qrScaleX) && qrScaleX > 0 && Number.isFinite(qrScaleY) && qrScaleY > 0) {
              scaleX = qrScaleX;
              scaleY = qrScaleY;
              offsetX = detectedQrBounds.x - standardQrX * scaleX;
              offsetY = detectedQrBounds.y - standardQrY * scaleY;
            }
          }
          const cmToPx = 104 / 4; // 104px is 4cm for the QR code in the template
          const shiftUp = 10 * cmToPx; // Shifted an additional 1cm up (total 10cm)

          context.fillStyle = "#111111";
          context.textBaseline = "alphabetic";
          
          // Role and Name: Shifted an additional 0.8cm right (total 2.5cm right from the center)
          const xPos = (width / 2 + 2.5 * cmToPx) * scaleX + offsetX;
          context.textAlign = "center";
          
          // Font sizes: Role is 2.0x, Name is 1.5x (between previous 2.0x and recent 1.0x)
          const roleFontSize = 12 * scaleY * 2.0; 
          const nameFontSize = 12 * scaleY * 1.5; 

          // Vertical positions for multi-row layout (10cm shifted up)
          // Increased spacing between role rows to 20 units (scaled)
          // Added an additional 0.5cm (approx 13 scaled units) spacing between role and name
          const spacing05cm = 0.5 * cmToPx;
          const roleRow1Y = (540 - shiftUp) * scaleY + offsetY;
          const roleRow2Y = (560 - shiftUp) * scaleY + offsetY;
          const nameY = (580 - shiftUp + spacing05cm) * scaleY + offsetY;
          
          if (widget.userRole && widget.userRole.trim()) {
            context.font = `600 ${roleFontSize}px Inter, Arial, sans-serif`;
            const roleParts = widget.userRole.trim().split(/\s+/);
            if (roleParts.length >= 2) {
              context.fillText(roleParts[0], xPos, roleRow1Y);
              context.fillText(roleParts.slice(1).join(" "), xPos, roleRow2Y);
            } else {
              context.fillText(widget.userRole.trim(), xPos, roleRow1Y);
            }
          }
          if (widget.userName && widget.userName.trim()) {
            context.font = `600 ${nameFontSize}px Inter, Arial, sans-serif`;
            context.fillText(widget.userName.trim(), xPos, nameY);
          }

          // Draw the Payparq Logo (Sticker) across the photo area
          // Logo Shift: 1.5cm right and 1cm down from its centered position
          context.save();
          context.globalAlpha = 0.85; // Slight transparency to look like a watermark/sticker
          context.restore();

          // ID: Shifted 2cm left from centered position below photo, and 0.5cm lower
          const idFontSize = 12 * scaleY * 1.5; 
          context.font = `600 ${idFontSize}px Inter, Arial, sans-serif`;
          const idCenterX = (148 + 104 / 2 - 2 * cmToPx) * scaleX + offsetX;
          const idY = (311 + 104 + 20 + 0.5 * cmToPx) * scaleY + offsetY;

          if (widget.userIdNumber && widget.userIdNumber.trim()) {
            context.save();
            context.textAlign = "center";
            context.fillText(`ID: ${widget.userIdNumber.trim()}`, idCenterX, idY);
            context.restore();
          }
          context.restore();
        }

        await downloadCanvas(canvas);
        return;
      }
      const templateImage = await loadImage(templateUrl);
      const canvas = document.createElement("canvas");
      const targetCanvasWidth = isWidgetTwelve
        ? templateImage.width
        : isWidgetFourteen
        ? Math.max(1, Math.round(templateImage.height * 0.5))
        : width;
      const targetCanvasHeight = isWidgetTwelve || isWidgetFourteen ? templateImage.height : height;
      canvas.width = targetCanvasWidth * outputScale;
      canvas.height = targetCanvasHeight * outputScale;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to render sign canvas.");
      }
      context.scale(outputScale, outputScale);
      if (isWidgetTwelveLike) {
        context.scale(targetCanvasWidth / width, targetCanvasHeight / height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (isWidgetTwelveLike) {
        context.drawImage(templateImage, 0, 0, width, height);
      } else {
        const imageAspect = templateImage.width / templateImage.height;
        const canvasAspect = width / height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        if (imageAspect > canvasAspect) {
          drawHeight = height;
          drawWidth = drawHeight * imageAspect;
          offsetX = (width - drawWidth) / 2;
        } else {
          drawWidth = width;
          drawHeight = drawWidth / imageAspect;
          offsetY = (height - drawHeight) / 2;
        }
        context.drawImage(templateImage, offsetX, offsetY, drawWidth, drawHeight);
      }
      if (!resourceForSign) {
        throw new Error("Select a location before downloading sign.");
      }
      const checkoutUrl = buildCheckoutQrUrl({
        locationId: resourceForSign.id,
        displayId: resourceForSign.displayId,
        type: resourceForSign.pricingMode,
        price: resourceForSign.signPrice,
        allowPromotionCodes: resourceForSign.allowPromotionCodes,
        promotionCodeLabel: resourceForSign.promotionCodeLabel,
      });
      let qrImage: HTMLImageElement;
      let qrModuleCount: number | undefined;
      const useExactQrMechanics =
        widgetIndex === 0 ||
        widgetIndex === 1 ||
        widgetIndex === 4 ||
        widgetIndex === 5 ||
        widgetIndex === 6 ||
        widgetIndex === 11 ||
        widgetIndex === 13;
      if (useExactQrMechanics) {
        const exactQrColor = "#000000";
        const { default: QRCodeStyling } = await import("qr-code-styling");
        const qrStyling = new QRCodeStyling({
          width: 900,
          height: 900,
          type: "canvas",
          data: checkoutUrl,
          margin: 0,
          dotsOptions: {
            type: "dots",
            color: exactQrColor,
          },
          cornersSquareOptions: {
            type: "extra-rounded",
            color: exactQrColor,
          },
          cornersDotOptions: {
            type: "dot",
            color: exactQrColor,
          },
          backgroundOptions: {
            color: "#ffffff",
          },
          qrOptions: {
            errorCorrectionLevel: "Q",
          },
        });
        const rawData = await qrStyling.getRawData("png");
        if (!(rawData instanceof Blob)) {
          throw new Error("Unable to generate styled QR image.");
        }
        const qrObjectUrl = URL.createObjectURL(rawData);
        try {
          qrImage = await loadImage(qrObjectUrl);
        } finally {
          URL.revokeObjectURL(qrObjectUrl);
        }
      } else {
        const { dataUrl: qrDataUrl, moduleCount } = await buildQrDataUrl(checkoutUrl, 900);
        qrImage = await loadImage(qrDataUrl);
        qrModuleCount = moduleCount;
      }

      const normalizedGuestParkingMinutes =
        widget.guestParkingMinutes.replace(/\D+/g, "").replace(/^0+/, "") || "90";
      if (!isWidgetTwelveLike) {
        const titleName = isWidgetFive
          ? `Gosti Besplatno ${normalizedGuestParkingMinutes} m. Guests Free ${normalizedGuestParkingMinutes} m.`
          : isWidgetSix
          ? "Parking za Goste Guests Only"
          : isWidgetSeven
          ? "Cijena:0.1€/sat-3.9€/sat Price:0.1€/h-3.9€/h"
          : resourceForSign.name;
        const titleLines = isWidgetFive
          ? [
              `Gosti Besplatno ${normalizedGuestParkingMinutes} m.`,
              `Guests Free ${normalizedGuestParkingMinutes} m.`,
            ]
          : isWidgetSix
          ? ["Parking za Goste", "Guests Only"]
          : isWidgetSeven
          ? ["Cijena:0.1€/sat-3.9€/sat", "Price:0.1€/h-3.9€/h"]
          : splitSignTitle(titleName);
        context.fillStyle = "#111111";
        context.textAlign = "center";
        context.textBaseline = "middle";
        const titleFont = isGuestParkingWidget
          ? "600 34px Montserrat, Inter, Arial, sans-serif"
          : "900 34px Montserrat, Inter, Arial, sans-serif";
        context.font = titleFont;
        const titleTop = 13;
        const titleBottom = 121;
        const titleCenterY = (titleTop + titleBottom) / 2;
        if (titleLines.length > 1) {
          const gap = 36;
          context.fillText(titleLines[0], width / 2, titleCenterY - gap / 2);
          context.fillText(titleLines[1], width / 2, titleCenterY + gap / 2);
        } else {
          context.fillText(titleLines[0], width / 2, titleCenterY);
        }
      }

      const widgetTwelveLikeQrSize = 136;
      const widgetTwelveLikeQrCenterYOffset = 52;
      const widgetTwelveLikeQrTrimBottomPx = 52;
      const widgetTwelveLikeQrWidthDeltaPx = 30;
      const widgetTwelveLikeQrTopGrowPx = 10;
      drawStyledQr(
        context,
        qrImage,
        widgetIndex > 1 && widgetIndex !== 4 && widgetIndex !== 11,
        qrModuleCount,
        useExactQrMechanics,
        false,
        widgetIndex === 4 ||
        widgetIndex === 5 ||
        widgetIndex === 6 ||
        widgetIndex === 11 ||
        widgetIndex === 13
          ? widgetIndex === 11 || widgetIndex === 13
            ? widgetTwelveLikeQrSize
            : 110
          : undefined,
        widgetIndex === 11 || widgetIndex === 13 ? widgetTwelveLikeQrCenterYOffset : 0,
        widgetIndex === 11 || widgetIndex === 13 ? widgetTwelveLikeQrTrimBottomPx : 0,
        widgetIndex === 11 || widgetIndex === 13 ? widgetTwelveLikeQrWidthDeltaPx : 0,
        widgetIndex === 11 || widgetIndex === 13 ? widgetTwelveLikeQrTopGrowPx : 0
      );

      if (isWidgetTwelveLike) {
        context.fillStyle = "#ffffff";
        context.fillRect(0, 546, width, 54);
        context.fillStyle = "#111111";
        context.textAlign = "center";
        context.textBaseline = "alphabetic";
        context.font = "900 17px Inter, Arial, sans-serif";
        const widgetTwelveIdY = 561;
        const widgetTwelveIdText = `ID ${resourceForSign.displayId}`;
        const widgetTwelveTargetIdWidthIncrease = 50;
        const widgetTwelveIdBaseWidth = context.measureText(widgetTwelveIdText).width;
        const widgetTwelveIdScaleX =
          widgetTwelveIdBaseWidth > 0
            ? (widgetTwelveIdBaseWidth + widgetTwelveTargetIdWidthIncrease) / widgetTwelveIdBaseWidth
            : 1;
        context.save();
        context.translate(width / 2, widgetTwelveIdY);
        context.scale(widgetTwelveIdScaleX, 1);
        context.fillText(widgetTwelveIdText, 0, 0);
        context.restore();
        const widgetTwelveHrFooter = croatianTermsText
          .replace(/Cijena\s+od\s*[\d.,]+\s*€?\s*do\s*[\d.,]+\s*€?\s*\/?\s*h\s*,?\s*/i, "")
          .replace(/obvezna\s+autorizacija/gi, "Obvezna Autorizacija")
          .trim()
          .replace(/\s+/g, " ");
        const widgetTwelveEngFooterRaw = englishTermsText
          .replace(/Price\s+from\s*€?\s*[\d.,]+\s*to\s*€?\s*[\d.,]+\s*\/?\s*h\s*,?\s*/i, "")
          .replace(/mandatory\.?\s+authorization\.?/gi, "Mandatory Auth")
          .trim()
          .replace(/\s+/g, " ");
        const operatorFooterLabel = "Operator: Indirektno";
        const hrFooterWithoutOperator = widgetTwelveHrFooter
          .replace(/Operater:\s*Indirektno,?\s*/i, "")
          .trim()
          .replace(/\s+/g, " ");
        const engFooterWithoutOperator = widgetTwelveEngFooterRaw
          .replace(/Operator:\s*Indirektno,?\s*/i, "")
          .trim()
          .replace(/\s+/g, " ");
        const normalizedHrFooterText = `${hrFooterWithoutOperator} ${engFooterWithoutOperator}`;
        context.font = "600 6.2px Inter, Arial, sans-serif";
        const footerWords = normalizedHrFooterText.split(" ");
        const footerLineHeight = 6.8;
        const footerStartY = 574;
        const footerMaxWidth = 360;
        const footerConsumeLine = (
          words: string[],
          startIndex: number,
          preferredWidth: number
        ) => {
          let index = startIndex;
          let line = "";
          while (index < words.length) {
            const candidate = line ? `${line} ${words[index]}` : words[index];
            const candidateWidth = context.measureText(candidate).width;
            if (!line) {
              line = candidate;
              index += 1;
              continue;
            }
            if (candidateWidth <= preferredWidth) {
              line = candidate;
              index += 1;
              continue;
            }
            break;
          }
          return { line, nextIndex: index };
        };
        const firstLineTargetWidth = footerMaxWidth * 0.9;
        const secondLineTargetWidth = footerMaxWidth * 0.84;
        const firstLineChunk = footerConsumeLine(footerWords, 0, firstLineTargetWidth);
        const secondLineChunk = footerConsumeLine(
          footerWords,
          firstLineChunk.nextIndex,
          secondLineTargetWidth
        );
        let firstLine = firstLineChunk.line;
        let secondLine = secondLineChunk.line;
        let thirdLine = footerWords.slice(secondLineChunk.nextIndex).join(" ");
        const removeMandatoryAuth = (line: string) =>
          line
            .replace(/\bMandatory\s+Auth\b/gi, "")
            .trim()
            .replace(/\s+/g, " ");
        firstLine = removeMandatoryAuth(firstLine);
        secondLine = removeMandatoryAuth(secondLine);
        thirdLine = removeMandatoryAuth(thirdLine);
        secondLine = `${secondLine} Mandatory Auth`.trim().replace(/\s+/g, " ");
        thirdLine = `${operatorFooterLabel} ${thirdLine}`.trim().replace(/\s+/g, " ");
        const moveLastWordToNextLine = (line: string, nextLine: string) => {
          const words = line.split(" ").filter((word) => word.length > 0);
          if (words.length <= 1) {
            return { line, nextLine };
          }
          const shifted = words.pop() ?? "";
          return {
            line: words.join(" "),
            nextLine: `${shifted} ${nextLine}`.trim().replace(/\s+/g, " "),
          };
        };
        while (context.measureText(secondLine).width >= context.measureText(firstLine).width) {
          const rebalanced = moveLastWordToNextLine(secondLine, thirdLine);
          if (rebalanced.line === secondLine) {
            break;
          }
          secondLine = rebalanced.line;
          thirdLine = rebalanced.nextLine;
        }
        while (context.measureText(thirdLine).width >= context.measureText(secondLine).width) {
          const thirdWords = thirdLine.split(" ").filter((word) => word.length > 0);
          if (thirdWords.length <= 1) {
            break;
          }
          const shifted = thirdWords.shift() ?? "";
          secondLine = `${secondLine} ${shifted}`.trim().replace(/\s+/g, " ");
          thirdLine = thirdWords.join(" ");
        }
        const footerLines = [firstLine, secondLine, thirdLine].filter((line) => line.length > 0);
        context.textAlign = "center";
        for (let i = 0; i < footerLines.length; i += 1) {
          context.fillText(footerLines[i], width / 2, footerStartY + i * footerLineHeight);
        }
      } else {
        context.fillStyle = "#111111";
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        context.font = "700 14px Inter, Arial, sans-serif";
        context.fillText(resourceForSign.displayId, 34, 593);
      }

      const normalizedExtraText = widget.extraText.trim().replace(/\s+/g, " ");
      if (normalizedExtraText && !isWidgetTwelveLike) {
        const footerDescriptionColor =
          widgetIndex === 1 ||
          widgetIndex === 4 ||
          widgetIndex === 5 ||
          widgetIndex === 6 ||
          widgetIndex === 11
            ? "#6b7280"
            : "#111111";
        context.fillStyle = footerDescriptionColor;
        context.textAlign = "left";
        context.textBaseline = "alphabetic";
        context.font = "600 7.2px Inter, Arial, sans-serif";
        const textStartX = 14;
        const maxWidth = 374;
        const words = normalizedExtraText.split(" ");
        const extraLines: string[] = [];
        let currentLine = "";
        const footerTopY = 550;
        const idBaselineY = 593;
        const extraLineHeight = 7.5;
        const maxLines = Math.max(1, Math.floor((idBaselineY - footerTopY - 2) / extraLineHeight));
        for (const word of words) {
          const candidate = currentLine ? `${currentLine} ${word}` : word;
          if (context.measureText(candidate).width <= maxWidth) {
            currentLine = candidate;
          } else {
            if (currentLine) {
              extraLines.push(currentLine);
            }
            currentLine = word;
          }
          if (extraLines.length >= maxLines) {
            break;
          }
        }
        if (currentLine && extraLines.length < maxLines) {
          extraLines.push(currentLine);
        }
        const widgetTwoFooterLift =
          widgetIndex === 1 ||
          widgetIndex === 4 ||
          widgetIndex === 5 ||
          widgetIndex === 6 ||
          widgetIndex === 11
            ? (width / 10) * 0.15
            : 0;
        const extraStartY = footerTopY + extraLineHeight - widgetTwoFooterLift;
        for (let i = 0; i < extraLines.length; i += 1) {
          context.fillText(extraLines[i], textStartX, extraStartY + i * extraLineHeight);
        }
      }

      await downloadCanvas(canvas);
    } catch (unknownError) {
      setError(
        unknownError instanceof Error
          ? unknownError.message
          : "Unable to generate downloadable sign."
      );
    } finally {
      setWidgets((current) =>
        current.map((item) => (item.id === widget.id ? { ...item, downloading: false } : item))
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#05020A] text-white">
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-10 md:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/60">
              Members
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Resources
            </h1>
            <p className="text-sm text-white/70 max-w-2xl">
              Upload multiple photos and generate separate downloadable parking signs using live
              location data.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/members"
              className="inline-flex items-center px-3 py-2 rounded-full border border-white/20 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors"
            >
              Back to Members
            </Link>
          </div>
        </div>

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
            Loading resources...
          </div>
        )}

        {!loading && !canAccess && (
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-4 space-y-2">
            <p className="text-sm text-red-100">
              This page is restricted to admin and manager accounts.
            </p>
            {!user && (
              <Link href="/members" className="text-xs underline underline-offset-2">
                Sign in on Members
              </Link>
            )}
            {user && (
              <p className="text-xs text-red-200/90">
                Signed in as {userEmail}. Your role does not have access.
              </p>
            )}
          </div>
        )}

        {!loading && canAccess && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/75">Create as many sign widgets as you need.</p>
              <button
                type="button"
                onClick={createWidget}
                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-white/90 transition-colors"
              >
                + Upload New Photo
              </button>
            </div>
            {widgets.map((widget, index) => {
              const isWidgetFive = index === 4;
              const isWidgetSix = index === 5;
              const isWidgetSeven = index === 6;
              const isWidgetNine = index === 8;
              const isWidgetTen = index === 9;
              const isWidgetEleven = index === 10;
              const isWidgetTwelve = index === 11;
              const isWidgetFourteen = index === 13;
              const isWidgetTwelveLike = isWidgetTwelve || isWidgetFourteen;
              const isGuestParkingWidget = isWidgetFive || isWidgetSix || isWidgetSeven;
              const isUploadLocked = isGuestParkingWidget || isWidgetNine || isWidgetEleven;
              const isWidgetThreeOrFour = index === 2 || index === 3;
              const normalizedGuestParkingMinutes =
                widget.guestParkingMinutes.replace(/\D+/g, "").replace(/^0+/, "") || "90";
              const widgetFiveTitle = `Gosti Besplatno ${normalizedGuestParkingMinutes} m. / Guests Free ${normalizedGuestParkingMinutes} m.`;
              const widgetSixTitle = "Parking za Goste / Guests Only";
              const widgetSevenTitle = "Cijena:0.1€/sat-3.9€/sat / Price:0.1€/h-3.9€/h";
              const selectedLocation =
                sortedLocations.find((item) => item.id === widget.selectedLocationId) ?? null;
              const effectiveTemplateUrl =
                isGuestParkingWidget
                  ? secondWidgetEffectiveTemplateUrl
                  : isWidgetNine || isWidgetEleven
                  ? eighthWidgetEffectiveTemplateUrl
                  : isWidgetThreeOrFour
                  ? widget.templateUrl
                  : widget.templateUrl ||
                    selectedLocation?.payableSignTemplateUrl ||
                    selectedLocation?.locationTemplateUrl ||
                    "";
              return (
                <div
                  key={widget.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 md:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <p className="text-sm font-semibold text-white">Widget {index + 1}</p>
                    <div className="flex items-center gap-2">
                      {widget.templateUrl && !isUploadLocked && (
                        <button
                          type="button"
                          onClick={() => handleRemoveWidgetTemplate(widget.id)}
                          disabled={widget.uploading || widget.downloading}
                          className="inline-flex items-center justify-center rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition-colors disabled:opacity-60"
                        >
                          Delete Uploaded Photo
                        </button>
                      )}
                      <label
                        className={`inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                          isUploadLocked
                            ? "cursor-not-allowed bg-white/20 text-white/60"
                            : "cursor-pointer bg-white text-black hover:bg-white/90"
                        }`}
                      >
                        {widget.uploading ? "Uploading..." : "Upload Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => handleWidgetTemplateUpload(widget.id, event)}
                          disabled={widget.uploading || isUploadLocked}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  {isWidgetTen && (
                    <p className="text-[11px] text-white/65">
                      This widget is optimized for high-resolution images. Large files will be compressed to fit automatically.
                    </p>
                  )}
                  {(isGuestParkingWidget || isWidgetNine || isWidgetEleven || isWidgetTwelveLike) && (
                    <p className="text-[11px] text-white/65">
                      {isWidgetFive
                        ? "Widget 5 always uses Widget 2 template for the final output."
                        : isWidgetSix
                        ? "Widget 6 always uses Widget 2 template for the final output."
                        : isWidgetSeven
                        ? "Widget 7 always uses Widget 2 template for the final output."
                        : isWidgetEleven
                        ? "Widget 11 always uses Widget 8 template and replaces Airport with Safe."
                        : isWidgetFourteen
                        ? "Widget 14 matches Widget 12 logic and output content, but exports in 50x100 ratio."
                        : isWidgetTwelve
                        ? "Widget 12 uses its own uploaded photo, keeps location ID + QR + HR/ENG footer, and has no top title."
                        : "Widget 9 always uses Widget 8 template for the final output."}
                    </p>
                  )}
                  {effectiveTemplateUrl ? (
                    <div className="space-y-3">
                      <NextImage
                        src={effectiveTemplateUrl}
                        alt={`Uploaded photo for widget ${index + 1}`}
                        width={1200}
                        height={800}
                        loader={({ src }) => src}
                        unoptimized
                        className="w-full h-auto max-w-md rounded-xl border border-white/15"
                      />
                      <a
                        href={effectiveTemplateUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-white/75 underline underline-offset-2 break-all"
                      >
                        {effectiveTemplateUrl}
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/55">No photo uploaded yet.</p>
                  )}
                  {sortedLocations.length > 0 ? (
                    <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                      <label className="space-y-1 block">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                          Location
                        </span>
                        <select
                          value={widget.selectedLocationId}
                          onChange={(event) =>
                            setWidgets((current) =>
                              current.map((item) =>
                                item.id === widget.id
                                  ? { ...item, selectedLocationId: event.target.value }
                                  : item
                              )
                            )
                          }
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                        >
                          {sortedLocations.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} • {item.displayId}
                            </option>
                          ))}
                        </select>
                      </label>
                      {selectedLocation && (
                        <div className="space-y-1 text-[11px] text-white/75">
                          <p>
                            Top title:{" "}
                            <span className="text-white">
                              {isWidgetFive
                                ? widgetFiveTitle
                                : isWidgetSix
                                ? widgetSixTitle
                                : isWidgetSeven
                                ? widgetSevenTitle
                                : isWidgetTwelveLike
                                ? "No title"
                                : selectedLocation.name}
                            </span>
                          </p>
                          <p>
                            Bottom left:{" "}
                            <span className="text-white">
                              ID {selectedLocation.displayId} LOT {selectedLocation.id}
                            </span>
                          </p>
                          <p>
                            Price in QR:{" "}
                            <span className="text-white">
                              {selectedLocation.signPrice != null
                                ? `€${selectedLocation.signPrice.toFixed(2)}`
                                : "Auto"}
                            </span>
                          </p>
                        </div>
                      )}
                      <label className="space-y-1 block">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                          File name
                        </span>
                        <input
                          type="text"
                          value={widget.fileName}
                          onChange={(event) =>
                            setWidgets((current) =>
                              current.map((item) =>
                                item.id === widget.id ? { ...item, fileName: event.target.value } : item
                              )
                            )
                          }
                          placeholder="Safe Parking Eng"
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                        />
                      </label>
                      {isWidgetTen && (
                        <>
                          <label className="space-y-1 block">
                            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                              User Name
                            </span>
                            <input
                              type="text"
                              value={widget.userName || ""}
                              onChange={(event) =>
                                setWidgets((current) =>
                                  current.map((item) =>
                                    item.id === widget.id
                                      ? { ...item, userName: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Luka Janić"
                              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                            />
                          </label>
                          <label className="space-y-1 block">
                            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                              User ID
                            </span>
                            <input
                              type="text"
                              value={widget.userIdNumber || ""}
                              onChange={(event) =>
                                setWidgets((current) =>
                                  current.map((item) =>
                                    item.id === widget.id
                                      ? { ...item, userIdNumber: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="98197"
                              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                            />
                          </label>
                          <label className="space-y-1 block">
                            <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                              Role
                            </span>
                            <input
                              type="text"
                              value={widget.userRole || ""}
                              onChange={(event) =>
                                setWidgets((current) =>
                                  current.map((item) =>
                                    item.id === widget.id
                                      ? { ...item, userRole: event.target.value }
                                      : item
                                  )
                                )
                              }
                              placeholder="Delivry Partner"
                              className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                            />
                          </label>
                        </>
                      )}
                      {isWidgetFive && (
                        <label className="space-y-1 block">
                          <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                            Guest parking minutes
                          </span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={widget.guestParkingMinutes}
                            onChange={(event) => {
                              const nextValue =
                                event.target.value.replace(/\D+/g, "").replace(/^0+/, "") || "90";
                              setWidgets((current) =>
                                current.map((item) =>
                                  item.id === widget.id
                                    ? { ...item, guestParkingMinutes: nextValue }
                                    : item
                                )
                              );
                            }}
                            placeholder="90"
                            className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
                          />
                        </label>
                      )}
                      <label className="space-y-1 block">
                        <span className="text-[11px] uppercase tracking-[0.16em] text-white/60">
                          Extra text
                        </span>
                        <textarea
                          value={widget.extraText}
                          onChange={(event) =>
                            setWidgets((current) =>
                              current.map((item) =>
                                item.id === widget.id ? { ...item, extraText: event.target.value } : item
                              )
                            )
                          }
                          placeholder="Add extra text for this widget"
                          rows={3}
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40 resize-y"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDownloadSign(widget, selectedLocation, index)}
                        disabled={widget.downloading}
                        className="inline-flex items-center rounded-full border border-white/25 px-4 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition-colors disabled:opacity-60"
                      >
                        {widget.downloading ? "Preparing..." : "Download Sign"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/55">No locations available yet.</p>
                  )}
                </div>
              );
            })}

            {error && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
