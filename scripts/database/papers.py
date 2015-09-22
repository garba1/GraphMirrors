#!/usr/bin/python
import sqlite3

target = sqlite3.connect('data.db')
tc = target.cursor()

tc.execute('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'entities\'')
if not tc.fetchone():
  print('ERROR: Must create entities first.')
  sys.exit()

tc.execute('DROP TABLE IF EXISTS papers')
tc.execute('DROP TABLE IF EXISTS reaction_papers')

tc.execute('CREATE TABLE papers (paper_id INTEGER PRIMARY KEY)')
tc.execute('CREATE TABLE reaction_papers ('
           '  reaction_id INTEGER, '
           '  paper_id INTEGER, '
           '  PRIMARY KEY(reaction_id, paper_id))')

source = sqlite3.connect('igep.db')
sc = source.cursor()

sc.execute('SELECT substrate_AC, substrate_genename, kinase_AC, kinase_genename, pmid '
           'FROM sk_new WHERE substrate_AC <> "" AND kinase_AC <> ""')
for (substrate_ac, substrate_name, kinase_ac, kinase_name, paper_id_list) in sc:
  paper_ids = []
  if paper_id_list:
    for paper_id in paper_id_list.split(','):
      try:
        paper_ids.append(int(paper_id))
      except: pass

  tc.execute('SELECT entity_id FROM entities WHERE uniprot_id=?',
             (substrate_ac,))
  substrate_entity_id = tc.fetchone()
  if not substrate_entity_id:
    tc.execute(
      'INSERT INTO entities('
      '  entity_type, name, uniprot_id) '
      'VALUES(?, ?, ?)',
      ('protein', substrate_name, substrate_ac))
    tc.execute('SELECT entity_id FROM entities WHERE uniprot_id=?',
               (substrate_ac,))
    substrate_entity_id = tc.fetchone()
  substrate_entity_id = substrate_entity_id[0]

  kinase_entity_id = tc.fetchone()
  if not kinase_entity_id:
    tc.execute(
      'INSERT INTO entities('
      '  entity_type, name, uniprot_id) '
      'VALUES(?, ?, ?)',
      ('protein', kinase_name, kinase_ac))
    tc.execute('SELECT entity_id FROM entities WHERE uniprot_id=?',
               (kinase_ac,))
    kinase_entity_id = tc.fetchone()
  kinase_entity_id = kinase_entity_id[0]

  # Create Reaction
  reaction_name = 'Phosphorylation of %s by %s [iGep]' % (substrate_name, kinase_name)
  tc.execute(
    'INSERT INTO reactions(reaction_type, name) VALUES(?, ?)',
    ('phosphorylation', reaction_name))
  tc.execute('SELECT reaction_id FROM reactions WHERE name=?',
             (reaction_name,))
  reaction_id = tc.fetchone()[0]

  # Setup inputs.
  try:
    tc.execute(
      'INSERT INTO reaction_entities(reaction_id, entity_id, direction) '
      'VALUES(?, ?, ?)',
      (reaction_id, substrate_entity_id, 'input'))
  except sqlite3.IntegrityError: pass
  try:
    tc.execute(
      'INSERT INTO reaction_entities(reaction_id, entity_id, direction) '
      'VALUES(?, ?, ?)',
      (reaction_id, kinase_entity_id, 'input'))
  except sqlite3.IntegrityError: pass

  # Setup output.
  # TODO eventually.

  # Add Papers
  for paper_id in paper_ids:
    try:
      tc.execute(
        'INSERT INTO reaction_papers VALUES(?, ?)',
        (reaction_id, paper_id))
    except sqlite3.IntegrityError: pass

target.commit()
