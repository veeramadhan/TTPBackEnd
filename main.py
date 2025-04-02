from fastapi import FastAPI, HTTPException, File,  UploadFile 
from motor.motor_asyncio import AsyncIOMotorClient

from bson import ObjectId
import cloudinary
import cloudinary.uploader

# Initialize FastAPI app
app = FastAPI()

# Cloudinary Configuration
cloudinary.config(
    cloud_name="dzxxihhhx",
    api_key="173367758629196",
    api_secret="6jvBLiZ7J_N2MNFBp8V35gbTzCU"
)

# MongoDB Connection
MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "maduraitourplanner"
client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]
collection = db["travelplaces"]

# CORS middleware
from fastapi.middleware.cors import CORSMiddleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Function to convert MongoDB documents to JSON-serializable format
def serialize_document(doc):
    doc["_id"] = str(doc["_id"])  # Convert ObjectId to string
    return doc

# Route to fetch all travel places
@app.get("/places")
async def get_places():
    try:
        places = await collection.find().to_list(100)
        serialized_places = [serialize_document(place) for place in places]
        print("API Response:", serialized_places)  # Debugging
        return {"places": serialized_places}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

