#!/usr/bin/env python

import sqlite3
import os

target = sqlite3.connect('data.db')
tc = target.cursor()

source = sqlite3.connect('igep.db')
sc = source.cursor()

def table_exists(table):
  tc.execute('SELECT name FROM sqlite_master WHERE type="table" AND name=?',
             (table,))
  return tc.fetchone()

def state(key):
  tc.execute('SELECT value FROM state WHERE name=?', (key,))
  value = tc.fetchone()
  if value: value = int(value[0])
  return value

def state_set(key, value):
  tc.execute('UPDATE state SET value=? WHERE name=?', (value, key))

if not table_exists('state'):
  print('ERROR: Run after create.py.')
  quit

if 0 >= state('igep'):

  sc.execute('SELECT substrate_AC, substrate_genename, kinase_AC, kinase_genename, pmid '
             'FROM sk_new WHERE substrate_AC <> "" AND kinase_AC <> ""')
  for (substrate_uniprot_id, substrate_name, kinase_uniprot_id, kinase_name, paper_id_list) in sc:
    paper_ids = []
    if paper_id_list:
      for paper_id in paper_id_list.split(','):
        try:
          paper_ids.append(int(paper_id))
        except: pass

    tc.execute('SELECT id FROM uniprot WHERE uniprot_id=?',
               (substrate_uniprot_id,))
    substrate_id = tc.fetchone()
    if not substrate_id:
      continue
    substrate_id = substrate_id[0]

    tc.execute('SELECT id FROM uniprot WHERE uniprot_id=?',
               (kinase_uniprot_id,))
    kinase_id = tc.fetchone()
    if not kinase_id:
      continue
    kinase_id = kinase_id[0]

    # Create new reaction
    reaction_name = 'Phosphorylation of %s by %s [iGep]' % (substrate_name, kinase_name)
    tc.execute('INSERT INTO objects(type, name) VALUES ("reaction", ?)',
               (reaction_name,))
    tc.execute('SELECT last_insert_rowid()')
    reaction_id = int(tc.fetchone()[0])
    tc.execute('INSERT INTO sources VALUES(?, "iGep")',
               (reaction_id,))
    tc.execute('INSERT INTO reactions VALUES(?, ?, "input")',
               (reaction_id, substrate_id))
    tc.execute('INSERT OR IGNORE INTO reactions VALUES(?, ?, "input")',
               (reaction_id, kinase_id))
    for paper_id in paper_ids:
      tc.execute('INSERT INTO papers VALUES(?, ?)',
                 (paper_id, reaction_id))

    # Put reactions into pathways they share at least one input with.
    tc.execute('INSERT OR IGNORE INTO pathways(pathway_id, object_id) '
               '  SELECT '
               '    p.pathway_id AS pathway_id, '
               '    o.id AS object_id '
               '  FROM objects o '
               '    INNER JOIN sources s ON o.id=s.object_id '
               '    INNER JOIN reactions r ON o.id=r.reaction_id '
               '    INNER JOIN objects o2 ON o2.id=r.entity_id '
               '    INNER JOIN pathways p ON o2.id=p.object_id '
               '  WHERE s.source="iGep" ')

  state_set('igep', 1)
  target.commit()
