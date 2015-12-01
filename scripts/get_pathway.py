#!/usr/bin/env python
import sqlite3
import json
import sys

def get_pathway(pathway_reactome_id, source_pathway=None, results=None):

  # Connect to database.
  db = sqlite3.connect('../data.db')
  c = db.cursor()

  # Resolve pathway id.
  if source_pathway is None:
    source_pathway = pathway_reactome_id

  if results is None:
    results = {};

  # Setup return values
  if 'pathways' not in results:
    results['pathways'] = {}
  pathways = results['pathways']

  if 'reactions' not in results:
    results['reactions'] = {}
  reactions = results['reactions']

  if 'entities' not in results:
    results['entities'] = {}
  entities = results['entities']

  # Just grab all locations. There aren't that many.
  if 'locations' not in results:
    results['locations'] = {}
    c.execute('SELECT id, name FROM objects WHERE type="location"')
    for (location_id, location_name) in c:
      results['locations'][location_id] = location_name
  locations = results['locations']

  # Resolve pathway id.
  c.execute('SELECT id, name FROM objects WHERE type="pathway" AND reactome_id=? LIMIT 1',
            (pathway_reactome_id,))
  data = c.fetchone()
  if None == data:
    print('Illegal Pathway:', pathway_reactome_id)
    return
  pathway_id = data[0]
  pathway_name = data[1]

  # Create Pathways table.
  pathway = {'id': pathway_id,
             'reactome_id': pathway_reactome_id,
             'name': pathway_name,
             'entities': [],
             'reactions': []}
  pathways[int(pathway_reactome_id)] = pathway

  # Create Reactions table.
  c.execute('SELECT o.id, o.reactome_id, o.name '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id '
            'WHERE p.pathway_id=? AND o.type="reaction"',
            (pathway_id,))
  for (reaction_id, reaction_reactome_id, reaction_name) in c:
    if reaction_id in reactions:
      reactions[reaction_id].pathways.append(pathway_reactome_id);
    else:
      reaction = {'id': reaction_id,
                  'reactome_id': reaction_reactome_id,
                  'name': reaction_name,
                  'pathways': [pathway_reactome_id],
                  'source_pathway': source_pathway,
                  'source': 'reactome',
                  'entities': {},
                  'papers': []}
      reactions[reaction_id] = reaction
    pathway['reactions'].append(reaction_id)

  # Create Entities table.
  c.execute('SELECT o.id, o.reactome_id, o.name, o.subtype '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id '
            'WHERE p.pathway_id=? AND o.type="entity"',
            (pathway_id,))
  for (entity_id, entity_reactome_id, entity_name, entity_type) in c:
    if entity_id in entities:
      entities[entity_id].pathways.append(pathway_reactome_id)
    else:
      entity = {'id': entity_id,
                'reactome_id': entity_reactome_id,
                'name': entity_name,
                'type': entity_type,
                'locations': [],
                'pathways': [pathway_reactome_id],
                'source_pathway': source_pathway,
                'db-pathways': [pathway_id],
                'reactions': []}
      entities[entity_id] = entity
    pathway['entities'].append(entity_id)

  # Add inputs/outputs to reactions.
  c.execute('SELECT r.reaction_id, r.entity_id, r.direction '
            'FROM reactions r '
            '  INNER JOIN pathways p ON p.object_id=r.reaction_id '
            'WHERE p.pathway_id=?',
            (pathway_id,))
  for (reaction_id, entity_id, direction) in c:
    reactions[reaction_id]['entities'][entity_id] = direction
    entities[entity_id]['reactions'].append(reaction_id)

  # Add locations to entities.
  c.execute('SELECT o.id, l.location_id '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id '
            '  INNER JOIN locations l ON o.id=l.object_id '
            'WHERE p.pathway_id=? AND o.type="entity"',
            (pathway_id,))
  for (entity_id, location_id) in c:
    entities[entity_id]['locations'].append(locations[location_id])

  # Collect children pathways
  children_pathways = []
  c.execute('SELECT object_id '
            'FROM pathways p '
            '  INNER JOIN objects o ON p.object_id=o.id '
            'WHERE o.type="pathway" '
            '  AND p.pathway_id=? ',
            (pathway_id,))
  for (pathway,) in c:
    children_pathways.append(pathway)
  for i in range(len(children_pathways)):
    c.execute('SELECT reactome_id FROM objects WHERE id=?', (children_pathways[i],))
    children_pathways[i] = c.fetchone()[0]

  # Loop through children pathways.
  for child_pathway in children_pathways:
    get_pathway(child_pathway, pathway_reactome_id, results)

  return results

if '__main__' == __name__:
  pathway_reactome_id = sys.argv[1]
  #get_pathway(pathway_reactome_id)
  print(json.dumps(get_pathway(pathway_reactome_id)))
