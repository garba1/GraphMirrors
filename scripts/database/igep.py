#!/usr/bin/python

from database import SqliteDatabase
import sys

class IgepDB(SqliteDatabase):
  def __init__(self, location='igep.db'):
    SqliteDatabase.__init__(self, location)
