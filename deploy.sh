#!/bin/sh

version=`jq '.version' package.json | sed 's/\"//g'`

yarn build

zip -r ngaImgBox_v$version.zip dist/
