#!/usr/bin/python
import mysql.connector
import sqlite3
import re
import json

target = sqlite3.connect('data.db')
tc = target.cursor()

tc.execute('DROP TABLE IF EXISTS pathways')
tc.execute('CREATE TABLE pathways (pathway_id INTEGER PRIMARY KEY, reactome_id INTEGER, reactome_stable_id TEXT, pathway_name TEXT, species TEXT)')

# Reactome stable ids from [[http://www.reactome.org/download/current/ReactomePathways.txt]]
# source = open('ReactomePathways.txt', 'r')
# for line in source:
#   parts = line.strip().split('\t')
#   reactome_stable_id = parts[0]
#   pathway_name = parts[1]
#   species = parts[2]

#   # Check for duplicates.
#   tc.execute('SELECT EXISTS(SELECT 1 FROM pathways WHERE reactome_stable_id=? LIMIT 1)',
#              (reactome_stable_id,))
#   if 0 == tc.fetchone()[0]:
#     # Insert.
#     tc.execute('INSERT INTO pathways(reactome_stable_id, pathway_name, species) '
#                'VALUES (?, ?, ?)',
#                (reactome_stable_id, pathway_name, species))

# target.commit()
# source.close()

# # Generic reactome ids used by pathrings
# source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome')
# sc = source.cursor()

# tables = []
# sc.execute('SHOW TABLES')
# for (tablename,) in sc:
#   m = re.search('^(\d+)_(\w+)$', tablename)
#   pathway_id = int(m.group(1))
#   tabletype = m.group(2)

#   if '1pathway2step' == tabletype:
#     tables.append((tablename, pathway_id))

# for (tablename, pathway_id) in tables:
#   sc.execute('SELECT pathwayName FROM %s WHERE pathwayID=\'Pathway1\' LIMIT 1' % (tablename,))
#   pathway_name = sc.fetchone();
#   if pathway_name:
#     tc.execute('UPDATE pathways SET reactome_id=? WHERE pathway_name=? AND species=?',
#                (pathway_id, pathway_name[0], 'Homo sapiens'))
# target.commit()

# Load file of all human pathways. This is taken from data/Ortholog/human.json
source = open('human_pathways.json', 'r')
root = json.load(source)

def add(node):
  # Add entry
  reactome_id = int(node['dbId'])
  name = node['name']
  tc.execute('INSERT INTO pathways(reactome_id, pathway_name, species) '
             'SELECT ?, ?, ? '
             'WHERE NOT EXISTS('
             '  SELECT 1 FROM pathways WHERE reactome_id=?)',
             (reactome_id, name, 'Home sapiens', reactome_id))

  # Add childern
  for child in node['children']:
    add(child)

add(root)

source.close()
target.commit()
