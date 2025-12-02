-- Tシャツ商品のカラー名を全て大文字に変換し、SKY BLUEとDARK HEATHERを追加

-- ステップ1: 既存のカラーを全て大文字に変換
UPDATE products
SET colors = ARRAY(
  SELECT UPPER(unnest(colors))
)
WHERE (LOWER(type) LIKE '%t-shirt%' 
   OR LOWER(type) LIKE '%tshirt%' 
   OR LOWER(type) LIKE '%shirt%')
   AND colors IS NOT NULL;

-- ステップ2: SKY BLUEとDARK HEATHERを追加（存在しない場合のみ）
UPDATE products
SET colors = (
  SELECT array_agg(DISTINCT color ORDER BY color)
  FROM (
    SELECT unnest(colors) AS color
    UNION
    SELECT 'SKY BLUE' WHERE NOT ('SKY BLUE' = ANY(colors))
    UNION
    SELECT 'DARK HEATHER' WHERE NOT ('DARK HEATHER' = ANY(colors))
  ) AS all_colors
)
WHERE (LOWER(type) LIKE '%t-shirt%' 
   OR LOWER(type) LIKE '%tshirt%' 
   OR LOWER(type) LIKE '%shirt%')
   AND colors IS NOT NULL;
