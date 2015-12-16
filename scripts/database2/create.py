#!/usr/bin/env python

import mysql.connector
import sqlite3
import json

target = sqlite3.connect('data.db')
tc = target.cursor()

#source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome_simple')
#sc = source.cursor()

source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome_complex')
sc = source.cursor()

def table_exists(table):
  tc.execute('SELECT name FROM sqlite_master WHERE type="table" AND name=?',
             (table,))
  return tc.fetchone()

def assign_id(reactome_id, _type=''):
  tc.execute('SELECT id FROM objects WHERE reactome_id=?',
             (reactome_id,))
  result = tc.fetchone()
  if result:
    return int(result[0])
  tc.execute('INSERT INTO objects(reactome_id, type) VALUES (?, ?)',
             (reactome_id, _type))
  tc.execute('SELECT last_insert_rowid()')
  return int(tc.fetchone()[0])

# Creates or updates an object with the given reactome id. Returns
# the canonical id.
def ensure_object(data):
  def get(key):
    if key in data:
      return data[key]
    else:
      return None

  reactome_id = get('reactome_id')
  name = get('name')
  _type = get('type')
  subtype = get('subtype')

  tc.execute('SELECT id FROM objects WHERE reactome_id=?',
             (reactome_id,))
  result = tc.fetchone()
  if result:
    return int(result[0])
  tc.execute('INSERT INTO objects(reactome_id, name, type, subtype) '
             'VALUES (?, ?, ?, ?)',
             (reactome_id, name, _type, subtype))
  tc.execute('SELECT last_insert_rowid()')
  return int(tc.fetchone()[0])

# Create table for gauging progress.
if not table_exists('state'):
  tc.execute('CREATE TABLE state(name TEXT PRIMARY KEY, value INTEGER)')
tc.execute('INSERT OR IGNORE INTO state VALUES (?, ?)', ('pathways', 0))
tc.execute('INSERT OR IGNORE INTO state VALUES (?, ?)', ('reactions', 0))
tc.execute('INSERT OR IGNORE INTO state VALUES (?, ?)', ('entities', 0))
tc.execute('INSERT OR IGNORE INTO state VALUES (?, ?)', ('locations', 0))
tc.execute('INSERT OR IGNORE INTO state VALUES (?, ?)', ('igep', 0))

def state(key):
  tc.execute('SELECT value FROM state WHERE name=?', (key,))
  value = tc.fetchone()
  if value: value = int(value[0])
  return value

def state_set(key, value):
  tc.execute('UPDATE state SET value=? WHERE name=?', (value, key))


if not table_exists('objects'):
  tc.execute('CREATE TABLE objects('
             ' id INTEGER PRIMARY KEY,'
             ' type TEXT,'
             ' subtype TEXT,'
             ' name TEXT,'
             ' reactome_id INTEGER UNIQUE)')

if not table_exists('pathways'):
  tc.execute('CREATE TABLE pathways('
             ' pathway_id INTEGER,'
             ' object_id INTEGER,'
             ' PRIMARY KEY(pathway_id, object_id))')

if not table_exists('locations'):
  tc.execute('CREATE TABLE locations('
             ' location_id INTEGER,'
             ' object_id INTEGER,'
             ' PRIMARY KEY(location_id, object_id))')

if not table_exists('reactions'):
  tc.execute('CREATE TABLE reactions('
             ' reaction_id INTEGER,'
             ' entity_id INTEGER,'
             ' direction TEXT,'
             ' PRIMARY KEY(reaction_id, entity_id))')

if not table_exists('sets'):
  tc.execute('CREATE TABLE sets('
             ' set_id INTEGER,'
             ' component_id INTEGER,'
             ' PRIMARY KEY(set_id, component_id))')

if not table_exists('sources'):
  tc.execute('CREATE TABLE sources( '
             '  object_id INTEGER, '
             '  source TEXT)')

if not table_exists('uniprot'):
  tc.execute('CREATE TABLE uniprot( '
             '  id INTEGER, '
             '  uniprot_id TEXT, '
             '  PRIMARY KEY(id, uniprot_id))')

if not table_exists('papers'):
  tc.execute('CREATE TABLE papers( '
             '  paper_id INTEGER, '
             '  object_id TEXT, '
             '  PRIMARY KEY(paper_id, object_id))')

