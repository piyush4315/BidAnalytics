PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER',
  isActive INTEGER NOT NULL DEFAULT 1,
  lastLoginAt TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS TaxConfig (
  id TEXT PRIMARY KEY,
  gstRate REAL NOT NULL DEFAULT 0.18,
  tcsRate REAL NOT NULL DEFAULT 0.02,
  tds194ORate REAL NOT NULL DEFAULT 0.001,
  serviceChargeRate REAL NOT NULL DEFAULT 0.0225,
  serviceChargeGstFactor REAL NOT NULL DEFAULT 1.18,
  tds194HRate REAL NOT NULL DEFAULT 0.02,
  cashReceivableFactor REAL NOT NULL DEFAULT 1.1765,
  securityDepositRate REAL NOT NULL DEFAULT 0.25,
  defaultGstTdsRate REAL NOT NULL DEFAULT 0,
  notes TEXT,
  updatedById TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS Auction (
  id TEXT PRIMARY KEY,
  number TEXT NOT NULL UNIQUE,
  title TEXT,
  description TEXT,
  auctionDate TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE IF NOT EXISTS Buyer (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  contactPerson TEXT,
  mobile TEXT,
  email TEXT,
  gstNumber TEXT,
  pan TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  bankName TEXT,
  bankAccount TEXT,
  ifsc TEXT,
  isActive INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT
);

CREATE TABLE IF NOT EXISTS Lot (
  id TEXT PRIMARY KEY,
  lotNumber TEXT NOT NULL UNIQUE,
  auctionId TEXT NOT NULL,
  buyerId TEXT,
  name TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SOLD',
  rate REAL NOT NULL,
  materialValue REAL NOT NULL,
  gstTdsRate REAL NOT NULL DEFAULT 0,
  gstAmount REAL NOT NULL DEFAULT 0,
  materialValueWithGst REAL NOT NULL DEFAULT 0,
  tcsAmount REAL NOT NULL DEFAULT 0,
  tds194O REAL NOT NULL DEFAULT 0,
  serviceChargeGross REAL NOT NULL DEFAULT 0,
  tds194H REAL NOT NULL DEFAULT 0,
  netServiceCharge REAL NOT NULL DEFAULT 0,
  serviceChargeToMstc REAL NOT NULL DEFAULT 0,
  gstTdsAmount REAL NOT NULL DEFAULT 0,
  totalReceivable REAL NOT NULL DEFAULT 0,
  securityDepositExpected REAL NOT NULL DEFAULT 0,
  finalPaymentExpected REAL NOT NULL DEFAULT 0,
  calcSnapshot TEXT,
  notes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  FOREIGN KEY (auctionId) REFERENCES Auction(id),
  FOREIGN KEY (buyerId) REFERENCES Buyer(id)
);

CREATE INDEX IF NOT EXISTS idx_lot_auction ON Lot(auctionId);
CREATE INDEX IF NOT EXISTS idx_lot_buyer ON Lot(buyerId);

CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  lotId TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  receivedOn TEXT,
  paymentRef TEXT,
  bankRef TEXT,
  remarks TEXT,
  createdById TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  FOREIGN KEY (lotId) REFERENCES Lot(id),
  FOREIGN KEY (createdById) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_lot ON Payment(lotId);

CREATE TABLE IF NOT EXISTS Invoice (
  id TEXT PRIMARY KEY,
  lotId TEXT NOT NULL,
  invoiceNumber TEXT NOT NULL,
  invoiceDate TEXT,
  amount REAL,
  status TEXT NOT NULL DEFAULT 'GENERATED',
  remarks TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  FOREIGN KEY (lotId) REFERENCES Lot(id)
);

CREATE TABLE IF NOT EXISTS SapDocument (
  id TEXT PRIMARY KEY,
  lotId TEXT NOT NULL,
  invoiceId TEXT,
  documentNumber TEXT NOT NULL,
  documentType TEXT,
  documentDate TEXT,
  amount REAL,
  postingStatus TEXT NOT NULL DEFAULT 'POSTED',
  remarks TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  FOREIGN KEY (lotId) REFERENCES Lot(id),
  FOREIGN KEY (invoiceId) REFERENCES Invoice(id)
);

CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  userId TEXT,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  action TEXT NOT NULL,
  field TEXT,
  oldValue TEXT,
  newValue TEXT,
  meta TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id)
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON AuditLog(entityType, entityId);

CREATE TABLE IF NOT EXISTS ImportJob (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  sheetName TEXT,
  status TEXT NOT NULL,
  mapping TEXT,
  result TEXT,
  createdById TEXT,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (createdById) REFERENCES User(id)
);
