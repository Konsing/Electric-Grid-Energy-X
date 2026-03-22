import { Router, Request, Response } from 'express';
import { config } from '../../lib/config';
import { runMonthlySimulation } from './simulation.service';

export const simulationRouter = Router();

simulationRouter.post('/simulate', async (req: Request, res: Response) => {
  // Verify secret
  const auth = req.headers.authorization;
  if (!config.SIMULATION_SECRET || auth !== `Bearer ${config.SIMULATION_SECRET}`) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  try {
    const results = await runMonthlySimulation();
    res.json({ success: true, data: results });
  } catch (err: any) {
    console.error('Simulation failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
