// server.js
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());



// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// ====== Multer setup for official signatures and photos ======
const signaturesDir = 'uploads/signatures';
const photosDir = 'uploads/photos';
fs.mkdirSync(signaturesDir, { recursive: true });
fs.mkdirSync(photosDir, { recursive: true });

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, signaturesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photosDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const uploadSignature = multer({ storage: signatureStorage });
const uploadPhoto = multer({ storage: photoStorage });
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // Determine destination based on field name
      if (file.fieldname === 'signature') {
        cb(null, signaturesDir);
      } else if (file.fieldname === 'photo') {
        cb(null, photosDir);
      } else {
        cb(null, signaturesDir); // default
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const base = path.basename(file.originalname, ext);
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  })
});

// MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    console.error('Database query error:', err.message);
    console.error('SQL:', sql);
    console.error('Params:', params);
    throw err;
  }
}

// ====== Helper function to create history logs ======
async function createLog(req, action, moduleType = null, certificateType = null, residentId = null, residentName = null, details = null) {
  try {
    if (!req || !req.user) return; // Skip if no user (public endpoints)
    
    // Check if history_logs table exists by trying to query it
    await query(
      `INSERT INTO history_logs 
       (user_id, user_role, user_name, action, module_type, certificate_type, resident_id, resident_name, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        req.user.role || 'Unknown',
        req.user.full_name || req.user.username,
        action,
        moduleType,
        certificateType,
        residentId,
        residentName,
        details
      ]
    );
  } catch (err) {
    // Silently fail - logging should not break the main functionality
    // Only log to console if it's not a table doesn't exist error
    if (!err.message || !err.message.includes("doesn't exist")) {
      console.error('Error creating history log:', err.message);
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// ===== Helper: token from header =====
function getTokenFromHeader(req) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return null;
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return authHeader;
}

// ===== Middleware: verify token =====
function verifyToken(req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username, role, full_name }
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

// ===================== AUTH =====================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, full_name, role } = req.body;

    if (!username || !password || !full_name) {
      return res
        .status(400)
        .json({ message: 'username, password, and full_name are required.' });
    }

    // Check if username exists
    const existing = await query('SELECT id FROM users WHERE username = ?', [
      username,
    ]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Username already taken.' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `INSERT INTO users (username, password_hash, full_name, role)
       VALUES (?, ?, ?, ?)`,
      [username, password_hash, full_name, role || 'Staff']
    );

    const created = await query('SELECT id, username, full_name, role FROM users WHERE id = ?', [
      result.insertId,
    ]);

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: 'username and password are required.' });
    }

    const users = await query(
      'SELECT * FROM users WHERE username = ? LIMIT 1',
      [username]
    );
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const user = users[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const payload = {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Error in login:', err);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// GET /api/auth/me (current user)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  res.json(req.user);
});

// ===================== RESIDENTS =====================

// GET /api/residents - public view
app.get('/api/residents', async (req, res) => {
  try {
    // First, check if table exists and get column names
    let columns;
    try {
      columns = await query('SHOW COLUMNS FROM residents');
      const columnNames = columns.map(col => col.Field);
      
      // Build SELECT query with only columns that exist
      const selectColumns = ['id', 'last_name', 'first_name', 'sex', 'created_at']; // Required columns
      const optionalColumns = [
        'middle_name', 'suffix', 'birthdate', 'civil_status', 
        'contact_no', 'address', 'citizenship', 'employment_status'
      ];
      
      for (const colName of optionalColumns) {
        if (columnNames.includes(colName)) {
          selectColumns.push(colName);
        }
      }
      
      const residents = await query(
        `SELECT ${selectColumns.join(', ')} FROM residents ORDER BY last_name, first_name`
      );
      
      // Add defaults for missing optional fields
      const residentsWithDefaults = residents.map(r => ({
        ...r,
        employment_status: r.employment_status || 'Not Working',
        citizenship: r.citizenship || 'Filipino'
      }));
      
      res.json(residentsWithDefaults);
    } catch (tableErr) {
      console.error('Error checking table structure:', tableErr);
      // Fallback: try simple SELECT *
      try {
        const residents = await query(
          'SELECT * FROM residents ORDER BY last_name, first_name'
        );
        const residentsWithDefaults = residents.map(r => ({
          ...r,
          employment_status: r.employment_status || 'Not Working',
          citizenship: r.citizenship || 'Filipino'
        }));
        res.json(residentsWithDefaults);
      } catch (selectErr) {
        // Last resort: select only required columns
        const residents = await query(
          'SELECT id, last_name, first_name, sex, created_at FROM residents ORDER BY last_name, first_name'
        );
        const residentsWithDefaults = residents.map(r => ({
          ...r,
          employment_status: 'Not Working',
          citizenship: 'Filipino'
        }));
        res.json(residentsWithDefaults);
      }
    }
  } catch (err) {
    console.error('Error fetching residents:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error fetching residents',
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// POST /api/residents - create (protected)
app.post('/api/residents', verifyToken, async (req, res) => {
  try {
    const {
      last_name,
      first_name,
      middle_name,
      suffix,
      sex,
      birthdate,
      civil_status,
      contact_no,
      employment_status,
      address,
      citizenship,
    } = req.body;

    if (!last_name || !first_name || !sex) {
      return res
        .status(400)
        .json({ message: 'last_name, first_name, and sex are required.' });
    }

    // Check which columns exist in the table
    let columns;
    try {
      columns = await query('SHOW COLUMNS FROM residents');
      const columnNames = columns.map(col => col.Field);
      
      // Build INSERT query dynamically based on available columns
      const insertColumns = ['last_name', 'first_name', 'sex']; // Required columns
      const insertValues = [last_name, first_name, sex];
      
      // Add optional columns only if they exist in the database
      const optionalColumns = {
        'middle_name': middle_name || null,
        'suffix': suffix || null,
        'birthdate': birthdate || null,
        'civil_status': civil_status || null,
        'contact_no': contact_no || null,
        'address': address || null,
        'citizenship': citizenship || 'Filipino',
        'employment_status': employment_status || 'Not Working'
      };
      
      for (const [colName, colValue] of Object.entries(optionalColumns)) {
        if (columnNames.includes(colName)) {
          insertColumns.push(colName);
          insertValues.push(colValue);
        }
      }
      
      const placeholders = insertColumns.map(() => '?').join(', ');
      const result = await query(
        `INSERT INTO residents (${insertColumns.join(', ')}) VALUES (${placeholders})`,
        insertValues
      );

      // Get created resident - only select columns that exist
      const selectColumns = ['id', 'last_name', 'first_name', 'sex', 'created_at'];
      const allSelectableColumns = [
        'middle_name', 'suffix', 'birthdate', 'civil_status', 
        'contact_no', 'address', 'citizenship', 'employment_status'
      ];
      
      for (const colName of allSelectableColumns) {
        if (columnNames.includes(colName)) {
          selectColumns.push(colName);
        }
      }
      
      const created = await query(
        `SELECT ${selectColumns.join(', ')} FROM residents WHERE id = ?`,
        [result.insertId]
      );
      
      // Ensure optional fields exist in response with defaults
      if (created[0]) {
        if (!created[0].employment_status) {
          created[0].employment_status = 'Not Working';
        }
        if (!created[0].citizenship) {
          created[0].citizenship = 'Filipino';
        }
      }

      // Log resident creation
      const residentName = `${last_name}, ${first_name} ${middle_name ? `${middle_name.charAt(0)}.` : ''} ${suffix || ''}`.trim();
      await createLog(
        req,
        `created a new resident: ${residentName}`,
        'Residents',
        null,
        result.insertId,
        residentName
      );

      res.status(201).json(created[0]);
    } catch (tableErr) {
      console.error('Error checking table structure:', tableErr);
      // Fallback: try simple INSERT with only required columns
      const result = await query(
        `INSERT INTO residents (last_name, first_name, sex)
         VALUES (?, ?, ?)`,
        [last_name, first_name, sex]
      );
      
      // Try to get created resident with SELECT *
      let created;
      try {
        created = await query('SELECT * FROM residents WHERE id = ?', [result.insertId]);
      } catch (selectErr) {
        // If SELECT * fails, try with minimal columns
        created = await query(
          `SELECT id, last_name, first_name, sex, created_at
           FROM residents WHERE id = ?`,
          [result.insertId]
        );
      }
      
      if (created[0]) {
        // Add defaults for missing fields
        if (!created[0].employment_status) created[0].employment_status = 'Not Working';
        if (!created[0].citizenship) created[0].citizenship = 'Filipino';
      }
      
      // Log resident creation
      const residentName = `${last_name}, ${first_name} ${middle_name ? `${middle_name.charAt(0)}.` : ''} ${suffix || ''}`.trim();
      await createLog(
        req,
        `created a new resident: ${residentName}`,
        'Residents',
        null,
        result.insertId,
        residentName
      );

      res.status(201).json(created[0]);
    }
  } catch (err) {
    console.error('Error creating resident:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error creating resident',
      error: err.message
    });
  }
});

// PUT /api/residents/:id - update (protected)
app.put('/api/residents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      last_name,
      first_name,
      middle_name,
      suffix,
      sex,
      birthdate,
      civil_status,
      contact_no,
      employment_status,
      address,
      citizenship,
    } = req.body;

    // Check which columns exist in the table
    let columns;
    try {
      columns = await query('SHOW COLUMNS FROM residents');
      const columnNames = columns.map(col => col.Field);
      
      // Build UPDATE query dynamically based on available columns
      const updateFields = ['last_name = ?', 'first_name = ?', 'sex = ?']; // Required columns
      const updateValues = [last_name, first_name, sex];
      
      // Add optional columns only if they exist in the database
      const optionalColumns = {
        'middle_name': middle_name || null,
        'suffix': suffix || null,
        'birthdate': birthdate || null,
        'civil_status': civil_status || null,
        'contact_no': contact_no || null,
        'address': address || null,
        'citizenship': citizenship || 'Filipino',
        'employment_status': employment_status || 'Not Working'
      };
      
      for (const [colName, colValue] of Object.entries(optionalColumns)) {
        if (columnNames.includes(colName)) {
          updateFields.push(`${colName} = ?`);
          updateValues.push(colValue);
        }
      }
      
      updateValues.push(id); // Add id for WHERE clause
      
      await query(
        `UPDATE residents SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );

      // Get updated resident - only select columns that exist
      const selectColumns = ['id', 'last_name', 'first_name', 'sex', 'created_at'];
      const allSelectableColumns = [
        'middle_name', 'suffix', 'birthdate', 'civil_status', 
        'contact_no', 'address', 'citizenship', 'employment_status'
      ];
      
      for (const colName of allSelectableColumns) {
        if (columnNames.includes(colName)) {
          selectColumns.push(colName);
        }
      }
      
      const updated = await query(
        `SELECT ${selectColumns.join(', ')} FROM residents WHERE id = ?`,
        [id]
      );
      
      // Ensure optional fields exist in response with defaults
      if (updated[0]) {
        if (!updated[0].employment_status) {
          updated[0].employment_status = 'Not Working';
        }
        if (!updated[0].citizenship) {
          updated[0].citizenship = 'Filipino';
        }
      }
      
      // Log resident update
      const residentName = `${last_name}, ${first_name} ${middle_name ? `${middle_name.charAt(0)}.` : ''} ${suffix || ''}`.trim();
      await createLog(
        req,
        `updated resident information: ${residentName}`,
        'Residents',
        null,
        id,
        residentName
      );
      
      res.json(updated[0]);
    } catch (tableErr) {
      console.error('Error checking table structure:', tableErr);
      // Fallback: try simple UPDATE with only required columns
      await query(
        `UPDATE residents SET last_name = ?, first_name = ?, sex = ? WHERE id = ?`,
        [last_name, first_name, sex, id]
      );
      
      // Try to get updated resident with SELECT *
      let updated;
      try {
        updated = await query('SELECT * FROM residents WHERE id = ?', [id]);
      } catch (selectErr) {
        // If SELECT * fails, try with minimal columns
        updated = await query(
          `SELECT id, last_name, first_name, sex, created_at
           FROM residents WHERE id = ?`,
          [id]
        );
      }
      
      if (updated[0]) {
        // Add defaults for missing fields
        if (!updated[0].employment_status) updated[0].employment_status = 'Not Working';
        if (!updated[0].citizenship) updated[0].citizenship = 'Filipino';
      }
      
      // Log resident update
      const residentName = `${last_name}, ${first_name} ${middle_name ? `${middle_name.charAt(0)}.` : ''} ${suffix || ''}`.trim();
      await createLog(
        req,
        `updated resident information: ${residentName}`,
        'Residents',
        null,
        id,
        residentName
      );
      
      res.json(updated[0]);
    }
  } catch (err) {
    console.error('Error updating resident:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      message: 'Error updating resident',
      error: err.message
    });
  }
});

