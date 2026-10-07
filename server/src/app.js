import express from 'express';
import cors from 'cors';

import usersRoutes from './modules/users/users.routes.js';
import tendersRoutes from './modules/tenders/tenders.routes.js';
import projectsRoutes from './modules/projects/projects.routes.js';
import subcontractorsRoutes from './modules/subcontractors/subcontractors.routes.js';
import employeesRoutes from './modules/employees/employees.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import dailyWorkUpdatesRoutes from './modules/dailyWorkUpdates/dailyWorkUpdates.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use('/api', usersRoutes);
  app.use('/api', tendersRoutes);
  app.use('/api', projectsRoutes);
  app.use('/api', subcontractorsRoutes);
  app.use('/api', employeesRoutes);
  app.use('/api', financeRoutes);
  app.use('/api', dailyWorkUpdatesRoutes);
  app.use('/api', dashboardRoutes);

  // Centralized error handler
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}
