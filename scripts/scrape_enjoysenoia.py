#!/usr/bin/env python3
import urllib.request
import json
import os
import re
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

BASE_URL = "https://enjoysenoia.com"
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

os.makedirs(DATA_DIR, exist_ok=True)

import ssl

ssl_context = ssl._create_unverified_context()

def fetch_url(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, context=ssl_context, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def extract_all():
    visited = set()
    to_visit = [
        "/",
        "/about-the-dda",
        "/about-the-veterans-memorial",
        "/files-forms-and-downloads",
        "/senoia-history",
        "/dda-business-portal",
        "/downtown-businesses",
        "/events",
        "/past-events",
        "/media",
        "/news",
        "/privacy-policy"
    ]
    
    pages_data = {}
    events_data = []
    businesses_data = []
    news_data = []
    downloads_data = []

    print("Starting crawl of enjoysenoia.com...")
    
    while to_visit:
        path = to_visit.pop(0)
        if path in visited or path.startswith("mailto:") or path.startswith("tel:") or path.startswith("#"):
            continue
        
        visited.add(path)
        url = urljoin(BASE_URL, path)
        print(f"Fetching: {url}")
        
        html = fetch_url(url)
        if not html:
            continue
            
        soup = BeautifulSoup(html, "html.parser")
        
        # Collect new internal links
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            if not href or href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
                continue
            parsed = urlparse(href)
            if (not parsed.netloc or parsed.netloc in ["enjoysenoia.com", "www.enjoysenoia.com"]) and not href.endswith(('.jpg', '.png', '.pdf', '.svg', '.webp')):
                clean_path = parsed.path
                if clean_path and clean_path not in visited and clean_path not in to_visit:
                    to_visit.append(clean_path)
        
        # Save page metadata
        title = soup.title.string.strip() if soup.title else ""
        meta_desc = ""
        meta_tag = soup.find("meta", attrs={"name": "description"})
        if meta_tag and meta_tag.get("content"):
            meta_desc = meta_tag["content"]
            
        og_image = ""
        og_img_tag = soup.find("meta", attrs={"property": "og:image"})
        if og_img_tag and og_img_tag.get("content"):
            og_image = og_img_tag["content"]

        # Extract main text
        main_el = soup.find("main") or soup.find("body")
        page_text = main_el.get_text(separator="\n", strip=True) if main_el else ""

        pages_data[path] = {
            "path": path,
            "url": url,
            "title": title,
            "description": meta_desc,
            "og_image": og_image,
            "text": page_text
        }

        # Specific Parsing for Businesses
        if path == "/downtown-businesses" or "business" in path:
            cards = soup.select('.w-dyn-item, .collection-item, [class*="business-card"]')
            for item in cards:
                name_el = item.find(["h2", "h3", "h4", "h5", "div"], class_=re.compile(r'title|name|heading', re.I))
                if name_el and name_el.get_text(strip=True):
                    name = name_el.get_text(strip=True)
                    cat_el = item.find(class_=re.compile(r'category|type|tag', re.I))
                    category = cat_el.get_text(strip=True) if cat_el else "General"
                    addr_el = item.find(class_=re.compile(r'address|location', re.I))
                    address = addr_el.get_text(strip=True) if addr_el else ""
                    phone_el = item.find("a", href=re.compile(r'^tel:'))
                    phone = phone_el.get_text(strip=True) if phone_el else ""
                    link_el = item.find("a", href=re.compile(r'^https?://(?!enjoysenoia)'))
                    website = link_el["href"] if link_el else ""
                    img_el = item.find("img")
                    img_url = img_el["src"] if img_el and img_el.get("src") else ""
                    desc_el = item.find(class_=re.compile(r'desc|text|paragraph|detail', re.I))
                    desc = desc_el.get_text(strip=True) if desc_el else ""
                    
                    if not any(b.get("name") == name for b in businesses_data):
                        businesses_data.append({
                            "name": name,
                            "category": category,
                            "address": address,
                            "phone": phone,
                            "website": website,
                            "image": img_url,
                            "description": desc
                        })

        # Specific Parsing for Events
        for item in soup.select('.blog5_item, [class*="event"], .collection-item-6'):
            title_el = item.find(["h2", "h3", "h4"], class_=re.compile(r'title|heading', re.I))
            if title_el and title_el.get_text(strip=True):
                evt_title = title_el.get_text(strip=True)
                date_el = item.find(class_=re.compile(r'date|time', re.I))
                evt_date = date_el.get_text(strip=True) if date_el else ""
                cat_el = item.find(class_=re.compile(r'author|category|tag|type', re.I))
                evt_cat = cat_el.get_text(strip=True) if cat_el else "Community Event"
                desc_el = item.find(class_=re.compile(r'regular|desc|text', re.I))
                evt_desc = desc_el.get_text(strip=True) if desc_el else ""
                img_el = item.find("img")
                evt_img = img_el.get("src", "") if img_el else ""
                a_el = item.find_parent("a") or item.find("a")
                evt_link = a_el["href"] if a_el and a_el.get("href") else ""
                
                if not any(e.get("title") == evt_title for e in events_data):
                    events_data.append({
                        "title": evt_title,
                        "date_time": evt_date,
                        "category": evt_cat,
                        "description": evt_desc,
                        "image": evt_img,
                        "link": evt_link,
                        "is_recurring": "farmers" in evt_title.lower() or "alive after five" in evt_title.lower()
                    })

        # Specific Parsing for News
        for item in soup.select('.blog36_component .flex-item, .blogpost3_date-wrapper, [class*="news"]'):
            top_wrap = item.find(class_=re.compile(r'item-wrap|top-wrap|blog36', re.I)) or item
            title_el = top_wrap.find(["h2", "h3", "h4"], class_=re.compile(r'heading|title', re.I))
            if title_el and title_el.get_text(strip=True):
                news_title = title_el.get_text(strip=True)
                date_el = top_wrap.find(class_=re.compile(r'date', re.I))
                news_date = date_el.get_text(strip=True) if date_el else ""
                desc_el = top_wrap.find(class_=re.compile(r'regular|text-size-regular|excerpt', re.I))
                news_desc = desc_el.get_text(strip=True) if desc_el else ""
                img_el = top_wrap.find("img")
                news_img = img_el.get("src", "") if img_el else ""
                a_el = item if item.name == "a" else item.find("a")
                news_link = a_el["href"] if a_el and a_el.get("href") else ""
                
                if news_title not in ["Senoia DDA News...", "News...."] and not any(n.get("title") == news_title for n in news_data):
                    news_data.append({
                        "title": news_title,
                        "date": news_date,
                        "summary": news_desc,
                        "image": news_img,
                        "link": news_link
                    })

        # Specific Parsing for Files & Downloads
        if "files-forms" in path or "downloads" in path:
            for item in soup.find_all(["a", "div"], class_=re.compile(r'download|file|form|document', re.I)):
                href = item.get("href", "")
                name = item.get_text(strip=True)
                if href and (href.endswith('.pdf') or 'box.com' in href or 'drive.google' in href):
                    downloads_data.append({
                        "name": name,
                        "url": href,
                        "category": "General"
                    })

    # Save to files
    with open(os.path.join(DATA_DIR, "pages.json"), "w") as f:
        json.dump(pages_data, f, indent=2)
        
    with open(os.path.join(DATA_DIR, "events.json"), "w") as f:
        json.dump(events_data, f, indent=2)
        
    with open(os.path.join(DATA_DIR, "businesses.json"), "w") as f:
        json.dump(businesses_data, f, indent=2)
        
    with open(os.path.join(DATA_DIR, "news.json"), "w") as f:
        json.dump(news_data, f, indent=2)
        
    with open(os.path.join(DATA_DIR, "downloads.json"), "w") as f:
        json.dump(downloads_data, f, indent=2)

    print(f"Extracted {len(pages_data)} pages.")
    print(f"Extracted {len(events_data)} events.")
    print(f"Extracted {len(businesses_data)} businesses.")
    print(f"Extracted {len(news_data)} news items.")
    print(f"Extracted {len(downloads_data)} downloads.")

if __name__ == "__main__":
    extract_all()
