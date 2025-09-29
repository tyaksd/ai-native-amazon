-- Insert sample brands
INSERT INTO brands (id, name, icon) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TAU', '/vercel.svg'),
  ('22222222-2222-2222-2222-222222222222', 'ZENIT', '/next.svg'),
  ('33333333-3333-3333-3333-333333333333', 'ORB', '/globe.svg');

-- Insert sample products
INSERT INTO products (id, name, images, price, brand_id, description, category, colors) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oversized Tee', ARRAY['/clothingsample.png', '/clothingsample.png'], 49.00, '11111111-1111-1111-1111-111111111111', 'Heavyweight cotton tee with relaxed shoulders and boxy silhouette.', 'Men', ARRAY['black', 'white', 'gray']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Relaxed Hoodie', ARRAY['/clothingsample.png', '/clothingsample.png'], 89.00, '11111111-1111-1111-1111-111111111111', 'Soft fleece hoodie with dropped shoulders and kangaroo pocket.', 'Men', ARRAY['navy', 'olive', 'charcoal']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Wide Trousers', ARRAY['/clothingsample.png'], 99.00, '22222222-2222-2222-2222-222222222222', 'Tailored wide-leg trousers with crisp pleats and clean drape.', 'Women', ARRAY['black', 'beige', 'navy']),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Minimal Sneaker', ARRAY['/clothingsample.png'], 129.00, '22222222-2222-2222-2222-222222222222', 'Low-profile leather sneaker with cushioned insole for daily wear.', 'Hot', ARRAY['white', 'black']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Boxy Shirt', ARRAY['/clothingsample.png'], 69.00, '33333333-3333-3333-3333-333333333333', 'Crisp poplin shirt in a cropped boxy fit with sharp collar.', 'Women', ARRAY['white', 'blue', 'pink']),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Knit Cardigan', ARRAY['/clothingsample.png'], 109.00, '33333333-3333-3333-3333-333333333333', 'Fine-gauge knit cardigan with tonal buttons and rib trims.', 'Women', ARRAY['cream', 'brown', 'gray']),
  ('abcdabcd-abcd-abcd-abcd-abcdabcdabcd', 'Flare Skirt', ARRAY['/clothingsample.png'], 79.00, '11111111-1111-1111-1111-111111111111', 'Mid-length skirt with fluid flare and clean waistband.', 'Women', ARRAY['black', 'navy', 'red']),
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'Tailored Jacket', ARRAY['/clothingsample.png'], 149.00, '33333333-3333-3333-3333-333333333333', 'Single-breasted blazer with structured shoulders and slim lapels.', 'Hot', ARRAY['black', 'navy', 'gray']),
  ('12345678-1234-5678-1234-567812345678', 'Utility Pants', ARRAY['/clothingsample.png'], 85.00, '22222222-2222-2222-2222-222222222222', 'Straight-fit pants with utility pockets and durable twill fabric.', 'Men', ARRAY['olive', 'black', 'khaki']),
  ('fedcba98-fedc-ba98-fedc-ba98fedcba98', 'Rib Tank', ARRAY['/clothingsample.png'], 29.00, '11111111-1111-1111-1111-111111111111', 'Ribbed cotton tank with stretch for a close, breathable fit.', 'Hot', ARRAY['white', 'black', 'gray']);