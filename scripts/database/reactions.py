#!/usr/bin/python

# Reads from mysql database into a local sqlite database.

import mysql.connector
import sqlite3
import re

# Create Tables.

target = sqlite3.connect('data.db')
tc = target.cursor()

tc.execute('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'entities\'')
if not tc.fetchone():
  print('ERROR: Must create entities first.')
  sys.exit()

tc.execute('DROP TABLE IF EXISTS components')
tc.execute('DROP TABLE IF EXISTS reactions')
tc.execute('DROP TABLE IF EXISTS reaction_entities')

tc.execute('CREATE TABLE components (entity_id, component_id, component_type)')
tc.execute('CREATE TABLE reactions (reaction_id INTEGER PRIMARY KEY, reaction_type TEXT, name TEXT, pathway_id, local_id TEXT)')
tc.execute('CREATE TABLE reaction_entities (reaction_id INTEGER, entity_id INTEGER, direction TEXT, PRIMARY KEY(reaction_id, entity_id))')

source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome')
sc = source.cursor()

sc.execute('SHOW TABLES')
tables = []
for (tablename,) in sc:
  tables.append(tablename)
#tables = ['199220_1pathway2step',
#          '199220_2step2step',
#          '199220_3step2reaction',
#          '199220_4reaction',
#          '199220_5catalysis',
#          '199220_6complex',
#          '199220_7protein',
#          '199220_8convertedEntity',
#          '199220_9smallEntity']

# Limit to 30 tables for testing purposes.
#tables = tables[:30]

last_completion = 0
table_count = 0
#print('Components:')

# Do complex and converted after we have the source components defined.
# for tablename in tables:
#   table_count = table_count + 1
#   completion = int(20 * table_count / len(tables))
#   if completion > last_completion:
#     last_completion = completion
#     print('  ', completion * 5, '%')

#   m = re.search('^(\d+)_(\w+)$', tablename)
#   pathway_id = int(m.group(1))
#   tabletype = m.group(2)

#   if tabletype == '6complex' or tabletype == '8convertedEntity':
#     component_type = None
#     if '6complex' == tabletype:
#       component_type = 'complex'
#     elif '8convertedEntity' == tabletype:
#       component_type = 'converted'

#     sc.execute('SELECT * FROM %s' % (tablename,))
#     for (local_id, name, location, reactome_id, component_local_id) in sc:
#       reactome_id = int(reactome_id[16:])
#       m = re.search('^([a-zA-Z_]+)', local_id)
#       tc.execute('INSERT INTO entities(entity_type, name, location, reactome_id, uniprot_id) '
#                  'SELECT ?, ?, ?, ?, ? '
#                  'WHERE NOT EXISTS(SELECT 1 FROM entities WHERE reactome_id=?)',
#                  (m.group(1), name, location, reactome_id, None, reactome_id))
#       tc.execute('INSERT INTO entity_pathways '
#                  'SELECT last_insert_rowid(), ?, ? '
#                  'WHERE NOT EXISTS('
#                  '  SELECT 1 FROM entity_pathways WHERE entity_id=last_insert_rowid() AND pathway_id=?)',
#                  (pathway_id, local_id, pathway_id))
#       tc.execute('INSERT INTO components '
#                  'SELECT ?, entity_id, ? FROM entity_pathways '
#                  'WHERE pathway_id=? AND local_id=?',
#                  (reactome_id, component_type, pathway_id, component_local_id))

last_completion = 0
table_count = 0
print('Reactions:')

# Do reactions after all components are defined.
for tablename in tables:
  table_count = table_count + 1
  completion = int(20 * table_count / len(tables))
  if completion > last_completion:
    last_completion = completion
    print('  ', completion * 5, '%')

  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_reactome_id = int(m.group(1))
  tc.execute('SELECT pathway_id FROM pathways WHERE reactome_id=?',
             (pathway_reactome_id,))
  pathway_id = tc.fetchone()
  lost = {}
  if not pathway_id:
    lost[pathway_reactome_id] = True
  else:
    pathway_id = int(pathway_id[0])
    tabletype = m.group(2)

    if tabletype == '4reaction':
      sc.execute('SELECT * FROM %s' % (tablename,))
      for (local_id, name, local_input_id, local_output_id) in sc:
        m = re.search('^([a-zA-Z_]+)', local_id)

        tc.execute('INSERT INTO reactions(reaction_type, name, pathway_id, local_id) '
                   'SELECT ?, ?, ?, ? '
                   'WHERE NOT EXISTS(SELECT 1 FROM reactions WHERE pathway_id=? AND local_id=?)',
                   ('standard', name, pathway_id, local_id, pathway_id, local_id))
        tc.execute('SELECT reaction_id FROM reactions WHERE pathway_id=? and local_id=?',
                   (pathway_id, local_id))
        reaction_id = tc.fetchone()[0]
        # Each input/output pair has its own row, so we only need to grab one per loop.
        tc.execute('SELECT entity_id FROM entity_pathways WHERE pathway_id=? AND local_id=?',
                   (pathway_id, local_input_id))
        input_id = tc.fetchone()
        if input_id:
          input_id = input_id[0]
          tc.execute('INSERT INTO reaction_entities '
                     'SELECT ?, ?, ? '
                     'WHERE NOT EXISTS(SELECT 1 FROM reaction_entities WHERE reaction_id=? AND entity_id=?)',
                     (reaction_id, input_id, 'input', reaction_id, input_id))
          tc.execute('SELECT entity_id FROM entity_pathways WHERE pathway_id=? AND local_id=?',
                     (pathway_id, local_output_id))
        output_id = tc.fetchone()
        if output_id:
          output_id = output_id[0]
          tc.execute('INSERT INTO reaction_entities '
                     'SELECT ?, ?, ? '
                     'WHERE NOT EXISTS(SELECT 1 FROM reaction_entities WHERE reaction_id=? AND entity_id=?)',
                     (reaction_id, output_id, 'output', reaction_id, output_id))

    # Commit every pathway
    target.commit()

target.commit()
print('Lost:')
for pathway_reactome_id in lost:
  print('  ', pathway_reactome_id)
