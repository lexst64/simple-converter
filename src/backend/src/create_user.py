from sqlmodel import Session, create_engine, select

from db_models import User

sqlite_file_name = 'database.db'
sqlite_url = f'sqlite:///{sqlite_file_name}'

# allows FastAPI to use the same SQLite database in different threads.
# This is necessary as one single request could use more than one thread
# (for example in dependencies).
connect_args = {'check_same_thread': False}

engine = create_engine(sqlite_url, connect_args=connect_args)
with Session(engine) as session:
    statement = select(User).where(User.email == 'email')
    res = session.exec(statement)
    print(res.one())
