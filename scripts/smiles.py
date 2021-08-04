#!/usr/bin/python2
import os

names = [f for f in os.listdir('public/icons/smiles/') if f.endswith('gif')]

newdata = "var smiles = " + repr(names).replace(".gif","")

newtheme = ""

for smile in names:
	newtheme = newtheme+smile + " *"+smile.replace(".gif","")+"*\n"


open('public/icons/smiles/theme','w').write(newtheme)
open('public/js/smiles.js', 'w').write(newdata)
