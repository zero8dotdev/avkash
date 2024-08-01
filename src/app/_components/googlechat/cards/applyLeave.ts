export function getApplyLeaveCard(getDate: any,body:any) {
    return {
      cardsV2: [{
        cardId: 'applyPaidLeaveCard',
        card: {
          name: 'Apply Paid Leave Card',
          header: {
            title: 'Apply Paid Leave'
          },
          sections: [
            {
              header: 'Apply For Leaves',
              collapsible: false,
              uncollapsibleWidgetsCount: 1,
              widgets: [
                {
                  divider: {}
                },
                {
                  selectionInput: {
                    name: 'leaveType',
                    label: 'Select Leave Type',
                    type: 'DROPDOWN',
                    items: [
                      {
                        text: 'Paid Leave',
                        value: 'paidLeave',
                        selected: false
                      },
                      {
                        text: 'Sick Leave',
                        value: 'sickLeave',
                        selected: true
                      },
                      {
                        text: 'Leave A',
                        value: 'leaveA',
                        selected: false
                      }
                    ]
                  }
                },
                {
                  dateTimePicker: {
                    name: 'startDate',
                    label: 'Book your appointment at:',
                    type: 'DATE_ONLY',
                    valueMsEpoch: `${getDate}`
                  }
                },
                {
                  dateTimePicker: {
                    name: 'endDate',
                    label: 'Book your appointment at:',
                    type: 'DATE_ONLY',
                    valueMsEpoch: `${getDate}`
                  }
                },
                {
                    "selectionInput": {
                      "name": "dayType",
                      "label": "Select Day Type",
                      "type": "RADIO_BUTTON",
                      "items": [
                        {
                          "text": "Full Day",
                          "value": "fullDay",
                          "selected": true
                        },
                        {
                          "text": "Half DAy",
                          "value": "halfDay",
                          "selected": true
                        }
                      ]
                    }
                  },
                {
                    "selectionInput": {
                      "name": "selectShift",
                      "label": "Select Shift",
                      "type": "RADIO_BUTTON",
                      "items": [
                        {
                          "text": "NONE",
                          "value": "none",
                          "selected": true
                        },
                        {
                          "text": "Morning",
                          "value": "morning",
                          "selected": false
                        },
                        {
                          "text": "Afternoon",
                          "value": "afternoon",
                          "selected": false
                        }
                      ]
                    }
                  },
                {
                  textInput: {
                    name: 'note',
                    label: 'Note',
                    validation: {
                      inputType: 'TEXT'
                    }
                  }
                },
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "Submit Your Leave",
                        icon: {
                          knownIcon: "INVITE",
                          altText: "check calendar"
                        },
                        onClick: {
                          action: {
                            function: 'applyLeave'
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
      }]
    };
  }