// ===================== HOUSEHOLDS =====================

// GET /api/households
app.get('/api/households', async (req, res) => {
  try {
    const households = await query(
      `SELECT h.*,
              COUNT(hm.id) AS member_count
       FROM households h
       LEFT JOIN household_members hm ON hm.household_id = h.id
       GROUP BY h.id
       ORDER BY h.household_name`
    );
    res.json(households);
  } catch (err) {
    console.error('Error fetching households:', err);
    res.status(500).json({ message: 'Error fetching households' });
  }
});

// POST /api/households (protected)
app.post('/api/households', verifyToken, async (req, res) => {
  try {
    const { household_name, address, purok } = req.body;

    if (!household_name || !address) {
      return res
        .status(400)
        .json({ message: 'household_name and address are required.' });
    }

    const result = await query(
      `INSERT INTO households (household_name, address, purok)
       VALUES (?, ?, ?)`,
      [household_name, address, purok || null]
    );

    const created = await query('SELECT * FROM households WHERE id = ?', [
      result.insertId,
    ]);
    
    // Log household creation
    await createLog(
      req,
      `created a new household: ${household_name}`,
      'Households',
      null,
      null,
      null,
      `Address: ${address}`
    );
    
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating household:', err);
    res.status(500).json({ message: 'Error creating household' });
  }
});

