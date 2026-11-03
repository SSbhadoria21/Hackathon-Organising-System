import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Hackathon } from "@/models/Hackathon";
import { Team } from "@/models/Team";
import { Judge } from "@/models/Judge";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/withAuth";
import { successResponse, errorResponse } from "@/utils/ApiResponse";

/**
 * GET /hackathons/:id/manage/teams
 * Returns all registered teams with member details for organizers and judges.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const hackathon = await Hackathon.findOne(query).select("organizerId").lean();
    if (!hackathon) return errorResponse("Hackathon not found", 404);

    const isOrganizer = (hackathon as any).organizerId?.toString() === auth._id?.toString();
    const isSuperAdmin = auth.role === "SUPER_ADMIN";

    const user = await User.findById(auth._id).select("email").lean();
    const userEmail = user?.email?.toLowerCase();

    const isJudge = Boolean(
      await Judge.findOne({
        hackathonId: hackathon._id,
        status: "ACCEPTED",
        $or: [
          { userId: auth._id },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      }).lean()
    );

    if (!isOrganizer && !isSuperAdmin && !isJudge) {
      return errorResponse("Only organizers and judges can view teams", 403);
    }

    const teams = await Team.find({ hackathonId: hackathon._id })
      .populate("members", "fullName username email")
      .populate("leaderId", "fullName username email")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ teams }, "Teams fetched");
  } catch (err: any) {
    console.error("Manage teams error:", err);
    return errorResponse("Failed to fetch teams", 500);
  }
}