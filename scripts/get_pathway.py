#!/usr/bin/env python
import sqlite3
import json
import sys

def get_pathway(pathway_reactome_id, source_pathway=None, parent_pathways=None, results=None):

  # Connect to database.
  db = sqlite3.connect('../data.db')
  c = db.cursor()

  # Resolve pathway id.
  if source_pathway is None:
    source_pathway = pathway_reactome_id

  if results is None:
    results = {}

  if parent_pathways is None:
    parent_pathways = []

  pathway_list = parent_pathways[:]
  pathway_list.append(pathway_reactome_id)

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
  c.execute('SELECT o.id, o.reactome_id, o.name, s.source '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id '
            '  INNER JOIN sources s ON o.id=s.object_id '
            'WHERE p.pathway_id=? AND o.type="reaction"',
            (pathway_id,))
  for (reaction_id, reaction_reactome_id, reaction_name, source) in c:
    if reaction_id in reactions:
      for pathway_x in pathway_list:
        if pathway_x not in reactions[reaction_id]['pathways']:
          reactions[reaction_id]['pathways'].append(pathway_x);
    else:
      reaction = {'id': reaction_id,
                  'reactome_id': reaction_reactome_id,
                  'name': reaction_name,
                  'pathways': pathway_list[:],
                  'source_pathway': source_pathway,
                  'source': source,
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
      for pathway_x in pathway_list:
        if pathway_x not in entities[entity_id]['pathways']:
          entities[entity_id]['pathways'].append(pathway_x)
    else:
      entity = {'id': entity_id,
                'reactome_id': entity_reactome_id,
                'name': entity_name,
                'type': entity_type,
                'locations': [],
                'pathways': pathway_list[:],
                'source_pathway': source_pathway,
                'db-pathways': [pathway_id],
                'reactions': []}
      entities[entity_id] = entity
    pathway['entities'].append(entity_id)

  def add_set_components(entity_id):
    entity = entities[entity_id]
    if 'set' != entity['type']:
      return
    entity['components'] = []
    c.execute('SELECT o.id, o.reactome_id, o.name, o.subtype '
              'FROM sets s '
              '  INNER JOIN objects o ON o.id=s.component_id '
              'WHERE s.set_id=?',
              (entity_id,))
    for (component_id, component_reactome_id, component_name, component_type) in c:
      entity['components'].append(component_id)

      if component_id in entities:
        entities[component_id]['component_of'] = entity_id
        for pathway_x in pathway_list:
          if pathway_x not in entities[component_id]['pathways']:
            entities[component_id]['pathways'].append(pathway_x)
      else:
        component = {'id': component_id,
                     'reactome_id': component_reactome_id,
                     'name': component_name,
                     'type': component_type,
                     'locations': [],
                     'pathways': pathway_list[:],
                     'source_pathway': source_pathway,
                     'db-pathways': [pathway_id],
                     'component_of': entity_id,
                     'reactions': []}
        entities[component_id] = component
      pathway['entities'].append(component_id)

    for component_id in entity['components']:
      add_set_components(component_id)

  for entity_id in entities.copy():
    add_set_components(entity_id)

  # Add inputs/outputs to reactions.
  c.execute('SELECT r.reaction_id, r.entity_id, r.direction '
            'FROM reactions r '
            '  INNER JOIN pathways p ON p.object_id=r.reaction_id '
            'WHERE p.pathway_id=?',
            (pathway_id,))
  for (reaction_id, entity_id, direction) in c:
    reactions[reaction_id]['entities'][entity_id] = direction
    if entity_id in entities:
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
  pathway['children'] = []
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

  #print(pathway_reactome_id, len(results['pathways']), len(results['reactions']), len(results['entities']))

  # Loop through children pathways.
  parents = parent_pathways[:]
  parents.append(pathway_reactome_id)
  for child_pathway in children_pathways:
    get_pathway(child_pathway, source_pathway, parents, results)

  if 0 == len(parent_pathways):
    # Find any phosphorylation reactions.
    phos = []
    c.execute('SELECT o.id, o.name '
              'FROM objects o '
              '  INNER JOIN sources s ON s.object_id=o.id '
              'WHERE o.type="reaction" AND s.source="iGep" ')
    for (reaction_id, name) in c:
      phos.append({'id': reaction_id,
                   'name': name,
                   'pathways': [],
                   'source_pathway': source_pathway,
                   'source': 'iGep',
                   'entities': {},
                   'papers': []})
    # Add component entity ids.
    for reaction in phos:
      c.execute('SELECT entity_id FROM reactions WHERE reaction_id=?',
                (reaction['id'],))
      for (entity_id,) in c:
        reaction['entities'][entity_id] = 'input'
        if entity_id in entities:
          entities[entity_id]['reactions'].append(reaction['id'])
    # Filter out reactions that don't have a shared input.
    for reaction in phos[:]:
      found = False
      for entity_id in reaction['entities']:
        if entity_id in entities:
          found = True
          break
      if not found:
        phos.remove(reaction)
    # Add to results
    for reaction in phos:
      reactions[reaction['id']] = reaction

  c.execute('SELECT o.id, y.paper_id '
            'FROM objects o '
            '  INNER JOIN pathways p ON o.id=p.object_id '
            '  INNER JOIN papers y ON y.object_id=o.id '
            'WHERE p.pathway_id=? ',
            (pathway_id,))
  for (reaction_id, paper_id) in c:
    reactions[reaction_id]['papers'].append(paper_id)

  return results

if '__main__' == __name__:
  pathway_reactome_id = sys.argv[1]
  result = get_pathway(pathway_reactome_id)
  print(json.dumps(result))
