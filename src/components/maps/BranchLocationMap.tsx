import { useState, useEffect, useCallback } from "react";
import {
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  MapMouseEvent,
  useMap,
  useAdvancedMarkerRef,
} from "@vis.gl/react-google-maps";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import {
  MapPin,
  Navigation,
  Crosshair,
  Check,
  Edit3,
  RotateCcw,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getBranchCoordinates } from "@/data/branchesData";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export interface BranchLocationMapProps {
  branchId?: string;
  branchName: string;
  address: string;
  city?: string;
  operatingHours?: string;
  latitude?: number | null;
  longitude?: number | null;
  editable?: boolean;
  canAdminEditInline?: boolean;
  heightClass?: string;
  heightPx?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  onSaveLocation?: (lat: number, lng: number) => Promise<void>;
}

function resolveHeightPx(heightPx?: number, heightClass?: string): number {
  if (typeof heightPx === "number" && heightPx > 0) return heightPx;
  if (!heightClass) return 220;
  if (heightClass.includes("h-80")) return 320;
  if (heightClass.includes("h-72")) return 288;
  if (heightClass.includes("h-64")) return 256;
  if (heightClass.includes("h-60")) return 240;
  if (heightClass.includes("h-56")) return 224;
  if (heightClass.includes("h-52")) return 216;
  if (heightClass.includes("h-48")) return 220;
  if (heightClass.includes("h-44")) return 220;
  return 220;
}

/**
 * Keeps Google Map camera centered on branch updates and forces a resize/paint
 * after mobile drawer slide-in animations finish (prevents 0x0 / blank map in WebView).
 */
function MapCameraSync({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const syncMap = () => {
      try {
        const g = (window as any).google;
        if (g?.maps?.event) {
          g.maps.event.trigger(map, "resize");
        }
        map.panTo(center);
      } catch {
        // Ignore if map unmounted during drawer close
      }
    };

    syncMap();
    const t1 = window.setTimeout(syncMap, 180);
    const t2 = window.setTimeout(syncMap, 450);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map, center.lat, center.lng]);

  return null;
}

