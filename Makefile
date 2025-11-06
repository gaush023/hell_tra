certs:
	./setup.sh

# clean build (no cache)
build:
	docker-compose build --no-cache

# normal build
build-fast:
	docker-compose build

up: certs
	docker-compose up -d

up-rebuild: certs build
	docker-compose up -d

down:
	docker-compose down -v

logs:
	docker-compose logs -f

all: build up

.PHONY: certs build build-fast up up-rebuild down logs
