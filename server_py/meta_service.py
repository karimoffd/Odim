import os
import requests
from typing import Dict, Any, List, Optional

GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

def get_meta_app_credentials():
    app_id = os.environ.get("META_APP_ID", "3931391133824105")
    app_secret = os.environ.get("META_APP_SECRET", "306248fcef24fb15c9657694f10b52f6")
    return app_id, app_secret


def exchange_code_for_user_token(code: str, redirect_uri: str) -> str:
    """
    Exchanges authorization code for a long-lived user access token.
    """
    app_id, app_secret = get_meta_app_credentials()
    url = f"{GRAPH_API_BASE}/oauth/access_token"
    params = {
        "client_id": app_id,
        "client_secret": app_secret,
        "redirect_uri": redirect_uri,
        "code": code
    }
    
    resp = requests.get(url, params=params, timeout=10)
    data = resp.json()
    if resp.status_code != 200 or "error" in data:
        err_msg = data.get("error", {}).get("message", "Meta OAuth token almashishda xatolik")
        raise Exception(err_msg)
    
    short_lived = data.get("access_token")
    
    # Exchange short-lived token for 60-day long-lived token
    long_params = {
        "grant_type": "fb_exchange_token",
        "client_id": app_id,
        "client_secret": app_secret,
        "fb_exchange_token": short_lived
    }
    long_resp = requests.get(url, params=long_params, timeout=10)
    long_data = long_resp.json()
    return long_data.get("access_token") or short_lived

def discover_user_pages_and_instagram(user_access_token: str) -> List[Dict[str, Any]]:
    """
    Fetches all managed Facebook Pages and linked Instagram Business accounts.
    """
    fields = "id,name,category,access_token,tasks,picture{url},instagram_business_account{id,username,name,profile_picture_url}"
    url = f"{GRAPH_API_BASE}/me/accounts"
    params = {
        "fields": fields,
        "access_token": user_access_token,
        "limit": 50
    }
    
    resp = requests.get(url, params=params, timeout=10)
    data = resp.json()
    if resp.status_code != 200 or "error" in data:
        err_msg = data.get("error", {}).get("message", "Sahifalarni olishda xatolik")
        raise Exception(err_msg)
    
    raw_pages = data.get("data", [])
    result = []
    for page in raw_pages:
        ig_biz = page.get("instagram_business_account")
        result.append({
            "pageId": page.get("id"),
            "pageName": page.get("name"),
            "category": page.get("category", "Biznes Sahifa"),
            "pagePicture": page.get("picture", {}).get("data", {}).get("url", ""),
            "pageAccessToken": page.get("access_token"),
            "hasInstagram": bool(ig_biz and ig_biz.get("id")),
            "instagram": {
                "id": ig_biz.get("id"),
                "username": ig_biz.get("username", ""),
                "name": ig_biz.get("name", ""),
                "profilePicture": ig_biz.get("profile_picture_url", "")
            } if ig_biz else None
        })
    return result

def subscribe_page_to_webhooks(page_id: str, page_access_token: str) -> bool:
    """
    Subscribes Facebook Page to messages, messaging_postbacks, and feed.
    """
    if not page_access_token or "mock" in page_access_token:
        return True

    url = f"{GRAPH_API_BASE}/{page_id}/subscribed_apps"
    payload = {
        "subscribed_fields": [
            "messages",
            "messaging_postbacks",
            "message_deliveries",
            "message_reads",
            "feed"
        ],
        "access_token": page_access_token
    }
    try:
        resp = requests.post(url, json=payload, timeout=8)
        data = resp.json()
        return bool(data.get("success"))
    except Exception as e:
        print(f"⚠️ Webhook obunasi xatosi ({page_id}): {e}")
        return False

def get_demo_discovered_pages() -> List[Dict[str, Any]]:
    """
    Realistic demo accounts for immediate testing when running in local development mode.
    """
    return [
        {
            "pageId": "104928174829102",
            "pageName": "Odim CRM Rasmiy Sahifasi",
            "category": "Biznes va Texnologiya",
            "pagePicture": "https://images.unsplash.com/photo-1556742049-0a67c5574f73?w=100&auto=format&fit=crop&q=80",
            "pageAccessToken": "EAABwzLixnjYBAOnv98234y189312_mock_token_odim_brand",
            "hasInstagram": True,
            "instagram": {
                "id": "17841400234567890",
                "username": "odim.uz",
                "name": "ODIM CRM System Rasmiy",
                "profilePicture": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80"
            }
        },
        {
            "pageId": "209485729104928",
            "pageName": "Odim Mijozlarni Qo'llab-quvvatlash Hubi",
            "category": "Customer Support",
            "pagePicture": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
            "pageAccessToken": "EAABwzLixnjYBAOnv98234y189312_mock_token_odim_support",
            "hasInstagram": False,
            "instagram": None
        }
    ]
