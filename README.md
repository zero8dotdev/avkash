# Avkash Contribution Guide

1. clone project `git clone git@github.com:zero8dotdev/avkash.git`
2. run `npm install`
   
## Supabase Setup Guide

### Step 1: Create a New Supabase Project

1. **Sign Up/Log In to Supabase**:
   - Go to [Supabase](https://supabase.io) and sign up for a new account or log in if you already have one.

2. **Create a New Project**:
   - After logging in, click on the "New Project" button on your dashboard.
   - Fill in the required details:
     - **Project Name**: Give your project a unique name.
     - **Organization**: Select the organization (if you have multiple).
     - **Database Password**: Set a strong password for your database.
     - **Region**: Choose a region closest to your users for better performance.

3. **Store Important Credentials**:
   - After the project is created, you'll be redirected to the project dashboard.
   - Copy and securely store the following:
     - **Anon Key**: This is your public API key.
     - **Project URL**: This is your Supabase project URL.
   - Click on Connect button and select ORM tab, Copy and securely store the **Database URL** and **Direct URL**.

### Step 2: Update the `.env.local` File

Create or update your `.env.local` file in your project root directory with the following entries:

```bash
NEXT_PUBLIC_SUPABASE_URL=<Your Project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Your Anon Key>
DATABASE_URL=<Your Database URL>
DIRECT_URL=<Your Direct URL>
```

Replace `<Your Project URL>`, `<Your Anon Key>`,`<Your Direct URL>` and `<Your Database URL>` with the values you copied in the previous step.

### Step 3: Push Prisma Schema to Supabase

1. **Prisma Setup**:
   Ensure you have a `prisma` directory with a `schema.prisma` file in your project root. This file defines your database schema using Prisma's syntax.

2. **Push the Schema**:
   Use the following command to push your Prisma schema to Supabase and create the corresponding tables:

   ```bash
   npx prisma db push
   ```

   This command reads your `schema.prisma` file and updates your Supabase database accordingly.

### Step 4: Create Triggers in Supabase

1. **Run the Script**:
   Use the following command to execute the `executefunc.js` script and create triggers in Supabase:

   ```bash
   npm run setup
   ```


Great! Here’s a step-by-step guide to install Ngrok using Apt, configure it with your authtoken, and deploy your app online with a static domain.


## Ngrok Setup Guide

### Step 1: Install Ngrok via Apt

1. **Open a Terminal**:
   - Open a terminal on your Linux machine.

2. **Run Installation Command**:
   - Execute the following command to install Ngrok. This command adds Ngrok's signing key and repository to your system and installs Ngrok.

   ```bash
   curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc \
       | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null \
       && echo "deb https://ngrok-agent.s3.amazonaws.com buster main" \
       | sudo tee /etc/apt/sources.list.d/ngrok.list \
       && sudo apt update \
       && sudo apt install ngrok
   ```

### Step 2: Add Your Authtoken

1. **Obtain Your Authtoken**:
   - Log in to your Ngrok account at [Ngrok](https://ngrok.com) and navigate to the "Auth" tab to find your authtoken.

2. **Add Authtoken to Ngrok Configuration**:
   - Run the following command to add your authtoken to Ngrok’s default configuration file. Replace `YOUR_AUTHTOKEN` with the authtoken you obtained from Ngrok.

   ```bash
   ngrok config add-authtoken YOUR_AUTHTOKEN
   ```

   Example:
   ```bash
   ngrok config add-authtoken 2diao5l4EQ74eGlCFjemsHc5OMX_2zFxgonSAGe5CLSyLsAQr
   ```

### Step 3: Deploy Your App Online with a Static Domain

1. **Start Your Local Server**:
   - Make sure your local server is running. For example, if you are running a web server on port 80, ensure it is active.

2. **Run Ngrok with Static Domain**:
   - Use the following command to start Ngrok with your static domain. Replace `your-static-domain.ngrok-free.app` with your reserved static domain.

   ```bash
   ngrok http --domain=your-static-domain.ngrok-free.app 80
   ```

   Example:
   ```bash
   ngrok http --domain=roaring-lions-group.ngrok-free.app 80
   ```

### Verify the Setup

1. **Access the Public URL**:
   - Open a web browser and navigate to `http://your-static-domain.ngrok-free.app`.
   - Your local server should be accessible through this public URL.


## Slack - Authentication Setup Guide

1. in supabase go to providers in authentication section. enable slack provider and update client id and client secret from env file. and copy call back url and add that in your slack app redirect urls.
2. and add your ngrok url also. example `http://your-static-domain.ngrok-free.app/login`

Sure, here's a detailed guide for setting up Slack authentication in Supabase and integrating it with a static Ngrok domain:

## Slack - Authentication Setup Guide

### Step 1: Enable Slack Provider in Supabase

1. **Access Supabase Dashboard**:
   - Go to your Supabase project dashboard.

2. **Navigate to Authentication Settings**:
   - In the sidebar, click on **Authentication**.

3. **Enable Slack Provider**:
   - Under the **Providers** section, find and enable the **Slack** provider.

4. **Add Client ID and Client Secret**:
   - In the Slack provider settings, you will need to add your Slack **Client ID** and **Client Secret**. These values should be stored in your environment file (`.env.local`).

### Step 2: Create a Slack App

1. **Create a Slack App**:
   - Go to the [Slack API](https://api.slack.com/) and create a new app.

2. **Set Up OAuth & Permissions**:
   - In your Slack app settings, navigate to **OAuth & Permissions**.
   - Under **Redirect URLs**, add the callback URL provided by Supabase. This URL will be displayed in the Slack provider settings in your Supabase dashboard. It typically looks like: `https://your-supabase-project.supabase.co/auth/v1/callback`.

3. **Add Ngrok URL**:
   - Also, add your Ngrok URL to the redirect URLs in your Slack app settings. For example: `http://your-static-domain.ngrok-free.app/login`.

4. **Save Changes**:
   - Save the changes to your Slack app settings.


## Final Setup Guide for Running the Project

### Prerequisites

1. **Ngrok Installed**: Ensure you have Ngrok installed and configured as described in the previous steps.
2. **Supabase Project**: Your Supabase project should have Slack authentication configured.
3. **Slack App**: Your Slack app should be set up with the appropriate redirect URLs.

### Step 1: Start Ngrok with Your Static Domain

1. **Open Terminal**:
   - Open a terminal window.

2. **Run Ngrok**:
   - Start Ngrok with your reserved static domain, pointing it to port 3000 (assuming your local server runs on port 3000).

   ```bash
   ngrok http --domain=your-static-domain.ngrok-free.app 3000
   ```

   Replace `your-static-domain.ngrok-free.app` with your actual static Ngrok domain.

### Step 2: Start Your Project

1. **Start Your Development Server**:
   - Start your project’s development server using:

   ```bash
   npm run dev
   ```

   This should start your server on port 3000, which Ngrok is exposing to the internet.

### Step 3: Verify Slack Authentication

1. **Open Web Browser**:
   - Open a web browser.

2. **Navigate to Your Ngrok URL**:
   - Go to `http://your-static-domain.ngrok-free.app/login` in your browser.

3. **Login via Slack**:
   - You should be redirected to Slack’s OAuth page.
   - Log in with your Slack credentials.
   - After successful authentication, you will be redirected back to your application, now authenticated via Slack.

### Troubleshooting Tips

- **Ngrok Connection**: Ensure Ngrok is running and connected. If you encounter issues, restart Ngrok with the same command.
- **Server Errors**: If your project’s server encounters errors, check the terminal output for logs and debug as needed.
- **Environment Variables**: Verify that all environment variables are correctly set in your `.env.local` file.
- **Redirect URLs**: Double-check that the redirect URLs in both your Supabase and Slack app configurations match the Ngrok URL.

### Conclusion

By following these steps, you will have successfully set up supabase and run your project with Slack authentication using a static Ngrok domain. This setup is ideal for development and testing purposes, allowing you to work with OAuth and webhooks in a local environment exposed to the internet.

Feel free to reach out if you encounter any issues or need further assistance. Enjoy your development!.