// PUT /api/households/:id (protected)
app.put('/api/households/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { household_name, address, purok } = req.body;

    await query(
      `UPDATE households
       SET household_name = ?, address = ?, purok = ?
       WHERE id = ?`,
      [household_name, address, purok || null, id]
    );

    const updated = await query('SELECT * FROM households WHERE id = ?', [id]);
    
    // Log household update
    await createLog(
      req,
      `updated household: ${household_name}`,
      'Households',
      null,
      null,
      null,
      `Address: ${address}`
    );
    
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating household:', err);
    res.status(500).json({ message: 'Error updating household' });
  }
});

// GET /api/households/:id/members
app.get('/api/households/:id/members', async (req, res) => {
  try {
    const householdId = req.params.id;
    const members = await query(
      `SELECT hm.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              r.middle_name,
              r.suffix,
              r.birthdate,
              r.civil_status,
              r.contact_no,
              r.employment_status,
              hm.relation_to_head,
              TIMESTAMPDIFF(YEAR, r.birthdate, CURDATE()) AS age
       FROM household_members hm
       JOIN residents r ON r.id = hm.resident_id
       WHERE hm.household_id = ?
       ORDER BY r.last_name, r.first_name`,
      [householdId]
    );
    res.json(members);
  } catch (err) {
    console.error('Error fetching household members:', err);
    res.status(500).json({ message: 'Error fetching household members' });
  }
});

