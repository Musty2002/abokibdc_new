import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  MapMouseEvent,
} from "@vis.gl/react-google-maps";
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
  onLocationChange?: (lat: number, lng: number) => void;
  onSaveLocation?: (lat: number, lng: number) => Promise<void>;
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
  const [showInfo, setShowInfo] = useState(true);
  const [isEditingPin, setIsEditingPin] = useState(editable);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    const nextCoords = getBranchCoordinates({
      id: branchId,
      city,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    });
    setMarkerPos(nextCoords);
    setMapCenter(nextCoords);
  }, [branchId, city, latitude, longitude]);

  useEffect(() => {
    setIsEditingPin(editable);
  }, [editable]);

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

      {/* Map Container with Explicit Height */}
      <div className={`relative w-full ${heightClass} bg-slate-100`}>
        {GOOGLE_MAPS_API_KEY ? (
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              style={{ width: "100%", height: "100%" }}
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
              <AdvancedMarker
                position={markerPos}
                draggable={isEditingPin}
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
                  scale={1.1}
                />
              </AdvancedMarker>

              {showInfo && !isEditingPin && (
                <InfoWindow
                  position={markerPos}
                  onCloseClick={() => setShowInfo(false)}
                  pixelOffset={[0, -34]}
                >
                  <div className="max-w-[200px] p-0.5">
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
          </APIProvider>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-slate-100">
            <MapPin className="w-7 h-7 text-primary mb-1.5" />
            <p className="text-xs font-semibold text-gray-800">{branchName}</p>
            <p className="text-[11px] text-gray-500 max-w-xs mt-0.5">{address}</p>
            <a
              href={searchMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary underline"
            >
              Open in Google Maps <ExternalLink className="w-3 h-3" />
            </a>
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
