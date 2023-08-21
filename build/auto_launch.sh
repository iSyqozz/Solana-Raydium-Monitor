#!/bin/bash

while true; do
    if ! pgrep -f "fetch_metadata.js" > /dev/null; then
        echo "fetch_metadata.js is not running"
        echo "starting fetch_metadata.js"
        nohup node fetch_metadata.js & disown
    fi
    sleep 5
done