// POST /api/households/:id/members (protected)
app.post('/api/households/:id/members', verifyToken, async (req, res) => {
  try {
    const householdId = req.params.id;
    const { resident_id, relation_to_head } = req.body;

    if (!resident_id) {
      return res
        .status(400)
        .json({ message: 'resident_id is required to add member.' });
    }

    const result = await query(
      `INSERT INTO household_members (household_id, resident_id, relation_to_head)
       VALUES (?, ?, ?)`,
      [householdId, resident_id, relation_to_head || null]
    );

    const created = await query(
      `SELECT hm.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              hm.relation_to_head
       FROM household_members hm
       JOIN residents r ON r.id = hm.resident_id
       WHERE hm.id = ?`,
      [result.insertId]
    );

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error adding household member:', err);
    res.status(500).json({ message: 'Error adding household member' });
  }
});

// ===================== INCIDENTS =====================

// GET /api/incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await query(
      `SELECT i.*,
              c.first_name AS complainant_first_name,
              c.last_name AS complainant_last_name,
              r.first_name AS respondent_first_name,
              r.last_name AS respondent_last_name
       FROM incidents i
       LEFT JOIN residents c ON c.id = i.complainant_id
       LEFT JOIN residents r ON r.id = i.respondent_id
       ORDER BY i.incident_date DESC`
    );
    res.json(incidents);
  } catch (err) {
    console.error('Error fetching incidents:', err);
    res.status(500).json({ message: 'Error fetching incidents' });
  }
});

