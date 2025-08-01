from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime
import hashlib

app = FastAPI(title="Feature Voting System", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Specific origin for credentials
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

features_db = {}
users_db = {}
votes_db = {}

class User(BaseModel):
    id: str
    ip_address: str
    cookie_id: str
    created_at: datetime

class FeatureCreate(BaseModel):
    title: str
    description: str
    anchor_to: Optional[str] = None

class Feature(BaseModel):
    id: str
    title: str
    description: str
    vote_count: int
    created_at: datetime
    created_by: str
    anchor_to: Optional[str] = None
    archived: bool = False
    anchored_features: List[str] = []

def get_or_create_user(request: Request, response: Response) -> str:
    """Get or create user based on IP + cookie"""
    ip_address = request.client.host
    cookie_id = request.cookies.get("user_id")
    
    if not cookie_id:
        cookie_id = str(uuid.uuid4())
        response.set_cookie("user_id", cookie_id, max_age=365*24*60*60)  # 1 year
    
    user_key = f"{ip_address}_{cookie_id}"
    
    if user_key not in users_db:
        user = User(
            id=user_key,
            ip_address=ip_address,
            cookie_id=cookie_id,
            created_at=datetime.now()
        )
        users_db[user_key] = user
    
    return user_key

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/features", response_model=List[Feature])
async def get_features(sort_by: str = "votes", order: str = "desc"):
    """Get all features with sorting options"""
    features = [f for f in features_db.values() if not f.archived]
    
    for feature in features:
        feature.anchored_features = [
            f.id for f in features_db.values() 
            if f.anchor_to == feature.id and not f.archived
        ]
    
    if sort_by == "date":
        features.sort(key=lambda x: x.created_at, reverse=(order == "desc"))
    elif sort_by == "votes":
        features.sort(key=lambda x: x.vote_count, reverse=(order == "desc"))
    
    return features

@app.post("/features", response_model=Feature)
async def create_feature(feature_data: FeatureCreate, request: Request, response: Response):
    """Create a new feature"""
    user_id = get_or_create_user(request, response)
    feature_id = str(uuid.uuid4())
    
    if feature_data.anchor_to and feature_data.anchor_to not in features_db:
        raise HTTPException(status_code=404, detail="Anchor feature not found")
    
    feature = Feature(
        id=feature_id,
        title=feature_data.title,
        description=feature_data.description,
        vote_count=0,
        created_at=datetime.now(),
        created_by=user_id,
        anchor_to=feature_data.anchor_to,
        archived=False,
        anchored_features=[]
    )
    features_db[feature_id] = feature
    return feature

@app.post("/features/{feature_id}/vote", response_model=Feature)
async def vote_for_feature(feature_id: str, request: Request, response: Response):
    """Upvote a feature"""
    if feature_id not in features_db:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    user_id = get_or_create_user(request, response)
    vote_key = f"{user_id}_{feature_id}"
    
    if vote_key in votes_db:
        raise HTTPException(status_code=400, detail="User already voted for this feature")
    
    feature = features_db[feature_id]
    feature.vote_count += 1
    votes_db[vote_key] = {
        "user_id": user_id,
        "feature_id": feature_id,
        "voted_at": datetime.now()
    }
    
    return feature

@app.post("/features/{feature_id}/archive", response_model=Feature)
async def archive_feature(feature_id: str, request: Request, response: Response):
    """Archive a feature (trash effect)"""
    if feature_id not in features_db:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    user_id = get_or_create_user(request, response)
    feature = features_db[feature_id]
    
    if feature.created_by != user_id:
        raise HTTPException(status_code=403, detail="Only feature creator can archive")
    
    feature.archived = True
    return feature

@app.get("/features/{feature_id}/anchored", response_model=List[Feature])
async def get_anchored_features(feature_id: str):
    """Get all features anchored to a specific feature"""
    if feature_id not in features_db:
        raise HTTPException(status_code=404, detail="Feature not found")
    
    anchored = [
        f for f in features_db.values() 
        if f.anchor_to == feature_id and not f.archived
    ]
    anchored.sort(key=lambda x: x.created_at)
    return anchored

@app.get("/features/{feature_id}", response_model=Feature)
async def get_feature(feature_id: str):
    """Get a specific feature by ID"""
    if feature_id not in features_db:
        raise HTTPException(status_code=404, detail="Feature not found")
    return features_db[feature_id]