export default function BranchLocationMap({
  branchId,
  branchName,
  address,
  city,
  operatingHours,
  latitude,
  longitude,
  editable = false,
  canAdminEditInline = false,
  heightClass = "h-48",
  heightPx,
  onLocationChange,
  onSaveLocation,
}: BranchLocationMapProps) {
  const defaultCoords = getBranchCoordinates({
    id: branchId,
    city,
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
  });

  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number }>(defaultCoords);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(defaultCoords);
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(editable);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapAuthFailed, setMapAuthFailed] = useState(false);
  const [markerRef, markerInstance] = useAdvancedMarkerRef();

  const resolvedHeight = resolveHeightPx(heightPx, heightClass);

  useEffect(() => {
    const nextCoords = getBranchCoordinates({
      id: branchId,
      city,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
    setMarkerPos(nextCoords);
    setMapCenter(nextCoords);
    setShowInfo(false);
  }, [branchId, city, latitude, longitude]);

  useEffect(() => {
    setIsEditingPin(editable);
  }, [editable]);

  useEffect(() => {
    const handleAuthFailure = () => setMapAuthFailed(true);
    window.addEventListener("gmp-auth-failure", handleAuthFailure);
    return () => window.removeEventListener("gmp-auth-failure", handleAuthFailure);
  }, []);

  const updateCoordinates = useCallback(
    (lat: number, lng: number) => {
      const roundedLat = Number(lat.toFixed(6));
      const roundedLng = Number(lng.toFixed(6));
      setMarkerPos({ lat: roundedLat, lng: roundedLng });
      onLocationChange?.(roundedLat, roundedLng);
    },
    [onLocationChange]
  );

  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (!isEditingPin) return;
      const latLng = event.detail.latLng;
      if (latLng) {
        updateCoordinates(latLng.lat, latLng.lng);
      }
    },
    [isEditingPin, updateCoordinates]
  );

  const handleUseCurrentGps = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        updateCoordinates(lat, lng);
        setMapCenter({ lat, lng });
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleResetDefault = () => {
    const fallback = getBranchCoordinates({ id: branchId, city });
    updateCoordinates(fallback.lat, fallback.lng);
    setMapCenter(fallback);
  };

  const handleSaveInline = async () => {
    if (!onSaveLocation) return;
    setIsSaving(true);
    try {
      await onSaveLocation(markerPos.lat, markerPos.lng);
      if (!editable) {
        setIsEditingPin(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${markerPos.lat},${markerPos.lng}`;
  const searchMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${branchName}, ${address}`
  )}`;

  const openExternalMap = async (e: React.MouseEvent, url: string) => {
    if (Capacitor.isNativePlatform()) {
      e.preventDefault();
      try {
        await Browser.open({ url });
      } catch {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    }
  };

  const canRenderInteractiveMap = Boolean(GOOGLE_MAPS_API_KEY) && !mapAuthFailed;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 overflow-hidden shadow-xs">
      {/* Map Top Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-gray-100">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-3 h-3 text-primary" />
          </div>
          <div className="truncate">
            <span className="text-xs font-semibold text-gray-900">
              {isEditingPin ? "Pin Exact Branch Location" : "Branch Map & Directions"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {canAdminEditInline && !editable && (
            <button
              type="button"
              onClick={() => setIsEditingPin((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Edit3 className="w-2.5 h-2.5" />
              {isEditingPin ? "Cancel Pin" : "Set Pin"}
            </button>
          )}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => openExternalMap(e, directionsUrl)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
          >
            <Navigation className="w-2.5 h-2.5" />
            Directions
          </a>
        </div>
      </div>

      {/* Admin Editing Helper Banner */}
      {isEditingPin && (
        <div className="px-3 py-2 bg-amber-50/90 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] text-amber-900 font-medium">
            Tap anywhere on the map or drag the red pin to point the exact branch location.
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUseCurrentGps}
              disabled={isLocating}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              {isLocating ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <Crosshair className="w-2.5 h-2.5 text-primary" />
              )}
              Use GPS
            </button>
            <button
              type="button"
              onClick={handleResetDefault}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Map Container with Explicit Pixel Height & data-vaul-no-drag for Mobile Drawers */}
      <div
        data-vaul-no-drag
        className="relative w-full bg-slate-100 touch-none"
        style={{ height: `${resolvedHeight}px`, minHeight: `${resolvedHeight}px` }}
      >
        {canRenderInteractiveMap ? (
          <GoogleMap
            style={{ width: "100%", height: "100%", minHeight: `${resolvedHeight}px` }}
            defaultCenter={mapCenter}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            zoomControl={true}
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={true}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
            onClick={handleMapClick}
          >
            <MapCameraSync center={mapCenter} />

            <AdvancedMarker
              ref={markerRef}
              position={markerPos}
              draggable={isEditingPin}
              title={branchName || "Aboki BDC Branch"}
              onClick={() => setShowInfo((prev) => !prev)}
              onDragEnd={(e) => {
                if (e.latLng) {
                  updateCoordinates(e.latLng.lat(), e.latLng.lng());
                }
              }}
            >
              <Pin
                background="#dc2626"
                glyphColor="#ffffff"
                borderColor="#7f1d1d"
                scale={1.15}
              />
            </AdvancedMarker>

            {showInfo && !isEditingPin && markerInstance && (
              <InfoWindow
                anchor={markerInstance}
                onCloseClick={() => setShowInfo(false)}
                maxWidth={210}
              >
                <div className="p-0.5">
                  <p className="text-xs font-bold text-gray-900 leading-tight">
                    {branchName || "Aboki BDC Branch"}
                  </p>
                  <p className="text-[10px] text-gray-600 mt-0.5 leading-snug">
                    {address}
                  </p>
                  {operatingHours && (
                    <p className="text-[9px] text-emerald-700 font-medium mt-1">
                      {operatingHours}
                    </p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-100">
            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-2">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-bold text-gray-900">{branchName}</p>
            <p className="text-[11px] text-gray-600 max-w-xs mt-0.5 line-clamp-2">
              {address}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openExternalMap(e, directionsUrl)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions
              </a>
              <a
                href={searchMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => openExternalMap(e, searchMapUrl)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 text-xs font-medium hover:bg-gray-50 transition-colors"
              >
                Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Footer Bar with Coordinates & Quick Actions */}
      <div className="px-3 py-2 bg-white border-t border-gray-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
          <span>
            {markerPos.lat.toFixed(5)}° N, {markerPos.lng.toFixed(5)}° E
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isEditingPin && onSaveLocation ? (
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={handleSaveInline}
              className="h-7 px-2.5 text-[11px] bg-primary hover:bg-primary/90 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Save Pin Location
                </>
              )}
            </Button>
          ) : (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => openExternalMap(e, directionsUrl)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-700 hover:text-primary transition-colors"
            >
              <span>Navigate to Branch</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
