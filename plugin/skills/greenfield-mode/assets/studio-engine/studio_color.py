"""Parse hex and OKLCH colors, convert them, and measure WCAG 2 contrast.

The browser twin of this module is web/color.js. Keep the two in step.
"""

import math
import re

OKLCH = re.compile(
    r"^oklch\(\s*([0-9.]+)(%?)\s+([0-9.]+)\s+([0-9.]+)(?:deg)?\s*\)$"
)
HEX = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


def parse(value):
    """Return (L, C, H) for a hex or oklch() string. Raise ValueError otherwise."""
    text = str(value).strip()
    match = OKLCH.match(text)
    if match:
        lightness = float(match.group(1)) / (100 if match.group(2) else 1)
        return lightness, float(match.group(3)), float(match.group(4)) % 360
    match = HEX.match(text)
    if match:
        digits = match.group(1)
        if len(digits) == 3:
            digits = "".join(character * 2 for character in digits)
        channels = [int(digits[index:index + 2], 16) / 255 for index in (0, 2, 4)]
        return srgb_to_oklch(channels)
    raise ValueError(f"Use #rrggbb or oklch(L C H) without alpha, not {value!r}")


def oklch_to_linear(lch):
    lightness, chroma, hue = lch
    a = chroma * math.cos(math.radians(hue))
    b = chroma * math.sin(math.radians(hue))
    l_ = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
    m_ = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
    s_ = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3
    return [
        4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
        -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
        -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_,
    ]


def srgb_to_oklch(channels):
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    red, green, blue = linear
    l_ = math.copysign(abs(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue) ** (1 / 3), 1)
    m_ = math.copysign(abs(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue) ** (1 / 3), 1)
    s_ = math.copysign(abs(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue) ** (1 / 3), 1)
    lightness = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_
    a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_
    b = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    return lightness, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def in_gamut(lch):
    return all(-0.0005 <= channel <= 1.0005 for channel in oklch_to_linear(lch))


def luminance(lch):
    red, green, blue = (min(1.0, max(0.0, c)) for c in oklch_to_linear(lch))
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue


def contrast(first, second):
    lighter, darker = sorted((luminance(parse(first)), luminance(parse(second))), reverse=True)
    return (lighter + 0.05) / (darker + 0.05)


def to_hex(value):
    channels = []
    for channel in oklch_to_linear(parse(value)):
        channel = min(1.0, max(0.0, channel))
        encoded = 12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055
        channels.append(round(encoded * 255))
    return "#" + "".join(f"{channel:02x}" for channel in channels)


def hue_distance(first, second):
    difference = abs(first - second) % 360
    return min(difference, 360 - difference)


def fmt(lch):
    lightness, chroma, hue = lch
    return f"oklch({lightness:.3f} {chroma:.3f} {hue % 360:.1f})"


def fit(lch):
    """Reduce chroma until the color is inside sRGB."""
    lightness, chroma, hue = lch
    if in_gamut((lightness, chroma, hue)):
        return lightness, chroma, hue
    low, high = 0.0, chroma
    for _ in range(18):
        middle = (low + high) / 2
        if in_gamut((lightness, middle, hue)):
            low = middle
        else:
            high = middle
    return lightness, low, hue


def tone(seed, lightness):
    """The seed's hue at another lightness, with chroma tapering toward black and white."""
    _, chroma, hue = parse(seed) if isinstance(seed, str) else seed
    taper = max(0.15, 1 - abs((lightness - 0.55) / 0.45) ** 3 * 0.85)
    return fmt(fit((lightness, chroma * taper, hue)))


TONES = (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100)


def tonal_scale(seed):
    return {step: to_hex(tone(seed, step / 100)) for step in TONES}


def to_oklab(value):
    lightness, chroma, hue = parse(value)
    return lightness, chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))


def mix(first, second, amount):
    """Mix `amount` (0-1) of `first` into `second` in Oklab, like CSS color-mix(in oklab)."""
    a, b = to_oklab(first), to_oklab(second)
    lightness, x, y = (a[i] * amount + b[i] * (1 - amount) for i in range(3))
    return fmt((lightness, math.hypot(x, y), math.degrees(math.atan2(y, x)) % 360))


WHITE = "oklch(1.000 0.000 0.0)"


def on_color(value):
    """White text if it reaches 4.5:1 on the color, otherwise a near-black of the same hue."""
    if contrast(WHITE, value) >= 4.5:
        return WHITE
    return tone(value, 0.16)


def darken_until(value, against, minimum):
    """Lower lightness, keeping hue, until the color reaches `minimum` contrast with `against`."""
    lightness, chroma, hue = parse(value)
    while contrast(fmt((lightness, chroma, hue)), against) < minimum and lightness > 0.05:
        lightness -= 0.01
        lightness, chroma, hue = fit((lightness, chroma, hue))
    return fmt((lightness, chroma, hue))


def role_color(seed, surface):
    """A seed made usable as a role: 3:1 against the surface, and white or dark text at 4.5:1 on it."""
    value = darken_until(fmt(parse(seed)), surface, 3.0)
    if contrast(on_color(value), value) < 4.5:
        value = darken_until(value, WHITE, 4.5)
    return value