// POST /api/incidents (protected)
app.post('/api/incidents', verifyToken, async (req, res) => {
  try {
    const {
      incident_date,
      incident_type,
      location,
      description,
      complainant_id,
      complainant_name,
      respondent_id,
      status,
    } = req.body;

    if (!incident_date || !incident_type) {
      return res
        .status(400)
        .json({ message: 'incident_date and incident_type are required.' });
    }

    // Check if complainant_name column exists
    let columns;
    let hasComplainantName = false;
    try {
      columns = await query('SHOW COLUMNS FROM incidents');
      const columnNames = columns.map(col => col.Field);
      hasComplainantName = columnNames.includes('complainant_name');
    } catch (err) {
      console.error('Error checking columns:', err);
    }

    let result;
    if (hasComplainantName) {
      result = await query(
        `INSERT INTO incidents
         (incident_date, incident_type, location, description,
          complainant_id, complainant_name, respondent_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incident_date,
          incident_type,
          location || null,
          description || null,
          complainant_id || null,
          complainant_name || null,
          respondent_id || null,
          status || 'Open',
        ]
      );
    } else {
      result = await query(
        `INSERT INTO incidents
         (incident_date, incident_type, location, description,
          complainant_id, respondent_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          incident_date,
          incident_type,
          location || null,
          description || null,
          complainant_id || null,
          respondent_id || null,
          status || 'Open',
        ]
      );
    }

    const created = await query('SELECT * FROM incidents WHERE id = ?', [
      result.insertId,
    ]);
    
    // Get complainant name for logging
    let complainantDisplayName = complainant_name || '';
    if (!complainantDisplayName && complainant_id) {
      const complainant = await query('SELECT first_name, last_name FROM residents WHERE id = ?', [complainant_id]);
      if (complainant[0]) {
        complainantDisplayName = `${complainant[0].last_name}, ${complainant[0].first_name}`;
      }
    }
    
    // Log incident creation
    await createLog(
      req,
      `created a new incident: ${incident_type}${complainantDisplayName ? ` reported by ${complainantDisplayName}` : ''}`,
      'Incidents',
      null,
      null,
      complainantDisplayName || null,
      `Location: ${location || 'N/A'}, Status: ${status || 'Open'}`
    );
    
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ message: 'Error creating incident' });
  }
});

// PUT /api/incidents/:id (protected)
app.put('/api/incidents/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      incident_date,
      incident_type,
      location,
      description,
      complainant_id,
      complainant_name,
      respondent_id,
      status,
    } = req.body;

    // Check if complainant_name column exists
    let columns;
    let hasComplainantName = false;
    try {
      columns = await query('SHOW COLUMNS FROM incidents');
      const columnNames = columns.map(col => col.Field);
      hasComplainantName = columnNames.includes('complainant_name');
    } catch (err) {
      console.error('Error checking columns:', err);
    }

    if (hasComplainantName) {
      await query(
        `UPDATE incidents
         SET incident_date = ?, incident_type = ?, location = ?,
             description = ?, complainant_id = ?, complainant_name = ?, respondent_id = ?, status = ?
         WHERE id = ?`,
        [
          incident_date,
          incident_type,
          location || null,
          description || null,
          complainant_id || null,
          complainant_name || null,
          respondent_id || null,
          status || 'Open',
          id,
        ]
      );
    } else {
      await query(
        `UPDATE incidents
         SET incident_date = ?, incident_type = ?, location = ?,
             description = ?, complainant_id = ?, respondent_id = ?, status = ?
         WHERE id = ?`,
        [
          incident_date,
          incident_type,
          location || null,
          description || null,
          complainant_id || null,
          respondent_id || null,
          status || 'Open',
          id,
        ]
      );
    }

    const updated = await query('SELECT * FROM incidents WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ message: 'Error updating incident' });
  }
});

