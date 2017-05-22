#!/bin/sh

set -ex

GIT_REV=$(git rev-parse --short HEAD)
sed -i.bak "s/__NAUMMANI_VERSION__/$GIT_REV/g" www/index.html
rm www/*.bak
yarn
yarn build

docker build -t naumanni/naumanni-standalone -f ./Dockerfile .
