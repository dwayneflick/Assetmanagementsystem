import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { projectId, publicAnonKey } from "../utils/supabase/info";

interface WarrantyAsset {
  id: string;
  assetName: string;
  serviceTag: string;
  warrantyExpiry: string;
  department?: string;
}

export default function WarrantyAlerts() {
  const [expiring, setExpiring] = useState<WarrantyAsset[]>([]);
  const [expired, setExpired] = useState<WarrantyAsset[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const apiBase = `https://${projectId}.supabase.co/functions/v1/make-server-5921d82e`;
  const headers = { Authorization: `Bearer ${publicAnonKey}` };

  useEffect(() => {
    fetchWarrantyData();
  }, []);

  async function fetchWarrantyData() {
    try {
      const res = await fetch(`${apiBase}/assets`, { headers });
      const data = await res.json();
      const assets: WarrantyAsset[] = (data.assets || []).filter(
        (a: any) => a.warrantyExpiry
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      const past90Days = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);

      const expiringList = assets
        .filter((a) => {
          const d = new Date(a.warrantyExpiry);
          return d >= today && d <= in30Days;
        })
        .sort(
          (a, b) =>
            new Date(a.warrantyExpiry).getTime() -
            new Date(b.warrantyExpiry).getTime()
        );

      const expiredList = assets
        .filter((a) => {
          const d = new Date(a.warrantyExpiry);
          return d < today && d >= past90Days;
        })
        .sort(
          (a, b) =>
            new Date(b.warrantyExpiry).getTime() -
            new Date(a.warrantyExpiry).getTime()
        );

      setExpiring(expiringList);
      setExpired(expiredList);
    } catch (err) {
      console.error("Warranty fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  function dismiss(id: string) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function daysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  function daysSince(dateStr: string) {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  const visibleExpiring = expiring.filter((a) => !dismissed.has(a.id));
  const visibleExpired = expired.filter((a) => !dismissed.has(a.id));

  if (loading || (visibleExpiring.length === 0 && visibleExpired.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-3 mb-6">
      {/* Expiring Soon */}
      {visibleExpiring.map((asset) => {
        const days = daysUntil(asset.warrantyExpiry);
        const urgency = days <= 7 ? "red" : days <= 14 ? "orange" : "yellow";
        const colors = {
          red: "bg-red-50 border-red-300 text-red-900",
          orange: "bg-orange-50 border-orange-300 text-orange-900",
          yellow: "bg-yellow-50 border-yellow-300 text-yellow-900",
        };
        const iconColors = {
          red: "text-red-500",
          orange: "text-orange-500",
          yellow: "text-yellow-500",
        };

        return (
          <div
            key={asset.id}
            className={`flex items-start gap-3 p-4 rounded-lg border ${colors[urgency]}`}
          >
            <AlertTriangle
              className={`w-5 h-5 mt-0.5 shrink-0 ${iconColors[urgency]}`}
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                Warranty expiring in {days} day{days !== 1 ? "s" : ""}
              </p>
              <p className="text-sm mt-0.5">
                <span className="font-mono">{asset.serviceTag}</span>
                {" — "}
                {asset.assetName}
                {asset.department && (
                  <span className="text-xs opacity-70 ml-2">
                    ({asset.department})
                  </span>
                )}
              </p>
              <p className="text-xs mt-1 opacity-70">
                Expires:{" "}
                {new Date(asset.warrantyExpiry).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => dismiss(asset.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {/* Already Expired */}
      {visibleExpired.map((asset) => {
        const days = daysSince(asset.warrantyExpiry);
        return (
          <div
            key={asset.id}
            className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50 border-gray-300 text-gray-700"
          >
            <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-gray-500" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">
                Warranty expired {days} day{days !== 1 ? "s" : ""} ago
              </p>
              <p className="text-sm mt-0.5">
                <span className="font-mono">{asset.serviceTag}</span>
                {" — "}
                {asset.assetName}
                {asset.department && (
                  <span className="text-xs opacity-70 ml-2">
                    ({asset.department})
                  </span>
                )}
              </p>
              <p className="text-xs mt-1 opacity-70">
                Expired:{" "}
                {new Date(asset.warrantyExpiry).toLocaleDateString("en-NG", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <button
              onClick={() => dismiss(asset.id)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