// ===================== SERVICES =====================

// GET /api/services
app.get('/api/services', async (req, res) => {
  try {
    const services = await query(
      `SELECT s.*,
              COUNT(sb.id) AS beneficiary_count
       FROM services s
       LEFT JOIN service_beneficiaries sb ON sb.service_id = s.id
       GROUP BY s.id
       ORDER BY s.service_date DESC, s.service_name`
    );
    res.json(services);
  } catch (err) {
    console.error('Error fetching services:', err);
    res.status(500).json({ message: 'Error fetching services' });
  }
});

// POST /api/services (protected)
app.post('/api/services', verifyToken, async (req, res) => {
  try {
    const { service_name, description, service_date, location } = req.body;

    if (!service_name) {
      return res.status(400).json({ message: 'service_name is required.' });
    }

    const result = await query(
      `INSERT INTO services (service_name, description, service_date, location)
       VALUES (?, ?, ?, ?)`,
      [service_name, description || null, service_date || null, location || null]
    );

    const created = await query('SELECT * FROM services WHERE id = ?', [
      result.insertId,
    ]);
    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating service:', err);
    res.status(500).json({ message: 'Error creating service' });
  }
});

// PUT /api/services/:id (protected)
app.put('/api/services/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { service_name, description, service_date, location } = req.body;

    await query(
      `UPDATE services
       SET service_name = ?, description = ?, service_date = ?, location = ?
       WHERE id = ?`,
      [service_name, description || null, service_date || null, location || null, id]
    );

    const updated = await query('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating service:', err);
    res.status(500).json({ message: 'Error updating service' });
  }
});

// GET /api/services/:id/beneficiaries
app.get('/api/services/:id/beneficiaries', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const beneficiaries = await query(
      `SELECT sb.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              sb.notes
       FROM service_beneficiaries sb
       JOIN residents r ON r.id = sb.resident_id
       WHERE sb.service_id = ?
       ORDER BY r.last_name, r.first_name`,
      [serviceId]
    );
    res.json(beneficiaries);
  } catch (err) {
    console.error('Error fetching beneficiaries:', err);
    res.status(500).json({ message: 'Error fetching beneficiaries' });
  }
});

// POST /api/services/:id/beneficiaries (protected)
app.post('/api/services/:id/beneficiaries', verifyToken, async (req, res) => {
  try {
    const serviceId = req.params.id;
    const { resident_id, notes } = req.body;

    if (!resident_id) {
      return res
        .status(400)
        .json({ message: 'resident_id is required for beneficiary.' });
    }

    const result = await query(
      `INSERT INTO service_beneficiaries (service_id, resident_id, notes)
       VALUES (?, ?, ?)`,
      [serviceId, resident_id, notes || null]
    );

    const created = await query(
      `SELECT sb.id,
              r.id AS resident_id,
              r.first_name,
              r.last_name,
              sb.notes
       FROM service_beneficiaries sb
       JOIN residents r ON r.id = sb.resident_id
       WHERE sb.id = ?`,
      [result.insertId]
    );

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error adding beneficiary:', err);
    res.status(500).json({ message: 'Error adding beneficiary' });
  }
});

// Root
app.get('/', (req, res) => {
  res.send('Barangay System API running...');
});
// ===================== BARANGAY PROFILE =====================

