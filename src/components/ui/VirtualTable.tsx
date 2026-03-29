import { useRef, useState, useEffect, useCallback, ReactNode } from "react";

interface VirtualTableProps<T> {
  data: T[];
  rowHeight?: number;
  containerHeight?: number;
  renderRow: (item: T, index: number) => ReactNode;
  renderHeader: () => ReactNode;
  overscan?: number;
}

export function VirtualTable<T>({
  data,
  rowHeight = 52,
  containerHeight = 600,
  renderRow,
  renderHeader,
  overscan = 5,
}: VirtualTableProps<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      setScrollTop(scrollRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const totalHeight = data.length * rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(data.length - 1, startIndex + visibleCount);

  const visibleItems = data.slice(startIndex, endIndex + 1);
  const paddingTop = startIndex * rowHeight;
  const paddingBottom = Math.max(0, (data.length - endIndex - 1) * rowHeight);

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Fixed header */}
      <div className="sticky top-0 z-10 bg-gray-50 border-b">
        <table className="w-full">
          <thead>{renderHeader()}</thead>
        </table>
      </div>

      {/* Scrollable body */}
      <div
        ref={scrollRef}
        style={{ height: containerHeight, overflowY: "auto" }}
      >
        <table className="w-full">
          <tbody>
            {/* Top padding spacer */}
            {paddingTop > 0 && (
              <tr>
                <td style={{ height: paddingTop, padding: 0 }} />
              </tr>
            )}

            {visibleItems.map((item, i) =>
              renderRow(item, startIndex + i)
            )}

            {/* Bottom padding spacer */}
            {paddingBottom > 0 && (
              <tr>
                <td style={{ height: paddingBottom, padding: 0 }} />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Row count footer */}
      <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-400">
        {data.length.toLocaleString()} rows
      </div>
    </div>
  );
}
