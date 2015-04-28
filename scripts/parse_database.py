#!/usr/bin/python

# Reads from mysql database into a local sqlite database.

import mysql.connector
import sqlite3
import re

# Create Tables.

target = sqlite3.connect('link.db')
tc = target.cursor()

tc.execute('CREATE TABLE entities (entity_id PRIMARY KEY, type TEXT, name TEXT, location TEXT, uniprot_id TEXT)')
tc.execute('CREATE TABLE entity_pathways (entity_id, pathway_id, local_id, PRIMARY KEY(entity_id, pathway_id))')
tc.execute('CREATE TABLE components (entity_id, component_id, component_type)')
tc.execute('CREATE TABLE reactions (reaction_id INTEGER PRIMARY KEY, name TEXT, pathway_id, local_id TEXT)')
tc.execute('CREATE TABLE reaction_entities (reaction_id, entity_id, direction TEXT, PRIMARY KEY(reaction_id, entity_id))')

source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome')
sc = source.cursor()

sc.execute('SHOW TABLES')
tables = []
for (tablename,) in sc:
  tables.append(tablename)
#tables = tables[:30]

for tablename in tables:
  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_id = int(m.group(1))
  tabletype = m.group(2)

  if tabletype == '7protein':
    sc.execute('SELECT * FROM %s' % (tablename,))
    for (local_id, name, uniprot_id, entity_id, location) in sc:
      entity_id = int(entity_id[16:])
      uniprot_id = uniprot_id[8:]
      m = re.search('^([a-zA-Z_]+)', local_id)
      tc.execute('INSERT INTO entities '
                 'SELECT ?, ?, ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entities WHERE entity_id=?)',
                 (entity_id, m.group(1), name, location, uniprot_id, entity_id))
      tc.execute('INSERT INTO entity_pathways '
                 'SELECT ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
                 (entity_id, pathway_id, local_id, entity_id, pathway_id))

  elif tabletype == '9smallEntity':
    sc.execute('SELECT * FROM %s' % (tablename,))
    for (local_id, name, other_id, entity_id, location) in sc:
      entity_id = int(entity_id[16:])
      m = re.search('^([a-zA-Z_]+)', local_id)
      tc.execute('INSERT INTO entities '
                 'SELECT ?, ?, ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entities WHERE entity_id=?)',
                 (entity_id, m.group(1), name, location, None, entity_id))
      tc.execute('INSERT INTO entity_pathways '
                 'SELECT ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
                 (entity_id, pathway_id, local_id, entity_id, pathway_id))

# Do complex and converted after we have the source components defined.
for tablename in tables:
  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_id = int(m.group(1))
  tabletype = m.group(2)

  if tabletype == '6complex':
    sc.execute('SELECT * FROM %s' % (tablename,))
    for (local_id, name, location, entity_id, component_local_id) in sc:
      entity_id = int(entity_id[16:])
      m = re.search('^([a-zA-Z_]+)', local_id)
      tc.execute('INSERT INTO entities '
                 'SELECT ?, ?, ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entities WHERE entity_id=?)',
                 (entity_id, m.group(1), name, location, None, entity_id))
      tc.execute('INSERT INTO entity_pathways '
                 'SELECT ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
                 (entity_id, pathway_id, local_id, entity_id, pathway_id))
      tc.execute('INSERT INTO components '
                 'SELECT ?, entity_id, ? FROM entity_pathways '
                 'WHERE pathway_id=? AND local_id=?',
                 (entity_id, 'complex', pathway_id, component_local_id))
  elif tabletype == '8convertedEntity':
    sc.execute('SELECT * FROM %s' % (tablename,))
    for (local_id, name, location, entity_id, component_local_id) in sc:
      entity_id = int(entity_id[16:])
      m = re.search('^([a-zA-Z_]+)', local_id)
      tc.execute('INSERT INTO entities '
                 'SELECT ?, ?, ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entities WHERE entity_id=?)',
                 (entity_id, m.group(1), name, location, None, entity_id))
      tc.execute('INSERT INTO entity_pathways '
                 'SELECT ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
                 (entity_id, pathway_id, local_id, entity_id, pathway_id))
      tc.execute('INSERT INTO components '
                 'SELECT ?, entity_id, ? FROM entity_pathways '
                 'WHERE pathway_id=? AND local_id=?',
                 (entity_id, 'converted', pathway_id, component_local_id))

# Do reactions after all components are defined.
for tablename in tables:
  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_id = int(m.group(1))
  tabletype = m.group(2)

  if tabletype == '4reaction':
    sc.execute('SELECT * FROM %s' % (tablename,))
    for (local_id, name, local_input_id, local_output_id) in sc:
      m = re.search('^([a-zA-Z_]+)', local_id)

      tc.execute('INSERT INTO reactions '
                 'SELECT NULL, ?, ?, ? '
                 'WHERE NOT EXISTS(SELECT 1 FROM reactions WHERE pathway_id=? AND local_id=?)',
                 (name, pathway_id, local_id, pathway_id, local_id))
      tc.execute('SELECT reaction_id FROM reactions WHERE pathway_id=? and local_id=?',
                 (pathway_id, local_id))
      reaction_id = tc.fetchone()[0]
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



target.commit()
