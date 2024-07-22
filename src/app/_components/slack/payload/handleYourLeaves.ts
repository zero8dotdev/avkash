import { NextResponse } from "next/server";

export default function handleYourLeaves() {
    console.log('hi from your leaves');
    return new NextResponse('User leaves sent', { status: 200 });

}