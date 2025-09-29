import uvicorn
from app.seed_data import create_sample_data

if __name__ == "__main__":
    # Create sample data if it doesn't exist
    create_sample_data()
    
    # Start the server
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )