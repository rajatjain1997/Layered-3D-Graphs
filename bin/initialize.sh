#!/bin/bash

redis-server &
service neo4j start &
start shiny-server &

(cd ./code/js/ &&
whoami &&
node index.js)