#!/bin/bash
docker-compose exec mongo bash -c 'mongo mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@localhost:${MONGO_PORT}/${MONGO_DB}?authSource=admin'
