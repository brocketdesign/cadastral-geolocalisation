import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../lib/mongodb.js';

/**
 * GET /api/vibedash/users
 *
 * VibeDash integration endpoint. Returns rich application data for
 * the VibeDash AI dashboard generator.
 *
 * Auth: Authorization: Bearer <VIBEDASH_TOKEN>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Bearer token auth
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');
  if (!token || token !== process.env.VIBEDASH_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { db } = await connectToDatabase();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    const monthAgo = new Date(Date.now() - 30 * 86_400_000);
    const monthAgoMs = monthAgo.getTime();

    // ── User counts ───────────────────────────────────────────────────────────
    const [allUsers, newToday, newThisWeek, newThisMonth] = await Promise.all([
      db.collection('user_plans').find({}).toArray(),
      db.collection('user_plans').countDocuments({ createdAt: { $gte: todayStart.getTime() } }),
      db.collection('user_plans').countDocuments({ createdAt: { $gte: weekAgo.getTime() } }),
      db.collection('user_plans').countDocuments({ createdAt: { $gte: monthAgoMs } }),
    ]);

    const totalUsers = allUsers.length;
    const premiumUsers = allUsers.filter((u) => u.plan && u.plan !== 'free').length;
    const proUsers = allUsers.filter((u) => u.plan === 'pro').length;
    const enterpriseUsers = allUsers.filter((u) => u.plan === 'enterprise').length;

    // ── App-specific aggregates ───────────────────────────────────────────────
    const [
      totalSearches,
      totalFavorites,
      totalRiskAnalyses,
      totalClients,
      totalAgencies,
      recentSearches,
      recentRiskAnalyses,
    ] = await Promise.all([
      db.collection('history').countDocuments({}),
      db.collection('history').countDocuments({ isFavorite: true }),
      db.collection('risk_analyses').countDocuments({}),
      db.collection('clients').countDocuments({}),
      db.collection('agencies').countDocuments({}),
      db.collection('history')
        .find({ timestamp: { $gte: monthAgoMs } })
        .project({ timestamp: 1 })
        .toArray(),
      db.collection('risk_analyses')
        .find({ createdAt: { $gte: monthAgoMs } })
        .project({ createdAt: 1 })
        .toArray(),
    ]);

    // ── Chart: searches per day (last 30 days) ────────────────────────────────
    const searchesByDay: Record<string, number> = {};
    for (const item of recentSearches) {
      const date = new Date(item.timestamp).toISOString().slice(0, 10);
      searchesByDay[date] = (searchesByDay[date] ?? 0) + 1;
    }
    const searchesPerDay = Object.entries(searchesByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Chart: risk analyses per day (last 30 days) ───────────────────────────
    const riskByDay: Record<string, number> = {};
    for (const item of recentRiskAnalyses) {
      const date = new Date(item.createdAt).toISOString().slice(0, 10);
      riskByDay[date] = (riskByDay[date] ?? 0) + 1;
    }
    const riskAnalysesPerDay = Object.entries(riskByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Chart: user growth per day (last 30 days) ─────────────────────────────
    const growthByDay: Record<string, number> = {};
    for (const u of allUsers) {
      if (u.createdAt && u.createdAt >= monthAgoMs) {
        const date = new Date(u.createdAt).toISOString().slice(0, 10);
        growthByDay[date] = (growthByDay[date] ?? 0) + 1;
      }
    }
    const userGrowth = Object.entries(growthByDay)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // ── Chart: plan breakdown ─────────────────────────────────────────────────
    const planBreakdown = [
      { plan: 'free', count: totalUsers - premiumUsers },
      { plan: 'pro', count: proUsers },
      { plan: 'enterprise', count: enterpriseUsers },
    ].filter((p) => p.count > 0);

    // ── Users table ───────────────────────────────────────────────────────────
    const users = allUsers
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .slice(0, 100)
      .map((u) => ({
        id: u.clerkUserId ?? String(u._id),
        plan: u.plan ?? 'free',
        createdAt: u.createdAt
          ? new Date(u.createdAt).toISOString()
          : new Date(0).toISOString(),
        isAdmin: u.isAdmin === true,
        updatedAt: u.updatedAt
          ? new Date(u.updatedAt).toISOString()
          : undefined,
      }));

    return res.status(200).json({
      meta: {
        projectName: 'Cadastral Géolocalisation',
        fetchedAt: new Date().toISOString(),
      },
      summary: {
        totalUsers,
        premiumUsers,
        newUsersToday: newToday,
        newUsersThisWeek: newThisWeek,
        newUsersThisMonth: newThisMonth,
      },
      metrics: {
        proUsers,
        enterpriseUsers,
        conversionRatePercent:
          totalUsers > 0
            ? parseFloat(((premiumUsers / totalUsers) * 100).toFixed(1))
            : 0,
        totalParcelSearches: totalSearches,
        totalFavorites,
        totalRiskAnalyses,
        avgSearchesPerUser:
          totalUsers > 0 ? parseFloat((totalSearches / totalUsers).toFixed(1)) : 0,
        totalClients,
        totalAgencies,
      },
      charts: {
        userGrowth,
        planBreakdown,
        searchesPerDay,
        riskAnalysesPerDay,
      },
      users,
    });
  } catch (error) {
    console.error('VibeDash users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
