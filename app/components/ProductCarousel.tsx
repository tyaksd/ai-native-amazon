'use client'

import OptimizedImage from "@/app/components/OptimizedImage";
import Link from "next/link";
import { Product } from "@/lib/data";
import { useEffect, useRef } from "react";
import FavoriteButton from '@/app/components/FavoriteButton';
import { useFavorites } from '@/lib/useFavorites';

function formatUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

type ProductCarouselProps = {
  products: Product[];
  title?: string;
  brandId?: string;
};

export default function ProductCarousel({ products, title = "You might also like", brandId }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);
  const resumeTimerRef = useRef<number | null>(null);
  const dragThreshold = 5; // Threshold to distinguish drag from click (pixels)
  const linkDragStartRef = useRef<{ x: number; y: number; productId: string } | null>(null);
  const wasDraggingRef = useRef<{ [key: string]: boolean }>({});
  
  // Use the favorites hook
  const { isFavorited, checkFavorites } = useFavorites()

  // Check favorites when products change
  useEffect(() => {
    if (products.length > 0) {
      checkFavorites(products.map(p => p.id))
    }
  }, [products, checkFavorites])

  useEffect(() => {
    if (products.length === 0) return;
    const el = scrollContainerRef.current;
    if (!el) return;

    let rafId = 0;
    let scrollPosition = el.scrollLeft || 0;
    const SPEED = 0.6; // Auto scroll speed (px/frame)

    const animate = () => {
      // Half of total width including duplicates = one full cycle of original set
      const originalWidth = (el.scrollWidth || 0) / 2;

      if (originalWidth > 0) {
        if (!isPausedRef.current) {
          scrollPosition += SPEED;
          if (scrollPosition >= originalWidth) scrollPosition -= originalWidth;
          el.scrollLeft = scrollPosition;
        } else {
          // Use current position as reference during user interaction
          const mod = el.scrollLeft % originalWidth;
          scrollPosition = mod >= 0 ? mod : mod + originalWidth;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    // Stop when tab is hidden (power saving)
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // User interaction handlers
    const pauseAuto = () => {
      isPausedRef.current = true;
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const resumeAutoAfterIdle = (ms = 1200) => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        isPausedRef.current = false;
      }, ms);
    };

    const onWheel = () => {
      pauseAuto();
      resumeAutoAfterIdle();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!el) return;
      // Check if the target is a link or inside a link
      const target = e.target as HTMLElement;
      const isLink = target.closest('a');
      if (isLink) {
        // Don't interfere with link clicks - let the link handle it
        return;
      }
      pauseAuto();
      isDraggingRef.current = false; // Not dragging initially
      el.setPointerCapture(e.pointerId);
      dragStartXRef.current = e.clientX;
      dragStartScrollLeftRef.current = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!el) return;
      // Check if the target is a link or inside a link
      const target = e.target as HTMLElement;
      const isLink = target.closest('a');
      if (isLink) {
        // Don't interfere with link interactions
        return;
      }
      const dx = Math.abs(e.clientX - dragStartXRef.current);
      
      // Start dragging only when threshold is exceeded
      if (dx > dragThreshold && !isDraggingRef.current) {
        isDraggingRef.current = true;
        (el as HTMLElement).style.cursor = 'grabbing';
      }
      
      if (isDraggingRef.current) {
        const deltaX = e.clientX - dragStartXRef.current;
        el.scrollLeft = dragStartScrollLeftRef.current - deltaX;
      }
    };

    const endDrag = (e?: PointerEvent) => {
      if (!el) return;
      const wasDragging = isDraggingRef.current;
      isDraggingRef.current = false;
      (el as HTMLElement).style.cursor = '';
      if (e) {
        try { el.releasePointerCapture(e.pointerId); } catch {}
      }
      
      // Enable link only if not dragging
      if (!wasDragging) {
        // Delay a bit to allow click event
        setTimeout(() => {
          resumeAutoAfterIdle();
        }, 10);
      } else {
        resumeAutoAfterIdle();
      }
    };

    el.addEventListener('wheel', onWheel, { passive: true });
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // No additional processing needed as originalWidth is referenced every frame even if width changes due to image load or resize
    rafId = requestAnimationFrame(animate); // Immediate start

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener('visibilitychange', onVisibility);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', endDrag);
      el.removeEventListener('pointercancel', endDrag);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
    };
  }, [products]);

  if (products.length === 0) return null;

  return (
    <div className="mt-1">
      <div className="flex items-center gap-4 mb-6 ml-3 mt-4 pt-4">
        <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
        {brandId && (
          <Link 
            href={`/${brandId}`}
            className="text-white hover:text-gray-200 text-sm font-medium underline"
          >
            brand page
          </Link>
        )}
      </div>
      <div className="relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide pb-4 cursor-grab"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Original set */}
          {products.map((product) => (
            <div key={product.id} className="group relative flex-shrink-0 w-48 sm:w-56">
              <Link 
                href={`/${product.brand_id}/${product.id}`} 
                className="block"
                onPointerDown={(e) => {
                  linkDragStartRef.current = { x: e.clientX, y: e.clientY, productId: product.id };
                  wasDraggingRef.current[product.id] = false;
                  e.stopPropagation();
                }}
                onPointerMove={(e) => {
                  if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                    const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                    const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                    if (dx > dragThreshold || dy > dragThreshold) {
                      wasDraggingRef.current[product.id] = true;
                    }
                  }
                  e.stopPropagation();
                }}
                onPointerUp={(e) => {
                  if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                    const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                    const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                    // If moved more than threshold, it was a drag, not a click
                    if (dx > dragThreshold || dy > dragThreshold) {
                      wasDraggingRef.current[product.id] = true;
                      e.preventDefault();
                    }
                    linkDragStartRef.current = null;
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  // Prevent navigation if we were dragging
                  if (wasDraggingRef.current[product.id]) {
                    e.preventDefault();
                    wasDraggingRef.current[product.id] = false;
                  }
                  e.stopPropagation();
                }}
              >
                {product.images?.length ? (
                  <div className="aspect-square overflow-hidden">
                    <OptimizedImage
                      src={product.images[0]}
                      alt={product.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                      isImportant={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </Link>
              <div className="absolute top-2 right-2 z-10">
                <FavoriteButton 
                  productId={product.id} 
                  className="bg-white/80 hover:bg-white rounded-full p-1" 
                  initialFavoriteState={isFavorited(product.id)}
                />
              </div>
              <div className="pt-2 ml-2">
                <div className="flex items-center justify-between gap-3">
                  <Link 
                    href={`/${product.brand_id}/${product.id}`} 
                    className="block font-medium text-white truncate hover:underline"
                    onPointerDown={(e) => {
                      linkDragStartRef.current = { x: e.clientX, y: e.clientY, productId: product.id };
                      wasDraggingRef.current[product.id] = false;
                      e.stopPropagation();
                    }}
                    onPointerMove={(e) => {
                      if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                        const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                        const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                        if (dx > dragThreshold || dy > dragThreshold) {
                          wasDraggingRef.current[product.id] = true;
                        }
                      }
                      e.stopPropagation();
                    }}
                    onPointerUp={(e) => {
                      if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                        const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                        const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                        if (dx > dragThreshold || dy > dragThreshold) {
                          wasDraggingRef.current[product.id] = true;
                          e.preventDefault();
                        }
                        linkDragStartRef.current = null;
                      }
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      if (wasDraggingRef.current[product.id]) {
                        e.preventDefault();
                        wasDraggingRef.current[product.id] = false;
                      }
                      e.stopPropagation();
                    }}
                  >
                    {product.name}
                  </Link>
                </div>
                <div className="text-sm text-white">{formatUSD(product.price)}</div>
              </div>
            </div>
          ))}

          {/* Duplicate set (for seamless loop) */}
          {products.map((product) => (
            <div key={`dup-${product.id}`} className="group rounded-lg overflow-hidden flex-shrink-0 w-48 sm:w-56">
              <Link 
                href={`/${product.brand_id}/${product.id}`} 
                className="block"
                onPointerDown={(e) => {
                  linkDragStartRef.current = { x: e.clientX, y: e.clientY, productId: product.id };
                  wasDraggingRef.current[product.id] = false;
                  e.stopPropagation();
                }}
                onPointerMove={(e) => {
                  if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                    const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                    const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                    if (dx > dragThreshold || dy > dragThreshold) {
                      wasDraggingRef.current[product.id] = true;
                    }
                  }
                  e.stopPropagation();
                }}
                onPointerUp={(e) => {
                  if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                    const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                    const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                    if (dx > dragThreshold || dy > dragThreshold) {
                      wasDraggingRef.current[product.id] = true;
                      e.preventDefault();
                    }
                    linkDragStartRef.current = null;
                  }
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  if (wasDraggingRef.current[product.id]) {
                    e.preventDefault();
                    wasDraggingRef.current[product.id] = false;
                  }
                  e.stopPropagation();
                }}
              >
                {product.images?.length ? (
                  <div className="aspect-square overflow-hidden">
                    <OptimizedImage
                      src={product.images[0]}
                      alt={product.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
                      isImportant={true}
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">No image</span>
                  </div>
                )}
              </Link>
              <div className="pt-2 ml-2">
                <div className="flex items-center justify-between gap-3">
                  <Link 
                    href={`/${product.brand_id}/${product.id}`} 
                    className="block font-medium text-white truncate hover:underline"
                    onPointerDown={(e) => {
                      linkDragStartRef.current = { x: e.clientX, y: e.clientY, productId: product.id };
                      wasDraggingRef.current[product.id] = false;
                      e.stopPropagation();
                    }}
                    onPointerMove={(e) => {
                      if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                        const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                        const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                        if (dx > dragThreshold || dy > dragThreshold) {
                          wasDraggingRef.current[product.id] = true;
                        }
                      }
                      e.stopPropagation();
                    }}
                    onPointerUp={(e) => {
                      if (linkDragStartRef.current && linkDragStartRef.current.productId === product.id) {
                        const dx = Math.abs(e.clientX - linkDragStartRef.current.x);
                        const dy = Math.abs(e.clientY - linkDragStartRef.current.y);
                        if (dx > dragThreshold || dy > dragThreshold) {
                          wasDraggingRef.current[product.id] = true;
                          e.preventDefault();
                        }
                        linkDragStartRef.current = null;
                      }
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      if (wasDraggingRef.current[product.id]) {
                        e.preventDefault();
                        wasDraggingRef.current[product.id] = false;
                      }
                      e.stopPropagation();
                    }}
                  >
                    {product.name}
                  </Link>
                </div>
                <div className="text-sm text-white">{formatUSD(product.price)}</div>
              </div>
            </div>
          ))}

          {/* Note: Add one more cycle if there are few products and not enough width */}
          {/* {products.map((product) => (
            <div key={`dup2-${product.id}`} className="group rounded-lg overflow-hidden flex-shrink-0 w-48 sm:w-56">...</div>
          ))} */}
        </div>
      </div>
    </div>
  );
}
