#!/usr/bin/python2
import os
import sqlite3

names = [os.path.splitext(f)[0] for f in os.listdir('public/images/stickers/') if f.endswith('png')]

names.sort(reverse=True)

newdata = "var stickers = " + repr(names) + ';'
open('public/js/sticker_list.js', 'w').write(newdata)
