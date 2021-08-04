#!/bin/bash
until (docker-compose logs -f livechan; false); do sleep 1; done
