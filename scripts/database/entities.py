#!/usr/bin/python

import sqlite3
import re
import mysql.connector

target = sqlite3.connect('data.db')
tc = target.cursor()

tc.execute('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'pathways\'')
if not tc.fetchone():
  print('ERROR: Must create pathways first.')
  sys.exit()

tc.execute('DROP TABLE IF EXISTS entities')
tc.execute('DROP TABLE IF EXISTS entity_pathways')

tc.execute('CREATE TABLE entities (entity_id INTEGER PRIMARY KEY, entity_type TEXT, name TEXT, location TEXT, reactome_id TEXT, uniprot_id TEXT, entrez_id TEXT)')
tc.execute('CREATE TABLE entity_pathways (entity_id, pathway_id, local_id, PRIMARY KEY(entity_id, pathway_id))')

source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome')
sc = source.cursor()

sc.execute('SHOW TABLES')
tables = []
for (tablename,) in sc:
  tables.append(tablename)

last_completion = 0
table_count = 0
print('Entities:')

#tables = ['199220_1pathway2step',
#          '199220_2step2step',
#          '199220_3step2reaction',
#          '199220_4reaction',
#          '199220_5catalysis',
#          '199220_6complex',
#          '199220_7protein',
#          '199220_8convertedEntity',
#          '199220_9smallEntity']

lost={}
for tablename in tables:
  table_count = table_count + 1
  completion = int(20 * table_count / len(tables))
  if completion > last_completion:
    last_completion = completion
    print('  ', completion * 5, '%')

  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_reactome_id = int(m.group(1))
  tabletype = m.group(2)

  tc.execute('SELECT pathway_id FROM pathways WHERE reactome_id=?',
             (pathway_reactome_id,))
  pathway_id = tc.fetchone()
  if not pathway_id:
    lost[pathway_reactome_id]=True
  else:
    pathway_id = pathway_id[0]

    if '7protein' == tabletype or '9smallEntity' == tabletype:
      sc.execute('SELECT * FROM %s' % (tablename,))
      for (local_id, name, uniprot_id, reactome_id, location) in sc:
        reactome_id = int(reactome_id[16:])
        if '7protein' == tabletype:
          m = re.search('UniProt:([\w-]+)', uniprot_id)
          uniprot_id = m.group(1)
        else:
          uniprot_id = None
        m = re.search('^([a-zA-Z_]+)', local_id)
        entity_id = None
        tc.execute('SELECT 1 FROM entities WHERE reactome_id=?', (reactome_id,))
        if not tc.fetchone():
          tc.execute('INSERT INTO entities(entity_type, name, location, reactome_id, uniprot_id) '
                     'VALUES (?, ?, ?, ?, ?)',
                     (m.group(1), name, location, reactome_id, uniprot_id))
          tc.execute('SELECT last_insert_rowid()')
          entity_id = tc.fetchone()[0]
        else:
          tc.execute('SELECT entity_id FROM entities WHERE reactome_id=?', (reactome_id,))
          entity_id = tc.fetchone()[0]
        tc.execute('INSERT INTO entity_pathways(entity_id, pathway_id, local_id) '
                   'SELECT ?, ?, ? '
                   'WHERE NOT EXISTS('
                   '  SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
                   (entity_id, pathway_id, local_id, entity_id, pathway_id))

target.commit()
print('Lost:')
for pathway_reactome_id in lost:
  print('  ', pathway_reactome_id)
