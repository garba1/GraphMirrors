#!/usr/bin/python
import sqlite3
import mysql.connector
import json
import sys
from get_entities_by_id import *

def get_entities_in_pathway(reactome_id):

  db = sqlite3.connect('../data.db')
  c = db.cursor()

  c.execute('SELECT pathway_id FROM pathways WHERE reactome_id=? LIMIT 1',
            (reactome_id,))
  pathway_id = c.fetchone()[0]

  #print('pathwayid:', pathway_id)

  entity_ids = []
  c.execute('SELECT entity_id FROM entity_pathways WHERE pathway_id=?',
            (pathway_id,))
  for (entity_id,) in c:
    entity_ids.append(str(entity_id))

  #print(','.join(entity_ids))

  return get_entities_by_id(','.join(entity_ids))

if '__main__' == __name__:
  pathway_id = sys.argv[1]
  print(json.dumps(get_entities_in_pathway(pathway_id)))
