#!/usr/bin/python

from database import MysqlDatabase
import re

def parseTablename(tablename):
  m = re.search('^(\d+)_(\w+)$', tablename)
  return (tablename, int(m.group(1)), m.group(2))

class LiangDB(MysqlDatabase):
  def __init__(self, user='garba1', host='localhost', database='reactome'):
    MysqlDatabase.__init__(self, user, host, database)

  def tableIterator(self):
    return (parseTablename(tablename) for tablename in self.tables)
