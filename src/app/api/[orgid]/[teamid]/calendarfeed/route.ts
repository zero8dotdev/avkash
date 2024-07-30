import { NextRequest, NextResponse } from "next/server";
import { getLeaves, getUserRole, getUserVisibility } from "../../../../_actions/index";

async function fetchLeaves(orgId:any, teamId:any, userId:any, role:any, visibility:any) {
  try {
    const targetId =
      role === "OWNER" && visibility === "ORG" ||
      (role === "MANAGER" && visibility === "ORG") ||
      (role === "USER" && visibility === "ORG")
        ? orgId
        : (role === "MANAGER" &&
            (visibility === "TEAM" || visibility === "SELF")) ||
          (role === "MANAGER" && role === "USER" || visibility === "TEAM")
        ? teamId
        : (visibility === "SELF" && role === "USER") ? userId: null;
console.log("targetId", targetId)
        if (targetId !== null) {
      const leaves = await getLeaves(
        targetId === orgId
          ? "orgId"
          : targetId === teamId
          ? "teamId"
          : "userId",
        targetId
      );
      return leaves;
    } else {
      throw new Error("Invalid credentials passed");
    }
  } catch (error) {
    console.error("Error fetching leaves:", error);
    throw error;
  }
}

function generateICS(leaves:any) {
  const icsLines = ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//Avkash//EN`];

  leaves.forEach((leave:any) => {
    icsLines.push(
      "BEGIN:VEVENT",
      `UID:${leave.leaveId}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${new Date(leave.startDate)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]}Z`,
      `DTEND:${new Date(leave.endDate)
        .toISOString()
        .replace(/[-:]/g, "")
        .split(".")[0]}Z`,
      `SUMMARY:${leave.leaveType}`,
      `DESCRIPTION:${leave.reason || ""}`,
      "END:VEVENT"
    );
  });

  icsLines.push("END:VCALENDAR");
  return icsLines.join("\r\n");
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = new URLSearchParams(url.search);
    const params = req.nextUrl.pathname.split("/");
    const orgId = params[2];
    const teamId = params[3];
    const userId = searchParams.get("userId");
    const role = await  getUserRole (userId)
    const visibility = await getUserVisibility(orgId)

    const leaves = await fetchLeaves(orgId, teamId, userId, role, visibility);
    const icsContent = generateICS(leaves);
    return new NextResponse(icsContent, {
      headers: { "Content-Type": "text/plain;charset=utf-8" },
    });
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
