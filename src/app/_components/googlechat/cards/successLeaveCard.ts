export function successLeaveCard(appliedLeave: any) {
    
    console.log('success leave card triggered')
    
    const resp = {
        cardsV2: [{
            cardId: 'succesLeaveCard',
            card: {
                name: 'Leave Applied Successfully',
                header: {
                // title: 'Leave Request Sent'
                },
                sections: [
                {
                    header: 'Leave Request Sent',
                    collapsible: false,
                    uncollapsibleWidgetsCount: 1,
                    widgets: [
                    {
                        divider: {}
                    },
                    {
                        textParagraph: {
                            text: `Dear ${appliedLeave.User.name} your leave from ${appliedLeave.startDate} to ${appliedLeave.endDate} is sent successfully.`
                        }
                    }
                    ]
                }
                ]
            }
            }]
    }
    return resp
}