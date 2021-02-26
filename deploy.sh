#!/bin/sh

version=`jq '.version' package.json | sed 's/\"//g'`

yarn build

cd dist

zip -r ngaImgBox_v$version.zip ./*

mv ngaImgBox_v$version.zip ../
