# Formulistic1

[![License](https://img.shields.io/github/license/AungS8430/formulistic1)](LICENSE)
[![Languages](https://img.shields.io/github/languages/top/AungS8430/formulistic1)](https://github.com/AungS8430/formulistic1)
[![Last Commit](https://img.shields.io/github/last-commit/AungS8430/formulistic1)](https://github.com/AungS8430/formulistic1/commits/main)

## Overview

**Formulistic1** is a web application that shows Formula 1 statistics in real time. It offers live race data, driver standings, and historical insights for Formula 1 fans and analysts.

---

## Features

- **Live Formula 1 statistics**
- **Historical data for past seasons and races up to 2018 season**
- **Interactive data visualizations, including both driver and lap-by-lap data**
- Responsive interface (desktop & mobile) _WIP_
- **Modern tech stack (NextJS with TypeScript, FastAPI with Python)**

---

## Tech Stack

- **Frontend:** NextJS with TypeScript (located in `frontend/`)
- **Backend:** FastAPI and FastF1 for data gathering (located in `backend/`)

---

## Project Structure

```
formulistic1/
├── backend/      # Python backend code & API
├── frontend/     # NextJS frontend source code & assets
├── LICENSE
├── README.md
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (recommended v18+)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Python](https://www.python.org/) (recommended v3.8+)

### Installation

1. **Clone the repository:**
    ```bash
    git clone https://github.com/AungS8430/formulistic1.git
    cd formulistic1
    ```

2. **Install frontend dependencies:**
    ```bash
    cd frontend
    npm install
    # or
    yarn install
    ```

3. **Install backend dependencies:**
    ```bash
    cd ../
    backend/install.sh
    ```

---

## Usage

1. **Start the backend server:**
    ```bash
    cd backend
    fastapi run server.py
    ```

2. **Start the frontend development server:**
    ```bash
    cd ../frontend
    npm start
    # or
    yarn start
    ```

3. **Open [http://localhost:3000](http://localhost:3000) in your browser.**

---

## Contributing

Contributions are welcome!  
If you have suggestions, bug reports, or feature requests, please open an issue or submit a pull request.

Steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License.  
See [LICENSE](LICENSE) for details.

---

## Contact

For questions or feedback, open an [issue](https://github.com/AungS8430/formulistic1/issues).
