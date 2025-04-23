from sqlmodel import SQLModel, create_engine

if __name__ == '__main__':
    sqlite_file_name = 'database.db'
    sqlite_url = f'sqlite:///{sqlite_file_name}'

    engine = create_engine(sqlite_url, echo=True)
    SQLModel.metadata.create_all(engine)
