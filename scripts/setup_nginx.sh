#!/bin/bash
docker-compose up -d nginx && docker-compose exec nginx chmod 755 /public
