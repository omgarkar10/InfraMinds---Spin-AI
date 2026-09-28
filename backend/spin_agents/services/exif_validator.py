import exifread
import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371000  # radius of Earth in meters
    phi_1 = math.radians(lat1)
    phi_2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi_1) * math.cos(phi_2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def _convert_to_degrees(value):
    d, m, s = value.values
    d = float(d.num) / float(d.den)
    m = float(m.num) / float(m.den)
    s = float(s.num) / float(s.den)
    return d + (m / 60.0) + (s / 3600.0)

def validate_image_gps(file_bytes: bytes, expected_lat: float, expected_lng: float, tolerance_meters: float = 100) -> bool:
    tags = exifread.process_file(file_bytes)
    
    if 'GPS GPSLatitude' not in tags or 'GPS GPSLongitude' not in tags:
        return False
        
    try:
        lat = _convert_to_degrees(tags['GPS GPSLatitude'])
        lng = _convert_to_degrees(tags['GPS GPSLongitude'])
        
        lat_ref = tags.get('GPS GPSLatitudeRef')
        lng_ref = tags.get('GPS GPSLongitudeRef')
        
        if lat_ref and lat_ref.values[0] != 'N':
            lat = -lat
        if lng_ref and lng_ref.values[0] != 'E':
            lng = -lng
            
        distance = haversine(lat, lng, expected_lat, expected_lng)
        return distance <= tolerance_meters
    except Exception:
        return False
