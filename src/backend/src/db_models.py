from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    name: str = Field()


class InputFile(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    uuid: str = Field(index=True)
    user_id: int | None = Field(default=None, foreign_key='user.id')


if __name__ == '__main__':
    from sqlmodel import create_engine

    sqlite_file_name = 'database.db'
    sqlite_url = f'sqlite:///{sqlite_file_name}'

    engine = create_engine(sqlite_url, echo=True)
