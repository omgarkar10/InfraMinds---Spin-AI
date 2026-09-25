import os
import re

FRONTEND_DIR = r"c:\Users\niket\Documents\Hackathon-106\Google-Code-For-Communities-\frontend\dashboard\src\components\citizen"
FILE = os.path.join(FRONTEND_DIR, "RaiseGrievanceForm.tsx")

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Add useMapsLibrary and useRef imports if missing
if "useMapsLibrary" not in content:
    content = content.replace(
        'import React, { useState, useEffect } from "react";',
        'import React, { useState, useEffect, useRef } from "react";\nimport { useMapsLibrary } from "@vis.gl/react-google-maps";'
    )
else:
    # Ensure useRef is there
    if "useRef" not in content:
        content = content.replace('useState, useEffect', 'useState, useEffect, useRef')

# Add places hook and refs inside the component
# We'll put it right after const [isVoiceConfirmCardVisible, setIsVoiceConfirmCardVisible] = useState<boolean>(false);
places_state_code = """
  const placesLibrary = useMapsLibrary("places");
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (!placesLibrary || !autocompleteRef.current) return;
    
    const el = autocompleteRef.current;
    
    const handlePlaceSelect = (e: any) => {
      const place = e.place;
      if (place) {
        place.fetchFields({ fields: ['formattedAddress', 'location'] }).then(() => {
          const addr = place.formattedAddress || "";
          setAddress(addr);
          if (place.location) {
            setLatitude(place.location.lat());
            setLongitude(place.location.lng());
            setGpsConfirmed(true);
            setGpsMessage(`Location set to ${addr}.`);
          }
        });
      }
    };

    const handleInput = (e: any) => {
      setAddress(e.target.inputValue || "");
    };

    el.addEventListener('gmp-placeselect', handlePlaceSelect);
    el.addEventListener('input', handleInput);
    
    return () => {
      el.removeEventListener('gmp-placeselect', handlePlaceSelect);
      el.removeEventListener('input', handleInput);
    };
  }, [placesLibrary]);
"""

if "const placesLibrary" not in content:
    content = content.replace(
        'const [isVoiceConfirmCardVisible, setIsVoiceConfirmCardVisible] = useState<boolean>(false);',
        'const [isVoiceConfirmCardVisible, setIsVoiceConfirmCardVisible] = useState<boolean>(false);\n' + places_state_code
    )

# Replace the input element for Address
original_address_html = """              <input
                id="address"
                type="text"
                className="form-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., Near Primary School, Rampur Village, Ward 4"
                required
              />"""

replacement_address_html = """              {placesLibrary ? (
                // @ts-ignore
                <gmp-place-autocomplete
                  ref={autocompleteRef}
                  id="address"
                  className="form-input"
                  style={{ display: "block", width: "100%", padding: 0, border: "none" }}
                ></gmp-place-autocomplete>
              ) : (
                <input
                  id="address"
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g., Near Primary School, Rampur Village, Ward 4"
                  required
                />
              )}
"""

content = content.replace(original_address_html, replacement_address_html)

with open(FILE, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated RaiseGrievanceForm.tsx for Places Autocomplete.")
