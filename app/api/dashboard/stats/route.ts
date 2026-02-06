"use server";

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import { Listing, Client, FollowUp, User } from "@/models";
import { ClientType } from "@/models/client.model";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // 1. Extract role / userId from query params
    const role = request.nextUrl.searchParams.get("role") || "";
    const userId = request.nextUrl.searchParams.get("userId") || "";
    const isAdmin = role === "ADMIN" || role === "MANAGER";

    // Base filters scoped to the current user when not admin
    const listingFilter = isAdmin ? {} : { agent: userId };
    const clientFilter = isAdmin
      ? { archived: false }
      : {
          archived: false,
          $or: [{ assignedAgent: userId }, { createdBy: userId }],
        };
    const followUpFilter = isAdmin ? {} : { agent: userId };

    // 2. Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));

    // 3. Get all stats in parallel for better performance
    const [
      // Listings stats
      totalListings,
      activeListings,
      soldListings,
      listingsThisMonth,
      listingsLastMonth,

      // Clients stats
      totalClients,
      newClients,
      qualifiedClients,
      clientsThisMonth,
      clientsLastMonth,

      // Follow-ups stats
      pendingFollowUps,
      overdueFollowUps,
      todayFollowUps,
      completedFollowUpsThisMonth,

      // Revenue
      soldListingsForRevenue,

      // For charts
      allListings,
      allClients,
    ] = await Promise.all([
      // Listings
      Listing.countDocuments(listingFilter),
      Listing.countDocuments({ ...listingFilter, status: { $in: ["En Vente", "En Location"] } }),
      Listing.countDocuments({ ...listingFilter, status: { $in: ["Vendu", "Loué"] } }),
      Listing.countDocuments({ ...listingFilter, createdAt: { $gte: startOfMonth } }),
      Listing.countDocuments({
        ...listingFilter,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),

      // Clients
      Client.countDocuments(clientFilter),
      Client.countDocuments({
        ...clientFilter,
        qualificationStatus: "NEW",
      }),
      Client.countDocuments({
        ...clientFilter,
        qualificationStatus: "QUALIFIED",
      }),
      Client.countDocuments({
        ...clientFilter,
        createdAt: { $gte: startOfMonth },
      }),
      Client.countDocuments({
        ...clientFilter,
        createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),

      // Follow-ups
      FollowUp.countDocuments({ ...followUpFilter, status: "PENDING" }),
      FollowUp.countDocuments({ ...followUpFilter, status: "OVERDUE" }),
      FollowUp.countDocuments({
        ...followUpFilter,
        reminderAt: { $gte: startOfDay, $lte: endOfDay },
      }),
      FollowUp.countDocuments({
        ...followUpFilter,
        status: "DONE",
        updatedAt: { $gte: startOfMonth },
      }),

      // Revenue (always global for admin, scoped for agent)
      Listing.find({ ...listingFilter, status: { $in: ["Vendu", "Loué"] } })
        .select("price status updatedAt")
        .lean(),

      // For charts
      Listing.find(listingFilter).select("propertyType status price createdAt").lean(),
      Client.find(clientFilter)
        .select("qualificationStatus type createdAt")
        .lean(),
    ]);

    // 4. Calculate revenue
    const totalRevenue = soldListingsForRevenue.reduce(
      (sum, listing) => sum + (listing.price || 0),
      0
    );

    const monthlyRevenue = soldListingsForRevenue
      .filter((l) => new Date(l.updatedAt) >= startOfMonth)
      .reduce((sum, listing) => sum + (listing.price || 0), 0);

    // 5. Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const listingsChange = calculateChange(
      listingsThisMonth,
      listingsLastMonth
    );
    const clientsChange = calculateChange(clientsThisMonth, clientsLastMonth);

    // 6. Get agent performance (admin/manager only)
    let agentPerformance: Array<{
      agent: { _id: string; name: string; profileImage?: string; role: string };
      listingsCount: number;
      clientsCount: number;
      followUpsCount: number;
      salesCount: number;
    }> = [];

    if (isAdmin) {
      const agents = (await User.find({
        role: { $in: ["AGENT", "MANAGER", "ADMIN"] },
      }).select("name email profileImage role")) as User[];

      agentPerformance = await Promise.all(
        agents.map(async (agent) => {
          const [listingsCount, clientsCount, followUpsCount, salesCount] =
            await Promise.all([
              Listing.countDocuments({ agent: agent._id }),
              Client.countDocuments({ assignedAgent: agent._id }),
              FollowUp.countDocuments({ agent: agent._id }),
              Listing.countDocuments({
                agent: agent._id,
                status: { $in: ["Vendu", "Loué"] },
              }),
            ]);

          return {
            agent: {
              _id: agent._id.toString(),
              name: agent.name,
              profileImage: agent.profileImage,
              role: agent.role,
            },
            listingsCount,
            clientsCount,
            followUpsCount,
            salesCount,
          };
        })
      );
    }

    // 6.5 Get today's events for agent dashboard
    interface TodayEvent {
      _id: string;
      type: string;
      reminderAt: Date;
      client?: { firstName: string; lastName: string };
      listing?: { title: string };
    }

    const todayEvents = (await FollowUp.find({
      ...followUpFilter,
      reminderAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("client", "firstName lastName")
      .populate("listing", "title")
      .sort({ reminderAt: 1 })
      .lean()) as unknown as TodayEvent[];

    const formattedTodayEvents = todayEvents.map((event) => ({
      id: event._id.toString(),
      title:
        event.listing?.title ||
        (event.client
          ? `${event.client.firstName} ${event.client.lastName}`
          : event.type),
      time: new Date(event.reminderAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: event.type === "VISIT" ? "visit" : "followup",
      clientName: event.client
        ? `${event.client.firstName} ${event.client.lastName}`
        : undefined,
    }));

    // 6.6 Get completed today count
    const completedToday = await FollowUp.countDocuments({
      ...followUpFilter,
      status: "DONE",
      updatedAt: { $gte: startOfDay, $lte: endOfDay },
    });

    // 7. Get recent activities (scoped by role)
    const [recentListings, recentClients, recentFollowUps, recentSales] =
      await Promise.all([
        Listing.find(listingFilter)
          .sort({ createdAt: -1 })
          .limit(3)
          .populate("agent", "name profileImage")
          .lean(),
        Client.find(clientFilter)
          .sort({ createdAt: -1 })
          .limit(3)
          .populate("createdBy", "name profileImage")
          .lean(),
        FollowUp.find(followUpFilter)
          .sort({ createdAt: -1 })
          .limit(3)
          .populate("agent", "name profileImage")
          .populate("client", "firstName lastName")
          .lean(),
        Listing.find({ ...listingFilter, status: { $in: ["Vendu", "Loué"] } })
          .sort({ updatedAt: -1 })
          .limit(3)
          .populate("agent", "name profileImage")
          .lean(),
      ]);

    const recentActivities = [
      ...recentListings.map((l) => ({
        type: "listing" as const,
        title: "Nouvelle annonce ajoutée",
        description: l.title || `${l.propertyType} à ${l.location.city}`,
        timestamp: l.createdAt,
        user: {
          name: l.agent?.name || "Agent",
          profileImage: l.agent?.profileImage,
        },
      })),
      ...recentClients.map((c) => ({
        type: "client" as const,
        title: "Nouveau client",
        description: `${c.firstName} ${c.lastName} - ${c.type}`,
        timestamp: c.createdAt,
        user: {
          name: c.createdBy?.name || "Agent",
          profileImage: c.createdBy?.profileImage,
        },
      })),
      ...recentFollowUps.map((f) => ({
        type: "followup" as const,
        title: "Suivi créé",
        description: f.client
          ? `${f.client.firstName} ${f.client.lastName} - ${f.type}`
          : `Suivi ${f.type}`,
        timestamp: f.createdAt,
        user: {
          name: f.agent?.name || "Agent",
          profileImage: f.agent?.profileImage,
        },
      })),
      ...recentSales.map((s) => ({
        type: "sale" as const,
        title: "Vente réalisée",
        description: s.title || `${s.propertyType} à ${s.location.city}`,
        timestamp: s.updatedAt,
        user: {
          name: s.agent?.name || "Agent",
          profileImage: s.agent?.profileImage,
        },
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10);

    // 8. Prepare chart data

    // Sales trend (last 6 months)
    const salesData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const sales = soldListingsForRevenue.filter((l) => {
        const updatedAt = new Date(l.updatedAt);
        return updatedAt >= date && updatedAt < nextMonth;
      });

      salesData.push({
        month: date.toLocaleDateString("fr-FR", { month: "short" }),
        sales: sales.length,
        revenue: sales.reduce((sum, s) => sum + (s.price || 0), 0) / 1000000, // Convert to millions
      });
    }
    type PropertyType =
      | "Appartement"
      | "Maison"
      | "Villa"
      | "Studio"
      | "Terrain"
      | "Commercial";

    // Listings by property type
    type PropertyTypeWithOther = PropertyType | "Autre";

    const listingsByType = allListings.reduce<
      Partial<Record<PropertyTypeWithOther, number>>
    >((acc, listing) => {
      const type: PropertyTypeWithOther = listing.propertyType ?? "Autre";

      acc[type] = (acc[type] ?? 0) + 1;
      return acc;
    }, {});

    const propertyTypeData = Object.entries(listingsByType).map(
      ([type, count]) => ({
        type,
        count,
      })
    );

    // Clients by status
    type ClientStatusSafe = ClientType | "NEW";

    const clientsByStatus = allClients.reduce<
      Partial<Record<ClientStatusSafe, number>>
    >((acc, client) => {
      const status: ClientStatusSafe = client.qualificationStatus ?? "NEW";

      acc[status] = (acc[status] ?? 0) + 1;
      return acc;
    }, {});

    const clientStatusData = Object.entries(clientsByStatus).map(
      ([status, count]) => ({
        status,
        count,
      })
    );

    // 9. Return response
    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalListings,
          activeListings,
          soldListings,
          totalClients,
          newClients,
          qualifiedClients,
          pendingFollowUps,
          overdueFollowUps,
          todayFollowUps,
          totalRevenue,
          monthlyRevenue,
          completedFollowUpsThisMonth,
          listingsChange,
          clientsChange,
        },
        // Agent-specific stats
        agentStats: {
          myClients: totalClients,
          myListings: totalListings,
          myFollowUps: pendingFollowUps,
          completedToday,
          pendingToday: todayFollowUps,
        },
        todayEvents: formattedTodayEvents,
        agentPerformance,
        recentActivities,
        charts: {
          salesData,
          propertyTypeData,
          clientStatusData,
        },
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { message: "Erreur lors du chargement des statistiques" },
      },
      { status: 500 }
    );
  }
}