################################################################
# Pathways

pathways = {} # id -> reactome_id
pathways_r = {} # reactome_id -> id
if 0 >= state('pathways'):

  # Delete all pathways.
  tc.execute('DELETE FROM objects WHERE type="pathway"')

  # First, read in the pathways json file.
  pathway_file = open('human_pathways.json', 'r')
  def add_pathway(node):
    pathway_reactome_id = int(node['dbId'])
    name = node['name']
    tc.execute('INSERT INTO objects(type, name, reactome_id) '
               'VALUES ("pathway", ?, ?)',
               (name, pathway_reactome_id))
    tc.execute('SELECT last_insert_rowid()')
    pathway_id = int(tc.fetchone()[0])
    pathways[pathway_id] = pathway_reactome_id
    pathways_r[pathway_reactome_id] = pathway_id

    for child in node['children']:
      if int(child['dbId']) not in pathways_r:
        add_pathway(child)
      tc.execute('INSERT OR IGNORE INTO pathways(pathway_id, object_id) VALUES (?, ?)',
                 (pathway_id, pathways_r[int(child['dbId'])]))

  add_pathway(json.load(pathway_file))
  pathway_file.close()

  state_set('pathways', 1)
  target.commit()

else:
  tc.execute('SELECT id, reactome_id FROM objects WHERE type="pathway"');
  for (pathway_id, pathway_reactome_id) in tc:
    pathways[pathway_id] = pathway_reactome_id

################################################################
# Reactions

reactions = {} # id -> reactome_id
reaction_pathways = {} # reaction -> [pathway]
if 0 >= state('reactions'):

  # Delete all reactions.
  tc.execute('DELETE FROM objects WHERE type="reaction"')
  tc.execute('DELETE FROM pathways '
             'WHERE pathway_id IN ('
             '  SELECT p.pathway_id '
             '  FROM pathways p '
             '    INNER JOIN objects o '
             '    ON p.object_id=o.id '
             '  WHERE o.type="reaction")')

  # Loop through pathways, grabbing their reactions.
  for pathway_id in pathways:
    pathway_reactome_id = pathways[pathway_id]

    # Get reactions in pathway.
    sc.execute('SELECT event.hasEvent, event.hasEvent_class, name.name '
               'FROM Pathway_2_hasEvent event '
               ' INNER JOIN Event_2_name name '
               ' ON event.hasEvent=name.DB_ID '
               'WHERE event.DB_ID=%s '
               'AND event.hasEvent_class <> "Pathway"',
               (pathway_reactome_id,))
    for (reaction_reactome_id, subtype, name) in sc:
      # Create if needed.
      reaction_id = assign_id(reaction_reactome_id, 'reaction')
      if reaction_id not in reactions:
        tc.execute('UPDATE objects SET '
                   ' subtype=?,'
                   ' name=? '
                   'WHERE reactome_id=?',
                   (subtype, name, reaction_reactome_id))
        reactions[reaction_id] = reaction_reactome_id
        reaction_pathways[reaction_id] = []

      # Put reaction in pathway.
      tc.execute('INSERT OR IGNORE INTO pathways VALUES (?, ?)',
                 (pathway_id, reaction_id))
      reaction_pathways[reaction_id].append(pathway_id)

  state_set('reactions', 1)
  target.commit()

else:
  tc.execute('SELECT id, reactome_id FROM objects WHERE type="reaction"');
  for (reaction_id, reaction_reactome_id) in tc:
    reactions[reaction_id] = reaction_reactome_id
    reaction_pathways[reaction_id] = []
  tc.execute('SELECT p.pathway_id, p.object_id '
             'FROM pathways p '
             ' INNER JOIN objects o '
             ' ON p.object_id=o.id '
             'WHERE o.type="reaction"')
  for (pathway_id, reaction_id) in tc:
    reaction_pathways[reaction_id].append(pathway_id)

################################################################
# Entities

entities = {} # id -> reactome_id
entities_2 = {} # reactome_id -> id
entity_reactions = {} # enttiy -> [reaction]

accessioned_type = {
  'ReferenceGeneProduct': 'protein',
  'ReferenceIsoform': 'protein',
  'ReferenceRNASequence': 'rna',
  'ReferenceDNASequence': 'dna',
  'ReferenceSequence': 'sequence',
  'None': 'none'}

