#!/usr/bin/python
import sqlite3

def reactome_pathway_ids():
  db = sqlite3.connect('../data.db')
  c = db.cursor()

  c.execute('SELECT pathway_id, reactome_id FROM pathways '
            'WHERE pathway_id IS NOT NULL AND reactome_ID IS NOT NULL',
            (reactome_id,))
  pathway_id = c.fetchone()[0]

  entity_ids = []
  c.execute('SELECT entity_id FROM entity_pathways WHERE pathway_id=?',
            (pathway_id,))
  for (entity_id,) in c:
    entity_ids.append(str(entity_id))

  return get_entities_by_reactome_id(','.join(entity_ids))

if '__main__' == __name__:
  pathway_id = sys.argv[1]
  print(json.dumps(get_entities_in_pathway(pathway_id)))
