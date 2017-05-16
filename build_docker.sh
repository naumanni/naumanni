#!/bin/sh

set -ex

cd naumanni
yarn
yarn build
cd ..


docker build -t naumanni.com/naumanni-standalone -f ./Dockerfile .
