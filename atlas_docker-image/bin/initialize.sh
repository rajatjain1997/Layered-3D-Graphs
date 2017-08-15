#!/bin/bash

redis-server &
service neo4j start &
cs js/
node index.js &
shiny-server