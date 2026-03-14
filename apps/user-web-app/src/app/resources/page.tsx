'use client';

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, supabaseUrl, isSupabaseConfigured } from "@/lib/supabase";

type LocationRow = {
  id: string;
  name: string | null;
  display_id: string | null;
  verification_metadata: Record<string, unknown> | null;
  enforcement_pricing_mode: string | null;
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
  selectedLocationId: string;
  uploading: boolean;
  downloading: boolean;
};

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
}) {
  if (!supabaseUrl) {
    return "";
  }
  const base = `${supabaseUrl}/functions/v1/create-checkout`;
  const query = new URLSearchParams({
    location_id: params.locationId,
    display_id: params.displayId,
    type: params.type,
    t: Date.now().toString(),
  });
  if (typeof params.price === "number") {
    const normalized = params.price < 0 ? 0 : params.price;
    query.set("price", normalized.toFixed(2));
    query.set("amount", normalized.toFixed(2));
    query.set("amount_cents", String(Math.round(normalized * 100)));
  }
  return `${base}?${query.toString()}`;
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

export default function ResourcesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [roleState, setRoleState] = useState<RoleState>("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [locations, setLocations] = useState<ResourceLocation[]>([]);
  const [widgets, setWidgets] = useState<SignWidget[]>([
    {
      id: `widget-${Date.now()}`,
      templateUrl: "",
      fileName: "Safe Parking Eng",
      extraText: "",
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
    {
      id: `widget-${Date.now()}-2`,
      templateUrl: "",
      fileName: "Safe Parking Eng Terms",
      extraText: bilingualTermsText,
      selectedLocationId: "",
      uploading: false,
      downloading: false,
    },
  ]);

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
          return {
            id: row.id,
            name: row.name || `Lot ${displayId}`,
            displayId,
            pricingMode,
            signPrice,
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
      if (
        secondWidget.templateUrl === nextSecondTemplateUrl &&
        secondWidget.selectedLocationId === nextSecondLocationId
      ) {
        return current;
      }
      const next = [...current];
      next[1] = {
        ...secondWidget,
        templateUrl: nextSecondTemplateUrl,
        selectedLocationId: nextSecondLocationId,
      };
      return next;
    });
  }, [firstWidgetLocationId, firstWidgetTemplateUrl]);

  function createWidget() {
    setWidgets((current) => [
      ...current,
      {
        id: `widget-${Date.now()}-${Math.round(Math.random() * 100000)}`,
        templateUrl: "",
        fileName: `Safe Parking ${current.length + 1}`,
        extraText: "",
        selectedLocationId: sortedLocations[0]?.id ?? "",
        uploading: false,
        downloading: false,
      },
    ]);
  }

  async function uploadTemplateToStorage(
    file: File,
    storagePath: string
  ): Promise<string> {
    if (!supabase) {
      throw new Error("Supabase client unavailable.");
    }
    const { error: uploadError } = await supabase.storage
      .from("location-verification")
      .upload(storagePath, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
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
      const uploadedUrl = await uploadTemplateToStorage(
        file,
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

  async function handleDownloadSign(widget: SignWidget, resource: ResourceLocation | null) {
    if (!resource) {
      setError("Select a location before downloading sign.");
      return;
    }
    const templateUrl =
      widget.templateUrl || resource.payableSignTemplateUrl || resource.locationTemplateUrl;
    if (!templateUrl) {
      setError("Upload a payable sign template before downloading sign.");
      return;
    }
    setWidgets((current) =>
      current.map((item) => (item.id === widget.id ? { ...item, downloading: true } : item))
    );
    setError("");
    try {
      const width = 400;
      const height = 600;
      const outputScale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * outputScale;
      canvas.height = height * outputScale;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to render sign canvas.");
      }
      context.scale(outputScale, outputScale);
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";

      const checkoutUrl = buildCheckoutQrUrl({
        locationId: resource.id,
        displayId: resource.displayId,
        type: resource.pricingMode,
        price: resource.signPrice,
      });

      const [templateImage, qrImage] = await Promise.all([
        loadImage(templateUrl),
        loadImage(
          `https://api.qrserver.com/v1/create-qr-code/?size=300x300&qzone=0&data=${encodeURIComponent(checkoutUrl)}`
        ),
      ]);

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

      const titleLines = splitSignTitle(resource.name);
      context.fillStyle = "#111111";
      context.textAlign = "center";
      context.textBaseline = "middle";
      const titleFont = "900 34px Montserrat, Inter, Arial, sans-serif";
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

      const qrBoxSize = 180;
      const qrSize = 104;
      const qrCenterX = width / 2;
      const qrCenterY = 363;
      const qrX = qrCenterX - qrBoxSize / 2;
      const qrY = qrCenterY - qrBoxSize / 2;
      const qrDrawX = qrX + (qrBoxSize - qrSize) / 2;
      const qrDrawY = qrY + (qrBoxSize - qrSize) / 2;
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
      const moduleCount = Math.min(33, Math.max(21, inferredModuleCount));
      const moduleDraw = qrSize / moduleCount;
      const qrMarkColor = "#000000";
      const finderMarkColor = qrMarkColor;
      const markSize = Math.max(1, Math.round(moduleDraw * 0.66));
      context.fillStyle = qrMarkColor;
      for (let row = 0; row < moduleCount; row += 1) {
        for (let column = 0; column < moduleCount; column += 1) {
          const sampleX = Math.floor(((column + 0.5) * qrSampleSize) / moduleCount);
          const sampleY = Math.floor(((row + 0.5) * qrSampleSize) / moduleCount);
          if (!isDark(sampleX, sampleY)) {
            continue;
          }
          const drawX = Math.round(qrDrawX + column * moduleDraw + (moduleDraw - markSize) / 2);
          const drawY = Math.round(qrDrawY + row * moduleDraw + (moduleDraw - markSize) / 2);
          context.fillRect(drawX, drawY, markSize, markSize);
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
      const finderOuter = 12;
      const finderInner = 5;
      const finderRadiusOuter = 3;
      const finderRadiusInner = 1.8;
      const finderMask = 16;
      const finderMaskRadius = 4;
      const finderMaskInset = (finderMask - finderOuter) / 2;
      const drawFinderReplacement = (x: number, y: number) => {
        drawRoundedRect(
          x - finderMaskInset,
          y - finderMaskInset,
          finderMask,
          finderMaskRadius,
          "#ffffff"
        );
        drawRoundedRect(x, y, finderOuter, finderRadiusOuter, "#ffffff", finderMarkColor, 2.4);
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

      const logoBgSize = 30;
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

      context.fillStyle = "#111111";
      context.textAlign = "left";
      context.textBaseline = "alphabetic";
      context.font = "700 14px Inter, Arial, sans-serif";
      context.fillText(resource.displayId, 34, 593);
      const normalizedExtraText = widget.extraText.trim().replace(/\s+/g, " ");
      if (normalizedExtraText) {
        context.fillStyle = "#111111";
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
        const extraStartY = footerTopY + extraLineHeight;
        for (let i = 0; i < extraLines.length; i += 1) {
          context.fillText(extraLines[i], textStartX, extraStartY + i * extraLineHeight);
        }
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((fileBlob) => {
          if (!fileBlob) {
            reject(new Error("Unable to export sign image."));
            return;
          }
          resolve(fileBlob);
        }, "image/png");
      });
      const normalizedBaseName = widget.fileName
        .trim()
        .replaceAll(/[\\/:*?"<>|]/g, "")
        .replaceAll(/\s+/g, " ");
      const fallbackBaseName = `parking_sign_${resource.displayId}`;
      const finalBaseName = normalizedBaseName || fallbackBaseName;
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${finalBaseName}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
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
              const selectedLocation =
                sortedLocations.find((item) => item.id === widget.selectedLocationId) ?? null;
              const effectiveTemplateUrl =
                widget.templateUrl ||
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
                    <label className="inline-flex cursor-pointer items-center justify-center px-4 py-2 rounded-full bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors">
                      {widget.uploading ? "Uploading..." : "Upload Photo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleWidgetTemplateUpload(widget.id, event)}
                        disabled={widget.uploading}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {effectiveTemplateUrl ? (
                    <div className="space-y-3">
                      <img
                        src={effectiveTemplateUrl}
                        alt={`Uploaded photo for widget ${index + 1}`}
                        className="w-full max-w-md rounded-xl border border-white/15"
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
                            Top title: <span className="text-white">{selectedLocation.name}</span>
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
                        onClick={() => handleDownloadSign(widget, selectedLocation)}
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
