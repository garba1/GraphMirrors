#!/usr/bin/python

import sqlite3
import mysql.connector

class Database:
  def __init__(self, connection):
    self.connection = connection
    self.cursor = connection.cursor()

  def execute(self, command, arguments = (), cursor = None):
    if None == cursor:
      cursor = self.cursor
    elif 'new' == cursor:
      cursor = self.connection.cursor()
    cursor.execute(command, arguments)
    return cursor

  def getSingle(self, command, arguments = (), default = None):
    self.execute(command, arguments)
    result = self.cursor.fetchone()
    if not result: return default
    return result[0]

  def commit(self):
    self.connection.commit()


class SqliteDatabase(Database):
  def __init__(self, filename):
    Database.__init__(self, sqlite3.connect(filename))

  def hasTable(self, tablename):
    self.cursor.execute(
      'SELECT name FROM sqlite_master WHERE type="table" AND name=?',
      (tablename,))
    return bool(self.cursor.fetchone())

class MysqlDatabase(Database):
  def __init__(self, user='user', host='localhost', database='database'):
    connection = mysql.connector.connect(
      user = user,
      host = host,
      database = database)
    Database.__init__(self, connection)
    self._tables = None

  @property
  def tables(self):
    if not self._tables:
      self._tables = []
      self.execute('SHOW TABLES')
      for (tablename,) in self.cursor:
        self._tables.append(tablename)
    return self._tables
