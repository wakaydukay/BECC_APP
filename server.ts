import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { serverDb } from './server/database';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with appropriate payload limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Basic CORS & Logging middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // --- API Routes ---

  // 1. Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'BECC Cooperative Core API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: 'Online & Persistent (JSON Store)',
      totalMembers: serverDb.getMembers().length,
      totalLoans: serverDb.getLoans().length
    });
  });

  // 2. Full State & Seed
  app.get('/api/coop/state', (req, res) => {
    try {
      const state = serverDb.getState();
      res.json({
        success: true,
        data: state
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 3. Bidirectional Sync Endpoint
  app.post('/api/coop/sync', (req, res) => {
    try {
      const { queue = [] } = req.body;
      const result = serverDb.handleSync(queue);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 4. Reset Server Data
  app.post('/api/coop/reset', (req, res) => {
    try {
      const state = serverDb.resetToDefault();
      res.json({ success: true, message: 'Server database reset to BECC seed data.', state });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // 5. Member Endpoints
  app.get('/api/members', (req, res) => {
    try {
      const members = serverDb.getMembers();
      res.json({ success: true, data: members });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.get('/api/members/:id', (req, res) => {
    try {
      const member = serverDb.getMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found' });
      }
      res.json({ success: true, data: member });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/members', (req, res) => {
    try {
      const newMember = serverDb.addMember(req.body);
      res.status(201).json({ success: true, data: newMember });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  app.put('/api/members/:id', (req, res) => {
    try {
      const updated = serverDb.updateMember(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Member not found' });
      }
      res.json({ success: true, data: updated });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  // 6. Loan Endpoints
  app.get('/api/loans', (req, res) => {
    try {
      const loans = serverDb.getLoans();
      res.json({ success: true, data: loans });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/loans', (req, res) => {
    try {
      const loan = serverDb.addLoan(req.body);
      res.status(201).json({ success: true, data: loan });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  app.put('/api/loans/:id', (req, res) => {
    try {
      const updated = serverDb.updateLoan(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Loan not found' });
      }
      res.json({ success: true, data: updated });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  app.post('/api/loans/:id/pay', (req, res) => {
    try {
      const result = serverDb.recordLoanPayment(req.body);
      res.json({ success: true, ...result });
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  // 7. Savings Endpoints
  app.get('/api/savings', (req, res) => {
    try {
      const accounts = serverDb.getSavingsAccounts();
      res.json({ success: true, data: accounts });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  app.post('/api/savings/deposit', (req, res) => {
    try {
      const { accountId, amount, notes, performedBy } = req.body;
      const result = serverDb.processSavingsDeposit(accountId, Number(amount), notes, performedBy);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  app.post('/api/savings/withdraw', (req, res) => {
    try {
      const { accountId, amount, notes, performedBy } = req.body;
      const result = serverDb.processSavingsWithdrawal(accountId, Number(amount), notes, performedBy);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ success: false, error: e.message });
    }
  });

  // 8. Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    try {
      const state = serverDb.getState();
      res.json({ success: true, data: state.auditLogs });
    } catch (e: any) {
      res.status(500).json({ success: false, error: e.message });
    }
  });

  // --- Vite & Static Asset Handling ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`BECC Cooperative Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