// GET /api/barangay-profile
app.get('/api/barangay-profile', async (req, res) => {
  try {
    const rows = await query(
      'SELECT id, barangay_name, municipality, province, place_issued FROM barangay_profile LIMIT 1'
    );

    if (rows.length === 0) {
      // No record yet – send some defaults (optional)
      return res.json(null);
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching barangay profile:', err);
    res.status(500).json({ message: 'Error fetching barangay profile' });
  }
});

// PUT /api/barangay-profile (protected, upsert)
app.put('/api/barangay-profile', verifyToken, async (req, res) => {
  try {
    const { barangay_name, municipality, province, place_issued } = req.body;

    if (!barangay_name || !municipality || !province) {
      return res.status(400).json({
        message: 'barangay_name, municipality, and province are required.',
      });
    }

    const existing = await query(
      'SELECT id FROM barangay_profile LIMIT 1'
    );

    if (existing.length > 0) {
      const id = existing[0].id;
      await query(
        `UPDATE barangay_profile
         SET barangay_name = ?, municipality = ?, province = ?, place_issued = ?
         WHERE id = ?`,
        [barangay_name, municipality, province, place_issued || null, id]
      );
    } else {
      await query(
        `INSERT INTO barangay_profile
         (barangay_name, municipality, province, place_issued)
         VALUES (?, ?, ?, ?)`,
        [barangay_name, municipality, province, place_issued || null]
      );
    }

    const rows = await query(
      'SELECT id, barangay_name, municipality, province, place_issued FROM barangay_profile LIMIT 1'
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error saving barangay profile:', err);
    res.status(500).json({ message: 'Error saving barangay profile' });
  }
});


// ===================== OFFICIALS =====================

// GET /api/officials
app.get('/api/officials', async (req, res) => {
  try {
    const officials = await query(
      `SELECT id, full_name, position, order_no,
              is_captain, is_secretary, signature_path, photo_path
       FROM officials
       ORDER BY order_no, position, full_name`
    );
    res.json(officials);
  } catch (err) {
    console.error('Error fetching officials:', err);
    res.status(500).json({ message: 'Error fetching officials' });
  }
});

// POST /api/officials (protected, with signature and photo upload)
app.post(
  '/api/officials',
  verifyToken,
  upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { full_name, position, order_no, is_captain, is_secretary } =
        req.body;

      if (!full_name || !position) {
        return res
          .status(400)
          .json({ message: 'full_name and position are required.' });
      }

      const signatureFile = req.files?.signature?.[0];
      const photoFile = req.files?.photo?.[0];

      const signature_path = signatureFile
        ? `/uploads/signatures/${signatureFile.filename}`
        : null;
      
      const photo_path = photoFile
        ? `/uploads/photos/${photoFile.filename}`
        : null;

      const result = await query(
        `INSERT INTO officials
         (full_name, position, order_no, is_captain, is_secretary, signature_path, photo_path)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          full_name,
          position,
          order_no || 0,
          is_captain === '1' ? 1 : 0,
          is_secretary === '1' ? 1 : 0,
          signature_path,
          photo_path,
        ]
      );

      const created = await query(
        'SELECT * FROM officials WHERE id = ?',
        [result.insertId]
      );
      res.status(201).json(created[0]);
    } catch (err) {
      console.error('Error creating official:', err);
      res.status(500).json({ message: 'Error creating official' });
    }
  }
);

// PUT /api/officials/:id (protected, optional new signature and photo)
app.put(
  '/api/officials/:id',
  verifyToken,
  upload.fields([
    { name: 'signature', maxCount: 1 },
    { name: 'photo', maxCount: 1 }
  ]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { full_name, position, order_no, is_captain, is_secretary } =
        req.body;

      const signatureFile = req.files?.signature?.[0];
      const photoFile = req.files?.photo?.[0];

      // Get current official data
      const current = await query('SELECT * FROM officials WHERE id = ?', [id]);
      if (current.length === 0) {
        return res.status(404).json({ message: 'Official not found' });
      }

      const signature_path = signatureFile
        ? `/uploads/signatures/${signatureFile.filename}`
        : current[0].signature_path;
      
      const photo_path = photoFile
        ? `/uploads/photos/${photoFile.filename}`
        : current[0].photo_path;

      await query(
        `UPDATE officials
         SET full_name = ?, position = ?, order_no = ?,
             is_captain = ?, is_secretary = ?, signature_path = ?, photo_path = ?
         WHERE id = ?`,
        [
          full_name,
          position,
          order_no || 0,
          is_captain === '1' ? 1 : 0,
          is_secretary === '1' ? 1 : 0,
          signature_path,
          photo_path,
          id,
        ]
      );

      const updated = await query('SELECT * FROM officials WHERE id = ?', [
        id,
      ]);
      res.json(updated[0]);
    } catch (err) {
      console.error('Error updating official:', err);
      res.status(500).json({ message: 'Error updating official' });
    }
  }
);

// DELETE /api/officials/:id (protected)
app.delete('/api/officials/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM officials WHERE id = ?', [id]);
    res.json({ message: 'Official deleted successfully' });
  } catch (err) {
    console.error('Error deleting official:', err);
    res.status(500).json({ message: 'Error deleting official' });
  }
});

// ===================== CERTIFICATES =====================

// GET /api/certificates
app.get('/api/certificates', async (req, res) => {
  try {
    const certificates = await query(
      `SELECT c.*,
              r.first_name,
              r.last_name,
              r.middle_name,
              r.suffix
       FROM certificates c
       JOIN residents r ON r.id = c.resident_id
       ORDER BY c.issue_date DESC, c.created_at DESC`
    );
    res.json(certificates);
  } catch (err) {
    console.error('Error fetching certificates:', err);
    res.status(500).json({ message: 'Error fetching certificates' });
  }
});

// POST /api/certificates (protected)
app.post('/api/certificates', verifyToken, async (req, res) => {
  try {
    const {
      resident_id,
      certificate_type,
      serial_number,
      purpose,
      issue_date,
      place_issued,
      amount,
    } = req.body;

    if (!resident_id || !certificate_type || !serial_number || !issue_date) {
      return res.status(400).json({
        message: 'resident_id, certificate_type, serial_number, and issue_date are required.',
      });
    }

    // Check if serial number already exists
    const existing = await query(
      'SELECT id FROM certificates WHERE serial_number = ?',
      [serial_number]
    );
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Serial number already exists.' });
    }

    const result = await query(
      `INSERT INTO certificates
       (resident_id, certificate_type, serial_number, purpose, issue_date, place_issued, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        resident_id,
        certificate_type,
        serial_number,
        purpose || null,
        issue_date,
        place_issued || null,
        amount || null,
      ]
    );

    const created = await query(
      `SELECT c.*,
              r.first_name,
              r.last_name,
              r.middle_name,
              r.suffix
       FROM certificates c
       JOIN residents r ON r.id = c.resident_id
       WHERE c.id = ?`,
      [result.insertId]
    );

    // Log the certificate creation
    const residentFullName = created[0] 
      ? `${created[0].last_name}, ${created[0].first_name} ${created[0].middle_name ? `${created[0].middle_name.charAt(0)}.` : ''} ${created[0].suffix || ''}`.trim()
      : null;
    
    const certificateTypeLabels = {
      'residency': 'Certificate of Residency',
      'indigency': 'Certificate of Indigency',
      'clearance': 'Barangay Clearance',
      'general': 'General Certificate',
      'jobseeker': 'First Time Job Seeker (RA 11261)',
      'oath': 'Oath of Undertaking',
      'good_moral': 'Certificate of Good Moral'
    };
    
    const certLabel = certificateTypeLabels[certificate_type] || certificate_type;
    await createLog(
      req,
      `released the ${certLabel} of ${residentFullName || 'Unknown'}`,
      'Certificates',
      certificate_type,
      resident_id,
      residentFullName,
      `Serial Number: ${serial_number}`
    );

    res.status(201).json(created[0]);
  } catch (err) {
    console.error('Error creating certificate:', err);
    res.status(500).json({ message: 'Error creating certificate' });
  }
});

// ===================== HISTORY LOGS =====================

// GET /api/history-logs (protected, only Chairman and Secretary)
app.get('/api/history-logs', verifyToken, async (req, res) => {
  try {
    // Check if user is Chairman or Secretary
    if (req.user.role !== 'Chairman' && req.user.role !== 'Secretary') {
      return res.status(403).json({ message: 'Access denied. Only Chairman and Secretary can view history logs.' });
    }

    const logs = await query(
      `SELECT id, user_role, user_name, action, module_type, certificate_type, 
              resident_name, details, created_at
       FROM history_logs
       ORDER BY created_at DESC
       LIMIT 1000`
    );
    res.json(logs);
  } catch (err) {
    console.error('Error fetching history logs:', err);
    res.status(500).json({ message: 'Error fetching history logs' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
