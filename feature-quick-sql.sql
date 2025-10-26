-- =========================================
-- Features Management - Quick SQL Reference
-- =========================================
-- 
-- 注意: UUIDが必要なコマンドは、まず「1. 全ての特集を表示」を実行して
--       実際のUUID（id列）をコピーしてから使用してください
-- 
-- =========================================

-- 1. 全ての特集を表示（idとタイトルを確認）
SELECT 
  id,
  title,
  subtitle,
  link_url,
  display_order,
  is_active,
  created_at
FROM features 
ORDER BY display_order;

-- 2. 公開中の特集のみ表示
SELECT 
  id,
  title,
  subtitle,
  display_order
FROM features 
WHERE is_active = true 
ORDER BY display_order;

-- 3. 新しい特集を手動で追加（このまま実行可能）
INSERT INTO features (title, subtitle, image_url, link_url, display_order, is_active)
VALUES (
  '新しい特集タイトル',
  '特集の説明文をここに入力',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
  '/explore',
  99,
  true
)
RETURNING id, title, display_order;

-- 4. 特集を更新（★まず上記「1」でidを確認してから実行）
-- 使い方: 下記の'YOUR_UUID_HERE'を実際のUUIDに置き換えてください
/*
UPDATE features 
SET 
  title = '更新後のタイトル',
  subtitle = '更新後の説明文',
  is_active = true,
  updated_at = NOW()
WHERE id = 'YOUR_UUID_HERE'
RETURNING *;
*/

-- 5. 特集を削除（★まず上記「1」でidを確認してから実行）
-- 使い方: 下記の'YOUR_UUID_HERE'を実際のUUIDに置き換えてください
/*
DELETE FROM features 
WHERE id = 'YOUR_UUID_HERE'
RETURNING title;
*/

-- 6. 全ての特集を非公開にする（このまま実行可能）
-- UPDATE features SET is_active = false, updated_at = NOW();

-- 7. 全ての特集を公開する（このまま実行可能）
-- UPDATE features SET is_active = true, updated_at = NOW();

-- 8. 表示順を一括更新（★まず上記「1」でidを確認してから実行）
-- 使い方: UUIDを実際の値に置き換えてから、コメントを外して実行
/*
UPDATE features SET display_order = 1, updated_at = NOW() WHERE id = 'YOUR_UUID_1';
UPDATE features SET display_order = 2, updated_at = NOW() WHERE id = 'YOUR_UUID_2';
UPDATE features SET display_order = 3, updated_at = NOW() WHERE id = 'YOUR_UUID_3';
*/

-- 9. タイトルで特集を検索して更新（このまま実行可能）
-- 例: 「タイムセール」というタイトルの特集を非公開にする
/*
UPDATE features 
SET is_active = false, updated_at = NOW()
WHERE title LIKE '%タイムセール%'
RETURNING id, title, is_active;
*/

-- 10. 最近作成された特集を表示
SELECT 
  id,
  title,
  display_order,
  is_active,
  created_at
FROM features 
ORDER BY created_at DESC 
LIMIT 5;

-- 11. 最近更新された特集を表示
SELECT 
  id,
  title,
  display_order,
  is_active,
  updated_at
FROM features 
ORDER BY updated_at DESC 
LIMIT 5;

-- 12. 特集の件数を確認（このまま実行可能）
SELECT 
  COUNT(*) as total_features,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_features,
  COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_features
FROM features;

-- 13. 特定のリンク先を持つ特集を検索（このまま実行可能）
SELECT 
  id,
  title,
  link_url,
  is_active
FROM features 
WHERE link_url = '/explore';

-- 14. タイトルで検索（部分一致・このまま実行可能）
SELECT 
  id,
  title,
  subtitle,
  is_active
FROM features 
WHERE title ILIKE '%セール%';

-- =========================================
-- 💡 よく使うパターン
-- =========================================

-- パターン1: 特集の表示順を入れ替える（タイトルで指定）
/*
-- まず現在の順序を確認
SELECT id, title, display_order FROM features ORDER BY display_order;

-- 「タイムセール」を1番目に、「ホリデー」を2番目に変更
UPDATE features SET display_order = 1 WHERE title LIKE '%タイムセール%';
UPDATE features SET display_order = 2 WHERE title LIKE '%ホリデー%';
*/

-- パターン2: 期間限定の特集を一時的に非公開にする
/*
UPDATE features 
SET is_active = false, updated_at = NOW()
WHERE title LIKE '%タイムセール%'
RETURNING id, title, is_active;
*/

-- パターン3: 全ての特集の表示順を再設定
/*
-- まず、現在のIDとタイトルを確認
SELECT id, title, display_order FROM features ORDER BY display_order;

-- 次に、好きな順序に並び替え（UUIDを実際の値に置き換える）
UPDATE features SET display_order = 1 WHERE id = 'YOUR_UUID_1';
UPDATE features SET display_order = 2 WHERE id = 'YOUR_UUID_2';
UPDATE features SET display_order = 3 WHERE id = 'YOUR_UUID_3';

-- 結果を確認
SELECT id, title, display_order FROM features ORDER BY display_order;
*/

-- =========================================
-- ⚠️ 危険なコマンド（本当に必要な場合のみ使用）
-- =========================================

-- 特集テーブルを完全にリセット（全データ削除）
/*
DELETE FROM features;

-- デフォルトデータを再挿入
INSERT INTO features (title, subtitle, image_url, link_url, display_order, is_active) VALUES
  ('ホリデーコレクション', 'メタリックパープルの限定パッケージが登場', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80', '/explore', 1, true),
  ('タイムセール開催中！', 'MAX50%オフ！10月26日(日)26時まで', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80', '/explore', 2, true),
  ('Paul Smith、DUFFERなど', 'ラグジュアリーブランドがクーポン等の特別企画開催', 'https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?w=1200&q=80', '/brands', 3, true);
*/

