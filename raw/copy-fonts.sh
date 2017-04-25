#!/bin/sh
# copy fontello files to www/static folder
# see http://fontello.com

set -e
set -x

if [ $# -ne 1 ]; then
	echo 'usage: ./copy-fonts.sh [fontello directory]' 1>&2
  exit 1
fi

FONTELLO_NAME=$1

# move to sh's dreictory
# cd `dirname $0`

if [ ! -d $FONTELLO_NAME ]; then
  # 存在する場合
	echo 'fontello directory not found' 1>&2
	exit 1
fi

find $FONTELLO_NAME -type f | xargs chmod -x
cp $FONTELLO_NAME/font/* ./static/font/
cat $FONTELLO_NAME/css/naumanni.css | sed -e 's|../font/|./font/|g' > ./src/css/_font.css
