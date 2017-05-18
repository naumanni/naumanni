#!/bin/sh

set -ex

yarn
yarn build

docker build -t naumanni/naumanni-standalone -f ./Dockerfile .
