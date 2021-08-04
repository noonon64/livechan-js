#!/usr/bin/env python
import os
commit = '3ecfcd92a7d6d443f48ad7c9d131f31b42f728a3'
root = 'pages/'
text = f'git diff -D {commit} -- {root}'
for ignore in filter(lambda t: t and not t.startswith('#'), open('._notes/diff-ignore').read().split('\n')):
    text += f' \':(exclude){ignore}\''
print(text)
os.system(text)
