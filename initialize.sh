#!/bin/bash

redis-server &
neo4j &
cs js/
node index.js &