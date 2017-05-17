#!/bin/sh

set -ex

yarn
yarn build

docker build -t naumanni.com/naumanni-standalone -f ./Dockerfile .
