import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def test_mongo():
    try:
        client = AsyncIOMotorClient('mongodb://localhost:27017/delhi_breathes')
        await client.admin.command('ping')
        print('[OK] MongoDB is running!')
        client.close()
        return True
    except Exception as e:
        print(f'[ERROR] MongoDB connection failed: {e}')
        print('[INFO] Make sure MongoDB is running on localhost:27017')
        return False

if __name__ == "__main__":
    asyncio.run(test_mongo())

