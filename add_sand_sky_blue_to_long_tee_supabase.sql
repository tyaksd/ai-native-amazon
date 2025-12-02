-- Long Tee商品のカラー名を全て大文字に変換し、SANDとSKY BLUEを追加

-- ステップ1: 既存のカラーを全て大文字に変換
UPDATE products
SET colors = ARRAY(
  SELECT UPPER(unnest(colors))
)
WHERE (LOWER(type) LIKE '%long tee%' 
   OR LOWER(type) LIKE '%longtee%' 
   OR LOWER(type) LIKE '%long-tee%')
   AND colors IS NOT NULL;

-- ステップ2: SANDとSKY BLUEを追加（存在しない場合のみ）
UPDATE products
SET colors = (
  SELECT array_agg(DISTINCT color ORDER BY color)
  FROM (
    SELECT unnest(colors) AS color
    UNION
    SELECT 'SAND' WHERE NOT ('SAND' = ANY(colors))
    UNION
    SELECT 'SKY BLUE' WHERE NOT ('SKY BLUE' = ANY(colors))
  ) AS all_colors
)
WHERE (LOWER(type) LIKE '%long tee%' 
   OR LOWER(type) LIKE '%longtee%' 
   OR LOWER(type) LIKE '%long-tee%')
   AND colors IS NOT NULL;

