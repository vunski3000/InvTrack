import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from supabase import create_client, Client

# Initialize FastAPI app
app = FastAPI(title="InvTrack API")

# Configure CORS to allow requests from your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_SECRET_KEY = os.environ.get("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SECRET_KEY environment variables must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SECRET_KEY)
    
# Data Models
class InventoryItem(BaseModel):
    item: str
    description: Optional[str] = None
    category: str
    quantity_available: int
    unit: str

@app.get("/")
def read_root():
    return {"message": "Welcome to the InvTrack Python API"}

@app.get("/api/inventory")
def get_inventory():
    # Fetch inventory from Supabase
    response = supabase.table('inventory_procurement').select('*').order('item_id').execute()
    return response.data

@app.post("/api/inventory")
def add_inventory(item: InventoryItem):
    response = supabase.table('inventory_procurement').insert(item.dict()).execute()
    return response.data

@app.get("/api/categories")
def get_categories():
    response = supabase.table('categories').select('*').execute()
    return response.data

@app.get("/api/units")
def get_units():
    response = supabase.table('units').select('*').execute()
    return response.data