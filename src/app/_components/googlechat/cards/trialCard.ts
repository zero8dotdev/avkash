export function trialCard() {
    const resp = {
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
                        textParagraph: {
                          text: "See <a href=https://developers.google.com/apps-script/add-ons/concepts/widgets#text_formatting>this doc</a> for rich text formatting"
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