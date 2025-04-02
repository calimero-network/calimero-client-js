#!/bin/bash

rm -rf node_modules dist lib && pnpm install

if [ $? -ne 0 ]; then
  echo "pnpm install failed. Exiting."
  exit 1
fi

pnpm run watch
