#!/usr/bin/python
import sqlite3
import mysql.connector
import re

target = sqlite3.connect('data.db')
tc = target.cursor()

source = mysql.connector.connect(user = 'garba1', host = 'localhost', database = 'reactome')
sc = source.cursor()

tables = []
sc.execute('SHOW TABLES')
for (tablename,) in sc:
  m = re.search('^(\d+)_(\w+)$', tablename)
  pathway_id = int(m.group(1))
  tabletype = m.group(2)

  if '1pathway2step' == tabletype:
    tables.append((tablename, pathway_id))

for (tablename, pathway_id) in tables:
  sc.execute('SELECT pathwayName FROM %s WHERE pathwayID=\'Pathway1\' LIMIT 1' % (tablename,))
  pathway_name = sc.fetchone();
  if not pathway_name:
    print(tablename, pathway_id)
