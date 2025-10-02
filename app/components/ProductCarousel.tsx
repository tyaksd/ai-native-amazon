'use client'

import Image from "next/image";
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
};

export default function ProductCarousel({ products, title = "You might also like" }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isPausedRef = useRef<boolean>(false);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);
  const resumeTimerRef = useRef<number | null>(null);
  const dragThreshold = 5; // ドラッグとクリックを区別する閾値（ピクセル）
  
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
    const SPEED = 0.6; // 自動スクロール速度(px/フレーム)

    const animate = () => {
      // 複製込み全幅の半分 = 元セット1周分
      const originalWidth = (el.scrollWidth || 0) / 2;

      if (originalWidth > 0) {
        if (!isPausedRef.current) {
          scrollPosition += SPEED;
          if (scrollPosition >= originalWidth) scrollPosition -= originalWidth;
          el.scrollLeft = scrollPosition;
        } else {
          // ユーザー操作中は現在位置を基準にしておく
          const mod = el.scrollLeft % originalWidth;
          scrollPosition = mod >= 0 ? mod : mod + originalWidth;
        }
      }
      rafId = requestAnimationFrame(animate);
    };

    // タブが非表示のときは止める（省電力）
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        rafId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    // ユーザー操作ハンドラ
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
      pauseAuto();
      isDraggingRef.current = false; // 最初はドラッグではない
      el.setPointerCapture(e.pointerId);
      dragStartXRef.current = e.clientX;
      dragStartScrollLeftRef.current = el.scrollLeft;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!el) return;
      const dx = Math.abs(e.clientX - dragStartXRef.current);
      
      // 閾値を超えた場合のみドラッグ開始
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
      
      // ドラッグしていなかった場合のみリンクを有効にする
      if (!wasDragging) {
        // クリックイベントを許可するために少し遅延
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

    // 画像ロードやリサイズで幅が変わっても、毎フレーム originalWidth を参照するので追加処理不要
    rafId = requestAnimationFrame(animate); // ★ 即起動

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
    <div className="mt-12">
      <h2 className="text-xl font-semibold tracking-tight mb-6 text-gray-900">{title}</h2>
      <div className="relative overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide pb-4 cursor-grab"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 元セット */}
          {products.map((product) => (
            <div key={product.id} className="group relative flex-shrink-0 w-48 sm:w-56">
              <Link 
                href={`/product/${product.id}`} 
                className="block"
                onClick={(e) => {
                  // ドラッグ中でない場合のみナビゲーションを許可
                  if (isDraggingRef.current) {
                    e.preventDefault();
                  }
                }}
              >
                {product.images?.length ? (
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
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
                    href={`/product/${product.id}`} 
                    className="block font-medium text-gray-900 truncate hover:underline"
                    onClick={(e) => {
                      // ドラッグ中でない場合のみナビゲーションを許可
                      if (isDraggingRef.current) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {product.name}
                  </Link>
                </div>
                <div className="text-sm text-gray-700">{formatUSD(product.price)}</div>
              </div>
            </div>
          ))}

          {/* 複製セット（シームレスループ用） */}
          {products.map((product) => (
            <div key={`dup-${product.id}`} className="group rounded-lg overflow-hidden flex-shrink-0 w-48 sm:w-56">
              <Link 
                href={`/product/${product.id}`} 
                className="block"
                onClick={(e) => {
                  // ドラッグ中でない場合のみナビゲーションを許可
                  if (isDraggingRef.current) {
                    e.preventDefault();
                  }
                }}
              >
                {product.images?.length ? (
                  <div className="aspect-square overflow-hidden">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      width={800}
                      height={800}
                      className="w-full h-full object-cover"
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
                    href={`/product/${product.id}`} 
                    className="block font-medium text-gray-900 truncate hover:underline"
                    onClick={(e) => {
                      // ドラッグ中でない場合のみナビゲーションを許可
                      if (isDraggingRef.current) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {product.name}
                  </Link>
                </div>
                <div className="text-sm text-gray-700">{formatUSD(product.price)}</div>
              </div>
            </div>
          ))}

          {/* ※ 商品数が少なくて横幅が足りない場合はもう1周分を追加してください */}
          {/* {products.map((product) => (
            <div key={`dup2-${product.id}`} className="group rounded-lg overflow-hidden flex-shrink-0 w-48 sm:w-56">...</div>
          ))} */}
        </div>
      </div>
    </div>
  );
}
