#!/bin/bash
until (docker-compose logs -f nginx; false); do sleep 1; done
