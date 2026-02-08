from rembg import remove
from PIL import Image, ImageEnhance
import io
import os

input_path = 'frontend/public/favicon-new.png'
output_path = 'frontend/public/favicon-new1.png'

if not os.path.exists(input_path):
    print(f"Error: {input_path} not found.")
    exit(1)

print(f"Processing {input_path}...")

try:
    with open(input_path, 'rb') as i:
        input_data = i.read()
        print("1. Removing existing background...")
        subject = remove(input_data)
        
        img = Image.open(io.BytesIO(subject))
        
        # Resize if needed (keep it high quality/512 for now)
        img.thumbnail((512, 512), Image.Resampling.LANCZOS)
        
        
        # 2. Add Circular White Background
        print("2. Adding circular white background...")
        # Create a transparent base image
        background = Image.new("RGBA", img.size, (0, 0, 0, 0))
        from PIL import ImageDraw
        draw = ImageDraw.Draw(background)
        # Draw a lively Indigo circle (Active/Visible)
        draw.ellipse([(0, 0), img.size], fill=(79, 70, 229, 255))
        
        # Calculate centering (if logo aspect ratio isn't square)
        # But thumbnail preserves aspect ratio. Let's center `img` on `background`.
        # However, `img` is already resized to 512x512 via thumbnail IF original was square-ish.
        # If original was rectangular, thumbnail makes it fit within 512x512.
        # Let's ensure the logo is centered on the circle.
        
        # Create a new blank image for the logo to avoid cropping if we paste directly
        logo_layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        
        # Center the logo
        bg_w, bg_h = background.size
        img_w, img_h = img.size
        offset = ((bg_w - img_w) // 2, (bg_h - img_h) // 2)
        
        # Composite the logo over the white circle
        # We need to paste the logo onto the white circle
        
        # First enhance the logo BEFORE pasting, so we don't enhance the white circle (optional, but better control)
        # Actually standard practice is enhance whole image, but we want white to stay white.
        # Let's enhance the logo independently first.
        
        print("3. Enhancing brightness and color of logo...")
        # Increase Color (Saturation)
        enhancer = ImageEnhance.Color(img)
        img = enhancer.enhance(1.8) # 80% more colorful
        
        # Increase Contrast
        enhancer = ImageEnhance.Contrast(img)
        img = enhancer.enhance(1.5) # 50% more contrast
        
        # Increase Brightness
        enhancer = ImageEnhance.Brightness(img)
        img = enhancer.enhance(1.2) # 20% brighter
        
        # Now paste centered
        background.paste(img, offset, img) # Use img as mask for transparency
        
        final_img = background
        
        # Save as PNG to preserve transparency around the circle
        final_img.save(output_path, format='PNG')
        
    print(f"Success! Saved processed image to {output_path}")
except Exception as e:
    print(f"An error occurred: {e}")
