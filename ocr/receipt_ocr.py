#!/usr/bin/env python3
"""
Divido Local Receipt OCR Engine
Uses OpenCV, Pillow, and Tesseract OCR to perform local, free receipt text extraction
with image preprocessing, language support (eng + sin), and quality validation.
Outputs structured JSON to stdout.
"""

import sys
import os
import json
import re
import shutil

def find_tesseract():
    """Finds Tesseract binary across common system paths."""
    candidates = [
        shutil.which("tesseract"),
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/bin/tesseract"
    ]
    for c in candidates:
        if c and os.path.exists(c) and os.access(c, os.X_OK):
            return c
    return None

def check_dependencies():
    """Checks for required Python libraries."""
    missing = []
    try:
        import PIL
    except ImportError:
        missing.append("Pillow")
    try:
        import pytesseract
    except ImportError:
        missing.append("pytesseract")
    try:
        import cv2
    except ImportError:
        missing.append("opencv-python")
    try:
        import numpy
    except ImportError:
        missing.append("numpy")
    return missing

def detect_languages(tesseract_cmd):
    """Detects available Tesseract language traineddata."""
    import subprocess
    langs = ["eng"]
    try:
        res = subprocess.run([tesseract_cmd, "--list-langs"], capture_output=True, text=True, timeout=5)
        available = res.stdout.splitlines()
        if "sin" in available:
            langs.append("sin")
    except Exception:
        pass
    return "+".join(langs)

def preprocess_image(image_path):
    """
    Step 2: Preprocess receipt image using OpenCV for optimal OCR accuracy.
    - Grayscale
    - Contrast enhancement (CLAHE)
    - Denoising
    - Adaptive thresholding
    - Blur score calculation
    """
    import cv2
    import numpy as np

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError("Could not decode image at path: " + image_path)

    warnings = []
    h, w = img.shape[:2]

    # Check image resolution
    if w < 200 or h < 200:
        warnings.append("Image resolution is very low.")

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Blur detection via Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = laplacian_var < 35.0
    if is_blurry:
        warnings.append("Image appears blurry or out of focus (variance: {:.1f}).".format(laplacian_var))

    # Brightness check
    mean_val = np.mean(gray)
    if mean_val < 30:
        warnings.append("Image appears very dark.")
    elif mean_val > 252:
        warnings.append("Image appears completely washed out or blank.")

    # Contrast enhancement with CLAHE
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Denoise
    denoised = cv2.medianBlur(enhanced, 3)

    # Adaptive thresholding (Otsu's binarization for clear document text)
    _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return gray, thresh, is_blurry, warnings

def run_ocr(image_path):
    """Runs local Tesseract OCR with quality checks."""
    tesseract_cmd = find_tesseract()
    if not tesseract_cmd:
        return {
            "success": False,
            "error": "Tesseract OCR binary not found. Please install Tesseract (e.g. 'brew install tesseract' or 'brew install tesseract-lang').",
            "isReadable": False,
            "rawText": "",
            "warnings": ["Tesseract binary not installed on server."]
        }

    missing_deps = check_dependencies()
    if missing_deps:
        return {
            "success": False,
            "error": "Missing Python OCR dependencies: {}. Please run 'pip install -r ocr/requirements.txt'.".format(", ".join(missing_deps)),
            "isReadable": False,
            "rawText": "",
            "warnings": ["Missing python packages: " + ", ".join(missing_deps)]
        }

    import pytesseract
    from PIL import Image

    pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
    lang_choice = detect_languages(tesseract_cmd)

    try:
        gray, thresh, is_blurry, warnings = preprocess_image(image_path)
    except Exception as e:
        # Fallback to direct PIL loading
        warnings = ["OpenCV preprocessing fallback: " + str(e)]
        thresh = Image.open(image_path)
        is_blurry = False

    # Perform OCR with PSM 6 (uniform block of text) and fallback PSM 4
    config = "--oem 3 --psm 6"
    ocr_data = pytesseract.image_to_data(thresh, lang=lang_choice, config=config, output_type=pytesseract.Output.DICT)

    lines = []
    current_line = []
    confidences = []
    current_line_num = -1

    for i in range(len(ocr_data["text"])):
        text = ocr_data["text"][i].strip()
        conf = float(ocr_data["conf"][i])
        line_num = ocr_data["line_num"][i]

        if conf > 0:
            confidences.append(conf)

        if text:
            if line_num != current_line_num:
                if current_line:
                    lines.append(" ".join(current_line))
                current_line = [text]
                current_line_num = line_num
            else:
                current_line.append(text)

    if current_line:
        lines.append(" ".join(current_line))

    raw_text = "\n".join(lines).strip()

    # Step 4: OCR Quality Validation
    avg_conf = sum(confidences) / len(confidences) if confidences else 0.0

    # Check for monetary amounts: numbers with decimals or 2+ digits
    has_monetary = bool(re.search(r'(\d+[\.,]\d{2})|(\b\d{2,}\b)', raw_text))
    # Check for header or total labels
    has_total_label = bool(re.search(r'(?i)\b(total|subtotal|amount|net|cash|balance|paid|rs\.?|lkr)\b', raw_text))

    if len(raw_text) < 15:
        warnings.append("Extracted text is very short ({:d} characters).".format(len(raw_text)))

    if not has_monetary:
        warnings.append("No clear monetary values recognized.")

    if not has_total_label:
        warnings.append("No recognizable total or financial labels detected.")

    # Determine if readable enough for Gemini text analysis
    is_readable = len(raw_text) >= 15 and has_monetary and (not is_blurry or avg_conf >= 30.0)

    if not is_readable:
        warnings.append("Receipt is too unclear or unreadable for accurate financial analysis.")

    return {
        "success": True,
        "isReadable": is_readable,
        "confidence": round(avg_conf, 1),
        "rawText": raw_text,
        "lines": lines,
        "languagesUsed": lang_choice,
        "hasMonetaryValues": has_monetary,
        "hasLikelyTotalLabel": has_total_label,
        "warnings": warnings
    }

def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Usage: receipt_ocr.py <path_to_receipt_image>",
            "isReadable": False,
            "rawText": ""
        }))
        sys.exit(1)

    image_path = sys.argv[1]
    if not os.path.exists(image_path):
        print(json.dumps({
            "success": False,
            "error": "File does not exist: " + image_path,
            "isReadable": False,
            "rawText": ""
        }))
        sys.exit(1)

    result = run_ocr(image_path)
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
