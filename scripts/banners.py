#!/usr/bin/python2
import os

names = [f for f in os.listdir('public/images/banners/') if f.endswith('png') or f.endswith('jpg') or f.endswith('gif')]

newdata = "var banners = " + repr(names) + ';'
open('public/js/banners.js', 'w').write(newdata)

