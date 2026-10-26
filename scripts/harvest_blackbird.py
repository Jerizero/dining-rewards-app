import subprocess
import time
import xml.etree.ElementTree as ET
import json

ADB_DEVICE = "192.168.86.101:40903"
OUTPUT_FILE = "/Users/jerielacosta/.gemini/antigravity/scratch/dining-rewards-re/blackbird/harvested_blackbird.json"

def adb(cmd):
    full_cmd = f"/opt/homebrew/bin/adb -s {ADB_DEVICE} {cmd}"
    res = subprocess.run(full_cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return res.stdout.strip()

def swipe_up():
    adb("shell input swipe 672 2100 672 900 350")
    time.sleep(1.2)

def extract_current_screen():
    adb("shell uiautomator dump /sdcard/bb_screen.xml")
    time.sleep(0.5)
    xml_str = adb("shell cat /sdcard/bb_screen.xml")
    
    if "<?xml" not in xml_str:
        return []
    
    # Trim to valid xml
    idx = xml_str.find("<?xml")
    xml_str = xml_str[idx:]

    try:
        root = ET.fromstring(xml_str)
    except Exception as e:
        return []

    # Get all text elements
    text_nodes = []
    for n in root.iter("node"):
        t = n.attrib.get("text", "").strip()
        if t:
            text_nodes.append(t)

    venues = []
    for i, t in enumerate(text_nodes):
        if " / " in t and ("$" in t):
            name = text_nodes[i - 1] if i > 0 else ""
            hours = text_nodes[i + 1] if i + 1 < len(text_nodes) else ""
            
            if name and name not in ["Open", "10X", "Cuisine", "Specials", "Restaurants"]:
                parts = [p.strip() for p in t.split(" / ")]
                cuisine = parts[0] if len(parts) > 0 else "American"
                price = parts[1] if len(parts) > 1 else "$$"
                neighborhood = parts[2] if len(parts) > 2 else "New York"
                
                venues.append({
                    "name": name,
                    "cuisine": cuisine,
                    "price": price,
                    "neighborhood": neighborhood,
                    "hours": hours
                })
    return venues

def main():
    print("Starting Blackbird automated harvesting on Pixel...")
    all_venues = {}
    
    # Swipe 35 times across NYC
    for swipe_idx in range(35):
        screen_venues = extract_current_screen()
        new_count = 0
        for v in screen_venues:
            if v["name"] not in all_venues:
                all_venues[v["name"]] = v
                new_count += 1
                print(f"  + {v['name']} ({v['neighborhood']}, {v['cuisine']})")
        
        print(f"Swipe {swipe_idx+1}/35 -> Total harvested: {len(all_venues)}")
        swipe_up()

    venue_list = list(all_venues.values())
    print(f"\nFinished! Harvested {len(venue_list)} Blackbird restaurants.")
    with open(OUTPUT_FILE, "w") as fp:
        json.dump(venue_list, fp, indent=2)
    print("Saved to:", OUTPUT_FILE)

if __name__ == "__main__":
    main()
