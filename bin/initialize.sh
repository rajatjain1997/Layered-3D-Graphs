#!/bin/bash

redis-server &
service neo4j start &
exec /usr/bin/shiny-server 2>&1