if 0 >= state('entities'):

  # Delete all entities.
  tc.execute('DELETE FROM objects WHERE type="entity"')

  # Loop through reactions, grabbing their entities.
  for reaction_id in reactions:
    reaction_reactome_id = reactions[reaction_id]

    # input
    sc.execute('SELECT input '
               'FROM ReactionlikeEvent_2_input '
               'WHERE DB_ID=%s',
               (reaction_reactome_id,))
    for (entity_reactome_id,) in sc:
      # Create if needed.
      entity_id = assign_id(entity_reactome_id, 'entity')
      if entity_id not in entities:
        entities[entity_id] = entity_reactome_id
        entity_reactions[entity_id] = []
      # Add entity to reaction.
      tc.execute('INSERT OR IGNORE INTO reactions VALUES (?, ?, "input")',
                 (reaction_id, entity_id))
      entity_reactions[entity_id].append(reaction_id)

    # output
    sc.execute('SELECT output '
               'FROM ReactionlikeEvent_2_output '
               'WHERE DB_ID=%s',
               (reaction_reactome_id,))
    for (entity_reactome_id,) in sc:
      # Create if needed.
      entity_id = assign_id(entity_reactome_id, 'entity')
      if entity_id not in entities:
        entities[entity_id] = entity_reactome_id
        entity_reactions[entity_id] = []
      # Add entity to reaction.
      tc.execute('INSERT OR IGNORE INTO reactions VALUES (?, ?, "output")',
                 (reaction_id, entity_id))
      entity_reactions[entity_id].append(reaction_id)

  def add_set(entity_id):
    entity_reactome_id = entities[entity_id]
    sc.execute('SELECT DB_ID FROM EntitySet WHERE DB_ID=%s',
               (entity_reactome_id,))
    if not sc.fetchone():
      return
    sc.execute('SELECT hasMember, hasMember_class '
               'FROM EntitySet_2_hasMember '
               'WHERE DB_ID=%s ',
               (entity_reactome_id,))
    added = []
    for (sub_entity_reactome_id, sub_entity_type) in sc:
      sub_entity_id = assign_id(sub_entity_reactome_id, 'entity')
      if sub_entity_id not in entities:
        entities[sub_entity_id] = sub_entity_reactome_id
        entity_reactions[sub_entity_id] = []
        added.append(sub_entity_id)
      tc.execute('INSERT OR IGNORE INTO sets VALUES (?, ?)',
                 (entity_id, sub_entity_id))
    for sub_entity_id in added:
      add_set(sub_entity_id)

  # Loop through entities, looking for sets.
  for entity_id in entities.copy():
    add_set(entity_id)

  # Grab cross-reference ids.
  for entity_id in entities:
    entity_reactome_id = entities[entity_id]
    sc.execute('SELECT b.identifier '
               'FROM EntityWithAccessionedSequence a '
               '  INNER JOIN ReferenceEntity b ON a.referenceEntity=b.DB_ID '
               'WHERE a.DB_ID=%s AND b.referenceDatabase=2',
               (entity_reactome_id,))
    uniprot_id = sc.fetchone()
    if uniprot_id:
      tc.execute('INSERT OR IGNORE INTO uniprot VALUES (?, ?)',
                 (entity_id, uniprot_id[0]))

  state_set('entities', 1)
  target.commit()

else:
  tc.execute('SELECT id, reactome_id FROM objects WHERE type="entity"');
  for (entity_id, entity_reactome_id) in tc:
    entities[entity_id] = entity_reactome_id


################################################################
# Locations

locations = {} # id -> reactome_id
if 0 >= state('locations'):

  # Loop through entities, grabbing their location
  for entity_id in entities:
    entity_reactome_id = entities[entity_id]

    sc.execute('SELECT p.compartment, n.name '
               'FROM PhysicalEntity_2_compartment p '
               '  INNER JOIN GO_CellularComponent_2_name n '
               '    ON p.compartment=n.DB_ID '
               'WHERE p.DB_ID=%s AND n.name_rank=0',
               (entity_reactome_id,))
    for (location_reactome_id, location_name) in sc:
      # Create if needed.
      location_id = ensure_object({
        'reactome_id': location_reactome_id,
        'name': location_name,
        'type': 'location'})
      if location_id not in locations:
        locations[location_id] = location_reactome_id

      # Register entity in location.
      tc.execute('INSERT OR IGNORE INTO locations VALUES (?, ?)',
                 (location_id, entity_id))

  state_set('locations', 1)
  target.commit()

