import { NextResponse } from "next/server";


export async function leaveCard() {
    try {
        console.log('Leave Request button clicked');
        
        const cardResponse = {
            action: {
                navigations: [
                    {
                        pushCard: {
                            header: {
                                title: "Leave Request Form"
                            },
                            sections: [
                                {
                                    header: 'Apply For Leaves',
                                    widgets: [
                                        {
                                            selectionInput: {
                                                name: 'leave_type',
                                                label: 'Select Leave Type',
                                                type: 'DROPDOWN',
                                                items: [
                                                    { text: 'Paid Leave', value: 'paid_leave' },
                                                    { text: 'Sick Leave', value: 'sick_leave' }
                                                ]
                                            }
                                        },
                                        {
                                            dateTimePicker: {
                                                name: 'start_date',
                                                label: 'Start Date',
                                                type: 'DATE_ONLY'
                                            }
                                        },
                                        {
                                            dateTimePicker: {
                                                name: 'end_date',
                                                label: 'End Date',
                                                type: 'DATE_ONLY'
                                            }
                                        },
                                        {
                                            textInput: {
                                                name: 'note',
                                                label: 'Note',
                                                type: 'MULTILINE'
                                            }
                                        },
                                        {
                                            buttonList: {
                                                buttons: [
                                                    {
                                                        text: "Submit",
                                                        onClick: {
                                                            action: {
                                                                function: "submitLeaveForm"
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        };

        console.log('Generated card response:', JSON.stringify(cardResponse));

        return new NextResponse(JSON.stringify(cardResponse), {
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'konda'
            },
            status: 200
        });
    } catch (error) {
        console.error('Error generating leave card:', error);
        return new NextResponse(JSON.stringify({ error: 'Failed to generate leave card' }), {
            headers: {
                'Content-Type': 'application/json'
            },
            status: 500
        });
    }
}
