certs:
	./setup.sh

up: certs
	docker-compose up --build

all: up

down:
	docker-compose down -v

.PHONY: certs up all


