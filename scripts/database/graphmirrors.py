#!/usr/bin/python

from database import SqliteDatabase
from liang import LiangDB
from igep import IgepDB
import re
import sqlite3

class GraphMirrorsDB(SqliteDatabase):
  IGEP_VERSION = 2
  ENTITIES_VERSION = 5

  def __init__(
      self,
      this_db='data.db',
      liang_db={'user': 'garba1', 'host': 'localhost', 'database': 'reactome'}):
    SqliteDatabase.__init__(self, this_db)
    self.liang_db = liang_db

  def getTableVersion(self, tablename):
    return self.getSingle('SELECT version FROM tables WHERE table_name=?', (tablename,), -1)

  def setTableVersion(self, tablename, version):
    self.execute('DELETE FROM tables WHERE table_name=?', (tablename,))
    self.execute('INSERT INTO tables(table_name, version) VALUES (?, ?)',
                 (tablename, version))

  def update(self):
    if not self.hasTable('tables'):
      self.execute('CREATE TABLE tables(table_name TEXT PRIMARY KEY, version DEFAULT 0)')

    if self.getTableVersion('entities') < self.ENTITIES_VERSION:
      self.updateEntities()

    if self.getTableVersion('igep') < self.IGEP_VERSION:
      self.updateIgep()

  def updateEntities(self):
    print('Updating <entities> table...')
    self.execute('DROP TABLE entities')
    self.execute(
      'CREATE TABLE entities ('
      '  entity_id INTEGER PRIMARY KEY,'
      '  entity_type TEXT,'
      '  name TEXT,'
      '  location TEXT,'
      '  reactome_id TEXT,'
      '  uniprot_ac_id TEXT,'
      '  uniprot_name TEXT,'
      '  entrez_id TEXT)')

    table_number = 0
    liang = LiangDB()
    for (tablename, pathway_reactome_id, table_type) in liang.tableIterator():
      table_number += 1
      if ((table_number + 1) / 9) % 100 == 0:
        print('  Pathway #', int((table_number + 1)/ 9))

      pathway_id = self.getSingle(
        'SELECT pathway_id FROM pathways WHERE reactome_id=?',
        (pathway_reactome_id,))
      if pathway_id:
        if '7protein' == table_type or '9smallEntity' == table_type:
          data = liang.execute('SELECT * FROM %s' % (tablename,), cursor = 'new')
          for (local_id, name, uniprot, reactome_id, location) in data:
            # Process data.
            reactome_id = int(reactome_id[16:])
            uniprot_ac_id = None
            uniprot_name = None
            if '7protein' == table_type:
              m = re.search('^UniProt:(\S+)\s+(\S+)$', uniprot)
              if m:
                uniprot_ac_id = m.group(1)
                uniprot_name = m.group(2)
            m = re.search('^([a-zA-Z_]+)', local_id)
            entity_type = m.group(1)

            # Check to make sure entity isn't alread in table.
            entity_id = self.getSingle(
              'SELECT entity_id FROM entities WHERE reactome_id=?',
              (reactome_id,))
            if not entity_id:
              self.execute(
                'INSERT INTO entities('
                '  entity_type, name, location, reactome_id, uniprot_ac_id, uniprot_name) '
                'VALUES(?, ?, ?, ?, ?, ?)',
                (entity_type, name, location, reactome_id, uniprot_ac_id, uniprot_name))

            # Register entity as being in pathway.
            self.execute(
              'INSERT INTO entity_pathways '
              'SELECT ?, ?, ? '
              'WHERE NOT EXISTS('
              '  SELECT 1 FROM entity_pathways WHERE entity_id=? AND pathway_id=?)',
              (entity_id, pathway_id, local_id, entity_id, pathway_id))

    self.setTableVersion('entities', self.ENTITIES_VERSION)


  def updateIgep(self):
    print('Updating <papers> table...')
    try:
      self.execute('DROP TABLE papers')
    except sqlite3.OperationalError: pass
    self.execute(
      'CREATE TABLE papers ('
      '  paper_id INTEGER PRIMARY KEY)')

    try:
      self.execute('DROP TABLE reaction_papers')
    except sqlite3.OperationalError: pass
    self.execute(
      'CREATE TABLE reaction_papers ('
      '  reaction_id INTEGER, '
      '  paper_id INTEGER, '
      '  PRIMARY KEY(reaction_id, paper_id))')

    igep = IgepDB()

    igep.execute('SELECT substrate_AC, substrate_genename, kinase_AC, kinase_genename, pmid '
                 'FROM sk_new WHERE substrate_AC <> "" AND kinase_AC <> ""')
    for (substrate_ac, substrate_name, kinase_ac, kinase_name, paper_id_list) in igep.cursor:
      paper_ids = []
      if paper_id_list:
        for paper_id in paper_id_list.split(','):
          try:
            paper_ids.append(int(paper_id))
          except: pass

      substrate_entity_id = self.getSingle(
        'SELECT entity_id FROM entities WHERE uniprot_ac_id=?',
        (substrate_ac,))
      if not substrate_entity_id:
        self.execute(
          'INSERT INTO entities('
          '  entity_type, name, uniprot_ac_id, uniprot_name) '
          'VALUES(?, ?, ?, ?)',
          ('protein', substrate_name, substrate_ac, substrate_name))
        substrate_entity_id = self.getSingle(
          'SELECT entity_id FROM entities WHERE uniprot_ac_id=?',
          (substrate_ac,))

      kinase_entity_id = self.getSingle(
        'SELECT entity_id FROM entities WHERE uniprot_ac_id=?',
        (kinase_ac,))
      if not kinase_entity_id:
        self.execute(
          'INSERT INTO entities('
          '  entity_type, name, uniprot_ac_id, uniprot_name) '
          'VALUES(?, ?, ?, ?)',
          ('protein', kinase_name, kinase_ac, kinase_name))
        kinase_entity_id = self.getSingle(
          'SELECT entity_id FROM entities WHERE uniprot_ac_id=?',
          (kinase_ac,))

      # Create Reaction
      reaction_name = 'Phosphorylation of %s by %s [iGep]' % (substrate_name, kinase_name)
      self.execute(
        'INSERT INTO reactions(reaction_type, name) VALUES(?, ?)',
        ('phosphorylation', reaction_name))
      reaction_id = self.getSingle(
        'SELECT reaction_id FROM reactions WHERE name=?',
        (reaction_name,))

      # Setup inputs.
      try:
        self.execute(
          'INSERT INTO reaction_entities(reaction_id, entity_id, direction) '
          'VALUES(?, ?, ?)',
          (reaction_id, substrate_entity_id, 'input'))
      except sqlite3.IntegrityError: pass
      try:
        self.execute(
          'INSERT INTO reaction_entities(reaction_id, entity_id, direction) '
          'VALUES(?, ?, ?)',
          (reaction_id, kinase_entity_id, 'input'))
      except sqlite3.IntegrityError: pass

      # Setup output.
        # TODO eventually.

      # Add Papers
      for paper_id in paper_ids:
        try:
          self.execute(
            'INSERT INTO reaction_papers VALUES(?, ?)',
            (reaction_id, paper_id))
        except sqlite3.IntegrityError: pass

    self.setTableVersion('igep', self.IGEP_VERSION)

if '__main__' == __name__:
  db = GraphMirrorsDB()
  db.updateIgep()
  db.commit()
