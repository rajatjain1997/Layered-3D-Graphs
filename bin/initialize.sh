#!/bin/bash

redis-server &
service neo4j start &
(cd ./code/js/ &&
nohup node index.js) &
exec /usr/bin/shiny-server 2>&1

