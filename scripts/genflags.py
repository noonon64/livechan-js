#!/usr/bin/env python2
from tripcode import tripcode
import os
for f in os.listdir('public/icons/tripflags/'):
    print f, tripcode(f)

