#!/usr/bin/python
import sqlite3
import mysql.connector
import json
import sys
from get_entities_by_id import *

def get_entities_in_pathway(pathway_reactome_id):

  db = sqlite3.connect('../data.db')
  c = db.cursor()

  # Resolve pathway id.
  c.execute('SELECT id, name FROM objects WHERE type="pathway" AND reactome_id=? LIMIT 1',
            (pathway_reactome_id,))
  pathway_data = c.fetchone()
  if None == pathway_data:
    print('Illegal Pathway:', pathway_reactome_id)
    return
  pathway_id = pathway_data[0]
  pathway_name = pathway_data[1]
  species = pathway_data[2]

  # Setup pathways
  pathway = {'id': pathway_id,
             'reactome_id': pathway_reactome_id,
             'name': pathway_name,
             'species': species,
             'entities': [],
             'reactions': []}
  pathways = {int(pathway_reactome_id): pathway} # note reactome_id

  # Grab entities in pathway.
  entities = {}
  c.execute('SELECT o.id, o.subtype, o.name, o.reactome_id '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id'
            'WHERE type="entity" AND p.pathway_id=?',
            (pathway_id,))
  for (entity_id, entity_type, name, location, reactome_id, uniprot_id, entrez_id, local_id) in c:
    entity = {
      'id': entity_id,
      'type': entity_type,
      'name': name,
      'expression': 'none',
      'location': location,
      'reactome_id': reactome_id,
      'uniprot_id': uniprot_id,
      'entrez_id': entrez_id,
      'reactions': {},
      'pathways': {pathway_reactome_id: local_id}}
    pathway['entities'][entity_id] = local_id
    entities[int(entity_id)] = entity

  # Grab reactions in pathway.
  reactions = {}
  c.execute('SELECT * FROM reactions WHERE pathway_id=?',
            (pathway_id,))
  for (reaction_id, reaction_type, name, pathway_id, local_id) in c:
    reaction = {
      'id': reaction_id,
      'type': reaction_type,
      'name': name,
      'pathways': {pathway_reactome_id: local_id},
      'entities': {},
      'papers': []}
    pathway['reactions'][reaction_id] = local_id

    # Grab inputs/outputs
    c2 = db.cursor()
    c2.execute('SELECT * FROM reaction_entities WHERE reaction_id=?', (reaction_id,))
    for (_, entity_id, direction) in c2:
      entity_id = int(entity_id)
      reaction['entities'][entity_id] = direction
      #entities[entity_id]['reactions'] = direction

    # Grab papers
    c2.execute('SELECT paper_id FROM reaction_papers WHERE reaction_id=?', (reaction_id,))
    for (paper_id,) in c2:
      reaction['papers'].append(paper_id)

    reactions[int(reaction_id)] = reaction

  # Grab phosphorylation reactions that involve the entities.
  c.execute('SELECT r.reaction_id, r.reaction_type, r.name, r.pathway_id, r.local_id '
            'FROM reactions AS r '
            '  INNER JOIN reaction_entities AS re ON r.reaction_id=re.reaction_id '
            '  INNER JOIN entity_pathways AS ep ON re.entity_id=ep.entity_id '
            'WHERE reaction_type="phosphorylation" '
            '  AND ep.pathway_id=?',
            (pathway_id,))
  for (reaction_id, reaction_type, name, pathway_id, local_id) in c:
    reaction = {
      'id': reaction_id,
      'type': reaction_type,
      'name': name,
      'pathways': {},
      'entities': {},
      'papers': []}
    pathway['reactions'][reaction_id] = 'N/A'

    # Grab inputs/outputs
    c2 = db.cursor()
    c2.execute('SELECT * FROM reaction_entities WHERE reaction_id=?', (reaction_id,))
    for (_, entity_id, direction) in c2:
      entity_id = int(entity_id)
      reaction['entities'][entity_id] = direction
      if entity_id in entities:
        entities[entity_id]['reactions'] = direction

    # Grab papers
    c2.execute('SELECT paper_id FROM reaction_papers WHERE reaction_id=?', (reaction_id,))
    for (paper_id,) in c2:
      reaction['papers'].append(paper_id)

    reactions[int(reaction_id)] = reaction

  return {
    'entities': entities,
    'reactions': reactions,
    'pathways': pathways}

if '__main__' == __name__:
  pathway_id = sys.argv[1]
  print(json.dumps(get_entities_in_pathway(pathway_id)))
