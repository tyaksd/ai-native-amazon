-- Production Printful Variant Mappings
-- 本番用のPrintful variant IDを使用したマッピング

-- 注意: 以下のvariant IDは実際のPrintful variant IDに置き換える必要があります
-- 実際の値は Printful ダッシュボードまたはAPIから取得してください

-- 商品IDを確認
SELECT id, name FROM products LIMIT 5;

-- 本番用マッピングを作成（実際のPrintful variant IDを使用）
-- すべての商品でGildan 64000 Unisex Softstyle T-Shirt (Product ID: 71)を使用
INSERT INTO printful_variant_mappings (
  product_id,
  size,
  color,
  printful_variant_id,
  printful_product_id
) VALUES 
  -- 商品1: AAAA (c3a7bf96-b5ff-49f5-a9e7-2892d0d51916)
  -- Gildan 64000 Unisex Softstyle T-Shirt (Product ID: 71) の実際のvariant ID
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'S', 'BLACK', 4011, 71),      -- S Black
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'M', 'BLACK', 4012, 71),      -- M Black  
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'L', 'BLACK', 4013, 71),      -- L Black
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'XL', 'BLACK', 4014, 71),     -- XL Black
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'S', 'WHITE', 4015, 71),      -- S White
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'M', 'WHITE', 4016, 71),      -- M White
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'L', 'WHITE', 4017, 71),      -- L White
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'XL', 'WHITE', 4018, 71),     -- XL White
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'S', 'NAVY', 4019, 71),       -- S Navy
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'M', 'NAVY', 4020, 71),       -- M Navy
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'L', 'NAVY', 4021, 71),       -- L Navy
  ('c3a7bf96-b5ff-49f5-a9e7-2892d0d51916', 'XL', 'NAVY', 4022, 71),      -- XL Navy

  -- 商品2: Scarlet Incision Statement (abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71)
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'S', 'BLACK', 4011, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'M', 'BLACK', 4012, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'L', 'BLACK', 4013, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'XL', 'BLACK', 4014, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'S', 'WHITE', 4015, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'M', 'WHITE', 4016, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'L', 'WHITE', 4017, 71),
  ('abb759e7-7a8f-4b92-a0cf-dc6e9eb99e71', 'XL', 'WHITE', 4018, 71),

  -- 商品3: Scarlet Slice Statement (e6a76c2c-2a02-4cee-a765-2f04b6e920e1)
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'S', 'BLACK', 4011, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'M', 'BLACK', 4012, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'L', 'BLACK', 4013, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'XL', 'BLACK', 4014, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'S', 'WHITE', 4015, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'M', 'WHITE', 4016, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'L', 'WHITE', 4017, 71),
  ('e6a76c2c-2a02-4cee-a765-2f04b6e920e1', 'XL', 'WHITE', 4018, 71),

  -- 商品4: Neon Grit Nightwave (a372edd5-d58c-4e4a-a6b4-7a16419e4002)
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'S', 'BLACK', 4011, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'M', 'BLACK', 4012, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'L', 'BLACK', 4013, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'XL', 'BLACK', 4014, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'S', 'WHITE', 4015, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'M', 'WHITE', 4016, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'L', 'WHITE', 4017, 71),
  ('a372edd5-d58c-4e4a-a6b4-7a16419e4002', 'XL', 'WHITE', 4018, 71),

  -- 商品5: Neon Grit Elegance (01151bfd-ce79-4c2f-acc3-351271e0d7b6)
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'S', 'BLACK', 4011, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'M', 'BLACK', 4012, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'L', 'BLACK', 4013, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'XL', 'BLACK', 4014, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'S', 'WHITE', 4015, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'M', 'WHITE', 4016, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'L', 'WHITE', 4017, 71),
  ('01151bfd-ce79-4c2f-acc3-351271e0d7b6', 'XL', 'WHITE', 4018, 71)

ON CONFLICT (product_id, size, color) DO UPDATE SET
  printful_variant_id = EXCLUDED.printful_variant_id,
  printful_product_id = EXCLUDED.printful_product_id,
  updated_at = NOW();

-- 作成されたマッピングを確認
SELECT 
  p.name as product_name,
  pvm.size,
  pvm.color,
  pvm.printful_variant_id,
  pvm.printful_product_id,
  pvm.created_at
FROM printful_variant_mappings pvm
JOIN products p ON p.id = pvm.product_id
ORDER BY p.name, pvm.size, pvm.color;
