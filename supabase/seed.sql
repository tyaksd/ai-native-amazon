-- Insert sample brands
INSERT INTO brands (id, name, icon) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'TAU', '/vercel.svg'),
  ('22222222-2222-2222-2222-222222222222', 'ZENIT', '/next.svg'),
  ('33333333-3333-3333-3333-333333333333', 'ORB', '/globe.svg');

-- Insert sample products
INSERT INTO products (id, name, images, price, brand_id, description, category, type, colors) VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Oversized Tee', ARRAY['/clothingsample.png', '/clothingsample.png'], 49.00, '11111111-1111-1111-1111-111111111111', 'Heavyweight cotton tee with relaxed shoulders and boxy silhouette.', 'Clothing', 'T-Shirt', ARRAY['black', 'white', 'gray']),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Relaxed Hoodie', ARRAY['/clothingsample.png', '/clothingsample.png'], 89.00, '11111111-1111-1111-1111-111111111111', 'Soft fleece hoodie with dropped shoulders and kangaroo pocket.', 'Clothing', 'Hoodie', ARRAY['navy', 'olive', 'charcoal']),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Wide Trousers', ARRAY['/clothingsample.png'], 99.00, '22222222-2222-2222-2222-222222222222', 'Tailored wide-leg trousers with crisp pleats and clean drape.', 'Clothing', 'Pants', ARRAY['black', 'beige', 'navy']),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Minimal Sneaker', ARRAY['/clothingsample.png'], 129.00, '22222222-2222-2222-2222-222222222222', 'Low-profile leather sneaker with cushioned insole for daily wear.', 'Hats', 'Shoes', ARRAY['white', 'black']),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Boxy Shirt', ARRAY['/clothingsample.png'], 69.00, '33333333-3333-3333-3333-333333333333', 'Crisp poplin shirt in a cropped boxy fit with sharp collar.', 'Clothing', 'T-Shirt', ARRAY['white', 'blue', 'pink']),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Knit Cardigan', ARRAY['/clothingsample.png'], 109.00, '33333333-3333-3333-3333-333333333333', 'Fine-gauge knit cardigan with tonal buttons and rib trims.', 'Clothing', 'Jacket', ARRAY['cream', 'brown', 'gray']),
  ('abcdabcd-abcd-abcd-abcd-abcdabcdabcd', 'Flare Skirt', ARRAY['/clothingsample.png'], 79.00, '11111111-1111-1111-1111-111111111111', 'Mid-length skirt with fluid flare and clean waistband.', 'Clothing', 'Other', ARRAY['black', 'navy', 'red']),
  ('deadbeef-dead-beef-dead-beefdeadbeef', 'Tailored Jacket', ARRAY['/clothingsample.png'], 149.00, '33333333-3333-3333-3333-333333333333', 'Single-breasted blazer with structured shoulders and slim lapels.', 'Clothing', 'Jacket', ARRAY['black', 'navy', 'gray']),
  ('12345678-1234-5678-1234-567812345678', 'Utility Pants', ARRAY['/clothingsample.png'], 85.00, '22222222-2222-2222-2222-222222222222', 'Straight-fit pants with utility pockets and durable twill fabric.', 'Clothing', 'Pants', ARRAY['olive', 'black', 'khaki']),
  ('fedcba98-fedc-ba98-fedc-ba98fedcba98', 'Rib Tank', ARRAY['/clothingsample.png'], 29.00, '11111111-1111-1111-1111-111111111111', 'Ribbed cotton tank with stretch for a close, breathable fit.', 'Clothing', 'T-Shirt', ARRAY['white', 'black', 'gray']),
  ('11111111-1111-1111-1111-111111111112', 'Sand Drift Tee', ARRAY['/clothingsample.png'], 80.00, '11111111-1111-1111-1111-111111111111', 'Soft cotton tee with relaxed fit and earthy tones.', 'Clothing', 'T-Shirt', ARRAY['sand', 'beige', 'cream']),
  ('22222222-2222-2222-2222-222222222223', 'River Flow Tee', ARRAY['/clothingsample.png'], 90.00, '22222222-2222-2222-2222-222222222222', 'Flowing cotton tee with fluid silhouette and natural drape.', 'Clothing', 'T-Shirt', ARRAY['blue', 'teal', 'navy']),
  ('33333333-3333-3333-3333-333333333334', 'Mountain Peak Hoodie', ARRAY['/clothingsample.png'], 120.00, '33333333-3333-3333-3333-333333333333', 'Heavyweight fleece hoodie with mountain-inspired design.', 'Clothing', 'Hoodie', ARRAY['charcoal', 'olive', 'black']),
  ('44444444-4444-4444-4444-444444444444', 'Ocean Wave Dress', ARRAY['/clothingsample.png'], 95.00, '11111111-1111-1111-1111-111111111111', 'Flowing midi dress with wave-like pleats and organic movement.', 'Clothing', 'Other', ARRAY['navy', 'teal', 'white']),
  ('55555555-5555-5555-5555-555555555555', 'Forest Trail Pants', ARRAY['/clothingsample.png'], 85.00, '22222222-2222-2222-2222-222222222222', 'Utility pants with cargo pockets and durable construction.', 'Clothing', 'Pants', ARRAY['olive', 'khaki', 'brown']);