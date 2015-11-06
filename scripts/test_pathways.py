#!/usr/bin/env python
import json
from get_entities_in_pathway import *

pathways_f = open('pathways.txt', 'r')
for line in pathways_f:
  pathway = int(line)

  #print(pathway)
  out_f = open('test/' + line + '.out', 'w')
  out_f.write(json.dumps(get_entities_in_pathway(pathway)))
  out_f.close()
