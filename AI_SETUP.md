# AI Brand & Product Generation Setup

## Required Environment Variables

Add the following environment variables to your `.env.local` file:

```bash
# OpenAI API Key for AI brand and product generation
OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration (if not already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Cloudinary Configuration (if not already set)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_name
```

## How to Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

## Features

### AI Brand Generation
- **GPT-4 Integration**: Generates brand names, descriptions, design concepts, and target audiences
- **DALL-E 3 Integration**: Creates logo and background images
- **Cloudinary Upload**: Automatically uploads generated images to Cloudinary
- **Database Storage**: Saves all generated content to Supabase

### AI Product Generation
- **GPT-4 Integration**: Generates product names, SEO-optimized descriptions, and gender determination
- **DALL-E 3 Integration**: Creates product photos with white backgrounds and design-only PNGs
- **Multi-Color Support**: Generates images for each selected color variant
- **Random Pricing**: T-shirts priced between $25.00-$45.00
- **Cloudinary Upload**: Automatically uploads all generated images
- **Database Storage**: Creates complete product records in Supabase

## Usage

### AI Brand Generation
1. Go to the `/oiu` admin dashboard
2. Click on the "AI Brands" tab
3. Select either "Street" or "Casual" style
4. Click "Generate Brand" button
5. Wait for the AI to generate the brand (this may take 30-60 seconds)
6. The new brand will be automatically added to your database

### AI Product Generation
1. Go to the `/oiu` admin dashboard
2. Click on the "AI Products" tab
3. Select a brand from the dropdown
4. Choose a product type (T-Shirt, Hoodie, etc.)
5. Select colors (use "Random" for Black, White + 2 random colors)
6. Set the quantity of products to generate
7. Click "Generate Products" button
8. Wait for the AI to generate products (this may take 2-5 minutes)
9. The new products will be automatically added to your database

## Generated Content

### AI-Generated Brands
Each AI-generated brand includes:

- **Brand Name**: Original, memorable name
- **Brand Description**: Compelling story and mission
- **Design Concept**: Bold graphics and collaboration focus
- **Target Audience**: Specific niche community
- **Logo Design**: Simple, iconic symbol
- **Background Image**: Visual brand story header

### AI-Generated Products
Each AI-generated product includes:

- **Product Name**: Creative, catchy English name
- **Product Description**: SEO-optimized, compelling description (150-200 words)
- **Pricing**: Random pricing for T-shirts ($25.00-$45.00)
- **Gender**: AI-determined based on brand and product type
- **Colors**: Selected color variants with proper color names
- **Sizes**: Default sizes (S, M, L, XL, 2XL, 3XL)
- **Category**: Set to "Clothing"
- **Type**: Selected product type (T-Shirt, Hoodie, etc.)
- **Images**: High-quality product photos and design PNGs

## Cost Considerations

### AI Brand Generation
- GPT-4: ~$0.15 per brand generation
- DALL-E 3: ~$0.40 per brand generation (2 images)
- **Total: ~$0.55 per AI brand generation**

### AI Product Generation
- GPT-4: ~$0.20 per product (name + description + gender)
- DALL-E 3: ~$0.40 per color variant (1 image per color)
- **Total: ~$0.60 per product per color**

**Example**: Generating 3 T-shirts with 4 colors each = 3 × 4 × $0.60 = **$7.20**

Make sure you have sufficient OpenAI credits before generating brands and products.
