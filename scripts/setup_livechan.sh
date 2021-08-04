#!/bin/bash
docker-compose up -d livechan && docker-compose exec -u root livechan chown -R livechan:livechan persist
