#!/usr/bin/env python3
"""
Script per generare icone PWA NM Music
Richiede: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Cartella output
OUTPUT_DIR = "public/icons"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Dimensioni icone PWA
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

# NM Music Brand Colors
BG_COLOR = (10, 10, 15)  # #0a0a0f
CYAN_COLOR = (0, 229, 255)  # #00E5FF
PURPLE_COLOR = (156, 39, 176)  # #9C27B0

def create_icon(size):
    """Crea un'icona quadrata con logo NM Music stilizzato"""
    
    # Crea immagine
    img = Image.new('RGB', (size, size), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    margin = size // 8
    
    # Cornice luminosa (ispirata al logo)
    border_width = max(2, size // 40)
    
    # Top bar (cyan)
    draw.rectangle([margin, margin, size-margin, margin+border_width*2], fill=CYAN_COLOR)
    
    # Left bar
    draw.rectangle([margin, margin, margin+border_width, size-margin], fill=CYAN_COLOR)
    
    # Bottom bar
    draw.rectangle([margin, size-margin-border_width, size-margin, size-margin], fill=CYAN_COLOR)
    
    # Right bar
    draw.rectangle([size-margin-border_width, margin, size-margin, size-margin], fill=CYAN_COLOR)
    
    # Lettere NM (stilizzate)
    center_x = size // 2
    center_y = size // 2
    letter_size = size // 3
    
    # N (semplificata come rettangoli)
    n_width = letter_size // 4
    n_x = center_x - letter_size // 2 - n_width
    draw.rectangle([n_x, center_y - letter_size//2, n_x + n_width, center_y + letter_size//2], fill=CYAN_COLOR)
    draw.rectangle([n_x + letter_size//2, center_y - letter_size//2, n_x + letter_size//2 + n_width, center_y + letter_size//2], fill=CYAN_COLOR)
    draw.polygon([
        (n_x, center_y + letter_size//2 - n_width),
        (n_x + letter_size//2 + n_width, center_y - letter_size//2),
        (n_x + letter_size//2 + n_width, center_y - letter_size//2 + n_width)
    ], fill=CYAN_COLOR)
    
    # M (semplificata)
    m_width = n_width
    m_x = center_x + n_width
    draw.rectangle([m_x, center_y - letter_size//2, m_x + m_width, center_y + letter_size//2], fill=CYAN_COLOR)
    draw.polygon([
        (m_x, center_y - letter_size//2),
        (m_x + letter_size//3, center_y),
        (m_x + letter_size//3 - m_width, center_y)
    ], fill=CYAN_COLOR)
    draw.polygon([
        (m_x + letter_size//2, center_y - letter_size//2),
        (m_x + letter_size//3, center_y),
        (m_x + letter_size//3 + m_width, center_y)
    ], fill=CYAN_COLOR)
    draw.rectangle([m_x + letter_size//2, center_y - letter_size//2, m_x + letter_size//2 + m_width, center_y + letter_size//2], fill=CYAN_COLOR)
    
    # Accento viola (freccia stilizzata)
    arrow_y = center_y - letter_size // 3
    draw.ellipse([
        center_x + letter_size//4, arrow_y,
        center_x + letter_size//4 + size//15, arrow_y + size//15
    ], fill=PURPLE_COLOR)
    
    # Salva
    filename = f"icon-{size}.png"
    filepath = os.path.join(OUTPUT_DIR, filename)
    img.save(filepath, 'PNG', optimize=True)
    print(f"✅ Creata: {filename}")

def main():
    print("🎵 Generazione icone PWA NM Music...")
    
    for size in SIZES:
        create_icon(size)
    
    print(f"\n✅ {len(SIZES)} icone create in {OUTPUT_DIR}/")
    print("\n💡 Per icone personalizzate di qualità superiore:")
    print("   1. Esporta logo-nm-music.svg come PNG 512x512")
    print("   2. Usa: https://realfavicongenerator.net/")
    print("   3. Carica il PNG e genera tutte le dimensioni")

if __name__ == "__main__":
    main()
