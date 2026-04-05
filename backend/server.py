from fastapi import FastAPI, APIRouter, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import aiomysql

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# MySQL connection pool
pool = None

MYSQL_CONFIG = {
    "host": os.environ["MYSQL_HOST"],
    "user": os.environ["MYSQL_USER"],
    "password": os.environ["MYSQL_PASSWORD"],
    "db": os.environ["MYSQL_DB"],
    "charset": "utf8mb4",
    "maxsize": 10,
    "minsize": 1,
}

async def get_pool():
    global pool
    if pool is None:
        pool = await aiomysql.create_pool(**MYSQL_CONFIG)
    return pool


# Models
class CityResult(BaseModel):
    comune: str
    provincia: str

class FuelPrice(BaseModel):
    tipo: str
    prezzo: float
    self_service: bool

class Station(BaseModel):
    id: int
    gestore: str
    nome: str
    indirizzo: str
    lat: Optional[float]
    lng: Optional[float]
    prezzi: List[FuelPrice]


@api_router.get("/healthz")
async def health_check():
    return {"status": "ok"}


@api_router.get("/fuel/cities", response_model=List[CityResult])
async def search_cities(q: str = Query(default="")):
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT DISTINCT comune, provincia FROM stations WHERE comune LIKE %s ORDER BY comune LIMIT 10",
                (f"%{q}%",)
            )
            rows = await cur.fetchall()
    return [CityResult(comune=r["comune"], provincia=r["provincia"]) for r in rows]


@api_router.get("/fuel/fuels", response_model=List[str])
async def list_fuel_types():
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(
                "SELECT DISTINCT descCarburante FROM station_prices ORDER BY descCarburante LIMIT 100"
            )
            rows = await cur.fetchall()
    return [r["descCarburante"] for r in rows]


@api_router.get("/fuel/stations", response_model=List[Station])
async def list_stations(comune: str = Query(...), fuel: Optional[str] = Query(default=None)):
    p = await get_pool()
    async with p.acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            if fuel:
                join_cond = "s.idImpianto = sp.idImpianto AND sp.descCarburante = %s"
                query = f"""
                    SELECT s.idImpianto, s.gestore, s.denominazione, s.indirizzo,
                           s.comune, s.provincia, s.lat, s.lng,
                           sp.descCarburante, sp.prezzo, sp.isSelf
                    FROM stations s
                    LEFT JOIN station_prices sp ON {join_cond}
                    WHERE s.comune = %s
                    ORDER BY sp.prezzo IS NULL, sp.prezzo ASC
                """
                params = (fuel, comune)
            else:
                query = """
                    SELECT s.idImpianto, s.gestore, s.denominazione, s.indirizzo,
                           s.comune, s.provincia, s.lat, s.lng,
                           sp.descCarburante, sp.prezzo, sp.isSelf
                    FROM stations s
                    LEFT JOIN station_prices sp ON s.idImpianto = sp.idImpianto
                    WHERE s.comune = %s
                    ORDER BY sp.prezzo IS NULL, sp.prezzo ASC
                """
                params = (comune,)

            await cur.execute(query, params)
            rows = await cur.fetchall()

    station_map = {}
    for row in rows:
        sid = row["idImpianto"]
        if sid not in station_map:
            lat_val = float(row["lat"]) if row["lat"] is not None else None
            lng_val = float(row["lng"]) if row["lng"] is not None else None
            station_map[sid] = Station(
                id=sid,
                gestore=row["gestore"] or "",
                nome=row["denominazione"] or row["indirizzo"] or "",
                indirizzo=row["indirizzo"] or "",
                lat=lat_val,
                lng=lng_val,
                prezzi=[]
            )
        if row["descCarburante"] is not None and row["prezzo"] is not None:
            station_map[sid].prezzi.append(FuelPrice(
                tipo=row["descCarburante"],
                prezzo=float(row["prezzo"]),
                self_service=bool(row["isSelf"])
            ))

    return list(station_map.values())


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown():
    global pool
    if pool:
        pool.close()
        await pool.wait_closed()
