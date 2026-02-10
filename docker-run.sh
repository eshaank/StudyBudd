#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect which docker compose command is available
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}Error: docker compose or docker-compose not found.${NC}"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down containers...${NC}"
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml down
    echo -e "${GREEN}Containers stopped successfully.${NC}"
    exit 0
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found in project root.${NC}"
    echo -e "${YELLOW}Copy docs/env.example to .env and fill in your Supabase credentials.${NC}"
    exit 1
fi

# Check if ports are already in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${RED}Error: Port $1 is already in use.${NC}"
        return 1
    fi
    return 0
}

# Check required ports
if ! check_port 3000 || ! check_port 8000; then
    echo -e "${YELLOW}Please stop the processes using these ports.${NC}"
    exit 1
fi

echo -e "${GREEN}Starting StudyBudd (dev mode, Supabase backend)...${NC}"
echo -e "${YELLOW}Services:${NC}"
echo -e "  - Frontend (Next.js):  http://localhost:3000"
echo -e "  - Backend (FastAPI):   http://localhost:8000"
echo -e "${YELLOW}View logs: docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all containers${NC}\n"

# Start docker compose in dev mode
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up --build

# If docker compose exits for any reason, run cleanup
cleanup
