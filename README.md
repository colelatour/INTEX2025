INTEX 2025

Section 2 Group 7

Cole LaTour
John Everett
Sarah Peck
Chase Fischer

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
This project consists of a full front-end and back-end system developed for Ella Rises, a nonprofit organization dedicated to inspiring and uplifting young Hispanic women as they pursue higher education and personal growth.

The database was fully normalized, and both the client and server applications were built to ensure accurate data presentation, provide comprehensive CRUD functionality for administrators, and offer meaningful insights into the program’s impact on participants.

Together, these components help make the organization’s mission more accessible by enabling potential donors and sponsors to engage with, support, and contribute to Ella Rises’ ongoing efforts.

All contributors involved in this project have been acknowledged in the credits listed above.
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

URL: https://ellarises27.is404.net

Login Credentials:

Manager Level
  email: manager@example.com
  password: password123

User Level
  email: user@example.com
  password: password123

User with Confetti
  email: victoria.lee9@ellarises.org
  password: password123

Teapot Page Link: https://ellarises27.is404.net/teapot
There is a link in the page footer

## Local Setup Guide

Follow these steps to get the application running on your local machine.

### Prerequisites

Before running the application, ensure you have the following installed:

*   **Node.js**: [Download and install](https://nodejs.org/) (LTS version recommended).
*   **PostgreSQL**: [Download and install](https://www.postgresql.org/).

### 1. Clone the Repository

```bash
git clone <repository-url>
cd INTEX2025
```

### 2. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

### 3. Database Setup

1.  **Create the Database**:
    Open your PostgreSQL tool (like pgAdmin or psql) and create a new database named `ellarises`.

    ```sql
    CREATE DATABASE ellarises;
    ```

2.  **Configure Connection**:
    The application looks for environment variables to connect to the database. You can set these in your terminal session, or rely on the defaults if your local setup matches.

    **Defaults (in `db.js`):**
    *   Host: `localhost`
    *   User: `postgres`
    *   Password: `clatour0` (You will likely need to override this)
    *   Port: `5432`
    *   Database: `ellarises`

    **To override the password (and others) on Windows (PowerShell):**
    ```powershell
    $env:RDS_PASSWORD="your_actual_password"
    $env:RDS_USERNAME="your_actual_username"
    ```

    **To override on Mac/Linux:**
    ```bash
    export RDS_PASSWORD="your_actual_password"
    export RDS_USERNAME="your_actual_username"
    ```

3.  **Run Migrations**:
    Set up the database tables using Knex.

    ```bash
    npx knex migrate:latest
    ```

4.  **Run Seeds (Optional)**:
    Populate the database with initial dummy data.

    ```bash
    npx knex seed:run
    ```

### 4. Running the Application

**Development Mode** (restarts on file changes):
```bash
npm run dev
```

**Production Mode**:
```bash
npm start
```

The application will start on port **3000** by default.
Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)
