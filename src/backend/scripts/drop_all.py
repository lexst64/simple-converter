from sqlalchemy import create_engine
from sqlmodel import SQLModel

if __name__ == '__main__':
    sqlite_file_name = 'database.db'
    sqlite_url = f'sqlite:///{sqlite_file_name}'
    engine = create_engine(sqlite_url, echo=True)
    SQLModel.metadata.drop_all(engine)
