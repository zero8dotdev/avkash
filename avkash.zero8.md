avkash.zero8.dev

- Landing Page [Login, Sign Up]
  // check if user is logged in or not
  // YES -> redirect him to dashboard
  // NO - do nothing
- Login
  If user click on login, And he has no account with avkash
  // YES, [User has an account with Avkash] -> redirect him to the dashboard
  // If the user is OWNER and and account setup is not completed, Bring back user to complete the user setup
  // NO, Redirect him to signup page
- Signup Page
  Ask user details, like name, company name, team name
  On click of button, And if everything goes as planned, Redirect him to initial setup
  [Create Org, Create Team, Create User, ]

// Findings
ORG table should have unique constraint [maybe company name] for eg, hello@zero8.dev, zero8.dev is the company name
TEAM should also have a unique constraint based on team name, two team names can not be same in one org
