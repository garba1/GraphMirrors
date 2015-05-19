#!/usr/bin/python

import sqlite3

source = sqlite3.connect('igep.db')
sc = source.cursor()

target = sqlite3.connect('data.db')
tc = target.cursor()

sc.execute('SELECT substrate_AC, kinase_AC '
           'FROM sk_new INNER JOIN')
