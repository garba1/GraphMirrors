#!/usr/bin/python
import sqlite3
import json
import sys

# Get the list of entities.

def get_entities_by_id(id_list):

  #print(id_list)

  db = sqlite3.connect('../data.db')
  c = db.cursor()

  #print(id_list)

  # Grab entities in list.
  entities = {}
  c.execute('SELECT * FROM entities WHERE entity_id IN (%s)' % id_list)
  for (entity_id, entity_type, name, location, reactome_id, uniprot_id, entrez_id) in c:
    #print(entity_id, reactome_id)
    entity = {
      'id': entity_id,
      'type': entity_type,
      'name': name,
      'expression': 'none',
      'location': location,
      'reactome_id': reactome_id,
      'uniprot_id': uniprot_id,
      'entrez_id': entrez_id,
      'pathways': {}}
    entities[int(entity_id)] = entity

  if 0 == len(entities.values()):
    print('{\'error\': \'symbols unknown\'}')
    sys.exit()

  # Get reaction ids that entities are part of.
  reactions = {}
  c.execute('SELECT DISTINCT reaction_id FROM reaction_entities WHERE entity_id IN (%s)' % id_list)
  for (reaction_id,) in c:
    reaction_id = int(reaction_id)
    if reaction_id not in reactions:
      reactions[reaction_id] = {'id': reaction_id, 'entities': {}, 'pathways': {}}
  reaction_list = ','.join([str(reaction['id']) for reaction in reactions.values()])

  # Grab full reaction data.
  c.execute('SELECT * FROM reactions WHERE reaction_id IN (%s)' % reaction_list)
  for (reaction_id, reaction_type, name, pathway_id, local_id) in c:
    reaction = reactions[reaction_id]
    reaction['name'] = name
    reaction['type'] = reaction_type
    reaction['pathways']['pathway_id'] = local_id
    reaction['papers'] = []

    c2 = db.cursor()
    c2.execute('SELECT paper_id FROM reaction_papers WHERE reaction_id=?', (reaction_id,))
    for (paper_id,) in c2:
      reaction['papers'].append(paper_id)

  # Filter out repeat reactions.
  reaction_names = {}
  to_delete = []
  for reaction_id in reactions:
    reaction = reactions[reaction_id]
    if reaction['name'] in reaction_names:
      to_delete.append(reaction_id)
    else:
      reaction_names[reaction['name']] = True
  for reaction_id in to_delete:
    del reactions[reaction_id]
  reaction_list = ','.join([str(reaction['id']) for reaction in reactions.values()])

  # Grab all entities that are part of the reactions.
  complex_ids = []
  c.execute('SELECT e.entity_id, e.entity_type, e.name, e.location, e.uniprot_id, re.reaction_id, re.direction ' +
            'FROM entities AS e INNER JOIN reaction_entities AS re ' +
            'ON e.entity_id=re.entity_id ' +
            ('WHERE re.reaction_id IN (%s)' % reaction_list))
  for (entity_id, _type, name, location, uniprot_id, reaction_id, direction) in c:
    entity_id = int(entity_id)
    reactions[int(reaction_id)]['entities'][entity_id] = direction
    if entity_id not in entities:
      entities[int(entity_id)] = {
        'id': entity_id,
        'reactome_id': entity_id,
        'type': _type,
        'name': name,
        'expression': 'none',
        'location': location,
        'uniprot_id': uniprot_id,
        'pathways': {}}
      if _type == 'Complex':
        complex_ids.append(entity_id)

  # Grab components.
  id_list = ','.join([str(e) for e in entities]);
  c.execute('SELECT * FROM components WHERE entity_id IN (%s)' % id_list)
  for (entity_id, component_id, component_type) in c:
    #print(entity_id, component_id, component_type)
    entity = entities[int(entity_id)]
    if 'components' not in entity:
      entity['components'] = {}
    entity['components'][int(component_id)] = component_type

  pathways = {}
  c.execute('SELECT ep.entity_id, p.reactome_id, ep.local_id ' +
            'FROM entity_pathways AS ep INNER JOIN pathways AS p ' +
            'ON ep.pathway_id=p.pathway_id ' +
            ('WHERE ep.entity_id IN (%s)' % id_list))
  for (entity_id, pathway_id, local_id) in c:
    entity_id = int(entity_id)
    entities[entity_id]['pathways'][int(pathway_id)] = local_id
    if pathway_id not in pathways:
      pathways[pathway_id] = {
        'id': pathway_id,
        'entities': {entity_id: local_id}}

  pathways_f = open('../pathways', 'r')
  for line in pathways_f:
    parts = line.strip().split('|')
    parts[0] = int(parts[0])
    if parts[0] in pathways:
      pathway = pathways[parts[0]]
      pathway['name'] = parts[1]
      pathway['species'] = parts[2]

  return {
    'entities': entities,
    'reactions': reactions,
    'pathways': pathways}

if '__main__' == __name__:
  id_list = sys.argv[1]
  print(json.dumps(get_entities_by_id(id_list)))
