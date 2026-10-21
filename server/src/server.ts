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

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    platform: 'ICONIC ESPORTS',
    game: 'BATTLEGROUNDS MOBILE INDIA',
    timestamp: new Date().toISOString()
  });
});

// Authentication & Profile Routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.post('/api/auth/logout', authController.logout);
app.get('/api/auth/me', authenticateToken, authController.getMe);
app.put('/api/auth/profile', authenticateToken, authController.updateProfile);

// Tournament Routes
app.get('/api/tournaments', tournamentController.getTournaments);
app.get('/api/tournaments/:slug', tournamentController.getTournamentBySlug);
app.post('/api/tournaments', authenticateToken, requireApprovedOrganizer, tournamentController.createTournament);
app.put('/api/tournaments/:id', authenticateToken, requireApprovedOrganizer, tournamentController.updateTournament);
app.post('/api/tournaments/:tournamentId/register', authenticateToken, tournamentController.registerTeam);
app.post('/api/tournaments/:tournamentId/claim-slot', authenticateToken, tournamentController.claimSlot);
app.get('/api/tournaments/:tournamentId/registrations', tournamentController.getRegistrations);
app.put('/api/tournaments/registrations/:registrationId', authenticateToken, requireApprovedOrganizer, tournamentController.updateRegistrationStatus);
app.post('/api/tournaments/:tournamentId/advance-stage', authenticateToken, requireApprovedOrganizer, tournamentController.advanceStage);

// Match & Room Routes
app.get('/api/tournaments/:tournamentId/matches', matchController.getMatches);
app.post('/api/tournaments/:tournamentId/matches', authenticateToken, requireApprovedOrganizer, matchController.createMatch);
app.get('/api/matches/:matchId', matchController.getMatchDetails);
app.get('/api/matches/:matchId/credentials', authenticateToken, matchController.getRoomCredentials);
app.put('/api/matches/:matchId/credentials', authenticateToken, requireApprovedOrganizer, matchController.updateRoomCredentials);
app.post('/api/matches/:matchId/results', authenticateToken, requireApprovedOrganizer, matchController.submitMatchResults);
app.put('/api/matches/:matchId/review', authenticateToken, requireApprovedOrganizer, matchController.reviewMatchResults);

// Standings & Leaderboard Routes
app.get('/api/tournaments/:tournamentId/standings', standingsController.getTournamentStandings);
app.get('/api/tournaments/:tournamentId/mvp-leaderboard', standingsController.getTournamentMvpLeaderboard);

// Team Routes
app.get('/api/teams', teamController.getTeams);
app.get('/api/teams/:id', teamController.getTeamById);
app.post('/api/teams', authenticateToken, teamController.createTeam);
app.post('/api/teams/:teamId/members', authenticateToken, teamController.addMember);
app.delete('/api/teams/:teamId/members/:playerId', authenticateToken, teamController.removeMember);

// Player Routes
app.get('/api/players', playerController.getPlayers);
app.get('/api/players/:id', playerController.getPlayerById);
app.put('/api/players', authenticateToken, playerController.updatePlayer);
app.get('/api/player/dashboard', authenticateToken, playerController.getPlayerDashboardData);
app.post('/api/player/apply-organizer', authenticateToken, playerController.applyForOrganizer);

// Announcement Routes
app.get('/api/announcements', announcementController.getAnnouncements);
app.post('/api/announcements', authenticateToken, requireApprovedOrganizer, announcementController.createAnnouncement);
app.delete('/api/announcements/:id', authenticateToken, requireApprovedOrganizer, announcementController.deleteAnnouncement);

// Admin Routes
app.get('/api/admin/stats', authenticateToken, requireRole('ADMIN'), adminController.getAdminStats);
app.get('/api/admin/users', authenticateToken, requireRole('ADMIN'), adminController.getUsers);
app.put('/api/admin/users/:userId/role', authenticateToken, requireRole('ADMIN'), adminController.updateUserRole);
app.put('/api/admin/users/:userId/status', authenticateToken, requireRole('ADMIN'), adminController.toggleUserStatus);
app.get('/api/admin/organizers', authenticateToken, requireRole('ADMIN'), adminController.getOrganizers);
app.put('/api/admin/organizers/:userId', authenticateToken, requireRole('ADMIN'), adminController.verifyOrganizer);
app.get('/api/admin/audit-logs', authenticateToken, requireRole('ADMIN'), adminController.getAuditLogs);
app.post('/api/admin/slots', authenticateToken, requireApprovedOrganizer, adminController.assignSlot);
app.post('/api/admin/matches', authenticateToken, requireApprovedOrganizer, adminController.createMatch);

// Start server
server.listen(PORT, () => {
  console.log(`[ICONIC ESPORTS API] Server running on port ${PORT}`);
  console.log(`[ICONIC ESPORTS API] Dedicated to Battlegrounds Mobile India`);
});
