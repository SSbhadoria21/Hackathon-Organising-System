import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import { Hackathon } from "@/models/Hackathon";
import { Team } from "@/models/Team";
import { requireAuth } from "@/lib/withAuth";
import { successResponse, errorResponse } from "@/utils/ApiResponse";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return errorResponse("Invalid hackathon ID", 400);
    await dbConnect();
    const auth = requireAuth(req);
    if (auth instanceof Response) return auth;
    const hackathon = await Hackathon.findById(id).lean();
    if (!hackathon) return errorResponse("Hackathon not found", 404);
    const team = await Team.findOne({ hackathonId: id, members: auth._id });
    if (!team) return errorResponse("Not registered", 403);
    if ((team as any).paymentStatus === "PAID") return successResponse({ team }, "Already paid");
    (team as any).paymentStatus = "PAID";
    (team as any).paymentTransactionId = "DEMO_TXN_" + Date.now();
    (team as any).paidAt = new Date();
    await (team as any).save();
    return successResponse({ team: { _id: (team as any)._id, paymentStatus: "PAID" } }, "Payment completed");
  } catch (err: any) {
    console.error("Payment complete error:", err);
    return errorResponse("Failed to complete payment", 500);
  }
}