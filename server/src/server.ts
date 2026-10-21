import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Import Controllers & Middlewares
import * as authController from './controllers/authController';
import * as tournamentController from './controllers/tournamentController';
import * as matchController from './controllers/matchController';
import * as teamController from './controllers/teamController';
import * as playerController from './controllers/playerController';
import * as standingsController from './controllers/standingsController';
import * as announcementController from './controllers/announcementController';
import * as adminController from './controllers/adminController';
import { authenticateToken, requireRole, requireApprovedOrganizer, optionalAuthenticateToken } from './middleware/auth';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io configuration
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Socket.IO event handling
io.on('connection', (socket) => {
  // Join match-specific room for real-time room credentials and scores
  socket.on('join_match', (matchId: string) => {
    socket.join(`match:${matchId}`);
  });

  socket.on('leave_match', (matchId: string) => {
    socket.leave(`match:${matchId}`);
  });

  socket.on('disconnect', () => {});
});

// Fix Vercel serverless rewrite destination paths
app.use((req, _res, next) => {
  if (req.originalUrl && (req.url.includes('[...all]') || req.url === '/api' || req.url === '/api/index')) {
    req.url = req.originalUrl;
  }
  next();
});

// ==================== ROUTES ====================
const apiRouter = express.Router();

// Root & Health check
apiRouter.get(['/', '/health'], (_req, res) => {
  res.json({
    status: 'online',
    platform: 'ICONIC ESPORTS',
    game: 'BATTLEGROUNDS MOBILE INDIA',
    timestamp: new Date().toISOString()
  });
});

// Authentication & Profile Routes
apiRouter.post('/auth/register', authController.register);
apiRouter.post('/auth/login', authController.login);
apiRouter.post('/auth/logout', authController.logout);
apiRouter.get('/auth/me', authenticateToken, authController.getMe);
apiRouter.put('/auth/profile', authenticateToken, authController.updateProfile);

// Tournament Routes
apiRouter.get('/tournaments', tournamentController.getTournaments);
apiRouter.get('/tournaments/:slug', tournamentController.getTournamentBySlug);
apiRouter.post('/tournaments', authenticateToken, requireApprovedOrganizer, tournamentController.createTournament);
apiRouter.put('/tournaments/:id', authenticateToken, requireApprovedOrganizer, tournamentController.updateTournament);
apiRouter.post('/tournaments/:tournamentId/register', authenticateToken, tournamentController.registerTeam);
apiRouter.post('/tournaments/:tournamentId/claim-slot', authenticateToken, tournamentController.claimSlot);
apiRouter.get('/tournaments/:tournamentId/registrations', tournamentController.getRegistrations);
apiRouter.put('/tournaments/registrations/:registrationId', authenticateToken, requireApprovedOrganizer, tournamentController.updateRegistrationStatus);
apiRouter.post('/tournaments/:tournamentId/advance-stage', authenticateToken, requireApprovedOrganizer, tournamentController.advanceStage);

// Match & Room Routes
apiRouter.get('/tournaments/:tournamentId/matches', matchController.getMatches);
apiRouter.post('/tournaments/:tournamentId/matches', authenticateToken, requireApprovedOrganizer, matchController.createMatch);
apiRouter.get('/matches/:matchId', matchController.getMatchDetails);
apiRouter.get('/matches/:matchId/credentials', authenticateToken, matchController.getRoomCredentials);
apiRouter.put('/matches/:matchId/credentials', authenticateToken, requireApprovedOrganizer, matchController.updateRoomCredentials);
apiRouter.post('/matches/:matchId/results', authenticateToken, requireApprovedOrganizer, matchController.submitMatchResults);
apiRouter.put('/matches/:matchId/review', authenticateToken, requireApprovedOrganizer, matchController.reviewMatchResults);

// Standings & Leaderboard Routes
apiRouter.get('/tournaments/:tournamentId/standings', standingsController.getTournamentStandings);
apiRouter.get('/tournaments/:tournamentId/mvp-leaderboard', standingsController.getTournamentMvpLeaderboard);

// Team Routes
apiRouter.get('/teams', teamController.getTeams);
apiRouter.get('/teams/:id', teamController.getTeamById);
apiRouter.post('/teams', authenticateToken, teamController.createTeam);
apiRouter.post('/teams/:teamId/members', authenticateToken, teamController.addMember);
apiRouter.delete('/teams/:teamId/members/:playerId', authenticateToken, teamController.removeMember);

// Player Routes
apiRouter.get('/players', playerController.getPlayers);
apiRouter.get('/players/:id', playerController.getPlayerById);
apiRouter.put('/players', authenticateToken, playerController.updatePlayer);
apiRouter.get('/player/dashboard', authenticateToken, playerController.getPlayerDashboardData);
apiRouter.post('/player/apply-organizer', authenticateToken, playerController.applyForOrganizer);

// Announcement Routes
apiRouter.get('/announcements', announcementController.getAnnouncements);
apiRouter.post('/announcements', authenticateToken, requireApprovedOrganizer, announcementController.createAnnouncement);
apiRouter.delete('/announcements/:id', authenticateToken, requireApprovedOrganizer, announcementController.deleteAnnouncement);

// Admin Routes
apiRouter.get('/admin/stats', authenticateToken, requireRole('ADMIN'), adminController.getAdminStats);
apiRouter.get('/admin/users', authenticateToken, requireRole('ADMIN'), adminController.getUsers);
apiRouter.put('/admin/users/:userId/role', authenticateToken, requireRole('ADMIN'), adminController.updateUserRole);
apiRouter.put('/admin/users/:userId/status', authenticateToken, requireRole('ADMIN'), adminController.toggleUserStatus);
apiRouter.get('/admin/organizers', authenticateToken, requireRole('ADMIN'), adminController.getOrganizers);
apiRouter.put('/admin/organizers/:userId', authenticateToken, requireRole('ADMIN'), adminController.verifyOrganizer);
apiRouter.get('/admin/audit-logs', authenticateToken, requireRole('ADMIN'), adminController.getAuditLogs);
apiRouter.post('/admin/slots', authenticateToken, requireApprovedOrganizer, adminController.assignSlot);
apiRouter.post('/admin/matches', authenticateToken, requireApprovedOrganizer, adminController.createMatch);

// Mount router on BOTH '/api' AND '/' to seamlessly handle stripped prefixes in serverless environments
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Start server only when running as a standalone process (not on Vercel Serverless)
if (!process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`[ICONIC ESPORTS API] Server running on port ${PORT}`);
    console.log(`[ICONIC ESPORTS API] Dedicated to Battlegrounds Mobile India`);
  });
}

export { app, server };
export default app;
