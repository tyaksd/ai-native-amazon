# Supabase + Cloudinary Setup Guide

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your Project URL and anon public key
4. Create the following tables in the SQL Editor:

### Brands Table
```sql
CREATE TABLE brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Products Table
```sql
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Enable RLS (Row Level Security)
```sql
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON brands FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON products FOR SELECT USING (true);

-- Allow public insert/update/delete (for admin functionality)
CREATE POLICY "Allow public insert" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON brands FOR UPDATE USING (true);
CREATE POLICY "Allow public update" ON products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON brands FOR DELETE USING (true);
CREATE POLICY "Allow public delete" ON products FOR DELETE USING (true);
```

## 2. Cloudinary Setup

1. Go to [cloudinary.com](https://cloudinary.com) and create a free account
2. In your Cloudinary dashboard, go to Settings > Upload
3. Create a new upload preset:
   - Preset name: `godship-mall` (or any name you prefer)
   - Signing Mode: `Unsigned`
   - Folder: `godship-mall` (optional)
4. Copy your Cloud Name, API Key, and API Secret

## 3. Environment Variables

Create a `.env.local` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

## 4. Update Pages to Use Supabase

The following pages need to be updated to use the new Supabase data service:

- `app/page.tsx` - Home page
- `app/product/[id]/page.tsx` - Product detail page
- `app/brand/[id]/page.tsx` - Brand page
- `app/cart/page.tsx` - Cart page

## 5. Admin Panel

Visit `/admin` to manage brands and products. You can:
- Add new brands with icons
- Add new products with images (uploaded to Cloudinary)
- View all products and brands
- Delete products

## 6. Migration from Mock Data

To migrate your existing mock data to Supabase:

1. Go to `/admin`
2. Add your existing brands first
3. Add your existing products with the new brand IDs
4. Update the image URLs to use Cloudinary URLs

## Notes

- All images will be uploaded to Cloudinary automatically
- The admin panel provides a simple interface for content management
- The existing cart functionality will continue to work with the new data structure
- Make sure to test the admin panel before removing the old mock data
