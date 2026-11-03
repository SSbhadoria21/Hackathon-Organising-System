import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Hackathon } from "@/models/Hackathon";
import { Submission } from "@/models/Submission";
import { Judge } from "@/models/Judge";
import { User } from "@/models/User";
import { requireAuth } from "@/lib/withAuth";
import { successResponse, errorResponse } from "@/utils/ApiResponse";

/**
 * GET /hackathons/:id/submissions/all
 * Returns all submissions across all rounds for a hackathon (organizer, admin, or judge).
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
      return errorResponse("Only organizers and judges can view all submissions", 403);
    }

    const submissions = await Submission.find({ hackathonId: hackathon._id })
      .populate("teamId", "name leaderId members")
      .populate("roundId", "roundName roundNumber roundType criterias isOnline offlineVenue")
      .sort({ createdAt: -1 })
      .lean();

    return successResponse({ submissions }, "Submissions fetched");
  } catch (err: any) {
    console.error("All submissions error:", err);
    return errorResponse("Failed to fetch submissions", 500);
  }
}