################################################################
# Entities Again
if 1 >= state('entities'):

  # Loop through entities, doing special processing for each type.
  for entity_id in entities:
    entity_reactome_id = entities[entity_id]

    # Accessioned Sequences
    sc.execute('SELECT referenceEntity_class FROM EntityWithAccessionedSequence '
               'WHERE DB_ID=%s',
               (entity_reactome_id,))
    x = sc.fetchone()
    if x is not None:
      subtype = accessioned_type[x[0]]
      tc.execute('UPDATE objects SET subtype=? WHERE id=?',
                 (subtype, entity_id))
      continue

    # Check for it being a genome encoded entity only, give it "unknown" tag.
    sc.execute('SELECT DB_ID FROM GenomeEncodedEntity WHERE DB_ID=%s',
               (entity_reactome_id,))
    if sc.fetchone():
      tc.execute('UPDATE objects SET subtype="unknown" WHERE id=?',
                 (entity_id,))
      continue

    # Simple Entity
    sc.execute('SELECT DB_ID FROM SimpleEntity WHERE DB_ID=%s',
               (entity_reactome_id,))
    if sc.fetchone():
      tc.execute('UPDATE objects SET subtype="simple" WHERE id=?',
                 (entity_id,))
      continue

    # Complex Entities
    sc.execute('SELECT DB_ID FROM Complex WHERE DB_ID=%s',
               (entity_reactome_id,))
    if sc.fetchone():
      tc.execute('UPDATE objects SET subtype="complex" WHERE id=?',
                 (entity_id,))
      continue

    # Entity Sets
    sc.execute('SELECT DB_ID FROM EntitySet WHERE DB_ID=%s',
               (entity_reactome_id,))
    if sc.fetchone():
      # Mark as a set.
      tc.execute('UPDATE objects SET subtype="set" WHERE id=?',
                 (entity_id,))
      continue

    # Assign "other"
    tc.execute('UPDATE objects SET subtype="other" WHERE id=?',
               (entity_id,))

  state_set('entities', 2)
  target.commit()

if 2 >= state('entities'):

  # Put entities in their reactions' pathways.
  tc.execute('INSERT OR IGNORE INTO pathways(pathway_id, object_id) '
             '  SELECT '
             '    p.pathway_id AS pathway_id, '
             '    o.id AS object_id '
             '  FROM objects o '
             '    INNER JOIN reactions r ON o.id=r.entity_id '
             '    INNER JOIN pathways p ON r.reaction_id=p.object_id '
             '  WHERE o.type="entity"')

  def add_set(entity_id):
    # Get pathways for entity.
    tc.execute('SELECT pathway_id FROM pathways WHERE object_id=?',
               (entity_id,))
    pathways = []
    for (pathway,) in tc:
      pathways.append(pathway)

    # Get components for entity.
    components = []
    tc.execute('SELECT component_id FROM sets WHERE set_id=?',
               (entity_id,))
    for (component,) in tc:
      components.append(component)

    for component in components:
      for pathway in pathways:
        tc.execute('INSERT OR IGNORE INTO pathways VALUES(?, ?)',
                   (pathway, component))
      add_set(component)

  # Loop through entities, assigning sets to their papent's pathways.
  for entity_id in entities:
    add_set(entity_id)

  # Loop through entities, assigning a name.
  for entity_id in entities:
    entity_reactome_id = entities[entity_id]
    sc.execute('SELECT name FROM PhysicalEntity_2_name '
               'WHERE DB_ID=%s AND name_rank=0',
               (entity_reactome_id,))
    name = sc.fetchone()[0]
    tc.execute('UPDATE objects SET name=? WHERE id=?',
               (name, entity_id))

  state_set('entities', 3)
  target.commit()

# Register reactome as source for all objects.
tc.execute('INSERT INTO sources '
           '  SELECT id, "reactome" FROM objects ')

target.commit()
