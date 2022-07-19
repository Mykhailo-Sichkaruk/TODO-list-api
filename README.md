# TODO-list api

Table of Contents

- [Prerequirements](#prerequirements)
- [Installation](#installation)
- [Authentication](#authentication)
- [API](#api)
- [Tech details](#tech-details)

## Prerequirements

- [Node.js](https://nodejs.org/en/)
- [Postgres](https://www.postgresql.org/)

## Installation

- Download repo

```bash
git clone https://github.com/Mykhailo-Sichkaruk/TODO-list-api
```

- Install dependencies:

```bash
npm install
```

- Setup Postgres  
  - Open `.env` file in project root
  - Set `DATABASE_URL` to `postgres://_YOUR_POSTRGES_LOGIN_:_YOUR_POSTGRES_PASSWORD_@localhost:5432/mydb?schema=public`
  - Open **SQL Shell (psql)** login and create database `mydb`
  - Open `/prisma/migrations/20220717135217_init/migration.sql` in project root
  - Copy sql commands and insert it in **SQL Shell (psql)**
- Run server:  

```bash
npm start 
```

- Open browser and go to <http://localhost:4000/docs/> to see API documentation and test it.

### Authentication

- Click **Register** ![register](./docs/register.png)
- Click **Try it out** ![registe-ty-it-out](./docs/register-try-it-out.png)
- Clisk **Execute** ![register-execute](./docs/register-execute.png)
- **Copy** token fron response header or body ![copy-token](./docs/register-copy-token.png)
- Scroll up and click **Autorize** ![click-autorize](./docs/register-autorize.png)
- **Paste token** ![paste-token](./docs/register-paste-token.png) and clisck **Autorize**
`Great You added token to header`

## API

Read detailed about API in Swagger/Open API [docs](http://localhost:4000/docs/)

### Autentication

- Sign up with login and password (POST /auth/register)  
- Sign in with login and password (POST /auth/login)

### List managment

- List has
  - title (string)
  - subscribers (array Users)
  - author (string)
  - tasks (array of strings)
- Create list (POST /list)
- Get list (GET /list/)
- Get all lists (GET /list)
- Update list (PUT /list)
- Delete list (DELETE /list)

### Task managment

- Task has
  - id
  - title
  - body
  - status (`ACTIVE` or `IN_PROGRES` or `DONE` or `CLOSED`)
  - listId
  - deadline
  - authorId
- Create task (POST /task)
- Get task (GET /task/)
- Get all tasks (GET /task)
- Update task (PUT /task)
- Delete task (DELETE /task)

### Scbscribe user to list

- Subscribe user to list (POST /list/subscribe)

## Tech details

- Database: `Postgres`  
- ORM: `Prisma`  
- Language: `TypeScript`
- Execution environment: `Node.js`
- Framework: `Express`
- Documentation: `Swagger/Open API`  
